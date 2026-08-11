# Implementation Plan: Auth & Authorization

**Branch**: `003-auth-authorization` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-auth-authorization/spec.md`

## Summary

Stand up the API's first real endpoints: register/login/refresh/logout, `GET`/`PATCH /me`, and a
minimal user-management set (list/patch-role/patch-active/delete) — plus the authorization
primitive every future endpoint feature will depend on, `requirePermission(...)` driven entirely
by a new seeded `RolePermission` table. Because nothing before this feature ever added a route,
this is also the first feature to wire the shared infra those endpoints need: long-lived
Prisma/Redis Fastify decorators, CORS/Helmet/rate-limit plugins, the enveloped-error machinery
(Article 10), and the OpenAPI→`packages/types` codegen pipeline (Article 8). `docs/api.md` gains
its first registered codes.

Approach: JWT access tokens (15m, HS256, minimal `{sub, role}` payload — no embedded permission
list, so a role/grant change takes effect on the caller's very next request); opaque random
refresh tokens (30d) hashed with SHA-256 (not argon2id — R4) and rotated on every use with
database-level reuse detection (a conditional `UPDATE ... WHERE revokedAt IS NULL` makes the race
atomic, R10); one new `RolePermission` table seeded to mirror Article 14's table exactly, read
once into memory at boot (R6); the seven-plus domains this feature doesn't own real endpoints for
(reservation, message, menu, category, gallery, branch, content, testimonial, team, post,
settings, audit) get their permission-matrix coverage via test-only fixture routes, never
production stubs (R11, per the specify-time scope clarification).

## Technical Context

**Language/Version**: TypeScript strict, Node.js 22 LTS
**Primary Dependencies**: Fastify 5 + `fastify-type-provider-zod` (existing) · **new**:
`fast-jwt`, `@fastify/cookie`, `@fastify/rate-limit`, `@fastify/cors`, `@fastify/helmet`,
`@fastify/swagger` (api) · `openapi-typescript` (packages/types, dev dependency, codegen only) ·
`argon2` (existing, from 002 — password hashing) · Node's built-in `crypto` (refresh-token
generation + SHA-256 hashing, R4 — no new dependency)
**Storage**: PostgreSQL 16 via Prisma (one new model, `RolePermission`); Redis 7 via `ioredis`
(existing dependency, first real use — backs `@fastify/rate-limit`'s shared store, R7)
**Testing**: Vitest + `fastify.inject` (no real HTTP server needed for route tests); a genuinely
concurrent test for the refresh-rotation race (R10, no mocked timing) and for the last-active-ADMIN
invariant orderings (SC-006)
**Target Platform**: Linux server (`apps/api`). No UI ships in this feature.
**Project Type**: pnpm monorepo + Turborepo — this feature touches `apps/api` and `packages/types`
(codegen pipeline stood up, R9), plus `docs/api.md` and the root agent-context pointer.
**Performance Goals**: Sign-in-to-first-authenticated-call under 2s end-to-end under normal
conditions (SC-001) — no load target beyond that; Article 30's k6 row targets `GET /menu` and
`POST /reservations`, neither of which exists yet.
**Constraints**: Shared 5/min/IP budget across every `/auth/*` route, not per-route (Clarification
Q1); refresh cookie `httpOnly`+`sameSite:strict`+`secure` in production (R8); `isActive`/
`deletedAt` re-checked on every authenticated request, not cached (FR-004); no notification system
stood up for reuse detection (Clarification Q3 — log/audit only); no ordering/payment/loyalty/
delivery code (Article 1 [NN]).
**Scale/Scope**: 2 seeded staff accounts (existing, from 002) exercise US1/US2/US3 directly;
US4 (customer self-service) needs no new seed data — registration creates its own fixture.
`RolePermission` seeds ~18 rows (one per Article 14 permission string × granted role).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Re-evaluated after Phase 1. Verdicts below are the post-design state.

| # | Gate | Art | Verdict |
|---|---|---|---|
| 1 | Feature stays inside MVP scope; no ordering/payment/loyalty/delivery code, tables, or scaffolding | 1 **[NN]** | **PASS** — zero such tables or endpoints. `RolePermission` is authorization infrastructure, not a product-scope table. |
| 2 | Brand positioning respected; every dish shows a price everywhere it appears; copy never implies expensive | 2 **[NN]** | **N/A** — no menu/pricing surface in this feature. |
| 3 | Every value the client might change is DB-backed and dashboard-editable; no hardcoded content | 3 **[NN]** | **N/A** — no visitor-facing content. `RolePermission` is security config, seed-editable per Art 14's own "editing a seed" wording, not dashboard-editable in this feature (Assumptions) — recorded, not a gate violation, since Art 3 governs client-facing content, not internal authorization data. |
| 4 | Every capability is reachable from a documented `/api/v1` endpoint the Flutter app could call with zero backend changes; no server actions hitting Prisma | 4 **[NN]** | **PASS** — every FR-001–FR-018 capability is a `/api/v1` route (`auth-endpoints.md`); web/mobile differ only in refresh-token transport (cookie vs. body), decided server-side, not by a client-declared shortcut. |
| 5 | Tech track honoured exactly (Node 22, Fastify 5, Prisma 6, PG 16, Redis 7, Next 15, React 19, pnpm+Turborepo); no substitutions | 5 **[NN]** | **PASS** — `@fastify/{jwt,cookie,rate-limit,cors,helmet,swagger}` are the Fastify team's own plugins implementing the already-locked "Auth: JWT access 15m + rotating refresh 30d" and Article 29 rows, not substitutions of a locked layer (R2). Redis 7 gets its first real consumer (rate-limit store), not a new store. |
| 6 | Repository layout matches the Article 6 tree | 6 **[NN]** | **PASS** — `src/modules/{auth,users,permissions}/`, `src/plugins/{prisma,redis,cors,helmet,auth,rbac,ratelimit,errors}.ts`, `src/lib/{jwt,hash}.ts` are named in Article 6's tree verbatim (`modules/ auth users ...`, `plugins/ auth rbac prisma redis ... ratelimit errors`, `lib/ jwt hash ...`). |
| 7 | Each new API module is exactly `routes` / `service` / `repository` / `schema`; cross-module reads go via the other service | 7 **[NN]** | **PASS** — three modules (`auth`, `users`, `permissions`), each exactly four files. `auth.service` calls `users.service` for credential lookup/account creation (never `users.repository` directly); `requirePermission` (a plugin, not a module) calls `permissions.service`. |
| 8 | No duplicated source of truth (schema / Zod+OpenAPI / `packages/types` / `tokens.css` / message files / DB) | 8 **[NN]** | **PASS** — this feature is what makes Article 8's "API contracts | Zod → TS types → OpenAPI 3.1" and "Shared types | packages/types, generated" rows real for the first time (R9); no hand-written type duplicates a Zod schema. `env.ts` gains `JWT_ACCESS_SECRET`/`COOKIE_SECRET`, still the one file that reads `process.env`. |
| 9 | Additive to `v1` only — no removed, renamed, or retyped fields | 9 **[NN]** | **PASS** — first real `v1` surface; nothing exists yet to break. |
| 10 | Every response is enveloped; every new error has a registered permanent code in `docs/api.md` | 10 **[NN]** | **PASS** — `plugins/errors.ts` is the enveloped-response + error-mapping machinery this feature builds; `research.md` R12 lists the 13 codes registered into `docs/api.md` in the same PR. |
| 11 | Build the phase in front of you; schema designed so Phase 9 ordering needs no alteration of these tables | 11 | **PASS** — the specify-time scope clarification exists precisely to keep this feature to auth+primitive rather than pre-building seven unrelated domains' CRUD; `RolePermission` has no Phase 9 relevance either way. |
| 12 | Content respects the three tiers (Entities / PageBlock copy / i18n UI chrome); no Tier-3 string moved into the dashboard | 12 **[NN]** | **N/A** — no content model touched. |
| 13 | Curation stays manual; testimonials entered by hand, consent-gated | 13 **[NN]** | **N/A**. |
| 14 | Dashboard is a pure API client; authorisation is `requirePermission(...)` from the seeded map, never a `role === 'ADMIN'` conditional; unauthorised UI is not rendered at all | 14 **[NN]** | **PASS on the API-layer clauses (this feature's scope) — UI-rendering clause N/A.** This feature *is* the seeded map and the preHandler (FR-011/FR-012); every permission string in the article's table is seeded and proven (permission-matrix.md). "Unauthorised UI is not rendered" binds `apps/admin`, which doesn't exist yet — that feature inherits this API's 403s and renders around them; nothing here contradicts the clause, it simply has no UI to apply it to. |
| 15 | Deletes are soft (30-day window); every Tier-1/Tier-2 mutation writes `AuditLog`; `staffNotes`/audit data never on public or customer endpoints | 15 **[NN]** | **PASS** — `User` delete (FR-013) sets `deletedAt`, not a row delete; every `User` create/update/delete writes an `AuditLog` diff (FR-021, data-model.md); no `AuditLog` field is ever returned from `GET`/`PATCH /me` or any endpoint this feature ships. |
| 16 | Zero raw hex, one-off font stacks, or arbitrary radii — tokens.css only | 16 **[NN]** | **N/A** — no UI. |
| 17 | Signature components built to spec | 17 **[NN]** | **N/A**. |
| 18 | Page inventory and section order unchanged | 18 **[NN]** | **N/A**. |
| 19 | Motion budget respected | 19 **[NN]** | **N/A**. |
| 20 | Images: placeholders, R2 sizes, required alt text | 20 **[NN]** | **N/A**. |
| 21 | `/[locale]/…` routing, `_en`/`_ar` columns, message files, logical CSS | 21 **[NN]** | **N/A at this layer** — backend-only feature, no UI string introduced. Error `code` values are locale-independent identifiers by construction (AR-003); translation of user-facing copy from a `code` is the consuming client's job. |
| 22 | ISR + revalidate webhook; required JSON-LD; sitemap/robots; `/pasca-menu/` redirect preserved | 22 **[NN]** | **N/A** — no rendering. |
| 23 | Delivery stays surfaced via `SiteSetting`, not owned | 23 | **N/A**. |
| 24 | `Post` modelled and CRUD-able; `/blog` behind a flag | 24 | **N/A**. |
| 25 | Booking: seat-overlap in one transaction under `pg_advisory_xact_lock`; midnight-crossing, closures, lead time | 25 **[NN]** | **N/A** — no booking code; `reservation:*` permission strings are seeded but no reservation route ships here (permission-matrix.md uses fixture routes for this domain). |
| 26 | Party ≤6 auto-confirms; >6 stays PENDING; 15-min hold; 90-min default duration | 26 **[NN]** | **N/A**. |
| 27 | Notifications go through `NotificationChannel`; no copy promises WhatsApp | 27 **[NN]** | **PASS/N/A** — Clarification Q3 explicitly decided against building any notification path for reuse detection (log/audit only); this feature introduces zero notification code, so it neither uses nor bypasses `NotificationChannel`, and makes no WhatsApp claim. |
| 28 | Quality floor verifiable on deployed build; contrast checked | 28 **[NN]** | **N/A** — no rendered surface. |
| 29 | Security baseline (Helmet, CORS allow-list, rate limits, argon2, refresh rotation + reuse detection, httpOnly/SameSite cookies, Zod on every input, no PII in logs) | 29 **[NN]** | **PASS** — this feature *is* the baseline for everything it touches: `plugins/{cors,helmet}.ts` registered globally for the first time (R1); `@fastify/rate-limit` on the shared `/auth/*` budget (R7, Clarification Q1); argon2id passwords (existing dependency, FR-002); refresh rotation + reuse detection + family revocation (FR-006/FR-007, R4/R10); httpOnly+SameSite+secure cookie for web, bearer body for mobile (FR-009/FR-010, R8); Zod DTOs on every route body/query/param (`*.schema.ts` per module, Art 7); FR-022 + the existing "no PII in logs" pattern from `prisma/seed/users.ts` extended to runtime logging. |
| 30 | Article 30 tests for every risk area this feature touches are planned as tasks; concurrency test is genuinely concurrent | 30 | **PASS** — this feature owns exactly the two rows Article 30 names by domain: "Permissions | every role × every admin endpoint" (`permission-matrix.md`, SC-002) and "Auth | refresh reuse detection revokes the family" (US3, SC-003). The rotation-race test (R10) fires genuinely concurrent requests, not mocked timing, matching the article's own concurrency standard from Article 25. |
| 31 | Definition of done: endpoint in OpenAPI, types regenerated, no mock data, dashboard-editable per Art 12, tests green, audit log firing, `lint && typecheck && test && build` green | 31 | **PASS, adapted** — "dashboard-editable per Art 12" is N/A (no Tier 1/2 content here); every other clause applies directly and is this feature's actual deliverable: OpenAPI document served (R9), `packages/types` generated from it, `AuditLog` firing on every `User` mutation (FR-021), full gate green. |
| 32 | Migrations are a separate, explicitly approved step — never automatic on deploy | 32 | **PASS** — one new migration (`RolePermission`) follows 002's precedent exactly: `migrate.yml` unchanged, `workflow_dispatch` only, still nothing in `ci.yml` applies it to a real environment. |
| 33 | Any client-facing deliverable this feature owes is listed | 33 | **N/A for this feature** — Article 33's three Postman collections are an at-handover deliverable spanning every shipped endpoint, not owed per-feature; recorded here so it isn't forgotten by the feature that ships last before handover. |

**Result**: **PASS** — 33/33 (14 N/A, 1 PASS-with-recorded-scope-note on row 3, 1
PASS-with-partial-applicability on row 14 — both are "this row's obligation doesn't fully apply
to a backend-only feature," not waivers). Zero violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-authorization/
├── plan.md                              # This file
├── spec.md                              # Feature specification (3 clarifications recorded)
├── research.md                          # Phase 0 — R1–R12
├── data-model.md                        # Phase 1 — RolePermission + existing-model deltas
├── quickstart.md                        # Phase 1 — curl walkthrough + test commands
├── contracts/
│   ├── auth-endpoints.md                # every route, request/response, error codes
│   └── permission-matrix.md             # the literal assertion list for SC-002 / Article 30
├── checklists/requirements.md           # spec quality gate (16/16)
└── tasks.md                             # Phase 2 — created by /speckit-tasks, not here
```

### Source Code (repository root)

Paths this feature adds or touches — the monorepo tree itself is unchanged from feature 001:

```text
apps/api/
├── prisma/
│   ├── schema.prisma                    # MODIFIED — + RolePermission model
│   ├── migrations/<ts>_role_permission/ # NEW
│   └── seed/
│       ├── permissions.ts               # NEW — one row per Article 14 ✅ cell (R5)
│       └── index.ts                     # MODIFIED — calls seedPermissions()
├── src/
│   ├── config/env.ts                    # MODIFIED — + JWT_ACCESS_SECRET, COOKIE_SECRET
│   ├── app.ts                           # MODIFIED — registers new plugins + /api/v1 modules
│   ├── plugins/
│   │   ├── prisma.ts                    # NEW — fastify.prisma decorator (R1)
│   │   ├── redis.ts                     # NEW — fastify.redis decorator (R1)
│   │   ├── cors.ts                      # NEW — CORS_ORIGINS allow-list (R1, Art 29)
│   │   ├── helmet.ts                    # NEW (R1, Art 29)
│   │   ├── rate-limit.ts                # NEW — Redis-backed, shared /auth/* budget (R7)
│   │   ├── auth.ts                      # NEW — @fastify/cookie setup + authenticate preHandler (lib/jwt.ts), request.user decorator
│   │   ├── rbac.ts                      # NEW — requirePermission(...) preHandler factory (R6)
│   │   ├── errors.ts                    # NEW — envelope + registered-code mapping (Art 10)
│   │   └── swagger.ts                   # NEW — OpenAPI 3.1 document (R9)
│   ├── lib/
│   │   ├── jwt.ts                       # NEW — sign/verify access tokens (R3)
│   │   └── hash.ts                      # NEW — argon2id (passwords) + SHA-256 (refresh tokens, R4)
│   └── modules/
│       ├── auth/
│       │   ├── auth.routes.ts           # register, login, refresh, logout
│       │   ├── auth.service.ts          # token issuance/rotation/reuse-detection logic
│       │   ├── auth.repository.ts       # RefreshToken CRUD only
│       │   └── auth.schema.ts           # Zod DTOs
│       ├── users/
│       │   ├── users.routes.ts          # GET/PATCH /me, GET/PATCH /users/:id/*, DELETE /users/:id
│       │   ├── users.service.ts         # profile updates, self-protection invariants (FR-014/015)
│       │   ├── users.repository.ts      # User CRUD only
│       │   └── users.schema.ts
│       └── permissions/
│           ├── permissions.routes.ts    # GET /permissions (audit:read) — lists the seeded map; keeps the module a real four-file citizen rather than a routes-less exception to Art 7
│           ├── permissions.service.ts   # in-memory role→permission Set (R6)
│           ├── permissions.repository.ts# RolePermission read-only access
│           └── permissions.schema.ts
└── tests/
    ├── fixtures/example-protected-routes.ts   # NEW — test-only routes for R11
    ├── permissions/permission-matrix.test.ts  # NEW — SC-002, Article 30
    ├── auth/refresh-reuse.test.ts             # NEW — SC-003, Article 30, genuinely concurrent
    ├── auth/login-session.test.ts             # NEW — US1
    ├── auth/register.test.ts                  # NEW — US4
    ├── users/self-protection.test.ts          # NEW — SC-006, exhaustive orderings
    └── users/me.test.ts                       # NEW — FR-016/FR-017

packages/types/
├── package.json                          # MODIFIED — + openapi-typescript devDependency
└── scripts/generate.ts                   # NEW — fetches OpenAPI doc, writes src/*

docs/api.md                               # MODIFIED — 13 codes registered (research.md R12)
CLAUDE.md                                 # MODIFIED — SPECKIT plan pointer → this file
```

**Structure Decision**: `apps/api` gains its first `plugins/`, `modules/`, and populated `lib/`
directories, all matching Article 6's tree exactly rather than inventing a shape. Three modules
(`auth`, `users`, `permissions`) rather than one large "auth" module — `users` already appears as
its own named entry in Article 6's module list, and splitting keeps each module's repository
scoped to one table (`RefreshToken` / `User` / `RolePermission`), which is what makes Article 7's
"cross-module reads go through the other module's service" rule enforceable instead of aspirational.

## Complexity Tracking

*No entries — Constitution Check has zero violations requiring justification.*

## Known follow-ups (deliberate, not forgotten)

| Item | Owner | Why deferred |
|---|---|---|
| Real CRUD endpoints for reservation, message, menu, category, gallery, branch, content, testimonial, team, post, settings, audit | their own future features | Scope clarification (2026-08-10): this feature proves `requirePermission` works for every permission string via test-only fixtures; each domain's real feature inherits the same guard for free (R11). |
| `apps/admin` consuming this API and hiding unauthorised controls (Art 14's "not rendered at all" clause) | future admin-dashboard feature | No UI exists yet; this feature only ships the API-side 403s that UI will render around. |
| A dashboard UI (or any endpoint) to edit `RolePermission` at runtime | future feature, if ever needed | Seed-only for now (Assumptions in spec.md); R6's in-memory cache-at-boot design would need revisiting (live invalidation) the day this becomes editable without a restart. |
| Password-reset / forgot-password / email-verification flows | future feature | Not in this feature's requested endpoint list (spec.md Assumptions). |
| Three tagged Postman collections (Article 33) | whichever feature ships last before handover | At-handover deliverable spanning every endpoint shipped by then, not owed per-feature. |
| `production` environment's `DATABASE_URL` secret, `JWT_ACCESS_SECRET`/`COOKIE_SECRET` production values | user, via GitHub UI / secrets manager | Outstanding from feature 001/002 by the user's own choice; this feature adds two more secrets to that same outstanding item, not a new blocker. |
