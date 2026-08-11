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
      // Scoped to `style={{...}}` object literals specifically (not every `Property` named
      // "left"/"right" anywhere) — 004-web-design-system-port's SplitPanel has frozen `left`/
      // `right` ReactNode props (contracts/component-api.md) that are not CSS at all; the
      // original unscoped selector flagged that destructuring as a false positive.
      //
      // FR-025 (004-web-design-system-port): no literal user-facing string in JSX. A JSXText
      // node is, by construction, always a raw literal — `t('key')` (next-intl) and a
      // `lib/content` field read (`item.nameEn`) both render as a JSXExpressionContainer
      // wrapping an Identifier/CallExpression/MemberExpression, never as JSXText, so this
      // selector needs no separate exemption list for either source — they're a different AST
      // shape entirely. quickstart.md's own smoke test: `<span>hi</span>` must fail this rule.
      // The second selector covers the handful of JSX *attributes* that are user-facing despite
      // not being element children (aria-label, alt, placeholder, title) — an empty string
      // (`alt=""`, FR-013's deliberate decorative case) still passes, since `/\S/` requires at
      // least one non-whitespace character.
      "no-restricted-syntax": [
        "error",
        noRawHexColour,
        {
          selector:
            "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|left|right)$/]",
          message:
            "Physical CSS property. Use logical properties (marginInlineStart, insetInlineEnd, etc.) — Article 21 [NN].",
        },
        {
          selector: "JSXText[value=/\\S/]",
          message:
            "Hardcoded JSX text. UI chrome strings go in messages/{en,ar}.json (next-intl's useTranslations); editorial copy goes in a content fixture, read via lib/content — Article 21 [NN], FR-025.",
        },
        {
          selector:
            "JSXAttribute[name.name=/^(aria-label|alt|placeholder|title)$/] > Literal[value=/\\S/]",
          message:
            "Hardcoded user-facing JSX attribute. Read it from messages/{en,ar}.json or a content fixture instead — Article 21 [NN], FR-025.",
        },
      ],
    },
  },
];
