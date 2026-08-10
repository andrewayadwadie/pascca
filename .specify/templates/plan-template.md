# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  The stack below is fixed by the constitution (Article 5 [NN]). Do not change it in
  a plan — that requires an amendment with client sign-off (Article 34). Fill the
  per-feature rows and mark anything genuinely undetermined as NEEDS CLARIFICATION.
-->

**Language/Version**: TypeScript strict, Node.js 22 LTS (Flutter/Dart for `mobile/`, Phase 8)  
**Primary Dependencies**: Fastify 5 + `fastify-type-provider-zod` + Prisma 6 (api) · Next.js 15
App Router + Tailwind 4 + next-intl (web) · Vite + React 19 + TanStack Query (admin)  
**Storage**: PostgreSQL 16 via Prisma; Redis 7; Cloudflare R2 for images and backups  
**Testing**: Vitest (unit/integration), `fastify.inject` (API), Playwright (e2e/a11y), k6 (load)  
**Target Platform**: Linux server (api) · Node (web) · static SPA (admin) · iOS/Android (Phase 8)  
**Project Type**: pnpm monorepo + Turborepo — API-first backend + two web clients + future mobile  
**Performance Goals**: Lighthouse mobile ≥95 perf / 100 a11y / 100 SEO; LCP < 2.0s on 4G;
`GET /menu` and `POST /reservations` hold at 200 concurrent (Articles 28, 30)  
**Constraints**: CLS < 0.05; zero image-induced layout shift; works at 320px; keyboard-only
operable; English-first with `ar` registered but flagged off; logical CSS properties only
(Articles 20, 21, 28)  
**Scale/Scope**: 2 branches, MVP surface = home, menu, about, gallery, branches, reservations,
contact, legal, dashboard (Article 1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer every row. **[NN] rows cannot be waived** — a No means the plan changes, not the
constitution. Non-[NN] rows may be waived only with a Complexity Tracking entry below.

| # | Gate | Art | Verdict |
|---|---|---|---|
| 1 | Feature stays inside MVP scope; no ordering/payment/loyalty/delivery code, tables, or scaffolding | 1 **[NN]** | |
| 2 | Brand positioning respected; every dish shows a price everywhere it appears; copy never implies expensive | 2 **[NN]** | |
| 3 | Every value the client might change is DB-backed and dashboard-editable; no hardcoded content | 3 **[NN]** | |
| 4 | Every capability is reachable from a documented `/api/v1` endpoint the Flutter app could call with zero backend changes; no server actions hitting Prisma | 4 **[NN]** | |
| 5 | Tech track honoured exactly (Node 22, Fastify 5, Prisma 6, PG 16, Redis 7, Next 15, React 19, pnpm+Turborepo); no substitutions | 5 **[NN]** | |
| 6 | Repository layout matches the Article 6 tree | 6 **[NN]** | |
| 7 | Each new API module is exactly `routes` / `service` / `repository` / `schema`; cross-module reads go via the other service | 7 **[NN]** | |
| 8 | No duplicated source of truth (schema / Zod+OpenAPI / `packages/types` / `tokens.css` / message files / DB) | 8 **[NN]** | |
| 9 | Additive to `v1` only — no removed, renamed, or retyped fields | 9 **[NN]** | |
| 10 | Every response is enveloped; every new error has a registered permanent code in `docs/api.md` | 10 **[NN]** | |
| 11 | Build the phase in front of you; schema designed so Phase 9 ordering needs no alteration of these tables | 11 | |
| 12 | Content respects the three tiers (Entities / PageBlock copy / i18n UI chrome); no Tier-3 string moved into the dashboard; PageBlock falls back to a seeded default and enforces length limits | 12 **[NN]** | |
| 13 | Curation stays manual (`isFeatured` + `featuredRank`); testimonials are entered by hand and cannot publish without `consentGiven` | 13 **[NN]** | |
| 14 | Dashboard is a pure API client (no business logic, no DB, no SSR); authorisation is `requirePermission(...)` from the seeded map, never a `role === 'ADMIN'` conditional; unauthorised UI is not rendered at all; operator ergonomics delivered where relevant | 14 **[NN]** | |
| 15 | Deletes are soft (30-day window); every Tier-1/Tier-2 mutation writes `AuditLog` with a JSON diff; reservation status changes write `ReservationEvent`; no `staffNotes`/audit data on public or customer endpoints | 15 **[NN]** | |
| 16 | Zero raw hex, one-off font stacks, or arbitrary radii — all values from `tokens.css`; gold is the only accent; Zodiak self-hosted, no font CDN | 16 **[NN]** | |
| 17 | Signature components built to spec (3D floating plate, floating badges, glass nav, mobile CTA bar, designed placeholder) | 17 **[NN]** | |
| 18 | Page inventory and per-page section order unchanged (client sign-off required to reorder or omit) | 18 **[NN]** | |
| 19 | Motion stays inside the seven-item budget; `prefers-reduced-motion` disables all of it; no parallax, scroll-jacking, cursor trails, or transition overlays | 19 **[NN]** | |
| 20 | Every image slot has a designed placeholder; R2 WebP/AVIF at 3 sizes via `next/image` with explicit dimensions + blurHash; `altEn` present, `alt=""` deliberate | 20 **[NN]** | |
| 21 | `/[locale]/…` routes with `en` default and `ar` registered but flagged off; `_en`/`_ar` columns; strings in message files; logical CSS properties only | 21 **[NN]** | |
| 22 | Cacheable content uses ISR `revalidate: 60` + dashboard-save webhook; availability and submission uncached; required JSON-LD, per-page SEO from PageBlock, generated sitemap/robots, `/pasca-menu/` 301 preserved | 22 **[NN]** | |
| 23 | Delivery stays surfaced via `SiteSetting` links, not owned | 23 | |
| 24 | `Post` is modelled and CRUD-able; `/blog` ships behind an off-by-default flag | 24 | |
| 25 | Booking paths compute availability by seat overlap inside one transaction under `pg_advisory_xact_lock`; midnight-crossing, closure dates, and 60-min lead time included | 25 **[NN]** | |
| 26 | Party ≤6 auto-confirms; >6 stays PENDING with `requiresCall`; 15-min hold; `durationMin` defaults to 90 | 26 **[NN]** | |
| 27 | Notifications go through the `NotificationChannel` interface; no user-facing copy promises WhatsApp | 27 **[NN]** | |
| 28 | Quality floor is verifiable on the deployed build; contrast checked; gold never used for body copy | 28 **[NN]** | |
| 29 | Security baseline holds (CORS allow-list never `*`, rate limits, argon2, refresh rotation + reuse detection, Zod on query/params, presigned uploads with MIME sniffing, EXIF stripped, no PII in logs) | 29 **[NN]** | |
| 30 | The Article 30 tests for every risk area this feature touches are planned as tasks; concurrency test is genuinely concurrent, not mocked | 30 | |
| 31 | Definition of done is achievable: endpoint in OpenAPI spec, types regenerated, no mock data, dashboard-editable per Art 12, tests green, audit log firing, `pnpm lint && typecheck && test && build` green | 31 | |
| 32 | Migrations are a separate, explicitly approved step — never automatic on deploy | 32 | |
| 33 | Any client-facing deliverable this feature owes (Postman collection tag, handbook section, walkthrough) is listed | 33 | |

**Result**: [PASS / FAIL — list failing gate numbers]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
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

**Structure Decision**: pnpm monorepo + Turborepo, API-first. `apps/api` owns all business rules
and the only Prisma access; `apps/web` and `apps/admin` are clients of `/api/v1` and share
generated types from `packages/types`. Paths this feature adds or touches:

- [list concrete files, e.g. `apps/api/src/modules/reservations/reservations.service.ts`]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
