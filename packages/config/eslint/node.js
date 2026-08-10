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
];
