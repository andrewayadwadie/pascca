// FR-037, Edge Cases: opening the lightbox traps focus, Escape/outside-click closes it and
// returns focus to the triggering thumbnail.
import { expect, test } from "@playwright/test";

test("lightbox traps focus and Escape returns focus to the trigger", async ({ page }) => {
  await page.goto("/en/gallery");
  const firstThumb = page.locator(".masonry button").first();
  await firstThumb.focus();
  await firstThumb.press("Enter");

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(firstThumb).toBeFocused();
});
