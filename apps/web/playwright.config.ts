// Playwright config for e2e/a11y tests (research R13). Runs against a production build on
// :3000 — `pnpm --filter @pascca/web build && pnpm --filter @pascca/web start` — matching how
// quickstart.md and the Lighthouse runner (T104) both operate, so behaviour under test is never
// dev-server-only behaviour (fast refresh, unminified bundles) diverging from what ships.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "a11y/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/en",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
