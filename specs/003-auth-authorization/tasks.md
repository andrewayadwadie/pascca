---

description: "Task list for 003-auth-authorization"
---

# Tasks: Auth & Authorization

**Input**: Design documents from `/specs/003-auth-authorization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Article 30 names two rows this feature owns by domain — "Permissions | every role ×
every admin endpoint, asserting status codes" and "Auth | refresh reuse detection revokes the
family" — both **mandatory** (US2, US3). Every other story also gets tests, because everything
this feature can be tested for, it is (002's own precedent): US1's login/session flow and US4's
registration/profile flow are directly what their spec.md acceptance scenarios assert, not
optional coverage.

**Organization**: Grouped by user story so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 / US4 from spec.md
- Exact file paths in every description

## Path Conventions

- **Modules**: `apps/api/src/modules/{auth,users,permissions}/` — exactly `.routes.ts`,
  `.service.ts`, `.repository.ts`, `.schema.ts` each (Art 7)
- **Plugins**: `apps/api/src/plugins/` · **Lib**: `apps/api/src/lib/`
- **Schema**: `apps/api/prisma/schema.prisma` · **Seed**: `apps/api/prisma/seed/`
- **Tests**: `apps/api/tests/{auth,users,permissions,fixtures}/`
- **Error codes**: `docs/api.md` (Art 10) · **Shared types**: `packages/types/` (generated, Art 8)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Get the new dependencies this feature needs into the workspace.

- [X] T001 Add `@fastify/cookie`, `@fastify/rate-limit`, `@fastify/cors`, `@fastify/helmet`,
      `@fastify/swagger`, `fastify-plugin` to `dependencies` in `apps/api/package.json`; add
      `fast-jwt` (T011 superseded `@fastify/jwt` — research R2 revised) (research R2)
- [X] T002 [P] Add `openapi-typescript` to `devDependencies` in `packages/types/package.json`
      (research R9)
- [X] T003 Run `pnpm install` and confirm all new dependencies resolve with no peer-dependency
      warnings

**Checkpoint**: New dependencies installed, nothing wired yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The infra and libraries every user story needs — Prisma/Redis access from Fastify,
the security baseline (CORS/Helmet), the enveloped-error machinery, JWT/hash primitives, and the
OpenAPI→`packages/types` pipeline. No domain module (auth/users/permissions) business logic yet.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add `JWT_ACCESS_SECRET` and `COOKIE_SECRET` (`z.string().min(32)`, no default) to the
      Zod schema in `apps/api/src/config/env.ts`; update `.env.example` to match (Art 8, research
      R3/R8)
- [X] T005 [P] Create `apps/api/src/plugins/prisma.ts` — a `fastify.prisma` decorator wrapping one
      long-lived `PrismaClient`, disconnected on `onClose` (research R1)
- [X] T006 [P] Create `apps/api/src/plugins/redis.ts` — a `fastify.redis` decorator wrapping one
      long-lived `ioredis` instance, disconnected on `onClose` (research R1)
- [X] T007 [P] Create `apps/api/src/plugins/cors.ts` — registers `@fastify/cors` with the
      `CORS_ORIGINS` allow-list from `env.ts`; never `*` (Art 29 [NN])
- [X] T008 [P] Create `apps/api/src/plugins/helmet.ts` — registers `@fastify/helmet` (Art 29
      [NN])
- [X] T009 Create `apps/api/src/plugins/errors.ts` — the Article 10 envelope: wraps every
      response `{success,data,meta}` / `{success:false,error:{code,message,details}}`, and an
      `AppError` class mapping a registered code to its HTTP status, used by every module below
- [X] T010 [P] Create `apps/api/src/lib/hash.ts` — `hashPassword`/`verifyPassword` (argon2id,
      existing `argon2` dependency from 002) and `hashRefreshToken` (SHA-256, Node's built-in
      `crypto`) — deliberately two different algorithms for two different threat models (research
      R4)
- [X] T011 [P] Create `apps/api/src/lib/jwt.ts` — `signAccessToken({sub, role})` /
      `verifyAccessToken(token)`, HS256, 15-minute expiry, payload carries no permission list
      (research R3)
- [X] T012 Create `apps/api/src/plugins/auth.ts` — registers `@fastify/cookie` (using
      `COOKIE_SECRET`); exports an `authenticate` preHandler that extracts the bearer token from
      `Authorization`, verifies it via `lib/jwt.ts` (T011), and sets `request.user = {id, role}`,
      or throws the registered `AUTHZ_UNAUTHENTICATED` `AppError` (FR-003)
- [X] T013 [P] Create `apps/api/src/plugins/rate-limit.ts` — exports `registerAuthRateLimit`,
      backed by `fastify.redis` (T006); registered `global:true` inside ONE child scope shared by
      all four `/auth/*` routes (T028), giving the single combined 5/min/IP budget Clarification
      Q1 settled on — revised from a per-route `config.rateLimit` approach during T028's
      implementation after discovering that creates a separate store per route even with a
      shared `keyGenerator` (research R7)
- [X] T014 Create `apps/api/src/plugins/swagger.ts` — registers `@fastify/swagger`, assembling
      the OpenAPI 3.1 document from every route's `fastify-type-provider-zod` schemas, served at
      `/api/v1/openapi.json` (research R9)
- [X] T015 Create `packages/types/scripts/generate.ts` — fetches the OpenAPI document (from a
      running dev server or a static export) and writes `packages/types/src/*` via
      `openapi-typescript`; wire it into `packages/types/package.json`'s `build` script (Art 8,
      research R9)
- [X] T016 Wire T005–T014's plugins into `apps/api/src/app.ts` in dependency order (prisma, redis
      → cors, helmet → errors → auth → rate-limit → swagger), all registered before the
      `/api/v1` scope
- [X] T017 [P] Create `apps/api/src/modules/users/users.schema.ts` — Zod DTOs: `ProfileResponse`
      (excludes `passwordHash`), `RegisterBody`, `UpdateProfileBody` (Art 7)
- [X] T018 [P] Create `apps/api/src/modules/users/users.repository.ts` — Prisma-only access to
      `User`: `findByEmail`, `findById`, `create`, `update`, `list`, `softDelete`; no business
      rules (Art 7)
- [X] T019 Create `apps/api/src/modules/users/users.service.ts` with base methods only —
      `findByEmailForAuth`, `createCustomer` (always `role: CUSTOMER`, FR-001), `getProfile`
      (FR-016) — admin methods and the self-protection invariants are added in US2 (T043)
- [X] T020 [P] Create `apps/api/src/modules/auth/auth.schema.ts` — Zod DTOs: `LoginBody`,
      `RefreshBody` (mobile), `TokenResponse` (Art 7)
- [X] T021 [P] Create `apps/api/src/modules/auth/auth.repository.ts` — Prisma-only access to
      `RefreshToken`: `create`, `findByTokenHash`, and `rotate` (a single `UPDATE ... WHERE id = ?
      AND "revokedAt" IS NULL` — the atomic conditional update research R10 relies on for the
      rotation race); no business rules (Art 7)
- [X] T022 Run `pnpm --filter @pascca/api typecheck` and confirm the foundational plumbing
      compiles with zero routes registered yet

**Checkpoint**: Infra ready — Prisma/Redis reachable from Fastify, security baseline registered,
JWT/hash primitives exist. No endpoint exists yet.

---

## Phase 3: User Story 1 — Staff sign in and stay signed in (Priority: P1) 🎯 MVP

**Goal**: A staff member can log in, use the access token, refresh before it expires, and log
out — the entry gate for every other admin capability.

**Independent Test**: Seed a staff user; call login with correct and incorrect credentials; call
`GET /me`; call refresh; call logout; confirm the refresh token no longer works afterward.

### Tests for User Story 1 ⚠️

> Write these FIRST; confirm they fail (no route exists yet).

- [X] T023 [P] [US1] Create `apps/api/tests/auth/login-session.test.ts` — login success issues an
      access + refresh token and updates `lastLoginAt`; wrong password → `AUTH_INVALID_CREDENTIALS`
      with no field-specific hint; login against an inactive/soft-deleted account →
      `AUTH_ACCOUNT_INACTIVE` (US1 AS1, AS2, AS7)
- [X] T024 [P] [US1] Add to `login-session.test.ts` — `GET /me` with a valid access token returns
      the profile with no `passwordHash`; an expired or malformed access token on any protected
      route → `AUTHZ_UNAUTHENTICATED` (US1 AS3, AS4)
- [X] T025 [P] [US1] Add to `login-session.test.ts` — a valid refresh rotates to a new access +
      refresh pair and the presented refresh token stops working afterward; logout revokes the
      presented session and reusing it afterward fails (US1 AS5, AS6)

### Implementation for User Story 1

- [X] T026 [US1] Implement login/refresh/logout in `apps/api/src/modules/auth/auth.service.ts` —
      verify credentials via `users.service.findByEmailForAuth` + `hash.verifyPassword`; issue an
      access token (`lib/jwt.ts`) and a refresh token (`auth.repository.create`, a fresh
      `familyId` on login); rotate via `auth.repository.rotate` on refresh; revoke on logout;
      re-check `isActive`/`deletedAt` on every call touching an existing user (FR-004)
- [X] T027 [US1] Implement `getProfile` consumption in `apps/api/src/modules/users/users.service.ts`
      (already stubbed in T019) — confirm it excludes `passwordHash` and any Article-15-restricted
      field (FR-016)
- [X] T028 [US1] Create `apps/api/src/modules/auth/auth.routes.ts` — `POST /auth/login`,
      `POST /auth/refresh`, `POST /auth/logout` under `/api/v1`, each using the shared rate-limit
      config (T013); web/mobile refresh-token transport branching per
      `contracts/auth-endpoints.md`'s client-detection note (FR-009, FR-010)
- [X] T029 [US1] Create `apps/api/src/modules/users/users.routes.ts` with `GET /me` only for
      now — requires `authenticate` (T012) but no permission gate (FR-016)
- [X] T030 [US1] Register `auth.routes` and `users.routes` under the `/api/v1` scope in
      `apps/api/src/app.ts`
- [X] T031 [US1] Register `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_INACTIVE`,
      `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, `AUTHZ_UNAUTHENTICATED` in `docs/api.md` (Art
      10, research R12)
- [X] T032 [US1] Run `apps/api/tests/auth/login-session.test.ts` against the seeded ADMIN/
      MODERATOR (`apps/api/prisma/seed/users.ts`) and confirm it passes

**Checkpoint**: US1 functional — staff can log in, stay signed in, and log out.

---

## Phase 4: User Story 2 — Authorization enforced by a seeded permission map (Priority: P1)

**Goal**: `requirePermission(...)` gates every staff-only action from seeded data; adding a role
or a grant is a seed edit, never a route change.

**Independent Test**: Seed the role→permission grants; call a representative set of
permission-gated actions as each role; assert the exact allow/deny outcome for each.

**Note**: Independently *verifiable* without US1's real login route — a test can mint an access
token directly via `lib/jwt.ts` (T011). Sequenced after US1 here only because both are P1 and
US1's patterns (auth.service, auth.routes) are easiest to extend from, not because of a hard
dependency.

### Tests for User Story 2 (MANDATORY — Article 30 "Permissions" row, SC-002) ⚠️

> Write these FIRST; confirm they fail (`requirePermission` doesn't exist yet).

- [X] T033 [P] [US2] Create `apps/api/tests/fixtures/example-protected-routes.ts` — one
      throwaway `GET`/`POST` route per permission string in `contracts/permission-matrix.md`
      that has no real endpoint (reservation, message, menu, category, gallery, branch, content,
      testimonial, team, post, settings, audit), each behind `requirePermission(<string>)`,
      mounted only inside a test-local Fastify instance — never inside `buildApp()` (research
      R11)
- [X] T034 [US2] Create `apps/api/tests/permissions/permission-matrix.test.ts` — every row of
      `contracts/permission-matrix.md`: 18 permissions × 3 roles (54 assertions) plus the generic
      unauthenticated-caller → 401 check (US2 AS1–AS4, SC-002)

### Implementation for User Story 2

- [X] T035 [US2] Add the `RolePermission` model to `apps/api/prisma/schema.prisma`
      (`data-model.md`) and generate the migration
- [X] T036 [US2] Create `apps/api/prisma/seed/permissions.ts` — one row per `✅` cell in
      `contracts/permission-matrix.md` (research R5); wire it into
      `apps/api/prisma/seed/index.ts`
- [X] T037 [US2] Run the existing 002 test suite (`schema-shape.test.ts`, `migration.test.ts`,
      `seed.test.ts`, `seed-idempotency.test.ts`, `referential-integrity.test.ts`) and confirm it
      is still green — `RolePermission` must not break any prior invariant
- [X] T038 [P] [US2] Create `apps/api/src/modules/permissions/permissions.schema.ts` — Zod DTO
      for `GET /permissions`'s response
- [X] T039 [P] [US2] Create `apps/api/src/modules/permissions/permissions.repository.ts` —
      Prisma-only read access to `RolePermission` (Art 7)
- [X] T040 [US2] Create `apps/api/src/modules/permissions/permissions.service.ts` — loads every
      grant into an in-memory `Map<Role, Set<string>>` once at boot; exposes
      `hasPermission(role, permission)` and `listAll()` (research R6)
- [X] T041 [US2] Create `apps/api/src/plugins/rbac.ts` — `requirePermission(permission)`
      preHandler factory: `AUTHZ_UNAUTHENTICATED` (401) if `request.user` is absent,
      `AUTHZ_FORBIDDEN` (403) if `permissions.service.hasPermission` is false, otherwise
      continues (FR-011, FR-012)
- [X] T042 [US2] Create `apps/api/src/modules/permissions/permissions.routes.ts` —
      `GET /permissions`, gated `requirePermission('audit:read')` (`contracts/auth-endpoints.md`)
- [X] T043 [US2] Extend `apps/api/src/modules/users/users.service.ts` — `listUsers`,
      `changeRole`, `changeActiveStatus`, `deleteUser` (soft delete), each enforcing FR-014 (no
      self-delete/self-deactivate) and FR-015 (sole active ADMIN protected) before touching
      `users.repository`
- [X] T044 [US2] Extend `apps/api/src/modules/users/users.routes.ts` — `GET /users`,
      `PATCH /users/:id/role`, `PATCH /users/:id/active`, `DELETE /users/:id`, gated
      `requirePermission('user:read')`/`requirePermission('user:write')` per
      `contracts/auth-endpoints.md`
- [X] T045 [US2] Create `apps/api/src/lib/audit.ts` — a `writeAudit(actorId, action, entity,
      entityId, before, after)` helper (excluding `passwordHash` from any `User` diff); wire it
      into every mutation in `users.service.ts` (FR-021, Art 15 [NN])
- [X] T046 [US2] Register `permissions.routes` under `/api/v1` in `apps/api/src/app.ts`
- [X] T047 [US2] Register `AUTHZ_FORBIDDEN`, `USER_SELF_DELETE_FORBIDDEN`,
      `USER_LAST_ADMIN_PROTECTED`, `USER_NOT_FOUND`, `VALIDATION_FAILED` in `docs/api.md` (Art
      10, research R12)
- [X] T048 [US2] Create `apps/api/tests/users/self-protection.test.ts` — the exhaustive
      demote/deactivate/delete orderings against the sole active ADMIN, self-targeting, and the
      ≥2-active-ADMINs non-blocking case from `contracts/permission-matrix.md`'s invariants table
      (SC-006)
- [X] T049 [US2] Run `permission-matrix.test.ts` and `self-protection.test.ts` and confirm both
      pass

**Checkpoint**: US1 + US2 functional — the permission boundary is proven for all 18 Article 14
permission strings.

---

## Phase 5: User Story 3 — Refresh token theft is contained automatically (Priority: P2)

**Goal**: An already-rotated refresh token presented again revokes its entire session family.

**Independent Test**: Log in, refresh once (token A → token B), replay token A; confirm token B —
and any other token in the family — also stops working, and the legitimate user must log in
again.

**Depends on**: US1 (extends the refresh/rotation flow it built).

### Tests for User Story 3 (MANDATORY — Article 30 "Auth" row, SC-003) ⚠️

> Write these FIRST; confirm they fail (reuse is currently indistinguishable from "any other
> invalid token").

- [X] T050 [US3] Create `apps/api/tests/auth/refresh-reuse.test.ts` — presenting an
      already-rotated refresh token is rejected AND revokes every token sharing its family,
      including the newest legitimately-issued one; the event is recorded without exposing any
      credential value and triggers no outbound notification (US3 AS1–AS3, Clarification Q3)
- [X] T051 [US3] Add to `refresh-reuse.test.ts` — two requests race to refresh the same token at
      once: exactly one succeeds, the other is treated as reuse; no crash, no two divergent
      "next" tokens issued. Fires genuinely concurrent requests, not mocked timing (Edge Case,
      research R10)

### Implementation for User Story 3

- [X] T052 [US3] Extend `apps/api/src/modules/auth/auth.repository.ts`'s `rotate` — when the
      conditional `UPDATE` (T021) affects zero rows because `revokedAt`/`replacedByTokenHash`
      were already set, return a distinct "reuse" result instead of "not found/expired"
- [X] T053 [US3] Add `revokeFamily(familyId)` to `apps/api/src/modules/auth/auth.repository.ts` —
      sets `revokedAt` on every `RefreshToken` row sharing `familyId` that isn't already revoked
- [X] T054 [US3] Wire reuse handling into `apps/api/src/modules/auth/auth.service.ts`'s refresh
      flow — on T052's "reuse" result, call `revokeFamily` and respond
      `AUTH_REFRESH_REUSE_DETECTED`; log the event (familyId, userAgent, ip from the original
      row) with no credential value and no outbound notification (FR-007, FR-022, Clarification
      Q3)
- [X] T055 [US3] Register `AUTH_REFRESH_REUSE_DETECTED` in `docs/api.md` (Art 10, research R12)
- [X] T056 [US3] Run `apps/api/tests/auth/refresh-reuse.test.ts` and confirm it passes

**Checkpoint**: US1 + US2 + US3 functional — stolen refresh tokens are contained.

---

## Phase 6: User Story 4 — Customer self-service account (Priority: P3)

**Goal**: A visitor can register, sign in, and manage their own profile with no dashboard access.

**Independent Test**: Register with a new email; confirm a CUSTOMER-role account is created and
can sign in; confirm it's rejected on every staff-only action.

**Depends on**: Foundational + US1 (extends the same auth/users service patterns; register
mirrors login, `PATCH /me` mirrors `GET /me`). Does not depend on US2 or US3 — self-service
actions are authenticated-only, not permission-gated.

### Tests for User Story 4 ⚠️

> Write these FIRST; confirm they fail (no route exists yet).

- [X] T057 [P] [US4] Create `apps/api/tests/auth/register.test.ts` — registration creates a
      CUSTOMER-role account and issues tokens exactly like login; a duplicate email →
      `AUTH_EMAIL_TAKEN` without revealing which account owns it (US4 AS1, AS2)
- [X] T058 [P] [US4] Create `apps/api/tests/users/me.test.ts` — `PATCH /me` updates name/phone/
      email; role/`isActive` are never changeable through this route, for any account; a password
      change requires `currentPassword` and revokes every other session for that account (US4
      AS3, Clarification Q2, FR-017); a CUSTOMER hitting a staff-only fixture route (T033) → 403,
      identical to MODERATOR's treatment (US4 AS4)

### Implementation for User Story 4

- [X] T059 [US4] Extend `apps/api/src/modules/users/users.service.ts` — `createCustomer`'s
      email-uniqueness check (409, no field-leak wording, FR-001) and `updateProfile`'s
      password-change branch (verify `currentPassword` via `hash.verifyPassword`, then call
      `auth.service` to revoke every other session for that user — the users→auth cross-module
      service call, Art 7)
- [X] T060 [US4] Add `revokeAllExceptCurrent(userId, currentFamilyId)` to
      `apps/api/src/modules/auth/auth.repository.ts`, exposed from `auth.service.ts` for
      `users.service.ts` (T059) to call
- [X] T061 [US4] Extend `apps/api/src/modules/auth/auth.routes.ts` — `POST /auth/register`,
      rate-limited via the shared bucket (T013)
- [X] T062 [US4] Extend `apps/api/src/modules/users/users.routes.ts` — `PATCH /me`
- [X] T063 [US4] Wire register/`PATCH /me` through `lib/audit.ts` (T045) — `CREATE` on
      registration, `UPDATE` on profile edits (FR-021)
- [X] T064 [US4] Register `AUTH_EMAIL_TAKEN` in `docs/api.md` (Art 10, research R12)
- [X] T065 [US4] Run `register.test.ts` and `me.test.ts` and confirm both pass

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T066 [P] Run `packages/types/scripts/generate.ts` (T015) against the running API's OpenAPI
      document and confirm `packages/types` typechecks (Art 8, Art 31)
- [X] T067 [P] Confirm `docs/api.md` contains all 13 codes from `research.md` R12 with no gaps
      (Art 10)
- [X] T068 Grep `apps/api/src/modules/{auth,users,permissions}` for `role ===` / `role ==` and
      confirm zero matches — every gate is `requirePermission(...)` or the bare `authenticate`
      preHandler, never an inline role comparison (FR-011, Art 14 [NN])
- [X] T069 [P] Update `README.md`'s "Getting started" block to mention the `RolePermission`
      migration/seed step and link `specs/003-auth-authorization/quickstart.md`
- [X] T070 Run the full Definition-of-Done gate: `pnpm lint && pnpm typecheck && pnpm test &&
      pnpm build` green (Art 31)
- [ ] T071 Push the branch, open a PR, and confirm CI is **actually green** on GitHub — including
      the new plugins, the `RolePermission` migration, and the full test suite (feature 001/002
      precedent: a local pass is not evidence)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational. Verifiable independently of US1 (can mint tokens
  directly via `lib/jwt.ts`); sequenced after US1 here for shared-pattern convenience, not a hard
  dependency
- **US3 (Phase 5)**: Depends on **US1** — extends the refresh/rotation flow it built
- **US4 (Phase 6)**: Depends on Foundational + **US1**'s auth/users service patterns. Independent
  of US2 and US3
- **Polish (Phase 7)**: Depends on US1–US4

### Within Each User Story

- Tests are written first; confirm they fail (or fail to even compile, for the integration-level
  permission-matrix and reuse tests that need real routes) before the implementation task that
  satisfies them
- Within a story, repository → service → routes → error-code registration → run-and-confirm

### Parallel Opportunities

- **Phase 1**: T001, T002 — different packages
- **Phase 2**: T005–T008 (four plugin files); T010, T011 (two lib files); T013 (independent of
  T012); T017, T018 (schema + repository, different files); T020, T021 (same, for auth)
- **Phase 3**: T023–T025 all extend the same test file — not parallel once authored together, but
  can be drafted concurrently by different people if desired
- **Phase 4**: T033 (fixture routes) is parallel to nothing else meaningfully sized; T038, T039
  (schema + repository, different files)
- **Phase 6**: T057, T058 — different test files

---

## Parallel Example: Phase 2 Foundational

```bash
# Four plugin files, four different paths — author together:
Task: "Create apps/api/src/plugins/prisma.ts"
Task: "Create apps/api/src/plugins/redis.ts"
Task: "Create apps/api/src/plugins/cors.ts"
Task: "Create apps/api/src/plugins/helmet.ts"

# Two lib files, no shared state:
Task: "Create apps/api/src/lib/hash.ts"
Task: "Create apps/api/src/lib/jwt.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1
2. **STOP and VALIDATE**: staff can log in, call `GET /me`, refresh, and log out against the
   seeded ADMIN/MODERATOR — a genuine, demonstrable dashboard entry gate, even with no permission
   enforcement yet
3. This is real, deployable value on its own — nothing downstream needs to exist for login to
   work

### Incremental Delivery

1. Setup + Foundational → infra exists, nothing is reachable yet
2. **US1** → staff can sign in and stay signed in
3. **US2** → the permission boundary is proven for every Article 14 permission string
4. **US3** → stolen refresh tokens are contained, not just rotated
5. **US4** → customers get self-service accounts
6. Polish → codegen, error-code registry completeness, real CI

### Parallel Team Strategy

With multiple developers, once Foundational is done: Developer A takes US1 → US3 (they share
`auth.service.ts`/`auth.repository.ts`); Developer B takes US2 (owns `permissions.*` + the
`users.*` admin surface); Developer C takes US4 once US1's patterns exist to extend. US2 and US1
can genuinely start in parallel per the Dependencies note above.

---

## Notes

- Commit after each task or logical group; mark tasks `[X]` here as they complete
- Article 11 boundary: if a task tempts you toward a real `menu`/`gallery`/`branch`/`content`/
  `testimonial`/`team`/`post`/`settings`/`audit`/`reservation`/`message` CRUD endpoint, stop —
  that's a future feature; this feature only proves `requirePermission` works for those strings
  via `tests/fixtures/example-protected-routes.ts` (research R11, the specify-time scope
  clarification)
- Article 34: if an article blocks a task, stop and report. Do not amend the constitution mid-run
- `RolePermission` is seed-only in this feature — no task adds a UI or endpoint to edit it at
  runtime (plan.md Known follow-ups). Do not add one without a new clarification
