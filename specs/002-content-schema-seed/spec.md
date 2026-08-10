# Feature Specification: Content Data Model & Seed

**Feature Branch**: `002-content-schema-seed`
**Created**: 2026-08-10
**Status**: Draft
**Input**: User description: "Implement the complete Prisma schema for Pascca and a seed script.
Models: User, RefreshToken, Branch, BranchHour, BranchClosure, DiningTable, Category, MenuItem,
MenuItemVariant, MenuItemBranch, Reservation, ReservationEvent, GalleryAlbum, GalleryImage,
Testimonial, FaqItem, TeamMember, Milestone, Post, PageBlock, ContactMessage, SiteSetting,
AuditLog. ... Acceptance: pnpm db:migrate && pnpm db:seed produces a database the site could run
against."

## Clarifications

### Session 2026-08-10

- Q: How should MenuItem/MenuItemVariant/MenuItemBranch prices be stored in the schema? → A: Integer minor units (piastres) — avoids JS float rounding and Decimal-to-JSON serialization pain in the future API layer.
- Q: What should Reservation.code be — format and purpose? → A: A globally unique, human-shareable 6-character alphanumeric confirmation code, generated at creation.
- Q: What Reservation status lifecycle should the schema enum encode? → A: Six-status full lifecycle — PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW.
- Q: Article 12 [NN] says PageBlock is "keyed (page, block, field)"; the feature request asked for (page, block) with a JSON value. Which stands? → A: (page, block) + JSON value. Article 12's substantive obligations (the five editable fields per named section, per-page SEO, server-side per-field length limits, seeded fallback default) are all still met; only the row granularity differs. Recorded as an explicit Article 12 interpretation, not an amendment — see plan.md gate 12.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every content type has a home in the database (Priority: P1)

A developer building any later feature (menu API, reservations, dashboard screens) needs every
content type the constitution promises — branches, menu, categories, reservations, gallery,
testimonials, page copy, team, users — to already exist as a properly related, correctly
constrained table. Without this, every later feature spends its own time inventing schema instead
of building behaviour.

**Why this priority**: Nothing else in the product can be built until the data it reads and
writes has somewhere to live. This is the foundation every other feature stands on.

**Independent Test**: Run the migration against an empty database. It succeeds, and the resulting
schema contains every named model with the fields, relationships, and indexes called for below —
verifiable by inspecting the database directly, with no application code required.

**Acceptance Scenarios**:

1. **Given** an empty PostgreSQL database, **When** the migration runs, **Then** it completes
   without error and every one of the 22 named tables exists.
2. **Given** the migrated schema, **When** a MenuItem row is queried filtered on `isFasting` or
   `isFeatured`, **Then** the query plan uses an index rather than a full table scan.
3. **Given** the migrated schema, **When** a second migration is designed later to add Phase 9
   ordering tables, **Then** it can be written as pure additions (new tables, new columns with
   defaults) with zero `ALTER`/`DROP` on any table this feature creates.
4. **Given** the migrated schema, **When** a content field such as a menu item's name or a page
   block's headline is inspected, **Then** it exists as an `_en` and an `_ar` column pair, even
   though nothing writes to the `_ar` column yet.

---

### User Story 2 - The database starts with a working restaurant in it (Priority: P2)

Everyone who works on this project after today — engineers building the menu page, designers
checking layouts, QA testing the dashboard, the client previewing progress — needs a database that
already looks like Pascca, not an empty shell. Seeding removes "someone has to type all this in
first" as a blocker on every future feature.

**Why this priority**: Depends on User Story 1 (the tables must exist first) but delivers
independent value: a realistic, browsable dataset that makes every subsequent feature demoable
from day one instead of after content entry.

**Independent Test**: Run the seed script against a freshly migrated, empty database. Query the
result directly (or through a database GUI) and confirm both branches, the category and menu
structure, gallery, testimonials, FAQ, milestones, page copy, staff accounts and a spread of
reservations are all present and internally consistent (e.g. every `MenuItemBranch` row points at
a menu item and a branch that both exist).

**Acceptance Scenarios**:

1. **Given** a freshly migrated database, **When** the seed script runs, **Then** it completes
   without error and reports what it created.
2. **Given** the seeded database, **When** the two branches are inspected, **Then** Shobra shows
   hours crossing midnight (12:00–02:00) and Heliopolis shows 24-hour hours, each with its real
   address, phone and coordinates.
3. **Given** the seeded database, **When** menu items are filtered by `isFeatured`, **Then**
   exactly four are returned, each with a distinct `featuredRank`.
4. **Given** the seeded database, **When** testimonials are inspected, **Then** every row has
   `consentGiven = true`.
5. **Given** the seeded database, **When** the eight pages' `PageBlock` rows are inspected,
   **Then** every page has at least one block, so a future front end has real copy to render
   instead of empty state on day one.
6. **Given** the seeded database, **When** reservations are inspected, **Then** they span multiple
   statuses and both branches, include at least one party of more than six (`requiresCall = true`,
   `PENDING`), and at least one party of six or fewer (`CONFIRMED`).

---

### User Story 3 - Seeding is safe to run more than once (Priority: P3)

An engineer resets their local database periodically (schema changes, corrupted local state, a
fresh clone). Re-running the seed script should not double every row or crash on a unique
constraint violation.

**Why this priority**: Quality-of-life for day-to-day development; not required for the first
demo, but cheap to guarantee now and expensive to retrofit once other code starts depending on
seeded IDs.

**Independent Test**: Run the seed script twice in a row against the same database. The second run
completes without error and the row counts described in User Story 2 are unchanged (no
duplicates).

**Acceptance Scenarios**:

1. **Given** an already-seeded database, **When** the seed script runs again, **Then** it
   completes without error and without creating duplicate branches, categories, or users.

---

### Edge Cases

- What happens when the seed script runs against a database that already has *unrelated*
  hand-entered data (e.g. a manually created reservation)? Seeding must not delete or overwrite
  rows it did not itself create.
- Shobra's hours cross midnight (12:00 one day → 02:00 the next). Anything reading `BranchHour`
  later must not assume `closeTime > openTime`.
- A `Reservation.tableId` is nullable — table assignment is manual and may not have happened yet;
  the schema must not force a table at creation time.
- A `MenuItemVariant` may or may not exist for a given `MenuItem` (e.g. a pizza with size variants
  vs. a drink with none) — the relationship is optional, not one-to-one.
- A `MenuItemBranch` row lets a menu item be unavailable or priced differently at one branch
  without touching the item itself — the schema must support divergence per branch, not just a
  single global price/availability.
- `Post` rows can exist with no consumer reading them publicly (Article 24) — the schema must not
  assume a public route exists.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The schema MUST define all 22 named models — User, RefreshToken, Branch,
  BranchHour, BranchClosure, DiningTable, Category, MenuItem, MenuItemVariant, MenuItemBranch,
  Reservation, ReservationEvent, GalleryAlbum, GalleryImage, Testimonial, FaqItem, TeamMember,
  Milestone, Post, PageBlock, ContactMessage, SiteSetting, AuditLog — with relationships matching
  their real-world associations (e.g. a MenuItem belongs to a Category; a Reservation belongs to a
  Branch and optionally a DiningTable and a handling User).
- **FR-002**: Every human-authored content field (names, descriptions, headlines, quotes, and
  similar) MUST exist as an `_en` / `_ar` column pair from this first migration, regardless of
  Arabic being launch-disabled.
- **FR-003**: MenuItem MUST carry `isFasting`, `isVegetarian`, `isSpicy`, `isFeatured`,
  `featuredRank`, `isAvailable`, `allergens`, `prepMinutes`, and `sortOrder`. `isFasting` and
  `isFeatured` MUST be indexed.
- **FR-003a**: Every price field (MenuItem base price, MenuItemVariant price,
  MenuItemBranch price override) MUST be stored as an integer in minor currency units
  (piastres — 1/100 EGP), never as a float or decimal column.
- **FR-004**: Testimonial MUST carry `author`, `source` (one of GOOGLE, TRIPADVISOR, INSTAGRAM,
  RESTAURANT_GURU, DIRECT), `rating`, `quote_en`, `quote_ar`, `branchId`, `consentGiven`, and
  `publishedAt`.
- **FR-005**: PageBlock MUST be uniquely keyed by `(page, block)`, carry a structured value holding
  `eyebrow`, `headline`, `sub`, `ctaLabel`, and `ctaHref`, and carry per-page SEO fields (title,
  description, OG image) in both languages. The structured value MUST be shaped so that a
  per-field maximum length can be enforced by the API layer on save (Article 12's server-side
  length limit obligation), and so that a missing block falls back to a seeded default.
- **FR-006a**: `Reservation.code` MUST be a globally unique, human-shareable 6-character
  alphanumeric confirmation code, generated at creation, so a guest can reference their booking
  by phone or in a message without exposing booking volume or order (unlike a sequential number).
- **FR-006**: Reservation MUST carry `code`, `branchId`, `tableId` (nullable), `customerName`,
  `phone`, `email`, `partySize`, `reservedAt`, `durationMin` (default 90), `status` (one of
  PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW), `source`, `occasion`, `notes`,
  `staffNotes`, `requiresCall`, `handledById`, and creation/update timestamps. It MUST be indexed
  on `(branchId, reservedAt)`, `(status, reservedAt)`, and `phone`.
- **FR-007**: Post MUST be fully modeled (including `_en`/`_ar` content fields) but this feature
  MUST NOT add any public-facing read path for it — that stays behind the Article 24 feature flag,
  introduced in a later feature.
- **FR-008**: The schema MUST be reviewably extensible for Phase 9 ordering (an Order/OrderItem
  model referencing MenuItem, Branch, and a customer) without requiring any `ALTER` or `DROP` on
  a table this feature creates. This feature MUST NOT create any ordering, payment, loyalty, or
  delivery-tracking table, even as a stub.
- **FR-009**: `pnpm db:migrate` MUST succeed against an empty PostgreSQL 16 database with no manual
  steps beyond running the command.
- **FR-010**: `pnpm db:seed` MUST populate: both branches with real address, phone, coordinates,
  and hours (Shobra 12:00–02:00 crossing midnight; Heliopolis 24 hours); eight categories; roughly
  forty menu items with correct `isFasting`/`isVegetarian` flags, four of them `isFeatured` with
  distinct ranks; four gallery albums with images; five testimonials, all `consentGiven = true`;
  the FAQ set; the milestone list; one PageBlock row per section for all eight pages; one ADMIN
  and one MODERATOR user; and twenty reservations spread across statuses and both branches.
- **FR-011**: Seeded reservations MUST reflect the confirmation policy: parties of six or fewer
  seed as `CONFIRMED`, parties over six seed as `PENDING` with `requiresCall = true` — so the seed
  data itself is a working example of Article 26, not just filler rows.
- **FR-012**: Seeded User passwords MUST be stored hashed (never plaintext), consistent with the
  hashing approach the auth system will use.
- **FR-013**: The seed script MUST be safe to run more than once against the same database without
  creating duplicate branches, categories, users, or other uniquely-identified rows (see User
  Story 3).
- **FR-014**: RefreshToken and AuditLog MUST remain empty after seeding — both are populated only
  by live system activity (login, authenticated mutation), never by fixture data.

### Always-On Requirements

- **AR-001** (Art 3): Every Tier 1/2 entity this feature adds (Branch, MenuItem, Category,
  Testimonial, GalleryAlbum, FaqItem, TeamMember, Milestone, PageBlock, Reservation,
  ContactMessage, SiteSetting) is stored so a future dashboard can read and write it with no code
  change to this schema — this feature builds the storage only; the CRUD endpoints and dashboard
  screens that make it editable are later features.
- **AR-002** (Art 4): N/A for this feature directly — no API endpoints are introduced here. This
  feature exists so that the API-first endpoints of later features have a schema to read and
  write through; it introduces no web-only shortcut of any kind.
- **AR-003** (Art 21): Every content field is modeled with paired `_en`/`_ar` columns (FR-002) so
  turning Arabic on later is a content-entry task, not a migration.
- **AR-004** (Art 10): N/A for this feature — no endpoints, so no error codes to register yet.
  Endpoints built against this schema in later features are responsible for registering their own
  codes in `docs/api.md`.
- **AR-005** (Art 14): N/A for this feature directly — permission enforcement happens in the API
  layer of later features. This schema does record `handledById` on Reservation and `actor` on
  AuditLog so that layer has what it needs to attribute actions per role.
- **AR-006** (Art 15): The schema includes `AuditLog` (actor, entity, id, diff) and
  `ReservationEvent` (status-change history) as first-class tables, and every Tier 1 model has the
  columns a soft-delete implementation needs (no hard-delete-only design). The soft-delete
  behaviour and the code that writes these rows on mutation are later, API-layer features — this
  feature only ensures the schema does not block them.
- **AR-007** (Art 28): N/A — this feature has no UI surface. Accessibility obligations attach to
  the pages and dashboard screens built against this schema later.

### Key Entities

- **User**: A person with dashboard access (ADMIN or MODERATOR) or, later, an authenticated
  customer. Holds credentials (hashed), role, and identity fields.
- **RefreshToken**: A rotating session credential tied to a User; empty until real logins occur.
- **Branch**: One of Pascca's two physical locations — name, address, phone, coordinates,
  description.
- **BranchHour**: A branch's opening hours per day of week, supporting overnight (crosses
  midnight) ranges.
- **BranchClosure**: A dated exception (holiday, private event) that overrides normal hours for a
  branch.
- **DiningTable**: A physical table at a branch with a seat capacity, used for manual assignment
  and capacity-driven availability.
- **Category**: A menu grouping (e.g. Pizza, Pasta, Breakfast) with a display order.
- **MenuItem**: A dish — name, description, price (integer piastres, FR-003a), image, and the
  flags in FR-003 — belonging to a Category.
- **MenuItemVariant**: An optional size/style variation of a MenuItem (e.g. small/large) with its
  own price (integer piastres).
- **MenuItemBranch**: Per-branch override of a MenuItem's price (integer piastres) or
  availability, so an item can differ by location without duplicating the item.
- **Reservation**: A booking request/confirmation — see FR-006 — belonging to a Branch and
  optionally a DiningTable and a handling User.
- **ReservationEvent**: A logged status transition on a Reservation (who changed it, from what, to
  what, when).
- **GalleryAlbum**: A named, ordered collection of images (e.g. "The food", "Breakfast").
- **GalleryImage**: An image within an album, optionally tagged to a branch, with alt text in both
  languages.
- **Testimonial**: A manually curated guest quote — see FR-004 — optionally tied to a branch.
- **FaqItem**: A question/answer pair, ordered, in both languages.
- **TeamMember**: A staff profile shown on the About page — name, role, photo, bio, in both
  languages.
- **Milestone**: A dated entry in Pascca's history/timeline, shown on the About page.
- **Post**: A blog article — modeled fully but not publicly readable yet (FR-007).
- **PageBlock**: A named, editable section of page copy — see FR-005 — keyed to a specific page
  and block slot.
- **ContactMessage**: An inbound message from the public contact form, with read/handled state.
- **SiteSetting**: A key/value store for site-wide configuration such as the delivery-partner
  links (Article 23).
- **AuditLog**: A recorded diff of a create/update/delete on Tier 1/2 content, with actor and
  timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with a fresh clone and an empty database reaches a fully seeded,
  realistic local database with two commands (`pnpm db:migrate && pnpm db:seed`) and no manual
  data entry.
- **SC-002**: 100% of the 22 named models exist in the migrated schema with the fields and
  relationships specified above — verifiable by direct database inspection.
- **SC-003**: Every content-bearing field in the schema has both an `_en` and `_ar` column —
  verifiable by inspecting the schema for zero exceptions.
- **SC-004**: Re-running the seed script against an already-seeded database changes zero row
  counts (idempotent).
- **SC-005**: A design review of the schema confirms that a hypothetical Phase 9 Order/OrderItem
  addition requires zero changes to any existing table (additive only).
- **SC-006**: The seeded dataset is internally consistent — every foreign key in seeded data
  resolves to a real row (zero orphaned references).

## Assumptions

- **Branch data accuracy**: "Real" address, phone, and coordinate data for the Shobra and
  Heliopolis branches is seed/fixture data meant to look and behave like production content (so
  the site is demoable), not verified-accurate client-supplied data. Per Article 3, this content
  is DB-backed and dashboard-editable, so the client (or whoever owns this data) can correct it
  through the dashboard once it ships, with no code or migration required. If exact current
  address/phone/coordinate values are available, they should replace the seed values before this
  branch merges — this is a content edit to the seed script, not a schema change.
- **TeamMember and DiningTable seeding**: Not explicitly requested in the feature description but
  needed for the site to look real (About page team section) and for reservations to reference
  real tables. A modest number of each (roughly 4-6 team members per branch's worth, and a handful
  of tables per branch with varied capacities) is seeded as a reasonable default.
- **ContactMessage seeding**: A small number (roughly 5) of sample contact messages are seeded so
  the future dashboard message queue has something to show, mirroring the reservations approach.
- **SiteSetting seeding**: Seeded with the delivery-partner link keys (Article 23) pointing at
  placeholder talabat/elmenus URLs, since the schema anticipates this being dashboard-editable
  before Phase 9 ships.
- **BranchClosure seeding**: None seeded by default (closures are calendar exceptions entered
  operationally, not fixture data) — the table exists and is exercised by future feature tests,
  not by this seed script.
- **Seed vs. audit trail**: Seeding writes directly to the database and is not expected to produce
  `AuditLog` or `ReservationEvent` rows for every seeded row — those tables reflect *live* mutation
  activity going forward. `ReservationEvent` rows are, however, seeded for each seeded reservation
  to reflect its status history realistically, since dashboard screens reading reservation history
  need something to display from day one.
- **No API or UI in scope**: This feature is schema and seed data only. No Fastify routes,
  services, repositories, or dashboard/website screens are built here (Article 11) — those are
  later features that read/write through this schema.

## Constitution Impact *(mandatory)*

**Articles this feature is governed by**: 3, 4, 7 (module boundary shape anticipated by the
schema, even though no routes exist yet), 8, 9, 11, 12, 13, 15, 21, 23, 24, 26

**Non-negotiable [NN] articles touched**: 3, 4, 8, 9, 12, 13, 15, 21

**Out of scope by Article 1**: Confirmed. No ordering, payment, loyalty, or delivery-tracking
table is created, stubbed, or referenced by this feature.

**Amendment needed?**: No.
