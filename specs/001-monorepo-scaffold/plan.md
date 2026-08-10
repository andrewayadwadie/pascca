# Implementation Plan: Monorepo Scaffold

**Branch**: `001-monorepo-scaffold` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-monorepo-scaffold/spec.md`
**Constitution**: v2.0.0 (34 articles, Parts I–VIII)

## Summary

Create the workspace every later feature is built inside: a pnpm + Turborepo monorepo with
`apps/{api,web,admin}` and `packages/{types,api-client,config}`, exactly as Article 6 fixes it.
Three things in it are load-bearing and are the real work of this feature:

1. **One shared design-token file** (`packages/config/tokens.css`) carrying the Article 16 block
   verbatim, consumed by both web and admin, with a lint rule that makes a second definition
   impossible rather than merely discouraged.
2. **A boot sequence that refuses to start on bad configuration** — Zod-validated environment
   naming the offending variable (never its value), then a single-shot reachability check on
   Postgres/Redis/object storage that fails immediately rather than retrying.
3. **A PR gate that reports lint, typecheck, test and build independently**, with database
   migrations structurally unable to run from it — they exist only in a manually dispatched,
   reviewer-gated workflow.

No endpoint, no Prisma model, no page, no user-facing string ships. See research R13 for the
explicit not-shipping list.

## Technical Context

<!--
  The stack below is fixed by the constitution (Article 5 [NN]). Do not change it in a plan —
  that requires an amendment with client sign-off (Article 34).
-->

**Language/Version**: TypeScript strict · **Node.js 22 LTS** (Article 5). ⚠ The development
machine currently runs Node v24.13.0 — see research R1; the developer switches to 22, or an
Article 5 amendment is required. Not resolvable inside this plan.
**Primary Dependencies**: Fastify 5 + `fastify-type-provider-zod` + Prisma 6 (api) · Next.js 15
App Router + Tailwind 4 + next-intl (web) · Vite + React 19 (admin) · pnpm workspaces + Turborepo
**Storage**: PostgreSQL 16 · Redis 7 · MinIO locally as an S3-compatible stand-in for Cloudflare R2
**Testing**: Vitest — one executing smoke test per workspace member, plus an `.env.example`
drift test. No Playwright/k6 yet (nothing to exercise; Article 30's risk areas do not exist here)
**Target Platform**: Linux server (api) · Node (web) · static SPA (admin)
**Project Type**: pnpm monorepo — API-first backend + two web clients + future Flutter app
**Performance Goals**: warm `pnpm dev` brings all three apps up in under 30s (SC-001). Article 28's
Lighthouse floor has no surface to measure yet
**Constraints**: strict TS everywhere · zero duplicated design values (SC-005) · zero automatic
migrations (SC-004) · secrets never printed on a validation failure
**Scale/Scope**: infrastructure only — six workspace members, one compose file, two CI workflows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer every row. **[NN] rows cannot be waived** — a No means the plan changes, not the
constitution. Non-[NN] rows may be waived only with a Complexity Tracking entry below.

> Table rebuilt against **constitution v2.0.0**. The template shipped with v1.0.0's 30-article
> numbering; `.specify/templates/plan-template.md` has been corrected so later features inherit
> the right table.

| # | Gate | Art | Verdict |
|---|---|---|---|
| 1 | Stays inside MVP scope; no ordering/payment/loyalty/delivery code, tables, or scaffolding | 1 **[NN]** | ✅ Infrastructure only. Nothing Phase 9 appears, not even a stub (research R13) |
| 2 | Brand positioning respected; prices visible wherever a dish appears; copy never implies expensive | 2 **[NN]** | ✅ N/A — no copy, no dish, no price ships |
| 3 | Every value the client might change is DB-backed and dashboard-editable; no hardcoded content | 3 **[NN]** | ✅ N/A — no content ships. Nothing hardcoded that a later feature must un-hardcode |
| 4 | Every capability reachable from a documented `/api/v1` endpoint the Flutter app could call; no server actions hitting Prisma | 4 **[NN]** | ✅ N/A — no capability ships. Scaffold mounts the `/api/v1` prefix so the first endpoint is compliant by default |
| 5 | Tech track honoured exactly; no substitutions | 5 **[NN]** | ⚠→✅ Every pinned choice used as specified. **Node 22 is enforced via `engines` + `.nvmrc` + `engine-strict`, which will fail loudly on the machine's Node 24** rather than silently drifting. Divergence surfaced, not routed around |
| 6 | Repository layout matches the Article 6 tree | 6 **[NN]** | ✅ This feature creates that tree, member for member |
| 7 | Each API module is exactly `routes`/`service`/`repository`/`schema`; cross-module reads via the other service | 7 **[NN]** | ✅ N/A — no module exists yet. Directory convention and lint scaffolding established for the first one |
| 8 | No duplicated source of truth (schema / Zod+OpenAPI / `packages/types` / `tokens.css` / message files / DB) | 8 **[NN]** | ✅ Core of this feature. One token file, one tsconfig base, one lint base, one env schema. `packages/types` ships empty and generated-only (FR-013) |
| 9 | Additive to `/api/v1` only — nothing removed, renamed, or retyped | 9 **[NN]** | ✅ N/A — nothing shipped to be frozen. Prefix established |
| 10 | Every response enveloped; every new error has a permanent registered code in `docs/api.md` | 10 **[NN]** | ✅ N/A — no response exists. `docs/api.md` seeded **empty** now so the first error has a registry to land in |
| 11 | Phase discipline — build the phase in front of you; no next-phase tables | 11 | ✅ Explicit not-shipping list in research R13. `schema.prisma` carries zero models |
| 12 | Content respects the three tiers; no Tier-3 string moved into the dashboard | 12 **[NN]** | ✅ N/A — no content of any tier ships |
| 13 | Curation stays manual; testimonials require `consentGiven` | 13 **[NN]** | ✅ N/A |
| 14 | Dashboard is a pure API client; permissions are data via `requirePermission`; unauthorised UI not rendered | 14 **[NN]** | ✅ N/A for logic. Enforced structurally: `apps/admin` is given **no** database or Prisma dependency, so DB access is not available to add by accident |
| 15 | Deletes are soft; mutations write an `AuditLog` diff; no `staffNotes`/audit data on public endpoints | 15 **[NN]** | ✅ N/A — no mutation, no entity |
| 16 | Zero raw hex, one-off font stacks, or arbitrary radii — all values from `tokens.css`; gold the only accent | 16 **[NN]** | ✅ Core of this feature. Article 16 block copied verbatim; raw colour literals banned by lint (research R4) |
| 17 | Signature components built to spec (floating plate, badges, glass nav, mobile CTA bar, designed placeholder) | 17 **[NN]** | ✅ N/A — no component ships |
| 18 | Page inventory and section order unchanged (client sign-off to reorder) | 18 **[NN]** | ✅ N/A — no page ships; only an empty locale-routing shell |
| 19 | Motion inside the seven-item budget; `prefers-reduced-motion` disables all of it | 19 **[NN]** | ✅ N/A — no motion ships |
| 20 | Designed placeholders; R2 WebP/AVIF at 3 sizes with explicit dimensions + blurHash; alt text present | 20 **[NN]** | ✅ N/A — no image ships |
| 21 | `/[locale]/…` routes with `en` default and `ar` registered-but-flagged; `_en`/`_ar` columns; logical CSS properties only | 21 **[NN]** | ✅ Scaffold ships the locale shell, `en` default, `ar` behind a flag, empty message files, logical-properties lint (AR-003) |
| 22 | ISR `revalidate: 60` + dashboard-save webhook; required JSON-LD, per-page SEO, generated sitemap/robots, `/pasca-menu/` 301 | 22 **[NN]** | ✅ N/A — no cacheable content or indexable page ships |
| 23 | Delivery surfaced via `SiteSetting` links, not owned | 23 | ✅ N/A |
| 24 | `Post` modelled but `/blog` behind an off-by-default flag | 24 | ✅ N/A — no model ships |
| 25 | Seat-overlap availability in one transaction under `pg_advisory_xact_lock`; concurrency proven by a genuinely concurrent test | 25 **[NN]** | ✅ N/A — no booking path |
| 26 | Party ≤6 auto-confirms; >6 stays PENDING with `requiresCall` | 26 **[NN]** | ✅ N/A |
| 27 | Notifications go through a `NotificationChannel` interface; no copy promises WhatsApp | 27 **[NN]** | ✅ N/A |
| 28 | Quality floor verifiable on the deployed build; contrast checked; gold never body copy | 28 **[NN]** | ✅ N/A to measure — nothing deployed. `jsx-a11y` rules installed **now** so the first UI is held to them from its first commit (AR-007) |
| 29 | Security baseline (helmet, CORS allow-list, rate limits, argon2, refresh rotation, Zod on every input, no PII in logs) | 29 **[NN]** | ✅ Applicable parts honoured: `.env` gitignored, no secret committed, **validation errors print variable names but never values** (research R5). Runtime middleware belongs to the first API feature |
| 30 | Article 30 tests for every risk area this feature touches are planned; concurrency test genuinely concurrent | 30 | ✅ None of the listed risk areas exist yet. Ships what *is* testable: one executing smoke test per member + an `.env.example` drift test (research R7, R11) |
| 31 | Definition of done achievable: OpenAPI, regenerated types, no mock data, both locales, tests green, audit firing, `pnpm lint && typecheck && test && build` green | 31 | ✅ This feature **creates** that command and makes it green |
| 32 | Migrations are a separate, explicitly approved step — never automatic on deploy | 32 | ✅ Migrations exist only in a `workflow_dispatch` + reviewer-gated workflow (research R9). ⚠ Requires a one-time GitHub Environment setup that YAML cannot declare — tracked in `quickstart.md` |
| 33 | Any client deliverable this feature owes (Postman tag, handbook section) is listed | 33 | ✅ None owed at scaffold stage — no endpoint to collect, no operator screen to document |

**Result**: **PASS** — 0 failing gates, 0 waivers, Complexity Tracking empty.

**Two items carried forward as flagged, not waived** (neither is a gate failure; both need a
human, and neither may be silently resolved during implementation):

1. **Node 22 vs. local Node 24** (gate 5) — developer switches Node, or the client signs off on an
   Article 5 amendment. Article 34 forbids deciding this in a plan.
2. **GitHub Environment reviewers** (gate 32) — protection rules are repository settings, not YAML.
   Until a required reviewer exists on the migration environment, the approval gate is nominal.
   The feature is not done until this is confirmed in repository settings.

## Project Structure

### Documentation (this feature)

```text
specs/001-monorepo-scaffold/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — R1–R13
├── data-model.md        # Phase 1 output — configuration model (no DB entities)
├── quickstart.md        # Phase 1 output — clean-checkout walkthrough + manual setup
├── contracts/
│   ├── env.md           # Environment variable contract
│   └── workspace-tasks.md  # Task contract every workspace member implements
├── checklists/
│   └── requirements.md  # Spec quality checklist (all passing)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

Layout fixed by Article 6. Every path below is **created by this feature**:

```text
pascca/
├─ apps/
│  ├─ api/                                 # Fastify 5. The only thing that talks to the DB.
│  │  ├─ prisma/schema.prisma              # datasource + generator only — ZERO models (Art 11)
│  │  ├─ src/
│  │  │  ├─ config/env.ts                  # Zod schema; names the bad variable, never its value
│  │  │  ├─ lib/health.ts                  # single-shot reachability check, fail-fast (FR-014)
│  │  │  ├─ app.ts                         # Fastify instance, /api/v1 prefix mounted, no routes
│  │  │  └─ server.ts                      # validate env → check services → listen
│  │  ├─ tests/{env.test.ts,env-example-sync.test.ts,smoke.test.ts}
│  │  └─ {package.json,tsconfig.json,vitest.config.ts,eslint.config.js}
│  ├─ web/                                 # Next.js 15, en default, ar flagged off (Art 21)
│  │  ├─ src/app/[locale]/{layout.tsx,page.tsx}   # shell only, no content
│  │  ├─ src/styles/globals.css            # imports packages/config/tokens.css — defines nothing
│  │  ├─ src/messages/{en.json,ar.json}    # Art 6 [NN]: under src/, not the app root. Empty — the only place UI strings will live
│  │  └─ {package.json,tsconfig.json,next.config.ts,vitest.config.ts,eslint.config.js}
│  └─ admin/                               # Vite + React 19 SPA, pure API client (Art 14)
│     ├─ src/{main.tsx,App.tsx,styles.css} # styles.css imports the shared tokens
│     ├─ src/messages/{en.json,ar.json}    # Art 6's admin tree omits messages/; placed under src/ for consistency with web
│     └─ {package.json,tsconfig.json,vite.config.ts,vitest.config.ts,eslint.config.js}
├─ packages/
│  ├─ config/
│  │  ├─ tokens.css                        # Art 16 block VERBATIM — the single source of design values
│  │  ├─ tsconfig/base.json                # strict; every member extends this
│  │  ├─ eslint/{base,node,react}.js       # react variant carries jsx-a11y (AR-007)
│  │  └─ vitest/base.ts
│  ├─ types/                               # empty, buildable; generated from OpenAPI later (FR-013)
│  └─ api-client/                          # empty, buildable; openapi-fetch wrapper later
├─ docs/api.md                             # Art 10 error-code registry — seeded EMPTY
├─ .github/workflows/
│  ├─ ci.yml                               # PR: lint · typecheck · test · build, reported independently
│  └─ migrate.yml                          # workflow_dispatch ONLY + environment with reviewers
├─ docker-compose.yml                      # Postgres 16 · Redis 7 · MinIO, healthchecked
├─ .env.example                            # every schema key, placeholder values, kept in sync by test
├─ .nvmrc                                  # 22
├─ .npmrc                                  # engine-strict=true
├─ pnpm-workspace.yaml
├─ turbo.json
└─ package.json                            # root scripts: dev/lint/typecheck/test/build
```

**Also modified**: `.gitignore` — currently has no Node entries. Must gain `node_modules/`,
`dist/`, `.next/`, `.turbo/`, `coverage/`, `*.tsbuildinfo`.

**Structure Decision**: pnpm monorepo, API-first. `apps/api` owns all business rules and the only
Prisma access; `apps/web` and `apps/admin` are clients of `/api/v1` sharing generated types from
`packages/types`. `apps/admin` is deliberately given **no** database dependency — Article 14's
"no DB access" is enforced by absence rather than by review.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

**None.** No gate failed and no waiver was taken.
