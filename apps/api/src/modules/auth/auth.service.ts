// 003-auth-authorization (T026, T052-T054, T059-T060). Business rules only — no `req`/`reply`.
// `refresh()` already implements reuse detection (US3) inline with rotation rather than as a
// bolted-on branch: research R10's atomic conditional update in `auth.repository.rotate` makes
// "rotated" and "reused" two outcomes of the SAME operation, not two separate code paths that
// could drift out of sync with each other.
import { randomUUID } from "node:crypto";
import { AppError } from "../../plugins/errors.ts";
import { generateRefreshToken, hashRefreshToken, verifyPassword } from "../../lib/hash.ts";
import { signAccessToken } from "../../lib/jwt.ts";
import type { AuthRepository } from "./auth.repository.ts";
import type { UsersService } from "../users/users.service.ts";
import type { ProfileResponse } from "../users/users.schema.ts";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (FR-005)

export interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

export interface IssuedTokens {
  user: ProfileResponse;
  accessToken: string;
  refreshToken: string;
}

export interface AuthServiceDeps {
  authRepository: AuthRepository;
  usersService: UsersService;
  jwtAccessSecret: string;
}

// `exactOptionalPropertyTypes` (tsconfig base): `RequestMeta.userAgent?: string` forbids
// assigning it `undefined` explicitly — the key must be absent, not present-but-undefined. This
// converts a possibly-undefined-valued `RequestMeta` into an object literal that only carries
// the keys that actually have a value, safe to spread into `NewRefreshToken`/`RotatedTokenInput`.
function metaFields(meta: RequestMeta): { userAgent?: string; ip?: string } {
  const fields: { userAgent?: string; ip?: string } = {};
  if (meta.userAgent !== undefined) fields.userAgent = meta.userAgent;
  if (meta.ip !== undefined) fields.ip = meta.ip;
  return fields;
}

export function createAuthService(deps: AuthServiceDeps) {
  async function issueSession(
    user: { id: string; role: string },
    meta: RequestMeta,
    familyId: string = randomUUID(),
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = signAccessToken(deps.jwtAccessSecret, { sub: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    await deps.authRepository.create(user.id, {
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      ...metaFields(meta),
    });
    return { accessToken, refreshToken };
  }

  return {
    async login(email: string, password: string, meta: RequestMeta): Promise<IssuedTokens> {
      const user = await deps.usersService.findByEmailForAuth(email);
      // Same code for "no such account" and "wrong password" — never confirm which one it was.
      if (!user) throw new AppError("AUTH_INVALID_CREDENTIALS", 401, "Invalid email or password");
      if (!user.isActive || user.deletedAt) {
        throw new AppError("AUTH_ACCOUNT_INACTIVE", 401, "Account is inactive");
      }
      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) throw new AppError("AUTH_INVALID_CREDENTIALS", 401, "Invalid email or password");

      await deps.usersService.recordLogin(user.id);
      const tokens = await issueSession(user, meta);
      const profile = deps.usersService.toProfileResponse({ ...user, lastLoginAt: new Date() });
      return { ...tokens, user: profile };
    },

    /** US4/T059-T061: identical token-issuance path to login — a fresh account gets a session
     *  exactly like a returning one does. */
    async issueSessionForNewAccount(user: { id: string; role: string }, meta: RequestMeta) {
      return issueSession(user, meta);
    },

    async refresh(presentedToken: string, meta: RequestMeta): Promise<{ accessToken: string; refreshToken: string }> {
      const oldHash = hashRefreshToken(presentedToken);
      const newTokenValue = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newTokenValue);

      const result = await deps.authRepository.rotate(oldHash, {
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        ...metaFields(meta),
      });

      if (result.outcome === "reuse") {
        await deps.authRepository.revokeFamily(result.familyId);
        throw new AppError(
          "AUTH_REFRESH_REUSE_DETECTED",
          401,
          "This refresh token was already used — every session in its family has been signed out",
        );
      }
      if (result.outcome === "expired") throw new AppError("AUTH_TOKEN_EXPIRED", 401, "Refresh token has expired");
      if (result.outcome === "invalid") throw new AppError("AUTH_TOKEN_INVALID", 401, "Refresh token is invalid");

      const accessToken = signAccessToken(deps.jwtAccessSecret, {
        sub: result.token.userId,
        role: await deps.usersService.roleOf(result.token.userId),
      });
      return { accessToken, refreshToken: newTokenValue };
    },

    async logout(presentedToken: string): Promise<void> {
      await deps.authRepository.revoke(hashRefreshToken(presentedToken));
    },

    /** US4/T060: password-change-revokes-other-sessions when a refresh token IS in scope (a
     *  mobile client that carries one alongside its access token, say). `keepToken` is the
     *  refresh token of the session that MADE the change — its family survives; every other
     *  family for this user is revoked. */
    async revokeOtherSessions(userId: string, keepToken: string): Promise<void> {
      const keepHash = hashRefreshToken(keepToken);
      const keepRow = await deps.authRepository.findByTokenHash(keepHash);
      if (!keepRow) return; // nothing to anchor "other" against — nothing to do
      await deps.authRepository.revokeAllExceptFamily(userId, keepRow.familyId);
    },

    /** US4/T062: `PATCH /me` has no refresh token in scope at all (access-token-authenticated) —
     *  revokes every session unconditionally. See auth.repository.ts's `revokeAllForUser`. */
    async revokeAllSessions(userId: string): Promise<void> {
      await deps.authRepository.revokeAllForUser(userId);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
