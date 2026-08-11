// FR-027: scroll past 60px triggers SiteHeader's `small` state.
import { expect, test } from "@playwright/test";

test("nav gains the small state after scrolling past 60px", async ({ page }) => {
  await page.goto("/en");
  const nav = page.locator("nav");
  await expect(nav).not.toHaveClass(/small/);

  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(nav).toHaveClass(/small/);
});
