# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y\axe-all-routes.spec.ts >> /en/gallery has zero axe violations
- Location: tests\a11y\axe-all-routes.spec.ts:18:3

# Error details

```
Error: page.evaluate: Target page, context or browser has been closed
Browser logs:

<launching> C:\Users\Dell\AppData\Local\ms-playwright\chromium_headless_shell-1234\chrome-headless-shell-win64\chrome-headless-shell.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=C:\Users\Dell\AppData\Local\Temp\playwright_chromiumdev_profile-vJGgXJ --remote-debugging-pipe --no-startup-window
<launched> pid=21248
```

# Test source

```ts
  1  | // SC-005, Article 30's a11y risk row ("axe clean on all eight pages"). @axe-core/playwright
  2  | // against all eight routes under the en locale.
  3  | import AxeBuilder from "@axe-core/playwright";
  4  | import { expect, test } from "@playwright/test";
  5  | 
  6  | const ROUTES = [
  7  |   "/en",
  8  |   "/en/menu",
  9  |   "/en/about",
  10 |   "/en/gallery",
  11 |   "/en/branches",
  12 |   "/en/reservations",
  13 |   "/en/contact",
  14 |   "/en/legal",
  15 | ];
  16 | 
  17 | for (const route of ROUTES) {
  18 |   test(`${route} has zero axe violations`, async ({ page }) => {
  19 |     await page.goto(route);
> 20 |     const results = await new AxeBuilder({ page }).analyze();
     |                                                    ^ Error: page.evaluate: Target page, context or browser has been closed
  21 |     expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  22 |   });
  23 | }
  24 | 
```