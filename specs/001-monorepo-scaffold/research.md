# Phase 0 Research: Monorepo Scaffold

**Feature**: `001-monorepo-scaffold` | **Date**: 2026-08-10

Every decision below is either (a) fixed by the constitution and recorded here for traceability,
or (b) a genuine choice this feature makes. Choices marked **[Art 5]** are not ours to make —
they are listed so the plan can be checked against the tech track without re-reading the
constitution.

---

## R1 — Node runtime version

**Decision**: Pin Node **22 LTS** via `.nvmrc`, `engines.node` in the root `package.json`, and
`actions/setup-node@v4` with `node-version-file: .nvmrc` in CI.

**Rationale**: Article 5 **[NN]** locks the runtime to "Node.js 22 LTS". Substitutions require a
constitution amendment with client sign-off (Article 34).

**Finding — divergence on this machine**: the development machine currently runs **Node v24.13.0**.
The scaffold will not silently accept it: `engines.node: ">=22 <23"` in `package.json` plus
`engineStrict: true` makes the mismatch a loud install-time failure rather than a subtle runtime
difference between local and CI.

**Correction found during implementation (2026-08-10)**: `engine-strict=true` in `.npmrc` — the
mechanism this section originally specified — does **not** enforce anything on pnpm 11.3.0. It
silently prints `[WARN] Unsupported engine` and installs anyway (exit 0), confirmed by direct
test. The setting that actually works on pnpm 11 is **`engineStrict: true` in
`pnpm-workspace.yaml`**, which produces a hard `ERR_PNPM_UNSUPPORTED_ENGINE` and exit code 1
(verified). `.npmrc`'s `engine-strict=true` is kept only for npm-compatible tooling that might
read it directly; it is not load-bearing. Anyone repeating "how is Node 22 enforced" should look
at `pnpm-workspace.yaml`, not `.npmrc`.

**Action required from the developer**: install and select Node 22 (`nvm use`, `fnm use`, or
Volta pin). If the project genuinely wants Node 24, that is an **Article 5 amendment needing
client sign-off** — it cannot be decided inside a plan (Article 34). Flagged, not routed around.

**Alternatives considered**: allow `>=22` (rejected — lets a machine drift onto 24 and hides the
divergence); no engine constraint at all (rejected — makes the Article 5 pin unenforceable).

---

## R2 — Workspace and task runner

**Decision** **[Art 5]**: pnpm workspaces (`pnpm-workspace.yaml`) + Turborepo. Root
`package.json` declares `packageManager` so every machine and CI runner resolves the same pnpm.

**Task graph** (`turbo.json`, Turborepo 2.x uses the `tasks` key, not the 1.x `pipeline` key):

| Task | Depends on | Cached | Notes |
|---|---|---|---|
| `dev` | — | no | `persistent: true` — long-running, never cached |
| `build` | `^build` | yes | upstream packages build first |
| `typecheck` | `^build` | yes | needs upstream `.d.ts` emitted |
| `lint` | — | yes | no cross-package dependency |
| `test` | `^build` | yes | needs upstream build output |

**Rationale**: `^build` on `typecheck`/`test` is what makes `packages/types` and
`packages/api-client` usable by the apps once they carry generated content (Article 8) — without
it, a consumer typechecks against stale or missing declarations.

**Alternatives considered**: npm/yarn workspaces (rejected — Article 5 specifies pnpm); Nx
(rejected — Article 5 specifies Turborepo).

---

## R3 — Single dev command starting three apps

**Decision**: root script `"dev": "turbo run dev"`. Fixed, non-colliding ports: **web 3000**,
**api 3001**, **admin 5173**.

**Rationale**: FR-005 requires one command; Turborepo's `persistent: true` runs all three
concurrently with interleaved, prefixed output. Fixed ports make the acceptance test
deterministic — "reachable on its own port" is only checkable if the port is known in advance.

**Risk against SC-001 (under 30 seconds)**: a *cold* Next.js dev start (first-ever compile) can
exceed 30s on a slow machine. SC-001 is interpreted as a warm start — dependencies installed,
infrastructure already running. This is worth measuring during implementation and reporting
honestly rather than asserting; if a cold start misses 30s, that is a finding for the client, not
a reason to quietly redefine the criterion.

---

## R4 — Design tokens shared by web and admin

**Decision**: `packages/config/tokens.css` holds the Article 16 `:root{}` block **verbatim** — a
plain CSS custom-property file with no build step and no preprocessor. `apps/web` and
`apps/admin` each import that one file. Neither app defines a colour, radius, spacing, or motion
value of its own.

**Rationale**: Article 8 makes `packages/config/tokens.css` the single source of design values,
and Article 16 **[NN]** says the token set is locked. Plain CSS custom properties are the only
format both a Next.js app (Tailwind 4, CSS-first) and a Vite SPA can consume from one shared file
with zero duplication and zero transform — anything requiring a build step introduces a second
representation, which is exactly what Article 8 forbids.

**Enforcement** (SC-005 — "zero duplicated or one-off values"): the shared lint config bans raw
hex/rgb colour literals in app source. Without a mechanical check, SC-005 is unverifiable and
will erode on the first rushed PR.

**Alternatives considered**: duplicating tokens into each app's Tailwind config (rejected —
two sources of truth, direct Article 8 violation); a JS/TS token module compiled to CSS per app
(rejected — same problem, plus the compiled output becomes a second representation to keep in
sync); Tailwind `@theme` as the primary definition (rejected — it would live in `apps/web` and
the Vite admin could not consume it).

---

## R5 — Environment validation that names the offending variable

**Decision**: `apps/api/src/config/env.ts` parses `process.env` with a Zod schema via
`safeParse`. On failure it iterates `error.issues`, prints one line per problem as
`<VARIABLE_NAME>: <what was wrong>`, and calls `process.exit(1)` — **before** the Fastify server
binds a port. The module exports a frozen, fully typed `env` object; `process.env` is never read
anywhere else in the codebase.

**Value redaction** (clarification, 2026-08-10): the message prints the variable **name and the
validation failure only — never the value**. Zod's default issue messages describe the constraint
("Required", "Invalid url", "Expected number") and do not echo input, so the default output is
already safe; the formatter additionally never interpolates `process.env[key]`. This keeps
secrets out of terminals, CI logs, and screen shares, consistent with Article 29's "no PII in
logs" posture.

**Rationale**: Article 8 (one source of truth for configuration) and FR-006/FR-007. Exiting
before `listen()` is what makes FR-006's "before it accepts any incoming request" literally true
rather than approximately true.

**Alternatives considered**: throwing instead of exiting (rejected — a throw can be swallowed by
a supervisor and leave a half-started process); validating lazily on first access (rejected —
violates FR-006 directly); printing only the first failure (rejected — forces the developer
through one restart per missing variable).

**Gap found and fixed during implementation (2026-08-10)**: this section describes *validating*
`process.env`, but not how `.env` gets *into* `process.env` in the first place — nothing did.
`quickstart.md` instructed `cp .env.example .env`, but no code loaded that file; a developer
following it exactly would have hit "DATABASE_URL: Required" regardless of what `.env` contained.
Fixed with Node 22's native `--env-file-if-exists=../../.env` flag on `apps/api`'s `dev` and
`start` scripts (confirmed `tsx` forwards it to the underlying Node process) — no `dotenv`
dependency needed, and `-if-exists` means a missing `.env` falls through to loadEnv's own
friendlier per-variable error instead of a blunt Node file-not-found crash. Verified end-to-end
with `env -i` (a clean environment) and a real file, confirming values arrive purely from the
file, not inherited shell state.

---

## R6 — Fail-fast infrastructure connectivity

**Decision** (clarification, 2026-08-10): after env validation and before `listen()`, the API
checks reachability of Postgres, Redis, and object storage **once each**. Any failure prints the
unreachable service by name and exits non-zero. **No retry loop, no backoff.**

**Rationale**: FR-014. One consistent fail-fast philosophy across configuration errors and
connectivity errors means a developer learns exactly one failure mode. It is also deterministic
to test — a retry loop turns the acceptance test into a timing race.

**Note for a future deployment feature**: fail-fast at boot is right for local development and
for a supervised container that will be restarted by its orchestrator. A future feature that
introduces a deployment topology should revisit whether an orchestrator-level restart policy
covers transient startup races; that is out of scope here and must not be assumed to be already
handled.

**Alternatives considered**: bounded backoff (rejected in clarification — non-deterministic
tests); indefinite retry (rejected — masks a genuinely misconfigured service forever).

---

## R7 — Keeping `.env.example` in sync

**Decision**: a test asserts set-equality between the keys the Zod schema declares and the keys
present in the committed `.env.example`. It fails naming the specific drifted keys in both
directions (in schema but not example; in example but not schema).

**Rationale**: FR-008 and the spec's edge case "a new environment variable is added to the
schema but the example file isn't updated". A convention enforced only by reviewer memory is not
enforced. Making it a test means the drift is caught by the same `pnpm test` that already gates
every PR (FR-010) — no new mechanism.

**Alternatives considered**: generating `.env.example` from the schema (rejected — the spec's
Assumptions explicitly scope this to a comparison, not a generator, and a generated file loses
hand-written placeholder guidance); a lint rule (rejected — this is a cross-file invariant, which
is a test's job, not a linter's).

---

## R8 — CI: four independently reported checks

**Decision**: one `quality` job in `.github/workflows/ci.yml` on `pull_request`, running four
named steps — lint, typecheck, test, build — each guarded with `if: '!cancelled()'` so **all four
run and report even when an earlier one fails**. pnpm store and Turborepo cache are restored
between runs.

**Rationale**: FR-010 requires each of the four to be "reported individually". Plain sequential
steps stop at the first failure, so one lint error would hide a typecheck error and cost the
contributor an extra round trip. `!cancelled()` gives four independent results from one install.

**Alternatives considered**: a 4-way job matrix (genuinely cleaner separation in the GitHub
checks UI, but pays install cost four times — the `if: '!cancelled()'` approach delivers the same
independent reporting at a quarter of the CI minutes; revisit if the four tasks diverge enough in
runtime to want parallelism); separate workflows per task (rejected — duplicated setup, harder to
require as a single merge gate).

---

## R9 — Migrations gated behind manual approval

**Decision**: migrations live **only** in `.github/workflows/migrate.yml`, triggered **only** by
`workflow_dispatch`, in a job bound to a GitHub **Environment** that has required reviewers.
No migration step exists in `ci.yml`. No deploy workflow ships in this feature.

**Rationale**: Article 32 and FR-012. The guarantee is structural, not advisory — the spec's edge
case explicitly rejects "a comment telling people not to do it". Because a migration step exists
in exactly one manually-dispatched, reviewer-gated workflow, a future deploy workflow cannot
inherit one by accident.

**Manual setup caveat (must be flagged, cannot be automated)**: GitHub Environment protection
rules — the required-reviewers list — are configured in repository settings and **cannot be
declared in the workflow YAML**. Until a reviewer is configured on that environment, the job
would run on dispatch without waiting for approval. Creating the environment and adding at least
one required reviewer is therefore a checklist item in `quickstart.md`, and the feature is not
done until it is confirmed in the repository settings.

**On acceptance scenario US3-4** ("merged to main → deploy runs → no migration executes"): no
deploy workflow exists yet, so this holds vacuously today. It is satisfied *structurally* rather
than *demonstrably*, and that distinction is recorded here rather than papered over — the first
feature that introduces a deploy pipeline inherits the obligation to keep it true.

---

## R10 — Local infrastructure (`docker-compose.yml`)

**Decision** **[Art 5]**: PostgreSQL 16, Redis 7, and MinIO, started as a group with one command
and independent of the app processes (FR-009). Ports: Postgres **5432**, Redis **6379**, MinIO API
**9000**, MinIO console **9001**. Named volumes so data survives a restart. Healthchecks on all
three so "the group is up" is a real signal rather than "the container process started".

**MinIO as an R2 stand-in**: Cloudflare R2 exposes an S3-compatible API and MinIO speaks the same
protocol, so **one set of `S3_*` variables serves both** — only the endpoint value changes between
local and production. This is what keeps the storage configuration a single shape (Article 8)
instead of a local variant and a production variant that drift.

**Scope guard**: local development only. No production R2 bucket, credential, or account is
touched by this feature.

---

## R11 — Smoke test per workspace member

**Decision** (clarification, 2026-08-10): every app and package carries one trivial test that
actually executes, using Vitest **[Art 5]** with a shared base config in `packages/config`.

**Rationale**: FR-011. A green `test` stage over zero test files proves nothing about whether the
runner is wired correctly — a wrong include glob or a missing dependency would pass silently
until the first real feature's tests never ran. One executing assertion per member turns the
stage into evidence.

---

## R12 — Shared TypeScript and lint configuration

**Decision**: `packages/config` exports one base `tsconfig` (strict: `strict`, `noUncheckedIndexedAccess`,
`noImplicitOverride`, `exactOptionalPropertyTypes`) and one flat ESLint config, composed into
node/react variants. Apps and packages **extend**; none redefines a rule set from scratch (FR-003).

**Accessibility rules ship now** (AR-007): the React lint variant includes `jsx-a11y` from day one,
even though no screen exists yet. Adding the rules after the first UI ships means adopting them
against an existing pile of violations, which is when teams turn them off.

**Rationale**: FR-002, FR-003, Article 8. The spec's edge case about conflicting compiler options
is handled by extension: a package needing an exception writes a visible override in its own
`tsconfig.json`, which is a reviewable diff rather than a hidden divergence.

---

## R13 — What deliberately does NOT ship

Recorded so `/speckit-analyze` can catch scope drift, per Article 11 (build the phase in front of
you):

| Not shipping | Belongs to |
|---|---|
| Any API endpoint, route, or module | first API feature (Article 7's four-file rule has nothing to apply to yet) |
| Any Prisma **model** or migration | first entity feature. `schema.prisma` ships with `datasource` + `generator` blocks and **zero models** — enough for `prisma generate` and a connectivity check, nothing more |
| Response envelope implementation, error codes | first API feature (Article 10). `docs/api.md` is seeded **empty** so the registry exists before the first code needs registering |
| Auth, JWT secrets, `requirePermission` | auth feature (Articles 14, 29). JWT variables are deliberately **absent** from the env schema — adding them now would put unused secrets in `.env.example` |
| Any page, component, or user-facing string | feature that needs them. Web/admin get an empty locale-routing shell and empty message files only (AR-003) |
| A deploy workflow | first deployment feature (see R9) |
| Ordering, payments, loyalty, delivery | **Phase 9** — Article 1 **[NN]**. Not built, not scaffolded, not stubbed |

---

## Unresolved

None. No `NEEDS CLARIFICATION` markers remain: the three questions raised during
`/speckit-clarify` (value redaction, fail-fast vs retry, smoke-test proof) are resolved and
recorded in R5, R6, and R11 respectively.

**One item requires human action, not clarification**: the Node 22 vs. local Node 24 divergence
(R1) — the developer switches Node, or the client signs off on an Article 5 amendment.
