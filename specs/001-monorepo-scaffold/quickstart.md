# Quickstart: Pascca Monorepo

**Feature**: `001-monorepo-scaffold` | **Date**: 2026-08-10

What a developer does on a clean checkout, and the two things a human must set up that no script
can do for them.

## Prerequisites

| Tool | Required | Why |
|---|---|---|
| Node **22 LTS** | yes | Article 5 **[NN]**. Enforced by `.nvmrc` + `engines` + `engine-strict` |
| pnpm | yes | Article 5. Version resolved from `packageManager` in the root `package.json` |
| A container runtime | yes | Runs Postgres 16, Redis 7, MinIO locally |

> ⚠ **Node version check first.** This machine was measured at **v24.13.0** during planning.
> The install will fail loudly on a non-22 runtime — that is intentional, not a bug. Run
> `nvm use` (or `fnm use` / `volta pin`) to pick up the `.nvmrc` pin before installing.
>
> Wanting Node 24 instead is legitimate, but it is an **Article 5 amendment requiring client
> sign-off** (Article 34) — not something to fix by loosening `engines`.
>
> **No version manager available?** A portable Node 22 works without touching the system
> install: download the Windows x64 zip from `https://nodejs.org/dist/v22.23.2/`, extract it
> anywhere (e.g. a gitignored `.tools/` folder), and prepend its directory to `PATH` for your
> session (`export PATH="/path/to/node-v22.23.2-win-x64:$PATH"`). Fully reversible — delete the
> folder when done. This is how the reference implementation of this feature was built.
>
> **The enforcement mechanism is `pnpm-workspace.yaml`'s `engineStrict: true`, not
> `.npmrc`.** `engine-strict=true` in `.npmrc` alone does not block an install on pnpm 11 — it
> only warns (verified during implementation). Don't be misled by the `.npmrc` line into
> thinking it's doing the enforcing.

## First run

```bash
nvm use                    # honours .nvmrc → Node 22
pnpm install               # fails fast if the runtime is not 22

cp .env.example .env       # then fill in real local values

docker compose up -d       # Postgres 16 · Redis 7 · MinIO — wait for healthchecks
pnpm dev                   # API 3001 · web 3000 · admin 5173
```

`.env` is gitignored; `.env.example` is committed and carries placeholders only.

## Verifying the acceptance criteria

Each maps to a spec scenario — these are the checks that say the feature actually works, not that
it merely installed.

**US1 — one command starts everything**

```bash
pnpm dev
# then, in another shell:
curl -sf http://localhost:3001/health && echo api ok
curl -sf http://localhost:3000        && echo web ok
curl -sf http://localhost:5173        && echo admin ok
```

**US1-3 — one token file, not two**

```bash
# Source only — excludes build output (apps/*/dist, apps/*/.next legitimately inline the
# bundled token) and anything outside apps/*/src + packages/config (SC-005 scopes to "the
# website or dashboard", i.e. app source, not build artifacts or unrelated legacy content).
find apps/web/src apps/admin/src packages/config -name '*.css' | xargs grep -l -- '--gold:'
# Expected: packages/config/tokens.css — and nothing else.
```

**US2 — bad configuration kills the process**

```bash
# Missing variable:
( unset DATABASE_URL; pnpm --filter @pascca/api start )
# Expect: non-zero exit, message naming DATABASE_URL, no port bound.

# Malformed variable:
PORT=not-a-number pnpm --filter @pascca/api start
# Expect: non-zero exit, message naming PORT.

# Confirm no value is echoed — only the variable name:
DATABASE_URL=postgresql://user:hunter2@nope/db pnpm --filter @pascca/api start 2>&1 | grep -c hunter2
# Expected: 0
```

**Edge case — infrastructure down**

```bash
docker compose stop postgres
pnpm --filter @pascca/api start
# Expect: immediate exit naming postgres. No retry loop, no hang.
docker compose start postgres
```

**US3 — the four checks, locally identical to CI**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Manual setup a script cannot do

### 1. GitHub Environment for migrations — required

`.github/workflows/migrate.yml` is `workflow_dispatch`-only and bound to a protected environment.
**Environment protection rules live in repository settings and cannot be declared in YAML.** Until
a reviewer is configured, dispatching the workflow would run migrations with no approval — the
gate would be nominal.

In **Settings → Environments**:

1. Create the environment referenced by `migrate.yml`.
2. Add at least one **required reviewer**.
3. Add the production database secret there — scoped to that environment, not repository-wide.

Article 32 is not satisfied until this is confirmed in the settings UI. Treat it as part of the
feature, not as follow-up.

### 2. Branch protection — recommended

Require the CI check to pass before merge. Without it the workflow runs but nothing is gated by it.

## Layout

```text
apps/api      Fastify — the only thing that talks to the database
apps/web      Next.js — public site, en default, ar registered but flagged off
apps/admin    Vite SPA — pure API client, deliberately has no DB dependency
packages/config      tokens.css (Art 16, verbatim) + shared tsconfig/eslint/vitest bases
packages/types       empty; generated from OpenAPI later — never hand-written
packages/api-client  empty; typed API client later
docs/api.md          error-code registry (Art 10) — currently empty by design
```

## What is not here yet, and where it goes

| Missing | Arrives with |
|---|---|
| Any endpoint | first API feature — `/api/v1` prefix is already mounted |
| Any Prisma model or migration | first entity feature — `schema.prisma` has zero models on purpose |
| Auth, JWT secrets | auth feature — deliberately absent from the env schema |
| Any page or user-facing string | the feature that needs them — locale shell and empty message files are ready |
| A deploy workflow | first deployment feature |

If something above looks missing, it is scoped out on purpose (Article 11, research R13) — not
forgotten.
