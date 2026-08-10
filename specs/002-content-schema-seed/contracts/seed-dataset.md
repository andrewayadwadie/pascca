# Contract: Seeded Dataset

**Feature**: `002-content-schema-seed` · **Satisfies**: FR-010, FR-011, FR-012, FR-014, SC-006

What `pnpm db:seed` guarantees. Later features build screens against these rows, so the shape here
is a contract, not a suggestion — the seed tests assert it (research R13).

---

## ⚠️ Branch data needs client confirmation before merge

The feature request said *"both real branches with their real addresses, phones, coordinates."*
**No verified client-supplied values were available when this plan was written.** The seed ships
realistic placeholders that make the site demoable, marked in the seed file with a
`// TODO(client-data)` comment on each affected value.

This is not a schema problem and does not block anything: Article 3 [NN] makes all of it
DB-backed and dashboard-editable, so correcting it later is a content edit, not a migration. But
it must not go to the client as fact. Two acceptable resolutions, in order of preference:

1. Real values are supplied → replace them in `prisma/seed.ts` before this branch merges.
2. They are not → the `TODO(client-data)` markers stay, and the handover note says so plainly.

Applies to: both branches' street addresses, phone numbers, latitude/longitude, and the exact
opening-hour boundaries. The *structure* (Shobra crosses midnight, Heliopolis is 24h) is stated in
the feature request and is treated as given.

---

## Guaranteed row counts

| Model | Rows | Notes |
|---|---:|---|
| `SiteSetting` | 6 | delivery links, social, feature flags |
| `User` | 2 | 1 `ADMIN`, 1 `MODERATOR` (FR-010) |
| `Branch` | 2 | `shobra`, `heliopolis` |
| `BranchHour` | 14 | 7 days × 2 branches |
| `BranchClosure` | **0** | operational data, not fixture (spec Assumptions) |
| `DiningTable` | 12 | ~6 per branch, varied capacities |
| `Category` | 8 | Article 18's menu order |
| `MenuItem` | ~40 | "roughly forty" (FR-010) |
| `MenuItemVariant` | ~12 | only where a dish genuinely has sizes |
| `MenuItemBranch` | ~6 | only genuine divergences — see below |
| `GalleryAlbum` | 4 | Article 13 [NN]: The food · The rooms · Breakfast · Occasions |
| `GalleryImage` | ~24 | ~6 per album |
| `Testimonial` | 5 | **all `consentGiven: true`** (FR-010) |
| `FaqItem` | ~10 | general + booking |
| `TeamMember` | ~5 | spec Assumptions |
| `Milestone` | ~5 | starting 2018, Shobra's opening |
| `Post` | 2 | `DRAFT` — nothing reads them (Article 24) |
| `PageSeo` | 8 | one per page |
| `PageBlock` | ~40 | every named section of all eight pages (FR-010) |
| `ContactMessage` | 5 | spec Assumptions |
| `Reservation` | 20 | FR-010 |
| `ReservationEvent` | ~35 | status history per reservation (spec Assumptions) |
| `RefreshToken` | **0** | FR-014 — live logins only |
| `AuditLog` | **0** | FR-014 — live mutations only |

"~" counts are approximate by design; the tests assert a range or a minimum, not an exact number,
so adding a dish doesn't break a test for no reason. Exact counts (2 branches, 8 categories, 4
albums, 5 testimonials, 20 reservations, 0 tokens, 0 audit rows) are asserted exactly — those come
straight from FR-010/FR-014.

---

## Invariants the tests assert

**Branches**
- `shobra`: a `BranchHour` row with `closesNextDay = true` and `closesAt (120) < opensAt (720)`.
- `heliopolis`: every `BranchHour` row has `isOpen24h = true`.
- Both: non-null `latitude`, `longitude`, `phone`, `addressEn`; `seatCapacity > 0`.

**Menu**
- Exactly **4** items with `isFeatured = true`, each with a non-null `featuredRank`, all four ranks
  **distinct** (SC / FR-010).
- Every non-featured item has `featuredRank = null`.
- At least one `isFasting = true` item and at least one `isVegetarian = true` item, and they are
  not the same single row — the flags are independent (a fasting dish is not automatically
  vegetarian in the Coptic-fasting sense, and the seed must not imply otherwise).
- Every `price > 0`. Article 2 [NN]: a dish without a price is a defect, so there is no such row
  to demo against.
- Every `MenuItem.categoryId` resolves to a seeded `Category`.

**MenuItemBranch** — seeded only where divergence is *real* (a couple of items priced differently
at Heliopolis, one unavailable at Shobra). Seeding a row for every item × branch would create ~80
rows that all say "same as the parent", which is exactly the redundant second source of truth
`null`-means-inherit was designed to avoid (data-model, Article 8 [NN]).

**Testimonials**
- All 5 rows `consentGiven = true` (FR-010) and `publishedAt` non-null.
- `source` values span more than one of the five enum members.

**Page copy**
- All 8 pages present in `PageSeo` (`home`, `menu`, `about`, `gallery`, `branches`,
  `reservations`, `contact`, `legal`).
- Every one of those 8 pages has ≥1 `PageBlock` row (FR-010: the site renders before anyone opens
  the dashboard).
- Every `PageBlock.value` parses against the `PageBlockValue` shape, with `headlineEn` non-empty.
- **No Tier 3 string is seeded** — nav labels, button micro-copy, and validation messages stay in
  `messages/{en,ar}.json` (Article 12 [NN]). A `PageBlock` named `nav` or `footer-links` would be
  a violation; the tests check no seeded `block` key matches those.

**Reservations** — the 20 rows are a working demonstration of Article 26 [NN], not filler:
- Codes are `SEED01`…`SEED20`, the deterministic keys that make re-seeding idempotent (R6).
- Every row with `partySize > 6` has `status = PENDING` **and** `requiresCall = true` (FR-011).
- Every row with `partySize <= 6` has `requiresCall = false`, and those in the booking flow's
  happy path are `CONFIRMED` (FR-011).
- All six `ReservationStatus` values appear at least once.
- Both branches appear.
- `reservedAt` values straddle now — past rows are `COMPLETED`/`NO_SHOW`, future rows are
  `PENDING`/`CONFIRMED` — so a dashboard queue looks plausible the moment it is built.
- At least one row has `tableId = null` (assignment is manual, Article 26 [NN]) and at least one
  has a table assigned.
- At least one row carries `staffNotes` — so the later "staffNotes never leaks to a public
  endpoint" test (Article 15 [NN]) has real data to prove itself against instead of passing
  vacuously on an empty column.

**Users**
- `passwordHash` starts with `$argon2id$` (FR-012, Article 29 [NN]). Not a placeholder string —
  the real library, so the auth feature's first login actually works.
- Exactly one `ADMIN`, exactly one `MODERATOR`, both `isActive = true`.

**Referential integrity (SC-006)**
- Zero orphaned foreign keys across every seeded relation. Asserted by walking each relation, not
  by trusting insertion order.

---

## What the seed prints

Counts and slugs. **Never** a phone number, an email address, a password, or a `staffNotes` value
— Article 29 [NN] ("no PII in logs") applies to a dev script's stdout exactly as it applies to the
API's logger.

The development password is printed **once**, as an explicit warning, because a developer needs it
to log in and because a silent default is how a shared environment ends up with a known-weak
account nobody remembers:

```
⚠  Seeded 2 users with the development password. Local fixtures only — never seed a shared environment.
```
