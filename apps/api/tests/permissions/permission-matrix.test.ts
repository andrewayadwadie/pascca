// 003-auth-authorization — US2 (T034). The literal assertion list from
// contracts/permission-matrix.md: 18 permissions × 3 roles (54 assertions) + the generic
// unauthenticated case (SC-002, Article 30 "Permissions" row).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/app.ts";
import { disconnect, prisma, resetDatabase } from "../helpers/db.ts";
import { hashPassword } from "../../src/lib/hash.ts";
import exampleProtectedRoutes, { FIXTURE_PERMISSIONS, fixturePath } from "../fixtures/example-protected-routes.ts";
import { __resetPermissionsCacheForTests } from "../../src/modules/permissions/permissions.service.ts";

const PASSWORD = "correct horse battery staple 1";
const ROLES = ["ADMIN", "MODERATOR", "CUSTOMER"] as const;

let app: FastifyInstance;
// See login-session.test.ts's comment — seeded from the clock so repeated runs within the same
// minute don't reuse IPs whose Redis-backed rate-limit budget is already exhausted.
let ipCounter = Date.now() % 50_000;
function nextIp(): string {
  ipCounter += 1;
  return `10.1.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

async function loginAs(role: (typeof ROLES)[number]): Promise<string> {
  const passwordHash = await hashPassword(PASSWORD);
  const user = await prisma.user.create({
    data: {
      email: `matrix-${role}-${Math.random().toString(36).slice(2)}@pascca.test`,
      passwordHash,
      name: `Matrix ${role}`,
      role,
      isActive: true,
    },
  });
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    remoteAddress: nextIp(),
    payload: { email: user.email, password: PASSWORD },
  });
  return res.json().data.accessToken;
}

beforeAll(async () => {
  // permissions.service's cache (research R6) is loaded exactly ONCE, the moment `.ready()`
  // runs `rbacPlugin` below — it must find real grants already in the database at that instant,
  // not an empty table it'll never re-read. Seed BEFORE building the app, not after.
  await resetDatabase();
  const { seedPermissions } = await import("../../prisma/seed/permissions.ts");
  await seedPermissions(prisma);
  __resetPermissionsCacheForTests(); // in case an earlier test file in this worker already loaded one
  app = await buildTestApp({ extraPlugins: [exampleProtectedRoutes] });
});

afterAll(async () => {
  await app.close();
  await disconnect();
});

beforeEach(async () => {
  // Resets every OTHER table (User, RefreshToken, ...) between tests. Deliberately does NOT
  // touch RolePermission — the cache above was loaded once and won't re-read it, so wiping the
  // table here would desync the cache from the database for no benefit; `resetDatabase()`'s
  // blanket TRUNCATE is bypassed in favor of per-table cleanup for this file only.
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

// contracts/permission-matrix.md's full table. `expected` is what a role should see for that
// fixture permission: 200 = granted, 403 = forbidden.
const MATRIX: Record<(typeof ROLES)[number], Record<string, 200 | 403>> = {
  ADMIN: Object.fromEntries(FIXTURE_PERMISSIONS.map((p) => [p, 200])) as Record<string, 200 | 403>,
  MODERATOR: {
    "reservation:read": 200,
    "reservation:create": 200,
    "reservation:update": 200,
    "reservation:delete": 200,
    "message:read": 200,
    "message:update": 200,
    "menu:write": 403,
    "category:write": 403,
    "gallery:write": 403,
    "branch:write": 403,
    "content:write": 403,
    "testimonial:write": 403,
    "team:write": 403,
    "post:write": 403,
    "settings:write": 403,
  },
  CUSTOMER: {
    "reservation:read": 200,
    "reservation:create": 200,
    "reservation:update": 200,
    "reservation:delete": 403,
    "message:read": 403,
    "message:update": 403,
    "menu:write": 403,
    "category:write": 403,
    "gallery:write": 403,
    "branch:write": 403,
    "content:write": 403,
    "testimonial:write": 403,
    "team:write": 403,
    "post:write": 403,
    "settings:write": 403,
  },
};

describe("permission matrix (SC-002): fixture domains", () => {
  for (const role of ROLES) {
    for (const permission of FIXTURE_PERMISSIONS) {
      const expected = MATRIX[role][permission];
      it(`${role} × ${permission} → ${expected}`, async () => {
        const token = await loginAs(role);
        const res = await app.inject({
          method: "GET",
          url: fixturePath(permission),
          remoteAddress: nextIp(),
          headers: { authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(expected);
        if (expected === 403) expect(res.json().error.code).toBe("AUTHZ_FORBIDDEN");
      });
    }
  }
});

describe("permission matrix (SC-002): real user:* / audit:read domain", () => {
  it("ADMIN is granted user:read (GET /users) and user:write (PATCH role) and audit:read (GET /permissions)", async () => {
    const adminToken = await loginAs("ADMIN");
    const target = await prisma.user.create({
      data: { email: "target@pascca.test", passwordHash: await hashPassword(PASSWORD), name: "Target", role: "CUSTOMER" },
    });

    const list = await app.inject({ method: "GET", url: "/api/v1/users", remoteAddress: nextIp(), headers: { authorization: `Bearer ${adminToken}` } });
    expect(list.statusCode).toBe(200);

    const roleChange = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}/role`,
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { role: "MODERATOR" },
    });
    expect(roleChange.statusCode).toBe(200);

    const permissions = await app.inject({ method: "GET", url: "/api/v1/permissions", remoteAddress: nextIp(), headers: { authorization: `Bearer ${adminToken}` } });
    expect(permissions.statusCode).toBe(200);
  });

  it("MODERATOR and CUSTOMER are forbidden from user:read and user:write and audit:read", async () => {
    const target = await prisma.user.create({
      data: { email: "target2@pascca.test", passwordHash: await hashPassword(PASSWORD), name: "Target2", role: "CUSTOMER" },
    });

    for (const role of ["MODERATOR", "CUSTOMER"] as const) {
      const token = await loginAs(role);

      const list = await app.inject({ method: "GET", url: "/api/v1/users", remoteAddress: nextIp(), headers: { authorization: `Bearer ${token}` } });
      expect(list.statusCode).toBe(403);

      const roleChange = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${target.id}/role`,
        remoteAddress: nextIp(),
        headers: { authorization: `Bearer ${token}` },
        payload: { role: "ADMIN" },
      });
      expect(roleChange.statusCode).toBe(403);

      const permissions = await app.inject({ method: "GET", url: "/api/v1/permissions", remoteAddress: nextIp(), headers: { authorization: `Bearer ${token}` } });
      expect(permissions.statusCode).toBe(403);
    }
  });
});

describe("permission matrix (US2 AS4): unauthenticated is 401, not 403", () => {
  it("a fixture route with no credentials returns AUTHZ_UNAUTHENTICATED", async () => {
    const res = await app.inject({ method: "GET", url: fixturePath("menu:write"), remoteAddress: nextIp() });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTHZ_UNAUTHENTICATED");
  });

  it("a real route with no credentials returns AUTHZ_UNAUTHENTICATED", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/users", remoteAddress: nextIp() });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTHZ_UNAUTHENTICATED");
  });
});
