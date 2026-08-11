// 003-auth-authorization — US4 (T058): PATCH /me (FR-017, Clarification Q2, US4 AS3/AS4).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/app.ts";
import { disconnect, prisma, resetDatabase } from "../helpers/db.ts";
import { hashPassword } from "../../src/lib/hash.ts";
import exampleProtectedRoutes, { fixturePath } from "../fixtures/example-protected-routes.ts";
import { __resetPermissionsCacheForTests } from "../../src/modules/permissions/permissions.service.ts";

const PASSWORD = "correct horse battery staple 1";

let app: FastifyInstance;
let ipCounter = Date.now() % 50_000;
function nextIp(): string {
  ipCounter += 1;
  return `10.5.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

async function createCustomer(email: string) {
  const passwordHash = await hashPassword(PASSWORD);
  return prisma.user.create({ data: { email, passwordHash, name: "Customer", role: "CUSTOMER", isActive: true } });
}

async function login(email: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    remoteAddress: nextIp(),
    payload: { email, password: PASSWORD },
  });
  return res.json().data as { accessToken: string; refreshToken: string };
}

beforeAll(async () => {
  await resetDatabase();
  const { seedPermissions } = await import("../../prisma/seed/permissions.ts");
  await seedPermissions(prisma);
  __resetPermissionsCacheForTests();
  app = await buildTestApp({ extraPlugins: [exampleProtectedRoutes] });
});

afterAll(async () => {
  await app.close();
  await disconnect();
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

describe("US4 AS3 — PATCH /me updates own profile", () => {
  it("updates name/phone and the change is visible on the next GET /me", async () => {
    const user = await createCustomer("update1@pascca.test");
    const { accessToken } = await login(user.email);

    const patch = await app.inject({
      method: "PATCH",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: "Updated Name", phone: "0100000000" },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().data.name).toBe("Updated Name");

    const get = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(get.json().data.name).toBe("Updated Name");
    expect(get.json().data.phone).toBe("0100000000");
  });

  it("role and isActive cannot be changed through this route", async () => {
    const user = await createCustomer("update2@pascca.test");
    const { accessToken } = await login(user.email);

    // Zod strips unknown keys (UpdateProfileBodySchema declares no `role`/`isActive` field) —
    // the request succeeds but silently ignores them, which is the correct "not changeable"
    // behavior: no error, no effect.
    const patch = await app.inject({
      method: "PATCH",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: "Still Customer", role: "ADMIN", isActive: false },
    });
    expect(patch.statusCode).toBe(200);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.role).toBe("CUSTOMER");
    expect(stored.isActive).toBe(true);
  });

  it("changing email to one already in use is rejected with AUTH_EMAIL_TAKEN", async () => {
    await createCustomer("already-taken@pascca.test");
    const user = await createCustomer("update3@pascca.test");
    const { accessToken } = await login(user.email);

    const patch = await app.inject({
      method: "PATCH",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { email: "already-taken@pascca.test" },
    });
    expect(patch.statusCode).toBe(409);
    expect(patch.json().error.code).toBe("AUTH_EMAIL_TAKEN");
  });
});

describe("Clarification Q2 — password change requires currentPassword and revokes other sessions", () => {
  it("rejects a password change with no/incorrect currentPassword", async () => {
    const user = await createCustomer("pwchange1@pascca.test");
    const { accessToken } = await login(user.email);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { password: "a brand new password 1", currentPassword: "totally wrong" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("a successful password change revokes every refresh-token session for the account", async () => {
    const user = await createCustomer("pwchange2@pascca.test");
    const session1 = await login(user.email);
    const session2 = await login(user.email); // a second, independent session/device

    const patch = await app.inject({
      method: "PATCH",
      url: "/api/v1/me",
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${session1.accessToken}` },
      payload: { password: "a brand new password 1", currentPassword: PASSWORD },
    });
    expect(patch.statusCode).toBe(200);

    // Both sessions' refresh tokens are dead — every family revoked, not just the acting one.
    const refresh1 = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: nextIp(),
      payload: { refreshToken: session1.refreshToken },
    });
    expect(refresh1.statusCode).toBe(401);

    const refresh2 = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      remoteAddress: nextIp(),
      payload: { refreshToken: session2.refreshToken },
    });
    expect(refresh2.statusCode).toBe(401);

    // The new password actually works.
    const reLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: nextIp(),
      payload: { email: user.email, password: "a brand new password 1" },
    });
    expect(reLogin.statusCode).toBe(200);
  });
});

describe("US4 AS4 — a CUSTOMER is forbidden from staff-only actions, same as MODERATOR", () => {
  it("gets 403 AUTHZ_FORBIDDEN on a permission-gated fixture route", async () => {
    const user = await createCustomer("forbidden1@pascca.test");
    const { accessToken } = await login(user.email);

    const res = await app.inject({
      method: "GET",
      url: fixturePath("menu:write"),
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("AUTHZ_FORBIDDEN");
  });
});
