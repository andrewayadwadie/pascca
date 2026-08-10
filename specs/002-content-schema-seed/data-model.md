# Phase 1 Data Model: Content Data Model & Seed

**Feature**: `002-content-schema-seed` · **Date**: 2026-08-10
**Source of truth once implemented**: `apps/api/prisma/schema.prisma` (Article 8 [NN]). This
document is the design rationale behind that file, not a second copy of it — where they disagree
after implementation, the `.prisma` file is right and this document is stale.

---

## The rule that governs every field: authored content vs. entered data

FR-002 and Article 21 [NN] require `_en`/`_ar` column pairs on **every content field**. Applied
without judgement that rule produces `customerNameEn` / `customerNameAr`, which is nonsense — a
guest types their name once and nobody translates it.

The distinction this schema uses, stated once here and applied consistently:

| Kind | Definition | Bilingual? | Examples |
|---|---|---|---|
| **Authored site content** | Written *by Pascca* to be *read by visitors*, in whichever language the visitor chose | **Yes — `En`/`Ar` pair** | dish name, category name, FAQ answer, milestone title, testimonial quote, image alt text |
| **Entered data** | Supplied by a guest or staff member about a specific transaction; has exactly one true value | **No — single column** | guest name, guest phone, contact-form message body, internal staff note, audit diff |

Arabic columns are **nullable** and seeded `null` (research R1) — Article 21 makes enabling Arabic
a content-entry task, so fabricating placeholder Arabic today would be worse than an honest gap.
`WHERE "nameAr" IS NULL` is the client's translation to-do list.

**Naming**: Prisma-camelCase with a trailing locale segment — `nameEn`, `quoteAr`. The spec writes
these SQL-style (`quote_en`); they are the same field. No `@map` is used, so the Prisma field name
*is* the column name.

**Money**: every price is `Int` in **piastres** (1/100 EGP) — research R2, clarification
2026-08-10. `12000` is E£120.00. There are no exceptions anywhere in this schema.

**Soft delete**: every Tier 1 model and the Tier 2 models carry `deletedAt DateTime?`. This
feature adds the **column only** — no filtering middleware, no purge job (research R5). Those
belong to the features that add the delete endpoints.

**Timestamps**: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on every
model that is mutated after creation. Append-only records (`AuditLog`, `ReservationEvent`) carry
`createdAt` only — an audit row that can be updated is not an audit row.

---

## Enums

```prisma
enum Role                { ADMIN  MODERATOR  CUSTOMER }

enum ReservationStatus   { PENDING  CONFIRMED  SEATED  COMPLETED  CANCELLED  NO_SHOW }
enum ReservationSource   { WEBSITE  PHONE  WALK_IN  DASHBOARD  MOBILE_APP }
enum ReservationOccasion { NONE  BIRTHDAY  ENGAGEMENT  ANNIVERSARY  FAMILY  BUSINESS  OTHER }

enum TestimonialSource   { GOOGLE  TRIPADVISOR  INSTAGRAM  RESTAURANT_GURU  DIRECT }

enum PostStatus          { DRAFT  PUBLISHED }
enum MessageStatus       { NEW  READ  HANDLED  ARCHIVED }
enum AuditAction         { CREATE  UPDATE  DELETE  RESTORE }
```

- `ReservationStatus` is the six-value lifecycle settled by clarification. Article 25's
  seat-overlap query counts `PENDING`, `CONFIRMED`, `SEATED` as occupying seats; `COMPLETED`,
  `CANCELLED`, `NO_SHOW` do not. That behaviour lives in the availability feature; the enum here
  is what makes it expressible.
- `MOBILE_APP` is in `ReservationSource` from day one so Phase 8 needs no enum change. Adding an
  enum value is a type alteration, not a table alteration — still additive, but free to avoid.
- `Role.CUSTOMER` exists though nothing creates one yet (Article 14's permission table names it).

---

## Domain 1 — Identity

### `User`
Tier 1. Dashboard operators today; authenticated customers later.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `email` | `String @unique` | natural key for seed upsert (R6) |
| `passwordHash` | `String` | argon2id (R8, Article 29 [NN]). Never `password`. |
| `name` | `String` | entered data — single column, not bilingual |
| `phone` | `String?` | |
| `role` | `Role @default(CUSTOMER)` | |
| `isActive` | `Boolean @default(true)` | Article 14: the last active ADMIN cannot be demoted — enforced in the auth feature, this column is what it reads |
| `lastLoginAt` | `DateTime?` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Relations: `refreshTokens RefreshToken[]`, `handledReservations Reservation[]` (via
`Reservation.handledById`), `reservationEvents ReservationEvent[]`, `auditLogs AuditLog[]`.

> **No `Permission` / `RolePermission` tables in this feature** (research R10). Article 14 [NN]
> constrains how the *API* checks authorisation; there is no API here. The auth feature owns the
> map and can add it additively — `User.role` is untouched either way.

### `RefreshToken`
Tier 1 (audit-adjacent). **Seeded empty** (FR-014) — populated only by real logins.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String` → `User` | `onDelete: Cascade` |
| `tokenHash` | `String @unique` | the token itself is never stored |
| `familyId` | `String` | Article 29 [NN]: reuse detection revokes the whole family |
| `expiresAt` | `DateTime` | |
| `revokedAt` | `DateTime?` | |
| `replacedByTokenHash` | `String?` | rotation chain, for reuse detection |
| `userAgent` `ip` | `String?` | |
| `createdAt` | | append-only, no `updatedAt`, no `deletedAt` |

Indexes: `@@index([userId])`, `@@index([familyId])`, `@@index([expiresAt])`.

---

## Domain 2 — Branches

### `Branch`
Tier 1. Exactly two rows in production.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `slug` | `String @unique` | `shobra`, `heliopolis` — seed upsert key (R6) |
| `nameEn` / `nameAr` | `String` / `String?` | |
| `addressEn` / `addressAr` | `String` / `String?` | |
| `descriptionEn` / `descriptionAr` | `String?` / `String?` | |
| `phone` | `String` | entered data — single column |
| `whatsapp` | `String?` | stored; **no user-facing copy may promise WhatsApp** (Article 27 [NN]) |
| `email` | `String?` | |
| `latitude` / `longitude` | `Float` / `Float` | coordinates, not money — `Float` is correct here |
| `mapUrl` | `String?` | |
| `seatCapacity` | `Int` | drives Article 25 availability |
| `isActive` | `Boolean @default(true)` | |
| `sortOrder` | `Int @default(0)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Relations: `hours BranchHour[]`, `closures BranchClosure[]`, `tables DiningTable[]`,
`menuItemBranches MenuItemBranch[]`, `reservations Reservation[]`, `galleryImages GalleryImage[]`,
`testimonials Testimonial[]`.

### `BranchHour`
Tier 1. Opening hours per day of week — **the midnight-crossing model** (research R3).

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `branchId` | `String` → `Branch` | `onDelete: Cascade` |
| `dayOfWeek` | `Int` | 0 = Sunday … 6 = Saturday |
| `opensAt` | `Int` | **minutes past midnight**, 0–1439. No timezone — an opening time is a wall-clock fact about a place, not an instant. |
| `closesAt` | `Int` | same encoding |
| `closesNextDay` | `Boolean @default(false)` | `true` when `closesAt` belongs to the following day. Shobra: `opensAt 720, closesAt 120, closesNextDay true`. |
| `isOpen24h` | `Boolean @default(false)` | Heliopolis. `0 → 0 (+1d)` is technically the same thing but reads as a bug; the flag is self-documenting. |
| `isClosed` | `Boolean @default(false)` | a day the branch does not open at all |
| `createdAt` `updatedAt` `deletedAt` | | |

Constraint: `@@unique([branchId, dayOfWeek])`.

> **Never assume `closesAt > opensAt`.** Shobra's Monday row has `closesAt (120) < opensAt (720)`.
> Any code that compares them without consulting `closesNextDay` is wrong. This is the single
> most load-bearing subtlety in the whole schema — Article 25 [NN] calls the past-midnight close
> out by name.

### `BranchClosure`
Tier 1. Dated exception overriding normal hours. **Not seeded** (spec Assumptions) — closures are
operational, entered through the dashboard.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `branchId` | `String` → `Branch` | `onDelete: Cascade` |
| `startsAt` / `endsAt` | `DateTime` / `DateTime` | instants — a closure *is* a point in real time, unlike opening hours |
| `reasonEn` / `reasonAr` | `String?` / `String?` | authored content — shown to visitors |
| `isFullDay` | `Boolean @default(true)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Index: `@@index([branchId, startsAt])` — the availability query's lookup path.

### `DiningTable`
Tier 1. Article 26 [NN]: exists, capacity feeds availability, **auto-assignment is out of scope**.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `branchId` | `String` → `Branch` | `onDelete: Cascade` |
| `code` | `String` | `T1`, `TERRACE-2` — operator-facing identifier |
| `labelEn` / `labelAr` | `String?` / `String?` | optional friendly name ("Terrace, by the window") |
| `seats` | `Int` | |
| `isActive` | `Boolean @default(true)` | |
| `sortOrder` | `Int @default(0)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Constraint: `@@unique([branchId, code])`. Relation: `reservations Reservation[]`.

---

## Domain 3 — Menu

### `Category`
Tier 1. Eight rows (Article 18's menu order: pizza, calzone, pasta, mains, starters, breakfast,
desserts, drinks).

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `slug` | `String @unique` | seed upsert key |
| `nameEn` / `nameAr` | `String` / `String?` | |
| `descriptionEn` / `descriptionAr` | `String?` / `String?` | |
| `imageUrl` | `String?` | |
| `imageAltEn` / `imageAltAr` | `String?` / `String?` | Article 20 [NN] |
| `sortOrder` | `Int @default(0)` | Article 18's fixed section order |
| `isActive` | `Boolean @default(true)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

### `MenuItem`
Tier 1. The centre of the product. ~40 seeded rows.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `categoryId` | `String` → `Category` | `onDelete: Restrict` — deleting a category must not silently delete its dishes |
| `slug` | `String @unique` | seed upsert key |
| `nameEn` / `nameAr` | `String` / `String?` | |
| `descriptionEn` / `descriptionAr` | `String?` / `String?` | |
| `price` | `Int` | **piastres** (R2). Article 2 [NN]: a price is always present and always shown. |
| `imageUrl` | `String?` | |
| `imageAltEn` / `imageAltAr` | `String?` / `String?` | Article 20 [NN] |
| `isFasting` | `Boolean @default(false)` | صيامي — **indexed** (FR-003) |
| `isVegetarian` | `Boolean @default(false)` | |
| `isSpicy` | `Boolean @default(false)` | |
| `isFeatured` | `Boolean @default(false)` | **indexed** (FR-003). Article 13 [NN]: human-chosen, never auto-ranked. |
| `featuredRank` | `Int?` | null unless featured |
| `isAvailable` | `Boolean @default(true)` | Article 14's "86 a dish in under three seconds" toggle |
| `allergens` | `String[]` | Postgres text array — a fixed vocabulary the API validates, not free text |
| `prepMinutes` | `Int?` | |
| `sortOrder` | `Int @default(0)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Indexes: `@@index([isFasting])`, `@@index([isFeatured])` — **required verbatim by FR-003**. Plus
`@@index([categoryId, sortOrder])` for the menu page's grouped read.

Relations: `variants MenuItemVariant[]`, `branches MenuItemBranch[]`.

> `featuredRank` is nullable rather than defaulted so "not featured" and "featured, rank 0" are
> distinguishable. The four seeded featured items get ranks 1–4 (FR-010, SC — distinct ranks).
> Uniqueness of rank is **not** a database constraint: it is a curation nicety the dashboard
> enforces, and a hard constraint would make reordering (a swap) fail mid-transaction.

### `MenuItemVariant`
Tier 1. Optional size/style variation. Zero-or-more per item — not one-to-one.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `menuItemId` | `String` → `MenuItem` | `onDelete: Cascade` — a variant has no life without its item |
| `nameEn` / `nameAr` | `String` / `String?` | "Large", "Family" |
| `price` | `Int` | piastres. **Absolute price, not a delta** — a delta breaks the moment one size is discounted. |
| `isDefault` | `Boolean @default(false)` | |
| `sortOrder` | `Int @default(0)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Constraint: `@@unique([menuItemId, nameEn])`.

### `MenuItemBranch`
Tier 1. Per-branch price/availability divergence without duplicating the item.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `menuItemId` | `String` → `MenuItem` | `onDelete: Cascade` |
| `branchId` | `String` → `Branch` | `onDelete: Cascade` |
| `price` | `Int?` | **null = inherit `MenuItem.price`.** Null is the meaningful default; copying the base price into every row creates a second source of truth that silently drifts (Article 8 [NN]). |
| `isAvailable` | `Boolean?` | null = inherit `MenuItem.isAvailable`, same reasoning |
| `createdAt` `updatedAt` `deletedAt` | | |

Constraint: `@@unique([menuItemId, branchId])`.

---

## Domain 4 — Reservations

### `Reservation`
Tier 1. Article 25 [NN] and 26 [NN] both read this table.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `code` | `String @unique` | 6-char alphanumeric, guest-shareable (FR-006a, clarification). Seed uses `SEED01`…`SEED20` (R6). |
| `branchId` | `String` → `Branch` | `onDelete: Restrict` |
| `tableId` | `String?` → `DiningTable` | **nullable** — assignment is manual (Article 26 [NN]), often after the fact. `onDelete: SetNull` |
| `customerName` | `String` | entered data — single column |
| `phone` | `String` | entered data. **Indexed** (FR-006) — staff look a guest up by phone. PII: retention 12 months (Article 29 [NN]). |
| `email` | `String?` | entered data |
| `partySize` | `Int` | |
| `reservedAt` | `DateTime` | the instant of the booking |
| `durationMin` | `Int @default(90)` | Article 26 [NN] |
| `status` | `ReservationStatus @default(PENDING)` | |
| `source` | `ReservationSource @default(WEBSITE)` | |
| `occasion` | `ReservationOccasion @default(NONE)` | Article 2's signature themes |
| `notes` | `String?` | guest-supplied — entered data |
| `staffNotes` | `String?` | internal. **Article 15 [NN]: must never leave via a public or customer endpoint.** |
| `requiresCall` | `Boolean @default(false)` | Article 26 [NN]: true when `partySize > 6` |
| `handledById` | `String?` → `User` | `onDelete: SetNull` — attribution survives an operator leaving |
| `createdAt` `updatedAt` `deletedAt` | | |

Indexes — **all three required verbatim by FR-006**:
`@@index([branchId, reservedAt])` · `@@index([status, reservedAt])` · `@@index([phone])`

> `@@index([branchId, reservedAt])` is precisely the access path Article 25's seat-overlap query
> needs (`branchId = ? AND reservedAt < slotEnd AND reservedAt + durationMin > slotStart`). The
> `durationMin` half of that predicate is not indexable declaratively; the availability feature
> may need an expression index, which is **additive** (a new index, no table change).

### `ReservationEvent`
Tier 1, append-only. Article 15 [NN]: every reservation status change writes one.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `reservationId` | `String` → `Reservation` | `onDelete: Cascade` |
| `fromStatus` | `ReservationStatus?` | null on the creation event |
| `toStatus` | `ReservationStatus` | |
| `actorId` | `String?` → `User` | null when the guest themselves triggered it |
| `note` | `String?` | internal — entered data, never bilingual |
| `createdAt` | | **no `updatedAt`, no `deletedAt`** — history is not editable |

Index: `@@index([reservationId, createdAt])`.

---

## Domain 5 — Marketing content (Tier 1)

### `GalleryAlbum`
Article 13 [NN]: four albums — The food, The rooms, Breakfast, Occasions.

`id` · `slug @unique` · `titleEn`/`titleAr` · `descriptionEn`/`descriptionAr` ·
`coverImageUrl String?` · `sortOrder Int @default(0)` · `isActive Boolean @default(true)` ·
`createdAt` `updatedAt` `deletedAt`. Relation: `images GalleryImage[]`.

### `GalleryImage`
`id` · `albumId → GalleryAlbum` (`Cascade`) · `branchId String? → Branch` (`SetNull`, Article 13's
optional branch tag) · `url String` · `blurHash String?` (Article 20 [NN]) · `width Int?`
`height Int?` (Article 20: explicit dimensions, zero CLS) · `altEn String` / `altAr String?`
(**Article 20 [NN] requires alt; `altEn` is required, and `""` is a deliberate decorative choice,
not an omission**) · `captionEn`/`captionAr` · `sortOrder Int @default(0)` (Article 13's
drag-ordering) · `createdAt` `updatedAt` `deletedAt`.
Index: `@@index([albumId, sortOrder])`.

### `Testimonial`
Article 13 [NN]: manual entry only, **never scraped, never pulled live from Google**.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `author` | `String` | a real person's name — entered data, single column |
| `source` | `TestimonialSource` | GOOGLE · TRIPADVISOR · INSTAGRAM · RESTAURANT_GURU · DIRECT (FR-004) |
| `rating` | `Int?` | 1–5, validated at the API |
| `quoteEn` / `quoteAr` | `String` / `String?` | authored content as *published* |
| `branchId` | `String?` → `Branch` | `onDelete: SetNull` |
| `consentGiven` | `Boolean @default(false)` | **Article 13 [NN]: `false` must be unpublishable. The API rejects it — this feature only stores the flag.** |
| `publishedAt` | `DateTime?` | null = not published |
| `sortOrder` | `Int @default(0)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Index: `@@index([publishedAt])`. All five seeded rows have `consentGiven: true` (FR-010).

> A database `CHECK (NOT (published_at IS NOT NULL AND consent_given = false))` would enforce
> Article 13 at the storage layer, which is stronger than an API check. Prisma cannot declare it;
> it needs a hand-edited migration. **Deferred to the testimonials feature** (which owns Article
> 30's "publishing without consentGiven is rejected" test) and noted here so the option isn't lost.

### `FaqItem`
`id` · `questionEn`/`questionAr` · `answerEn`/`answerAr` · `category String?` (general vs. booking
FAQ — Article 18 puts FAQ blocks on `/` and `/reservations`) · `sortOrder` · `isActive` ·
timestamps · `deletedAt`.

### `TeamMember`
`id` · `slug @unique` · `nameEn`/`nameAr` (a name genuinely is transliterated on an Arabic site,
unlike a guest's own name) · `roleEn`/`roleAr` · `bioEn`/`bioAr` · `photoUrl String?` ·
`photoAltEn`/`photoAltAr` · `branchId String? → Branch` (`SetNull`) · `sortOrder` · `isActive` ·
timestamps · `deletedAt`.

### `Milestone`
`id` · `year Int` · `month Int?` · `titleEn`/`titleAr` · `descriptionEn`/`descriptionAr` ·
`imageUrl String?` · `sortOrder` · timestamps · `deletedAt`. Index: `@@index([year])`.
First seeded row is 2018 — Shobra's opening.

### `Post`
Article 24: **modelled and CRUD-able from day one; nothing reads it publicly.** FR-007 forbids
adding any public read path in this feature.

`id` · `slugEn String @unique` / `slugAr String? @unique` (**bilingual slugs — an Arabic article
needs its own URL segment; a single shared slug would force Arabic readers onto a transliterated
English path**) · `titleEn`/`titleAr` · `excerptEn`/`excerptAr` · `bodyEn`/`bodyAr` ·
`coverImageUrl String?` · `coverAltEn`/`coverAltAr` · `status PostStatus @default(DRAFT)` ·
`publishedAt DateTime?` · `authorId String? → User` (`SetNull`) · timestamps · `deletedAt`.
Index: `@@index([status, publishedAt])`.

---

## Domain 6 — Tier 2 page copy

### `PageBlock`
Research R4 + clarification 2026-08-10. Keyed `(page, block)` with a typed JSON value.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `page` | `String` | `home`, `menu`, `about`, `gallery`, `branches`, `reservations`, `contact`, `legal` — the eight of Article 18 |
| `block` | `String` | the named section within that page (`hero`, `signature-dishes`, `story`, …) |
| `value` | `Json` | keys: `headlineEn/Ar`, `eyebrowEn/Ar`, `subEn/Ar`, `ctaLabelEn/Ar`, `ctaHref` |
| `sortOrder` | `Int @default(0)` | |
| `isActive` | `Boolean @default(true)` | |
| `createdAt` `updatedAt` `deletedAt` | | |

Constraint: `@@unique([page, block])`. Index: `@@index([page, sortOrder])`.

`ctaHref` is **not** bilingual — a route or external URL is locale-agnostic; the `/[locale]/`
prefix is applied by the web app at render time (Article 21).

**Article 12 [NN] obligations and where each is met:**

| Obligation | Met by |
|---|---|
| Five fields editable per named section | the five key-pairs in `value` |
| Per-page SEO title/description/OG image | `PageSeo` (below) |
| Falls back to a seeded default when empty | seed writes one row per block for all eight pages (FR-010); the `<Block>` component is the web feature's job |
| Character limits enforced **server-side per field** | a shared Zod `PageBlockValue` schema with `.max()` per key, applied on write by the content module — **owed by the content-API feature, not this one** |

The only divergence from the article's literal `(page, block, field)` is physical row
granularity. No obligation is diluted or deferred beyond its owning feature.

### `PageSeo`
**Model 23 — not in the feature request's list of 22.** Justified: Article 12 states SEO fields
are *per page*, and hanging them off a per-block row would either duplicate them across every
block or strand them on one arbitrary "primary" block. FR-001 requires the 22 named models to
exist; it does not forbid a 23rd where the cardinality demands one.

`id` · `page String @unique` · `titleEn`/`titleAr` · `descriptionEn`/`descriptionAr` ·
`ogImageUrl String?` · `ogImageAltEn`/`ogImageAltAr` · timestamps · `deletedAt`.

---

## Domain 7 — Operations

### `ContactMessage`
Tier 1. Inbound from the public form. All fields entered data — none bilingual.

`id` · `name String` · `email String` · `phone String?` · `subject String?` · `message String` ·
`status MessageStatus @default(NEW)` · `handledById String? → User` (`SetNull`) ·
`handledAt DateTime?` · `ip String?` `userAgent String?` (rate-limit forensics, Article 29) ·
timestamps · `deletedAt`. Index: `@@index([status, createdAt])`.
PII retention: 6 months (Article 29 [NN]).

### `SiteSetting`
Tier 1. Article 23: the delivery links live here so they can be swapped or removed from the
dashboard the day own-ordering launches.

`id` · `key String @unique` (seed upsert key) · `value Json` · `group String?` (dashboard
grouping) · timestamps · `deletedAt`.

Seeded keys include `delivery.talabat.url`, `delivery.elmenus.url`, `delivery.enabled`,
`social.instagram.url`, `feature.blog.enabled` (`false` — Article 24), `feature.locale.ar.enabled`
(`false` — Article 21 [NN]).

> `value` is `Json` rather than `String` so a boolean flag stays a boolean and a URL stays a
> string, instead of every consumer parsing `"true"`. No dashboard-facing *labels* live here —
> those are Tier 3 UI chrome and belong in `messages/{en,ar}.json` (Article 12 [NN]).

### `AuditLog`
Tier 1, append-only. Article 15 [NN]. **Seeded empty** (FR-014).

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `actorId` | `String?` → `User` | `onDelete: SetNull` — the log outlives the account |
| `action` | `AuditAction` | |
| `entity` | `String` | model name |
| `entityId` | `String` | |
| `diff` | `Json` | before/after. **Article 15 [NN]: never leaves via a public or customer endpoint.** |
| `ip` `userAgent` | `String?` | |
| `createdAt` | | **no `updatedAt`, no `deletedAt`** — an editable or deletable audit log is not an audit log |

Indexes: `@@index([entity, entityId])`, `@@index([actorId, createdAt])`.

---

## Referential-integrity policy

`onDelete` is chosen per relation, not applied uniformly:

| Behaviour | Used for | Why |
|---|---|---|
| `Cascade` | child rows with no independent existence — `BranchHour`, `DiningTable`, `MenuItemVariant`, `MenuItemBranch`, `GalleryImage`, `RefreshToken`, `ReservationEvent` | orphaning them is never correct |
| `Restrict` | `MenuItem → Category`, `Reservation → Branch` | deleting a category must not silently take 12 dishes with it; a branch with live bookings must not vanish |
| `SetNull` | every attribution and optional tag — `Reservation.tableId`/`handledById`, `Testimonial.branchId`, `GalleryImage.branchId`, `TeamMember.branchId`, `Post.authorId`, `AuditLog.actorId`, `ContactMessage.handledById` | the record survives the referenced thing being removed; history must not be destroyed by a staff departure |

Once soft delete is *enforced* (a later feature), these cascade rules largely stop firing — a soft
delete is an `UPDATE`. They remain correct as the hard-delete safety net for the 30-day purge job.

---

## Article 11 state check: what Phase 9 would add

Full review in `contracts/phase-9-additive-review.md`. Summary: Phase 9 adds `Order`, `OrderItem`,
`Payment`, `LoyaltyAccount` — each holding its own outward FKs to `MenuItem`, `Branch`, `User`.
The referenced side needs no column, so **no table created here is altered**.

The one trap, named: `OrderItem` must store `unitPrice` as charged at order time. Anyone who
instead tries to make `MenuItem.price` historical (versioned rows, effective dates) *would* alter
an existing table — and would be wrong for an unrelated reason (an order's price is a fact about
the order, not a lookup).
