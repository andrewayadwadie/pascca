// 003-auth-authorization — US1 (T023-T025): login, GET /me, refresh, logout.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/app.ts";
import { disconnect, prisma, resetDatabase } from "../helpers/db.ts";
import { hashPassword } from "../../src/lib/hash.ts";

const PASSWORD = "correct horse battery staple 1";

let app: FastifyInstance;

// FR-018/Clarification Q1: the 5/min budget is per-IP and SHARED across every /auth/* route —
// exactly what this suite would trip if every test shared one fake source IP. Fastify's
// `light-my-request` (what `.inject()` uses) lets each call declare its own `remoteAddress`, so
// each test gets its own IP — isolating rate-limit state between tests without weakening the
// limiter itself, which is the thing under test elsewhere (T018/rate-limit tests, if added).
// Seeded from the current time, not a fixed 1-based counter — the Redis-backed rate-limit
// budget outlives a single test run, unlike Postgres (resetDatabase() clears it); re-running
// this file twice within the same minute with a fixed counter would reuse the same IPs and
// inherit the PREVIOUS run's exhausted budget.
let ipCounter = Date.now() % 50_000;
function nextIp(): string {
  ipCounter += 1;
  return `10.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}.1`;
}

async function createUser(overrides: Partial<{ email: string; role: "ADMIN" | "MODERATOR" | "CUSTOMER"; isActive: boolean; deletedAt: Date | null }> = {}) {
  const passwordHash = await hashPassword(PASSWORD);
  return prisma.user.create({
    data: {
      email: overrides.email ?? `staff-${Math.random().toString(36).slice(2)}@pascca.test`,
      passwordHash,
      name: "Test Staff",
      role: overrides.role ?? "ADMIN",
      isActive: overrides.isActive ?? true,
      deletedAt: overrides.deletedAt ?? null,
    },
  });
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

describe("US1 AS1/AS2/AS7 — login", () => {
  it("issues an access + refresh token and updates lastLoginAt on correct credentials", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "admin@example.test" });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: PASSWORD },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTypeOf("string");
    expect(body.data.user.email).toBe(user.email);
    expect(body.data.user.passwordHash).toBeUndefined();

    const refreshed = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(refreshed.lastLoginAt).not.toBeNull();
  });

  it("rejects a wrong password with a generic AUTH_INVALID_CREDENTIALS, no field hint", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "wrongpw@example.test" });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: "not the right password" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("rejects login for a nonexistent email with the same code as a wrong password", async () => {
    const ip = nextIp();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: "nobody@example.test", password: PASSWORD },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("rejects login against a deactivated account", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "inactive@example.test", isActive: false });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: PASSWORD },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_ACCOUNT_INACTIVE");
  });

  it("rejects login against a soft-deleted account", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "deleted@example.test", deletedAt: new Date() });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: PASSWORD },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_ACCOUNT_INACTIVE");
  });
});

describe("US1 AS3/AS4 — GET /me", () => {
  it("returns the caller's own profile with no passwordHash, given a valid access token", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "me@example.test" });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: PASSWORD },
    });
    const { accessToken } = login.json().data;

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      remoteAddress: ip,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json().data;
    expect(body.email).toBe(user.email);
    expect(body.passwordHash).toBeUndefined();
  });

  it("rejects a missing token as unauthenticated", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/me", remoteAddress: nextIp() });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTHZ_UNAUTHENTICATED");
  });

  it("rejects a malformed access token as unauthenticated", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTHZ_UNAUTHENTICATED");
  });
});

describe("US1 AS5 — refresh rotates the token", () => {
  it("issues a new access + refresh pair, and the old refresh token stops working", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "refresh@example.test" });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: PASSWORD },
    });
    const { refreshToken: oldRefresh } = login.json().data;

    const refreshed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: oldRefresh },
    });
    expect(refreshed.statusCode).toBe(200);
    const { accessToken: newAccess, refreshToken: newRefresh } = refreshed.json().data;
    expect(newAccess).toBeTypeOf("string");
    expect(newRefresh).not.toBe(oldRefresh);

    const replay = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: oldRefresh },
    });
    expect(replay.statusCode).toBe(401);
  });
});

describe("FR-018/Clarification Q1 — shared rate limit across /auth/*", () => {
  it("rejects the 6th request within a minute from the same IP, across different auth routes, as 429 AUTH_RATE_LIMITED", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "ratelimited@example.test" });

    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        remoteAddress: ip,
        payload: { email: user.email, password: "wrong on purpose" },
      });
      expect(res.statusCode).toBe(401); // budget spent on 5 legitimate (if failed) attempts
    }

    const sixth = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken: "irrelevant-budget-is-shared-across-routes" },
    });
    expect(sixth.statusCode).toBe(429);
    expect(sixth.json().error.code).toBe("AUTH_RATE_LIMITED");
  });
});

describe("US1 AS6 — logout revokes the session", () => {
  it("revokes the presented refresh token; reusing it afterward fails", async () => {
    const ip = nextIp();
    const user = await createUser({ email: "logout@example.test" });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: ip,
      payload: { email: user.email, password: PASSWORD },
    });
    const { accessToken, refreshToken } = login.json().data;

    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      remoteAddress: ip,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { refreshToken },
    });
    expect(logout.statusCode).toBe(204);

    const replay = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: ip,
      payload: { refreshToken },
    });
    expect(replay.statusCode).toBe(401);
  });
});
