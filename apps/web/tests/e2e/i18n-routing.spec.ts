// FR-016, research R10 (Article 30's i18n risk row): /ar/* resolves not-found while
// arabicEnabled is false; "/" still redirects to /en; both locale segments are registered per
// generateStaticParams.
import { expect, test } from "@playwright/test";

test("/ redirects to /en", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect([307, 308]).toContain(response.status());
  expect(response.headers()["location"]).toBe("/en");
});

test("/ar resolves not-found while arabicEnabled is false", async ({ page }) => {
  const response = await page.goto("/ar");
  expect(response?.status()).toBe(404);
});

test("/ar/menu also resolves not-found", async ({ page }) => {
  const response = await page.goto("/ar/menu");
  expect(response?.status()).toBe(404);
});

test("/en renders successfully", async ({ page }) => {
  const response = await page.goto("/en");
  expect(response?.status()).toBe(200);
});
