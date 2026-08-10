# Contract: Workspace Task Interface

**Feature**: `001-monorepo-scaffold` | **Consumers**: every current and future workspace member,
Turborepo, GitHub Actions

Every member of the workspace implements the same five scripts. This is what lets `turbo run
<task>` fan out across the repo, and what lets CI gate on four commands regardless of how many
packages exist later.

## The five tasks

| Script | Every member MUST | Turbo `dependsOn` | Cached |
|---|---|---|---|
| `dev` | start in watch mode, or be a no-op if not runnable | — | no (`persistent: true`) |
| `build` | produce its build output, or be a no-op | `^build` | yes |
| `lint` | run ESLint over its own source | — | yes |
| `typecheck` | run `tsc --noEmit` under the shared strict base | `^build` | yes |
| `test` | run Vitest, with **at least one executing test** | `^build` | yes |

A member that genuinely has nothing to do for a task still declares it as a no-op. A *missing*
script and a *deliberately empty* one look identical in a log otherwise, and the difference
matters when a task silently stops covering a package.

## Why `^build` on `typecheck` and `test`

`packages/types` and `packages/api-client` will carry generated content (Article 8). A consumer
typechecking against them before they are built would check against stale or absent declarations
and pass incorrectly. The dependency makes that ordering structural rather than a thing developers
must remember.

## The one-executing-test rule

`test` passing over zero test files proves nothing — a wrong include glob or a missing dependency
produces the same green check as a healthy suite. Every member therefore carries at least one test
that actually runs an assertion (clarification 2026-08-10, research R11). The rule holds
permanently, not just at scaffold time: a package whose tests all get deleted should go red, not
green.

## Root commands

```bash
pnpm dev         # turbo run dev        — all three apps, one command (FR-005)
pnpm lint        # turbo run lint
pnpm typecheck   # turbo run typecheck
pnpm test        # turbo run test
pnpm build       # turbo run build
```

These four (`lint`, `typecheck`, `test`, `build`) are exactly what CI runs and exactly what
Article 31's definition of done requires to be green. One set of commands, same behaviour locally
and in CI — a developer can reproduce any CI failure without reading the workflow file.

## Fixed ports

| App | Port | Rationale |
|---|---|---|
| `apps/web` | 3000 | Next.js default |
| `apps/api` | 3001 | adjacent, no collision |
| `apps/admin` | 5173 | Vite default |

Fixed rather than auto-assigned, so "reachable on its own port" is a checkable acceptance
condition and so `CORS_ORIGINS` has stable local values.

## Adding a workspace member

A new package must: match the `pnpm-workspace.yaml` globs, extend the shared tsconfig and ESLint
bases from `packages/config` (FR-003 — never define a rule set from scratch), declare all five
scripts, and carry at least one executing test. No `turbo.json` change is needed — task
definitions are global and the new member is picked up automatically.
