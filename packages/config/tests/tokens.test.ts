// FR-011: one executing test per workspace member. This one also does real work — it's the
// mechanical check behind Article 16 [NN]: the token file must define exactly the names the
// constitution's block specifies, so a later edit can't quietly drop or rename one.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tokensPath = fileURLToPath(new URL("../tokens.css", import.meta.url));
const css = readFileSync(tokensPath, "utf-8");

const expectedTokens = [
  "--bg",
  "--surface",
  "--surface-2",
  "--surface-3",
  "--gold",
  "--gold-2",
  "--gold-dim",
  "--w",
  "--w70",
  "--w60",
  "--w50",
  "--w40",
  "--w20",
  "--w10",
  "--w06",
  "--r-sm",
  "--r",
  "--r-lg",
  "--pill",
  "--pad",
  "--maxw",
  "--spring",
  "--ease",
];

describe("packages/config/tokens.css", () => {
  it("defines a :root block", () => {
    expect(css).toContain(":root{");
  });

  it.each(expectedTokens)("defines %s", (token) => {
    expect(css).toMatch(new RegExp(`${token}:`));
  });

  it("defines gold as the only accent colour token", () => {
    // Article 16: gold is the only accent. Anything named *-accent besides --gold* is a drift.
    const accentLike = css.match(/--(?!gold)[a-z0-9-]*accent[a-z0-9-]*:/gi) ?? [];
    expect(accentLike).toHaveLength(0);
  });
});
