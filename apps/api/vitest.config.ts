import { defineConfig, mergeConfig } from "vitest/config";
import base from "@pascca/config/vitest/base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/**/*.test.ts"],
      // 002-content-schema-seed (T009): database-backed suites (migration.test.ts, seed.test.ts,
      // seed-idempotency.test.ts, referential-integrity.test.ts) share ONE Postgres instance and
      // truncate it between runs (tests/helpers/db.ts). Running test files in parallel would let
      // one suite's reset wipe another's fixtures mid-assertion, so file-level parallelism is off
      // for this package — a small, deliberate trade against the shared base config.
      fileParallelism: false,
      // Default 5s is too short once argon2id hashing (two users) and ~200 seeded rows are in
      // the same run as the database round-trips they require.
      testTimeout: 30_000,
    },
  }),
);
