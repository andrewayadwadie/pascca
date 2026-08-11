// FR-017, research R11: /pasca-menu/ responds 301 to /en/menu, in a single hop
// (skipTrailingSlashRedirect, next.config.ts).
import { expect, test } from "@playwright/test";

test("/pasca-menu/ redirects 301 to /en/menu", async ({ request }) => {
  const response = await request.get("/pasca-menu/", { maxRedirects: 0 });
  expect(response.status()).toBe(301);
  expect(response.headers()["location"]).toBe("/en/menu");
});
