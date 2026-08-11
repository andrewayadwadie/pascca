---

description: "Task list for 004-web-design-system-port"
---

# Tasks: Web Design System Port

**Input**: Design documents from `/specs/004-web-design-system-port/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Mandatory for this feature's two Article 30 risk areas — a11y ("axe clean on all
eight routes; reduced-motion snapshot", US5) and i18n ("locale routing works with ar disabled;
no hardcoded strings", Foundational + US5). Beyond those two rows, tests are added per story
where they verify that story's own Acceptance Scenarios/Edge Cases from spec.md, not for
coverage theatre.

**Organization**: Grouped by user story (spec.md's P1–P5) so each is independently
implementable, testable, and demoable per its own Independent Test criterion.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5, mapping to spec.md's five user stories
- Every description names its exact file path(s)

## Path Conventions

Per plan.md's Project Structure:

- **Components**: `apps/web/src/components/<Name>.tsx` — one file per name in
  `contracts/component-api.md`
- **Routes**: `apps/web/src/app/[locale]/<page>/page.tsx` (`/` is `app/[locale]/page.tsx`)
- **Content types**: `packages/types/src/content/<domain>.ts` (hand-written, never
  `src/index.ts` — research R6)
- **Content data**: `apps/web/src/content/<domain>.ts` (research R7)
- **Accessors**: `apps/web/src/lib/content/index.ts` — signatures frozen by
  `contracts/content-accessors.md`
- **Strings**: `apps/web/src/messages/en.json` (Tier 3 only — Article 12)
- **Tests**: `apps/web/tests/{unit,e2e,a11y}/`

---

## Phase 1: Setup

**Purpose**: Dependencies and wiring scaffolding, no feature logic yet

- [X] T001 Add `tailwindcss@^4`, its PostCSS plugin, `next-intl`, `react-hook-form`, `zod`,
      `@hookform/resolvers` to `apps/web/package.json`
- [X] T002 [P] Add `tailwindcss@^4` + its PostCSS plugin to `apps/admin/package.json`
      (wiring only — Out of Scope forbids building admin UI this feature)
- [X] T003 [P] Add `@playwright/test`, `@axe-core/playwright`, `lighthouse` to
      `apps/web/package.json`; scaffold `apps/web/playwright.config.ts`
      (research R13)
- [X] T004 [P] Add a `"./content"` subpath export to `packages/types/package.json`
      pointing at `./src/content/index.ts` (research R6)
- [X] T005 [P] Add a `"./content/*"` subpath export to `apps/web/package.json` pointing at
      `./src/content/*.ts`, as a raw-TS-source export mirroring `packages/config`'s existing
      `./eslint/react` pattern (research R7)
- [X] T006 Add `@pascca/web` as a workspace `devDependency` of `apps/api/package.json`,
      scoped in comments to `prisma/seed/` only — never imported from `apps/api/src`
      (research R7, Constitution Check gate 4)
- [X] T007 [P] Correct `packages/types/scripts/generate.ts`'s header comment: its "nothing
      under `src/` is ever hand-written" claim now needs to read "nothing under `src/
      index.ts`" (or equivalent), since `src/content/` is a deliberate, permanent exception
      (research R6)

**Checkpoint**: Dependencies installed, package-level wiring in place. No app code yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Everything every one of the five user stories needs before it can render a real
page — tokens/Tailwind, fonts, hex-literal enforcement, the i18n route shell, content DTOs +
fixtures + accessors, and the site-chrome/primitive/motion components every route uses.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tokens, Tailwind, enforcement (research R1–R3)

- [X] T008 Wire `packages/config/tokens.css` into a Tailwind v4 `@theme` block in
      `apps/web/src/styles/globals.css` — every color/radius/easing/spacing token reachable
      as a Tailwind theme value, zero literal duplication (FR-001, FR-002)
- [X] T009 [P] Wire the same `@theme` mapping into `apps/admin`'s global stylesheet (new
      file, e.g. `apps/admin/src/styles/globals.css`) — no components consume it yet (FR-003)
- [X] T010 [P] Widen `noRawHexColour` in `packages/config/eslint/base.js` to also match a
      hex literal embedded inside a longer string (Tailwind bracket syntax, e.g.
      `"bg-[#d4af37]"`) (research R3, FR-004)
- [X] T011 [P] Write `scripts/check-hex-literals.mjs` (repo root) — scans `apps/web` and
      `apps/admin` source, including `.css` files, for hex/`rgba()`/px-radius/
      `cubic-bezier()` literals outside `tokens.css`; exits non-zero on any match (FR-005)
- [X] T012 Add a `check-hex-literals` step to `.github/workflows/ci.yml`, running
      `node scripts/check-hex-literals.mjs` (FR-005)
- [X] T013 [P] Add a `no-restricted-syntax` (or `react/jsx-no-literals`-based) rule to
      `packages/config/eslint/react.js` that fails on a hardcoded JSX text string, with an
      allowance for values read from `lib/content` or `next-intl`'s `useTranslations` (FR-025)

### Typography (research R4)

- [X] T014 Fetch Zodiak `.woff2` (weights 400/700 + italics) from Fontshare's
      self-hosting-permitted distribution; commit under `apps/web/public/fonts/` (research
      R4, FR-007) — **flagged risk**: requires a real network fetch of the binary files;
      confirm the license terms on the actual response before committing
- [X] T015 In `apps/web/src/styles/globals.css`, declare `@font-face` for Zodiak
      (`font-display: swap`) with a size-adjust-tuned local-fallback stack, and the Arabic
      font stack scoped to `html[lang="ar"]` (FR-007, FR-009)
- [X] T016 [P] Load Plus Jakarta Sans via `next/font/google` in
      `apps/web/src/app/[locale]/layout.tsx` (FR-008)

### i18n / routing shell (research R10, R11)

- [X] T017 In `apps/web/src/app/[locale]/layout.tsx`: add the `arabicEnabled` boolean
      constant (`apps/web/src/lib/i18n/config.ts`, new file) and call `notFound()` when
      `locale === "ar" && !arabicEnabled`; add the skip-to-content link as the first
      focusable element (FR-016, FR-035, research R10)
- [X] T018 [P] In `apps/web/src/middleware.ts`, add `/pasca-menu/` → `/en/menu` 301
      alongside the existing `/` → `/en` redirect (FR-017, research R11) — placeholder only;
      US4 owns the test proving it
- [X] T019 [P] Establish the `apps/web/src/messages/en.json` namespace structure (`nav`,
      `footer`, `forms`, `filters`, `accordion`, `a11y`) with empty string values —
      subsequent component tasks fill in their own keys (FR-024)
- [X] T020 [P] `apps/web/src/app/robots.ts` and `apps/web/src/app/sitemap.ts` using
      Next.js's native conventions, covering all eight routes (FR-047)

### Content DTO types (`packages/types/src/content/`, research R5/R6) — flat `xEn`/`xAr`, matching `schema.prisma` field names exactly

- [X] T021 [P] `packages/types/src/content/menu.ts` — `Category`, `MenuItem` types
      (data-model.md)
- [X] T022 [P] `packages/types/src/content/branch.ts` — `Branch` type
- [X] T023 [P] `packages/types/src/content/page-block.ts` — `PageBlock`, `PageSeo` types
- [X] T024 [P] `packages/types/src/content/marketing.ts` — `Testimonial`, `FaqItem` types
- [X] T025 [P] `packages/types/src/content/about.ts` — `Milestone`, `TeamMember` types
- [X] T026 [P] `packages/types/src/content/gallery.ts` — `GalleryAlbum`, `GalleryImage`,
      shared `ImageTone` type
- [X] T027 `packages/types/src/content/index.ts` — barrel re-exporting T021–T026 (depends on
      all six; not [P])

### Content fixture data (`apps/web/src/content/`, transcribed verbatim from `files/site/`, research R8/R9)

- [X] T028 [P] `apps/web/src/content/menu.ts` — all 8 categories, all dishes, real prices as
      Int piastres (research R9), `isFeatured`/`featuredRank` on the 4 home-page dishes
      (FR-019, depends on T021)
- [X] T029 [P] `apps/web/src/content/branches.ts` — Shobra + Heliopolis, real address/phone/
      hours/map-link from `files/site/branches.html` (FR-019, depends on T022)
- [X] T030 [P] `apps/web/src/content/page-blocks.ts` — every Article-18 section for all
      eight pages, headline/eyebrow/sub/cta text transcribed verbatim; per-page `PageSeo`
      title/description (FR-019, FR-023, FR-046, depends on T023)
- [X] T031 [P] `apps/web/src/content/marketing.ts` — the 3 testimonials
      (`consentGiven: true`) and 9 FAQ items (5 home + 4 reservations) (FR-019, depends on
      T024)
- [X] T032 [P] `apps/web/src/content/about.ts` — 5 milestones, 3 team-role entries (FR-019,
      depends on T025)
- [X] T033 [P] `apps/web/src/content/gallery.ts` — 4 albums, 8 masonry images with their
      `files/site` labels/tones (FR-019, depends on T026)

### Content accessors

- [X] T034 `apps/web/src/lib/content/index.ts` — implement every function in
      `contracts/content-accessors.md` (`getPageBlocks`, `getFeaturedDishes`, `getMenu`,
      `getBranches`, `getTestimonials`, `getFaq`, `getGallery`, `getMilestones`, `getTeam`),
      each reading its matching fixture from T028–T033 (FR-020, depends on T028–T033)
- [X] T035 [P] `apps/web/tests/unit/content-accessors.test.ts` — one assertion per accessor
      that it returns non-empty data for every known key/page and filters
      `Testimonial.consentGiven` correctly

### Site chrome, primitives, motion (used by every route — build once here)

- [X] T036 [P] `apps/web/src/hooks/useFocusTrap.ts` + `apps/web/src/hooks/useScrollLock.ts`
      — shared hooks `MobileNavOverlay` (this phase) and the Lightbox (US4) both consume
      (FR-037)
- [X] T037 [P] `apps/web/src/components/SiteHeader.tsx` — glass nav, sticky/`small` state
      past 60px scroll, nav labels from `messages/en.json`'s `nav` namespace (FR-027)
- [X] T038 [P] `apps/web/src/components/MobileNavOverlay.tsx` — clip-path wipe, focus trap +
      scroll lock via T036, real `<button>`/`aria-expanded`/`aria-controls` (FR-028, FR-036,
      FR-037, depends on T036)
- [X] T039 [P] `apps/web/src/components/MobileCtaBar.tsx` — fixed pill, ≤1100px (Article 17)
- [X] T040 [P] `apps/web/src/components/SiteFooter.tsx`
- [X] T041 [P] `apps/web/src/components/Button.tsx` — `variant`/`size` per
      contracts/component-api.md
- [X] T042 [P] `apps/web/src/components/Eyebrow.tsx`
- [X] T043 [P] `apps/web/src/components/SectionHead.tsx` — `emphasis` prop implements the
      gold-italic-headline convention (FR-011)
- [X] T044 [P] `apps/web/src/components/Lede.tsx` + `apps/web/src/components/FootNote.tsx`
      — `Lede`'s `width` prop maps only to `--w`/`--w70`/`--w60` (FR-041)
- [X] T045 [P] `apps/web/src/components/PageHero.tsx` — reuses the `emphasis` convention
      from T043
- [X] T046 [P] `apps/web/src/components/Grid.tsx` — `cols: 2 | 3 | 4`
- [X] T047 [P] `apps/web/src/components/ImageSlot.tsx` — `ratio`/`tone`/`label`/`badge`
      props; reserves full layout box before any `src` exists (zero CLS, FR-042, FR-043);
      `src`/`alt` props present but unused (FR-013)
- [X] T048 [P] `apps/web/src/components/Panel.tsx` + `apps/web/src/components/SplitPanel.tsx`
- [X] T049 [P] `apps/web/src/components/StatsList.tsx`
- [X] T050 [P] `apps/web/src/components/Reveal.tsx` + `StaggerGroup.tsx` + `EnterGroup.tsx`
      — one-shot `IntersectionObserver` reveal at 12% threshold (FR-029), plain CSS
      transitions only (research R14)
- [X] T051 `apps/web/src/styles/globals.css` — `@media (prefers-reduced-motion: reduce)`
      block disabling `Reveal`/`StaggerGroup`/`EnterGroup`'s transitions at the CSS level
      (partial FR-045; the remaining 4 motion items get their reduced-motion rule when their
      own component ships — US1/Foundational-chrome — and US5 verifies all 7 together)

**Checkpoint**: Foundation ready. Every user story below can now be implemented and demoed
independently.

---

## Phase 3: User Story 1 — Home page renders through the real pipeline (P1) 🎯 MVP

**Goal**: `/` renders every Article-18 home section via real components reading real content
through `lib/content`, proving the token/typography/component/fixture pipeline end-to-end.

**Independent Test**: Load `/en` in a production build; compare against
`files/site/index.html` at all four widths; swap `getFeaturedDishes()` for a stub and confirm
the page changes with no component edit.

### Tests for User Story 1

- [X] T052 [P] [US1] `apps/web/tests/unit/content-seam.test.ts` — SC-008: mock
      `getFeaturedDishes()` to return different fixture data mid-test, render the home page,
      assert the output changed, assert no component file was touched to make it work
- [X] T053 [P] [US1] `apps/web/tests/e2e/home.spec.ts` (Playwright) — asserts the section
      order from spec.md's Acceptance Scenario 1 (Hero → PressStrip → dishes Grid → story
      SplitPanel → breakfast → occasions ValueCards → TestimonialCards → delivery SplitPanel
      → FAQ Accordion → reservation-CTA Panel → SiteFooter → MobileCtaBar)
- [X] T054 [P] [US1] `apps/web/tests/e2e/sticky-nav.spec.ts` — scroll past 60px, assert
      `SiteHeader`'s `small` state (FR-027)

### Implementation for User Story 1

- [X] T055 [P] [US1] `apps/web/src/components/HomeHero.tsx` + `FloatingPlate.tsx` +
      `FloatingBadge.tsx` — hero stats, hover transform via `--spring`, unchanged values
      (FR-032)
- [X] T056 [P] [US1] `apps/web/src/components/PressStrip.tsx`
- [X] T057 [P] [US1] `apps/web/src/components/DishCard.tsx` + `GoldLink.tsx`
- [X] T058 [P] [US1] `apps/web/src/components/ValueCard.tsx`
- [X] T059 [P] [US1] `apps/web/src/components/TestimonialCard.tsx`
- [X] T060 [US1] `apps/web/src/components/Accordion.tsx` + `AccordionItem.tsx` — one open at
      a time, real `<button>` + `aria-expanded`/`aria-controls` (FR-030, FR-036)
- [X] T061 [US1] `apps/web/src/app/[locale]/page.tsx` — assembles every home section via
      T055–T060 + Foundational primitives, reading `getPageBlocks("home")`,
      `getFeaturedDishes()`, `getTestimonials()`, `getFaq("home")`; `generateMetadata()` from
      the `page-blocks` fixture's `PageSeo` entry (FR-046)
- [X] T062 [US1] Same file — add `LocalBusiness`+`Restaurant` JSON-LD (both branches, via
      `getBranches()`) and `FAQPage` JSON-LD (via `getFaq("home")`) (FR-048, FR-049)
- [X] T063 [US1] Same file — wire `messages/en.json`'s `nav`/`footer` keys used by
      `SiteHeader`/`SiteFooter` on this route with real Tier-3 copy (FR-024)
- [X] T064 [US1] `apps/web/tests/e2e/home-visual.spec.ts` — Playwright screenshot comparison
      against `files/site/index.html` at 1440/1024/768/375px (SC-001, this route only)
- [X] T065 [US1] `apps/web/src/styles/globals.css` — `prefers-reduced-motion` rule for the
      plate float/hover and ambient-glow items (T055) (partial FR-045)

**Checkpoint**: `/` is fully functional, visually faithful, and independently demoable.

---

## Phase 4: User Story 2 — Menu filters are shareable and server-renderable (P2)

**Goal**: `/menu` renders all 8 category groups with working, URL-driven, SSR-correct
category/diet filters.

**Independent Test**: Request `/en/menu?filter=fasting` directly (no client nav); the initial
HTML already contains only fasting dishes.

### Tests for User Story 2

- [X] T066 [P] [US2] `apps/web/tests/e2e/menu-filter-ssr.spec.ts` — request
      `/en/menu?filter=pizza` fresh; assert the server-rendered HTML already shows only
      pizza rows, no flash of the full list (FR-031, Edge Cases)
- [X] T067 [P] [US2] `apps/web/tests/e2e/menu-filter-empty.spec.ts` — a filter combination
      matching zero dishes renders the empty state and the live region announces "0" (Edge
      Cases, FR-039)
- [X] T068 [P] [US2] `apps/web/tests/a11y/menu-filters-keyboard.spec.ts` — every `FilterPills`
      button reachable and operable by keyboard alone

### Implementation for User Story 2

- [X] T069 [P] [US2] `apps/web/src/components/MenuRow.tsx` + `Chip.tsx`
- [X] T070 [US2] `apps/web/src/components/FilterPills.tsx` — controlled `value`+`onChange`,
      `resultCount` prop wired to an `aria-live` region announcing the count (FR-014, FR-039)
- [X] T071 [US2] `apps/web/src/app/[locale]/menu/page.tsx` — reads `searchParams.filter`
      server-side (research R12), passes it as `FilterPills`' initial value, renders
      `getMenu()`'s 8 category groups via `MenuRow`; unknown filter values fall back to "all"
      (Edge Cases); `generateMetadata()` from `page-blocks` (FR-046, FR-031)
- [X] T072 [US2] Same file — client-side filter-change handler updates the URL via
      `router.replace` with the new query string, no full navigation
- [X] T073 [US2] Same file — add `Menu`/`MenuItem` JSON-LD via `getMenu()` (FR-049)

**Checkpoint**: `/menu` is fully functional, shareable, and independently demoable alongside
`/`.

---

## Phase 5: User Story 3 — Reservation and contact forms validate and resolve locally (P3)

**Goal**: Both forms validate with React Hook Form + Zod and resolve to local `ResultBox`
states; neither ever makes a network call.

**Independent Test**: Submit the reservation form with party sizes 6 and 8 with devtools'
network panel open — zero requests either time, correct `ResultBox` state each time.

### Tests for User Story 3

- [X] T074 [P] [US3] `apps/web/tests/e2e/reservation-boundary.spec.ts` — party size 6 →
      instant-confirmation `ResultBox`; party size 7 → call-back-required `ResultBox`; assert
      zero network requests both times (FR-034, Edge Cases)
- [X] T075 [P] [US3] `apps/web/tests/e2e/contact-validation.spec.ts` — empty required field
      blocks submission with a Tier-3 message from `messages/en.json`, no request sent
      (FR-033, Edge Cases)

### Implementation for User Story 3

- [X] T076 [P] [US3] `apps/web/src/components/Form.tsx` + `Field.tsx` — RHF provider
      wrapper; `Field` always renders a real, associated `<label>` (FR-040)
- [X] T077 [P] [US3] `apps/web/src/components/ResultBox.tsx` — `idle`/`confirmed`/
      `call-required` states
- [X] T078 [P] [US3] `apps/web/src/lib/validation/reservation.ts` — Zod schema matching
      `files/site/reservations.html`'s fields
- [X] T079 [P] [US3] `apps/web/src/lib/validation/contact.ts` — Zod schema matching
      `files/site/contact.html`'s fields
- [X] T080 [US3] `apps/web/src/app/[locale]/reservations/page.tsx` — how-it-works split +
      `Form`, submits nowhere; party ≤6 → confirmed, >6 → call-required, both with a `TODO`
      referencing F10/F12 (FR-033, FR-034); booking FAQ `Accordion` (reuses T060);
      `generateMetadata()` (FR-046)
- [X] T081 [US3] Same file — add `FAQPage` JSON-LD via `getFaq("reservations")` (FR-049)
- [X] T082 [US3] `apps/web/src/app/[locale]/contact/page.tsx` — contact rail `StatsList` +
      `Form`, submits nowhere, `TODO` referencing F12; branch `BranchCard`s (placeholder
      until US4's `BranchCard` ships — sequence this task after T086 or stub inline);
      `generateMetadata()` (FR-033, FR-046)

**Checkpoint**: `/reservations` and `/contact` are fully functional and independently
demoable.

---

## Phase 6: User Story 4 — Remaining pages and the legacy redirect complete the route set (P4)

**Goal**: `/about`, `/gallery`, `/branches`, `/legal` render their full Article-18 section
order; `/pasca-menu/` 301s to `/menu`.

**Independent Test**: Request all four routes plus `/pasca-menu/`; confirm section order and
the 301.

### Tests for User Story 4

- [X] T083 [P] [US4] `apps/web/tests/e2e/legacy-redirect.spec.ts` — `/pasca-menu/` responds
      301 to `/en/menu` (FR-017)
- [X] T084 [P] [US4] `apps/web/tests/e2e/remaining-pages-order.spec.ts` — asserts each of
      `/about`, `/gallery`, `/branches`, `/legal`'s section order against spec.md's
      Acceptance Scenarios 1–2 and Article 18's table
- [X] T085 [P] [US4] `apps/web/tests/a11y/gallery-lightbox.spec.ts` — opening the lightbox
      traps focus, Escape/outside-click closes it and returns focus to the triggering
      thumbnail (FR-037, Edge Cases)

### Implementation for User Story 4

- [X] T086 [P] [US4] `apps/web/src/components/BranchCard.tsx` + `DetailRows.tsx`
- [X] T087 [P] [US4] `apps/web/src/components/MasonryGrid.tsx` — `onSelect` opens the
      lightbox
- [X] T088 [P] [US4] `apps/web/src/components/Lightbox.tsx` — new component (spec
      Assumptions: not present in `files/site/`'s static HTML); focus trap + scroll lock via
      `useFocusTrap`/`useScrollLock` (T036), follows the `ImageSlot`/`MasonryGrid` visual
      idiom, no new visual design invented (FR-037)
- [X] T089 [US4] `apps/web/src/app/[locale]/about/page.tsx` — story/mosaic/metric section,
      4-item `ValueCard` `Grid`, `StatsList` milestones panel via `getMilestones()`, Team
      `Grid` via `getTeam()`, closing CTA `Panel`; `generateMetadata()` (FR-046)
- [X] T090 [US4] `apps/web/src/app/[locale]/gallery/page.tsx` — album `FilterPills` (reuses
      T070) + `MasonryGrid` + `Lightbox` via `getGallery()`; Instagram CTA `Panel`;
      `generateMetadata()` (FR-046)
- [X] T091 [US4] `apps/web/src/app/[locale]/branches/page.tsx` — two `BranchCard`s via
      `getBranches()`, map `ImageSlot` placeholder, large-groups `SplitPanel`;
      `generateMetadata()` (FR-046)
- [X] T092 [US4] Same file — add `LocalBusiness`+`Restaurant` JSON-LD per branch (FR-048)
- [X] T093 [US4] `apps/web/src/app/[locale]/legal/page.tsx` — privacy notice + terms,
      transcribed verbatim from `files/site/legal.html`; `generateMetadata()` (FR-046)
- [X] T094 [US4] Fill in T082's placeholder `BranchCard` usage in
      `apps/web/src/app/[locale]/contact/page.tsx` now that T086 exists
- [X] T095 [US4] `apps/web/tests/e2e/remaining-pages-visual.spec.ts` — screenshot comparison
      for these four routes against `files/site/` at all four widths (SC-001)

**Checkpoint**: All eight routes exist and are independently demoable; the legacy redirect
works.

---

## Phase 7: User Story 5 — Every route clears the accessibility and motion floor (P5)

**Goal**: Zero axe violations on all eight routes; every control keyboard-operable;
`prefers-reduced-motion: reduce` removes all seven motion-budget items everywhere.

**Independent Test**: Automated a11y audit across all eight routes (zero violations);
keyboard-only pass reaching the accordion, both filter bars, mobile nav, and the lightbox;
`prefers-reduced-motion: reduce` stops every motion item.

### Tests for User Story 5 (Article 30 risk area: a11y)

- [X] T096 [US5] `apps/web/tests/a11y/axe-all-routes.spec.ts` — `@axe-core/playwright`
      against all eight routes (`en` locale), asserts zero violations (SC-005)
- [X] T097 [P] [US5] `apps/web/tests/e2e/keyboard-only.spec.ts` — tabs through each route
      with no mouse, reaches and operates the accordion, mobile nav trigger, both filter
      bars, and the gallery lightbox (SC-005)
- [X] T098 [P] [US5] `apps/web/tests/e2e/reduced-motion.spec.ts` — with
      `prefers-reduced-motion: reduce` emulated, asserts all seven Article 19 items render
      in their end state with no transition/animation, across all eight routes (SC-007,
      Article 30's "reduced-motion snapshot")

### Tests for User Story 5 (Article 30 risk area: i18n)

- [X] T099 [P] [US5] `apps/web/tests/e2e/i18n-routing.spec.ts` — `/ar/*` resolves
      not-found while `arabicEnabled` is `false`; `/` still redirects to `/en`; both locale
      segments are registered per `generateStaticParams` (FR-016, research R10)
- [X] T100 [P] [US5] `apps/web/tests/lint/no-hardcoded-strings.test.ts` — a fixture component
      containing a literal JSX string fails `pnpm --filter @pascca/web lint` (SC-003,
      exercises T013)

### Implementation for User Story 5

- [X] T101 [P] [US5] Audit every icon-only control built in Phases 2–6 (nav burger, close
      ✕, filter icons, accordion arrow) and add any missing `aria-label` (FR-038)
- [X] T102 [P] [US5] `apps/web/src/styles/globals.css` — complete the
      `prefers-reduced-motion` coverage started in T051/T065: clip-path wipe, accordion
      `max-height` transition, filter-pill transition, card-lift/image-scale micro-
      interactions (remaining items of FR-045)
- [X] T103 [US5] Visible-focus and contrast sweep across every component in
      `apps/web/src/components/` — confirm `:focus-visible` is never suppressed and no body
      copy uses `--gold` (grep for `text-gold`/`color:var(--gold)` outside price/display/
      border/icon contexts) (FR-041, Article 28)
- [X] T104 [US5] `apps/web/scripts/lighthouse-check.mjs` — runs `lighthouse` against a
      running production build for all eight routes, fails if any is below 95 perf / 100
      a11y / 100 SEO (SC-006, research R13)
- [X] T105 [US5] Wire `pnpm --filter @pascca/web exec playwright test tests/a11y` and the
      Lighthouse script into `.github/workflows/ci.yml`

**Checkpoint**: All five user stories independently pass; the full feature clears Article 28.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Work that depends on every story being done, or that was explicitly deferred to
avoid blocking any one story's independent testability.

- [X] T106 [P] `apps/api/prisma/seed/branches.ts` — replace its hand-written `Branch` array
      with an import from `@pascca/web/content/branches` (research R7/R8); confirm
      `pnpm --filter @pascca/api test -- seed` still passes (no test pins the old
      placeholder values — research R8)
- [X] T107 [P] `apps/api/prisma/seed/menu.ts` — replace its hand-written `Category`/
      `MenuItem` arrays with an import from `@pascca/web/content/menu` (research R7/R8)
- [X] T108 [P] `apps/api/prisma/seed/gallery.ts` — replace its hand-written data with an
      import from `@pascca/web/content/gallery` (research R7/R8)
- [X] T109 [P] `apps/api/prisma/seed/page-content.ts` — replace its hand-written `PAGES`
      array with an import from `@pascca/web/content/page-blocks` (research R7/R8)
- [X] T110 `pnpm db:reset && pnpm db:seed` — confirm the reconciled seed still produces a
      valid, idempotent seed run (`pnpm --filter @pascca/api test -- seed-idempotency`)
- [X] T111 [P] `apps/web/tests/unit/no-og-image.test.ts` — verification that no route emits
      an `og:image` meta tag pointing at a nonexistent asset (FR-050 — deferral is
      deliberate, not an oversight)
- [X] T112 [P] Full repo-wide run of `node scripts/check-hex-literals.mjs apps/web
      apps/admin` — zero matches, across every component built in Phases 2–7 (SC-002)
- [X] T113 Update `README.md`/`.env.example` if any new env var was introduced (expected:
      none — this feature adds no server-side configuration)
- [X] T114 Definition-of-done gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
      green (Article 31)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — blocks every user story
- **User Stories (Phases 3–7)**: all depend on Foundational; independently implementable
  after that in priority order (P1 → P2 → P3 → P4 → P5) or in parallel if staffed
- **Polish (Phase 8)**: depends on Foundational's content fixtures (T028–T033) for T106–T109;
  T114 depends on every prior phase

### User Story Dependencies

- **US1 (P1)**: Foundational only. No dependency on US2–US5.
- **US2 (P2)**: Foundational only. Independent of US1, US3–US5.
- **US3 (P3)**: Foundational only; T082 (contact page) is easiest done after US4's
  `BranchCard` (T086) exists, but can stub inline if US4 hasn't landed yet — noted in T082.
- **US4 (P4)**: Foundational only. `Accordion` (US1's T060) is reused by US3's booking FAQ,
  not by US4.
- **US5 (P5)**: Functionally depends on US1–US4's routes existing to audit/test against — it
  is correctly last, not because of a hard code dependency but because there is nothing to
  verify a11y/motion floor on until the eight routes exist.

### Within Each User Story

- Tests (where present) are written to fail first, then implementation makes them pass
- Components before the page route that assembles them
- Story complete before moving to the next priority (or run stories in parallel if staffed)

### Parallel Opportunities

- T002–T007 (Setup) are independent of each other
- T008–T051 (Foundational) has three genuinely sequential chains — globals.css edits
  (T008→T015→T051), the content type→data→accessor chain (T021–T026 → T027 → T028–T033 →
  T034), and T036→T038 — everything else marked [P] is a separate file
- Once Foundational is done, US1–US4 can be staffed in parallel by different people; US5
  should start once at least a few routes exist to give its audits something real to check,
  ideally after US1–US4

---

## Parallel Example: Foundational content fixtures

```bash
# Six independent type-definition files:
Task: "packages/types/src/content/menu.ts — Category, MenuItem types"
Task: "packages/types/src/content/branch.ts — Branch type"
Task: "packages/types/src/content/page-block.ts — PageBlock, PageSeo types"
Task: "packages/types/src/content/marketing.ts — Testimonial, FaqItem types"
Task: "packages/types/src/content/about.ts — Milestone, TeamMember types"
Task: "packages/types/src/content/gallery.ts — GalleryAlbum, GalleryImage, ImageTone types"
```

## Parallel Example: User Story 1 components

```bash
Task: "apps/web/src/components/HomeHero.tsx + FloatingPlate.tsx + FloatingBadge.tsx"
Task: "apps/web/src/components/PressStrip.tsx"
Task: "apps/web/src/components/DishCard.tsx + GoldLink.tsx"
Task: "apps/web/src/components/ValueCard.tsx"
Task: "apps/web/src/components/TestimonialCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (the largest phase — tokens, fonts, i18n shell, content seam, site
   chrome — this is genuinely most of the feature's real weight)
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: `/` is real, visually faithful, and the content seam is provably
   real (T052)
5. Demo

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → demo `/` (MVP)
3. US2 → demo `/menu` alongside `/`
4. US3 → demo the two forms
5. US4 → demo the full eight-route set + legacy redirect
6. US5 → demo a clean axe/keyboard/reduced-motion pass across everything
7. Polish → seed reconciliation, full DoD gate

### Parallel Team Strategy

Once Foundational is done: Developer A takes US1, Developer B takes US2, Developer C takes
US3, Developer D takes US4 (coordinate on T082/T086/T094's small cross-story sequencing note
above); US5 and Polish are best done by whoever finishes first, once ≥2 stories exist to
audit.

---

## Notes

- [P] tasks touch different files with no incomplete dependency
- Every content string in a fixture (T028–T033) is transcribed from `files/site/`, not
  reworded — the Governing Rule applies to data tasks as much as component tasks
- Commit after each task or logical group
- Verify a test fails before implementing what makes it pass, where a test task precedes its
  implementation task
- The two genuinely open risks from plan.md's Constitution Check carry into T014 (Zodiak
  binary fetch) and T111 (confirming the OG-image deferral is deliberate, not silently
  dropped) — do not close either without addressing what plan.md flagged
