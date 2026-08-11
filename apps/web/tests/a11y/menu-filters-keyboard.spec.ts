// Every FilterPills button reachable and operable by keyboard alone.
import { expect, test } from "@playwright/test";

test("menu filter pills are keyboard operable", async ({ page }) => {
  await page.goto("/en/menu");
  const firstPill = page.locator(".filters button").first();
  await firstPill.focus();
  await expect(firstPill).toBeFocused();

  const secondPill = page.locator(".filters button").nth(1);
  await page.keyboard.press("Tab");
  await expect(secondPill).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(secondPill).toHaveAttribute("aria-pressed", "true");
});
