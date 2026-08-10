# Implementation Plan: Content Data Model & Seed

**Branch**: `002-content-schema-seed` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-content-schema-seed/spec.md`

## Summary

Define the complete Prisma schema — 23 models across identity, branches, menu, reservations,
marketing content, Tier 2 page copy, and operations — and a seed script that fills it with a
working Pascca. This is the first feature to put a model in `schema.prisma`; feature 001 shipped
it deliberately empty (Article 11).

Approach: paired `En`/`Ar` scalar columns for authored content and single columns for entered data
(the distinction is defined once, in `data-model.md`, and enforced by a schema-shape test); prices
as integer piastres; opening hours as minutes-past-midnight with an explicit `closesNextDay` flag
so Shobra's 02:00 close is a field rather than an assumption; soft-delete *columns* only, with
enforcement deferred to the features that add delete endpoints; and an `upsert`-on-natural-key
seed that is safe to re-run. No API, no UI, no ordering tables.

## Technical Context

**Language/Version**: TypeScript strict, Node.js 22 LTS
**Primary Dependencies**: Prisma 6 (schema, migrate, client) · `tsx` (seed execution, already
present) · `argon2` (**new** — Article 29 [NN] password hashing, needs a `pnpm-workspace.yaml`
`allowBuilds` entry as a native module)
**Storage**: PostgreSQL 16 via Prisma. Redis and R2 are untouched by this feature.
**Testing**: Vitest — three layers (schema-shape text assertions with no DB, migration
application, seed invariants + idempotency against a live DB). Research R13.
**Target Platform**: Linux server (api). Nothing user-facing ships here.
**Project Type**: pnpm monorepo + Turborepo — this feature touches `apps/api` only, plus one
workflow file and the root scripts.
**Performance Goals**: Not applicable — no request path is created. The relevant forward-looking
concern is that Article 25's seat-overlap query has the index it needs
(`@@index([branchId, reservedAt])`), which this schema provides.
**Constraints**: Every content field bilingual from this first migration (Article 21 [NN]); the
schema must admit Phase 9 ordering additively (Article 11, FR-008); seed must be idempotent
(FR-013); no ordering/payment/loyalty/delivery table may be created, even as a stub (Article 1
[NN]).
**Scale/Scope**: 2 branches, ~40 menu items, ~200 seeded rows total. Production content volume is
of the same order — this is a two-location restaurant, not a marketplace.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Re-evaluated after Phase 1. Verdicts below are the post-design state.

"**N/A**" below always means *this feature creates no instance of the thing the gate governs* —
never *the gate was waived*. Where a gate binds a later feature that builds on this schema, the
row says which column or table this feature provides so that feature can satisfy it.

| # | Gate | Art | Verdict |
|---|---|---|---|
| 1 | Feature stays inside MVP scope; no ordering/payment/loyalty/delivery code, tables, or scaffolding | 1 **[NN]** | **PASS** — zero such tables. `contracts/phase-9-additive-review.md` is a design review (Article 11's own prescribed form), explicitly marked "do not implement". |
| 2 | Brand positioning respected; every dish shows a price everywhere it appears; copy never implies expensive | 2 **[NN]** | **PASS** — `MenuItem.price` is non-nullable, so a priceless dish is unrepresentable. Seed asserts `price > 0` on every row. No UI here to carry voice. |
| 3 | Every value the client might change is DB-backed and dashboard-editable; no hardcoded content | 3 **[NN]** | **PASS** — this feature *is* that gate. Every string the client could want to change (branch address, dish name, page headline, delivery link) is a column, not a constant. |
| 4 | Every capability is reachable from a documented `/api/v1` endpoint the Flutter app could call with zero backend changes; no server actions hitting Prisma | 4 **[NN]** | **N/A — PASS.** No capability is exposed at all: no routes, no server actions, no Prisma call outside `prisma/seed.ts`. Nothing is web-only because nothing is reachable. The schema is what later `/api/v1` endpoints read. |
| 5 | Tech track honoured exactly (Node 22, Fastify 5, Prisma 6, PG 16, Redis 7, Next 15, React 19, pnpm+Turborepo); no substitutions | 5 **[NN]** | **PASS** — Prisma 6 + PostgreSQL 16, no ORM substitution, no query builder. `argon2` is the library Article 29 [NN] names by hand. |
| 6 | Repository layout matches the Article 6 tree | 6 **[NN]** | **PASS** — `apps/api/prisma/{schema.prisma, migrations/, seed.ts}` is Article 6's tree verbatim. |
| 7 | Each new API module is exactly `routes` / `service` / `repository` / `schema`; cross-module reads go via the other service | 7 **[NN]** | **N/A — PASS.** No module is added. The four-file rule binds the features that add them. |
| 8 | No duplicated source of truth (schema / Zod+OpenAPI / `packages/types` / `tokens.css` / message files / DB) | 8 **[NN]** | **PASS** — `schema.prisma` becomes the single data-shape source. `data-model.md` is rationale, explicitly labelled subordinate to the `.prisma` file. `MenuItemBranch.price` is nullable-means-inherit precisely so a per-branch row cannot become a second, drifting copy of the base price. |
| 9 | Additive to `v1` only — no removed, renamed, or retyped fields | 9 **[NN]** | **N/A — PASS.** No `v1` surface exists yet; there is nothing to break. This feature *establishes* the shape v1 will expose. |
| 10 | Every response is enveloped; every new error has a registered permanent code in `docs/api.md` | 10 **[NN]** | **N/A — PASS.** No endpoint, therefore no response and no error code. `docs/api.md` exists (feature 001) and gains no entry. |
| 11 | Build the phase in front of you; schema designed so Phase 9 ordering needs no alteration of these tables | 11 | **PASS** — discharged by written review at `contracts/phase-9-additive-review.md`: nine Phase 9 attachment points audited, all FK-outward, zero alterations. Two 002 choices (`AuditLog.entity` as plain `String`, `SiteSetting.value` as `Json`) exist specifically to preserve this. The `OrderItem.unitPrice` trap is named. |
| 12 | Content respects the three tiers (Entities / PageBlock copy / i18n UI chrome); no Tier-3 string moved into the dashboard; PageBlock falls back to a seeded default and enforces length limits | 12 **[NN]** | **PASS with recorded interpretation** — see Complexity Tracking. `(page, block)` + typed JSON instead of the article's literal `(page, block, field)`; all four substantive obligations still met. Tier 3 stays in `messages/{en,ar}.json`, and the seed tests assert no `PageBlock` is seeded for `nav`/`footer-links`. Per-field length limits are Zod-enforced by the content-API feature — owed, not dropped. |
| 13 | Curation stays manual (`isFeatured` + `featuredRank`); testimonials are entered by hand and cannot publish without `consentGiven` | 13 **[NN]** | **PASS** — `isFeatured` + nullable `featuredRank`, no ranking derived from anything. `Testimonial.consentGiven` exists and all 5 seeded rows set it `true`. Gallery is albums + `sortOrder` + optional `branchId` tag, exactly as the article specifies. The API-side publish rejection belongs to the testimonials feature; a stronger DB `CHECK` constraint is noted in `data-model.md` as available to it. |
| 14 | Dashboard is a pure API client…; authorisation is `requirePermission(...)` from the seeded map, never a `role === 'ADMIN'` conditional; unauthorised UI is not rendered at all | 14 **[NN]** | **N/A — PASS.** No dashboard code and no authorisation code is written here. `User.role`, `Reservation.handledById`, and `AuditLog.actorId` exist so the auth feature can attribute actions. `Permission`/`RolePermission` tables are deliberately deferred to that feature (research R10) — additive, and Article 11 puts them out of this phase. |
| 15 | Deletes are soft (30-day window); every Tier-1/Tier-2 mutation writes `AuditLog` with a JSON diff; reservation status changes write `ReservationEvent`; no `staffNotes`/audit data on public or customer endpoints | 15 **[NN]** | **PASS (columns), enforcement deferred by design** — `deletedAt` on every Tier 1 and Tier 2 model; `AuditLog` and `ReservationEvent` are first-class append-only tables (no `updatedAt`, no `deletedAt`). Filtering middleware, the audit writer, and the 30-day purge are API-layer behaviour owned by the features adding those endpoints (research R5). The seed deliberately puts `staffNotes` on at least one reservation so the later leak test has real data. |
| 16 | Zero raw hex, one-off font stacks, or arbitrary radii — all values from `tokens.css`; gold is the only accent; Zodiak self-hosted, no font CDN | 16 **[NN]** | **N/A — PASS.** No CSS, no component, no colour value. `tokens.css` untouched. |
| 17 | Signature components built to spec | 17 **[NN]** | **N/A — PASS.** No components. |
| 18 | Page inventory and per-page section order unchanged | 18 **[NN]** | **PASS** — the eight pages are encoded, not changed: `PageSeo` has one row per Article 18 page, `PageBlock` rows follow each page's section order via `sortOrder`, and `Category.sortOrder` seeds Article 18's menu order (pizza, calzone, pasta, mains, starters, breakfast, desserts, drinks). |
| 19 | Motion stays inside the seven-item budget; `prefers-reduced-motion` disables all of it | 19 **[NN]** | **N/A — PASS.** No animation. |
| 20 | Every image slot has a designed placeholder; R2 WebP/AVIF at 3 sizes via `next/image` with explicit dimensions + blurHash; `altEn` present, `alt=""` deliberate | 20 **[NN]** | **PASS (schema support)** — `GalleryImage` carries `blurHash`, `width`, `height`, and a **required** `altEn`; `MenuItem`, `Category`, `TeamMember`, `Post`, and `PageSeo` all carry paired alt fields. Rendering, resizing, and placeholder design belong to the web feature; this schema makes the required data non-optional so that feature cannot skip it. |
| 21 | `/[locale]/…` routes with `en` default and `ar` registered but flagged off; `_en`/`_ar` columns; strings in message files; logical CSS properties only | 21 **[NN]** | **PASS** — the `_en`/`_ar` half is this feature's core obligation and is enforced by an automated schema-shape test, not by review alone. `Post` gets bilingual *slugs* so an Arabic article can have its own URL. `feature.locale.ar.enabled` is seeded `false`. Routing and CSS are untouched. |
| 22 | Cacheable content uses ISR `revalidate: 60` + dashboard-save webhook; required JSON-LD, per-page SEO from PageBlock, generated sitemap/robots, `/pasca-menu/` 301 preserved | 22 **[NN]** | **N/A — PASS (schema support).** No rendering here. `PageSeo` provides the per-page title/description/OG image the article requires; `Branch` carries the address, geo, phone, and hours that `LocalBusiness`/`Restaurant` JSON-LD needs; `MenuItem` carries name, description, and price for `Menu`/`MenuItem` JSON-LD; `FaqItem` backs `FAQPage`. |
| 23 | Delivery stays surfaced via `SiteSetting` links, not owned | 23 | **PASS** — `delivery.talabat.url`, `delivery.elmenus.url`, `delivery.enabled` seeded as `SiteSetting` rows. `value` is `Json` so the Phase 9 cutover changes data, not schema. No delivery logic. |
| 24 | `Post` is modelled and CRUD-able; `/blog` ships behind an off-by-default flag | 24 | **PASS** — `Post` fully modelled with `status`, `publishedAt`, bilingual body and slugs; 2 `DRAFT` rows seeded; `feature.blog.enabled` seeded `false`. FR-007 forbids any public read path in this feature, and none is added. |
| 25 | Booking paths compute availability by seat overlap inside one transaction under `pg_advisory_xact_lock`; midnight-crossing, closure dates, and 60-min lead time included | 25 **[NN]** | **N/A — PASS (schema support).** No booking code. The schema supplies every input the article's query needs: `Branch.seatCapacity`, `Reservation.partySize`/`reservedAt`/`durationMin`/`status`, `@@index([branchId, reservedAt])`, `BranchClosure`, and — the one that is usually got wrong — `BranchHour.closesNextDay`, which makes Shobra's 02:00 close an explicit field rather than a comparison someone forgets to write. |
| 26 | Party ≤6 auto-confirms; >6 stays PENDING with `requiresCall`; 15-min hold; `durationMin` defaults to 90 | 26 **[NN]** | **PASS (schema + demonstrated in seed)** — `durationMin @default(90)`, `requiresCall`, nullable `tableId` (manual assignment), `DiningTable.seats`. FR-011 makes the seeded rows a working example: every `partySize > 6` row is `PENDING` + `requiresCall`, every `≤6` row is not. The 15-minute hold is availability-query behaviour, owned by the booking feature. |
| 27 | Notifications go through the `NotificationChannel` interface; no user-facing copy promises WhatsApp | 27 **[NN]** | **PASS** — no notification code. `Branch.whatsapp` stores a number, and `data-model.md` flags in place that no user-facing copy may promise WhatsApp confirmation until the adapter is live. No seeded `PageBlock` copy mentions WhatsApp. |
| 28 | Quality floor is verifiable on the deployed build; contrast checked; gold never used for body copy | 28 **[NN]** | **N/A — PASS.** No rendered surface to measure. |
| 29 | Security baseline holds (CORS allow-list, rate limits, argon2, refresh rotation + reuse detection, Zod on inputs, presigned uploads, EXIF stripped, no PII in logs) | 29 **[NN]** | **PASS on what this feature touches** — seeded passwords are argon2id via the real library (FR-012). `RefreshToken` carries `tokenHash` (never the token), `familyId`, `revokedAt`, and `replacedByTokenHash`, which is exactly what reuse detection + family revocation needs. The seed's stdout prints counts and slugs only, never phone numbers, emails, or `staffNotes` — "no PII in logs" applied to a dev script. Retention periods (reservations 12 months, messages 6 months) are recorded against the columns that hold that PII. |
| 30 | The Article 30 tests for every risk area this feature touches are planned as tasks; concurrency test is genuinely concurrent, not mocked | 30 | **PASS** — Article 30's listed rows are almost all API-layer and belong to the features that add those endpoints. What this feature *can* be tested for, it is: bilingual-column completeness (the i18n row's "no hardcoded strings" sibling, enforced structurally), seeded PageBlock defaults existing for all eight pages (the Content row's fallback precondition), and `consentGiven` on every seeded testimonial. Plus this feature's own risks: migration applies clean, seed is idempotent, zero orphaned FKs. **No test is mocked where a real database is the point** (research R13). |
| 31 | Definition of done is achievable: endpoint in OpenAPI spec, types regenerated, no mock data, dashboard-editable per Art 12, tests green, audit log firing, `pnpm lint && typecheck && test && build` green | 31 | **PASS, adapted** — "endpoint in OpenAPI" and "types regenerated" are N/A (no endpoint; `packages/types` is generated *from OpenAPI*, not from Prisma, so it is untouched). The applicable clauses hold: no mock data, content dashboard-editable per Article 12, tests green, and `pnpm lint && typecheck && test && build` green — plus this feature's own bar, `pnpm db:migrate && pnpm db:seed` producing a database the site could run against. |
| 32 | Migrations are a separate, explicitly approved step — never automatic on deploy | 32 | **PASS** — `migrate.yml` (feature 001) is unchanged: `workflow_dispatch` only, `environment: production`, required reviewer, typed confirmation. `ci.yml` gains a `postgres:16` **service container for tests** and still contains no migration step. This feature produces the first migration that gated workflow will ever apply. |
| 33 | Any client-facing deliverable this feature owes is listed | 33 | **PASS, with one item** — no Postman collection or handbook section (no endpoints). One deliverable: the branch address/phone/coordinate values in the seed are **unverified placeholders** marked `TODO(client-data)`. They must either be replaced with client-supplied values before merge or be declared as placeholders at handover. Recorded in `contracts/seed-dataset.md`. |

**Result**: **PASS** — 33/33. One recorded interpretation (gate 12) documented below; zero waivers.

## Project Structure

### Documentation (this feature)

```text
specs/002-content-schema-seed/
├── plan.md                              # This file
├── spec.md                              # Feature specification (4 clarifications recorded)
├── research.md                          # Phase 0 — R1–R13
├── data-model.md                        # Phase 1 — all 23 models, field by field
├── quickstart.md                        # Phase 1 — clean checkout → seeded database
├── contracts/
│   ├── phase-9-additive-review.md       # Article 11's prescribed design review (FR-008, SC-005)
│   ├── db-commands.md                   # pnpm db:migrate / db:seed / db:reset contract
│   └── seed-dataset.md                  # guaranteed row counts + asserted invariants
├── checklists/requirements.md           # spec quality gate (16/16)
└── tasks.md                             # Phase 2 — created by /speckit-tasks, not here
```

### Source Code (repository root)

Paths this feature adds or touches — the monorepo tree itself is unchanged from feature 001:

```text
apps/api/
├── prisma/
│   ├── schema.prisma                    # MODIFIED — 23 models + 8 enums replace the empty stub
│   ├── migrations/<ts>_initial_schema/  # NEW — the repo's first migration
│   └── seed/                            # NEW — seed split by domain, not one 900-line file
│       ├── index.ts                     #   orchestrator, dependency-ordered (research R7)
│       ├── site-settings.ts             #   delivery links + feature flags (Art 23, 24, 21)
│       ├── users.ts                     #   1 ADMIN + 1 MODERATOR, argon2id (R8)
│       ├── branches.ts                  #   2 branches + hours + tables  ⚠ TODO(client-data)
│       ├── menu.ts                      #   8 categories, ~40 items, variants, branch overrides
│       ├── gallery.ts                   #   4 albums + images
│       ├── marketing.ts                 #   testimonials, FAQ, team, milestones, posts
│       ├── page-content.ts              #   PageSeo ×8 + PageBlock for every named section
│       └── reservations.ts              #   20 reservations + events, SEED01–SEED20 (R6)
├── prisma/seed.ts                        # NEW — thin entry point calling seed/index.ts
├── prisma.config.ts                      # NEW — Prisma 6 seed config (research R12)
├── package.json                          # MODIFIED — db:migrate/seed/generate/reset/studio; +argon2
└── tests/
    ├── schema-shape.test.ts              # NEW — bilingual pairs, deletedAt, required indexes (no DB)
    ├── migration.test.ts                 # NEW — applies clean, all tables present (DB)
    └── seed.test.ts                      # NEW — dataset invariants, idempotency, FK integrity (DB)

package.json                              # MODIFIED — root db:* scripts delegating via --filter
pnpm-workspace.yaml                       # MODIFIED — allowBuilds: argon2 (native module)
.github/workflows/ci.yml                  # MODIFIED — postgres:16 service container for tests
```

**Structure Decision**: `apps/api` owns the schema and the only Prisma access, unchanged from
Article 6. Two decisions worth stating:

- **The seed is split by domain, not written as one file.** ~200 rows of fixture data across 23
  models in a single `seed.ts` becomes unreviewable and unmergeable. The split matches the
  dependency order the orchestrator runs in (research R7), so the file list *is* the execution
  order.
- **`db:*` are root scripts, not Turborepo tasks.** They target one package and mutate external
  state; `turbo`'s caching and fan-out are both actively wrong for that. A cached `db:seed` that
  reported success without touching the database would be a dangerous outcome, not a fast one.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Gate 12 [NN] — `PageBlock` keyed `(page, block)` + JSON, not the article's literal `(page, block, field)`** | Requested in the feature description and confirmed by clarification (2026-08-10) after the divergence was put to the user explicitly with both shapes shown. Article 12's four substantive obligations all still hold: the five named fields are editable per section (JSON keys), per-page SEO is editable (`PageSeo`), a seeded default exists for every block on all eight pages, and per-field character limits are enforced server-side by a shared Zod `PageBlockValue` schema on write. Only the physical row granularity differs. **This is recorded as an interpretation, not an amendment — no [NN] obligation is diluted, dropped, or deferred beyond its owning feature.** | The literal EAV shape (one row per field) was offered and declined. It costs: ~240 seed rows instead of ~48; a `GROUP BY` to render one block; five writes to save one block; and every value degraded to an untyped string with no structural guarantee that a block's five fields are even present together. If the client later requires literal `(page, block, field)` storage, that is a constitution question, not a code question — and the migration would be a data reshape, still additive. |

**Nothing else on this table.** The remaining 32 gates pass without qualification; every "N/A"
above means the feature creates no instance of what the gate governs, and each such row names the
column or table this schema provides so the later feature that *does* create one can comply.

## Known follow-ups (deliberate, not forgotten)

Recorded so they are decisions rather than surprises. None blocks this feature.

| Item | Owner | Why deferred |
|---|---|---|
| Soft-delete enforcement (read filtering, 30-day purge) and the partial unique indexes it requires (`WHERE deleted_at IS NULL`) | the features adding delete endpoints | Article 11. Half-wiring Prisma middleware now would give later features invisible behaviour they didn't write (research R5). The index change is additive. |
| `Permission` / `RolePermission` tables, if the role→permission map lives in the database | auth/permissions feature | Article 14 [NN] constrains the *API's check shape*, and there is no API here. Additive either way — `User.role` is untouched (research R10). |
| DB `CHECK` preventing `publishedAt IS NOT NULL AND consentGiven = false` | testimonials feature | Prisma can't declare it; needs a hand-edited migration. That feature owns Article 30's consent test. Noted in `data-model.md` so the option isn't lost. |
| Expression index for the `reservedAt + durationMin` half of Article 25's overlap predicate | availability feature | Not declarable in Prisma and premature without a real query plan. Adding an index is additive. |
| `production` environment's `DATABASE_URL` secret | user, via GitHub UI | Outstanding from feature 001 by the user's own choice. Needed before `migrate.yml` can apply this feature's migration to production. |
| Verify `prisma.config.ts` is supported by the pinned Prisma 6 minor; fall back to `package.json#prisma.seed` and record why if not | implementation | Research R12 — must be checked against the installed version, not assumed. |
