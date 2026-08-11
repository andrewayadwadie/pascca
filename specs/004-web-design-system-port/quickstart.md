# Quickstart: Web Design System Port

No database, no API server, and no auth needed to work on this feature — it is a static/fixture
-backed Next.js build. `apps/api` is only touched by the seed-reconciliation piece (R8), which
needs 002's usual `pnpm db:migrate && pnpm db:seed` if you want to verify the reconciled seed
values land in Postgres.

## Run the site

```powershell
pnpm --filter @pascca/web dev
# → http://localhost:3000/en   (root "/" redirects here; "/ar" 404s until arabicEnabled flips)
```

## Verify the token/Tailwind wiring (Section 1)

```powershell
pnpm --filter @pascca/web build
# then check the compiled CSS contains no literal hex/rgba/px-radius/cubic-bezier outside
# packages/config/tokens.css:
node scripts/check-hex-literals.mjs apps/web apps/admin
```

## Verify no hardcoded JSX string (Section 6)

```powershell
pnpm --filter @pascca/web lint
# introduce `<span>hi</span>` anywhere under src/components to confirm the rule actually fires
```

## Verify the font is self-hosted (Section 2)

```powershell
pnpm --filter @pascca/web build && pnpm --filter @pascca/web start
# open the Network panel, filter "font" — zero requests to fonts.gstatic.com or api.fontshare.com;
# Zodiak requests resolve to /fonts/*.woff2
```

## Verify the menu filter is shareable/SSR-correct (Section 7)

```powershell
pnpm --filter @pascca/web build && pnpm --filter @pascca/web start
curl -s http://localhost:3000/en/menu?filter=fasting | grep -c "data-cat" # sanity: rows present
# then disable JS in a real browser and confirm the same URL still shows only fasting dishes
```

## Verify the legacy redirect (Article 22)

```powershell
curl -sI http://localhost:3000/pasca-menu/ | grep -i "location:\|HTTP/"
# expect: 301, Location: /en/menu
```

## Run this feature's a11y/visual/Lighthouse checks (Article 28, 30)

```powershell
pnpm --filter @pascca/web exec playwright test tests/a11y
pnpm --filter @pascca/web exec playwright test tests/e2e
node apps/web/scripts/lighthouse-check.mjs   # requires a production build running on :3000
```

## Verify the fixture seam is real (Section 5, SC-008)

```powershell
pnpm --filter @pascca/web test -- content-seam
# this test swaps getFeaturedDishes() for a stub returning different data mid-test and asserts
# the rendered page changed with zero component edits
```

## Verify the seed no longer diverges from the site (R7/R8)

```powershell
pnpm db:reset && pnpm db:seed
pnpm --filter @pascca/api test -- seed
# confirms apps/api/prisma/seed/{branches,menu,gallery,page-content}.ts now import their values
# from @pascca/web/content/* instead of an independent hardcoded copy
```

## Full Definition of Done gate (Article 31)

```powershell
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
