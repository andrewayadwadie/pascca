# Quickstart: Content Data Model & Seed

**Feature**: `002-content-schema-seed`

From a clean checkout to a database the site could run against. Assumes feature 001's setup is
already done (`pnpm install` works, Docker infra is available).

---

## 1. Bring up Postgres

```bash
docker compose up -d
docker compose ps        # postgres, redis, minio should all read "healthy"
```

Postgres 16 on `5432`. `DATABASE_URL` in your `.env` points at it — feature 001's `.env.example`
already documents the value; this feature adds no new environment variable.

## 2. Apply the migration

```bash
pnpm db:migrate
```

Creates every table. This is the **first real migration in the repo** — feature 001 shipped a
`schema.prisma` with zero models deliberately (Article 11), so before this there was nothing to
migrate.

Verify:

```bash
pnpm db:studio          # browse the tables in a GUI
# or:
docker compose exec postgres psql -U pascca -d pascca -c '\dt'
```

Expect 24 tables (the 22 from the feature request, plus `PageSeo`, plus Prisma's
`_prisma_migrations`).

## 3. Seed

```bash
pnpm db:seed
```

Prints a count per model. Takes a few seconds — argon2 hashing the two users is the slow part,
and that is the point (Article 29 [NN]).

You now have: two branches with real hours (Shobra crossing midnight, Heliopolis 24h), eight
categories, ~40 dishes with four featured, four gallery albums, five consented testimonials, the
FAQ and milestone sets, page copy for all eight pages, one ADMIN + one MODERATOR, and twenty
reservations spread across all six statuses and both branches.

## 4. Prove it's idempotent

```bash
pnpm db:seed            # run it again
```

Same counts. No duplicates, no unique-constraint error. If either happens, that's the FR-013 bug —
see `contracts/db-commands.md`.

## 5. Run the tests

```bash
pnpm --filter @pascca/api test
```

Three layers (research R13):

- **Schema shape** — no database needed. Asserts every content field has both an `En` and an `Ar`
  sibling (Article 21 [NN]), that Tier 1 models carry `deletedAt`, and that `MenuItem` and
  `Reservation` declare the indexes FR-003 and FR-006 name explicitly.
- **Migration** — applies to a clean database, asserts every table exists.
- **Seed** — asserts the `contracts/seed-dataset.md` invariants, re-runs to prove idempotency,
  and walks every relation checking for orphaned foreign keys.

The last two need a live Postgres. Locally that's `docker compose up -d`; in CI it's the
`postgres:16` service container this feature adds to `.github/workflows/ci.yml`.

---

## Starting over

```bash
pnpm db:reset           # drop → recreate → migrate → seed
```

Destructive, local only. Convenient after editing `schema.prisma` in a way that would otherwise
need a migration you don't want to keep.

---

## Common problems

**`Environment variable not found: DATABASE_URL`**
The `--env-file-if-exists=../../.env` flag is missing from the failing script, or `.env` doesn't
exist. Copy it from `.env.example`. Note the flag has to be on the `prisma` invocation as well as
the `tsx` one — the Prisma CLI reads its own process environment.

**Seed fails on a missing table**
Migration hasn't run. `pnpm db:migrate` first.

**Seed fails on a unique constraint**
An idempotency bug — some entity is being `create`d where it should be `upsert`ed on its natural
key. See research R6 for which key each model uses.

**`prisma migrate dev` wants to create a migration you didn't expect**
`schema.prisma` has drifted from the migration history. Expected while developing; commit the
generated migration. CI never generates migrations, and production only ever runs
`migrate deploy` through the reviewer-gated workflow (Article 32 [NN]).

**Native module error mentioning `argon2`**
`argon2` compiles on install and needs an entry in `pnpm-workspace.yaml`'s `allowBuilds` — the
same treatment `esbuild` and `sharp` already have. Without it pnpm skips the build silently and it
fails at runtime.

---

## What this feature does *not* give you

No API. No endpoints, no routes, no services (Article 11 — build the phase in front of you). The
menu, reservations, and content modules are later features that read and write through this
schema. If you want to see the data, use `pnpm db:studio`.
