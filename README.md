# PASCca

Bilingual public website, admin dashboard, and (Phase 8) Flutter app for **PASCca**, an Italian
restaurant with two Cairo branches. One backend, API-first — see
`.specify/memory/constitution.md` for the rules everything here is built against.

## Requirements

- **Node.js 22 LTS** — enforced (not just suggested): a mismatched runtime fails `pnpm install`
  outright. Check `.nvmrc`. If you don't have a version manager, see the "No version manager
  available?" note in `specs/001-monorepo-scaffold/quickstart.md` for a no-install workaround.
- pnpm (version resolved automatically from `packageManager` in `package.json`)
- A container runtime, for local Postgres/Redis/MinIO

## Getting started

Full walkthrough, including how to verify each piece actually works, lives in
[`specs/001-monorepo-scaffold/quickstart.md`](specs/001-monorepo-scaffold/quickstart.md) (repo
setup) and [`specs/002-content-schema-seed/quickstart.md`](specs/002-content-schema-seed/quickstart.md)
(database schema + seed data). Short version:

```bash
pnpm install
cp .env.example .env   # fill in real local values
docker compose up -d   # postgres · redis · minio
pnpm db:migrate         # apply the schema
pnpm db:seed            # fill it with a working Pascca
pnpm dev                # api :3001 · web :3000 · admin :5173
```

## Layout

```
apps/api      Fastify — the only thing that talks to the database
apps/web      Next.js — public site
apps/admin    Vite SPA — admin dashboard, pure API client
packages/     shared config (design tokens, tsconfig, eslint), generated types, API client
docs/api.md   permanent error-code registry
specs/        Spec Kit feature specs, plans, and tasks
```

## Working on this repo

This project is built feature-by-feature through Spec Kit (`/speckit-specify` →
`/speckit-plan` → `/speckit-tasks` → `/speckit-implement`). See `CLAUDE.md` for the workflow
and the constitution's non-negotiables.
