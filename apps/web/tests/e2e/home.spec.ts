// Asserts the Article-18 home section order (spec.md Acceptance Scenario 1): Hero → PressStrip
// → dishes Grid → story SplitPanel → breakfast → occasions ValueCards → TestimonialCards →
// delivery SplitPanel → FAQ Accordion → reservation-CTA Panel → SiteFooter → MobileCtaBar.
import { expect, test } from "@playwright/test";

test("home page renders every Article-18 section in order", async ({ page }) => {
  await page.goto("/en");

  const sectionSelectors = [
    "header.hero",
    ".press",
    "text=Dishes people come back for",
    "text=A pizzeria that grew",
    "text=Breakfast, unhurried",
    "text=Rooms for the big ones",
    "text=What people say",
    "text=We deliver across Cairo",
    "text=Before you come",
    "text=Your table is waiting",
    "footer",
    ".mcta",
  ];

  const positions: number[] = [];
  for (const selector of sectionSelectors) {
    const locator = page.locator(selector).first();
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    positions.push(box?.y ?? 0);
  }

  for (let i = 1; i < positions.length; i++) {
    expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]!);
  }
});
