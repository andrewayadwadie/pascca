// @pascca/config/eslint/react — variant for apps/web and apps/admin.
//
// jsx-a11y ships now, before any screen exists (AR-007, Article 28). Adopting accessibility
// rules after the first UI ships means adopting them against an existing pile of violations,
// which is when teams turn them off instead of fixing them.
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import base, { noRawHexColour } from "./base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  jsxA11y.flatConfigs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Article 21 [NN]: logical CSS properties only. Physical left/right properties break
      // free RTL support the day Arabic is flagged on. Composed with base's hex-colour ban
      // (noRawHexColour) — see the comment in base.js on why this can't just extend it.
      "no-restricted-syntax": [
        "error",
        noRawHexColour,
        {
          selector:
            "Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|left|right)$/]",
          message:
            "Physical CSS property. Use logical properties (marginInlineStart, insetInlineEnd, etc.) — Article 21 [NN].",
        },
      ],
    },
  },
];
