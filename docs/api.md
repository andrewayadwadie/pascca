# PASCca API — Error Code Registry

**Article 10 [NN]**: every response is enveloped. Clients switch on `code`, never on `message`.
Codes are permanent once shipped — a thrown error without a registered code here is a bug.

## Response envelope

```jsonc
// success
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 42 } }

// failure
{ "success": false, "error": { "code": "RES_SLOT_UNAVAILABLE", "message": "…", "details": [] } }
```

## Registered codes

| Code | HTTP Status | Meaning | Introduced by |
|---|---|---|---|
| `INTERNAL_ERROR` | 500 | An unhandled exception — by Article 10's own rule, this is always a bug. The client sees no internal detail; the real error is logged server-side. | 003-auth-authorization |
| `NOT_FOUND` | 404 | No route matches the requested method + path. | 003-auth-authorization |
| `VALIDATION_FAILED` | 400 | Request body, query, or params failed Zod validation. Shared across every module, not auth-specific — registered here since this is the first feature to throw it. | 003-auth-authorization |
| `AUTHZ_UNAUTHENTICATED` | 401 | No credential present at all on a route that requires one. | 003-auth-authorization |
| `AUTHZ_FORBIDDEN` | 403 | Authenticated, but the caller's role lacks the required permission. | 003-auth-authorization |
| `AUTH_INVALID_CREDENTIALS` | 401 | Email/password combination is wrong, or the account doesn't exist — never distinguished for the caller. | 003-auth-authorization |
| `AUTH_ACCOUNT_INACTIVE` | 401 | Login attempted against a deactivated or soft-deleted account. | 003-auth-authorization |
| `AUTH_EMAIL_TAKEN` | 409 | Registration attempted with an email already in use. | 003-auth-authorization |
| `AUTH_TOKEN_EXPIRED` | 401 | Access or refresh token's expiry has passed. | 003-auth-authorization |
| `AUTH_TOKEN_INVALID` | 401 | Token is malformed, unsigned, or fails verification. | 003-auth-authorization |
| `AUTH_REFRESH_REUSE_DETECTED` | 401 | An already-rotated refresh token was presented again; its entire session family has been revoked. | 003-auth-authorization |
| `AUTH_RATE_LIMITED` | 429 | The shared 5/min/IP `/auth/*` budget was exceeded. | 003-auth-authorization |
| `USER_SELF_DELETE_FORBIDDEN` | 403 | An ADMIN attempted to delete or deactivate their own account. | 003-auth-authorization |
| `USER_LAST_ADMIN_PROTECTED` | 403 | Attempted demote/deactivate/delete of the sole remaining active ADMIN. | 003-auth-authorization |
| `USER_NOT_FOUND` | 404 | Target of a user-management action doesn't exist (or is already soft-deleted). | 003-auth-authorization |

## Adding a code

1. Pick a permanent, stable `SCREAMING_SNAKE_CASE` name. It ships once and cannot be renamed.
2. Add a row to the table above in the same PR that throws it.
3. Never reuse a retired code for a different meaning.
