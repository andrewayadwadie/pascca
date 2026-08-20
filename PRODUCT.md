# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Public site (`apps/web`) — mixed local + discovery.** Two audiences share the same eight
routes:

- **Cairo locals who already know Pascca**, usually on a phone, deciding tonight: what's on the
  menu, what it costs, which branch is closer, is it open, then call or book.
- **First-time visitors arriving from Google, Instagram, or a delivery app**, on phone or
  desktop, evaluating whether this place is worth the trip. Desktop matters for this half.

**Dashboard (`apps/admin`) — restaurant staff, role-based.** Non-technical operators editing
content (menu, prices, branches, page copy, gallery, testimonials) and handling reservations.
Permissions are seeded data, not roles in code (Article 14) — what an operator can see is
decided per-permission, and unauthorised UI is not rendered at all.

## Product Purpose

One backend serving a public marketing website, a role-based admin dashboard, and (Phase 8) a
Flutter app, for **Pascca** — an Italian restaurant with two Cairo branches: Shobra (since 2018)
and Heliopolis / El-Nozha.

The site has exactly four jobs, in priority order (Article 1):

1. Communicate the brand
2. Present the menu properly
3. Take a reservation
4. Open a contact channel

Success is a visitor who books, calls, or arrives. Any proposed feature that does not serve one
of those four jobs is out of scope, not backlogged.

## Positioning

Pascca is **good Italian food at a price people can actually repeat weekly** — a place you come
back to, not a special occasion. The mechanism a neighbouring restaurant could not truthfully
copy: real, verifiable guest sentiment across two branches plus prices shown openly everywhere,
never behind a "contact us" or a menu PDF.

Two positioning rules are non-negotiable (Article 2):

- **Every dish shows its price everywhere it appears.** A dish rendered without a price is a
  defect, not a layout choice.
- **Copy never implies expensive.** Voice is warm, plain, and funny — not luxury-restaurant
  formal, not exclusive, not aspirational-scarce.

## Operating Context

- **The deciding moment is fast and usually mobile.** A visitor checks a price, a distance, and
  an opening time, then acts. Anything that slows those three down costs a booking.
- **Two branches with genuinely different facts.** Shobra: 273 Shobra Street, 12pm–2am, delivery
  in Al Khalafawy. Heliopolis: 40 Abd El-Aziz Fahmy Street, El-Nozha, open 24 hours. Branch
  differences are content, never duplicated pages.
- **Reservation reality.** Party ≤6 auto-confirms; >6 stays pending with a call-back flag; a
  table is held 15 minutes past the chosen time; default booking duration 90 minutes
  (Articles 25–26). Weekends and Friday breakfast are the pressure points.
- **Delivery is surfaced, not owned** (Article 23). Both kitchens deliver via talabat and
  elmenus; the site links out. Ordering, payment, loyalty, and delivery tracking are Phase 9 —
  not built, not scaffolded, not stubbed.
- **Staff edit content through the dashboard**, which is a pure API client — no SSR, no DB, no
  business logic.

## Capabilities and Constraints

**Shipped or in flight**

- Public routes: `/`, `/menu`, `/about`, `/gallery`, `/branches`, `/reservations`, `/contact`,
  `/legal`, plus a `/pasca-menu/` → `/menu` 301. Section order per page is fixed and requires
  client sign-off to change (Article 18).
- `apps/api` — Fastify 5 + Prisma 6 + PostgreSQL 16, everything under `/api/v1`, frozen once
  mobile ships. Auth and the seeded permission map exist (003-auth-authorization).
- `apps/web` — Next.js 15 App Router, ~35 typed components extracted from the approved static
  site, reading content only through `lib/content` accessors.
- `apps/admin` — Vite + React 19 shell with token wiring; zero screens built yet.

**Hard constraints**

- **API-first (Article 4).** No server action touches Prisma. If the Flutter app could not do it
  with zero backend changes, it is not done.
- **Content is DB-backed (Article 3).** A hardcoded price, phone number, or hero string is a
  defect. Today content lives in typed fixtures shaped field-for-field like the Prisma models
  so the fetch swap is a zero-reshape change; only UI chrome strings are hardcoded, in
  `messages/{en,ar}.json`.
- **Three content tiers (Article 12).** Tier 1 Entities (full CRUD) · Tier 2 PageBlocks
  (dashboard-editable copy, falls back to a seeded default) · Tier 3 UI chrome (i18n only).
  Mixing them destroys the design.
- **English first, Arabic-ready (Article 21).** Routes are `/[locale]/…` with `en` default; `ar`
  is registered but gated off via `notFound()`. Every content string carries `xEn`/`xAr` fields
  with only `xEn` populated. **Logical CSS properties only** — a `margin-left` in layout is a
  violation, lint-enforced.
- **Every mutation writes an `AuditLog` diff; deletes are soft with a 30-day window
  (Article 15).** `staffNotes` and audit data never leave via public or customer endpoints.
- **Motion budget is seven items**, all plain CSS, all disabled under `prefers-reduced-motion`.
  No parallax, scroll-jacking, cursor trails, or transition overlays (Article 19).

**Explicitly undecided / not yet true**

- The forms (reservation, contact) validate client-side and submit nowhere yet.
- No live data source exists behind the fixtures; ISR has nothing to revalidate against.
- OG image generation is deferred by design.
- Arabic translation content does not exist — every `xAr` field is `null`.

## Brand Commitments

- **Name:** PASCca (styled "Pascca" in running copy).
- **Voice:** warm, plain, funny. Never formal-luxury, never scarcity-driven, never implying
  expensive (Article 2).
- **Logo / wordmark:** a real one exists, held by the client, not yet in the repo. Do not draw a
  substitute mark and ship it as the brand.
- **Locked design tokens (Article 16 [NN]), living in `packages/config/tokens.css`:**
  - Dark surfaces: `#0A0A0A`, `#141414`, `#1B1B1B`, `#232323`
  - **Gold `#D4AF37` is the only accent, and is never used for body copy**
  - Geometry (`14/24/32px` radii, pill), motion easings, and spacing scale are fixed values
  - No raw hex, rgba, px radius, or cubic-bezier anywhere outside `tokens.css` — CI-enforced
- **Typography:** Zodiak (self-hosted `.woff2`, present in `apps/web/public/fonts`) + Plus
  Jakarta Sans via `next/font`. No font CDN. An Arabic stack is declared against
  `html[lang="ar"]` even while Arabic is off.
- **Signature components are contractual (Article 17):** 3D floating plate, floating badges,
  glass nav, mobile CTA bar, designed image placeholder.
- **The static site in `files/site/` is the approved visual world.** The current `apps/web` is a
  faithful port of it, not a reinterpretation.

## Evidence on Hand

**Real, in the repo, usable now**

- Two branches with real addresses, phones, hours, and map links (`apps/web/src/content/branches.ts`).
- Real public ratings: Shobra 4.4★ · 76 reviews; Heliopolis 4.1★ · 441 reviews.
- Three real guest testimonials (Tripadvisor, Restaurant Guru, Instagram), all with
  `consentGiven: true` (`apps/web/src/content/marketing.ts`). A testimonial cannot publish
  without consent (Article 13).
- A full real menu with real prices, stored as integer piastres, across seven categories.
- Real page copy, FAQ, milestones, team, and gallery album structure transcribed from the
  approved static site.
- Real delivery links: talabat and elmenus.

**Real, held by the client, not yet in the repo**

- **Photography.** The client has real dish and interior photos. Every image slot today renders
  a designed placeholder with a tone gradient — that is the shipped state, not a stub to be
  filled with stock. When the photos arrive they go through the R2 → WebP/AVIF pipeline at three
  sizes with explicit dimensions and blurHash (Article 20).
- **Logo / wordmark file.**
- **Press / awards.** The client reports real press mentions and awards beyond the three
  testimonials above. Specifics have not been supplied yet.

**Must never be fabricated**

Testimonials, customer names, press quotes, awards, benchmarks, review counts, ratings, dish
photography, pricing, or claims about delivery coverage. If a slot needs content that does not
exist, it stays a designed placeholder or the section does not ship.

## Product Principles

1. **Price is never hidden.** Wherever a dish appears, its price appears with it. This is
   positioning, not a data-completeness detail.
2. **The four jobs decide scope.** Brand, menu, reservation, contact. Everything else waits for
   its phase — including anything that merely feels adjacent to ordering.
3. **Content belongs to the client, not the code.** If the restaurant might change it, it comes
   from the database and is editable in the dashboard. Only UI chrome is hardcoded.
4. **The API is the product surface.** Every capability is reachable from a documented
   `/api/v1` endpoint that the future Flutter app could call unchanged.
5. **Real facts or a designed absence.** Placeholder imagery and empty states are designed on
   purpose; invented content is never an acceptable filler.

## Accessibility & Inclusion

Verifiable on the deployed build, not asserted (Article 28):

- Zero axe violations on all eight public routes; Lighthouse mobile ≥95 performance,
  100 accessibility, 100 SEO per route.
- Fully keyboard-operable, including the accordion, both filter bars, and the gallery lightbox.
- Works at 320px width. CLS < 0.05 — no image-induced layout shift.
- `prefers-reduced-motion` disables the entire motion budget.
- Contrast is checked, and **gold is never used for body copy** — an accessibility rule as much
  as a brand one.
- Bilingual readiness is an inclusion requirement: logical CSS properties only, so RTL is a flag
  flip rather than a rebuild.
