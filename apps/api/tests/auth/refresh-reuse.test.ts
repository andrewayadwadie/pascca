// 003-auth-authorization — US3 (T050-T051): refresh-token reuse detection revokes the whole
// session family (SC-003, Article 30 "Auth" row).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/app.ts";
import { disconnect, prisma, resetDatabase } from "../helpers/db.ts";
import { hashPassword } from "../../src/lib/hash.ts";

const PASSWORD = "correct horse battery staple 1";

let app: FastifyInstance;
// Seeded from the current time, not a fixed 1-based counter: the rate-limit budget these tests
// occasionally brush against is Redis-backed and OUTLIVES a single test run (unlike Postgres,
// which resetDatabase() clears) — re-running this file twice within the same minute with a fixed
// counter would reuse the exact same IPs and inherit the PREVIOUS run's exhausted budget.
let ipCounter = Date.now() % 50_000;
function nextIp(): string {
  ipCounter += 1;
  return `10.3.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

async function createUser(email: string) {
  const passwordHash = await hashPassword(PASSWORD);
  return prisma.user.create({ data: { email, passwordHash, name: "Reuse Test", role: "ADMIN", isActive: true } });
}

async function login(email: string, ip: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    remoteAddress: ip,
    payload: { email, password: PASSWORD },
  });
  return res.json().data as { accessToken: string; refreshToken: string };
}

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
  await disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("US3 AS1/AS2/AS3 — reuse of an already-rotated refresh token revokes its family", () => {
  it("rejects the replayed token AND revokes the newest legitimately-issued token in the same family", async () => {
    const ip = nextIp();
    const user = await createUser("reuse1@pascca.test");
    const tokenA = await login(user.email, ip);

    // Rotate once: A -> B.
    const rotateRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: tokenA.refreshToken },
    });
    expect(rotateRes.statusCode).toBe(200);
    const tokenB = rotateRes.json().data as { accessToken: string; refreshToken: string };

    // Replay A (already-rotated) — reuse detected.
    const replayRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: tokenA.refreshToken },
    });
    expect(replayRes.statusCode).toBe(401);
    expect(replayRes.json().error.code).toBe("AUTH_REFRESH_REUSE_DETECTED");

    // B — the newest, legitimately-issued token in the same family — must ALSO now be dead.
    const bRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: tokenB.refreshToken },
    });
    expect(bRes.statusCode).toBe(401);

    // The row itself is recorded (auditable), never exposing a credential value.
    const rows = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
  });

  it("does not trigger reuse handling for an already-expired (never-rotated) token", async () => {
    const ip = nextIp();
    const user = await createUser("expired1@pascca.test");
    const { refreshToken } = await login(user.email, ip);

    // Force the row into the past, simulating natural expiry — not a rotation.
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_TOKEN_EXPIRED");

    // Expiry alone must not revoke anything else — there IS nothing else here, but confirm the
    // row itself wasn't marked "replaced" (which would misclassify a future check as reuse).
    const row = await prisma.refreshToken.findFirst({ where: { userId: user.id } });
    expect(row!.replacedByTokenHash).toBeNull();
  });
});

describe("Edge case — two requests race to rotate the same token", () => {
  it("exactly one succeeds; the loser is treated as reuse, no crash, no divergent tokens", async () => {
    const ip = nextIp();
    const user = await createUser("race1@pascca.test");
    const { refreshToken } = await login(user.email, ip);

    // Genuinely concurrent — both fired before either resolves (research R10).
    const [first, second] = await Promise.all([
      app.inject({ method: "POST", url: "/api/v1/auth/refresh", remoteAddress: ip, payload: { refreshToken } }),
      app.inject({ method: "POST", url: "/api/v1/auth/refresh", remoteAddress: ip, payload: { refreshToken } }),
    ]);

    const statuses = [first.statusCode, second.statusCode].sort();
    // One winner (200, rotated), one loser — either AUTH_REFRESH_REUSE_DETECTED (401, if the
    // loser's transaction commits after the winner's) or, on a rare timing where both read
    // before either commits, AUTH_TOKEN_INVALID — never a second 200 and never a 500.
    expect(statuses[0]).toBe(200);
    expect([401]).toContain(statuses[1]);

    const winner = first.statusCode === 200 ? first : second;
    const winnerToken = winner.json().data.refreshToken as string;
    expect(winnerToken).not.toBe(refreshToken);

    // Per spec.md's edge case, the loser is handled "the same way any reuse failure is" — that
    // means the WHOLE family is revoked, including the winner's brand-new token (indistinguishable,
    // by design, from a real attacker racing a legitimate refresh). The user must log in again
    // from scratch either way — no lingering active session survives this race.
    const rows = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);

    const winnerRetry = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: winnerToken },
    });
    expect(winnerRetry.statusCode).toBe(401);
  });
});
