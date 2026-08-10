---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: **MANDATORY** for every risk area in Article 30 that this feature touches — availability,
booking concurrency, confirmation policy, permissions, auth token rotation, Tier-2 content
fallback, testimonial consent, i18n, a11y, load.
Tests for those areas are not negotiable and a phase is not complete without them. Tests outside
those areas are added where they earn their keep, not for coverage theatre.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Fixed by the constitution (Articles 6, 8, 16, 21). Use these, not the generic `src/`:

- **API**: `apps/api/src/modules/<name>/` — exactly `<name>.routes.ts`, `.service.ts`,
  `.repository.ts`, `.schema.ts` (Art 7). Tests in `apps/api/tests/`.
- **Website**: `apps/web/src/app/[locale]/…`, strings in `apps/web/messages/{en,ar}.json`
- **Dashboard**: `apps/admin/src/routes/…`, strings in `apps/admin/messages/{en,ar}.json`
- **Shared**: `packages/types` (generated from OpenAPI — never hand-edited),
  `packages/config/tokens.css`
- **Schema**: `apps/api/prisma/schema.prisma` · **Error codes**: `docs/api.md` (Art 10)

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create the monorepo layout per plan.md (apps/api, apps/web, apps/admin, packages/*)
- [ ] T002 Initialize pnpm workspace + TypeScript project references
- [ ] T003 [P] Configure ESLint, Prettier, and the lint rules that enforce Articles 7, 16, and 21

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Prisma schema + migration framework, designed so Phase 9 ordering needs no table changes (Art 11)
- [ ] T005 [P] Zod env schema in apps/api/src/config/env.ts — fail fast at boot, name the variable never its value; update .env.example (Art 8, 29)
- [ ] T006 [P] Response envelope + error-code registry wired to docs/api.md (Art 10)
- [ ] T007 Seeded role→permission map + requirePermission preHandler (Art 14)
- [ ] T008 [P] Security plugins: helmet, CORS allow-list (never `*`), rate limits, argon2, refresh rotation with reuse detection (Art 29)
- [ ] T009 AuditLog writer + soft-delete convention (Art 15)
- [ ] T010 [P] packages/config/tokens.css + self-hosted Zodiak/Plus Jakarta Sans bound on html[lang] (Art 16)
- [ ] T011 [P] i18n scaffolding: en default, ar registered behind a flag, messages/{en,ar}.json, logical CSS properties (Art 21)
- [ ] T012 OpenAPI 3.1 emission + packages/types generation pipeline (Art 8)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (MANDATORY for Article 30 risk areas) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Contract test for [endpoint] in apps/api/tests/integration/[name].test.ts
- [ ] T011 [P] [US1] Permission matrix test (every role × [endpoint], asserting status codes) in apps/api/tests/permissions/[name].test.ts

### Implementation for User Story 1

- [ ] T012 [US1] Add [Entity] to apps/api/prisma/schema.prisma + migration (Art 8, 11)
- [ ] T013 [P] [US1] Zod DTOs in apps/api/src/modules/[name]/[name].schema.ts (Art 7)
- [ ] T014 [P] [US1] Repository in apps/api/src/modules/[name]/[name].repository.ts — Prisma only, no business rules (Art 7)
- [ ] T015 [US1] Service in apps/api/src/modules/[name]/[name].service.ts — no req/reply/status codes (Art 7)
- [ ] T016 [US1] Routes in apps/api/src/modules/[name]/[name].routes.ts with swagger schema + requirePermission (Art 7, 14)
- [ ] T017 [US1] Register error codes for this module in docs/api.md (Art 10)
- [ ] T018 [US1] Wire AuditLog diff on every mutation; soft delete where applicable (Art 15)
- [ ] T019 [US1] Regenerate packages/types from the OpenAPI spec (Art 8)
- [ ] T020 [P] [US1] en (+ ar) strings in messages/{en,ar}.json — no literals in components (Art 12, 21)
- [ ] T021 [US1] UI in apps/[web|admin] consuming the real endpoint, logical CSS properties only, tokens from tokens.css (Art 4, 16, 21)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (MANDATORY for Article 30 risk areas) ⚠️

- [ ] T022 [P] [US2] Contract test for [endpoint] in apps/api/tests/integration/[name].test.ts
- [ ] T023 [P] [US2] i18n test: locale routing works with ar disabled; no hardcoded strings (Art 21, 30)

### Implementation for User Story 2

- [ ] T024 [US2] Schema + migration for [Entity] in apps/api/prisma/schema.prisma
- [ ] T025 [P] [US2] Four-file module for [name] under apps/api/src/modules/[name]/ (Art 7)
- [ ] T026 [US2] Regenerate packages/types; consume the endpoint in apps/[web|admin]
- [ ] T027 [US2] Cross-module reads go through the other module's service, never its repository (Art 7)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (MANDATORY for Article 30 risk areas) ⚠️

- [ ] T028 [P] [US3] Contract test for [endpoint] in apps/api/tests/integration/[name].test.ts
- [ ] T029 [P] [US3] axe clean + reduced-motion snapshot; keyboard-only pass (Art 19, 28, 30)

### Implementation for User Story 3

- [ ] T030 [US3] Schema + migration for [Entity] in apps/api/prisma/schema.prisma
- [ ] T031 [P] [US3] Four-file module for [name] under apps/api/src/modules/[name]/ (Art 7)
- [ ] T032 [US3] Regenerate packages/types; consume the endpoint in apps/[web|admin]

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] docs/api.md error-code registry complete and current (Art 10)
- [ ] TXXX [P] JSON-LD, per-locale metadata, OG images, sitemap/robots, /pasca-menu/ 301 (Art 16)
- [ ] TXXX Lighthouse on the deployed mobile build: ≥95 perf / 100 a11y / 100 SEO; LCP < 2.0s; CLS < 0.05 (Art 28)
- [ ] TXXX Contrast audit — no gold body copy; 320px width; keyboard-only; screen-reader pass (Art 28)
- [ ] TXXX k6 load run on GET /menu and POST /reservations at 200 concurrent (Art 30)
- [ ] TXXX Verify no mock data remains and every UI path hits the real endpoint (Art 4, 31)
- [ ] TXXX [P] Additional unit tests in apps/api/tests/unit/
- [ ] TXXX Definition-of-done gate: pnpm lint && pnpm typecheck && pnpm test && pnpm build green (Art 31)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Article 30 tests MUST be written and MUST FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel (except the booking concurrency test, which must run against a real DB and must not be parallelised with other booking tests)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for [endpoint] in apps/api/tests/integration/[name].test.ts"
Task: "Permission matrix test for [endpoint] in apps/api/tests/permissions/[name].test.ts"

# Launch all models for User Story 1 together:
Task: "Zod DTOs in apps/api/src/modules/[name]/[name].schema.ts"
Task: "Repository in apps/api/src/modules/[name]/[name].repository.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
