import globals from "globals";
import react from "@pascca/config/eslint/react";

export default [
  ...react,
  {
    // scripts/*.mjs (check-hex-literals is root-level and out of scope; lighthouse-check.mjs
    // lives inside this workspace) are plain Node CLI scripts, not app/browser code — the
    // shared react preset has no browser/Node globals configured for non-TS files (TS files
    // rely on typescript-eslint disabling no-undef in favour of tsc's own check; .mjs files get
    // neither, so `process`/`console` read as genuinely undefined without this).
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
