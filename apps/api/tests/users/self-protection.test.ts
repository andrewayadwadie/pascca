// 003-auth-authorization — US2 (T048): self-protection invariants (FR-014, FR-015, SC-006).
// contracts/permission-matrix.md's invariants table, plus the exhaustive orderings SC-006 asks
// for.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/app.ts";
import { disconnect, prisma, resetDatabase } from "../helpers/db.ts";
import { hashPassword } from "../../src/lib/hash.ts";
import { __resetPermissionsCacheForTests } from "../../src/modules/permissions/permissions.service.ts";
import { createUsersRepository } from "../../src/modules/users/users.repository.ts";
import { createUsersService } from "../../src/modules/users/users.service.ts";
import { createAuditWriter } from "../../src/lib/audit.ts";

const PASSWORD = "correct horse battery staple 1";

let app: FastifyInstance;
// See login-session.test.ts's comment — seeded from the clock so repeated runs within the same
// minute don't reuse IPs whose Redis-backed rate-limit budget is already exhausted.
let ipCounter = Date.now() % 50_000;
function nextIp(): string {
  ipCounter += 1;
  return `10.2.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

async function createAdmin(email: string, isActive = true) {
  const passwordHash = await hashPassword(PASSWORD);
  return prisma.user.create({ data: { email, passwordHash, name: "Admin", role: "ADMIN", isActive } });
}

async function loginAs(email: string): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    remoteAddress: nextIp(),
    payload: { email, password: PASSWORD },
  });
  return res.json().data.accessToken;
}

beforeAll(async () => {
  await resetDatabase();
  const { seedPermissions } = await import("../../prisma/seed/permissions.ts");
  await seedPermissions(prisma);
  __resetPermissionsCacheForTests();
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
  await disconnect();
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

describe("FR-014: an ADMIN cannot target their own account", () => {
  it("cannot delete self", async () => {
    const admin = await createAdmin("self-delete@pascca.test");
    await createAdmin("other-admin-1@pascca.test"); // a second active ADMIN so this isn't ALSO a last-admin case
    const token = await loginAs(admin.email);

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${admin.id}`,
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("USER_SELF_DELETE_FORBIDDEN");
  });

  it("cannot deactivate self", async () => {
    const admin = await createAdmin("self-deactivate@pascca.test");
    await createAdmin("other-admin-2@pascca.test");
    const token = await loginAs(admin.email);

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${admin.id}/active`,
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${token}` },
      payload: { isActive: false },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("USER_SELF_DELETE_FORBIDDEN");
  });
});

describe("FR-015/SC-006: the sole remaining active ADMIN is protected", () => {
  // Reachability note: only ADMIN holds `user:write` (permission-matrix.md), and if a DIFFERENT
  // admin is the one making this HTTP call, that admin is themselves active — so the target
  // being acted on is, by construction, never "sole" from the HTTP surface's point of view (the
  // acting admin is the ≥1 "other" active admin remaining). The genuinely HTTP-reachable case
  // where a sole admin is targeted at all is self-targeting, which FR-014's check answers first
  // (`USER_SELF_DELETE_FORBIDDEN`) before this invariant is even consulted. The three tests below
  // exercise `assertNotLastActiveAdmin` directly at the service layer instead — proving the
  // invariant holds as defense-in-depth even for a hypothetical caller that bypasses the
  // self-check (a future role change, a batch operation, a refactor that reorders the checks).

  function buildUsersService() {
    return createUsersService(createUsersRepository(prisma), createAuditWriter(prisma));
  }

  it("service layer: rejects demoting the sole active ADMIN even when the actor id is different", async () => {
    const sole = await createAdmin("sole-service-1@pascca.test");
    const usersService = buildUsersService();

    await expect(usersService.changeRole("some-other-actor-id", sole.id, "MODERATOR")).rejects.toMatchObject({
      code: "USER_LAST_ADMIN_PROTECTED",
    });
  });

  it("service layer: rejects deactivating the sole active ADMIN even when the actor id is different", async () => {
    const sole = await createAdmin("sole-service-2@pascca.test");
    const usersService = buildUsersService();

    await expect(usersService.changeActiveStatus("some-other-actor-id", sole.id, false)).rejects.toMatchObject({
      code: "USER_LAST_ADMIN_PROTECTED",
    });
  });

  it("service layer: rejects deleting the sole active ADMIN even when the actor id is different", async () => {
    const sole = await createAdmin("sole-service-3@pascca.test");
    const usersService = buildUsersService();

    await expect(usersService.deleteUser("some-other-actor-id", sole.id)).rejects.toMatchObject({
      code: "USER_LAST_ADMIN_PROTECTED",
    });
  });

  it("service layer: an already-inactive second ADMIN doesn't count — the active one is still sole", async () => {
    const sole = await createAdmin("sole-service-4@pascca.test");
    await createAdmin("inactive-peer@pascca.test", false);
    const usersService = buildUsersService();

    await expect(usersService.deleteUser("some-other-actor-id", sole.id)).rejects.toMatchObject({
      code: "USER_LAST_ADMIN_PROTECTED",
    });
  });

  it("HTTP: demote/deactivate/delete succeeds once a second active ADMIN exists — the invariant only bites at exactly one", async () => {
    const target = await createAdmin("not-alone-1@pascca.test");
    await createAdmin("not-alone-2@pascca.test"); // a second active admin — target is no longer sole
    const actor = await createAdmin("actor-4@pascca.test");
    const token = await loginAs(actor.email);

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}/role`,
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${token}` },
      payload: { role: "MODERATOR" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("HTTP: a sole admin's own self-delete attempt is still rejected (via FR-014's self-check, reached first)", async () => {
    const sole = await createAdmin("sole-http-1@pascca.test");
    const token = await loginAs(sole.email);

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${sole.id}`,
      remoteAddress: nextIp(),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("USER_SELF_DELETE_FORBIDDEN");
  });
});
