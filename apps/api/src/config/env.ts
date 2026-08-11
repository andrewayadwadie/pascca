// Article 8 [NN]: this is the ONLY file in the codebase that reads process.env. Every other
// module imports the `env` export below. Enforced by packages/config/eslint/node.js's
// no-restricted-properties rule (with this file as the one carved-out exception).
//
// Full contract (contracts/env.md, data-model.md). Defaults exist only where a wrong-but-
// plausible value is harmless (NODE_ENV, PORT, HOST, LOG_LEVEL, S3_REGION). Nothing that points
// at infrastructure or carries a credential has a default (DATABASE_URL, REDIS_URL, S3_ENDPOINT,
// S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, CORS_ORIGINS) — a missing one of those MUST
// fail, never silently resolve to something plausible-looking.
import { z } from "zod";

// Exported (not just used internally) so apps/api/tests/env-example-sync.test.ts can introspect
// the key list without duplicating it — the schema's own keys are the source of truth for what
// .env.example must contain (research R7).
export const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), {
      message: "Must be a postgresql:// connection string",
    }),
  REDIS_URL: z
    .string()
    .url()
    .refine((v) => v.startsWith("redis://") || v.startsWith("rediss://"), {
      message: "Must be a redis:// connection string",
    }),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1).default("auto"),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),

  // Article 29 [NN]: CORS allow-list, never "*". Comma-separated in the env, parsed to an array.
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
    .refine((origins) => origins.length > 0, { message: "Must list at least one origin" })
    .refine((origins) => !origins.includes("*"), {
      message: "Wildcard '*' is not permitted (Article 29 [NN]) — list explicit origins",
    }),

  // 003-auth-authorization: signing secrets for the two things a leaked env var would let an
  // attacker forge — access tokens and the refresh-token cookie. `min(32)` is a floor against an
  // obviously-weak value, not a guarantee of quality; no default, ever (Article 29 [NN]).
  JWT_ACCESS_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof schema>;

/**
 * Parses a given source (defaults to process.env) and returns the validated, typed config —
 * or prints one line per problem (variable name and constraint, NEVER the value —
 * clarification 2026-08-10) and exits non-zero.
 *
 * Deliberately NOT called at module load time: importing this file must never have a side
 * effect (no process.exit during test collection). server.ts calls loadEnv() explicitly, once,
 * as its first action — that is the only place validation actually runs.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const variable = issue.path.join(".") || "(unknown)";
      // issue.message never contains the offending value — Zod describes the constraint
      // ("Required", "Invalid enum value", etc.), it does not echo input. We additionally
      // never interpolate the source value here, so a secret cannot leak through this path.
      console.error(`${variable}: ${issue.message}`);
    }
    process.exit(1);
    // Unreachable when process.exit really exits. Defends against a test mocking process.exit
    // (to assert it was called without killing the test runner) — without this, execution would
    // otherwise fall through to `result.data`, which doesn't exist on the failure variant.
    throw new Error("unreachable: process.exit(1) did not terminate the process");
  }

  return Object.freeze(result.data);
}
