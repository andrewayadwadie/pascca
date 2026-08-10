---

description: "Task list for 002-content-schema-seed"
---

# Tasks: Content Data Model & Seed

**Input**: Design documents from `/specs/002-content-schema-seed/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Article 30's listed risk areas are almost all API-layer and belong to the features that
add those endpoints — there are no endpoints here. What this feature *can* be tested for, it is,
and those tests are **mandatory**: bilingual-column completeness (Article 21 [NN], enforced
structurally so it survives future features), seeded PageBlock defaults for all eight pages
(the precondition Article 30's Tier-2 fallback test depends on), `consentGiven` on every seeded
testimonial (Article 13 [NN]), plus this feature's own risks — migration applies clean, seed is
idempotent, zero orphaned foreign keys. **Nothing is mocked where a real database is the point**
(research R13).

**Organization**: Grouped by user story so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 from spec.md
- Exact file paths in every description

## Path Conventions

- **Schema**: `apps/api/prisma/schema.prisma` (Art 8 [NN] — the single data-shape source)
- **Migrations**: `apps/api/prisma/migrations/`
- **Seed**: `apps/api/prisma/seed.ts` + `apps/api/prisma/seed/` (split by domain — plan.md)
- **Tests**: `apps/api/tests/`
- **No** `apps/api/src/modules/` work in this feature — no API is built here (Article 11)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make `pnpm db:migrate` and `pnpm db:seed` exist and be runnable. No schema yet.

- [X] T001 Add `argon2` to `dependencies` in `apps/api/package.json` (Art 29 [NN] names it; research R8)
- [X] T002 Add `argon2: true` to the `allowBuilds` map in `pnpm-workspace.yaml` — it is a native module and pnpm 11 silently skips unapproved build scripts, producing a runtime failure rather than an install error (research R8)
- [X] T003 Verify `prisma.config.ts` is supported by the installed Prisma 6 minor version; if it is, create `apps/api/prisma.config.ts` declaring the seed command; if it is **not**, fall back to a `"prisma": { "seed": ... }` block in `apps/api/package.json` and record the version and reason as a comment there (research R12 — check, do not assume)
- [X] T004 Add `db:generate`, `db:migrate`, `db:seed`, `db:reset`, `db:studio` scripts to `apps/api/package.json`, each carrying `--env-file-if-exists=../../.env` on **both** the `prisma` and `tsx` invocations (contracts/db-commands.md — the Prisma CLI reads its own process env; omitting the flag there makes `db:migrate` fail while `db:seed` works)
- [X] T005 Add the matching root `db:*` scripts to `package.json`, each delegating via `pnpm --filter @pascca/api <script>` — **not** as `turbo run` tasks, since they target one package and mutate external state (plan.md Structure Decision)
- [X] T006 Add a `postgres:16` service container with a healthcheck to the `quality` job in `.github/workflows/ci.yml`, and set `DATABASE_URL` for the Test step only — CI currently has **no database**, so the migration and seed tests would otherwise silently never run (research R13). Do **not** add any migration step to this file (Art 32 [NN])
- [X] T007 Run `pnpm install` and confirm it completes with `argon2` built (no "ignored build scripts" warning naming it), then `docker compose up -d` and confirm `postgres` reports healthy

**Checkpoint**: `pnpm db:migrate` runs and reports "no pending migrations" against a live, empty database.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The test harness both US1 and US2 need. Blocks all story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Create `apps/api/tests/helpers/db.ts` exporting a shared `PrismaClient` plus `resetDatabase()` (truncate all tables, restart identities) and `disconnect()`. It must **fail loudly** when `DATABASE_URL` is absent rather than skipping — a database test that quietly passes without a database is worse than one that fails (research R13)
- [X] T009 Update `apps/api/vitest.config.ts` to raise `testTimeout` for database-backed suites (argon2 hashing plus ~200 seeded rows exceeds the default) and to run test files sequentially, since they share one database and would otherwise truncate each other's data mid-run

**Checkpoint**: A trivial test importing `tests/helpers/db.ts` connects and disconnects cleanly.

---

## Phase 3: User Story 1 — Every content type has a home in the database (Priority: P1) 🎯 MVP

**Goal**: Every one of the 23 models exists with the fields, relationships, and indexes the spec
names, correctly constrained and bilingual where it should be.

**Independent Test**: Apply the migration to an empty database. Every expected table exists with
the expected columns and indexes — verifiable by direct inspection, with zero application code
and zero seed data.

### Tests for User Story 1 (MANDATORY) ⚠️

> Write these FIRST and confirm they FAIL before touching `schema.prisma`.

- [X] T010 [US1] Create `apps/api/tests/schema-shape.test.ts` — parses `prisma/schema.prisma` as text and asserts, with **no database**: (a) every field ending `En` has an `Ar` sibling on the same model and vice versa (Art 21 [NN], FR-002), (b) every Tier 1 model and `PageBlock`/`PageSeo` declares `deletedAt DateTime?` (Art 15 [NN]), (c) `MenuItem` declares `@@index([isFasting])` and `@@index([isFeatured])` (FR-003), (d) `Reservation` declares `@@index([branchId, reservedAt])`, `@@index([status, reservedAt])`, `@@index([phone])` (FR-006), (e) `AuditLog` and `ReservationEvent` declare **neither** `updatedAt` nor `deletedAt` — append-only. Include an explicit allow-list of the entered-data fields that are correctly *not* bilingual (`customerName`, `phone`, `email`, `notes`, `staffNotes`, `author`, `name`, `message`, `subject`, `code`, `slug` where single) so the test states the data-model.md rule rather than guessing it
- [X] T011 [US1] Create `apps/api/tests/migration.test.ts` — applies migrations to a clean database via `tests/helpers/db.ts` and asserts all 24 tables exist (23 models + `_prisma_migrations`), querying `information_schema.tables`

### Implementation for User Story 1

> All tasks below edit the same file (`apps/api/prisma/schema.prisma`), so **none are parallel**.
> They are split by domain so each is a reviewable diff, not because they can run concurrently.

- [X] T012 [US1] Replace the empty-stub comment block in `apps/api/prisma/schema.prisma` with the 8 enums from data-model.md: `Role`, `ReservationStatus`, `ReservationSource`, `ReservationOccasion`, `TestimonialSource`, `PostStatus`, `MessageStatus`, `AuditAction`. Include `MOBILE_APP` in `ReservationSource` now so Phase 8 needs no enum change
- [X] T013 [US1] Add `User` and `RefreshToken` to `apps/api/prisma/schema.prisma` per data-model.md Domain 1. `RefreshToken` stores `tokenHash` (never the token), `familyId`, `revokedAt`, `replacedByTokenHash` — the four fields Article 29 [NN]'s reuse detection and family revocation need. No `Permission`/`RolePermission` tables (research R10)
- [X] T014 [US1] Add `Branch`, `BranchHour`, `BranchClosure`, `DiningTable` per data-model.md Domain 2. `BranchHour` stores `opensAt`/`closesAt` as **minutes past midnight** with explicit `closesNextDay` and `isOpen24h` booleans — Shobra's 02:00 close means `closesAt < opensAt` is a legitimate state, and Article 25 [NN] calls this out by name (research R3)
- [X] T015 [US1] Add `Category`, `MenuItem`, `MenuItemVariant`, `MenuItemBranch` per data-model.md Domain 3. All prices are `Int` piastres (research R2). `MenuItem.price` is **non-nullable** (Art 2 [NN]: a priceless dish must be unrepresentable). `MenuItemBranch.price`/`isAvailable` are **nullable = inherit from the parent item** — copying the base price into every row would create the second drifting source of truth Article 8 [NN] forbids
- [X] T016 [US1] Add `Reservation` and `ReservationEvent` per data-model.md Domain 4, including all three required indexes and `durationMin @default(90)`, `tableId` nullable (`SetNull`), `handledById` nullable (`SetNull`), and `staffNotes`. `ReservationEvent` is append-only — `createdAt` only
- [X] T017 [US1] Add `GalleryAlbum`, `GalleryImage`, `Testimonial`, `FaqItem`, `TeamMember`, `Milestone`, `Post` per data-model.md Domain 5. `GalleryImage.altEn` is **required** (Art 20 [NN]); `Post` gets bilingual slugs (`slugEn @unique`, `slugAr @unique`) so an Arabic article can have its own URL; `Testimonial.consentGiven` defaults `false`
- [X] T018 [US1] Add `PageBlock` (`@@unique([page, block])`, `value Json`) and `PageSeo` (`page @unique`) per data-model.md Domain 6. This is the shape the 2026-08-10 clarification chose over Article 12's literal `(page, block, field)` — see plan.md Complexity Tracking. `ctaHref` is not bilingual
- [X] T019 [US1] Add `ContactMessage`, `SiteSetting` (`value Json`), and `AuditLog` per data-model.md Domain 7. `AuditLog.entity`/`entityId` stay plain `String` and `SiteSetting.value` stays `Json` **specifically** to keep Phase 9 additive (contracts/phase-9-additive-review.md); `AuditLog` is append-only with no `updatedAt`/`deletedAt`
- [X] T020 [US1] Review every relation in `apps/api/prisma/schema.prisma` against data-model.md's referential-integrity table and set `onDelete` explicitly per relation — `Cascade` for dependent children, `Restrict` for `MenuItem → Category` and `Reservation → Branch`, `SetNull` for every attribution and optional tag. Do not leave any relation on Prisma's default
- [X] T021 [US1] Run `pnpm db:migrate` to generate and apply the initial migration; commit the generated SQL under `apps/api/prisma/migrations/`
- [X] T022 [US1] Run `pnpm db:generate` and confirm the Prisma client typechecks (`pnpm --filter @pascca/api typecheck`)
- [X] T023 [US1] Run `pnpm --filter @pascca/api test` and confirm T010 and T011 now **pass** (they must have failed before T012)
- [X] T024 [US1] Verify US1 acceptance scenario 2 against the live database: `EXPLAIN` a query filtered on `isFasting` and one on `isFeatured` and confirm each uses an index scan, not a sequential scan. Record the output in the task's commit message

**Checkpoint**: US1 is complete and independently valuable — a fully-shaped, empty database.

---

## Phase 4: User Story 2 — The database starts with a working restaurant in it (Priority: P2)

**Goal**: `pnpm db:seed` produces a browsable Pascca — both branches, the menu, gallery,
testimonials, page copy, staff, and a plausible reservation queue.

**Independent Test**: Run the seed against a freshly migrated database and inspect it directly.
Every count and invariant in `contracts/seed-dataset.md` holds.

**Depends on**: US1 (the tables must exist).

### Tests for User Story 2 (MANDATORY) ⚠️

> Write FIRST and confirm they FAIL (the seed does not exist yet).

- [X] T025 [US2] Create `apps/api/tests/seed.test.ts` asserting the `contracts/seed-dataset.md` invariants: exact counts where FR-010/FR-014 fix them (2 branches, 8 categories, 4 albums, 5 testimonials, 20 reservations, **0** `RefreshToken`, **0** `AuditLog`) and ranges where they don't (~40 menu items); every `MenuItem.price > 0`; exactly 4 `isFeatured` with 4 **distinct** non-null `featuredRank`s and `null` rank on every other item; all 5 testimonials `consentGiven = true` (Art 13 [NN]); all 8 pages present in `PageSeo` with ≥1 `PageBlock` each (Art 12 [NN] fallback precondition); `shobra` has a `BranchHour` with `closesNextDay = true` and `closesAt < opensAt`; every `heliopolis` hour row has `isOpen24h = true`; every seeded `User.passwordHash` starts with `$argon2id$` (Art 29 [NN], FR-012)
- [X] T026 [US2] Add to `apps/api/tests/seed.test.ts` the Article 26 [NN] confirmation-policy assertions (FR-011): every seeded reservation with `partySize > 6` has `status = PENDING` **and** `requiresCall = true`; every row with `partySize <= 6` has `requiresCall = false`; all six `ReservationStatus` values appear at least once; both branches appear; at least one row has `tableId = null` and at least one has a table assigned; at least one row carries `staffNotes` (so the later "staffNotes never leaks publicly" test has real data instead of passing vacuously)
- [X] T027 [US2] Add to `apps/api/tests/seed.test.ts` the Article 12 [NN] Tier-3 guard: assert **no** seeded `PageBlock.block` value matches nav, footer, or button micro-copy keys (`nav`, `nav-links`, `footer`, `footer-links`, `buttons`) — those strings belong in `messages/{en,ar}.json` and putting them in the dashboard is a violation, not a convenience

### Implementation for User Story 2

> These are **separate files** and can be authored in parallel; their *runtime* order is fixed by
> the orchestrator in T036, not by authoring order (research R7).

- [X] T028 [P] [US2] Create `apps/api/prisma/seed/site-settings.ts` — upsert on `key` (research R6): `delivery.talabat.url`, `delivery.elmenus.url`, `delivery.enabled` (Art 23), `social.instagram.url`, `feature.blog.enabled = false` (Art 24), `feature.locale.ar.enabled = false` (Art 21 [NN]). No dashboard *labels* here — those are Tier 3 (Art 12 [NN])
- [X] T029 [P] [US2] Create `apps/api/prisma/seed/users.ts` — one `ADMIN`, one `MODERATOR`, upserted on `email`. Hash with the real `argon2` library at argon2id defaults (Art 29 [NN], FR-012), reading the plaintext from an env var when present and otherwise a clearly-marked development default. Print the one-line warning from `contracts/seed-dataset.md`; print **no** password, email, or phone value
- [X] T030 [P] [US2] Create `apps/api/prisma/seed/branches.ts` — both branches upserted on `slug`, with `BranchHour` rows (Shobra `opensAt 720, closesAt 120, closesNextDay true`; Heliopolis `isOpen24h true` on all 7 days) and ~6 `DiningTable` rows each with varied `seats`. Mark every unverified address, phone, latitude, and longitude with a `// TODO(client-data)` comment — these are realistic placeholders, not client-supplied facts (contracts/seed-dataset.md, plan.md gate 33)
- [X] T031 [P] [US2] Create `apps/api/prisma/seed/menu.ts` — 8 categories upserted on `slug` in Article 18's order (pizza, calzone, pasta, mains, starters, breakfast, desserts, drinks); ~40 `MenuItem` rows upserted on `slug` with prices in **piastres**, correct `isFasting`/`isVegetarian` flags set independently of each other, and exactly 4 `isFeatured` with `featuredRank` 1–4; ~12 `MenuItemVariant` rows only where a dish genuinely has sizes; ~6 `MenuItemBranch` rows only where divergence is **real** (seeding one per item × branch would create ~80 rows all saying "same as parent" — the redundancy `null`-means-inherit exists to prevent)
- [X] T032 [P] [US2] Create `apps/api/prisma/seed/gallery.ts` — the four Article 13 [NN] albums (The food, The rooms, Breakfast, Occasions) upserted on `slug`, ~6 `GalleryImage` rows each with non-empty `altEn`, `blurHash`, `width`, `height` (Art 20 [NN]) and `sortOrder`; tag a subset with `branchId`
- [X] T033 [P] [US2] Create `apps/api/prisma/seed/marketing.ts` — 5 testimonials (**all** `consentGiven: true`, `publishedAt` non-null, `source` spanning more than one enum member), ~10 `FaqItem` rows split across general and booking, ~5 `TeamMember`, ~5 `Milestone` starting at 2018 (Shobra's opening), and 2 `Post` rows left `DRAFT` — nothing reads them (Art 24), and no public route may be added (FR-007)
- [X] T034 [P] [US2] Create `apps/api/prisma/seed/page-content.ts` — one `PageSeo` row per Article 18 page and one `PageBlock` per named section of all eight pages, upserted on `[page, block]`, each `value` carrying a non-empty `headlineEn`. This is what makes the site render before anyone opens the dashboard (FR-010, Art 12 [NN]). Write English copy in Article 2 [NN]'s voice — warm, plain, a little funny, never implying expensive. Leave every `*Ar` key `null`
- [X] T035 [P] [US2] Create `apps/api/prisma/seed/reservations.ts` — 20 reservations upserted on deterministic codes `SEED01`…`SEED20` (research R6), satisfying every FR-011 and `contracts/seed-dataset.md` invariant asserted in T026, with `reservedAt` values straddling now (past rows `COMPLETED`/`NO_SHOW`, future rows `PENDING`/`CONFIRMED`) so a dashboard queue looks plausible; plus a `ReservationEvent` history per reservation
- [X] T036 [US2] Create `apps/api/prisma/seed/index.ts` — the orchestrator, running the modules in research R7's dependency order and passing captured IDs forward so no foreign key is ever guessed. Deliberately **not** wrapped in one transaction: each module is independently idempotent, so a failure is fixed by correcting the data and re-running, and you learn *where* it failed
- [X] T037 [US2] Create `apps/api/prisma/seed.ts` — thin entry point calling `seed/index.ts`, printing the per-model count summary, and exiting non-zero on failure. Counts and slugs only in the output; **never** a phone number, email, password, or `staffNotes` value (Art 29 [NN] applies to a dev script's stdout too)
- [X] T038 [US2] Run `pnpm db:seed` against a freshly migrated database and confirm it completes and reports its counts
- [X] T039 [US2] Run `pnpm --filter @pascca/api test` and confirm T025, T026, and T027 now **pass**

**Checkpoint**: US1 and US2 both work. `pnpm db:migrate && pnpm db:seed` produces a database the
site could run against — the feature's stated acceptance criterion.

---

## Phase 5: User Story 3 — Seeding is safe to run more than once (Priority: P3)

**Goal**: A second seed run changes nothing and crashes on nothing.

**Independent Test**: Run `pnpm db:seed` twice. The second run succeeds and every row count is
unchanged.

**Depends on**: US2.

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T040 [US3] Create `apps/api/tests/seed-idempotency.test.ts` — seed, snapshot every model's row count, seed again, assert every count is identical (FR-013, SC-004)
- [X] T041 [US3] Add to `apps/api/tests/seed-idempotency.test.ts`: insert a row the seed does not own (a reservation with a non-`SEED` code, a `ContactMessage`), re-run the seed, and assert that row still exists untouched — the spec's edge case that seeding must never delete or overwrite what it did not create

### Implementation for User Story 3

- [X] T042 [US3] Audit every write across `apps/api/prisma/seed/*.ts` and confirm each uses `upsert` keyed on the natural key research R6 assigns it (`Branch.slug`, `Category.slug`, `MenuItem.slug`, `User.email`, `PageBlock.[page, block]`, `PageSeo.page`, `SiteSetting.key`, `Reservation.code`). Any bare `create` or `createMany` on a model with a natural key is the FR-013 bug — fix it here
- [X] T043 [US3] Confirm no seed module calls `deleteMany` or `$executeRaw` with a `TRUNCATE`/`DELETE`. Idempotency comes from upserts, never from wiping first (research R6)
- [X] T044 [US3] Run `pnpm --filter @pascca/api test` and confirm T040 and T041 pass

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T045 [P] Create `apps/api/tests/referential-integrity.test.ts` — walk every seeded relation and assert zero orphaned foreign keys (SC-006). Walk the relations explicitly rather than trusting insertion order; the whole point is to catch an ordering mistake the orchestrator made
- [X] T046 Verify `contracts/phase-9-additive-review.md`'s guarantee against the generated migration: the committed SQL under `apps/api/prisma/migrations/` must contain only `CREATE TABLE`, `CREATE INDEX`, `CREATE TYPE`, and `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`. Confirm no ordering, payment, loyalty, or delivery table appears anywhere in it (Art 1 [NN], FR-008, SC-005)
- [X] T047 [P] Confirm `docs/api.md` gains no entry — this feature registers no error code because it exposes no endpoint (Art 10 [NN], plan.md gate 10). Confirm `packages/types/` is untouched: it is generated from OpenAPI, not from Prisma (Art 8 [NN])
- [X] T048 [P] Update `README.md`'s "Getting started" block to include `pnpm db:migrate` and `pnpm db:seed` after `docker compose up -d`, and point at `specs/002-content-schema-seed/quickstart.md`
- [X] T049 Resolve the `TODO(client-data)` markers in `apps/api/prisma/seed/branches.ts`: either replace the placeholder addresses, phones, and coordinates with client-supplied values, **or** leave the markers in place and state plainly in the PR description that this data is unverified placeholder content. Do not present placeholders as fact (plan.md gate 33)
- [X] T050 Run the full definition-of-done gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green, plus `pnpm db:reset` (drop → migrate → seed) succeeding from scratch (Art 31)
- [ ] T051 Push the branch, open a PR, and confirm CI is **actually green** on GitHub — including the new `postgres:16` service container running the migration, seed, and idempotency tests. A local pass is not evidence the CI change works (feature 001 learned this the expensive way: a lint failure invisible locally broke real CI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on **US1** — the seed writes to tables that must exist
- **US3 (Phase 5)**: Depends on **US2** — idempotency is a property of the seed
- **Polish (Phase 6)**: Depends on US1–US3

### User Story Dependencies

Unlike a typical feature, these stories are **strictly sequential**, and the spec says so: US2's
"Independent Test" begins "Run the seed script against a freshly migrated database". Independence
here means *independently valuable and independently verifiable* — US1 alone delivers a complete
schema a developer can build against — not independently *startable*. Do not attempt to run these
phases in parallel across a team.

### Within Each User Story

- Tests are written first and **must fail** before the implementation task that satisfies them
- US1's schema tasks (T012–T020) all edit `schema.prisma` and are strictly sequential
- US2's seed modules (T028–T035) are separate files and are genuinely parallel to author

### Parallel Opportunities

- **Phase 1**: T001 and T002 touch different files; T003–T006 touch four different files
- **Phase 4**: T028–T035 — eight separate seed modules, all parallel
- **Phase 6**: T045, T047, T048 — different files
- **Phase 3 implementation**: none. One file.

---

## Parallel Example: User Story 2

```bash
# Eight seed modules, eight files, no shared state — author together:
Task: "Create apps/api/prisma/seed/site-settings.ts"
Task: "Create apps/api/prisma/seed/users.ts"
Task: "Create apps/api/prisma/seed/branches.ts"
Task: "Create apps/api/prisma/seed/menu.ts"
Task: "Create apps/api/prisma/seed/gallery.ts"
Task: "Create apps/api/prisma/seed/marketing.ts"
Task: "Create apps/api/prisma/seed/page-content.ts"
Task: "Create apps/api/prisma/seed/reservations.ts"

# Then, sequentially — the orchestrator needs all eight to exist:
Task: "Create apps/api/prisma/seed/index.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1
4. **STOP and VALIDATE**: migration applies clean to an empty database; schema-shape and migration
   tests pass; the `isFasting`/`isFeatured` index scans are confirmed
5. This is a genuine deliverable on its own — every later feature can start building against the
   schema even with no data in it

### Incremental Delivery

1. Setup + Foundational → commands exist, harness exists
2. **US1** → schema + migration → *a developer can build against it*
3. **US2** → seed → *a designer, QA, or the client can look at it*
4. **US3** → idempotency → *nobody's local reset is a chore*
5. Polish → integrity, Phase 9 review verification, real CI

---

## Notes

- Commit after each task or logical group; mark tasks `[X]` here as they complete
- Article 11 boundary: if a task tempts you toward an `Order` table, a route file, or a service,
  stop — that is a later feature, and `contracts/phase-9-additive-review.md` is the only place
  ordering may be *described*
- Article 34: if an article blocks a task, stop and report. Do not amend the constitution mid-run
- The one recorded interpretation in this feature (PageBlock's `(page, block)` + JSON key, gate 12)
  is settled — see plan.md Complexity Tracking. Do not re-litigate it during implementation
