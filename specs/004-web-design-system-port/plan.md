# Implementation Plan: Web Design System Port

**Branch**: `004-web-design-system-port` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-web-design-system-port/spec.md`

## Summary

Port `files/site/`'s eight static HTML/CSS/JS pages into `apps/web`'s Next.js App Router as
the site's real foundation and reusable design system — an extraction, not a redesign. Wire the
already-shipped `packages/config/tokens.css` into a Tailwind 4 theme for both `apps/web` and
`apps/admin`; extract ~35 typed components under the exact names Section 3 of the spec fixes;
stand up the `/[locale]/` route tree plus the `/pasca-menu/` legacy redirect; define content-DTO
fixtures whose field names mirror the already-shipped Prisma schema exactly (flat `xEn`/`xAr`,
not nested — research R5) so `apps/api/prisma/seed`'s four overlapping modules can import them
instead of the independent, already-diverged placeholder copies they hold today (research R7/
R8); port `app.js`'s vanilla-JS behaviour to React with zero new animation dependency (research
R14); build the reservation/contact forms with React Hook Form + Zod, submitting nowhere; and
close the accessibility (Article 28) and SEO (Article 22 — a gap the input didn't name but the
Constitution Check surfaced, spec FR-046–FR-050) requirements the constitution attaches to any
feature that makes these eight routes real and deployable.

## Technical Context

<!--
  The stack below is fixed by the constitution (Article 5 [NN]). Do not change it in
  a plan — that requires an amendment with client sign-off (Article 34). Fill the
  per-feature rows and mark anything genuinely undetermined as NEEDS CLARIFICATION.
-->

**Language/Version**: TypeScript strict, Node.js 22 LTS
**Primary Dependencies**: Next.js 15 App Router + Tailwind 4 + next-intl (already-planned per
Article 5; newly added by this feature) + React Hook Form + Zod (forms) + Playwright +
`@axe-core/playwright` + `lighthouse` (new test tooling, research R13). **Not** added this
feature, deliberately (research R14/R15, Article 11): `motion`, TanStack Query — nothing in
this feature's scope needs either yet.
**Storage**: None touched directly by `apps/api`'s runtime. `apps/api/prisma/seed/*` (a dev-time
script only) gains a workspace import from `@pascca/web/content/*` (research R7) — no new
migration, no schema change; every model this feature's fixtures mirror (`Branch`, `Category`,
`MenuItem`, `PageBlock`, `GalleryAlbum`/`GalleryImage`, `Testimonial`, `FaqItem`, `TeamMember`,
`Milestone`, `PageSeo`) already exists from 002-content-schema-seed.
**Testing**: Vitest (fixture/accessor unit tests, the content-seam test), Playwright (e2e,
keyboard-navigation, `prefers-reduced-motion` snapshot), `@axe-core/playwright` (zero-violation
audit, all eight routes), `lighthouse` npm package driven against a production build (SC-006)
**Target Platform**: Node (Next.js SSR/ISR-capable build) — no server/API/mobile surface touched
**Project Type**: pnpm monorepo + Turborepo — this feature is scoped to `apps/web` (+ minimal
Tailwind/token wiring in `apps/admin`, no UI) + a hand-written sibling module in
`packages/types` + a scoped refactor of four existing `apps/api/prisma/seed/*` modules
**Performance Goals**: Lighthouse mobile ≥95 perf / 100 a11y / 100 SEO on the production build,
per route (Article 28, SC-006)
**Constraints**: CLS < 0.05 (zero image-induced layout shift, FR-043); works at 320px;
keyboard-only operable including the accordion, both filter bars and the new gallery lightbox
(FR-035–FR-040); English-first with `ar` registered but flagged off via `notFound()`, not a
redirect (research R10); logical CSS properties only, enforced by the existing `eslint/react.js`
rule (Articles 20, 21, 28); zero raw hex/rgba/px-radius/cubic-bezier outside `tokens.css`,
enforced by both an extended ESLint rule and a new standalone CI script (research R3, FR-004/
FR-005)
**Scale/Scope**: Eight public routes + one legacy redirect; zero authenticated surface; zero
new database migration. Real Zodiak `.woff2` binaries do not exist in the repo yet and must be
fetched from Fontshare's self-hosting-permitted distribution at implementation time (research
R4) — the one genuine external dependency this plan cannot pre-resolve.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer every row. **[NN] rows cannot be waived** — a No means the plan changes, not the
constitution. Non-[NN] rows may be waived only with a Complexity Tracking entry below.

| # | Gate | Art | Verdict |
|---|---|---|---|
| 1 | Feature stays inside MVP scope; no ordering/payment/loyalty/delivery code, tables, or scaffolding | 1 **[NN]** | **PASS** — delivery is two outbound links, no checkout; confirmed in spec's Constitution Impact |
| 2 | Brand positioning respected; every dish shows a price everywhere it appears; copy never implies expensive | 2 **[NN]** | **PASS** — `DishCard`/`MenuRow` always render `priceLabel`; copy transcribed verbatim from `files/site` (Governing Rule), not rewritten |
| 3 | Every value the client might change is DB-backed and dashboard-editable; no hardcoded content | 3 **[NN]** | **PASS, via the seam** — content lives in typed fixtures shaped field-for-field like the real DB models (research R5), read only through `lib/content` accessors (FR-020/FR-021), never inlined in a component. Real dashboard-editability requires the fetch-swap of a *later* feature (Article 11) — this feature's job is making that swap a zero-reshape change, not performing it |
| 4 | Every capability is reachable from a documented `/api/v1` endpoint the Flutter app could call with zero backend changes; no server actions hitting Prisma | 4 **[NN]** | **N/A** — no endpoint added or changed; `apps/api/src` (the served runtime) is untouched. The one cross-app import (research R7) is scoped to `prisma/seed`, a dev-time script never served (spec AR-002) |
| 5 | Tech track honoured exactly (Node 22, Fastify 5, Prisma 6, PG 16, Redis 7, Next 15, React 19, pnpm+Turborepo); no substitutions | 5 **[NN]** | **PASS** — Next 15/Tailwind 4/React 19/next-intl all added as named. `motion`/TanStack Query deliberately *not yet installed* (research R14/R15) — a phase-discipline deferral (Article 11), not a substitution of anything for anything else |
| 6 | Repository layout matches the Article 6 tree | 6 **[NN]** | **PASS** — `apps/web/src/{app/[locale],components,lib,messages,styles}`, `packages/config`, `packages/types` all match; no new top-level path invented |
| 7 | Each new API module is exactly `routes` / `service` / `repository` / `schema`; cross-module reads go via the other service | 7 **[NN]** | **N/A** — no new API module |
| 8 | No duplicated source of truth (schema / Zod+OpenAPI / `packages/types` / `tokens.css` / message files / DB) | 8 **[NN]** | **PASS — this gate drove the plan's hardest decisions.** `tokens.css` unchanged, just wired (R1/R2). Content types live in a clearly-separated hand-written `packages/types/src/content/` sibling, never touching the generated `index.ts` (R6). `apps/api/prisma/seed`'s four modules that already independently duplicated (and had already diverged from — R8) site content are refactored to import the one fixture instead |
| 9 | Additive to `v1` only — no removed, renamed, or retyped fields | 9 **[NN]** | **N/A** — no `v1` endpoint touched |
| 10 | Every response is enveloped; every new error has a registered permanent code in `docs/api.md` | 10 **[NN]** | **N/A** — no API response, no new error code. The one failure mode this feature defines (empty required form field) is client-side Zod validation with no network round trip (spec AR-004) |
| 11 | Build the phase in front of you; schema designed so Phase 9 ordering needs no alteration of these tables | 11 | **PASS** — explicitly the cited rationale for R14 (no `motion`) and R15 (no TanStack Query); no schema touched at all |
| 12 | Content respects the three tiers (Entities / PageBlock copy / i18n UI chrome); no Tier-3 string moved into the dashboard; PageBlock falls back to a seeded default and enforces length limits | 12 **[NN]** | **PASS** — Tier 1/2 fixtures mirror the real models; Tier 3 strings live in `messages/en.json` only (FR-024); `<Block>` falls back to the fixture default on a missing key (FR-023). Server-side length-limit *enforcement* is an API-layer concern for the feature that adds the real endpoint — nothing here accepts untrusted input to enforce a limit against |
| 13 | Curation stays manual (`isFeatured` + `featuredRank`); testimonials are entered by hand and cannot publish without `consentGiven` | 13 **[NN]** | **PASS** — fixture `MenuItem.isFeatured`/`featuredRank` preserved (data-model.md); every fixture `Testimonial.consentGiven` is `true`, and `getTestimonials()` is contracted to filter on it (contracts/content-accessors.md) even though every current row already passes |
| 14 | Dashboard is a pure API client (no business logic, no DB, no SSR); authorisation is `requirePermission(...)` from the seeded map, never a `role === 'ADMIN'` conditional; unauthorised UI is not rendered at all; operator ergonomics delivered where relevant | 14 **[NN]** | **N/A** — Out of Scope: "Do not build the admin dashboard." `apps/admin` gains only inert Tailwind/token wiring (R2), zero screens, zero logic |
| 15 | Deletes are soft (30-day window); every Tier-1/Tier-2 mutation writes `AuditLog` with a JSON diff; reservation status changes write `ReservationEvent`; no `staffNotes`/audit data on public or customer endpoints | 15 **[NN]** | **N/A** — no mutation exists; the forms submit nowhere (FR-033, spec AR-006) |
| 16 | Zero raw hex, one-off font stacks, or arbitrary radii — all values from `tokens.css`; gold is the only accent; Zodiak self-hosted, no font CDN | 16 **[NN]** | **PASS, with one flagged external dependency** — `tokens.css` already correct (R1); hex enforcement doubled (R3). Zodiak self-hosting is correct *in design*, but the actual `.woff2` binaries don't exist in this repo and must be fetched at implementation time (R4) — not a gate failure, a task risk to carry forward explicitly |
| 17 | Signature components built to spec (3D floating plate, floating badges, glass nav, mobile CTA bar, designed placeholder) | 17 **[NN]** | **PASS** — `FloatingPlate`/`FloatingBadge`/`SiteHeader`/`MobileCtaBar`/`ImageSlot` all in contracts/component-api.md with the article's exact values (contract, not paraphrase) |
| 18 | Page inventory and per-page section order unchanged (client sign-off required to reorder or omit) | 18 **[NN]** | **PASS** — verified byte-for-byte against `files/site/` page-by-page during spec-writing (spec's Conflict-check note); every user story's acceptance scenarios assert the order explicitly |
| 19 | Motion stays inside the seven-item budget; `prefers-reduced-motion` disables all of it; no parallax, scroll-jacking, cursor trails, or transition overlays | 19 **[NN]** | **PASS** — FR-044/FR-045; R14 confirms every item is plain CSS, matching `app.js`'s own zero-dependency approach, so nothing beyond the budget gets *tempting* to add via a new library's API surface |
| 20 | Every image slot has a designed placeholder; R2 WebP/AVIF at 3 sizes via `next/image` with explicit dimensions + blurHash; `altEn` present, `alt=""` deliberate | 20 **[NN]** | **PASS for what this feature ships; the R2/WebP pipeline is correctly out of scope** — "every slot has a designed placeholder" (FR-042/FR-043) is unconditional and met now; the R2/WebP/blurHash pipeline has no real photography to operate on yet (Article 20's own text sequences photography acquisition as a separate future step) — `ImageSlot`'s `src`/`alt` props exist today specifically so that step is additive (contracts/component-api.md) |
| 21 | `/[locale]/…` routes with `en` default and `ar` registered but flagged off; `_en`/`_ar` columns; strings in message files; logical CSS properties only | 21 **[NN]** | **PASS** — builds on 001's existing route shell (R10); `notFound()` gate, not a redirect, for `ar` (FR-016); flat `xEn`/`xAr` fixture fields (R5); Tier 3 strings in `messages/en.json` (FR-024); logical-properties lint rule already exists (`eslint/react.js`, verified) |
| 22 | Cacheable content uses ISR `revalidate: 60` + dashboard-save webhook; availability and submission uncached; required JSON-LD, per-page SEO from PageBlock, generated sitemap/robots, `/pasca-menu/` 301 preserved | 22 **[NN]** | **PASS, scope expanded during this Constitution Check** — the input's Section 4 covered only the redirect; JSON-LD/sitemap/robots/per-page SEO were a real gap this gate caught, now closed by FR-046–FR-050 (added to spec.md during planning) and SC-009. ISR itself has nothing to revalidate against yet (fixture-backed, no live data source — spec Assumptions). OG images explicitly deferred (FR-050, justified in spec Assumptions) |
| 23 | Delivery stays surfaced via `SiteSetting` links, not owned | 23 | **PASS, via the same fixture seam** — delivery links are content-fixture data today (same pattern as every other Tier 1/2 field in this feature); becomes a real `SiteSetting`-backed value the same future feature that crosses the fetch seam for everything else |
| 24 | `Post` is modelled and CRUD-able; `/blog` ships behind an off-by-default flag | 24 | **N/A** — Out of Scope: "Do not add a blog route" |
| 25 | Booking paths compute availability by seat overlap inside one transaction under `pg_advisory_xact_lock`; midnight-crossing, closure dates, and 60-min lead time included | 25 **[NN]** | **N/A** — the reservation form is local-state only; no availability computation exists (FR-033) |
| 26 | Party ≤6 auto-confirms; >6 stays PENDING with `requiresCall`; 15-min hold; `durationMin` defaults to 90 | 26 **[NN]** | **PASS at the UI-communication level** — FR-034 implements exactly this split as the two local `ResultBox` states; no reservation is actually persisted (that requires the API this feature doesn't touch) |
| 27 | Notifications go through the `NotificationChannel` interface; no user-facing copy promises WhatsApp | 27 **[NN]** | **N/A** — no notification is sent; no copy in the fixture (transcribed from `files/site`, which itself never promises WhatsApp confirmation) claims one |
| 28 | Quality floor is verifiable on the deployed build; contrast checked; gold never used for body copy | 28 **[NN]** | **PASS** — this is User Story 5's entire subject; FR-035–FR-041, SC-005/SC-006/SC-007, new Playwright+axe+Lighthouse tooling (R13) make it verifiable, not just asserted |
| 29 | Security baseline holds (CORS allow-list never `*`, rate limits, argon2, refresh rotation + reuse detection, Zod on query/params, presigned uploads with MIME sniffing, EXIF stripped, no PII in logs) | 29 **[NN]** | **N/A** — no server surface, no auth, no upload, no PII persisted (the forms collect input but submit nowhere, FR-033) |
| 30 | The Article 30 tests for every risk area this feature touches are planned as tasks; concurrency test is genuinely concurrent, not mocked | 30 | **PASS** — "a11y | axe clean on all eight pages; reduced-motion snapshot" and "i18n | locale routing works with ar disabled; no hardcoded strings (lint rule)" are this feature's Article 30 rows; both become explicit `/speckit-tasks` test tasks. No concurrency risk exists in this feature's scope |
| 31 | Definition of done is achievable: endpoint in OpenAPI spec, types regenerated, no mock data, dashboard-editable per Art 12, tests green, audit log firing, `pnpm lint && typecheck && test && build` green | 31 | **PASS, with the endpoint/audit-log clauses N/A** — no endpoint, no audit log applies (nothing mutates); "no mock data left" reads as "no component reads anything but `lib/content`," which FR-021 makes lint-adjacent-enforceable; the full `pnpm lint && typecheck && test && build` gate applies and is in quickstart.md |
| 32 | Migrations are a separate, explicitly approved step — never automatic on deploy | 32 | **N/A** — this feature adds no migration; every Prisma model its fixtures mirror already exists from 002-content-schema-seed (confirmed directly against `schema.prisma`) |
| 33 | Any client-facing deliverable this feature owes (Postman collection tag, handbook section, walkthrough) is listed | 33 | **N/A** — no new API surface, so no new Postman collection entry; no dashboard change, so no handbook update |

**Result**: **PASS.** Two items carried forward as explicit risks rather than gate failures: (a)
Zodiak's `.woff2` binaries must be fetched from Fontshare at implementation time (row 16, R4) —
a real task, not a design gap; (b) `next/og` OG-image generation is deferred by design (row 22,
FR-050) with its own justification, not silently dropped.

## Project Structure

### Documentation (this feature)

```text
specs/004-web-design-system-port/
├── plan.md                          # This file
├── research.md                      # R1–R15 decisions
├── data-model.md                    # Content-fixture DTO shapes
├── quickstart.md
├── contracts/
│   ├── component-api.md             # Frozen prop signatures, Section 3's name→component map
│   └── content-accessors.md         # Frozen lib/content function signatures
└── tasks.md                         # Phase 2 output (/speckit-tasks — not created by /speckit-plan)
```

### Source Code (repository root)
<!--
  The monorepo layout is fixed by the constitution (Articles 6, 8, 14, 21).
  Do not invent alternatives. Below the tree, list only the concrete paths this
  feature adds or touches.
-->

```text
apps/
├── api/                          # Fastify 5. The only thing that talks to the DB.
│   ├── prisma/schema.prisma      # Art 8: single source of truth for data shape
│   ├── src/
│   │   ├── config/env.ts         # Zod-validated env, fails fast at boot, names the variable
│   │   ├── modules/<name>/       # Art 7: exactly four files, no more
│   │   │   ├── <name>.routes.ts
│   │   │   ├── <name>.service.ts
│   │   │   ├── <name>.repository.ts
│   │   │   └── <name>.schema.ts
│   │   ├── plugins/              # helmet, cors, rate-limit, auth, requirePermission
│   │   └── lib/                  # envelope, error registry, audit writer
│   └── tests/{unit,integration,concurrency,permissions}/
├── web/                          # Next.js 15 App Router, en default (Art 21)
│   ├── src/app/[locale]/…        # Art 21: en | ar, en is the default, ar behind a flag
│   ├── messages/{en,ar}.json     # Art 8, 12: the only place Tier-3 UI strings live
│   └── tests/{e2e,a11y}/
└── admin/                        # Vite + React 19 SPA, pure API client (Art 14)
    ├── src/routes/               # fixed MVP route set
    ├── messages/{en,ar}.json
    └── tests/

packages/
├── types/                        # Art 8: generated from the OpenAPI spec, never hand-written
├── api-client/                   # Art 5: openapi-fetch wrapper
└── config/
    ├── tokens.css                # Art 16: the locked token set — the only design source
    ├── tsconfig/                 # shared strict base; members extend, never redefine
    └── eslint/                   # shared flat config; react variant carries jsx-a11y

docs/api.md                       # Art 10: the permanent error-code registry
mobile/                           # Phase 8. Inherits Parts I–III and VII.
```

**Structure Decision**: pnpm monorepo + Turborepo. This feature is scoped almost entirely to
`apps/web`, touching `apps/admin` only for inert token/Tailwind wiring, `packages/types` for a
clearly-separated hand-written sibling, and four existing `apps/api/prisma/seed/*` modules for a
data-source refactor (no runtime/API code touched). Concrete paths added or touched:

```text
apps/web/
├── package.json                     # + tailwindcss, next-intl, react-hook-form, zod,
│                                     #   @hookform/resolvers, playwright, @axe-core/playwright,
│                                     #   lighthouse; + "./content/*" export map (research R7)
├── public/fonts/                    # NEW — Zodiak .woff2 files (research R4)
├── scripts/
│   ├── check-hex-literals.mjs       # NEW — Section 1's CI grep (research R3)
│   └── lighthouse-check.mjs         # NEW — SC-006 runner (research R13)
├── src/
│   ├── app/[locale]/
│   │   ├── layout.tsx               # EDIT — arabicEnabled notFound() gate (research R10)
│   │   ├── page.tsx                 # EDIT — home page, currently an empty shell
│   │   ├── menu/page.tsx            # NEW — searchParams-driven filter (research R12)
│   │   ├── about/page.tsx           # NEW
│   │   ├── gallery/page.tsx         # NEW
│   │   ├── branches/page.tsx        # NEW
│   │   ├── reservations/page.tsx    # NEW
│   │   ├── contact/page.tsx         # NEW
│   │   └── legal/page.tsx           # NEW
│   ├── app/robots.ts                # NEW — FR-047
│   ├── app/sitemap.ts               # NEW — FR-047
│   ├── components/                  # NEW — every component in contracts/component-api.md
│   ├── content/                     # NEW — real copy/dishes/branches/… (FR-019)
│   │   └── (exported via package.json "./content/*" for apps/api/prisma/seed to import, R7)
│   ├── lib/content/index.ts         # NEW — accessors in contracts/content-accessors.md
│   ├── lib/seo/                     # NEW — JSON-LD builders (FR-048/FR-049)
│   ├── middleware.ts                # EDIT — + /pasca-menu/ 301 (research R11)
│   ├── messages/en.json             # EDIT — Tier 3 strings (FR-024); ar.json stays {}
│   └── styles/globals.css           # EDIT — Tailwind @theme wiring (research R2)
└── tests/
    ├── content-seam.test.ts         # NEW — SC-008
    ├── e2e/                         # NEW — Playwright, per-route behaviour
    └── a11y/                        # NEW — @axe-core/playwright, all eight routes

apps/admin/
└── src/styles/... (or equivalent)   # EDIT — Tailwind @theme wiring only, zero components

packages/types/
├── package.json                     # EDIT — + "./content" export
└── src/content/                     # NEW — hand-written DTOs (research R6); index.ts untouched

apps/api/prisma/
├── seed/branches.ts                 # EDIT — import Branch data from @pascca/web/content/*
├── seed/menu.ts                     # EDIT — import Category/MenuItem data likewise
├── seed/gallery.ts                  # EDIT — import GalleryAlbum/GalleryImage data likewise
└── seed/page-content.ts             # EDIT — import PageBlock/PageSeo data likewise

packages/config/eslint/base.js       # EDIT — widen noRawHexColour to catch bracketed literals
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No unresolved violations. Every apparent tension (packages/types R6, cross-app import R7, SEO
scope expansion row 22) was resolved to a compliant design in research.md / this Constitution
Check, not waived — this table is intentionally empty.
