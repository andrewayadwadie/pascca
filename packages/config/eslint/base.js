// @pascca/config/eslint/base — the shared flat ESLint config every workspace member extends.
// Article 8 [NN]: this is the single source of lint rules. No app or package may define a
// competing, independent rule set from scratch (FR-003).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

// SC-005: every design value traces to packages/config/tokens.css — zero raw colour literals
// in app source (research R4). This selector only ever sees JS/TS literals; tokens.css is a
// .css file, outside what ESLint's JS parser touches, so it needs no explicit exclusion.
// Exported so eslint/react.js can compose it into its own no-restricted-syntax array — flat
// config REPLACES a rule's value per matching config, it does not merge arrays across entries.
// Unanchored (research R3, T010): a bare "#d4af37" literal and a hex literal embedded inside a
// longer string — e.g. Tailwind bracket syntax "bg-[#d4af37]" — are different string shapes.
// The original anchored form (`^...$`) only caught the first; this catches both without
// widening so far that it flags an unrelated string containing a URL fragment ending in
// something hex-shaped (extremely unlikely for a 3/6-digit run bounded to not extend into more
// hex digits, per the negative lookahead).
export const noRawHexColour = {
  selector: "Literal[value=/#([0-9a-fA-F]{3}){1,2}(?![0-9a-fA-F])/]",
  message: "Raw hex colour literal. Colours come from packages/config/tokens.css only (Article 16 [NN]).",
};

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": ["error", noRawHexColour],
    },
  },
  {
    // next-env.d.ts is Next.js's own auto-generated ambient-types file, created by `next dev`/
    // `next build` and committed by Next.js convention. It ALWAYS contains a triple-slash
    // reference by design — that's not app code to lint, excluding it is correct, not a
    // suppression of a real violation (caught by CI, research/tasks note this).
    ignores: ["dist/**", ".next/**", ".turbo/**", "coverage/**", "node_modules/**", "next-env.d.ts"],
  },
];
