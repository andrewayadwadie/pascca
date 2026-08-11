// 003-auth-authorization — US4 (T057): customer self-service registration.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/app.ts";
import { disconnect, prisma, resetDatabase } from "../helpers/db.ts";
import { hashPassword } from "../../src/lib/hash.ts";

let app: FastifyInstance;
let ipCounter = Date.now() % 50_000;
function nextIp(): string {
  ipCounter += 1;
  return `10.4.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
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

describe("US4 AS1 — registration creates a CUSTOMER-level account", () => {
  it("issues tokens exactly like login, stores the password only as a hash, defaults to CUSTOMER", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      remoteAddress: nextIp(),
      payload: { email: "newcustomer@pascca.test", password: "a fresh password 1", name: "New Customer" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json().data;
    expect(body.accessToken).toBeTypeOf("string");
    expect(body.refreshToken).toBeTypeOf("string");
    expect(body.user.role).toBe("CUSTOMER");
    expect(body.user.passwordHash).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "newcustomer@pascca.test" } });
    expect(stored.role).toBe("CUSTOMER");
    expect(stored.passwordHash).not.toBe("a fresh password 1");
    expect(stored.passwordHash.startsWith("$argon2id$")).toBe(true);
  });
});

describe("US4 AS2 — duplicate email is rejected without a field-specific leak", () => {
  it("rejects with AUTH_EMAIL_TAKEN, no account created, no hint about which field collided", async () => {
    const passwordHash = await hashPassword("existing-password-1");
    await prisma.user.create({
      data: { email: "taken@pascca.test", passwordHash, name: "Existing", role: "CUSTOMER" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      remoteAddress: nextIp(),
      payload: { email: "taken@pascca.test", password: "another password 1", name: "Impersonator" },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error.code).toBe("AUTH_EMAIL_TAKEN");
    expect(JSON.stringify(body)).not.toContain("password"); // no echoed field name/value

    const count = await prisma.user.count({ where: { email: "taken@pascca.test" } });
    expect(count).toBe(1); // unchanged — no duplicate, no overwrite
  });
});
