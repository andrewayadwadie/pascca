// FR-014, research R6: each dependency check is single-shot — no backoff, no retry loop. Tested
// against genuinely unreachable endpoints (closed ports), asserting both the failure is named
// correctly AND the check returns quickly — a retry-with-backoff implementation would take
// noticeably longer than a single connection attempt's timeout.
import { describe, expect, it } from "vitest";
import { checkInfrastructure } from "../src/lib/health.ts";
import type { Env } from "../src/config/env.ts";

// Port 1 is a reserved/privileged port that nothing listens on in a test environment —
// connections to it fail fast (connection refused), which is what we want to test against.
const UNREACHABLE: Env = {
  NODE_ENV: "test",
  PORT: 3999,
  HOST: "127.0.0.1",
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://user:pw@127.0.0.1:1/db",
  REDIS_URL: "redis://127.0.0.1:1",
  S3_ENDPOINT: "http://127.0.0.1:1",
  S3_REGION: "auto",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET: "bucket",
  CORS_ORIGINS: ["http://localhost:3000"],
  // 003-auth-authorization: unused by checkInfrastructure() itself, but Env requires them.
  JWT_ACCESS_SECRET: "a".repeat(32),
  COOKIE_SECRET: "b".repeat(32),
};

describe("checkInfrastructure — no retry loop (FR-014)", () => {
  it("reports every unreachable service by name", async () => {
    const results = await checkInfrastructure(UNREACHABLE);

    expect(results).toHaveLength(3);
    expect(results.every((r) => !r.ok)).toBe(true);
    expect(results.map((r) => r.service).sort()).toEqual(["object storage", "postgres", "redis"]);
  });

  it("fails fast — no retry/backoff loop stretching this out", async () => {
    const start = Date.now();
    await checkInfrastructure(UNREACHABLE);
    const elapsedMs = Date.now() - start;

    // A single-shot connection attempt to a closed port resolves in well under a second on
    // localhost. A retrying client (even 2-3 attempts with backoff) would push this past
    // several seconds. 5s is a generous ceiling that still clearly distinguishes the two.
    expect(elapsedMs).toBeLessThan(5000);
  });
});
