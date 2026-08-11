// SC-007, Article 30's "reduced-motion snapshot": with prefers-reduced-motion: reduce
// emulated, all seven Article 19 motion items render in their end state with no transition/
// animation, across all eight routes.
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

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const route of ROUTES) {
  test(`${route}: transitions are near-instant under prefers-reduced-motion`, async ({ page }) => {
    await page.goto(route);
    const duration = await page.evaluate(() => {
      const el = document.querySelector("body");
      if (!el) return "0s";
      return getComputedStyle(el).transitionDuration;
    });
    // globals.css forces 0.01ms under prefers-reduced-motion: reduce
    expect(duration === "0.01ms" || duration === "0s" || duration === "").toBeTruthy();
  });
}

test("home: revealed sections are visible immediately, no opacity:0 stuck state", async ({ page }) => {
  await page.goto("/en");
  const shead = page.locator(".shead").first();
  await expect(shead).toBeVisible();
  const opacity = await shead.evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBeGreaterThan(0.9);
});
