# Phase 1 Data Model: Monorepo Scaffold

**Feature**: `001-monorepo-scaffold` | **Date**: 2026-08-10

## No database entities ship in this feature

`apps/api/prisma/schema.prisma` is created with a `datasource` block and a `generator` block and
**zero models**. That is enough for `prisma generate` to produce a client and for the boot-time
connectivity check to run, and nothing more.

This is deliberate, per Article 11 (build the phase in front of you): the first entity feature
adds the first model. Creating `Branch`, `MenuItem`, or `User` now — even "just the obvious ones"
— would be building a later phase early, and would commit the schema before the feature that owns
it has been specified.

Article 11's forward-looking obligation still applies at design-review time: the schema must be
shaped so Phase 9 ordering can be added **without altering existing tables**. With zero tables,
that obligation is trivially satisfied and passes forward untouched to the first entity feature.

The only "model" this feature defines is the **configuration model** below.

---

## Configuration model — the environment contract

Validated by `apps/api/src/config/env.ts` at process start, before the server binds a port. The
parsed result is exported as a frozen, fully typed object; `process.env` is read in exactly this
one file and nowhere else in the codebase (Article 8 — one source of truth).

### Fields

| Variable | Type | Required | Default | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | `'development' \| 'test' \| 'production'` | yes | `development` | Runtime mode |
| `PORT` | integer 1–65535 | yes | `3001` | API listen port |
| `HOST` | string | yes | `0.0.0.0` | API bind address |
| `LOG_LEVEL` | `'fatal'\|'error'\|'warn'\|'info'\|'debug'\|'trace'` | yes | `info` | Logger verbosity |
| `DATABASE_URL` | URL, `postgresql://` scheme | yes | — | PostgreSQL 16 connection |
| `REDIS_URL` | URL, `redis://` scheme | yes | — | Redis 7 connection |
| `S3_ENDPOINT` | URL | yes | — | MinIO locally, Cloudflare R2 in production |
| `S3_REGION` | string | yes | `auto` | R2 uses `auto` |
| `S3_ACCESS_KEY_ID` | non-empty string | yes | — | Object storage credential |
| `S3_SECRET_ACCESS_KEY` | non-empty string | yes | — | Object storage credential |
| `S3_BUCKET` | non-empty string | yes | — | Bucket name |
| `CORS_ORIGINS` | comma-separated origin list, **non-empty** | yes | — | Allow-list. `*` is rejected by the schema (Article 29) |

### Validation rules

- **Every declared variable is validated.** The schema picks its 12 declared keys out of
  `process.env` (which also carries ambient OS variables — `PATH`, `HOME`/`USERPROFILE`, CI
  runner variables, etc.) and validates only those. It does **not** reject `process.env` for
  containing keys outside the schema — that would make the API unable to start in any real
  environment. What it does reject is a **declared** key with a missing or malformed value.
- `CORS_ORIGINS` **rejects `*`** at the schema level. Article 29 forbids a wildcard allow-list, and
  a schema constraint enforces it in a way a code review can't forget to.
- Defaults exist only where a wrong-but-plausible value is harmless (`PORT`, `LOG_LEVEL`). Nothing
  that points at infrastructure or carries a credential has a default — a missing `DATABASE_URL`
  must fail, never silently resolve to localhost.

### Failure behaviour

On any validation failure the process prints one line per problem in the form
`<VARIABLE_NAME>: <constraint that failed>`, then exits non-zero **before** `listen()`.

The message **never prints a variable's value** — only its name and what was wrong. This keeps
credentials out of terminal scrollback, CI logs, and screen shares (clarification 2026-08-10,
research R5). All failures are reported at once, not one per restart.

### Deliberately absent

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and any mail-provider or Sentry credential are **not**
in this schema. They belong to the features that introduce them (auth, notifications,
observability). Adding them now would put unused secrets in `.env.example` and invite someone to
generate throwaway values that then reach production.

---

## Derived artifact: `.env.example`

Every key above appears in the committed `.env.example` with a placeholder value — never a real
credential. The two key sets are asserted equal by a test (research R7), so drift in either
direction fails `pnpm test` naming the specific keys rather than surfacing as a confusing runtime
failure weeks later.

---

## State transitions

The API has exactly one startup path, and it has no retry edges:

```text
process start
   → parse env against schema
       ✗ → print offending variable name(s), exit 1
   → check Postgres, Redis, object storage — CONCURRENTLY, all three
       any ✗ → print every unreachable service by name (not just the first), exit 1
   → listen(HOST, PORT)                  ← first moment a request can be accepted
```

**Corrected during implementation (2026-08-10)**: the infrastructure checks run concurrently and
report every unreachable service, not sequentially with a stop at the first failure as an earlier
draft of this section showed. This mirrors env validation's own "report all problems at once, not
one per restart" behaviour (FR-007) — a developer with both Postgres and Redis down learns that
in one run, not one restart per service. FR-014's fail-fast/no-retry requirement is unaffected:
each service is still checked exactly once, with no backoff.

Each check runs **once**. No backoff, no retry loop (clarification 2026-08-10, research R6). The
ordering matters: configuration is validated before any network call, so a typo in `DATABASE_URL`
is reported as a validation error rather than as a connection timeout.
