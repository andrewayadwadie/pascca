// FR-034, Edge Cases: party size 6 → instant confirmation; above 6 → call-back-required. Zero
// network requests either time (FR-033 — the form submits nowhere). The guest-count <select>
// has no literal "7" option (files/site/reservations.html's own list: 2,3,4,5,6,8,10,12), so
// this exercises the boundary with 6 (at the line) and 8 (first value past it).
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function submitWithSize(page: Page, size: string) {
  await page.goto("/en/reservations");
  await page.getByLabel("Full name").fill("Test Guest");
  await page.getByLabel("Mobile").fill("01012345678");
  await page.locator('select[name="size"]').selectOption(size);
  await page.getByRole("button", { name: "Confirm reservation" }).click();
}

test("party size 6 is confirmed instantly", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET") requests.push(req.url());
  });

  await submitWithSize(page, "6");
  await expect(page.locator(".ok.show")).toBeVisible();
  await expect(page.locator(".ok.show")).not.toContainText("staff will call you");
  expect(requests).toHaveLength(0);
});

test("party size 8 requires a call-back, still zero requests", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET") requests.push(req.url());
  });

  await submitWithSize(page, "8");
  await expect(page.locator(".ok.show")).toContainText("staff will call you");
  expect(requests).toHaveLength(0);
});
