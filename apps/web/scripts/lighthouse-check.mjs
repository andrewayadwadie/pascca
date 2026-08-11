#!/usr/bin/env node
// SC-006, research R13: runs `lighthouse` against a running production build for all eight
// routes, fails if any is below the Article 28 thresholds (mobile ≥95 perf / 100 a11y / 100
// SEO). Requires `pnpm --filter @pascca/web build && pnpm --filter @pascca/web start` already
// running on :3000 — this script doesn't start the server itself, matching how the DoD gate
// (quickstart.md) and CI both run it: build once, start once, audit every route against that
// one running instance.
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const BASE_URL = process.env.LIGHTHOUSE_BASE_URL ?? "http://localhost:3000";
const ROUTES = ["/en", "/en/menu", "/en/about", "/en/gallery", "/en/branches", "/en/reservations", "/en/contact", "/en/legal"];

const THRESHOLDS = { performance: 95, accessibility: 100, seo: 100 };

async function auditRoute(chrome, route) {
  const result = await lighthouse(`${BASE_URL}${route}`, {
    port: chrome.port,
    output: "json",
    onlyCategories: ["performance", "accessibility", "seo"],
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 375, height: 667, deviceScaleFactor: 2 },
  });

  const scores = {
    performance: Math.round((result.lhr.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((result.lhr.categories.accessibility?.score ?? 0) * 100),
    seo: Math.round((result.lhr.categories.seo?.score ?? 0) * 100),
  };

  return { route, scores };
}

async function main() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  let failed = false;

  try {
    for (const route of ROUTES) {
      const { scores } = await auditRoute(chrome, route);
      const rowFailed =
        scores.performance < THRESHOLDS.performance ||
        scores.accessibility < THRESHOLDS.accessibility ||
        scores.seo < THRESHOLDS.seo;
      if (rowFailed) failed = true;

      const status = rowFailed ? "FAIL" : "PASS";
      console.log(
        `[${status}] ${route} — performance:${scores.performance} accessibility:${scores.accessibility} seo:${scores.seo}`,
      );
    }
  } finally {
    await chrome.kill();
  }

  if (failed) {
    console.error(`\nlighthouse-check: one or more routes below threshold (perf>=${THRESHOLDS.performance}, a11y>=${THRESHOLDS.accessibility}, seo>=${THRESHOLDS.seo})`);
    process.exit(1);
  }

  console.log("\nlighthouse-check: all routes pass their thresholds");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
