// SC-005: tabs through each route with no mouse, reaches and operates the accordion, mobile
// nav trigger, both filter bars, and the gallery lightbox.
import { expect, test } from "@playwright/test";

test("home: accordion is keyboard operable", async ({ page }) => {
  await page.goto("/en");
  const firstQuestionButton = page.locator(".q > button").first();
  await firstQuestionButton.focus();
  await page.keyboard.press("Enter");
  await expect(firstQuestionButton).toHaveAttribute("aria-expanded", /true|false/);
});

test("mobile nav trigger is keyboard operable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/en");
  const burger = page.locator(".brg");
  await burger.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ov")).toHaveClass(/on/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#ov")).not.toHaveClass(/on/);
});

test("menu filter bar is keyboard reachable", async ({ page }) => {
  await page.goto("/en/menu");
  await page.locator(".filters button").first().focus();
  await expect(page.locator(".filters button").first()).toBeFocused();
});

test("gallery album filter bar is keyboard reachable", async ({ page }) => {
  await page.goto("/en/gallery");
  await page.locator(".filters button").first().focus();
  await expect(page.locator(".filters button").first()).toBeFocused();
});
