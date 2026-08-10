// FR-011: one executing test — proves the app builds and responds, via fastify.inject (no real
// network port bound, so this runs in CI without any infrastructure).
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";
import { loadEnv } from "../src/config/env.ts";
import { VALID_ENV } from "./fixtures/valid-env.ts";

describe("apps/api smoke", () => {
  it("builds and GET /health responds ok", async () => {
    const env = loadEnv(VALID_ENV);
    const app = buildApp(env);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });

    await app.close();
  });

  it("mounts the /api/v1 prefix (Article 4) even with zero routes registered under it", async () => {
    const env = loadEnv(VALID_ENV);
    const app = buildApp(env);
    await app.ready();

    // No route exists under /api/v1 yet — a request there 404s, which is the expected shape
    // (route not found), not a 500 (prefix not mounted).
    const response = await app.inject({ method: "GET", url: "/api/v1/does-not-exist" });
    expect(response.statusCode).toBe(404);

    await app.close();
  });
});
