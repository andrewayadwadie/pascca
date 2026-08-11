# Feature Specification: Web Design System Port

**Feature Branch**: `004-web-design-system-port`
**Created**: 2026-08-11
**Status**: Draft
**Input**: User description: "Port the approved static website in files/site/ into apps/web as the Next.js foundation
and design system. This is an extraction, not a redesign.

GOVERNING RULE
The HTML and CSS in files/site/ are the specification. Reproduce them faithfully. Do not
reinterpret spacing, sizing, colour, easing or copy. Do not add sections, remove sections,
or reorder them — Article 18 fixes the section order of all eight pages and changing it
requires client sign-off. If something in files/site/ appears to conflict with the
constitution, stop and report the conflict rather than resolving it yourself.

1. DESIGN TOKENS
Move the :root block from files/site/assets/style.css into packages/config/tokens.css
verbatim — every surface, accent, ink, geometry and motion variable, unchanged. Wire it into
the Tailwind theme in apps/web so tokens are reachable as theme values, and do the same for
apps/admin so both apps consume one file.

After this, no raw hex, rgba, px radius or cubic-bezier may appear anywhere in apps/web or
apps/admin outside tokens.css. Tailwind arbitrary values containing colour literals are
forbidden. Add a CI check that greps for hex literals outside tokens.css and fails the build.

2. TYPOGRAPHY
Remove the Fontshare and Google Fonts <link> tags. Self-host Zodiak as woff2 in
apps/web/public/fonts with font-display: swap and a size-adjust-tuned local fallback so
there is no layout shift on swap. Load Plus Jakarta Sans through next/font. Declare the
Arabic stack bound to html[lang="ar"] even though Arabic is off — Article 21.

3. COMPONENT EXTRACTION
Every repeated CSS class becomes one typed React component. Use exactly these names so the
later features can refer to them:

  CSS in files/site          -> component
  nav / #ov / .brg           -> SiteHeader, MobileNavOverlay
  .mcta                      -> MobileCtaBar
  footer / .fc / .fbar       -> SiteFooter
  .btn .btn-w .btn-g .btn-o  -> Button   variant: white | gold | outline, size: md | sm
  .lbl                       -> Eyebrow
  .shead                     -> SectionHead   props: eyebrow, headline, lede
  .lede / .note              -> Lede, FootNote
  .phero / .crumb            -> PageHero      props: crumb, headline, lede
  .hero .stage .halo .plate .badge -> HomeHero, FloatingPlate, FloatingBadge
  .ph .ph-warm…ph-cream .tag -> ImageSlot     props: ratio, tone, label, badge
  .grid-2 .grid-3 .grid-4    -> Grid          props: cols
  .dish / .link-g            -> DishCard, GoldLink
  .mrow / .chip              -> MenuRow, Chip
  .filters                   -> FilterPills   controlled, value + onChange
  .panel .panel-glow .split  -> Panel, SplitPanel
  .stats-list                -> StatsList
  .val                       -> ValueCard
  .rc .st .who .av           -> TestimonialCard
  .br .rows .row .acts       -> BranchCard, DetailRows
  .frm .f .ok                -> Form, Field, ResultBox
  .q                         -> Accordion, AccordionItem
  .masonry .m-a…m-h          -> MasonryGrid
  .press                     -> PressStrip
  .rv .stagger .enter        -> Reveal, StaggerGroup, EnterGroup

The headline pattern where half the line is gold italic (<em>) is a prop on the component,
not raw HTML passed in from the page.

4. ROUTES
App Router under apps/web/src/app/[locale]/ with en default and ar registered but gated
behind the arabicEnabled flag. Routes: / , /menu , /about , /gallery , /branches ,
/reservations , /contact , /legal. Legacy /pasca-menu/ 301-redirects to /menu (Article 22).

5. CONTENT FIXTURES — the seam that makes F13–F15 cheap
Do NOT hardcode copy in components. Define the content DTO types in packages/types, shaped
exactly as the future API responses in Articles 10 and 12 — enveloped, with _en and _ar
fields on every content string even though only _en is populated now.

Create apps/web/src/content/*.ts holding the real copy, dishes, branches, testimonials, FAQ,
milestones, team, gallery albums and page blocks lifted from files/site/. Every page reads
through a function in apps/web/src/lib/content/ — getPageBlocks(page), getFeaturedDishes(),
getMenu(), getBranches(), getTestimonials(), getFaq(page), getGallery(album) — each of which
today returns the fixture and later becomes a fetch. Pages must not import fixtures directly.

Export these fixtures so apps/api/prisma/seed.ts can import them. The website and the seed
must never diverge.

Where PageBlock content is missing, the Block component falls back to the seeded default
rather than rendering empty (Article 12).

6. STRINGS AND DIRECTION — Article 21
No literal user-facing string in any component. Nav labels, form labels, button micro-copy,
validation and error messages are Tier 3 and go to messages/en.json. Editorial copy is
content and goes to the fixtures. Add an eslint rule that fails the build on hardcoded
strings in JSX.

Layout uses logical properties only — margin-inline-start, padding-block, inset-inline-end,
text-align: start. Any left/right in a layout context is a violation; files/site/ is already
written this way, keep it.

7. BEHAVIOUR — port files/site/assets/app.js to React
Sticky nav on scroll · mobile overlay with clip-path wipe · IntersectionObserver reveal,
one-shot at 12% · accordion with one item open at a time · menu category and diet filters
with the active filter reflected in the URL as a query parameter so a filtered menu is
shareable and server-renderable · the floating plate hover transform.

The reservation and contact forms are built with React Hook Form and Zod but SUBMIT NOWHERE.
Render the two success states — instant confirmation for parties of six or fewer, call-back
state above six — from local state, with a TODO comment referencing F10 and F12. Do not
invent an endpoint and do not fake a network call.

8. ACCESSIBILITY UPGRADES ON TOP OF THE HTML
The static build is a demo; the ported version must clear Article 28. Add: a skip-to-content
link; real button semantics with aria-expanded and aria-controls on the accordion and the
mobile nav; a focus trap and scroll lock in the overlay and the gallery lightbox; visible
focus on every interactive element; aria-label on every icon-only control; live-region
announcement of filter result counts; and a real <label> for every field.

Body copy uses --w, --w70 or --w60. Gold is permitted only for large display text, prices,
borders and icons — never body copy (Article 28).

9. IMAGES
ImageSlot renders the designed placeholder today — correct aspect ratio, tone and label,
never a broken icon — and is written so that swapping to next/image later is a prop change,
not a rewrite. Reserve layout space so CLS is zero now and stays zero once real photography
lands (Article 20).

10. MOTION
Port exactly the budget in Article 19 and nothing more. Everything disabled under
prefers-reduced-motion.

OUT OF SCOPE
Do not build the admin dashboard. Do not call any API. Do not add a blog route. Do not
enable Arabic. Do not add analytics, cookie banners, chat widgets or a newsletter provider.
Do not improve the design.

ACCEPTANCE
- All eight routes render and are visually indistinguishable from files/site/ at 1440, 1024,
  768 and 375 widths.
- grep for hex literals outside tokens.css returns nothing.
- A hardcoded JSX string fails lint.
- Zodiak loads from /fonts with no CDN request in the network panel.
- axe reports zero violations on all eight routes; keyboard-only navigation reaches and
  operates every control including the accordion, filters and lightbox.
- Lighthouse mobile >=95 performance, 100 accessibility, 100 SEO on a production build.
- prefers-reduced-motion: reduce removes all animation.
- Swapping one getX() implementation to a stub returning different data changes the page
  with no component edits — proving the seam works."

**Conflict check**: files/site/ was verified page-by-page against Article 18's section-order
table and byte-compared against Article 16's token block before writing this spec. No
conflicts found — the static build already uses logical CSS properties, the exact token
values, and the exact section order the constitution requires. Nothing here needed to be
reported and stopped on.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Home page renders through the real pipeline (Priority: P1)

A visitor opens the site's home route and sees the same hero, press strip, signature dishes,
story panel, breakfast band, occasions, testimonials, delivery band, FAQ and reservation CTA
that files/site/index.html shows — now served by Next.js, styled from packages/config/tokens.css,
built from typed components, and reading its copy through a content accessor instead of
hardcoded JSX.

**Why this priority**: This is the smallest slice that proves every foundational piece works
together — token pipeline, self-hosted type, the component set, the content-fixture seam, and
i18n route scaffolding. Every other page reuses exactly what this one proves out.

**Independent Test**: Load `/` (locale `en`) in a production build; compare it against
files/site/index.html at 1440/1024/768/375px; confirm no hex/rgba/px-radius/cubic-bezier
literal exists in the rendered component source outside tokens.css; confirm the page's copy
changes when `getFeaturedDishes()`/`getPageBlocks('home')` are swapped for a stub.

**Acceptance Scenarios**:

1. **Given** a production build of apps/web, **When** a visitor requests `/`, **Then** the
   response renders SiteHeader, HomeHero (with FloatingPlate and FloatingBadge), PressStrip,
   a signature-dishes Grid of DishCard, the story SplitPanel, breakfast band, occasions
   ValueCard grid, TestimonialCard grid, delivery SplitPanel, FAQ Accordion and reservation-CTA
   Panel, in that order, followed by SiteFooter and MobileCtaBar.
2. **Given** the page has loaded, **When** the visitor scrolls past 60px, **Then** SiteHeader
   switches to its "small"/sticky presentation exactly as `#nv.small` does in files/site/.
3. **Given** `getFeaturedDishes()` is swapped for a stub returning different dish data,
   **When** the page re-renders, **Then** the displayed dishes change and no component file
   needed editing.

---

### User Story 2 - Menu filters are shareable and server-renderable (Priority: P2)

A visitor opens `/menu`, filters by category (e.g. pizza) or diet (fasting/vegetarian) using
FilterPills, and the resulting URL can be copied, pasted into a new tab, and reopens to the
same filtered view — even before client JavaScript has run.

**Why this priority**: The menu is job #2 in Article 1's priority list and is the one page
whose interaction pattern (URL-driven, SSR-safe filtering) is structurally different from a
static reveal-on-scroll page; proving it here de-risks the same pattern's reuse on `/gallery`.

**Independent Test**: Request `/menu?filter=fasting` directly (no client-side navigation);
confirm the server-rendered HTML already contains only fasting-marked MenuRow items, in the
same category-group order as files/site/menu.html, with prices visible on every row.

**Acceptance Scenarios**:

1. **Given** `/menu` with no filter, **When** the visitor clicks the "Pizza" pill, **Then**
   only `data-cat="pizza"`-equivalent MenuRow items remain visible, the URL gains a `filter`
   query parameter, and a live region announces the new visible count.
2. **Given** a URL containing `?filter=pizza`, **When** the page is requested fresh (SSR),
   **Then** the initial HTML already reflects the pizza-only filter — no flash of the full,
   unfiltered list.
3. **Given** a filter combination that matches zero dishes, **When** it is applied, **Then**
   the page shows an explicit empty state and the live region announces "0" results, never a
   blank scroll area.

---

### User Story 3 - Reservation and contact forms validate and resolve locally (Priority: P3)

A visitor fills in the reservation form and submits it. For a party of six or fewer they see
an instant confirmation state; for a party of seven or more they see the call-back-required
state. Neither form contacts a network endpoint. The same pattern applies to the contact form
on `/contact`.

**Why this priority**: Reservations and the contact channel are jobs #3 and #4 in Article 1.
This story proves the form/validation/local-state seam that a later booking feature (F10/F12)
will replace with a real submission, without this port inventing an endpoint.

**Independent Test**: Submit the reservation Form with `Field` values for party size 6, then
again with 8, with browser devtools' network panel open; confirm zero outgoing requests both
times and the correct ResultBox state each time; submit with a required field empty and
confirm Zod blocks submission with a message sourced from messages/en.json.

**Acceptance Scenarios**:

1. **Given** the reservation form is filled with party size 6, **When** submitted, **Then**
   ResultBox shows the instant-confirmation copy and no request is sent.
2. **Given** the reservation form is filled with party size 7, **When** submitted, **Then**
   ResultBox shows the call-back-required copy and no request is sent.
3. **Given** the contact form's message field is left empty, **When** submit is attempted,
   **Then** Zod validation prevents submission and shows a Tier‑3 validation message.

---

### User Story 4 - The remaining pages and the legacy redirect complete the route set (Priority: P4)

A visitor can reach `/about`, `/gallery`, `/branches`, and `/legal`, each reproducing its
files/site/ section order exactly; a visitor or an old QR code hitting `/pasca-menu/` lands on
`/menu` via a 301, never a 404.

**Why this priority**: Completes Article 18's eight-page inventory and Article 22's redirect
requirement. Lower priority than US1–US3 because it reuses components those stories already
prove out — about/gallery/branches are compositions of the same primitives, not new behaviour.

**Independent Test**: Request all four remaining routes plus `/pasca-menu/`; confirm each
renders its full section list from Article 18's table in order, and that `/pasca-menu/`
responds with a 301 to `/menu`.

**Acceptance Scenarios**:

1. **Given** `/about`, **When** requested, **Then** it renders PageHero, the story/mosaic/metric
   section, a 4-item ValueCard Grid, the Milestones StatsList panel, the Team Grid, and the
   closing CTA panel, in that order.
2. **Given** `/gallery`, **When** requested, **Then** it renders PageHero, album FilterPills,
   MasonryGrid, and the Instagram CTA panel, in that order.
3. **Given** a request to `/pasca-menu/`, **When** it resolves, **Then** the response is an
   HTTP 301 to `/menu`.

---

### User Story 5 - Every route clears the accessibility and motion floor (Priority: P5)

A keyboard-only or screen-reader visitor can reach and operate every control on every route —
including the accordion, the menu/gallery filters, and the new gallery lightbox — and any
visitor with `prefers-reduced-motion: reduce` set sees no animation anywhere on the site.

**Why this priority**: Article 28 is an [NN] quality floor that applies to all eight pages at
once; it is listed last only because it is verified across the full route set built by US1–US4,
not because it is optional — a route that fails this story is not done regardless of visual
fidelity.

**Independent Test**: Run an automated accessibility audit against all eight routes (must
report zero violations); tab through each route with a mouse disconnected and confirm the
accordion, both filter bars, the mobile nav overlay and the gallery lightbox are all operable;
enable `prefers-reduced-motion: reduce` and confirm every one of the seven Article 19 motion
items stops animating.

**Acceptance Scenarios**:

1. **Given** keyboard-only navigation, **When** the visitor tabs to the accordion trigger and
   presses Enter/Space, **Then** the panel opens, `aria-expanded` flips to `true`, and the
   panel is reachable via `aria-controls`.
2. **Given** the mobile nav overlay is open, **When** the visitor presses Tab repeatedly,
   **Then** focus stays trapped inside the overlay until it is closed, and Escape closes it.
3. **Given** `prefers-reduced-motion: reduce` is set, **When** any route loads and is scrolled,
   **Then** the hero stagger, plate float/hover, ambient glow, scroll reveal, staggered
   entrance, accordion transition and micro-interactions all render in their end state with no
   animation.

---

### Edge Cases

- A `?filter=` query value that matches no known category or diet key is treated as "all",
  not a crash or a blank page.
- A filter combination matches zero menu rows: the empty state renders and the live region
  announces "0", instead of leaving a blank scroll area.
- A visitor requests an `ar`-prefixed route while `arabicEnabled` is false: the response does
  not silently render the English page under an Arabic URL — it resolves as not-found/redirect
  per the flag, consistent with Article 21's "registered but disabled" model.
- Client JavaScript fails to load or is disabled: `/menu?filter=pizza` still server-renders the
  pizza-only subset, because the filter state is read from the URL on the server, not applied
  only after hydration.
- `prefers-reduced-motion: reduce` is set: all seven Article 19 motion items are fully
  disabled (not merely shortened) on every route.
- Reservation party size is exactly 6 vs exactly 7: 6 takes the instant-confirmation path, 7
  takes the call-back path — the boundary is inclusive on the "six or fewer" side per the
  input's own wording.
- A `getPageBlocks(page)` call returns no data for a given block key: the `<Block>` component
  renders the fixture's seeded default for that block, never an empty gap in the page's fixed
  section order.
- The gallery lightbox is opened from a MasonryGrid image and then closed (Escape or outside
  click): focus returns to the thumbnail that opened it, not lost to `<body>`.
- A reservation or contact form is submitted with a required field empty: Zod validation
  blocks submission client-side; no partial network call is attempted because none exists.
- The mobile CTA bar and the mobile nav overlay are both eligible to show at the same
  viewport width (≤1100px): they must not visually collide or fight for the same fixed
  screen region, matching files/site/'s existing z-index/positioning relationship.

## Requirements *(mandatory)*

### Functional Requirements

**Design tokens (Article 16)**

- **FR-001**: The `:root` token block MUST be moved from `files/site/assets/style.css` into
  `packages/config/tokens.css` verbatim — every surface, accent, ink, geometry and motion
  variable, with unchanged values.
- **FR-002**: apps/web's Tailwind theme MUST expose every token (colors, radii, easing,
  spacing) as a theme value so components consume it through Tailwind, not a literal.
- **FR-003**: apps/admin MUST consume the same `packages/config/tokens.css` file — one token
  source for both apps, no duplicated token definitions.
- **FR-004**: No file under `apps/web` or `apps/admin`, other than `tokens.css` itself, MAY
  contain a raw hex color, an `rgba()` literal, a pixel radius literal, or a `cubic-bezier()`
  literal. A Tailwind arbitrary-value utility containing a color literal (e.g. `bg-[#d4af37]`)
  is forbidden under the same rule.
- **FR-005**: CI MUST run an automated check that scans `apps/web` and `apps/admin` source for
  hex-literal patterns outside `tokens.css` and fails the build if any are found.

**Typography (Articles 16, 21)**

- **FR-006**: The Fontshare and Google Fonts `<link>` tags MUST be removed; the production
  build MUST issue no request to a third-party font host.
- **FR-007**: Zodiak MUST be self-hosted as woff2 under `apps/web/public/fonts`, loaded with
  `font-display: swap` and a size-adjust-tuned local fallback so the font swap causes no
  layout shift.
- **FR-008**: Plus Jakarta Sans MUST be loaded through `next/font`.
- **FR-009**: An Arabic font stack MUST be declared and scoped to `html[lang="ar"]`, even
  though Arabic routes remain gated off.

**Component extraction (Article 17)**

- **FR-010**: Every CSS pattern in the mapping table (SiteHeader, MobileNavOverlay,
  MobileCtaBar, SiteFooter, Button, Eyebrow, SectionHead, Lede, FootNote, PageHero, HomeHero,
  FloatingPlate, FloatingBadge, ImageSlot, Grid, DishCard, GoldLink, MenuRow, Chip,
  FilterPills, Panel, SplitPanel, StatsList, ValueCard, TestimonialCard, BranchCard,
  DetailRows, Form, Field, ResultBox, Accordion, AccordionItem, MasonryGrid, PressStrip,
  Reveal, StaggerGroup, EnterGroup) MUST exist as exactly one typed React component under that
  name, reused by every route that needs it rather than re-implemented per page.
- **FR-011**: The gold-italic-half-headline pattern MUST be a component prop, never raw `<em>`
  markup passed in from a page.
- **FR-012**: `Button` MUST expose `variant: white | gold | outline` and `size: md | sm`.
- **FR-013**: `ImageSlot` MUST accept `ratio`, `tone`, `label` and `badge` props, structured so
  that switching its render path to `next/image` is a prop change, not a rewrite.
- **FR-014**: `FilterPills` MUST be a controlled component (`value` + `onChange`), used
  identically for the menu category/diet filter and the gallery album filter.

**Routes (Articles 21, 22)**

- **FR-015**: App Router routes MUST exist under `apps/web/src/app/[locale]/` for `/`, `/menu`,
  `/about`, `/gallery`, `/branches`, `/reservations`, `/contact`, `/legal`, serving `en` as the
  default locale.
- **FR-016**: The `ar` locale MUST be registered in routing configuration but MUST NOT render
  a page while `arabicEnabled` is false.
- **FR-017**: `/pasca-menu/` MUST respond with an HTTP 301 redirect to `/menu`.

**Content fixtures and the fetch seam (Articles 3, 10, 12)**

- **FR-018**: Content DTO types MUST be defined in `packages/types`, shaped to match the
  future API's enveloped response format, with an English and an Arabic variant of every
  user-facing content field — using the flat `xEn`/`xAr` field-suffix convention the real
  Prisma schema already uses (e.g. `nameEn`/`nameAr`, `quoteEn`/`quoteAr`), not a nested
  object — so a future fetch-based implementation needs no reshaping (only `xEn` populated
  today; see research.md R5).
- **FR-019**: `apps/web/src/content/*.ts` MUST hold the real copy, dishes, branches,
  testimonials, FAQ, milestones, team members, gallery albums and page blocks transcribed
  from `files/site/`, unchanged from the source.
- **FR-020**: `apps/web/src/lib/content/` MUST expose one accessor per content domain —
  `getPageBlocks(page)`, `getFeaturedDishes()`, `getMenu()`, `getBranches()`,
  `getTestimonials()`, `getFaq(page)`, `getGallery(album)` — each backed by the fixture today.
- **FR-021**: No file under `apps/web/src/app` or `apps/web/src/components` MAY import a
  content fixture module directly; every read MUST go through `lib/content`.
- **FR-022**: `apps/api/prisma/seed.ts` MUST import these same fixture modules, so the seed
  data and the site content cannot diverge.
- **FR-023**: The `<Block>` component (Tier‑2 PageBlock renderer) MUST fall back to the
  fixture's seeded default whenever a requested block's content is empty; it MUST NOT render
  an empty section.

**Strings and direction (Article 21)**

- **FR-024**: Every Tier‑3 chrome string (nav labels, form labels, button micro-copy,
  validation and error messages) MUST live in `messages/en.json`; no component may contain a
  literal user-facing string.
- **FR-025**: An ESLint rule MUST fail the build on a hardcoded JSX string.
- **FR-026**: All layout styling MUST use logical CSS properties only (`margin-inline-start`,
  `padding-block`, `inset-inline-end`, `text-align: start`, etc.); no `left`/`right` physical
  property may appear in a layout context.

**Behaviour (Article 19, plus the reservation/contact seam)**

- **FR-027**: `SiteHeader` MUST switch to its sticky/"small" presentation once the page has
  scrolled past the same 60px threshold `files/site/assets/app.js` uses.
- **FR-028**: `MobileNavOverlay` MUST open/close via a clip-path wipe, matching the trigger and
  close affordances of `#bg`/`#cx`, and MUST lock body scroll while open.
- **FR-029**: `Reveal`/`StaggerGroup`/`EnterGroup` elements MUST animate in exactly once via an
  `IntersectionObserver` at a 12% threshold and MUST NOT re-trigger on subsequent scroll.
- **FR-030**: `Accordion` MUST allow exactly one `AccordionItem` open at a time, closing any
  previously open item when a new one opens.
- **FR-031**: The menu page's category/diet `FilterPills` state MUST be reflected in the URL
  as a query parameter, MUST be shareable, and MUST be correct on a fresh server-rendered load
  of that URL.
- **FR-032**: `FloatingPlate` MUST reproduce the existing hover transform (translate, rotate,
  scale via `--spring`) with unchanged values.
- **FR-033**: The reservation and contact forms MUST be built with React Hook Form and Zod,
  MUST validate client-side, and MUST submit to no endpoint — no network call may be made and
  no endpoint may be invented.
- **FR-034**: Submitting the reservation form with party size ≤ 6 MUST render the
  instant-confirmation `ResultBox` state from local state; party size > 6 MUST render the
  call-back-required state; both MUST carry a `TODO` comment referencing F10/F12.

**Accessibility upgrades (Article 28)**

- **FR-035**: A skip-to-content link MUST be the first focusable element on every route.
- **FR-036**: The accordion trigger and the mobile-nav trigger MUST use real `<button>`
  semantics with `aria-expanded` and `aria-controls` wired to the panel each controls.
- **FR-037**: The mobile nav overlay and the gallery lightbox MUST each trap focus while open,
  restore focus to the triggering element on close, and lock body scroll while open.
- **FR-038**: Every interactive element MUST show a visible focus indicator; every icon-only
  control MUST carry an `aria-label`.
- **FR-039**: Changing the menu filter or the gallery album filter MUST announce the resulting
  item count through an ARIA live region.
- **FR-040**: Every form field MUST have a real, programmatically associated `<label>`.
- **FR-041**: Body copy MUST use only the `--w`, `--w70` or `--w60` ink tokens; gold MAY be
  used only for large display text, prices, borders and icons — never for a body-copy text
  node.

**Images (Article 20)**

- **FR-042**: `ImageSlot` MUST render the designed placeholder (correct aspect ratio, tone,
  label) for every image slot on every route; it MUST NOT render a broken-image icon or an
  empty box.
- **FR-043**: Every `ImageSlot` MUST reserve its full layout box (aspect-ratio or explicit
  sizing) before any real image asset exists, so CLS from that slot is zero now and stays zero
  once real photography replaces the placeholder.

**SEO and structured data (Article 22)** — added during planning: the input's Section 4 covered
the legacy redirect but not the rest of Article 22 [NN]'s "required on every deploy" list,
which nonetheless binds this feature the moment its eight routes become real, deployable pages.

- **FR-046**: Every route MUST render a unique per-page `<title>` and meta description, sourced
  from the fixture data shaped like the real `PageSeo` model (`titleEn`, `descriptionEn`).
- **FR-047**: `robots.txt` and `sitemap.xml` MUST be generated via Next.js's native
  `app/robots.ts`/`app/sitemap.ts` conventions — never a hand-written static file.
- **FR-048**: `/branches` and `/` MUST emit `LocalBusiness` + `Restaurant` JSON-LD per branch
  (address, geo coordinates, hours, phone, `servesCuisine`, `priceRange`), sourced from the
  `Branch` fixture.
- **FR-049**: `/menu` MUST emit `Menu`/`MenuItem` JSON-LD sourced from the `Category`/
  `MenuItem` fixtures; the FAQ blocks on `/` and `/reservations` MUST emit `FAQPage` JSON-LD
  sourced from the `FaqItem` fixture.
- **FR-050**: OG image generation (`next/og`) is explicitly out of scope for this feature (see
  Assumptions) — every route still carries correct title/description metadata (FR-046) with no
  tag pointing at a broken or placeholder image asset.

**Motion (Article 19)**

- **FR-044**: Only the seven Article 19 motion-budget items MAY be implemented; no additional
  animation (parallax, scroll-jacking, cursor trail, page-transition overlay) may be added.
- **FR-045**: `@media (prefers-reduced-motion: reduce)` MUST disable every one of the seven
  motion-budget items, site-wide.

### Always-On Requirements

These come from the constitution and apply to every feature. State how this feature satisfies
each, or `N/A` with a reason — do not delete the rows.

- **AR-001** (Art 3): Editorial content (copy, dishes, branches, testimonials, FAQ,
  milestones, team, gallery albums, page blocks) is DB-backed *in principle* from day one of
  this port — it is expressed through the same DTO shapes and accessor functions
  (`getPageBlocks`, `getMenu`, etc.) that a later fetch-based implementation will use with zero
  component changes (FR-018–FR-023, SC-008). The database itself is not written to by this
  feature (see Out of scope by Article 1 below); today's accessors are fixture-backed.
- **AR-002** (Art 4): N/A for this feature — no `apps/api` endpoint is called, added, or
  changed. The content-accessor seam (FR-020) is the explicit preparation for that call to
  become real in a future feature without touching a page or component.
- **AR-003** (Art 21): Every Tier‑3 string exists in `messages/en.json` (FR-024); every
  content string carries `_en`/`_ar` fields (FR-018); the `ar` locale is registered and routed
  but gated behind `arabicEnabled` (FR-016); layout uses logical properties only (FR-026); the
  Arabic font stack is declared and scoped to `html[lang="ar"]` (FR-009) — all surfaces covered
  since this feature is the entire public website.
- **AR-004** (Art 10): No new error code is introduced — this feature calls no API and persists
  no data. The one failure mode it does define, an unfilled required form field, is a
  client-side Zod validation failure with no network round trip, not an API error code.
- **AR-005** (Art 14): N/A — this feature has no authenticated surface and no role-gated
  action. Every route and control here is public.
- **AR-006** (Art 15): N/A — no mutation, no soft delete, no `AuditLog` write. The forms in
  this feature submit nowhere (FR-033).
- **AR-007** (Art 28): Skip link, real button semantics with `aria-expanded`/`aria-controls`,
  focus trap and scroll lock in the mobile overlay and gallery lightbox, visible focus on every
  interactive element, `aria-label` on icon-only controls, live-region filter-count
  announcements, and a real `<label>` on every field (FR-035–FR-041); gold restricted to
  display/price/border/icon use only (FR-041).

### Key Entities *(include if feature involves data)*

These are the content-fixture DTO shapes this feature defines in `packages/types` and
populates in `apps/web/src/content/`. Field names deliberately match
`apps/api/prisma/schema.prisma`'s already-shipped Tier 1/2 models exactly (flat `xEn`/`xAr`
suffixes, not a nested object — corrected during planning, see research.md R5) so a future
API-backed implementation can replace the fixture without reshaping a single consuming
component's props.

- **PageBlock**: `page`, `block` (section key), `headlineEn`/`headlineAr`,
  `eyebrowEn`/`eyebrowAr`, `subEn`/`subAr`, `ctaLabelEn`/`ctaLabelAr`, `ctaHref`. Falls back
  to its seeded default when empty (FR-023).
- **MenuItem** (fixture-level "Dish"): `slug`, `categorySlug`, `nameEn`/`nameAr`,
  `descriptionEn`/`descriptionAr`, `price` (Int, piastres — research R9), `isFasting`,
  `isVegetarian`, `isFeatured`, `featuredRank`, `imageSlot` (`ratio`, `tone`, `label`).
- **Category**: `slug`, `nameEn`/`nameAr`, `sortOrder` — drives the menu's category groups and
  `FilterPills` options.
- **Branch**: `slug`, `nameEn`/`nameAr`, `addressEn`/`addressAr`, `phone`, hours, map
  coordinates, stat/badge fields (rating, delivery area, etc.) as shown on `/branches` and
  `/contact`.
- **Testimonial**: `author`, `source`, `rating`, `quoteEn`/`quoteAr`, `branchSlug`,
  `consentGiven` — every fixture entry carries `consentGiven: true`, matching Article 13.
- **FaqItem**: `page`, `questionEn`/`questionAr`, `answerEn`/`answerAr`, `sortOrder`.
- **Milestone**: `year`, `titleEn`/`titleAr`, `descriptionEn`/`descriptionAr`, badge value.
- **TeamMember**: `slug`, `roleEn`/`roleAr`, `bioEn`/`bioAr`, `imageSlot`.
- **GalleryAlbum** / **GalleryImage**: album `slug`/`titleEn`/`titleAr`; images with `tone`,
  `label`, optional `badge`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 1440, 1024, 768 and 375px widths, all eight routes are visually
  indistinguishable from their `files/site/` counterparts — same spacing, sizing, colour and
  copy.
- **SC-002**: A search of the built `apps/web` and `apps/admin` source for hex-color literals
  outside `tokens.css` returns zero matches.
- **SC-003**: Introducing one hardcoded user-facing string into a component fails the lint
  step.
- **SC-004**: Loading any of the eight routes in a production build issues zero network
  requests to a third-party font host; Zodiak is served from `/fonts`.
- **SC-005**: An automated accessibility audit reports zero violations on all eight routes,
  and every control — including the accordion, both filter bars and the gallery lightbox — is
  reachable and operable using only a keyboard.
- **SC-006**: A production build scores ≥95 performance, 100 accessibility and 100 SEO on a
  mobile audit of each of the eight routes.
- **SC-007**: Enabling `prefers-reduced-motion: reduce` removes all animation across all eight
  routes.
- **SC-008**: Replacing one `getX()` accessor's implementation with a stub returning different
  fixture data changes that page's rendered output with zero edits to any component file.
- **SC-009**: Every one of the eight routes has a unique title and meta description, valid
  `LocalBusiness`/`Restaurant`/`Menu`/`FAQPage` JSON-LD wherever Article 22 requires it, and a
  generated (not hand-written) `robots.txt`/`sitemap.xml`.

## Assumptions

- `arabicEnabled` ships as a simple boolean flag in code (no `SiteSetting` database row yet,
  since this feature touches no database) — flipping it on later is the "content-entry task,
  never a rebuild" Article 21 describes; the flag mechanism itself is delivered now.
- The gallery lightbox does not exist in `files/site/`'s static HTML; it is a new addition
  required by this feature's own accessibility-upgrades section (and Article 28). Its visual
  language follows the existing `MasonryGrid`/`ImageSlot` idiom, since no lightbox mockup
  exists in the source to extract from.
- Copy, demo prices, and placeholder profile/testimonial text are transcribed byte-for-byte
  from `files/site/`, including its own "Demo prices" and "Draft only" notices — Articles 2
  and 13 make the client, not this port, the owner of real copy and pricing.
- "F10", "F12", "F13–F15" in the input are the client's own external feature-numbering
  (booking submission, contact submission, future admin/content features) — carried through
  as opaque `TODO` labels only; they are not Spec Kit feature numbers and do not name any
  feature in `specs/`.
- No content field's `_ar` value is anything other than empty/unset in this feature —
  populating Arabic copy is out of scope until Arabic itself is enabled.
- ISR (`revalidate: 60`) and the dashboard-save webhook named in Article 22 apply once page
  data comes from the API; while every route here is fixture-backed, no live revalidation
  target exists yet, so this feature ships the routes as ordinary static/SSR pages without
  contradicting Article 22 (there is nothing to revalidate against).
- OG image generation (`next/og`, Article 22) is deferred to the feature that adds real
  branch/dish photography — a placeholder-only OG card adds no value over Next's default
  handling and risks inventing new visual design the Governing Rule forbids (`files/site/`
  itself has no OG tags to extract from). Every route still ships correct title/description
  metadata (FR-046) in the meantime.

## Constitution Impact *(mandatory)*

**Articles this feature is governed by**: 1, 2, 3, 5, 6, 8, 12, 13, 16, 17, 18, 19, 20, 21,
22, 28.

**Non-negotiable [NN] articles touched**: 1, 2, 3, 5, 6, 8, 12, 16, 17, 18, 19, 20, 21, 22, 28.

**Out of scope by Article 1**: Confirmed. This feature contains no ordering, payment, loyalty,
or delivery-tracking work — not even scaffolding or a stubbed table. Delivery remains a pair
of outbound links (talabat, elmenus) exactly as `files/site/` already shows, matching Article
23's "surfaced, not owned" model; this feature does not touch `SiteSetting` since that model
doesn't exist yet (no API work in scope).

**Amendment needed?**: No.
