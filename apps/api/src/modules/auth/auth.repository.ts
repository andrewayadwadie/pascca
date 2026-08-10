// 003-auth-authorization (T021, Art 7, research R10). Prisma only — no business rules (no
// password/JWT logic; `auth.service.ts` owns that). `rotate` is the one method worth real
// comment: it's an interactive transaction wrapping a conditional `UPDATE ... WHERE tokenHash =
// ? AND "revokedAt" IS NULL`, which Postgres serializes correctly under ordinary row-level
// locking — the second of two concurrent callers targeting the same row always sees 0 rows
// affected, and by the time it re-reads the row to classify *why*, the winner's write has
// already committed, so the loser reliably observes `revokedAt` + `replacedByTokenHash` set and
// is classified as reuse. No advisory lock needed (unlike Article 25's seat-overlap, which sums
// across many rows) — a single row's own state transition is exactly what row locking already
// serializes.
import type { PrismaClient, RefreshToken } from "@prisma/client";

export interface NewRefreshToken {
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}

/** What `rotate` needs from the caller — no `familyId`, because a rotated token always inherits
 *  the family of the token it replaces; the caller cannot (and must not be able to) choose it. */
export type RotatedTokenInput = Omit<NewRefreshToken, "familyId">;

export type RotateResult =
  | { outcome: "rotated"; token: RefreshToken }
  | { outcome: "reuse"; familyId: string }
  | { outcome: "expired" }
  | { outcome: "invalid" };

export function createAuthRepository(prisma: PrismaClient) {
  return {
    create(userId: string, data: NewRefreshToken): Promise<RefreshToken> {
      return prisma.refreshToken.create({ data: { userId, ...data } });
    },

    findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
      return prisma.refreshToken.findUnique({ where: { tokenHash } });
    },

    /** Logout (US1) and password-change-revokes-other-sessions (US4) both revoke a single row
     *  directly — `replacedByTokenHash` stays null, which is exactly what distinguishes a direct
     *  revocation from a rotation when `rotate` later classifies a reuse attempt. */
    async revoke(tokenHash: string): Promise<void> {
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    async rotate(oldTokenHash: string, newToken: RotatedTokenInput): Promise<RotateResult> {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.refreshToken.findUnique({ where: { tokenHash: oldTokenHash } });

        if (!existing) return { outcome: "invalid" as const };
        if (existing.revokedAt) {
          return existing.replacedByTokenHash
            ? { outcome: "reuse" as const, familyId: existing.familyId }
            : { outcome: "invalid" as const }; // revoked directly (logout/password-change), not rotated
        }
        if (existing.expiresAt < new Date()) return { outcome: "expired" as const };

        // Still valid as of our read — attempt the atomic conditional update. A concurrent
        // rotation of the SAME row between our read and this write is exactly the race research
        // R10 accounts for: whoever's UPDATE commits first wins; the loser's `count` comes back
        // 0 and it re-reads to find the winner's write already committed.
        const result = await tx.refreshToken.updateMany({
          where: { tokenHash: oldTokenHash, revokedAt: null },
          data: { revokedAt: new Date(), replacedByTokenHash: newToken.tokenHash },
        });

        if (result.count === 0) {
          const afterRace = await tx.refreshToken.findUnique({ where: { tokenHash: oldTokenHash } });
          if (afterRace?.revokedAt && afterRace.replacedByTokenHash) {
            return { outcome: "reuse" as const, familyId: afterRace.familyId };
          }
          return { outcome: "invalid" as const };
        }

        const token = await tx.refreshToken.create({
          data: { userId: existing.userId, familyId: existing.familyId, ...newToken },
        });
        return { outcome: "rotated" as const, token };
      });
    },

    /** US3/T053: revokes every token sharing `familyId` that isn't already revoked — the
     *  theft-containment response to a detected reuse. */
    async revokeFamily(familyId: string): Promise<void> {
      await prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    /** US4/T060: password-change-revokes-other-sessions — every OTHER active token for this
     *  user, keeping only the session that made the change. */
    async revokeAllExceptFamily(userId: string, keepFamilyId: string): Promise<void> {
      await prisma.refreshToken.updateMany({
        where: { userId, familyId: { not: keepFamilyId }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    /** US4/T062: `PATCH /me` is access-token-authenticated — there is no refresh token in scope
     *  to anchor "except this one" against, so a password change from that route revokes every
     *  session unconditionally (the route's own already-valid access token survives until its
     *  15-minute expiry regardless, per FR-004's live isActive/deletedAt re-check being the only
     *  thing that can end it early). */
    async revokeAllForUser(userId: string): Promise<void> {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
