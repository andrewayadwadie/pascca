# Pascca — SpecKit Feature Prompts

Sixteen features. **One `/specify` each, in this order.** Never merge two — SpecKit degrades
badly on mega-specs and you lose the `/clarify` round where the real edge cases surface.

## The loop, per feature

```
/specify   <paste the feature prompt>
/clarify   answer every question — do not skip this
/plan      point at the constitution, the Prisma schema and docs/api.md
/analyze   catches spec ↔ plan ↔ task drift cheaply
/implement
```

## Setup, once

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init pascca --ai claude
cd pascca && claude
/constitution   # paste CONSTITUTION.md v2.0.0
```

Also add to `.claude/`: a `CLAUDE.md` with the repo map and commands
(`pnpm dev`, `pnpm db:migrate`, `pnpm api:collections`), and your existing `flutter-expert`
skill for Phase 8.

---

# PHASE A — Foundation

## F01 · Monorepo, tooling and environment

```
Set up the Pascca monorepo per Article 6 of the constitution.

pnpm workspaces + Turborepo with apps/api, apps/web, apps/admin and packages/types,
packages/api-client, packages/config. TypeScript strict everywhere, shared tsconfig and
eslint config in packages/config, plus tokens.css containing exactly the token block from
Article 16 — this file is the single source of design values for both web and admin.

docker-compose.yml running PostgreSQL 16, Redis 7 and MinIO as an R2 stand-in for local
development. A config/env.ts in apps/api that validates every environment variable through
a Zod schema and exits at boot with a message naming the missing variable. A committed
.env.example kept in sync.

GitHub Actions running lint, typecheck, test and build on every pull request, with database
migrations as a separate manually approved job that never runs automatically on deploy.

Acceptance: pnpm dev starts all three apps; a missing env var kills the API at startup with
a clear message; CI is green on an empty repo.
```

## F02 · Data model and seed

```
Implement the complete Prisma schema for Pascca and a seed script.

Models: User, RefreshToken, Branch, BranchHour, BranchClosure, DiningTable, Category,
MenuItem, MenuItemVariant, MenuItemBranch, Reservation, ReservationEvent, GalleryAlbum,
GalleryImage, Testimonial, FaqItem, TeamMember, Milestone, Post, PageBlock, ContactMessage,
SiteSetting, AuditLog.

Rules from the constitution that the schema must satisfy:
- Every content field exists as both _en and _ar columns from this first migration, even
  though Arabic is disabled at launch (Article 21).
- MenuItem carries isFasting, isVegetarian, isSpicy, isFeatured, featuredRank, isAvailable,
  allergens, prepMinutes and sortOrder. isFasting and isFeatured are indexed.
- Testimonial carries author, source (GOOGLE, TRIPADVISOR, INSTAGRAM, RESTAURANT_GURU,
  DIRECT), rating, quote_en, quote_ar, branchId, consentGiven and publishedAt.
- PageBlock is keyed by (page, block) with a JSON value holding eyebrow, headline, sub,
  ctaLabel and ctaHref, plus per-page seo fields.
- Reservation carries code, branchId, tableId (nullable), customerName, phone, email,
  partySize, reservedAt, durationMin default 90, status, source, occasion, notes,
  staffNotes, requiresCall, handledById and timestamps. Indexed on (branchId, reservedAt),
  (status, reservedAt) and phone.
- Post exists but nothing reads it publicly yet (Article 24).
- Design the schema so Phase 9 ordering tables can be added without altering any existing
  table. Do not create those tables now.

Seed: both real branches with their real addresses, phones, coordinates and hours (Shobra
12:00–02:00 crossing midnight, Heliopolis 24 hours); eight categories; roughly forty menu
items with correct fasting and vegetarian flags and four marked isFeatured with ranks;
four gallery albums; five testimonials with consentGiven true; the FAQ set; the milestone
list; default PageBlock rows for all eight pages so the site renders before anyone touches
the dashboard; one ADMIN and one MODERATOR; and twenty reservations spread across statuses
and both branches so the dashboard has something to show.

Acceptance: pnpm db:migrate && pnpm db:seed produces a database the site could run against.
```

## F03 · Auth and permission system

```
Build authentication and authorisation for the Pascca API.

JWT access tokens valid 15 minutes and rotating refresh tokens valid 30 days, stored only
as hashes. Refresh reuse detection: presenting an already-rotated token revokes the entire
token family and forces re-login. httpOnly SameSite cookies for the web clients, bearer
tokens for mobile.

Authorisation is a seeded role-to-permissions map with a requirePermission('menu:write')
preHandler, exactly as specified in Article 14. Implementing role checks as inline
conditionals is a constitution violation — a new role must be addable by editing a seed.

Endpoints: register, login, refresh, logout, GET /me, PATCH /me. Rate limit all auth routes
at five per minute per IP. argon2 password hashing.

Invariants to enforce and test: an ADMIN cannot delete their own account; the last active
ADMIN cannot be demoted or deactivated; a MODERATOR receives 403 from every menu, gallery,
branch, content, user, settings and audit write endpoint.

Also build the shared error envelope and the machine-readable error code register in
docs/api.md per Article 10, and the AuditLog writer per Article 15.

Acceptance: a test asserting the full permission matrix — every role against every admin
endpoint — passes, and refresh reuse revokes the family.
```

---

# PHASE B — Content API

## F04 · Branches, hours and closures

```
Build the branches module.

Public: GET /api/v1/branches returning both branches with their hours and a computed
isOpenNow flag that correctly handles Shobra's 02:00 close crossing midnight and the
24-hour Heliopolis branch; GET /api/v1/branches/:slug.

Admin: full CRUD on branches, a PUT for the weekly hours grid, CRUD on closure dates, and
CRUD on dining tables (label, capacity, zone). totalSeats on a branch is what drives
reservation availability, so it is required and must be positive.

All writes go through the audit log. Deletes are soft with a 30-day window.

Acceptance: isOpenNow is correct at 01:30 for Shobra, at any hour for Heliopolis, and false
on a seeded closure date.
```

## F05 · Categories, menu items and variants

```
Build the menu module — the largest public surface.

Public: GET /api/v1/categories; GET /api/v1/menu supporting query filters category, fasting,
vegetarian, branch, featured, q (name and description search) and standard pagination;
GET /api/v1/menu/:slug for a single dish.

Every public response includes the price. Article 2 makes visible pricing non-negotiable —
there is no configuration that hides it.

Admin: full CRUD on categories and menu items; POST /reorder on both, taking an ordered id
array; PATCH /menu-items/:id/availability as a dedicated single-purpose endpoint because the
dashboard needs 86-ing a dish to take one tap; CRUD on variants; and PUT
/menu-items/:id/branches for per-branch availability and price override. The per-branch
override is modelled and exposed by the API but the dashboard UI for it stays collapsed
behind a disclosure until the client confirms prices actually differ.

Featured selection is manual per Article 13: isFeatured plus featuredRank, with the home
page reading the top four by rank. No automatic ranking.

Acceptance: filtering by fasting returns only fasting items; reorder persists; toggling
availability is a single request; a moderator gets 403 on every write here.
```

## F06 · Gallery and media pipeline

```
Build image upload and the gallery module.

POST /api/v1/admin/uploads/presign returns a presigned R2 URL given a filename, content type
and folder, with a MIME allow-list, a size cap and server-side MIME sniffing on completion.
Strip EXIF. Generate three derivatives with sharp — thumb 400, card 900, full 1800 — in
WebP and AVIF, and compute a blurHash.

Gallery: albums (The food, The rooms, Breakfast, Occasions) with CRUD and reorder; images
with CRUD, reorder, an optional branch tag, publish toggle, and altEn/altAr.

An image cannot be published without alt text — the API rejects it. Article 20 makes this a
hard rule, not a warning.

Public: GET /api/v1/gallery filtered by album and branch, returning only published images
with their dimensions and blurHash so the client can reserve layout space and hit zero CLS.

Acceptance: publishing an image with empty alt text returns a 422 with a registered error
code; every returned image carries width, height and blurHash.
```

## F07 · Testimonials, FAQ, team, milestones

```
Build the four supporting content modules, each with full admin CRUD, reorder where ordered,
and a filtered public read.

Testimonials carry author, source, rating, quote, branch, consentGiven and publishedAt.
Per Article 13, publishing a testimonial where consentGiven is false must be rejected by the
API with a registered error code — not merely discouraged in the UI. Public reads return
only published entries.

FAQ items carry a page assignment (HOME or RESERVATIONS), question, answer and sort order,
so the same model feeds both accordions.

Team members carry name, role, photo and sort order. Milestones carry year, label and a
display value.

Acceptance: attempting to publish a testimonial without consent returns 422; FAQ items
filter correctly by page.
```

## F08 · Page content (Tier 2) and site settings

```
Build the PageBlock system — this is how the client edits the words on the public site
without touching the design.

A PageBlock is keyed by (page, block) and holds eyebrow, headline, sub, ctaLabel and
ctaHref, plus per-page SEO title, description and OG image. Seed a default row for every
named block of all eight pages listed in Article 18, so the site renders fully before anyone
opens the dashboard.

Enforce per-field character limits server-side. A headline field must reject a pasted
paragraph — this is the mechanism that stops the client destroying the layout, and Article 12
requires it in the API, not only in the UI.

Every block supports reset-to-default, which restores the seeded value.

Also build SiteSetting as a key-value store for the social links, the talabat and elmenus
delivery URLs (Article 23 requires these to be swappable from the dashboard), contact email
and phone numbers, and feature flags including blogEnabled and arabicEnabled, both false.

Public: GET /api/v1/content/:page returning every block for that page, and GET
/api/v1/settings.

Do not allow Tier 3 UI chrome strings — nav labels, form labels, validation messages — into
this model. Article 12 forbids it.

Acceptance: a headline over its limit returns 422; deleting a block's value falls back to the
seeded default rather than rendering empty.
```

---

# PHASE C — Reservations

## F09 · Availability engine

```
Build the reservation availability calculator as a pure, independently testable service.

GET /api/v1/reservations/availability?branchId=&date=&partySize= returns an array of
{ time, available, seatsLeft }.

Algorithm, per Article 25:
1. Reject dates before today or more than 60 days ahead.
2. Load the branch hours for that weekday; if closed, or a BranchClosure exists, return empty.
3. Generate slots in 30-minute steps from opening until closing minus durationMin, correctly
   handling a closing time earlier than the opening time, which means it crosses midnight.
   Shobra closes at 02:00 — this is the case that breaks naive implementations.
4. On the current day, drop slots earlier than now plus 60 minutes.
5. For each slot, bookedSeats is the SUM of partySize over reservations at that branch with
   status in (PENDING, CONFIRMED, SEATED) whose window overlaps the slot window.
   seatsLeft is branch.totalSeats minus bookedSeats; available is seatsLeft >= partySize.

A 24-hour branch has no closing boundary and must produce a full day of slots.

Acceptance: unit tests covering past-midnight closing, the 24-hour branch, a closure date,
the same-day lead time, and a slot that is exactly full.
```

## F10 · Booking, lifecycle and confirmation policy

```
Build reservation creation and the status lifecycle.

POST /api/v1/reservations creates a guest booking. It must run inside a single transaction
guarded by pg_advisory_xact_lock keyed on branch and date, re-running the overlap query
inside the lock before inserting. Two simultaneous requests for the last seats must produce
exactly one confirmation and one 409 RES_SLOT_UNAVAILABLE. Article 25 requires a test that
fires genuinely concurrent requests — a mocked test does not satisfy it.

Confirmation policy from Article 26:
- party size 6 or fewer: status CONFIRMED immediately.
- party size above 6: status PENDING with requiresCall true, and the response tells the guest
  a member of staff will phone them.
Tables are held 15 minutes past the booked time; durationMin defaults to 90. Table assignment
is manual — do not build auto-assignment.

Generate a short human-quotable code such as PSC-4K9A. Support Idempotency-Key on this
endpoint. Rate limit at five per minute per IP.

Guest self-service: GET /reservations/lookup?code=&phone= and POST /reservations/:code/cancel
requiring a matching phone.

Admin: list with filters and search, create for phone and walk-in bookings, patch, a
status endpoint writing a ReservationEvent on every transition, and soft delete restricted
so a moderator cannot delete anything older than 24 hours — only mark it NO_SHOW.

Acceptance: the concurrency test passes; a party of eight comes back PENDING with
requiresCall; a moderator receives 403 deleting a two-day-old booking.
```

## F11 · Notifications and the live dashboard feed

```
Build the notification layer and the admin live feed.

Write against a NotificationChannel interface with an EmailChannel implementation. Article 27
ships v1 with dashboard and transactional email only; WhatsApp is a Phase 6 adapter and
launch must never depend on Meta approval. No user-facing copy may promise a WhatsApp
confirmation until that adapter exists — check the seeded PageBlock and email copy for this.

Events: booking confirmed, booking pending with a call required, booking cancelled by guest,
booking modified by staff, and a reminder three hours before the reservation via a BullMQ
delayed job that is cancelled if the booking is cancelled.

Live feed: GET /api/v1/admin/reservations/stream as Server-Sent Events pushing new and
changed bookings, so the dashboard can show them without polling.

Acceptance: creating a booking enqueues exactly one confirmation email and one reminder job;
cancelling removes the reminder; the SSE stream emits within a second of a new booking.
```

## F12 · Contact messages

```
Build the contact module.

POST /api/v1/contact accepting name, phone, email, subject (an enum: general, feedback,
private event, delivery issue, careers, press) and message. Rate limited at five per minute
per IP, with honeypot and timing checks rather than a third-party captcha.

Admin: an inbox-style list with status filtering, a status workflow of NEW, READ, REPLIED,
ARCHIVED, an internal notes field, and soft delete. Moderators can read and update status
but cannot delete.

Acceptance: submitting six messages in a minute from the same IP returns 429 with a
registered error code.
```

---

# PHASE D — Public website

## F13 · Web foundation, design system and i18n

```
Build the Next.js 15 foundation for the public site.

App Router with /[locale]/… routing, en as the default and ar registered but gated behind
the arabicEnabled flag from SiteSetting. Article 21 requires the site to launch English-only
while being structurally complete for Arabic: every content model already carries _ar
columns, every UI string lives in messages/en.json, and no literal user-facing string may
appear in a component. Add an eslint rule that fails the build on hardcoded strings in JSX.

Layout must use logical properties only — margin-inline-start, padding-block,
inset-inline-end, text-align: start. A margin-left in a layout context is a constitution
violation and should fail review.

Implement the design system from Article 16 as Tailwind theme extensions reading
packages/config/tokens.css. Self-host Zodiak as woff2 in public/fonts with font-display
swap and a size-adjust fallback — no third-party font CDN in production.

Build the shared shell: the glassmorphism navigation with the centred wordmark and gold
RISTORANTE sub-label, the full-screen mobile overlay, the four-column footer, and the mobile
floating CTA pill shown at 1100px and below, per Article 17.

Build the primitive components: Button in its three variants, Label, SectionHead, Card,
Panel, StatsList, Accordion, FilterPills, ImagePlaceholder and the Block component that
renders a PageBlock with a fallback to its seeded default.

Motion is limited to the budget in Article 19 and must be fully disabled under
prefers-reduced-motion.

Acceptance: axe is clean on the shell; a hardcoded JSX string fails lint; the site renders
with Arabic disabled and no dead routes.
```

## F14 · Home, about, gallery, branches, legal

```
Build five of the eight public pages against the section order fixed in Article 18. All
content comes from the API — no hardcoded copy, no mock data.

Home: hero with the 3D floating plate and its two floating badges built exactly to the
Article 17 specification, press strip, four featured dishes read from isFeatured ordered by
featuredRank, story panel, breakfast section, occasions, testimonials, the delivery band
reading its URLs from SiteSetting, FAQ accordion filtered to page HOME, and the closing CTA.

About: story with the photo mosaic and the gold metric card, four values, milestones from
the Milestone model, and the team grid.

Gallery: album filter pills, a masonry grid with the exact spans in Article 18, and a
lightbox with keyboard navigation and a focus trap.

Branches: two branch cards with hours, ratings and directions, a map with both branches
plotted, and the large-groups panel.

Legal: privacy and terms rendered from PageBlock content in a single centred reading column.

Rendering is ISR with revalidate 60 plus an on-demand revalidation webhook fired when the
dashboard saves. Every page emits its JSON-LD per Article 22 — LocalBusiness and Restaurant
per branch on branches and home, FAQPage where the accordion appears.

Acceptance: Lighthouse on mobile is at least 95 performance, 100 accessibility and 100 SEO
on the deployed build; changing a featured dish in the dashboard is reflected within a minute.
```

## F15 · Menu, reservations and contact pages

```
Build the three interactive public pages.

Menu: the filter bar with eleven pills including fasting-only and vegetarian-only, and eight
category groups of dish rows. Filter state is reflected in the URL as query parameters so a
filtered menu is shareable and server-renderable. Prices are always visible. Dish rows show
fasting and vegetarian chips. Empty category groups hide themselves when a filter excludes
everything in them. Add Menu and MenuItem JSON-LD.

Reservations: the how-it-works rail and the booking form. The form calls the availability
endpoint when branch, date and party size are all set, and offers only available times —
never let a guest pick a slot that will fail. Validate with React Hook Form and Zod sharing
the schema with the API. Show two distinct success states: an instant confirmation with the
booking reference for parties of six or fewer, and a we-will-call-you state for larger
parties, matching Article 26. Include the booking FAQ accordion filtered to page RESERVATIONS.

Contact: the contact rail reading numbers and email from SiteSetting, the message form with
a subject select matching the API enum, honeypot protection, and the two compact branch cards.

Both forms must be fully keyboard operable, announce errors to screen readers, and disable
the submit button while in flight without losing the entered data on failure.

Acceptance: an end-to-end test books a table for four and receives a reference; booking for
ten produces the call-back state; the menu filter survives a page reload via the URL.
```

---

# PHASE E — Dashboard

## F16 · Admin dashboard

```
Build the Vite and React 19 admin dashboard as a pure API client per Article 14 — no
business logic the API does not also enforce, no database access, no server rendering, and
deployable independently of the public site.

Screens: Login; Today; Reservations list with table and day views; the reservation detail
drawer; Menu manager with a category rail and reorderable items; the dish editor including
variants and the collapsed per-branch override section; Page content editor with live
preview and character counters; Gallery manager with drag-and-drop upload and an alt-text
gate; Branches with the hours grid, closures calendar and tables; Testimonials and FAQ;
Messages inbox; Users; Settings; Audit log with a before-and-after diff view.

Navigation is permission-aware. A moderator sees exactly two items — Reservations and
Messages — and everything else is not rendered at all rather than rendered disabled, per
Article 14. The API rejects it independently; do not rely on the UI.

Operator ergonomics are requirements, not polish: optimistic reservation status updates with
rollback on failure; the SSE live feed with a sound and a browser notification on a new
booking; a five-second undo toast after any delete backed by the server-side soft delete;
drag-to-reorder for menu items, categories and gallery images; the one-tap availability
toggle; CSV export of reservations for a date range; and keyboard shortcuts — slash focuses
search, c opens a new booking, escape closes any modal.

The dashboard uses the same tokens from packages/config, at the denser scale described for
internal tools: 14px base text, tighter spacing, tables over cards.

Acceptance: a moderator logging in sees two navigation items and receives 403 from a direct
API call to /admin/menu-items; a delete can be undone within five seconds; a new booking
appears in the live feed without a refresh.
```

---

# After the sixteen

**Phase 6 add-ons** — WhatsApp channel adapter once the client's WABA is approved; the blog
route behind `blogEnabled`; Arabic content entry behind `arabicEnabled`.

**Phase 7 launch** — Nginx + PM2 on the VPS, SSL, `new.pasccarestaurant.com` first, the
`/pasca-menu/` 301, backup restore rehearsal, then DNS cutover.

**Phase 8** — the Flutter app against the `customer` and `public` API surfaces, using the
generated Postman collection and `packages/types`.

**Phase 9** — ordering, payments (Paymob or Fawry), and the kitchen order board.

---

## Two things to watch

**Do not skip `/clarify`.** It is where double-booking, the past-midnight close, and the
moderator restrictions get pinned down. Skipping it produces a booking system that looks
correct and seats two parties at one table.

**Run `/analyze` before every `/implement`.** Drift between spec, plan and tasks is cheap to
catch there and expensive to catch in review.
