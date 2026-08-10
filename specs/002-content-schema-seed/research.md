# Phase 0 Research: Content Data Model & Seed

**Feature**: `002-content-schema-seed` · **Date**: 2026-08-10

Decisions that shape the schema and seed script. Anything the constitution already fixes
(PostgreSQL 16, Prisma 6, TypeScript strict) is not re-litigated here — only choices this
feature actually has to make.

---

## R1 — Bilingual columns: paired scalars, not a JSON blob or a translations table

**Decision**: Every human-authored content field is two nullable-or-required sibling columns,
`nameEn` / `nameAr`, on the owning model. Arabic columns are **nullable** at the database level
and default to `null`; English columns are required where the field itself is required.

**Rationale**: Article 21 [NN] requires `_en`/`_ar` columns "from the first migration". Paired
scalar columns keep Prisma's generated types honest (`nameEn: string`, `nameAr: string | null`),
keep them indexable and full-text-searchable later, and make "is Arabic content missing?" a
trivial `WHERE nameAr IS NULL` audit query for the client when they start translating. Arabic is
nullable because Article 21 explicitly says turning Arabic on later is a *content-entry* task —
forcing `NOT NULL` today would require seeding fake Arabic, which is worse than an honest null.

**Alternatives considered**:
- *A `translations` join table (`entity, id, locale, field, value`)*: normalised and locale-count-
  agnostic, but every read becomes a join + pivot, Prisma loses field-level typing entirely, and
  Article 21's literal wording is "columns". Rejected — the project has exactly two locales,
  forever-ish; the flexibility buys nothing and costs type safety on every query.
- *A single JSON column per field (`{ en: "...", ar: "..." }`)*: compact, but unindexable without
  expression indexes and untyped in Prisma. Rejected for the same typing reason.

**Naming**: `camelCase` with a trailing locale segment — `nameEn`, `descriptionAr`, `quoteEn`.
The spec writes these as `quote_en`/`quote_ar` (SQL-ish); Prisma model fields are camelCase by
convention and map to snake_case columns via `@map` only if we choose to. We do **not** use
`@map` — the Prisma field name *is* the column name. `quoteEn` and `quote_en` are the same field
under two spellings; the schema uses `quoteEn`.

---

## R2 — Money as integer minor units

**Decision**: Every price is `Int`, denominated in **piastres** (1/100 EGP). A 120.00 EGP pizza is
`12000`. Field names carry the unit: `priceP` is rejected as cryptic; we use `price` with a
schema comment and a shared `docs` note, since every price in this system is piastres with no
exceptions.

**Rationale**: Settled by clarification (2026-08-10). `Decimal` in Prisma maps to a
`Decimal.js` instance that does not serialise to JSON natively — every future Fastify response
would need an explicit conversion step, and a missed one silently emits `{}` or a string. `Float`
introduces representation error the moment Phase 9 sums an order. `Int` serialises natively, sorts
and compares exactly, and pushes formatting to the single place it belongs (the client edge).

**Consequence for later features**: the API's Zod output schema for any price is
`z.number().int()`, and web/admin format with `Intl.NumberFormat("en-EG", { style: "currency",
currency: "EGP" })` after dividing by 100. Worth stating in `docs/api.md` when the menu endpoints
land, so no client invents its own convention.

**Alternatives considered**: `Decimal(10,2)` (exact and readable in `psql`, but the JSON
serialisation tax lands on every endpoint forever); `Float` (rejected outright for money).

---

## R3 — Overnight opening hours (Shobra closes 02:00) and 24-hour branches

**Decision**: `BranchHour` stores `dayOfWeek` (0–6), `opensAt` and `closesAt` as **minutes past
midnight** (`Int`, 0–1439), plus a derived-but-stored `closesNextDay: Boolean`. Shobra's Monday
row is `{ dayOfWeek: 1, opensAt: 720, closesAt: 120, closesNextDay: true }`. Heliopolis's 24-hour
operation is `{ opensAt: 0, closesAt: 0, closesNextDay: true }` — a full 1440-minute window —
with an `isOpen24h: Boolean` flag so nothing has to infer that from the degenerate `0 → 0` case.

**Rationale**: The obvious `closesAt > opensAt` assumption is wrong for Shobra and *catastrophically*
wrong for the Article 25 availability query, which is the highest-risk code in the product. Storing
minutes-past-midnight rather than `Time` or a `DateTime` avoids timezone semantics entirely (an
opening time is a wall-clock fact about a place, not an instant), and `closesNextDay` makes the
midnight crossing an explicit, testable field rather than a comparison anyone can forget to write.
`isOpen24h` exists because `0 → 0 (+1 day)` is technically correct but reads as a bug to the next
person; an explicit flag is self-documenting and lets a UI render "Open 24 hours" without
special-casing.

**Alternatives considered**:
- *Two rows for an overnight day* (`12:00–23:59` + `00:00–02:00` on the following day): avoids the
  flag, but doubles rows, makes "what are Monday's hours?" a two-row question, and makes the
  Saturday-night/Sunday-morning boundary genuinely confusing to seed and to read.
- *Postgres `tstzrange` / `timerange`*: expressive, but Prisma has no first-class range support —
  it would mean `Unsupported()` fields and raw SQL for every read, contradicting Article 8.
- *`String` "12:00"*: unsortable, unvalidatable, and needs parsing at every use. Rejected.

**Note for the availability feature (later)**: this schema *enables* Article 25's seat-overlap
query but does not implement it. The `closesNextDay` flag is the input that lets the slot generator
extend a day's window past midnight. Article 30's "past-midnight close" test belongs to that
feature, not this one.

---

## R4 — PageBlock: `(page, block)` unique key with a typed JSON value

**Decision**: `PageBlock` has `page: String`, `block: String`, `@@unique([page, block])`, and a
`value: Json` holding the ten content keys (`headlineEn/Ar`, `eyebrowEn/Ar`, `subEn/Ar`,
`ctaLabelEn/Ar`, `ctaHref`, and `ctaHrefAr` is *not* included — a URL is locale-agnostic here).
Per-page SEO lives on a separate `PageSeo` model keyed `@@unique([page])`, not repeated on every
block row.

**Rationale**: Settled by clarification (2026-08-10) — the user chose `(page, block)` + JSON over
Article 12's literal `(page, block, field)`. Splitting SEO onto its own `PageSeo` model follows
directly: SEO is stated by Article 12 as *per-page*, and hanging per-page fields off a per-block
row would either duplicate them across every block on the page or leave them null on all but one
arbitrary "primary" block. A separate model makes the cardinality honest.

The JSON value is typed at the **API boundary**, not the database: a shared Zod schema
(`PageBlockValue`) defines the keys and their `.max()` lengths, satisfying Article 12's
"character limits are enforced server-side per field". The DB stores `jsonb`; the contract is
Zod's. This is the same single-source-of-truth pattern Article 8 already mandates for API shapes.

**Article 12 [NN] compliance note** (this is the interpretation the plan's gate 12 records):
Article 12's substantive obligations are (a) the five named fields are editable per named section,
(b) per-page SEO title/description/OG image are editable, (c) rendering falls back to a seeded
default when empty, (d) character limits are enforced server-side per field. All four hold under
this shape. Only the *physical row granularity* differs from the article's parenthetical
`(page, block, field)`. No obligation is diluted, dropped, or deferred.

**Alternatives considered**: EAV (`@@unique([page, block, field])`, one row per field) — literal
compliance, but ~240 rows to seed, a group-by to render one block, five writes to save one block,
and every value degraded to an untyped string. Presented to the user; not chosen.

---

## R5 — Soft delete: `deletedAt` nullable timestamp, no partial unique indexes yet

**Decision**: Every Tier 1 model and `PageBlock`/`PageSeo` carries `deletedAt: DateTime?`. This
feature adds the **column only** — no Prisma middleware, no query filtering, no 30-day purge job.
Unique constraints on soft-deletable models stay plain (not partial) for now.

**Rationale**: Article 15 [NN] requires soft deletes with a 30-day window; Article 11 requires
building the phase in front of you. The column is the part that must exist from the first
migration (adding it later to populated tables is the expensive, risky version). The *enforcement*
— filtering `deletedAt: null` out of reads, writing the AuditLog on delete, and the purge job — is
API-layer behaviour that belongs to the features adding those endpoints. Shipping a half-wired
Prisma middleware now would be worse than shipping none: later features would inherit invisible
filtering they didn't write and can't see.

**Known follow-up, flagged deliberately**: once soft delete is *enforced*, a plain
`@@unique([slug])` will reject a new record reusing a soft-deleted record's slug. The fix is a
partial unique index (`WHERE deleted_at IS NULL`), which Prisma cannot express declaratively and
needs a hand-edited migration. That is the responsibility of the feature that turns soft-delete
enforcement on, and it is **additive** (drop-and-recreate an index, no table alteration). Recorded
here so it is a known decision rather than a surprise.

---

## R6 — Seed idempotency via `upsert` on natural keys

**Decision**: The seed script uses `prisma.<model>.upsert()` keyed on a **stable natural key**
(`Branch.slug`, `Category.slug`, `MenuItem.slug`, `User.email`, `PageBlock.[page, block]`,
`SiteSetting.key`), not on database-generated IDs. Reservations — which have no natural key — are
seeded with **deterministic, seed-owned `code` values** (`SEED01`…`SEED20`) and upserted on
`code`.

**Rationale**: FR-013 requires a second run to change zero row counts. `upsert` on a natural key
achieves that without a destructive `deleteMany()` preamble, which would violate the spec's edge
case "seeding must not delete or overwrite rows it did not itself create". Deterministic
reservation codes are the trick that makes the one entity with no natural key idempotent — and
they double as an obvious marker (`SEED*`) that a row is fixture data, which is useful when
someone needs to clear demo bookings out of a shared environment later.

**Consequence**: `code` collision between a seeded `SEED01` and a real generated 6-char code is
prevented because the generator (a later feature) draws from an alphabet/format that will not
produce a `SEED`-prefixed value — to be enforced by that feature. Noted so it isn't forgotten.

**Alternatives considered**:
- *`deleteMany()` then `createMany()`*: simple, fast, genuinely idempotent — but destroys
  hand-entered local data and any FK-dependent rows. Rejected on the spec's own edge case.
- *`createMany({ skipDuplicates: true })`*: idempotent for inserts but never *updates* — editing
  a seeded price and re-running would silently do nothing, which is a confusing developer
  experience. Rejected.

---

## R7 — Seed ordering and referential integrity

**Decision**: The seed runs in explicit dependency order inside a single top-level flow:
`SiteSetting` → `User` → `Branch` → (`BranchHour`, `DiningTable`) → `Category` → `MenuItem` →
(`MenuItemVariant`, `MenuItemBranch`) → `GalleryAlbum` → `GalleryImage` → `Testimonial` →
`FaqItem` → `TeamMember` → `Milestone` → `PageSeo` → `PageBlock` → `ContactMessage` →
`Reservation` → `ReservationEvent`. Each stage captures the IDs it created and passes them to the
next; nothing looks up a foreign key by guessing.

**Rationale**: SC-006 requires zero orphaned references. Explicit ordering with in-memory ID
capture makes that structural rather than hopeful. `Post` is seeded near the end and referenced by
nothing.

**Not wrapped in one transaction**: a full-seed transaction would be a single very long-running
write; if it fails you learn nothing about *where*. Instead each stage is independently
idempotent (R6), so a failed run is fixed by correcting the data and re-running — the completed
stages no-op. This is the better failure mode for a developer-facing script.

---

## R8 — Password hashing in the seed: argon2id

**Decision**: Seeded `ADMIN` and `MODERATOR` users get argon2id hashes, produced by the same
`argon2` library the auth feature will use, with the library's current defaults. The seed reads
the plaintext from an env var if present and otherwise uses a clearly-marked development default
that the script **prints a warning about**.

**Rationale**: Article 29 [NN] names argon2 explicitly. FR-012 requires hashed storage. Using the
real library now (rather than a placeholder hash) means the auth feature's first login attempt
against seeded users actually works, instead of failing in a way that looks like an auth bug.

**Security note**: the development default password is fixture data for a local Docker database,
not a credential. The warning exists so that nobody seeds a shared environment and assumes the
account is safe. Article 29's "no PII in logs" also applies to the seed's own output: it prints
counts and slugs, never phone numbers, emails, or password values.

**Dependency added**: `argon2` to `apps/api`. It is a native module — `pnpm-workspace.yaml`'s
`allowBuilds` list must include it, exactly as `esbuild` and `sharp` already are, or install will
skip its build step and it will fail at runtime.

---

## R9 — Phase 9 additive-design review (Article 11)

**Decision**: The forward-compatibility obligation is discharged by a written review, checked in
as `contracts/phase-9-additive-review.md`, showing the exact Phase 9 ordering models and proving
each attaches by **new table with an FK outward**, never by altering a table this feature creates.

**Rationale**: Article 11 says this is "satisfied by design review, not by writing code early".
A prose claim in a plan is not a review; a concrete sketch that anyone can check is. The key
structural property that makes it work: an `OrderItem` referencing a `MenuItem` puts the FK on
`OrderItem` — the referenced side needs no column. The same holds for `Order → Branch`,
`Order → User`. Nothing in Phase 9 requires a new column on an existing table.

**The one real risk, named**: an `OrderItem` must record the price **as charged at order time**,
which means `OrderItem.unitPrice` is its own column, not a join to `MenuItem.price`. If a future
implementer instead tries to make `MenuItem.price` historical (versioned rows, effective dates),
*that* would alter an existing table. The review states this explicitly so the trap is documented
before anyone falls into it.

---

## R10 — Where the role→permission map lives (deferred, deliberately)

**Decision**: `User` carries a `role: Role` enum (`ADMIN`, `MODERATOR`, `CUSTOMER`). This feature
does **not** create `Permission` / `RolePermission` tables, and does not seed a permission map.

**Rationale**: Article 14 [NN] requires that authorisation is checked as
`requirePermission('menu:write')` against a seeded role→permission map, never as
`if (user.role === 'ADMIN')`. That is a constraint on the *API's authorisation layer*, which this
feature does not build (there are no endpoints here at all). Article 11 resolves the timing: the
auth/permissions feature owns the map, in whatever form it chooses (DB tables or a seeded
constant), and adding `Permission`/`RolePermission` tables later is purely additive — `User` keeps
its `role` enum untouched either way.

**What this feature owes that layer**: the columns it will need to attribute actions —
`Reservation.handledById`, `AuditLog.actorId` — exist from this migration. Confirmed present in
the data model.

**Alternatives considered**: building `Permission`/`RolePermission` now. Rejected under Article 11
— it is scaffolding for a phase not yet in front of us, and the model list in the feature request
deliberately does not include them.

---

## R11 — `pnpm db:migrate` / `pnpm db:seed` wiring

**Decision**: Scripts are added to `apps/api/package.json` and surfaced from the repo root:

| Root script | Runs |
|---|---|
| `db:migrate` | `pnpm --filter @pascca/api db:migrate` → `prisma migrate dev` |
| `db:seed` | `pnpm --filter @pascca/api db:seed` → `tsx prisma/seed.ts` |
| `db:generate` | `pnpm --filter @pascca/api db:generate` → `prisma generate` |
| `db:reset` | `pnpm --filter @pascca/api db:reset` → `prisma migrate reset` |

They are **not** Turborepo tasks. `turbo run` is for fan-out across workspace members; these
target exactly one package, mutate external state (a database), and must never be cached or run
in parallel. Root scripts delegate with `pnpm --filter` directly.

Env loading matches the pattern 001 established: `--env-file-if-exists=../../.env`, Node 22's
native flag, no `dotenv` dependency. Prisma CLI reads `DATABASE_URL` from the process env, so the
flag must be on the `prisma` invocation too, not only on `tsx`.

**Rationale**: SC-001 requires two commands from a fresh clone. FR-009 requires migration to
succeed with no manual steps. `prisma migrate dev` (not `deploy`) is correct for local
development — it creates the migration file. `migrate deploy` is what `.github/workflows/
migrate.yml` already runs against production, gated behind the `production` environment and a
required reviewer (Article 32, built in feature 001). This feature produces the first migration
that workflow will ever apply.

---

## R12 — `prisma.config.ts` vs. the `package.json#prisma` seed key

**Decision**: Configure the seed command in **`prisma.config.ts`**, not the legacy
`"prisma": { "seed": "..." }` key in `package.json`.

**Rationale**: Prisma 6 supports `prisma.config.ts` and is deprecating the `package.json#prisma`
block; pnpm 11 separately warns that it no longer reads a `pnpm` key in `package.json`, and the
project has already been bitten once by exactly that class of "config moved out of package.json"
change (feature 001, `onlyBuiltDependencies` → `pnpm-workspace.yaml`). Using the current mechanism
avoids a deprecation warning on every command and a migration later.

**Verification required during implementation**: confirm against the installed Prisma 6 minor
version that `prisma.config.ts` is supported and that `prisma db seed` picks the seed script up
from it. If the pinned version predates it, fall back to `package.json#prisma.seed` and record the
reason — do not silently guess.

---

## R13 — Testing approach for a schema-and-seed feature

**Decision**: Three test layers, all in `apps/api/tests/`:

1. **Schema shape tests** (no database) — parse `prisma/schema.prisma` as text and assert the
   structural invariants that FR-002 and Article 21 [NN] state: every model listed in Tier 1 has a
   `deletedAt`, every content field has both an `En` and an `Ar` sibling, `MenuItem` declares
   `@@index` on `isFasting` and `isFeatured`, `Reservation` declares its three indexes. Fast,
   runs in CI with no services.
2. **Migration test** (database) — apply migrations to a clean database, assert every expected
   table exists.
3. **Seed tests** (database) — run the seed; assert the FR-010 counts and shapes; run it a second
   time and assert counts are unchanged (FR-013 / SC-004); assert zero orphaned FKs (SC-006).

**Rationale**: Layer 1 is the one that actually protects Article 21 [NN] over time — it fails
when someone adds a `descriptionEn` without a `descriptionAr` two features from now, which no
runtime test would catch. Layers 2 and 3 need a live Postgres, which `docker-compose.yml` already
provides locally and which CI can provide as a service container.

**CI consequence, stated plainly**: `.github/workflows/ci.yml` as built in feature 001 has **no
database service**. Layers 2 and 3 cannot run there as-is. This feature must either add a
`postgres:16` service container to the CI workflow, or gate the DB-dependent tests behind a
`DATABASE_URL`-present check so they skip cleanly in CI and run locally. **Adding the service
container is the right answer** — a seed test that silently skips in CI is a test that will be
broken for months before anyone notices. This is a real, named task, not a footnote.

**Alternatives considered**: mocking Prisma for the seed tests. Rejected — the entire value of a
seed test is that the data really lands in a real database with real constraints enforced; a
mocked one asserts only that the script calls the functions the script calls.
