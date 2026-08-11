# Quickstart: Auth & Authorization

Assumes 002-content-schema-seed's quickstart already got you a running, migrated, seeded
database (`pnpm db:migrate && pnpm db:seed`) — this feature adds one migration
(`RolePermission`) and one seed module on top of that, nothing more.

## Apply this feature's migration and re-seed

```powershell
pnpm db:migrate   # applies the new RolePermission migration
pnpm db:seed      # re-runs all seed modules, including the new permissions.ts (idempotent)
```

## Start the API

```powershell
pnpm --filter @pascca/api dev
```

## Exercise the flow (mobile-style bearer, simplest to curl)

```powershell
# Login as the seeded MODERATOR (apps/api/prisma/seed/users.ts)
curl -s -X POST http://localhost:3001/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"moderator@pascca.local","password":"pascca-dev-only-not-a-real-credential"}'
# → { "success": true, "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }

# GET /me with the access token
curl -s http://localhost:3001/api/v1/me -H "Authorization: Bearer <accessToken>"

# Refresh (rotates the token — the old refreshToken stops working after this)
curl -s -X POST http://localhost:3001/api/v1/auth/refresh `
  -H "Content-Type: application/json" -d '{"refreshToken":"<refreshToken>"}'

# Replay the OLD refreshToken now → AUTH_REFRESH_REUSE_DETECTED, and the token from the
# refresh above stops working too (family revoked)
curl -s -X POST http://localhost:3001/api/v1/auth/refresh `
  -H "Content-Type: application/json" -d '{"refreshToken":"<the ORIGINAL refreshToken>"}'
```

## Prove the permission boundary

```powershell
# MODERATOR hitting a menu:write-gated route → 403 AUTHZ_FORBIDDEN
curl -s -X POST http://localhost:3001/api/v1/_test/menu-write `
  -H "Authorization: Bearer <moderator accessToken>"

# Same route, ADMIN token → 200
```

(`/_test/*` fixture routes only exist when `NODE_ENV=test` — see `research.md` R11. They are not
reachable in a `development`/`production` boot.)

## Run this feature's mandatory tests

```powershell
pnpm --filter @pascca/api test -- permission-matrix
pnpm --filter @pascca/api test -- refresh-reuse
pnpm --filter @pascca/api test -- auth              # everything under tests/auth/, tests/permissions/
```

## Full Definition of Done gate (Article 31)

```powershell
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
