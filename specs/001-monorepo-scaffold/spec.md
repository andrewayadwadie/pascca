# Feature Specification: Monorepo Scaffold

**Feature Branch**: `001-monorepo-scaffold`
**Created**: 2026-08-10
**Status**: Draft
**Input**: User description: "Set up the Pascca monorepo per Article 6 of the constitution. pnpm workspaces + Turborepo with apps/api, apps/web, apps/admin and packages/types, packages/api-client, packages/config. TypeScript strict everywhere, shared tsconfig and eslint config in packages/config, plus tokens.css containing exactly the token block from Article 16 — this file is the single source of design values for both web and admin. docker-compose.yml running PostgreSQL 16, Redis 7 and MinIO as an R2 stand-in for local development. A config/env.ts in apps/api that validates every environment variable through a Zod schema and exits at boot with a message naming the missing variable. A committed .env.example kept in sync. GitHub Actions running lint, typecheck, test and build on every pull request, with database migrations as a separate manually approved job that never runs automatically on deploy. Acceptance: pnpm dev starts all three apps; a missing env var kills the API at startup with a clear message; CI is green on an empty repo."

## Clarifications

### Session 2026-08-10

- Q: Should the missing/invalid-variable startup error message ever print the variable's actual value, or name only? → A: Name only, never the value — safest default; avoids leaking a secret into console output, CI logs, or a shared terminal.
- Q: When the API starts but local infra services (DB/Redis/storage) aren't reachable yet, should it retry with backoff or fail immediately? → A: Fail immediately with a clear connection error — same fail-fast posture as config validation; deterministic to test.
- Q: Does "CI green on an empty repo" require proof the test runner actually works, or is zero test files an acceptable pass? → A: One trivial smoke test per app/package — a zero-test green check can hide a broken test config until the first real feature silently fails to run its tests.

## User Scenarios & Testing *(mandatory)*

<!--
  This feature has no end-guest user; the "user" is the developer/operator working in this
  repository, and later features that will be built on top of this scaffold. Each story is
  independently verifiable on a clean checkout.
-->

### User Story 1 - Start the whole stack with one command (Priority: P1)

A developer clones the repository, installs dependencies once, and starts local development.
All three applications (API, website, dashboard) come up together, each reachable on its own
port, without hand-starting each app separately or hunting for missing steps.

**Why this priority**: Every other feature in this project is built inside this workspace. If
the stack doesn't start reliably as one command, every future story pays that tax repeatedly.

**Independent Test**: On a clean checkout with dependencies installed and local Docker services
running, invoke the single dev command and confirm the API, website, and dashboard each become
reachable on their own port within a reasonable startup window.

**Acceptance Scenarios**:

1. **Given** a clean checkout with dependencies installed and the local infrastructure services
   (Postgres, Redis, object storage) running, **When** the developer runs the single dev command,
   **Then** the API, website, and dashboard all start and each is reachable on its own port.
2. **Given** the stack is running, **When** the developer edits a file inside any one app,
   **Then** only that app rebuilds/reloads — the other two are unaffected.
3. **Given** a clean checkout, **When** the developer opens the design token file used by the
   website and the dashboard, **Then** both apps resolve to the exact same file — no per-app
   copy exists.

---

### User Story 2 - Missing configuration fails loudly, not silently (Priority: P2)

An operator deploys or a developer runs the API with an incomplete environment. Instead of the
API starting in a broken state and failing confusingly on the first request, it refuses to start
at all and states exactly which variable is missing or invalid.

**Why this priority**: A silent misconfiguration reaching production is the failure mode this
exists to prevent. It's second priority because it depends on the API scaffold existing first.

**Independent Test**: Remove or corrupt one required environment variable, start the API in
isolation, and confirm it exits before accepting any connection, with an error message that
names the specific variable.

**Acceptance Scenarios**:

1. **Given** a required environment variable is absent, **When** the API process starts,
   **Then** it exits with a non-zero status before accepting any request, and the printed
   message names that exact variable without printing any variable's value.
2. **Given** a required environment variable has the wrong shape (e.g. a non-numeric port),
   **When** the API process starts, **Then** it exits the same way, naming that variable and
   what was wrong with it.
3. **Given** every required variable is present and valid, **When** the API process starts,
   **Then** it starts normally and accepts requests.
4. **Given** the committed example environment file, **When** compared against the variables
   the API actually requires, **Then** every required variable appears in the example file with
   a placeholder value — none are missing, none are stale.

---

### User Story 3 - Every pull request is checked the same way, automatically (Priority: P3)

A contributor opens a pull request against an empty or early-stage version of this repository.
Automated checks run without anyone configuring them by hand, and a passing result means the
basics (does it lint, does it typecheck, do the tests pass, does it build) are actually true —
without ever touching a real database as a side effect.

**Why this priority**: This depends on the workspace (US1) existing to have something to check.
It matters from day one because the cost of an unenforced convention compounds with every PR
merged before it's automated.

**Independent Test**: Open a pull request against the scaffold with no application code yet
added, and confirm the automated checks run and pass, and that no database migration executes
as part of that run.

**Acceptance Scenarios**:

1. **Given** a pull request is opened against the repository, **When** the checks run, **Then**
   lint, typecheck, test, and build each execute and are reported individually.
2. **Given** the repository contains only this scaffold and no feature code yet, **When** the
   checks run, **Then** all four pass — each app and package carries one trivial smoke test that
   actually executes, proving the test runner is wired correctly rather than passing on an empty
   suite, and lint/typecheck run against every scaffolded file.
3. **Given** a pull request that would apply a database migration, **When** the pull request's
   checks complete successfully, **Then** no migration has been applied to any database — running
   one requires a separate, explicitly approved step outside the PR check run.
4. **Given** a change is merged to the main branch, **When** the deploy runs, **Then** no
   migration executes automatically as part of that deploy.

---

### Edge Cases

- What happens when a developer runs the dev command but the local infrastructure services
  (Postgres, Redis, object storage) are not running yet? The API fails immediately at startup
  with a clear connection error naming the unreachable service — the same fail-fast posture as
  a missing environment variable, not a silent hang or a retry loop.
- What happens when two workspace packages need conflicting compiler options? The shared base
  config is extended, never overridden silently — a package needing an exception is a visible,
  reviewable diff, not a hidden local override.
- What happens when a new environment variable is added to the validation schema but the
  committed example file isn't updated to match? This drift must be catchable (by an automated
  check or an obvious startup failure), not discovered by a developer guessing.
- What happens on a CI run before any feature-specific tests exist? Each app and package ships
  one trivial smoke test so the test stage exercises the runner for real, rather than passing
  on an empty suite that could be masking a broken test runner.
- What happens if someone tries to wire a migration into the same job/workflow that deploys code?
  The separation must be structural (a distinct job requiring approval), not just a comment
  telling people not to do it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST be organized as a single workspace containing `apps/api`,
  `apps/web`, `apps/admin`, `packages/types`, `packages/api-client`, and `packages/config`,
  matching the project structure fixed by the constitution.
- **FR-002**: Every package and app in the workspace MUST compile under strict TypeScript
  settings — no implicit `any`, no unchecked nulls.
- **FR-003**: `packages/config` MUST provide one shared base TypeScript configuration and one
  shared lint configuration. Apps and packages extend it; none may define a competing,
  independent rule set from scratch.
- **FR-004**: `packages/config` MUST contain a single design-token file consumed by both the
  website and the dashboard. Neither app may hold its own copy or a competing definition of a
  color, radius, spacing, or motion value.
- **FR-005**: A single command MUST start the API, the website, and the dashboard together, each
  reachable on its own local port, without requiring the developer to start them individually.
- **FR-006**: The API MUST validate its entire runtime configuration against a schema at process
  startup, before it accepts any incoming request.
- **FR-007**: If any required configuration value is missing or malformed, the API process MUST
  exit with a non-zero status and print a message identifying the specific variable at fault by
  name — not a generic failure. The message MUST NOT print the variable's actual value, only its
  name and what was wrong with it.
- **FR-008**: A committed example environment file MUST list every variable the API's startup
  schema requires, with a placeholder value for each.
- **FR-009**: Local development infrastructure (a Postgres 16 instance, a Redis 7 instance, and
  an S3-compatible object store standing in for the production storage provider) MUST be
  startable as a group with a single command, independent of the application processes.
- **FR-010**: An automated check MUST run on every pull request and report, individually,
  whether the change lints cleanly, typechecks cleanly, passes its tests, and builds successfully.
- **FR-011**: The automated pull-request check MUST pass against the scaffold in its initial
  state, before any feature-specific application code exists. Each app and package MUST carry
  at least one trivial smoke test that actually executes — an empty test suite is not an
  acceptable substitute for a passing one.
- **FR-012**: Applying a database migration MUST be a distinct, manually approved action, never
  a step that runs automatically as part of merging a pull request or deploying code.
- **FR-013**: `packages/types` and `packages/api-client` MUST exist as buildable, empty
  workspace members ready to receive generated content later — they MUST NOT contain
  hand-written duplicates of shapes that belong elsewhere.
- **FR-014**: If the API cannot reach a required local infrastructure service (database, cache,
  object storage) at startup, it MUST fail immediately with an error naming the unreachable
  service — the same fail-fast posture as a configuration error, with no silent retry loop.

### Always-On Requirements

These come from the constitution and apply to every feature. State how this feature satisfies
each, or `N/A` with a reason — do not delete the rows.

- **AR-001** (Art 3): N/A — this feature ships no guest-facing content; there is nothing yet for
  the dashboard to make editable. The workspace this creates is what later content features
  will build inside.
- **AR-002** (Art 4): N/A — this feature exposes no API endpoint. It creates the `apps/api`
  substrate (routing, config, boot sequence) that the first real endpoint feature will use; the
  "could the Flutter app call this with zero backend changes" test has nothing to apply to yet.
- **AR-003** (Art 21): The website and dashboard scaffolds MUST be created with their i18n
  plumbing point (locale-aware routing entry point, message-file location) present but empty —
  so the first feature that adds real strings extends existing structure instead of retrofitting
  it. No user-facing string exists yet to translate.
- **AR-004** (Art 10): N/A — no endpoint exists yet to return an error. The permanent-code
  registry (`docs/api.md`) is created and seeded empty here so the first feature that throws a
  real error has somewhere to register it, per Article 10.
- **AR-005** (Art 14): N/A — no permission-gated action exists in this scaffold. Role-based
  access control is wired in the auth module, a later feature.
- **AR-006** (Art 15): N/A — no mutable entity exists yet. The `AuditLog` convention is exercised
  starting with the first Tier-1 entity feature (Article 12).
- **AR-007** (Art 28): No screen ships in this feature, so there is nothing to check directly.
  The shared lint configuration in `packages/config` MUST include the accessibility lint rules
  that later UI features will be held to, so the check exists from day one rather than being
  bolted on after the first violation ships.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer on a clean checkout can have all three applications running and
  reachable with a single command, in under 30 seconds on a typical development machine.
- **SC-002**: Every environment variable's *malformation* (an explicitly set but invalid value)
  causes the API to stop at startup, before serving a single request, with a message identifying
  that exact variable — 100% of the time, for every variable, not just some. A variable's plain
  *absence* causes the same stop only for variables with no safe default (e.g. `DATABASE_URL`);
  variables with a deliberate, documented default (e.g. `PORT`) correctly fall back to it when
  absent — that is not a coverage gap, it's the intended behaviour data-model.md specifies.
- **SC-003**: A pull request opened against the scaffold with no application code yet added
  passes every automated check with zero manual setup by the reviewer.
- **SC-004**: Zero database migrations execute automatically as a side effect of merging a pull
  request or deploying code, across every run in the project's history.
- **SC-005**: Every color, radius, spacing, and motion value used anywhere in the website or
  dashboard traces back to exactly one shared definition — zero duplicated or one-off values
  across the two codebases.

## Assumptions

- GitHub Actions is the CI platform, per the constitution's tech track (Article 5) — no
  alternative CI tool is evaluated.
- Developer machines have a container runtime available to run the local Postgres/Redis/object
  storage group; this feature does not provision or manage that runtime itself.
- The object storage standing in for production storage is for local development only; no
  production storage credentials or buckets are touched by this feature.
- No API endpoints, database schema/migrations, or business logic ship in this feature — it is
  pure scaffolding, matching the constitution's phase discipline (Article 11): build the phase
  in front of you.
- "Kept in sync" for the example environment file means the two lists (schema keys, example-file
  keys) can be automatically compared; it does not require a fully automated file generator.

## Constitution Impact *(mandatory)*

**Articles this feature is governed by**: 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 21, 28,
32

**Non-negotiable [NN] articles touched**: 5 (Tech track), 6 (Project structure), 7 (Module
boundaries — directory shape only; no API module exists yet to test the four-file rule against),
8 (One source of truth), 16 (Token set is locked)

**Out of scope by Article 1**: Confirmed. This feature contains no ordering, payment, loyalty,
or delivery-tracking code, table, or scaffolding of any kind — it is infrastructure only.

**Amendment needed?**: No.
