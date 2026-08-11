<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/004-web-design-system-port/plan.md`
<!-- SPECKIT END -->

# PASCca

Bilingual (Arabic-first) website, admin dashboard, and Phase 8 Flutter app for PASCca — an
Italian restaurant with two Cairo branches. No application code yet; the stack below is
mandated by the constitution, not chosen per feature.

**`.specify/memory/constitution.md` v2.0.0 governs this repo and wins over anything here.**
If the two disagree, this file is the bug. Read the constitution before planning or
implementing. Do not amend it during an implement run — if an article blocks you, stop and
report (Article 34).

## Non-negotiables to hold in your head

Articles marked `[NN]` need client sign-off to change. The ones that get violated by accident:

- **Scope (Art 1)** — ordering, payments, loyalty, delivery are Phase 9. Not built, not
  scaffolded, not stubbed.
- **Brand positioning (Art 2)** — prices always visible, voice is warm/plain/funny, never
  imply expensive.
- **Content is DB-backed (Art 3)** — a hardcoded price, phone number, or hero string is a defect.
  Only UI labels are hardcoded, and they live in `messages/{en,ar}.json`.
- **API-first (Art 4)** — no server action touches Prisma. If the Flutter app couldn't do it
  with zero backend changes, it isn't done.
- **Four-file modules (Art 7)** — `routes` / `service` / `repository` / `schema`. No Prisma in a
  route, no `reply.code()` in a service, no business `if` in a repository. Cross-module reads go
  through the other module's *service*.
- **3-tier content (Art 12)** — Tier 1 Entities (full CRUD), Tier 2 PageBlocks (dashboard copy),
  Tier 3 UI chrome (i18n only). Mixing them destroys design.
- **Permissions are data (Art 14)** — `requirePermission('menu:write')`, never
  `if (user.role === 'ADMIN')`. Unauthorised UI is not rendered, not disabled.
- **English first, Arabic-ready (Art 21)** — routes `/[locale]/…` with `en` default, `ar`
  disabled by flag; logical CSS properties only. `margin-left` in layout is violation.
- **Tokens are locked (Art 16)** — no raw hex, no one-off font stacks. Gold (#D4AF37) is the
  only accent and never body copy. Dark surfaces (#0A0A0A, #141414). Self-hosted fonts only.
- **Errors are contracts (Art 10)** — enveloped responses, permanent codes registered in
  `docs/api.md`. Clients switch on `code`, never `message`.
- **Booking (Art 25)** — seat-overlap availability inside one transaction under
  `pg_advisory_xact_lock`. Concurrency test must fire real concurrent requests. Party ≤6 auto-confirmed.
- **Audit + soft delete (Art 15)** — every mutation writes an `AuditLog` diff. `staffNotes` and
  audit data never leave via public or customer endpoints. 30-day soft-delete window.

## Stack

Fixed by Article 5. Substitutions require a constitution amendment.

- **Runtime** Node.js 22 LTS, TypeScript strict.
- **API** `apps/api` — Fastify 5 + fastify-type-provider-zod + Prisma 6 + PostgreSQL 16.
  All endpoints under `/api/v1`, frozen once mobile ships (Art 9). OpenAPI 3.1 from Zod.
- **Website** `apps/web` — Next.js 15 App Router, `/[locale]/…` with `en` default (Art 21),
  `ar` registered but disabled by flag. next-intl, ISR `revalidate: 60` + dashboard-save webhook.
- **Dashboard** `apps/admin` — Vite + React 19 SPA, pure API client, English-first RTL.
- **Shared** `packages/types` (generated from OpenAPI — never hand-written),
  `packages/config/tokens.css` (Art 16: dark surfaces, gold accent only).
- **Storage/Media** Cloudflare R2 presigned uploads, sharp → WebP/AVIF (3 sizes).
- **Cache/Locks/Queues** Redis 7, BullMQ.
- **Auth** JWT access 15m, rotating refresh 30d, reuse detection (Art 29).
- **Tests** Vitest, Playwright (RTL snapshots), k6 (load testing).
- **Mobile** `mobile/` — Flutter, Clean Architecture, Phase 8. Inherits Parts I–III and VII.

## Workflow

Spec Kit drives features. Run in order:

1. `/speckit-constitution` — amend project principles (needs sign-off for `[NN]`, Art 34)
2. `/speckit-specify` — spec for a feature (creates `specs/NNN-slug/`, new git branch)
3. `/speckit-clarify` — optional, de-risk ambiguity before planning
4. `/speckit-plan` — implementation plan; fills Constitution Check gate table (Art 1–33)
5. `/speckit-tasks` — actionable task list
6. `/speckit-analyze` / `/speckit-checklist` — consistency + quality gates
7. `/speckit-implement` — execute

Compliance is checked at three points: `/speckit-plan` (Art 34), `/speckit-analyze`, and PR review.

## Definition of done (Art 31)

Endpoint exists and is in the OpenAPI spec · types regenerated · UI consumes the real endpoint
with no mock data left · both locales render correctly in both directions · Article 30 tests
for that area pass · audit log fires where Article 15 requires ·
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
- Migrations never run automatically on deploy (Art 32).

## Pending, required by the constitution

- `docs/api.md` — error-code registry (Art 10). Create with the first API feature.
- `.env.example` — must exist and stay current (Art 13 in v1 implied; validate at boot).
- `packages/config/tokens.css` — the constitution's Article 16 block is normative until this
  file exists. Dark surfaces + gold accent, self-hosted fonts.
- Privacy policy, live before the site goes public (Art 29). State retention period.
