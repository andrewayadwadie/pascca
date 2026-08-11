// FR-033, Edge Cases: empty required field blocks submission with a Tier-3 message, no request
// sent.
import { expect, test } from "@playwright/test";

test("contact form blocks submission on an empty required field", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET") requests.push(req.url());
  });

  await page.goto("/en/contact");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  expect(requests).toHaveLength(0);
});
