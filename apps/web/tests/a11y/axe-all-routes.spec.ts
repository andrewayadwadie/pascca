// SC-005, Article 30's a11y risk row ("axe clean on all eight pages"). @axe-core/playwright
// against all eight routes under the en locale.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/en",
  "/en/menu",
  "/en/about",
  "/en/gallery",
  "/en/branches",
  "/en/reservations",
  "/en/contact",
  "/en/legal",
];

for (const route of ROUTES) {
  test(`${route} has zero axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
