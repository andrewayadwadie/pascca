<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

# PASCca

Bilingual (Arabic-first) website, admin dashboard, and Phase 8 Flutter app for PASCca — an
Italian restaurant with two Cairo branches. No application code yet; the stack below is
mandated by the constitution, not chosen per feature.

**`.specify/memory/constitution.md` v1.0.0 governs this repo and wins over anything here.**
If the two disagree, this file is the bug. Read the constitution before planning or
implementing. Do not amend it during an implement run — if an article blocks you, stop and
report (Article 30).

## Non-negotiables to hold in your head

Articles marked `[NN]` need client sign-off to change. The ones that get violated by accident:

- **API-first (Art 4)** — no server action touches Prisma. If the Flutter app couldn't do it
  with zero backend changes, it isn't done.
- **Four-file modules (Art 6)** — `routes` / `service` / `repository` / `schema`. No Prisma in a
  route, no `reply.code()` in a service, no business `if` in a repository. Cross-module reads go
  through the other module's *service*.
- **Permissions are data (Art 10)** — `requirePermission('menu:write')`, never
  `if (user.role === 'ADMIN')`. Unauthorised UI is not rendered, not disabled.
- **Content is DB-backed (Art 3)** — a hardcoded price, phone number, or hero string is a defect.
  Only UI labels are hardcoded, and they live in `messages/{ar,en}.json`.
- **Arabic + RTL are the default (Art 14)** — logical CSS properties only. `margin-left` in a
  layout context is a violation.
- **Tokens are locked (Art 17)** — no raw hex, no one-off font stacks. Gold is the only accent
  and never body copy. Cairo and Almarai are prohibited.
- **Errors are contracts (Art 9)** — enveloped responses, permanent codes registered in
  `docs/api.md`. Clients switch on `code`, never `message`.
- **Booking (Art 11)** — seat-overlap availability inside one transaction under
  `pg_advisory_xact_lock`. The concurrency test must fire real concurrent requests.
- **Audit + soft delete (Art 12)** — every mutation writes an `AuditLog` diff. `staffNotes` and
  audit data never leave via public or customer endpoints.
- **Scope (Art 1)** — ordering, payments, loyalty, delivery are Phase 9. Not built, not
  scaffolded, not stubbed.

## Stack

- **API** `apps/api` — Fastify + Zod + Prisma + PostgreSQL. All endpoints under `/api/v1`,
  frozen once mobile ships (Art 7). OpenAPI 3.1 generated from Zod.
- **Website** `apps/web` — Next.js App Router, `/[locale]/…` with `ar` default, next-intl, ISR
  `revalidate: 60` + dashboard-save webhook.
- **Dashboard** `apps/admin` — Vite + React SPA, pure API client, Arabic-first RTL.
- **Shared** `packages/types` (generated from OpenAPI — never hand-written),
  `packages/config/tokens.css`.
- **Images/backups** Cloudflare R2. **Tests** Vitest, Playwright, k6.
- **Mobile** `mobile/` — Flutter, Phase 8. Inherits constitution Parts I–III and VII.

## Workflow

Spec Kit drives features. Run in order:

1. `/speckit-constitution` — amend project principles (needs sign-off for `[NN]`)
2. `/speckit-specify` — spec for a feature (creates `specs/NNN-slug/`, new git branch)
3. `/speckit-clarify` — optional, de-risk ambiguity before planning
4. `/speckit-plan` — implementation plan; fills the 29-row Constitution Check gate table
5. `/speckit-tasks` — actionable task list
6. `/speckit-analyze` / `/speckit-checklist` — consistency + quality gates
7. `/speckit-implement` — execute

Compliance is checked at three points: `/speckit-plan`, `/speckit-analyze`, and PR review.

## Definition of done (Art 27)

Endpoint exists and is in the OpenAPI spec · types regenerated · UI consumes the real endpoint
with no mock data left · both locales render correctly in both directions · Article 26 tests for
that area pass · audit log fires where Article 12 requires ·
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Layout

- `.specify/` — Spec Kit templates, PowerShell scripts, memory, git extension.
- `.specify/memory/constitution.md` — the governing document.
- `.claude/skills/speckit-*/` — the slash commands above.
- `specs/` — per-feature specs, plans, tasks (created on first `/speckit-specify`).

## Conventions

- Scripts are PowerShell (`--script ps`). Shell is Windows PowerShell 5.1 — no `&&`, no `??`,
  no ternary. Spec-kit `.ps1` files carry a UTF-8 BOM so 5.1 parses their non-ASCII output;
  keep it when editing them.
- Branch numbering: sequential (`001-`, `002-`, …).
- `.claude/settings.local.json` is gitignored; put shared config in `.claude/settings.json`.
- Migrations never run automatically on deploy (Art 28).

## Pending, required by the constitution

- `docs/api.md` — error-code registry (Art 9). Create with the first API feature.
- `.env.example` — must exist and stay current (Art 13).
- `packages/config/tokens.css` — the constitution's Article 17 block is normative until this
  file exists.
- Privacy policy, live before the site goes public (Art 25).
