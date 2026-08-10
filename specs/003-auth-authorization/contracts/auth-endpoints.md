# Contract: Auth & User-Management Endpoints

All under `/api/v1`. Every response uses the Article 10 envelope
(`{success, data, meta}` / `{success:false, error:{code,message,details}}`); the Zod schema on
each route is this contract's actual source of truth (Article 8) once implemented — this table is
the plan-time agreement it's built from, generated into `docs/api.md` + OpenAPI at
implementation time, not a second hand-maintained copy.

## Public (no auth required)

| Method | Path | Body | Success | Failure codes |
|---|---|---|---|---|
| POST | `/auth/register` | `{ email, password, name, phone? }` | 201, `{ user, accessToken }` (+ refresh cookie, web) or `{ user, accessToken, refreshToken }` (mobile — see client-detection note below) | `AUTH_EMAIL_TAKEN` (409), `VALIDATION_FAILED` (400), `AUTH_RATE_LIMITED` (429) |
| POST | `/auth/login` | `{ email, password }` | 200, same shape as register | `AUTH_INVALID_CREDENTIALS` (401), `AUTH_ACCOUNT_INACTIVE` (401), `VALIDATION_FAILED` (400), `AUTH_RATE_LIMITED` (429) |
| POST | `/auth/refresh` | web: none (refresh token from cookie) · mobile: `{ refreshToken }` | 200, `{ accessToken }` (+ rotated refresh cookie, web) or `{ accessToken, refreshToken }` (mobile) | `AUTH_TOKEN_EXPIRED` (401), `AUTH_TOKEN_INVALID` (401), `AUTH_REFRESH_REUSE_DETECTED` (401), `AUTH_RATE_LIMITED` (429) |

## Authenticated (bearer access token required)

| Method | Path | Body | Success | Failure codes |
|---|---|---|---|---|
| POST | `/auth/logout` | web: none · mobile: `{ refreshToken }` | 204 | `AUTHZ_UNAUTHENTICATED` (401), `AUTH_RATE_LIMITED` (429) |
| GET | `/me` | — | 200, `{ id, email, name, phone, role, isActive, lastLoginAt, createdAt }` (never `passwordHash`) | `AUTHZ_UNAUTHENTICATED` (401) |
| PATCH | `/me` | `{ name?, phone?, email?, password?, currentPassword? }` (`currentPassword` required iff `password` present) | 200, same shape as `GET /me` | `AUTHZ_UNAUTHENTICATED` (401), `AUTH_INVALID_CREDENTIALS` (401 — wrong `currentPassword`), `AUTH_EMAIL_TAKEN` (409), `VALIDATION_FAILED` (400) |

## Authenticated + permission-gated (minimal user-management set, FR-013)

| Method | Path | Permission | Body | Success | Failure codes |
|---|---|---|---|---|---|
| GET | `/users` | `user:read` | query: `page?, limit?, role?, isActive?` | 200, `{ items: [...], meta: {page,limit,total} }` | `AUTHZ_UNAUTHENTICATED` (401), `AUTHZ_FORBIDDEN` (403) |
| PATCH | `/users/:id/role` | `user:write` | `{ role }` | 200, updated user | `AUTHZ_*`, `USER_NOT_FOUND` (404), `USER_LAST_ADMIN_PROTECTED` (403 — demoting the sole active ADMIN) |
| PATCH | `/users/:id/active` | `user:write` | `{ isActive }` | 200, updated user | `AUTHZ_*`, `USER_NOT_FOUND` (404), `USER_SELF_DELETE_FORBIDDEN` (403 — deactivating self), `USER_LAST_ADMIN_PROTECTED` (403) |
| DELETE | `/users/:id` | `user:write` | — | 204 | `AUTHZ_*`, `USER_NOT_FOUND` (404), `USER_SELF_DELETE_FORBIDDEN` (403), `USER_LAST_ADMIN_PROTECTED` (403) |
| GET | `/permissions` | `audit:read` | — | 200, `{ [role]: string[] }` — the full seeded `RolePermission` map, grouped by role | `AUTHZ_UNAUTHENTICATED` (401), `AUTHZ_FORBIDDEN` (403) |

`GET /permissions` exists so the `permissions` module has a real route (Art 7 four-file rule, not
a routes-less exception) and doubles as the operator-visible mirror of `permission-matrix.md` —
useful groundwork for a future permissions-editing UI without building one now.

`user:read`/`user:write` are the two permission strings this contract needs; Article 14's table
names the row as `user:*` — seeded as both explicit strings rather than a wildcard so
`requirePermission` never has to special-case a glob (R5/R6).

## Client-detection note (FR-009/FR-010)

Web vs. mobile branching (cookie-only vs. body-returned refresh token) is decided by a request
header the two clients already send for other reasons — not a new client-declared flag a caller
could spoof to grab a cookie-exempt token. Exact header TBD at implementation time
(`packages/api-client`, used only by `apps/web`, is the natural place to guarantee the header is
always present for web traffic); recorded here so tasks.md has a concrete decision point, not left
implicit in route code.

## Test-only fixture routes (R11, not part of this contract's shipped surface)

`tests/fixtures/example-protected-routes.ts` mounts one throwaway `GET`/`POST` per permission
string in `contracts/permission-matrix.md` that has no real endpoint yet — every domain except
`user:*`: reservation, message, menu, category, gallery, branch, content, testimonial, team, post,
settings, audit. These are never registered in `buildApp()` and never appear in the real OpenAPI
document — they exist solely so the permission-matrix test (Article 30) can assert
`requirePermission` against every permission string the constitution names, not only the ones this
feature happens to also own a real route for.
