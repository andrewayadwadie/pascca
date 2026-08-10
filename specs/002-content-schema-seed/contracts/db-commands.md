# Contract: Database Commands

**Feature**: `002-content-schema-seed` · **Satisfies**: FR-009, FR-013, SC-001, SC-004
**Articles**: 32 (migrations never automatic on deploy), 5 [NN] (Prisma 6 · PostgreSQL 16)

The command surface this feature adds. These are the *only* supported ways to move the database
between states — anything else (hand-run `psql`, `prisma db push`) is out of contract.

---

## Root scripts

| Command | Delegates to | Effect |
|---|---|---|
| `pnpm db:generate` | `prisma generate` | Regenerates the Prisma client. Safe, no DB contact. |
| `pnpm db:migrate` | `prisma migrate dev` | Applies pending migrations to the **local dev** database and creates a new migration file if `schema.prisma` has drifted. |
| `pnpm db:seed` | `tsx prisma/seed.ts` | Populates the database. **Idempotent** (FR-013). |
| `pnpm db:reset` | `prisma migrate reset` | Drops, recreates, re-migrates, re-seeds. **Destructive — local only.** |
| `pnpm db:studio` | `prisma studio` | Browser GUI for inspecting the result. |

Each is `pnpm --filter @pascca/api <script>` at the root, and a real script in
`apps/api/package.json`. They are deliberately **not** Turborepo tasks: `turbo run` fans out
across workspace members and caches by content hash, and both behaviours are wrong for a command
that targets one package and mutates external state. A cached `db:seed` that "succeeds" without
touching the database would be a genuinely dangerous outcome.

## Environment

Every command needs `DATABASE_URL`. It is loaded exactly the way feature 001 established — Node
22's native flag, no `dotenv` dependency:

```
--env-file-if-exists=../../.env
```

The flag must be present on **both** the `prisma` and the `tsx` invocations. The Prisma CLI reads
`DATABASE_URL` from its own process environment; putting the flag only on `tsx` would make
`db:seed` work and `db:migrate` fail with a confusing "environment variable not found" error.

`.env.example` documents `DATABASE_URL` already (feature 001); no new environment variable is
introduced by this feature.

## Acceptance sequence

The literal acceptance criterion from the feature request, start to finish from a clean clone:

```bash
pnpm install
cp .env.example .env          # fill in local values
docker compose up -d          # postgres 16 · redis 7 · minio
pnpm db:migrate               # → applies the initial migration
pnpm db:seed                  # → populates a browsable Pascca
```

Expected end state: a database the site could run against (SC-001). Two commands after the
existing setup, no manual data entry.

## Idempotency guarantee

```bash
pnpm db:seed && pnpm db:seed   # second run: zero row-count change (SC-004)
```

Delivered by `upsert` on natural keys, never `deleteMany` (research R6). A consequence worth
stating: the seed **updates** rows it owns. Edit a seeded price locally, re-run, and your edit is
overwritten — that is intended (the seed file is the source of truth for seeded content), and it
is the reason the seed never touches rows it did not create.

## Production migrations — unchanged by this feature

`.github/workflows/migrate.yml` (feature 001) remains the only path to a production migration:
`workflow_dispatch` only, `environment: production` with a required reviewer, a typed `migrate`
confirmation input, and `prisma migrate deploy`. Article 32 [NN] — never automatic on deploy.

This feature produces the **first migration that workflow will ever apply**. Two consequences:

1. The `production` environment still needs its `DATABASE_URL` secret before that run can succeed
   (outstanding from feature 001 — the user opted to add it via the GitHub UI).
2. `migrate deploy` does not seed. Production content is entered through the dashboard
   (Article 3 [NN]); the seed script is a **development** convenience. Whether production ever
   receives a one-off content import is a client decision, not this contract's.

## Failure modes

| Situation | Expected behaviour |
|---|---|
| `DATABASE_URL` unset | Prisma CLI fails fast, naming the variable. No partial state. |
| Postgres unreachable | Connection error before any DDL. No partial state. |
| Seed run against an unmigrated database | Fails on the first missing table. Fix: `pnpm db:migrate` first. |
| Seed run twice | Succeeds, zero row-count change (SC-004). |
| Seed run against a DB with hand-entered rows | Those rows are untouched — the seed only upserts keys it owns (spec Edge Cases). |
| `schema.prisma` edited without a migration | `prisma migrate dev` detects drift and generates the migration. CI never generates migrations. |
