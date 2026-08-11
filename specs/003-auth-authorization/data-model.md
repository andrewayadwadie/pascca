# Data Model: Auth & Authorization

One new model. Everything else this feature needs (`User`, `RefreshToken`, `AuditLog`) already
exists in `schema.prisma` from 002-content-schema-seed — Article 8 makes that file authoritative,
so this document only adds what's missing and states, for the existing models, exactly which
already-present fields this feature is the first to actually read or write.

## New: `RolePermission`

The seeded role→permission map Article 14 and FR-012 require. One row per granted
`(role, permission)` pair.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `role` | `Role` | the existing enum (`ADMIN`, `MODERATOR`, `CUSTOMER`) — no new enum values added |
| `permission` | `String` | a permission code, e.g. `"menu:write"`, `"user:read"` — free-form string, not its own enum, so adding a new permission string is a seed edit, never a migration |
| `createdAt` | `DateTime @default(now())` | append-only — no `updatedAt`, no `deletedAt`; a grant is removed by deleting the row (seed re-run), not by soft-delete, since it carries no history worth preserving |

```prisma
model RolePermission {
  id         String   @id @default(cuid())
  role       Role
  permission String
  createdAt  DateTime @default(now())

  @@unique([role, permission])
  @@index([role])
}
```

**Why one table, not `Permission` + join** — see `research.md` R5. A permission has no
attributes worth its own row today (no description, no icon); it's a string a route decorates
itself with (`requirePermission('menu:write')`) and this table either does or doesn't contain the
caller's `(role, permission)` pair.

**Seeded rows** — one per `✅` cell in Article 14's table, `MODERATOR`'s `reservation:delete`
included (the `≤24h old` qualifier is business logic the reservations feature checks *after* this
grant passes — not modeled as a separate permission string), `CUSTOMER`'s `reservation:*`
`own only` rows included as base grants (the "own only" scoping is likewise the reservations
feature's job at the repository-query level, not this table's). Full enumeration lives in
`contracts/permission-matrix.md`.

## Existing: `User` (002-content-schema-seed) — load-bearing fields for this feature

| Field | Type | This feature's role |
|---|---|---|
| `email` | `String @unique` | login identifier; registration's uniqueness check (FR-001, US4 AS2) |
| `passwordHash` | `String` | argon2id output (FR-002); never selected into any response DTO |
| `role` | `Role @default(CUSTOMER)` | drives `requirePermission` (R3, R6); registration always leaves this at the default — nothing in this feature sets it to `ADMIN`/`MODERATOR` |
| `isActive` | `Boolean @default(true)` | re-checked on every authenticated request, not just login (FR-004); the last-active-ADMIN invariant (FR-015) reads and guards this |
| `lastLoginAt` | `DateTime?` | set on every successful login (US1 AS1) |
| `deletedAt` | `DateTime?` | soft-delete marker this feature's user-delete action (FR-013) sets; also re-checked per FR-004 |

No column changes. No new indexes needed beyond the existing `@unique` on `email`.

## Existing: `RefreshToken` (002-content-schema-seed) — state machine this feature implements

Was seeded empty (FR-014 of 002) with the exact shape reuse detection needs; this feature is the
first to give it real transitions.

```
                 issue (login/register)
                        │
                        ▼
                 ┌─────────────┐
        ┌───────▶│   ACTIVE    │  revokedAt = null, replacedByTokenHash = null
        │        └─────────────┘
        │               │
        │      ┌────────┼─────────────────┐
        │      │        │                 │
        │  refresh   logout          reuse detected
        │      │        │            (this OR any sibling
        │      │        │             in the same familyId)
        │      ▼        ▼                 ▼
        │ ┌──────────┐ ┌──────────┐  ┌──────────────────┐
        │ │ ROTATED  │ │ REVOKED  │  │ REVOKED (family)  │
        │ └────┬─────┘ └──────────┘  └───────────────────┘
        │      │  revokedAt = now(), replacedByTokenHash = <new token's hash>
        │      │
        └──────┘ new ACTIVE row issued, same familyId
```

| Field | Type | Role in the state machine |
|---|---|---|
| `tokenHash` | `String @unique` | SHA-256 of the opaque token value (R4) — the lookup key on every refresh/logout call |
| `familyId` | `String` | shared by every token descended from one login; reuse detection revokes every `RefreshToken` row sharing this value |
| `expiresAt` | `DateTime` | 30 days from issuance; expiry alone (no prior rotation) is *not* reuse — R10, edge case |
| `revokedAt` | `DateTime?` | set on rotation, logout, reuse-triggered family revocation, or password-change session revocation (FR-017) |
| `replacedByTokenHash` | `String?` | set only on rotation; a row with `revokedAt` set but this `null` was revoked directly (logout / reuse / password change), not rotated — reuse detection's "already rotated" check is precisely `revokedAt IS NOT NULL AND replacedByTokenHash IS NOT NULL` |
| `userAgent`, `ip` | `String?` | captured at issuance for the operator-reviewable reuse-detection record (US3 AS3); never surfaced to any non-admin endpoint |

No column changes.

## Existing: `AuditLog` (002-content-schema-seed)

This feature is the first to write to it. One entry per `User` create (registration and
admin-created — though this feature only ever creates via registration), update (profile edits,
role/active-status changes), and delete (soft-delete), per FR-021. `RefreshToken` mutations are
deliberately **not** additionally audited — the table's own append-only rows already are that
history (AR-006).

| Field this feature populates | Value |
|---|---|
| `actorId` | the authenticated caller's `User.id` (`null` only for registration, which is self-service and has no other actor) |
| `action` | `CREATE` \| `UPDATE` \| `DELETE` from the existing `AuditAction` enum — no new values |
| `entity` | literal string `"User"` |
| `entityId` | the affected `User.id` |
| `diff` | `{ before: {...}, after: {...} }`, both excluding `passwordHash` — an audit trail that itself leaked password hashes would violate the very principle it exists to serve |

No column changes.
