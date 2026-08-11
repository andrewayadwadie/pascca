// SC-001, remaining four routes (home-visual.spec.ts covers home). Structural proxy for
// "visually indistinguishable" — see home-visual.spec.ts's header comment for why this isn't a
// pixel screenshot diff.
import { expect, test } from "@playwright/test";

const ROUTES = ["/en/about", "/en/gallery", "/en/branches", "/en/legal"];
const WIDTHS = [1440, 1024, 768, 375];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
}
