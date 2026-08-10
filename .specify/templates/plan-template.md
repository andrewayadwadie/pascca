# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  The stack below is fixed by the constitution (Articles 5, 6, 14, 15, 17, 21).
  Do not change it in a plan — that requires an amendment. Fill the per-feature
  rows and mark anything genuinely undetermined as NEEDS CLARIFICATION.
-->

**Language/Version**: TypeScript 5.x, Node 20 LTS (Flutter/Dart for `mobile/`, Phase 8)  
**Primary Dependencies**: Fastify + Zod + Prisma (api) · Next.js App Router + next-intl (web) ·
Vite + React + TanStack Query (admin)  
**Storage**: PostgreSQL via Prisma; Cloudflare R2 for images and backups  
**Testing**: Vitest (unit/integration), Supertest or `fastify.inject` (API), Playwright (e2e/RTL
snapshots), k6 (load)  
**Target Platform**: Linux server (api) · Vercel/Node (web) · static SPA (admin) · iOS/Android
(Phase 8)  
**Project Type**: pnpm monorepo — API-first backend + two web clients + future mobile  
**Performance Goals**: Lighthouse mobile ≥95 perf / 100 a11y / 100 SEO; LCP < 2.0s on 4G;
`GET /menu` and `POST /reservations` hold at 200 concurrent (Articles 24, 26)  
**Constraints**: CLS < 0.05; zero image-induced layout shift; works at 320px; keyboard-only
operable; Arabic-first RTL default (Articles 14, 20, 24)  
**Scale/Scope**: 2 branches, MVP surface = gallery, about, branches, menu, reservation, contact,
admin dashboard (Article 1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer every row. **[NN] rows cannot be waived** — a No means the plan changes, not the
constitution. Non-[NN] rows may be waived only with a Complexity Tracking entry below.

| # | Gate | Art | Verdict |
|---|---|---|---|
| 1 | Feature stays inside MVP scope; no ordering/payment/loyalty/delivery code, tables, or scaffolding | 1 **[NN]** | |
| 2 | Fasting state, if touched, stays a `MenuItem.isFasting` column + API filter + URL param — not a tag, category, or client-only filter | 2 **[NN]** | |
| 3 | Every value the client might change is DB-backed and dashboard-editable; no hardcoded content | 3 **[NN]** | |
| 4 | Every capability is reachable from a documented `/api/v1` endpoint the Flutter app could call with zero backend changes; no server actions hitting Prisma | 4 **[NN]** | |
| 5 | No duplicated source of truth (schema / Zod+OpenAPI / `packages/types` / `tokens.css` / message files / DB) | 5 **[NN]** | |
| 6 | Each new API module is exactly `routes` / `service` / `repository` / `schema`; cross-module reads go via the other service | 6 **[NN]** | |
| 7 | Additive to `v1` only — no removed, renamed, or retyped fields | 7 **[NN]** | |
| 8 | Schema change is designed so Phase 9 ordering needs no alteration of these tables | 8 | |
| 9 | Every response is enveloped; every new error has a registered permanent code in `docs/api.md` | 9 **[NN]** | |
| 10 | Authorisation is `requirePermission(...)` from the seeded map; no `role === 'ADMIN'` conditionals; unauthorised UI is not rendered at all | 10 **[NN]** | |
| 11 | Booking paths compute availability by seat overlap inside one transaction under `pg_advisory_xact_lock`; midnight-crossing, closure dates, and 60-min lead time included | 11 **[NN]** | |
| 12 | Deletes are soft (30-day window); every mutation writes `AuditLog` with a JSON diff; status changes write `ReservationEvent`; no `staffNotes`/audit data on public or customer endpoints | 12 **[NN]** | |
| 13 | New env vars go through the `config/env.ts` Zod schema and into `.env.example`; no inline `process.env.X!` | 13 **[NN]** | |
| 14 | `ar`/`en` routes, `_ar`/`_en` columns, message-file strings, logical CSS properties only, state preserved across language switch, `hreflang` emitted | 14 **[NN]** | |
| 15 | Cacheable content uses ISR `revalidate: 60` + dashboard-save webhook; availability and submission are client-side and uncached | 15 | |
| 16 | Required JSON-LD, per-locale title/description from `SiteSetting`, generated OG images, generated sitemap/robots, `/pasca-menu/` 301 preserved | 16 **[NN]** | |
| 17 | Zero raw hex, one-off font stacks, or arbitrary radii — all values from `tokens.css`; gold is the only accent; Cairo/Almarai absent | 17 **[NN]** | |
| 18 | Homepage section order unchanged (client sign-off required to reorder or omit) | 18 **[NN]** | |
| 19 | Motion stays inside the six-item budget; `prefers-reduced-motion` disables all of it; no parallax, scroll-jacking, cursor trails, or transition overlays | 19 **[NN]** | |
| 20 | Every image slot has a designed placeholder; R2 WebP/AVIF at 3 sizes via `next/image` with explicit dimensions + blurHash; `altAr`/`altEn` present | 20 **[NN]** | |
| 21 | Dashboard work adds no business logic the API doesn't enforce, no DB access, no SSR; stays inside the fixed route set | 21 | |
| 22 | Operator ergonomics delivered where relevant (optimistic status, SSE feed, undo toast, drag-reorder, one-tap 86, CSV export, keyboard shortcuts) | 22 | |
| 23 | Dashboard strings are in message files and render Arabic-first RTL | 23 | |
| 24 | Quality floor is verifiable on the deployed build; contrast checked; gold not used for body copy | 24 **[NN]** | |
| 25 | Security baseline holds (rate limits, argon2, refresh rotation + reuse detection, Zod on query/params, presigned uploads with MIME sniffing, EXIF stripped, no PII in logs) | 25 **[NN]** | |
| 26 | The Article 26 tests for every risk area this feature touches are planned as tasks; concurrency test is genuinely concurrent, not mocked | 26 | |
| 27 | Definition of done is achievable: endpoint in OpenAPI spec, types regenerated, no mock data, both locales, tests green, audit log firing, `pnpm lint && typecheck && test && build` green | 27 | |
| 28 | Migrations are a separate, explicitly approved step — never automatic on deploy | 28 | |
| 29 | Any client-facing deliverable this feature owes (Postman collection tag, handbook section) is listed | 29 | |

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
  The monorepo layout is fixed by the constitution (Articles 5, 6, 14, 21).
  Do not invent alternatives. Below the tree, list only the concrete paths this
  feature adds or touches.
-->

```text
apps/
├── api/                          # Fastify. The only thing that talks to the DB.
│   ├── prisma/schema.prisma      # Art 5: single source of truth for data shape
│   ├── src/
│   │   ├── config/env.ts         # Art 13: Zod-validated env, fails fast at boot
│   │   ├── modules/<name>/       # Art 6: exactly four files, no more
│   │   │   ├── <name>.routes.ts
│   │   │   ├── <name>.service.ts
│   │   │   ├── <name>.repository.ts
│   │   │   └── <name>.schema.ts
│   │   ├── plugins/              # helmet, cors, rate-limit, auth, requirePermission
│   │   └── lib/                  # envelope, error registry, audit writer
│   └── tests/{unit,integration,concurrency,permissions}/
├── web/                          # Next.js App Router, Arabic-first RTL
│   ├── app/[locale]/…            # Art 14: ar | en, ar is the fallback
│   ├── messages/{ar,en}.json     # Art 5, 14: the only place UI strings live
│   └── tests/{e2e,rtl-snapshots}/
└── admin/                        # Vite + React SPA, pure API client (Art 21)
    ├── src/routes/               # fixed MVP route set
    ├── messages/{ar,en}.json     # Art 23
    └── tests/

packages/
├── types/                        # Art 5: generated from the OpenAPI spec, never hand-written
└── config/tokens.css             # Art 17: the locked token set

docs/api.md                       # Art 9: the permanent error-code registry
mobile/                           # Phase 8. Inherits Parts I–III and VII.
```

**Structure Decision**: pnpm monorepo, API-first. `apps/api` owns all business rules and the only
Prisma access; `apps/web` and `apps/admin` are clients of `/api/v1` and share generated types from
`packages/types`. Paths this feature adds or touches:

- [list concrete files, e.g. `apps/api/src/modules/reservations/reservations.service.ts`]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
