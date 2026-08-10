// @pascca/config/eslint/node — variant for server-side packages (apps/api).
import base from "./base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    rules: {
      // Article 8: process.env is read in exactly one place (apps/api/src/config/env.ts).
      // Everywhere else, importing the typed env module is the only path.
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Read process.env only in apps/api/src/config/env.ts. Import the validated env object everywhere else.",
        },
      ],
    },
  },
  {
    // The one file allowed to read process.env directly (Article 8, data-model.md).
    files: ["**/config/env.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
  {
    // Standalone dev-time scripts and test infrastructure outside the request path — Article 8's
    // "one file" rule governs the running API, not `tsx prisma/seed.ts` or the test harness.
    // Both need process.env before (or without) the full request-time schema in env.ts: the seed
    // script reads one optional password var (T029), and tests/helpers/db.ts must fail loudly on
    // a missing DATABASE_URL even when the rest of env.ts's schema isn't satisfiable (T008).
    files: ["prisma/seed.ts", "prisma/seed/**/*.ts", "tests/helpers/db.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
];
