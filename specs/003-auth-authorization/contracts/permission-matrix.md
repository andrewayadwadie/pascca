# Contract: Permission Matrix

Every permission string in the constitution's Article 14 table, crossed with every role plus the
unauthenticated case. This table **is** the assertion list for the mandatory Article 30
"Permissions | every role × every admin endpoint" test (SC-002: 100% coverage). `route` names
which endpoint proves the row — either a real one this feature ships (`user:*`) or a
`tests/fixtures/example-protected-routes.ts` stand-in (everything else — see `research.md` R11 and
`auth-endpoints.md`'s fixture-routes note).

Legend: **200** = permitted (fixture routes return `200`/`204`; real routes return the code in
`auth-endpoints.md`) · **403** `AUTHZ_FORBIDDEN` · **401** `AUTHZ_UNAUTHENTICATED` (no credential
at all — same for every row, listed once).

| Permission | Route (proof) | ADMIN | MODERATOR | CUSTOMER |
|---|---|---|---|---|
| `reservation:read` | fixture | 200 | 200 | 200 (own-scoping is the reservations feature's job, not this gate's) |
| `reservation:create` | fixture | 200 | 200 | 200 |
| `reservation:update` | fixture | 200 | 200 | 200 |
| `reservation:delete` | fixture | 200 | 200 (`≤24h old` is enforced by the reservations feature, not this gate) | 403 |
| `message:read` | fixture | 200 | 200 | 403 |
| `message:update` | fixture | 200 | 200 | 403 |
| `menu:write` | fixture | 200 | 403 | 403 |
| `category:write` | fixture | 200 | 403 | 403 |
| `gallery:write` | fixture | 200 | 403 | 403 |
| `branch:write` | fixture | 200 | 403 | 403 |
| `content:write` | fixture | 200 | 403 | 403 |
| `testimonial:write` | fixture | 200 | 403 | 403 |
| `team:write` | fixture | 200 | 403 | 403 |
| `post:write` | fixture | 200 | 403 | 403 |
| `user:read` | `GET /users` (real) | 200 | 403 | 403 |
| `user:write` | `PATCH/DELETE /users/:id*` (real) | 200 | 403 | 403 |
| `settings:write` | fixture | 200 | 403 | 403 |
| `audit:read` | `GET /permissions` (real) | 200 | 403 | 403 |

**Unauthenticated** (no token at all): every one of the 18 rows above returns **401**
`AUTHZ_UNAUTHENTICATED` for every role column — not 403. Tested once generically (any permission,
no credential → 401) plus spot-checked on at least one fixture and one real route, per US2 AS4.

**Row count**: 18 permissions × 3 roles = 54 authenticated assertions + 1 generic unauthenticated
assertion = the automated test's minimum assertion count for SC-002.

## Self-protection invariants (FR-014/FR-015) — not permission rows, tested separately

These hold regardless of the `user:write` grant above — an ADMIN passes the permission check and
is *still* rejected, so they need their own assertions layered on top of the `user:write` ADMIN
row, not folded into it:

| Scenario | Actor | Target | Expected |
|---|---|---|---|
| Self-delete | ADMIN | self | 403 `USER_SELF_DELETE_FORBIDDEN` |
| Self-deactivate | ADMIN | self | 403 `USER_SELF_DELETE_FORBIDDEN` |
| Demote sole active ADMIN | ADMIN (different account) | sole active ADMIN | 403 `USER_LAST_ADMIN_PROTECTED` |
| Deactivate sole active ADMIN | ADMIN (different account) | sole active ADMIN | 403 `USER_LAST_ADMIN_PROTECTED` |
| Delete sole active ADMIN | ADMIN (different account) | sole active ADMIN | 403 `USER_LAST_ADMIN_PROTECTED` |
| Demote/deactivate/delete when ≥2 active ADMINs exist | ADMIN | another ADMIN | 200 — the invariant only bites at exactly one remaining |

**Reachability note (found during implementation, T048):** because only `ADMIN` holds
`user:write`, an HTTP caller acting on someone else is always themselves an active admin — which
means the target they're acting on is never actually "sole" from that caller's point of view (the
caller is the ≥1 other active admin). The only HTTP-reachable path to a sole admin being targeted
at all is self-targeting, which FR-014's check answers first. `assertNotLastActiveAdmin` is real,
correctly-enforced defense-in-depth (verified with direct service-layer tests using a
different actor id) rather than something a same-process HTTP test can reach via a genuinely
different, currently-authenticated actor.
