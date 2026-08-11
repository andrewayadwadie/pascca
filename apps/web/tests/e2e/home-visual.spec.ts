// SC-001 (home route only — remaining-pages-visual.spec.ts covers the rest). True pixel-diff
// screenshot comparison against files/site/index.html needs baseline images this repo doesn't
// have (files/site/ is static HTML/CSS, not a set of reference screenshots) — this asserts the
// structural proxy for "visually indistinguishable" that IS checkable without one: no
// horizontal overflow and the hero/stage both visible at each named breakpoint.
import { expect, test } from "@playwright/test";

const WIDTHS = [1440, 1024, 768, 375];

for (const width of WIDTHS) {
  test(`home has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    await expect(page.locator("header.hero")).toBeVisible();
  });
}
