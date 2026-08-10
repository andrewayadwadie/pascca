// US2. Table-driven over the real schema, not a couple of sampled examples — SC-002 (corrected
// 2026-08-10) requires 100% coverage of malformation, and 100% coverage of absence for every
// variable that has no default.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadEnv } from "../src/config/env.ts";
import { VALID_ENV } from "./fixtures/valid-env.ts";

// The 7 variables with NO default — absence must fail (data-model.md's "Validation rules").
const REQUIRED_NO_DEFAULT = [
  "DATABASE_URL",
  "REDIS_URL",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_BUCKET",
  "CORS_ORIGINS",
] as const;

// The 5 variables WITH a documented default — absence must succeed, default applies.
const HAS_DEFAULT: Array<[key: string, expectedDefault: unknown]> = [
  ["NODE_ENV", "development"],
  ["PORT", 3001],
  ["HOST", "0.0.0.0"],
  ["LOG_LEVEL", "info"],
  ["S3_REGION", "auto"],
];

// Malformed value per key — every one of the 12 must fail when explicitly set but invalid,
// regardless of whether it has a default (a default only applies on ABSENCE, never overrides
// an explicitly-set bad value).
const MALFORMED: Array<[key: string, badValue: string]> = [
  ["NODE_ENV", "not-a-real-environment"],
  ["PORT", "not-a-number"],
  ["HOST", ""],
  ["LOG_LEVEL", "not-a-level"],
  ["DATABASE_URL", "not-a-url"],
  ["REDIS_URL", "not-a-url"],
  ["S3_ENDPOINT", "not-a-url"],
  ["S3_REGION", ""],
  ["S3_ACCESS_KEY_ID", ""],
  ["S3_SECRET_ACCESS_KEY", ""],
  ["S3_BUCKET", ""],
  ["CORS_ORIGINS", "*"], // Article 29 [NN]: wildcard explicitly rejected
];

// Small typed factories rather than a bare `ReturnType<typeof vi.spyOn>` annotation — the
// untyped generic form resolves to vi.spyOn's broadest overload, which then mismatches the
// concrete mockImplementation() call below. Inferring through a concrete function pins the
// exact overload actually used.
function spyOnProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation((): never => {
    throw new Error("process.exit called");
  });
}
function spyOnConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

let exitSpy: ReturnType<typeof spyOnProcessExit>;
let errorSpy: ReturnType<typeof spyOnConsoleError>;

beforeEach(() => {
  // Mock process.exit so a failing loadEnv() doesn't kill the test runner — it throws instead
  // (see the comment in env.ts on why loadEnv is written to be safe under this mock).
  exitSpy = spyOnProcessExit();
  errorSpy = spyOnConsoleError();
});

afterEach(() => {
  exitSpy.mockRestore();
  errorSpy.mockRestore();
});

function printedLines(): string {
  return errorSpy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("loadEnv — a fully valid environment", () => {
  it("starts cleanly with no exit and no error output (US2 scenario 3)", () => {
    const env = loadEnv(VALID_ENV);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(env.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL);
  });
});

describe("loadEnv — absence of a required (no-default) variable", () => {
  it.each(REQUIRED_NO_DEFAULT)("%s missing → exits 1, naming %s (US2 scenario 1)", (key) => {
    const env = { ...VALID_ENV };
    delete env[key];

    expect(() => loadEnv(env)).toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(printedLines()).toContain(key);
  });
});

describe("loadEnv — absence of a variable with a documented default", () => {
  it.each(HAS_DEFAULT)("%s missing → succeeds, default applies", (key, expected) => {
    const env = { ...VALID_ENV };
    delete env[key];

    const result = loadEnv(env);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(result[key as keyof typeof result]).toBe(expected);
  });
});

describe("loadEnv — malformed values (explicitly set but invalid)", () => {
  it.each(MALFORMED)("%s malformed → exits 1, naming %s (US2 scenario 2)", (key, badValue) => {
    const env = { ...VALID_ENV, [key]: badValue };

    expect(() => loadEnv(env)).toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(printedLines()).toContain(key);
  });
});

describe("loadEnv — multiple simultaneous failures", () => {
  it("reports every problem in one run, not one per restart", () => {
    const env = { ...VALID_ENV };
    delete env.DATABASE_URL;
    delete env.REDIS_URL;
    env.PORT = "not-a-number";

    expect(() => loadEnv(env)).toThrow();
    const lines = printedLines();
    expect(lines).toContain("DATABASE_URL");
    expect(lines).toContain("REDIS_URL");
    expect(lines).toContain("PORT");
    // process.exit called exactly once, after all issues were printed — not once per issue.
    expect(exitSpy).toHaveBeenCalledTimes(1);
  });
});

describe("loadEnv — secret redaction (clarification 2026-08-10, research R5)", () => {
  it("never prints a valid secret's value, even while a DIFFERENT key fails validation", () => {
    // DATABASE_URL is present and VALID (its embedded password must not leak just because it
    // flowed through loadEnv) — REDIS_URL is what's actually missing and causes the failure.
    const secret = "hunter2-super-secret-password";
    // Explicit NodeJS.ProcessEnv annotation: spreading VALID_ENV alongside an explicit property
    // override narrows the inferred literal type to just the overridden key otherwise, which
    // would make the delete below a type error.
    const env: NodeJS.ProcessEnv = { ...VALID_ENV, DATABASE_URL: `postgresql://user:${secret}@localhost:5432/db` };
    delete env.REDIS_URL;

    expect(() => loadEnv(env)).toThrow();
    expect(printedLines()).not.toContain(secret);
  });

  it("never prints the value of the variable that itself failed validation", () => {
    // S3_ACCESS_KEY_ID fails its own validation (empty string) while carrying a plausible-
    // secret-looking value is not the scenario — instead: DATABASE_URL fails its OWN format
    // check while containing a secret-looking password, proving even the failing value's
    // embedded secret never surfaces.
    const secretLookingValue = "sk_live_totally_a_real_secret_value";
    const env = { ...VALID_ENV, DATABASE_URL: `not-a-url-but-contains-${secretLookingValue}` };

    expect(() => loadEnv(env)).toThrow();
    expect(printedLines()).not.toContain(secretLookingValue);
  });
});
