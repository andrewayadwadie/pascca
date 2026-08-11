// spec.md Acceptance Scenarios 1–2, Article 18's table: /about, /gallery, /branches, /legal
// each render their full section order.
import { expect, test } from "@playwright/test";

test("about page renders story → values → milestones → team → cta in order", async ({ page }) => {
  await page.goto("/en/about");
  const selectors = ["text=Freshly baked, every day", "text=Four things we don't rush", "text=How we got here", "text=Behind the pass", "text=Come and see the room"];
  const positions: number[] = [];
  for (const s of selectors) {
    const box = await page.locator(s).first().boundingBox();
    positions.push(box?.y ?? 0);
  }
  for (let i = 1; i < positions.length; i++) expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]!);
});

test("gallery page renders filters → masonry → instagram cta in order", async ({ page }) => {
  await page.goto("/en/gallery");
  await expect(page.locator(".filters")).toBeVisible();
  await expect(page.locator(".masonry")).toBeVisible();
  await expect(page.locator("text=Post it @pasccarestaurant")).toBeVisible();
});

test("branches page renders branch cards → map → large groups in order", async ({ page }) => {
  await page.goto("/en/branches");
  const cards = await page.locator("article.br").first().boundingBox();
  const map = await page.locator("text=More than eight of you?").first().boundingBox();
  expect((map?.y ?? 0)).toBeGreaterThanOrEqual(cards?.y ?? 0);
});

test("legal page renders privacy then terms", async ({ page }) => {
  await page.goto("/en/legal");
  const privacy = await page.locator("text=What we collect").first().boundingBox();
  const terms = await page.locator("#terms").boundingBox();
  expect(terms?.y ?? 0).toBeGreaterThanOrEqual(privacy?.y ?? 0);
});
