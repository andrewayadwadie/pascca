---

description: "Task list for 001-monorepo-scaffold"
---

# Tasks: Monorepo Scaffold

**Input**: Design documents from `/specs/001-monorepo-scaffold/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅
**Constitution**: v2.0.0

**Tests**: **REQUIRED** — not as TDD ceremony, but because the spec names them as deliverables.
FR-011 requires one executing smoke test per workspace member (a green stage over zero test files
proves nothing). FR-008 + research R7 require an `.env.example` drift test. US2's acceptance
scenarios are themselves test specifications. None of Article 30's risk areas (booking
concurrency, permissions, auth rotation) exist yet — those arrive with the features that
introduce them.

**Organization**: Grouped by user story so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 — user-story phases only; Setup, Foundational, and Polish carry none

## Path Conventions

Fixed by the constitution (Articles 6, 8, 16, 21):

- **API**: `apps/api/src/…` · tests in `apps/api/tests/`
- **Website**: `apps/web/src/app/[locale]/…` · strings in `apps/web/src/messages/{en,ar}.json`
- **Dashboard**: `apps/admin/src/…` · strings in `apps/admin/src/messages/{en,ar}.json`
- **Shared**: `packages/config` (tokens, tsconfig, eslint, vitest) · `packages/types` ·
  `packages/api-client`
- **Error codes**: `docs/api.md` (Art 10)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository-level configuration every workspace member depends on.

- [X] T001 Create `.nvmrc` containing `22` — pins Node 22 LTS per Article 5 **[NN]** (research R1)
- [X] T002 ~~Create `.npmrc` with `engine-strict=true`~~ **Corrected during implementation**: this alone does not enforce anything on pnpm 11 (it warns, exit 0 — verified). The real gate is `engineStrict: true` in `pnpm-workspace.yaml` (T004), which produces `ERR_PNPM_UNSUPPORTED_ENGINE` and exit 1 (verified). `.npmrc` kept, annotated, for npm-compatible tooling only
- [X] T003 Create root `package.json` with `"private": true`, `engines.node: ">=22 <23"`, a `packageManager` pin, and the five root scripts (`dev`, `lint`, `typecheck`, `test`, `build`) each delegating to `turbo run <task>` per `contracts/workspace-tasks.md`
- [X] T004 [P] Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`, **plus `engineStrict: true`** — this is the setting that actually blocks a non-Node-22 install on pnpm 11 (corrected from the original `.npmrc`-only plan; see T002, research R1)
- [X] T005 [P] Create `turbo.json` using the Turborepo 2.x `tasks` key with the five task definitions and their `dependsOn`/cache settings exactly as tabulated in research R2 (`dev` persistent + uncached; `build`/`typecheck`/`test` depend on `^build`)
- [X] T006 [P] Extend `.gitignore` with `node_modules/`, `dist/`, `.next/`, `.turbo/`, `coverage/`, `*.tsbuildinfo` — the existing file has no Node entries
- [X] T007 Ran `pnpm install` — **failed as expected**: `ERR_PNPM_UNSUPPORTED_ENGINE`, exit 1, "Expected version: >=22 <23 / Got: v24.13.0" (verified 2026-08-10). No `nvm`/`fnm`/`volta` present. **Resolved per user direction**: downloaded portable Node **v22.23.2** to `.tools/node-v22.23.2-win-x64/` (gitignored, session-local, nothing system-wide). With it prepended on `PATH`, `pnpm install` succeeds, exit 0, lockfile up to date. Every subsequent shell command in this implementation run prepends that `PATH` entry

**Checkpoint**: `pnpm install` succeeds on Node 22 and the workspace resolves.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `packages/config` and the empty shared packages. Every app extends these, so no user
story can start until this phase is done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Create `packages/config/package.json` exposing subpath exports for `./tokens.css`, `./tsconfig/base.json`, `./eslint/*`, and `./vitest/base`, and declaring all five workspace scripts
- [X] T009 Create `packages/config/tokens.css` containing the Article 16 `:root{}` block **verbatim** — surfaces, gold accent, ink scale, geometry, motion. This file is the single source of design values (Article 8 **[NN]**); do not add, rename, or reformat a single token
- [X] T010 [P] Create `packages/config/tsconfig/base.json` with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes` enabled (FR-002, research R12)
- [X] T011 [P] Create `packages/config/eslint/base.js` as a flat config with the TypeScript rules every member shares
- [X] T012 [P] Create `packages/config/eslint/node.js` extending base for server-side packages
- [X] T013 [P] Create `packages/config/eslint/react.js` extending base and enabling `jsx-a11y` — installed now, before any screen exists, so the first UI is held to it from its first commit (AR-007, Article 28)
- [X] T014 Add a rule to `packages/config/eslint/base.js` banning raw hex/rgb colour literals in **app source under `apps/`** (explicitly excluding `packages/config/tokens.css`, which is the one file allowed to define them), so SC-005 ("zero duplicated design values") is mechanically enforced rather than review-dependent (research R4)
- [X] T015 Add a rule to `packages/config/eslint/react.js` banning physical CSS layout properties (`margin-left`, `padding-right`, `left`, `right`) in favour of logical properties — Article 21 **[NN]**
- [X] T016 [P] Create `packages/config/vitest/base.ts` with the shared Vitest configuration all members extend
- [X] T017 [P] Create `packages/config/tests/tokens.test.ts` asserting `tokens.css` parses and defines the Article 16 token names — one executing test per FR-011
- [X] T018 [P] Create `packages/types/` (package.json, tsconfig extending the shared base, an empty `src/index.ts`, and one smoke test) — buildable and empty, to be generated from OpenAPI later. **No hand-written type may duplicate a Prisma model or Zod schema** (FR-013, Article 8 **[NN]**)
- [X] T019 [P] Create `packages/api-client/` (package.json, tsconfig, empty `src/index.ts`, one smoke test) — buildable and empty, to receive the `openapi-fetch` wrapper later (FR-013)
- [X] T020 [P] Create `docs/api.md` seeded with the error-envelope shape from Article 10 and an **empty** error-code table, so the first feature that throws has a registry to register in (AR-004)

**Checkpoint**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass across the three
packages. Apps can now extend the shared configuration.

---

## Phase 3: User Story 1 — Start the whole stack with one command (Priority: P1) 🎯 MVP

**Goal**: One command brings the API, website, and dashboard up, each on its own port, with both
front ends resolving to the same single token file.

**Independent Test**: On a clean checkout with dependencies installed and infrastructure running,
`pnpm dev` makes `localhost:3001` (api), `localhost:3000` (web), and `localhost:5173` (admin) all
respond; editing a file in one app reloads only that app.

### Implementation for User Story 1

- [X] T021 [P] [US1] Create `apps/api/package.json` (Fastify 5, `fastify-type-provider-zod`, Zod) plus `tsconfig.json`, `eslint.config.js`, and `vitest.config.ts`, each extending `packages/config` and never redefining a rule set (FR-003)
- [X] T022 [US1] Create `apps/api/src/config/env.ts` with a minimal Zod schema covering `NODE_ENV`, `PORT` (default 3001), `HOST`, and `LOG_LEVEL`, exporting a frozen typed object. **`process.env` is read here and nowhere else in the codebase** (Article 8). The full contract arrives in US2
- [X] T023 [US1] Create `apps/api/src/app.ts` building the Fastify instance with the `/api/v1` prefix mounted and **zero routes registered** — the prefix exists so the first endpoint feature is Article 9-compliant by default
- [X] T024 [US1] Create `apps/api/src/server.ts` that validates env, then calls `listen(HOST, PORT)`. Add a `GET /health` route **outside** the `/api/v1` prefix (it is an infrastructure probe for UptimeRobot per Article 5, not a product capability under Article 4) — this is the only route that ships
- [X] T025 [P] [US1] Create `apps/api/tests/smoke.test.ts` asserting the app builds and `/health` responds via `fastify.inject` — one executing test (FR-011)
- [X] T026 [P] [US1] Create `apps/web/` as a Next.js 15 App Router app (package.json, `tsconfig.json`, `next.config.ts`, `eslint.config.js` extending the react variant, `vitest.config.ts`), fixed to port 3000
- [X] T027 [US1] Create `apps/web/src/app/[locale]/{layout.tsx,page.tsx}` as an empty locale shell — `en` is the default, `ar` is registered but behind an off-by-default flag. **No user-facing string and no page content** (Article 21 **[NN]**, AR-003)
- [X] T028 [US1] Create `apps/web/src/styles/globals.css` importing `packages/config/tokens.css`. It **defines no colour, radius, spacing, or motion value of its own** (Article 16 **[NN]**, SC-005)
- [X] T029 [P] [US1] Create empty `apps/web/src/messages/en.json` and `apps/web/src/messages/ar.json` — path fixed to `src/messages/` per the Article 6 **[NN]** tree (`web/src/{…,messages,…}`), not `apps/web/messages/`. The only place Tier-3 UI strings will ever live (Article 12 **[NN]**)
- [X] T030 [P] [US1] Create `apps/web/tests/smoke.test.ts` — one executing test (FR-011)
- [X] T031 [P] [US1] Create `apps/admin/` as a Vite + React 19 SPA (package.json, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `vitest.config.ts`), fixed to port 5173. **Give it no database, Prisma, or server dependency** — Article 14's "no DB access" is enforced by absence, not by review
- [X] T032 [US1] Create `apps/admin/src/{main.tsx,App.tsx}` as a minimal shell and `apps/admin/src/styles.css` importing `packages/config/tokens.css`, defining nothing of its own
- [X] T033 [P] [US1] Create empty `apps/admin/src/messages/{en,ar}.json` (Article 6's admin tree doesn't list a `messages/` dir but Article 21 requires the files — placed under `src/` for consistency with `apps/web`; flag to the client if Article 6 should be amended to say so explicitly) and `apps/admin/tests/smoke.test.ts`
- [X] T034 [US1] Create `docker-compose.yml` with PostgreSQL 16 (5432), Redis 7 (6379), and MinIO (9000 API / 9001 console), each with a healthcheck and a named volume, startable as a group independently of the app processes (FR-009, research R10)
- [X] T035 [US1] **Verified end to end 2026-08-10.** `docker compose up -d`: all 3 containers `healthy` (postgres 16, redis 7, minio) within 17s. `pnpm dev`: api listening (immediate), admin ready 1.17s, **web ready 10.7s** (cold Next compile — under SC-001's 30s target, but not the near-instant admin/api figure; reported honestly per research R3). All 3 ports confirmed live: `GET /health`→200, `GET /`→307→`/en`→200, admin→200. Token check (corrected, source-only): returns **only** `packages/config/tokens.css` — confirmed exactly one definition. Isolated reload: edited `apps/admin/src/App.tsx` twice while running; log shows 2 `hmr update` events for admin only, zero triggered activity in api/web logs (US1 scenario 2 confirmed). Cleanly stopped afterward (verified all 3 ports return connection-refused)

**Checkpoint**: US1 is independently functional. This is the MVP — **but note FR-006 ("validate its
entire runtime configuration") and SC-002 (100% variable coverage) are not yet satisfied**: T022
ships a 4-variable schema; the full 12-variable contract lands in US2 (T040). Do not report US1
alone as satisfying FR-006.

---

## Phase 4: User Story 2 — Missing configuration fails loudly, not silently (Priority: P2)

**Goal**: The API refuses to start on bad configuration or unreachable infrastructure, naming the
exact variable or service — and never printing a secret.

**Independent Test**: Unset a required variable, start the API alone, confirm it exits non-zero
before binding a port with a message naming that variable and echoing no values.

### Tests for User Story 2 ⚠️

> Write these first; they must fail before the implementation lands.

- [X] T036 [P] [US2] Create `apps/api/tests/env.test.ts`, **table-driven over every key in the schema**: for the 7 variables with no default (`DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `CORS_ORIGINS`), assert that removing *that one* variable (with all others valid) exits non-zero and names *that* variable. For the 5 with a default (`NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`, `S3_REGION`), assert the OPPOSITE — absence succeeds and the documented default applies (SC-002, corrected 2026-08-10). For **all 12**, assert an explicitly-set malformed value (e.g. `PORT=not-a-number`) exits non-zero naming that variable — malformation always fails regardless of whether the key has a default. **All** failures in a single run are reported together, not one per restart; a fully valid environment starts cleanly (US2 scenarios 1–3)
- [X] T037 [P] [US2] Add a redaction case to `apps/api/tests/env.test.ts` asserting that a secret-bearing value (e.g. a password inside `DATABASE_URL`) **never appears in the error output** — the message carries the variable name and the failed constraint only (clarification 2026-08-10, research R5)
- [X] T038 [P] [US2] Create `apps/api/tests/env-example-sync.test.ts` asserting set-equality between the Zod schema's keys and the keys in `.env.example`, failing with the specific drifted keys in **both** directions (US2 scenario 4, FR-008, research R7)
- [X] T039 [P] [US2] Create `apps/api/tests/health.test.ts` asserting that an unreachable dependency causes an immediate non-zero exit naming that service, with **no retry loop** (FR-014, research R6)

### Implementation for User Story 2

- [X] T040 [US2] Expand the Zod schema in `apps/api/src/config/env.ts` to the full contract in `contracts/env.md`: `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `CORS_ORIGINS`. **`CORS_ORIGINS` must reject `*` at the schema level** (Article 29 **[NN]**). Do **not** add JWT or mail secrets — they belong to the features that introduce them (Article 11, research R13)
- [X] T041 [US2] Implement the failure formatter in `apps/api/src/config/env.ts`: iterate `error.issues`, print one `<VARIABLE_NAME>: <constraint>` line per problem, then `process.exit(1)`. **Never interpolate `process.env[key]` into the output**
- [X] T042 [P] [US2] Create `apps/api/prisma/schema.prisma` with `datasource` and `generator` blocks and **zero models** — enough for `prisma generate` and the connectivity check, nothing more (Article 11, data-model.md)
- [X] T043 [US2] Create `apps/api/src/lib/health.ts` performing a **single-shot** reachability check against Postgres, Redis, and object storage, each failing with the service named. No backoff, no retry (FR-014)
- [X] T044 [US2] Wire the boot order in `apps/api/src/server.ts` to exactly the state machine in `data-model.md`: parse env → check Postgres → check Redis → check object storage → `listen()`. **Every failure path exits before the port is bound** (FR-006)
- [X] T045 [US2] Create `.env.example` carrying every key in the schema with placeholder values and **no real credential**. Confirm T038 passes against it

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 — Every pull request is checked the same way (Priority: P3)

**Goal**: Four independently reported checks on every PR, with migrations structurally unable to
run from them.

**Independent Test**: Open a PR against the scaffold; all four checks run and report separately;
no migration executes.

### Implementation for User Story 3

- [X] T046 [US3] Create `.github/workflows/ci.yml` triggered on `pull_request`, with one `quality` job running lint, typecheck, test, and build as four named steps each guarded by `if: '!cancelled()'` so **all four report even when an earlier one fails** (FR-010, research R8). Pin Node via `node-version-file: .nvmrc`
- [X] T047 [US3] Add pnpm store and Turborepo cache restoration to `.github/workflows/ci.yml`
- [X] T048 [US3] Create `.github/workflows/migrate.yml` triggered **only** by `workflow_dispatch`, with its job bound to a protected GitHub Environment. This is the **only** file in the repository containing a migration step (FR-012, Article 32, research R9)
- [X] T049 [US3] Verified: `grep -in 'migrate\|migration' .github/workflows/ci.yml` matches only explanatory comments, no actual step. Two workflow files total (`ci.yml`, `migrate.yml`) — no `deploy.yml` exists. `migrate.yml`'s trigger is `workflow_dispatch` only, no `push`/`pull_request`
- [X] T050 [US3] **Verified live on GitHub, 2026-08-10** — PR #1 opened (draft): https://github.com/andrewayadwadie/pascca/pull/1. First run failed for real (`next-env.d.ts` triple-slash-reference lint error — a genuine bug this task caught, fixed in `packages/config/eslint/base.js`, see commit fdc0c90). Second run: **all 4 checks passed in 54s**, zero manual setup (SC-003 confirmed for real, not just asserted)
- [ ] T051 [US3] **NOT DONE — human action, cannot be automated by this agent.** In GitHub **Settings → Environments** for `andrewayadwadie/pascca`: create an environment named `production` (matching `migrate.yml`'s `environment:` key), add at least one **required reviewer**, and add a `DATABASE_URL` secret scoped to that environment (not repository-wide). Protection rules cannot be declared in YAML — I have `repo` scope via `gh` but deliberately did not attempt this, since silently configuring who is allowed to approve production migrations is not a decision an agent makes unattended. **Until this is done, dispatching `migrate.yml` would NOT wait for approval — the gate is currently nominal, and Article 32 is not fully satisfied.**

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T052 [P] Create a root `README.md` pointing at `specs/001-monorepo-scaffold/quickstart.md` for setup, and stating the Node 22 requirement up front
- [X] T053 **Walked verbatim, 2026-08-10**: every command block in quickstart.md tested exactly as written (unset DATABASE_URL → fails naming it; PORT=not-a-number → fails naming it; `grep -c hunter2` → 0; docker compose stop/start postgres → fail-fast + recovery; chained `pnpm lint && typecheck && test && build` → exit 0). One real gap found and fixed: `.env` loading was never wired up — see commit f3eb0dc
- [X] T054 **Verified 2026-08-10**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — exit 0, all 6 workspace members, 66 tests passing (25+1+1+34+2+3)
- [X] T055 **Verified programmatically**: all 6 members (`packages/{config,types,api-client}`, `apps/{api,web,admin}`) declare all 5 scripts; every member has ≥1 `.test.ts(x)` file
- [X] T056 **Verified**: only `.env.example` is tracked; `.gitignore` covers `.env`/`.env.*` with `!.env.example`; `git check-ignore -v .env` confirms active; no credential patterns found in committed source
- [X] T057 Reported to the user directly in the `/speckit-implement` conversation summary as open decisions, not completed work: (1) Node 22 vs. local Node 24 divergence; (2) T051's GitHub Environment reviewer setup

---

## Dependencies & Execution Order

### Phase order

```text
Phase 1 Setup  →  Phase 2 Foundational  →  Phase 3 US1  →  Phase 4 US2  →  Phase 5 US3  →  Phase 6 Polish
                        (blocking)           (MVP)
```

### Story dependencies

- **US1** depends on Phases 1–2 only. It is the MVP and ships alone.
- **US2** depends on US1 — it hardens the API that US1 stands up (the spec says as much: "it
  depends on the API scaffold existing first"). T022 deliberately ships a minimal env schema so
  US1 can boot; T040 expands it to the full contract.
- **US3** depends on US1 and US2 existing to have something worth checking. Its CI workflow is
  otherwise independent.

### Key blocking edges

- T003 (root `package.json`) blocks every `turbo run` task
- T009 (`tokens.css`) blocks T028 and T032 — both front ends import it
- T010–T016 (shared configs) block every app's config file
- T022 (env module) blocks T024, and is expanded by T040
- T040 (full schema) blocks T045 (`.env.example`), which T038 tests
- T042 (`schema.prisma`) blocks T043's Postgres check
- T048 blocks T051 (the environment must be referenced before it can be protected)

---

## Parallel Execution Examples

**Phase 1** — after T003 lands:

```text
T004 (pnpm-workspace.yaml) · T005 (turbo.json) · T006 (.gitignore)
```

**Phase 2** — after T008/T009:

```text
T010 (tsconfig) · T011 (eslint base) · T016 (vitest base) · T018 (types) · T019 (api-client) · T020 (docs/api.md)
```

**Phase 3** — the three app scaffolds are independent files:

```text
T021 (api scaffold) · T026 (web scaffold) · T031 (admin scaffold)
then: T025 (api smoke) · T029 (web messages) · T030 (web smoke) · T033 (admin messages + smoke)
```

**Phase 4** — all four test files are independent and should be written together, before T040–T045:

```text
T036 · T037 · T038 · T039
```

---

## Implementation Strategy

### MVP first

**Phases 1 → 2 → 3 (T001–T035)** delivers US1 and is a coherent stopping point: the workspace
exists, three apps start on one command, and both front ends share one token file. Everything
after that hardens it.

### Incremental delivery

1. **Phases 1–3** → US1 → developers can work in the repo
2. **Phase 4** → US2 → misconfiguration can no longer reach a running process
3. **Phase 5** → US3 → the conventions above become enforced rather than agreed
4. **Phase 6** → polish, plus surfacing the two decisions that need a human

### What this feature deliberately does not build

Per Article 11 and research R13 — flagged here so `/speckit-analyze` can catch drift, and so
nobody "helpfully" adds one of these mid-implementation:

no endpoint or module · no Prisma **model** or migration · no response-envelope implementation or
error code · no auth, JWT secret, or `requirePermission` · no page, component, or user-facing
string · no deploy workflow · nothing from Phase 9 (ordering, payments, loyalty, delivery —
Article 1 **[NN]**).

If one of these seems necessary to finish a task, that is a signal the task was misread — stop
and check, rather than scaffolding forward.
