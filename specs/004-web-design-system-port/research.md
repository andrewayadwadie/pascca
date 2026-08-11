# Research: Web Design System Port

Every decision below was made against the *current* repo state (checked directly, not assumed)
because 001-monorepo-scaffold, 002-content-schema-seed and 003-auth-authorization already built
more of the foundation than the feature input anticipated. Several decisions correct or refine a
literal reading of the input where the real codebase gave a better answer than a guess would
have.

## R1 — `packages/config/tokens.css` needs no content change

**Decision**: The `:root` token block already in `packages/config/tokens.css` (created during
001-monorepo-scaffold, 15 lines) is byte-identical to `files/site/assets/style.css`'s `:root`
block — every surface, accent, ink, geometry and motion variable already matches. This feature's
Section 1 work is entirely about *wiring* (Tailwind theme reachability, the hex-literal CI gate),
not about touching the file's content.

**Rationale**: Verified directly (`Read` on both files, values compared field-by-field). No
divergence exists.

**Alternatives considered**: Re-copying the block "to be sure" — rejected, would be a no-op edit
that adds git noise for zero behavioural change.

## R2 — Tailwind v4 theme wiring

**Decision**: Add Tailwind 4 to `apps/web` and `apps/admin`. Wire tokens via Tailwind v4's
CSS-first `@theme` directive in each app's global stylesheet, mapping every `tokens.css` custom
property to a Tailwind theme token (`--color-gold: var(--gold)`, `--radius-lg: var(--r-lg)`,
`--ease-spring: var(--spring)`, etc.) so components use `bg-gold`, `rounded-lg`, `ease-spring`
— never a literal. `apps/admin` gets the same `@theme` wiring but zero components (Out of Scope:
"Do not build the admin dashboard" — the constitution's "so both apps consume one file" is
satisfied by the plumbing existing, not by admin having UI yet).

**Rationale**: Tailwind v4's `@theme` is CSS-native and needs no `tailwind.config.ts` JS-side
token duplication — one `@import "@pascca/config/tokens.css"` plus one `@theme` block per app is
the whole integration, keeping `tokens.css` the actual single source (Article 8).

**Alternatives considered**: Tailwind v3 + JS config re-declaring every token as a JS object —
rejected, Article 5 locks Tailwind 4, and it would duplicate the token values in a second syntax.

## R3 — Hex-literal enforcement needs two layers, not one

**Decision**: Extend the *existing* `noRawHexColour` ESLint selector
(`packages/config/eslint/base.js`, shipped by 001) to also match a hex literal embedded inside a
longer string (Tailwind bracket syntax, e.g. `"bg-[#d4af37]"` is a *different* string shape than
a bare `"#d4af37"` literal — the current regex `^#([0-9a-fA-F]{3}){1,2}$` is anchored and misses
it). Additionally add a standalone Node CI script (`scripts/check-hex-literals.mjs` or similar)
that scans built `apps/web` and `apps/admin` source — including `.css` files, which ESLint's JS
parser never touches — and fails on any hex/`rgba()`/px-radius/`cubic-bezier()` literal outside
`tokens.css`. This is what the input explicitly asked for ("Add a CI check that greps for hex
literals") independent of lint.

**Rationale**: The ESLint rule alone (a) can't see `.css` files and (b) doesn't catch a hex
literal that's a *substring* of a bracketed Tailwind class. Two layers close both gaps; this is
additive to what 001 already shipped, not a rewrite of it.

**Alternatives considered**: Widening only the ESLint regex and skipping the standalone CI
script — rejected, `.css`-file coverage would still be missing and the input names a CI grep
step explicitly.

## R4 — Zodiak font files do not exist in this repo yet

**Decision**: No `.woff2`/`.ttf` file for Zodiak exists anywhere in the repository (checked via
`Glob`/`find`) — `files/site/` only ever *linked* it from Fontshare's CDN. Self-hosting (FR-007)
requires the actual binary font files, which is a task-execution-time action (fetch Fontshare's
CSS endpoint, download the `woff2` URLs it references, commit them under
`apps/web/public/fonts`), not a planning-time one. Fontshare's stated model is free self-hosting
(the CDN link is a convenience, not the only distribution channel) — this is not scraping a
proprietary asset, it's using the vendor's own download path. Plus Jakarta Sans has no such gap:
`next/font/google` self-hosts it automatically at build time with no manual asset step (FR-008).

**Rationale**: Planning cannot fabricate a font binary; flagging the real gap now (rather than
silently assuming the files exist) avoids a task that looks "done" on paper but ships a broken
`@font-face` with no source file.

**Alternatives considered**: Keep the Fontshare `<link>` "for now" — rejected outright, FR-006
and SC-004 are explicit and non-negotiable (no third-party font CDN request in production).

## R5 — Content DTOs use flat `xEn`/`xAr` fields, matching the real Prisma schema — not nested `{_en, _ar}`

**Decision**: `apps/api/prisma/schema.prisma` (built by 002-content-schema-seed, already
shipped) universally uses a flat field-suffix convention for bilingual content —
`nameEn`/`nameAr`, `addressEn`/`addressAr`, `quoteEn`/`quoteAr`, `headlineEn`/`headlineAr`
(inside `PageBlock.value`), etc. — on every single Tier 1/Tier 2 model. The content-DTO types
this feature defines in `packages/types` (FR-018) will mirror that convention exactly, field for
field, rather than the nested `{ _en: string, _ar: string }` shape a literal reading of the
input's "with `_en` and `_ar` fields on every content string" would suggest.

**Rationale**: FR-018's own stated goal is that these types are "shaped exactly as the future
API responses" — and the future API's responses will serialize Prisma's actual field names
directly (no app has any reason to insert a nested-object transform layer between Prisma and its
JSON response). Matching the real schema is what makes the fixture-to-fetch seam (SC-008) real:
swapping a `getX()` implementation for a fetch later requires zero reshaping if the shapes
already match bit-for-bit.

**Alternatives considered**: Nested `{_en, _ar}` objects (input's literal phrasing) — rejected;
it doesn't match anything the API will actually return, so "the seam" would need a translation
layer this feature would otherwise avoid. `spec.md`'s Key Entities section and FR-018 have been
corrected in place to state the flat convention explicitly (a factual correction from reading
the real schema, not a scope change).

## R6 — Hand-written content-DTO types live in a new sibling path, never in `packages/types/src/index.ts`

**Decision**: `packages/types/src/index.ts` is 100% generated (`packages/types/scripts/
generate.ts`'s own header: *"Nothing under `src/` is ever hand-written; this script is the only
thing that touches it."* — written during 003-auth-authorization). This feature adds a
**separate** hand-written module, `packages/types/src/content/index.ts` (plus one file per
entity if that reads better), exported via a new `package.json` subpath —
`"./content": "./src/content/index.ts"` — never touching `index.ts` or the generate script.
`generate.ts`'s header comment is corrected in the same change to say "nothing under `src/
index.ts`" (or "outside `src/content/`"), since the blanket claim becomes literally false the
moment a sibling directory exists, and leaving stale documentation in place is worse than fixing
a one-line comment.

**Rationale**: The input's literal instruction ("Define the content DTO types in
`packages/types`") is honoured, but honouring it by hand-editing the generated file would
violate Article 8 [NN] (`packages/types, generated` is the Article 8 single-source-of-truth
table's own wording) and an explicit, deliberate invariant a prior feature already established.
A clearly-separated, clearly-labelled hand-written sibling resolves both: `packages/types`
still holds the types, `index.ts` still means "generated, don't touch."

**Alternatives considered**: Defining content DTOs inside `apps/web` only, not
`packages/types` — rejected: `apps/api/prisma/seed.ts` needs the same shapes (FR-022), and
`apps/api` importing a type from inside `apps/web`'s own source tree is a worse layering
violation than the one this decision avoids. Hand-editing `index.ts` anyway "since nothing
_currently_ depends on regeneration overwriting it" — rejected, next `pnpm --filter @pascca/
types generate` run would silently delete every hand-written type with no error, which is
exactly the failure mode the existing invariant exists to prevent.

## R7 — `apps/api/prisma/seed.ts` imports `apps/web/src/content/*` as a workspace dependency

**Decision**: `apps/api` adds a `devDependency` on `@pascca/web` (workspace protocol).
`apps/web/package.json` gains an `exports` map exposing `./content/*` as raw TypeScript source
(`"./content/*": "./src/content/*.ts"`), mirroring the pattern `packages/config` already uses
for `./eslint/react` (a raw `.js` file export, not a compiled `dist/`). `apps/api/prisma/
seed/*.ts` modules import fixture data through that subpath. This import is used **only** inside
`prisma/seed/` — `apps/api/src` (the served runtime) never imports anything from `apps/web`.

**Rationale**: This is what the input explicitly asks for ("Export these fixtures so
`apps/api/prisma/seed.ts` can import them. The website and the seed must never diverge") and
what Article 8 [NN] wants (no duplicated source of truth). Scoping the import to `prisma/seed/`
— a dev-time/ops script, never bundled into or run by the live API server — means Article 4's
compliance test ("could the Flutter app deliver this feature with zero backend changes?") is
unaffected: the served API's runtime dependency graph doesn't change.

**Alternatives considered**: A third shared package (`packages/content`) instead of
`apps/web/src/content` — architecturally more conventional (packages are meant to be the shared
layer, not one app depending on another's source), but explicitly contradicts the input's twice-
stated literal path (`apps/web/src/content/*.ts`). Given no constitution article forbids one
app's dev-time script importing another app's source, and Article 6's tree already treats
`apps/*` as siblings without stating they may never reference each other, the literal path was
kept.

## R8 — Reconciling with 002's already-seeded, already-diverged placeholder data

**Decision**: `apps/api/prisma/seed/{branches,menu,gallery,page-content}.ts` (built by 002, all
already shipped and tested) currently hold **their own independent, hand-written copies** of
content that overlaps with `files/site/` — and they have *already* diverged from it. Confirmed
directly: `branches.ts`'s Shobra address is `"26 July Corridor, Shobra, Cairo"` (explicitly
marked `TODO(client-data): unverified placeholder`) versus `files/site/branches.html`'s real
`"273 Shobra Street, Cairo"`; `menu.ts`'s Margherita is `16000` piastres (160 EGP) versus
`files/site/menu.html`'s `165`; `page-content.ts`'s home-hero headline is `"Freshly Baked With
Love"` versus the source's literal `"Freshly baked<em>with love</em>"`. This feature's tasks
will refactor those four seed modules to import their literal values from the new
`apps/web/src/content` fixtures (R7) instead of maintaining a second, already-drifted copy —
this is a real bug fix the input's Section 5 predicted in the abstract ("must never diverge")
and that this research confirms is not hypothetical.

**Rationale**: This is exactly the failure mode Article 8 [NN] and FR-022 exist to prevent, and
it has already happened once. Fixing it is in scope because FR-022 requires it, not because this
feature is expanding into 002's territory unprompted.

**Verification that this is safe**: Searched `apps/api/tests/*.test.ts` for any assertion
pinning an exact copy string, phone number, address, or price from the current seed data — none
exists. Existing tests assert structure (row counts, schema shape, `@@unique` keys, forbidden
Tier-3 block names) — not literal values. Swapping the *source* of the values (not their shape)
does not require touching any existing test.

**Alternatives considered**: Leaving the 002 seed data as-is and only wiring the *new* pages
(gallery masonry captions, team blurbs) that don't already have a hand-written seed counterpart
— rejected, it would leave the divergence FR-022 explicitly forbids sitting in the codebase
uncorrected, on a technicality that "it already existed before this feature."

## R9 — Price stays `Int` piastres in the fixture, matching Prisma exactly; display formatting is a component concern

**Decision**: `MenuItem.price` in the content-DTO fixture is `Int` piastres (e.g. Margherita =
`16500`), identical to `apps/api/prisma/schema.prisma`'s `MenuItem.price` field and comment
(`// piastres`). `DishCard`/`MenuRow` format it for display (`price / 100`, no decimal places
when whole) to reproduce `files/site/`'s literal bare-integer display (`165`, no currency
symbol, no decimals).

**Rationale**: Keeping the fixture in the same unit as the real column (R5's rationale extends
here) means the future fetch-swap changes zero formatting code — only the accessor's data
source changes.

**Alternatives considered**: Storing price as EGP (matching the literal on-page number) and
converting to piastres only at seed-import time — rejected, it would mean the fixture and the
schema disagree about units, the opposite of R5's decision.

## R10 — `arabicEnabled` gate, built on the routing shell 001 already shipped

**Decision**: `apps/web/src/app/[locale]/layout.tsx` already registers both `en` and `ar` via
`generateStaticParams` with `dynamicParams = false` (001-monorepo-scaffold, with the comment
"the first content feature replaces this" — this is that feature). This feature adds an
`arabicEnabled` boolean constant (code-level flag, not a database row — no `SiteSetting` exists
for it and this feature touches no database) and calls Next.js's `notFound()` inside the locale
layout when `locale === "ar" && !arabicEnabled`. The route segment stays registered (satisfying
"registered but disabled by flag") but never renders a page.

**Rationale**: Reuses the existing shell exactly as its own comment anticipated, rather than
replacing the routing approach. `notFound()` is the correct Next.js primitive for "this route
exists in principle, not in practice" — it does not 404 the whole locale prefix silently as a
redirect would, it renders the app's actual not-found UI.

**Alternatives considered**: Middleware-level ar-blocking (redirect `/ar/*` → `/en/*`) —
rejected, a redirect would be indistinguishable from "ar doesn't exist," while `notFound()`
preserves the more accurate "registered but off" semantics Article 21 describes.

## R11 — Legacy redirect lives in the existing `middleware.ts`

**Decision**: `/pasca-menu/` → `/en/menu` (301) is added to `apps/web/src/middleware.ts`
alongside the existing `/` → `/en` redirect, rather than a new file or a `next.config.ts`
`redirects()` entry.

**Rationale**: `next.config.ts`'s `redirects()` is evaluated at a different point than
middleware and this repo already centralises the one other redirect it has in middleware — one
redirect mechanism, not two, per the same "single source of truth" instinct Article 8 applies
elsewhere.

**Alternatives considered**: `next.config.ts` `redirects()` — equally valid technically, but
would split redirect logic across two files for no benefit.

## R12 — Menu/gallery filter state: `searchParams`-driven, not client-only

**Decision**: The `/menu` (and `/gallery`) page Server Component reads its filter value from the
App Router `searchParams` prop and passes it as `FilterPills`' initial/controlled value; client
interaction updates the URL (`router.replace` with the new query string, no full navigation)
which `searchParams` picks up on the next render. No `useEffect`-driven "hydrate filter from URL
after mount" step exists, because that would produce the exact flash-of-unfiltered-content
FR-031/Edge Cases forbids.

**Rationale**: This is the only implementation that satisfies "shareable and server-renderable"
literally — a filter state that starts in `useState(‘all’)` and only syncs to the URL after
mount is client-only in effect, even if the URL eventually looks right.

**Alternatives considered**: Client Component with `useState` + `useEffect(() => router.replace
(...), [])` on mount — rejected for the SSR-correctness reason above.

## R13 — Testing stack additions: Playwright, `@axe-core/playwright`, `lighthouse` CLI

**Decision**: None of Playwright, an axe integration, or a Lighthouse runner exist anywhere in
this repo yet (checked — zero Playwright config, zero axe dependency). This feature adds all
three: Playwright for e2e/visual/keyboard-navigation coverage (Article 5 already names it —
"Playwright (RTL snapshots)" — this is its first real use); `@axe-core/playwright` run against
all eight routes for SC-005; a small Node script driving the `lighthouse` npm package against a
production build (`next build && next start`) for SC-006's literal thresholds, run the same way
locally as in CI (matching the DoD-gate convention already established for `pnpm lint &&
typecheck && test && build`).

**Rationale**: Article 30's "a11y | axe clean on all eight pages; reduced-motion snapshot" row
and Article 28's numeric Lighthouse thresholds are unenforceable without dedicated tooling —
Vitest alone cannot render a full page or drive a real browser.

**Alternatives considered**: A hosted Lighthouse CI SaaS — rejected as a new external
dependency/account this feature doesn't need; the `lighthouse` npm package run locally/in-CI is
sufficient and keeps everything inside the monorepo, consistent with how the rest of the stack
runs.

## R14 — No animation library added this feature

**Decision**: Article 5's web stack table names `Motion` (the `motion` npm package, formerly
Framer Motion) as part of the locked public-web stack — but this feature does not add it as a
dependency. Every motion-budget item within this feature's actual scope (sticky-nav class
toggle on scroll, `clip-path` wipe via a CSS class, `IntersectionObserver`-driven reveal, CSS
`max-height` accordion transition, CSS hover `transform` on the floating plate) is plain
CSS transitions/keyframes driven by React state — exactly how `files/site/assets/app.js` itself
implements all of it, with zero animation library.

**Rationale**: Article 11 (phase discipline: "build the phase in front of you") — installing a
dependency with nothing in this feature's scope that actually needs its imperative animation
API (spring physics beyond what `--spring`'s `cubic-bezier` already gives CSS, gesture-driven
drag, layout animations) would be dead weight. `--spring` and `--ease` are already
`cubic-bezier()` values designed for CSS `transition-timing-function`, not a JS tween API.

**Alternatives considered**: Adding `motion` now "since the constitution names it" — rejected;
the constitution's stack table is the ceiling of what's *permitted*, not a mandate to install
every named package on the first feature that touches the app it belongs to. Deferred to
whichever future feature is the first to need genuinely imperative (non-CSS-expressible)
animation.

## R15 — No TanStack Query added this feature

**Decision**: Same reasoning as R14. This feature calls no API (explicitly out of scope) — every
`getX()` accessor returns a synchronous fixture. TanStack Query has nothing to fetch, cache, or
revalidate yet.

**Rationale**: Article 11 again. Adding a data-fetching/caching library with zero fetches in
scope is premature; the first feature that replaces a fixture accessor with a real
`fetch`/`openapi-fetch` call is where TanStack Query earns its place.

**Alternatives considered**: Wiring up an empty `QueryClientProvider` now "for later" —
rejected, it's inert scaffolding with no test that could ever meaningfully fail, exactly the
kind of premature structure Article 11 warns against.
