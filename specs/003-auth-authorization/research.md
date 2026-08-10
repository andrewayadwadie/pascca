# Research: Auth & Authorization

Phase 0 output. Each decision resolves one open question from Technical Context or from reading
002's actual output (schema.prisma, package.json, src/) rather than the plan template it left
behind — Article 8 means the real files win over what an older doc predicted.

## R1 — This is the first feature to add Fastify plugins or long-lived infra decorators

**Finding**: `apps/api/src/` currently has `app.ts` (Fastify instance, `/health`, empty `/api/v1`
scope), `config/env.ts`, `lib/health.ts` (one-shot Postgres/Redis/S3 reachability probes using
throwaway `pg.Client`/`ioredis` connections, never attached to the app), and `server.ts`. There is
no `plugins/` directory, no `modules/` directory, and no long-lived `PrismaClient` or `Redis`
instance decorating the Fastify app anywhere. Article 6's tree names `plugins/ auth rbac prisma
redis swagger ratelimit errors` and `lib/ jwt hash storage mailer slugify availability` — most of
that doesn't exist yet because nothing needed it before this feature.

**Decision**: This feature stands up the shared infra every module after it will reuse, not just
auth-specific code: a `plugins/prisma.ts` decorator (one `PrismaClient`, `fastify.prisma`,
closed on server shutdown), a `plugins/redis.ts` decorator (one `ioredis` instance,
`fastify.redis`, reused by both rate-limiting and, later, BullMQ), `plugins/cors.ts` and
`plugins/helmet.ts` (Article 29's baseline — nothing has registered them yet either), and
`plugins/errors.ts` (the enveloped-response + registered-error-code machinery, Article 10). This
is infra plumbing the constitution already named for "the phase in front of us" (Article 11) —
the phase in front of us is literally "first real endpoints" — not scope creep into a later
feature's territory.

**Alternatives considered**: Defer prisma/redis/cors/helmet wiring to a separate
"API foundations" feature. Rejected — it would produce a feature with no testable user-facing
behavior of its own (Article 1's "any feature not serving one of the four jobs is out of scope"
reasoning extends to speculative infra-only slices), and every one of those pieces is required to
ship *this* feature's endpoints at all. Building them here, generically, means the next feature
(menu CRUD, say) needs zero new infra.

## R2 — JWT: `fast-jwt` directly, not `@fastify/jwt`; cookies via `@fastify/cookie`

**Decision (revised during implementation — T011)**: `lib/jwt.ts` must be callable from
`auth.service.ts` with no `FastifyRequest`/`FastifyReply` in scope (Article 7: services take no
`req`/`reply`), and its `verifyAccessToken` must be callable from `plugins/auth.ts`'s custom
`authenticate` preHandler without round-tripping through a second abstraction. `@fastify/jwt`'s
value-add over its own dependency, `fast-jwt`, is exactly the `request.jwtVerify()`/
`reply.jwtSign()` decorators — which this feature doesn't use, since `authenticate` extracts the
bearer token and calls `lib/jwt.ts` itself. Depending on `@fastify/jwt` just to get to `fast-jwt`
indirectly would be one dependency doing nothing `fast-jwt` doesn't already do directly. Decision:
`fast-jwt`'s `createSigner`/`createVerifier` directly in `lib/jwt.ts`, framework-agnostic, no
Fastify object required to sign or verify a token. `@fastify/cookie` for reading and setting the
refresh-token cookie, `@fastify/rate-limit` for Article 29's 5/min budget, `@fastify/cors` and
`@fastify/helmet` for the baseline — these four still directly implement rows Article 5's
tech-track table and Article 29 already commit to, without inventing a new abstraction.

**Alternatives considered**: `@fastify/jwt` (original R2, superseded above) — extra indirection
for a Fastify-request-object convenience this feature's service-layer design deliberately doesn't
use. `jsonwebtoken` — `fast-jwt` is the Fastify team's own, actively maintained, and already one
dependency layer closer to what was already being installed. A hand-rolled cookie parser —
`@fastify/cookie` is one dependency and directly supports the `httpOnly`, `sameSite`, `secure`,
`signed` options FR-009 needs; no reason to hand-roll `Set-Cookie` parsing.

## R3 — Access token payload and algorithm

**Decision**: HS256, signed with a new `JWT_ACCESS_SECRET` env var (Zod-validated in `env.ts`,
`min(32)` — Article 29's "no PII in logs" extends naturally to "no weak secrets"). Payload is
deliberately minimal: `{ sub: userId, role, iat, exp }` — no permission list embedded. `role`
alone lets `requirePermission` re-derive the actual grant from the seeded `RolePermission` table
on every request (R7), so a role change or grant edit takes effect on the next request without
waiting for the access token to expire — the same "no stale window" property FR-004 already
requires for `isActive`, extended for free rather than re-specified.

**Alternatives considered**: RS256 (asymmetric) — only pays for itself once a second service
needs to verify tokens without holding the signing secret; today's API is the only verifier, so
it's complexity with no current beneficiary. Embedding permissions in the token — would make a
permission change require every holder to re-login before it took effect, directly contradicting
FR-004's "immediate" spirit and User Story 5's "adding a role is a seed edit, not a redeploy or a
mass logout."

## R4 — Refresh token value and hash algorithm — NOT argon2id

**Finding**: `RefreshToken.tokenHash` already exists (`String @unique`, from 002). What it hashes
was left to this feature.

**Decision**: The refresh token itself is a 32-byte cryptographically random value, base64url
-encoded (via Node's `crypto.randomBytes`), never a JWT — it carries no claims, it's a lookup key.
It is hashed for storage with **SHA-256**, not argon2id. Every refresh (and every reuse-detection
check) does a lookup on `tokenHash`, potentially several times per session per day; argon2id is
*deliberately* slow (that's what makes it correct for passwords, which are low-entropy and
attacker-guessable) and using it here would make every legitimate refresh pay an unnecessary
compute cost against a value that's already 256 bits of random entropy and un-guessable by
construction. Password hashing (FR-002) stays argon2id — this is a different threat model, not an
inconsistency.

**Alternatives considered**: argon2id for both — rejected for the performance reason above, and
because it doesn't add any real security margin against a value with 256 bits of entropy. Storing
the token in plaintext — directly contradicts FR-005 and the existing column name (`tokenHash`,
not `token`).

## R5 — The seeded role→permission map: one table, not two

**Decision**: A single new `RolePermission` model — `id`, `role Role`, `permission String`,
`@@unique([role, permission])` — populated by a new seed module
(`prisma/seed/permissions.ts`) with one row per cell that's `✅` in Article 14's table (including
the `reservation:delete` MODERATOR row and the `own only` CUSTOMER-scoped rows, encoded as the
base permission string — the `≤24h old` / `own only` *qualifiers* are business rules the owning
feature enforces after the base grant passes, not something `requirePermission` itself models).
This is the "seeded map" Article 14 and this feature's FR-012 require: adding a role is inserting
rows in a seed file, never touching a route or the `requirePermission` implementation.

**Alternatives considered**: A separate `Permission` entity (id, description) joined through
`RolePermission` — rejected; a permission is just a string identifier consumed by code
(`requirePermission('menu:write')`), it has no independent attributes worth a row (no
description, no icon, nothing a dashboard would ever list on its own) yet, and 002's own deferred
note already anticipated this exact question ("`Permission`/`RolePermission` tables, if the
role→permission map lives in the database"). Two tables can be introduced later, additively, if a
real need appears (e.g., a future permissions-editing UI wants human descriptions).

## R6 — `requirePermission` reads the seeded grants once at boot, not per request

**Decision**: On boot, `permissions.repository` loads every `RolePermission` row into an in-memory
`Map<Role, Set<string>>` once; `requirePermission(permission)` is a synchronous Set lookup against
the already-resolved caller's role (from the verified JWT, R3) — zero DB round-trips per
permission check. Given this feature explicitly ships no dashboard UI to edit grants (Assumptions
in spec.md), the only way the underlying table changes is a re-seed, which happens with the
process stopped — there is no running-server window where the cache could go stale. The `isActive`
/`deletedAt` re-check (FR-004) is a genuinely separate, deliberately-live DB lookup on the `User`
row — that one *does* need to be real-time, because deactivation is an admin action taken while
the server keeps running, unlike a permission-grant edit.

**Alternatives considered**: Query `RolePermission` per request — correctness-equivalent today
(no live editing exists) but adds a DB round-trip to every single authorized request for no
current benefit; would need revisiting the day a grants-editing UI ships (noted as a follow-up).
Cache in Redis instead of process memory — unnecessary until there's more than one API process
sharing a cache-invalidation problem; today's deploy target is a single API service.

## R7 — Rate limiting: `@fastify/rate-limit` backed by Redis, one shared bucket

**Decision**: Backed by the Redis instance from R1 (`fastify.redis`) via `@fastify/rate-limit`'s
`redis` option, not its default in-memory store — an in-memory store would reset every deploy and
wouldn't be shared if the API ever runs more than one instance; Redis is already a locked
dependency (Article 5) doing nothing else in this feature yet.

**Revised during implementation (T013/T028)**: the plan originally called this "one plugin
registration at the `/api/v1/auth/*` scope," assuming per-route `config.rateLimit` on four
routes sharing a `keyGenerator` would combine into one budget. It doesn't — `@fastify/rate-limit`
creates a separate child store *per route* internally (`store.child({...routeInfo})`) even when
every route's `config.rateLimit` is the literal same object; it's built for "each route gets its
own limit," not "these routes share one." Verified by direct reproduction: hitting one route 6
times correctly returned a 6th `429`, but 5 calls to `/login` + 1 to `/refresh` from the same IP
did **not** — the 6th (on a different route) still succeeded, because it was counted against a
different route-scoped store. Fixed by registering `@fastify/rate-limit` with `global: true`
inside ONE child Fastify scope that all four `/auth/*` routes are registered into
(`plugins/rate-limit.ts`'s `registerAuthRateLimit`, called from within `auth.routes.ts`) — one
plugin instance, one store, genuinely shared counting confirmed by test
(`tests/auth/login-session.test.ts`, "shared rate limit across /auth/*").

A second, independent bug surfaced by the same reproduction: `@fastify/rate-limit` calls `throw
errorResponseBuilder(...)` internally rather than sending a reply directly. Returning a plain
`{success:false, error:{...}}` object (matching every other `errorEnvelope()` call site) meant a
non-`Error` value was thrown, which `plugins/errors.ts`'s handler couldn't distinguish from a
genuine bug — it fell through to the generic 500 branch instead of 429. Fixed by having
`errorResponseBuilder` return an `AppError` instance instead, which the handler's existing
`instanceof AppError` branch already handles correctly.

**Alternatives considered**: In-memory store — simpler, but silently stops enforcing the limit
across a restart or a second instance; a deliberately-weakened security control isn't an
acceptable simplification for the one row Article 29 calls out by name for `/auth/*`.

## R8 — Cookie configuration

**Decision**: Refresh-token cookie: `httpOnly: true`, `sameSite: 'strict'`, `secure: true` in
production (`false` only when `NODE_ENV=development` over plain HTTP), `path: '/api/v1/auth'`
(scopes the cookie so it's never attached to unrelated API calls — smaller CSRF surface than a
site-wide cookie), signed with a new `COOKIE_SECRET` env var. `sameSite: 'strict'` over `'lax'`
because the only place this cookie needs to travel is same-site XHR/fetch from `apps/admin`/
`apps/web` calling their own API — there's no legitimate top-level-navigation case (an email link,
a bookmarked GET) that needs the refresh cookie attached.

**Alternatives considered**: `sameSite: 'lax'` — the more common default, but this cookie is only
ever read by `POST /auth/refresh` and `POST /auth/logout`, both same-site XHR calls; `'strict'`
costs nothing here and is the tighter posture Article 29's "never `*`" spirit favors when a looser
setting has no corresponding use case.

## R9 — OpenAPI generation and `packages/types` codegen: this feature stands the pipeline up

**Finding**: `packages/types` currently has no dependency capable of generating anything — it's an
empty package shell from 001. Article 8 names "API contracts | Zod → TS types → OpenAPI 3.1" and
"Shared types | packages/types, generated" as one source of truth each, and Article 5 names
`@fastify/swagger → OpenAPI 3.1 (source of truth)`. None of that machinery exists yet because no
endpoint has ever needed it.

**Decision**: This feature adds `@fastify/swagger` (Fastify 5 + `fastify-type-provider-zod`
already know how to turn each route's Zod schemas into an OpenAPI 3.1 document — no dual
schema-writing), serves the raw document at `/api/v1/openapi.json`, and adds an `openapi-typescript`
dev-dependency + a `packages/types` build step that fetches that document (from a running dev
server, or a static export written by a small script) and generates `packages/types/src/*`. This
is infrastructure every future endpoint feature reuses — same reasoning as R1.

**Alternatives considered**: Hand-write `packages/types` for just this feature's shapes — directly
forbidden by Article 8 ("Hand-written interfaces duplicating Prisma [or, by the same logic,
Zod/OpenAPI] models are forbidden") and would need to be thrown away the moment a real generator
exists. Defer the whole pipeline to a later "tooling" feature — rejected for the same reason as
R1: Article 31's Definition of Done ("types regenerated") is literally unachievable for *any*
feature until this exists, so deferring it just moves the same unavoidable cost onto whichever
feature ships next, with less context for why.

## R10 — Testing refresh-token-reuse concurrency and the rotation race

**Decision**: The "two requests race to rotate the same token" edge case (spec.md) is proven the
same way 002 proved seat-overlap-adjacent correctness for other features — genuinely concurrent
requests, not mocked timing. Rotation is made atomic at the database level: the UPDATE that marks
a `RefreshToken` row rotated (`revokedAt`, `replacedByTokenHash`) is conditioned on `revokedAt IS
NULL` in the same statement (`UPDATE ... WHERE id = ? AND "revokedAt" IS NULL`), so under two
concurrent transactions exactly one UPDATE affects a row and the other affects zero — the
zero-affected caller is the one treated as reuse. No advisory lock needed here (unlike Article
25's seat-overlap, which has no such single-row atomic marker to race on); a conditional UPDATE's
row-level lock is sufficient and is the simpler mechanism for this specific shape of race.

**Alternatives considered**: Wrap rotation in a `pg_advisory_xact_lock` like Article 25's booking
path — unnecessary ceremony here; that pattern earns its cost when the correctness condition spans
*multiple* rows (seat-overlap sums across a table), not a single row's own state transition, which
Postgres's ordinary row-level locking already serializes correctly via the conditional UPDATE.

## R11 — Test-only example routes for the permission-matrix proof (FR-013's resolution)

**Decision**: For the seven permission-table domains with no real endpoints yet (menu, category,
gallery, branch, content, testimonial/team/post, settings, audit), the permission-matrix test
mounts a small, clearly-labeled set of throwaway routes — e.g. `tests/fixtures/example-protected-routes.ts`,
registered only inside the test's own Fastify instance, never inside `buildApp()` — each one doing
nothing but `preHandler: [requirePermission('menu:write')]` → `200`. This proves the *primitive*
(FR-011/FR-012) is wired correctly for every permission string in Article 14's table without
fabricating permanent, half-built production routes for domains this feature doesn't own. Real
`menu:write` etc. routes, when a future feature adds them, get proven by that feature's own tests
against its own real handler — this test's job is only "does `requirePermission('menu:write')`
correctly gate," which is identical regardless of which handler sits behind it.

**Alternatives considered**: Unit-test `requirePermission` in isolation, no HTTP layer at all —
weaker: it wouldn't prove the preHandler is wired into Fastify's request lifecycle correctly
(header parsing, 401-before-403 ordering, error envelope shape on rejection). Skip proving the
seven domains entirely, test only the two the feature does build (`user:*`, and reservation/
message which existing endpoints don't exist for either) — would leave SC-002's "100% of the
permission table" success criterion unverifiable, which the Q1-adjacent scope clarification
specifically preserved by choosing example routes over building real ones.

## R12 — `docs/api.md` codes this feature registers

Finalizes AR-004's starter list into exact `SCREAMING_SNAKE_CASE` codes and HTTP statuses (added to
the registry in the same PR that throws each one, per Article 10's own rule):

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email/password combination is wrong, or the account doesn't exist — never distinguished for the caller |
| `AUTH_ACCOUNT_INACTIVE` | 401 | Login attempted against a deactivated or soft-deleted account |
| `AUTH_EMAIL_TAKEN` | 409 | Registration attempted with an email already in use |
| `AUTH_TOKEN_EXPIRED` | 401 | Access or refresh token's expiry has passed |
| `AUTH_TOKEN_INVALID` | 401 | Token is malformed, unsigned, or fails verification |
| `AUTH_REFRESH_REUSE_DETECTED` | 401 | An already-rotated refresh token was presented; its family has been revoked |
| `AUTH_RATE_LIMITED` | 429 | The shared 5/min/IP `/auth/*` budget was exceeded |
| `AUTHZ_UNAUTHENTICATED` | 401 | No credential present at all on a protected route |
| `AUTHZ_FORBIDDEN` | 403 | Authenticated, but the caller's role lacks the required permission |
| `USER_SELF_DELETE_FORBIDDEN` | 403 | An ADMIN attempted to delete or deactivate their own account |
| `USER_LAST_ADMIN_PROTECTED` | 403 | Attempted demote/deactivate/delete of the sole remaining active ADMIN |
| `USER_NOT_FOUND` | 404 | Target of a user-management action doesn't exist (or is already soft-deleted) |
| `VALIDATION_FAILED` | 400 | Request body/query/params failed Zod validation (shared across all modules, not auth-specific — registered here since this is the first feature to throw it) |
