// FR-031, research R12: requesting /en/menu?filter=pizza fresh (JS disabled) must already show
// only pizza rows in the server-rendered HTML — no flash of the full list.
import { expect, test } from "@playwright/test";

test("menu filter is server-rendered with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/en/menu?filter=pizza");

  await expect(page.locator("h3", { hasText: "Pizza" })).toBeVisible();
  await expect(page.locator("h3", { hasText: "Calzone" })).toHaveCount(0);
  await expect(page.locator("h3", { hasText: "Pasta" })).toHaveCount(0);

  await context.close();
});
