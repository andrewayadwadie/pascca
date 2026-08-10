<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (unversioned placeholders) → 1.0.0
Bump rationale: MINOR-from-zero. Initial ratification. The prior file was the
unfilled spec-kit template; no principles existed to remove or redefine, so this
is an initial adoption rather than a MAJOR break.

Principles defined (30 articles, 9 parts) — all new:
  Part I    Product         — Art 1 Scope [NN], 2 Fasting menu [NN], 3 Client owns content [NN]
  Part II   Architecture    — Art 4 API-first [NN], 5 Single source of truth [NN],
                              6 Module boundaries [NN], 7 Versioning [NN], 8 Phase discipline
  Part III  Backend         — Art 9 Errors are contracts [NN], 10 Permissions as data [NN],
                              11 Booking correctness [NN], 12 Reversible + audited [NN],
                              13 Env validated at boot [NN]
  Part IV   Public website  — Art 14 Bilingual is structural [NN], 15 Rendering strategy,
                              16 SEO is a deliverable [NN]
  Part V    Design system   — Art 17 Token set locked [NN], 18 Homepage order fixed [NN],
                              19 Motion budget [NN], 20 Images [NN]
  Part VI   Admin dashboard — Art 21 Pure API client, 22 Operator ergonomics, 23 Bilingual
  Part VII  Quality/security— Art 24 Quality floor [NN], 25 Security baseline [NN],
                              26 Tests where the risk is, 27 Definition of done
  Part VIII Delivery        — Art 28 Deploy + migrations, 29 Client deliverables
  Part IX   Governance      — Art 30 Amendment

Added sections: all of Parts I–IX; [NN] marker legend under Core Principles.
Removed sections: none (template placeholders replaced, not removed).

Templates requiring updates:
  ✅ .specify/templates/plan-template.md   — Constitution Check gates written from
       Articles 4/5/6/7/9/10/11/12/13/14/16/17/19/20/24/25/26/27; Technical Context
       pre-filled with the stack the constitution mandates; Source Code tree replaced
       with the real monorepo layout (Art 5, 21).
  ✅ .specify/templates/spec-template.md   — added mandatory "Constitution Impact"
       section; bilingual + permission + error-code requirements made explicit.
  ✅ .specify/templates/tasks-template.md  — tests changed from OPTIONAL to MANDATORY
       for the Article 26 risk areas; added audit-log, i18n/RTL, a11y, and
       definition-of-done task categories.
  ✅ CLAUDE.md                             — stack, articles, and compliance gates recorded.
  ⚠ docs/api.md                            — PENDING. Article 9 requires the canonical
       error-code registry to live here. Create on the first API feature.
  ⚠ .env.example                           — PENDING. Article 13 requires it to exist and
       stay current. Create with the first backend scaffold.
  ⚠ packages/config/tokens.css             — PENDING. Article 17 is the source of truth for
       design values; the block below is normative until that file exists.

Follow-up TODOs: none deferred. No unresolved bracket tokens remain.
-->

# PASCca Constitution

## Core Principles

This constitution governs the PASCca platform: one backend (`apps/api`) serving a bilingual
public website (`apps/web`), a role-based admin dashboard (`apps/admin`), and — from Phase 8 —
a Flutter mobile app (`mobile/`). It supersedes all other practices, conventions, and
developer preference.

**Marker legend:**

- **[NN]** — non-negotiable. Amending the article requires client sign-off (Article 30).
  A pull request that violates an [NN] article is rejected, not discussed.
- Unmarked articles are binding but amendable by written agreement inside the team.

**Compliance is checked at three points:** `/speckit-plan` (does the plan respect every
article?), `/speckit-analyze` (has drift appeared between spec, plan, and tasks?), and PR
review (does the diff violate anything?).

**Scope:** `apps/api`, `apps/web`, `apps/admin` are bound by all nine parts. `mobile/`
inherits Parts I–III and Part VII.

## Part I — Product

### Article 1 — What we are building **[NN]**

One backend serving three clients: a bilingual public website, a role-based admin dashboard,
and (Phase 8) a Flutter mobile app. The client is **PASCca**, an Italian restaurant with two
Cairo branches (Shobra, Heliopolis/Nozha).

MVP scope is fixed: **gallery, about, branches with hours and maps, menu browsing, table
reservation, contact, and the admin dashboard.** Online ordering, payments, loyalty, and
delivery tracking are **Phase 9** and MUST NOT be built, scaffolded, or half-wired into the MVP.

### Article 2 — The fasting menu is a product feature, not content **[NN]**

The صيامي (fasting) menu is PASCca's commercial differentiator. It is therefore:

- a first-class boolean column `MenuItem.isFasting`, indexed;
- a filter on the public menu endpoint (`?fasting=true`);
- a URL-addressable state on the website (`?fasting=1`), so it is shareable and server-rendered;
- a per-item switch in the dashboard;
- reused unchanged by the mobile app.

It MUST NOT be implemented as a tag string, a category, or a front-end-only filter.

### Article 3 — The client owns their content **[NN]**

Anything the client could ever want to change — a price, a photo, a phone number, hero copy,
opening hours, a FAQ answer, a social link, a review, an SEO title — MUST be editable from the
dashboard without a deploy. Hardcoded content in a component is a **defect**, not a shortcut.

The only permitted hardcoded strings are UI labels, which live in i18n message files (Article 14).

## Part II — Architecture

### Article 4 — API-first, always **[NN]**

The backend is not the website's backend; the website is the API's first client. No feature is
complete until it is reachable through a documented, versioned HTTP endpoint that a mobile app
could call. Web-only shortcut endpoints, server actions that bypass the API to hit Prisma, and
data rendered into HTML with no JSON equivalent are all violations.

**Test of compliance:** could the Flutter app deliver this feature with zero backend changes?
If no, the feature is not done.

### Article 5 — One source of truth per concern **[NN]**

| Concern | Single source |
|---|---|
| Data shape | `prisma/schema.prisma` |
| Request/response contracts | Zod schemas → TS types → OpenAPI 3.1 |
| Shared types for web/admin | `packages/types`, generated from the OpenAPI spec |
| Design values | `packages/config/tokens.css` (Article 17) |
| UI copy | `messages/ar.json`, `messages/en.json` |
| Content copy | the database, via the dashboard |

If a value exists in two places, one of them is a bug. Hand-written duplicate TypeScript
interfaces mirroring Prisma models are forbidden.

### Article 6 — Module boundaries in the API **[NN]**

Every backend module is exactly four files:

```text
<name>.routes.ts       HTTP + swagger schema only. No business logic. No Prisma.
<name>.service.ts      Business rules. No `req`, no `reply`, no HTTP status codes.
<name>.repository.ts   Prisma access only. No business rules.
<name>.schema.ts       Zod DTOs, request and response.
```

Violations to reject on sight: a Prisma call inside a route, `reply.code()` inside a service,
a business `if` inside a repository, a service importing another module's repository directly.
Cross-module reads go through the other module's **service**.

### Article 7 — Versioning and compatibility **[NN]**

All endpoints live under `/api/v1`. Once the mobile app ships, `v1` is frozen: fields may be
**added**, never removed, renamed, or retyped. Breaking changes require `/api/v2` running
alongside. Users do not update apps on our schedule.

### Article 8 — Phase discipline

Build the phase in front of you. Do not create `Order` tables while building reservations. The
schema MUST be designed so ordering can be added **without altering existing tables** — that is
the only forward-looking obligation, and it is satisfied by design review, not by writing code
early.

## Part III — Backend

### Article 9 — Errors are contracts **[NN]**

Every response is enveloped:

```jsonc
// success
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 42 } }
// failure
{ "success": false, "error": { "code": "RES_SLOT_UNAVAILABLE", "message": "…", "details": [] } }
```

Clients switch on `code`, never on `message`. Messages are localised and may change; **codes are
permanent once shipped.** Maintain the full code list in `docs/api.md`. A thrown error without a
registered code is a bug.

### Article 10 — Permissions are data, not conditionals **[NN]**

Authorisation is `requirePermission('menu:write')`, backed by a seeded role→permissions map.
`if (user.role === 'ADMIN')` scattered through handlers is forbidden — the client will ask for a
"kitchen" or "branch manager" role, and that MUST be a seed change, not a code change.

Baseline matrix (extend only by seed):

| Permission | ADMIN | MODERATOR | CUSTOMER |
|---|:--:|:--:|:--:|
| `reservation:read` / `:create` / `:update` | ✅ | ✅ | own only |
| `reservation:delete` | ✅ | ✅ (≤24h old) | ❌ |
| `message:read` / `:update` | ✅ | ✅ | ❌ |
| `menu:write` · `category:write` · `gallery:write` · `branch:write` | ✅ | ❌ | ❌ |
| `user:*` · `settings:write` · `audit:read` | ✅ | ❌ | ❌ |

Enforced in three independent layers: **API preHandler** (the real gate), dashboard route guard,
and UI rendering. A moderator MUST NOT see a disabled button for something they cannot do —
the element is not rendered at all.

Additional invariants: an ADMIN cannot delete their own account, and the last remaining active
ADMIN cannot be demoted or deactivated.

### Article 11 — Booking correctness over booking speed **[NN]**

Availability calculation and reservation insertion happen inside **one transaction** guarded by a
per-branch-per-day advisory lock (`pg_advisory_xact_lock`). Availability is computed from seat
overlap, not from a naive slot table:

```text
bookedSeats = SUM(partySize) WHERE branchId = ?
              AND status IN (PENDING, CONFIRMED, SEATED)
              AND reservedAt < slotEnd AND reservedAt + durationMin > slotStart
```

Two simultaneous requests for the last seats MUST produce **exactly one** confirmed booking and
one `409 RES_SLOT_UNAVAILABLE`. This MUST be proven by a test that fires genuinely concurrent
requests — a mocked test does not satisfy this article.

Closing times that cross midnight, branch closure dates, and a minimum 60-minute lead time on
same-day bookings are part of the calculation, not edge cases to handle later.

### Article 12 — Every destructive action is reversible and recorded **[NN]**

Admin deletes are soft deletes with a 30-day window. Every create/update/delete on reservations,
menu, categories, gallery, branches, users, and settings writes an `AuditLog` row with actor,
entity, entity id, and a JSON diff. Reservation status changes additionally write a
`ReservationEvent`. `staffNotes` and audit data MUST NOT be returned by a `public` or `customer`
endpoint.

### Article 13 — Environment is validated at boot **[NN]**

All environment variables pass through a Zod schema in `config/env.ts`. A missing or malformed
variable exits the process at startup with a message naming the variable. `process.env.X!` inline
is forbidden. `.env.example` stays current. Secrets are never committed and never logged.

## Part IV — Public website

### Article 14 — Bilingual is structural, not a translation pass **[NN]**

Arabic is the **default locale** and RTL is the **default direction**. Rules:

- Routes are `/[locale]/…` with `ar` and `en`; `ar` is the fallback.
- Content fields are `_ar` / `_en` **columns**, never a JSON blob — we index and sort on them.
- UI strings live in `messages/{ar,en}.json`. No literal user-facing string in a component.
- Layout uses **logical properties only**: `margin-inline-start`, `padding-block`,
  `inset-inline-end`, `text-align: start`. `left`, `right`, `margin-left` in a layout context
  is a violation — RTL MUST be free, not a second stylesheet.
- Arabic and Latin have separate font stacks bound to `html[lang]` (Article 17).
- Switching language preserves scroll position, open accordion, active filter, and form state.
- Every page emits `hreflang` for both locales plus `x-default`.

### Article 15 — Rendering strategy

- Menu, gallery, branches, FAQ, blog, settings → **ISR**, `revalidate: 60`, plus on-demand
  revalidation triggered by a webhook when the dashboard saves.
- Availability lookup and reservation submission → client-side, never cached.
- Nothing that changes per-request is baked into a static page.

### Article 16 — SEO is a deliverable, not a nice-to-have **[NN]**

Non-negotiable on every deploy:

- `LocalBusiness` + `Restaurant` JSON-LD **per branch** with address, geo, hours, phone,
  and `aggregateRating`; `Menu` and `MenuItem` JSON-LD on the menu pages; `FAQPage` on the FAQ.
- Unique `<title>` and meta description per page per locale, driven by `SiteSetting`.
- OG images generated per dish and per page via `next/og`.
- `sitemap.xml` and `robots.txt` generated, not hand-written.
- The legacy WordPress path `/pasca-menu/` **301-redirects** to `/[locale]/menu`. Existing QR
  codes and links MUST NOT 404.

This article exists because local search is the client's largest free traffic source and the
single most visible win we can hand them.

## Part V — Design system

### Article 17 — The token set is locked **[NN]**

Every colour, font, and spacing value derives from `packages/config/tokens.css`. No component may
introduce a raw hex value, a one-off font stack, or an arbitrary pixel radius.

```css
:root{
  /* surfaces */
  --cream:#FAF8F4;  --paper:#FFFFFF;  --sand:#F3F0E9;
  --dark:#111110;   --dark-2:#1C1B18;
  /* ink */
  --ink:#16150F;    --muted:#7C766B;  --muted-d:rgba(250,248,244,.62);
  /* accent — the only accent */
  --gold:#C29A5B;   --gold-lt:#DCC08A; --gold-bg:#F7EFE1;
  /* structure */
  --line:#E6E1D6;   --line-d:rgba(250,248,244,.14);
  --r:6px;          --r-pill:999px;
  --pad:clamp(20px,5vw,90px);
  --ease:cubic-bezier(.22,1,.36,1);
}
```

**Type:**

| Role | Latin | Arabic |
|---|---|---|
| Display (h1–h4, prices, quotes) | `Playfair Display` 400/500 + italic | `Amiri` 400/700 + italic |
| Body / UI | `Inter` 300–600 | `IBM Plex Sans Arabic` 300–600 |

Bound to `html[lang]`, never chosen per component. **Cairo and Almarai are prohibited** — every
Egyptian restaurant site uses them and the client is paying for distinction.

**Structural rules:** gold is the only accent colour. Cards are `--paper` on `--cream` with a
1px `--line` border and `--r` radius; buttons are pills. Dark bands use `--dark`. No drop shadows
except the single hover elevation on cards and the featured circular image. No gradients as
decoration — gradients appear only as photographic overlays.

### Article 18 — The homepage section order is fixed **[NN]**

This was approved by the client. Changing, reordering, or omitting a section requires client
sign-off, not a developer's judgement:

```text
1  Hero (full-bleed photo, two-line display headline, dual CTA)
2  Menu categories — three cards + the fasting-menu switch strip
3  Dark band — "An authentic Italian experience"
4  Popular Delights — four dishes, third card offset downward
5  Values — four bordered cards with circular icons
6  Featured dish — copy left, circular photo right, on --sand
7  Dark CTA band — the fasting menu
8  FAQ — label column left, accordion right
9  Reviews — dark section, three cards
10 Blog — two post cards
11 Gallery — one wide image + a row of four
12 Reservation form — on --sand
13 Newsletter — dark
14 Footer — four columns + legal bar
```

### Article 19 — Motion serves the content **[NN]**

The budget is fixed. Adding an animation means removing one.

1. Hero load stagger — kicker → headline → sub → CTAs (~1.1s)
2. Ambient — slow scale on the hero photo (24s), gold radial glow on dark bands
3. Scroll reveal — IntersectionObserver, **one-shot**, 12% threshold
4. Fasting switch — cross-fade and re-stagger of the three category cards
5. FAQ accordion — `max-height` transition, one open at a time
6. Micro — card lift, image scale on hover, arrow nudge on buttons

`@media (prefers-reduced-motion: reduce)` disables **all** of the above. This is an accessibility
requirement, not a preference. Parallax, scroll-jacking, cursor trails, and page-transition
overlays are prohibited — they break RTL, hurt LCP, and the client's audience is mobile-first.

### Article 20 — Images are a first-class constraint **[NN]**

The design depends on photography the client does not yet have. Therefore:

- Every image slot has a **designed placeholder** with the correct aspect ratio and a visible
  label. A broken image icon or a stretched stock photo in a client demo is unacceptable.
- All images are served from R2 as WebP/AVIF in three sizes (thumb 400 / card 900 / full 1800),
  through `next/image` with explicit `width`, `height`, and a `blurHash` placeholder.
- Every image has `altAr` and `altEn`. An empty alt is only valid for decorative images, and MUST
  be `alt=""` deliberately, not omitted.
- Cumulative Layout Shift from images MUST be zero.

## Part VI — Admin dashboard

### Article 21 — The dashboard is a pure API client

`apps/admin` is a Vite + React SPA. It holds no business logic the API doesn't also enforce, has
no database access, and no server-side rendering. It may ship independently of the public site.

Its route set is fixed for the MVP: `/login`, `/` (today at a glance), `/reservations`,
`/reservations/:id`, `/menu`, `/menu/:id`, `/gallery`, `/branches`, `/messages`, `/users`,
`/settings`, `/audit`.

### Article 22 — Operator ergonomics are requirements, not polish

A moderator uses this at 9pm with a queue of guests. Required, not optional:

- Optimistic updates on reservation status with rollback on failure.
- Live new-booking feed over SSE, with a browser notification and a sound.
- An "undo" toast for 5 seconds after any delete (backed by the soft delete in Article 12).
- Drag-to-reorder for menu items and gallery images, persisted via a `reorder` endpoint.
- One-tap availability toggle on a menu item (86-ing a dish MUST take under three seconds).
- CSV export of reservations for a date range.
- Keyboard: `/` focuses search, `c` opens new booking, `Esc` closes any modal.

### Article 23 — The dashboard is bilingual too

Restaurant staff are not required to read English. The dashboard ships in Arabic-first RTL using
the same i18n rules as Article 14.

## Part VII — Quality, security, testing

### Article 24 — Quality floor **[NN]**

Nothing ships below:

- Lighthouse **≥95 performance / 100 accessibility / 100 SEO** on **mobile**, on the deployed
  build, not on localhost.
- LCP < 2.0s on a throttled 4G profile; CLS < 0.05; no font-swap layout shift.
- Works at **320px** width. Works with keyboard only. Visible focus on every interactive element.
- Every form control has a real `<label>`; every icon-only button has an `aria-label`;
  the accordion, modal, and language switch are correctly announced by a screen reader.
- Colour contrast meets WCAG AA — this is where the gold-on-cream palette will fail if unchecked.
  Gold is permitted for large display text and decorative rules; body copy uses `--ink` or
  `--muted`, never `--gold`.

### Article 25 — Security baseline **[NN]**

Helmet; CORS allow-list (never `*`); global and per-route rate limits (5/min on
`POST /reservations`, `/contact`, and all `/auth/*`); argon2 password hashing; refresh-token
rotation with reuse detection and immediate family revocation; httpOnly + SameSite cookies for
web, secure storage for mobile; Zod validation on every input including query and params; no raw
SQL string interpolation; presigned uploads with MIME allow-list, size cap, and server-side MIME
sniffing; EXIF stripped from uploads; no PII in logs; nightly `pg_dump` to R2 with 30-day
retention **and a restore rehearsed before launch.**

Collecting guest phone numbers requires a published privacy policy with a stated retention
period, live before the site goes public — not before the app stores ask.

### Article 26 — Tests where the risk is

Not coverage theatre. **Mandatory**, and a phase is not complete without them:

| Area | Test |
|---|---|
| Availability | slot generation incl. past-midnight closing, closure dates, same-day lead time |
| Booking | genuinely concurrent requests for the last seats → exactly one winner |
| Permissions | every role × every admin endpoint, asserting status codes |
| Auth | refresh-token reuse detection revokes the family |
| i18n | AR↔EN switch preserves state; RTL layout snapshot; reduced-motion snapshot |
| Dashboard | moderator sees two nav items and receives 403 from a direct `/menu-items` call |
| Load | k6 on `GET /menu` and `POST /reservations` at 200 concurrent |

### Article 27 — Definition of done

A task is done when: the API endpoint exists and is in the OpenAPI spec; types are regenerated;
the UI consumes the real endpoint (no mock data left behind); both locales render correctly in
both directions; the mandatory tests for that area pass; the audit log fires where Article 12
requires; and `pnpm lint && pnpm typecheck && pnpm test && pnpm build` is green.

## Part VIII — Delivery

### Article 28 — Deployment and migrations

CI runs lint → typecheck → test → build on every PR. Deploy on merge to `main`. **Database
migrations run as a separate, explicitly approved step — never automatically on deploy.** The
WordPress site stays live on the apex domain until cutover; the new build runs on
`new.pasccarestaurant.com` first.

### Article 29 — Deliverables to the client

Not just code. The project is not complete without: the three tagged Postman collections
(`public`, `customer`, `admin`) generated from the OpenAPI spec; a one-page Arabic operations
handbook for the dashboard; a 20-minute recorded walkthrough; and admin credentials handed over
through a channel that is not WhatsApp plaintext.

## Governance

### Article 30 — Amendment

This constitution supersedes all other practices. Amending it requires: a written statement of
the article and the reason, an assessment of what breaks, a version bump below, and — for any
article marked **[NN]** or for Article 18 — client sign-off.

Claude Code MUST NOT amend this file as part of a `/speckit-implement` run. If implementation is
blocked by an article, **stop and report**; do not route around it.

**Versioning policy:**

- **MAJOR** — an article is removed, or its rule is redefined in a way that invalidates shipped
  code or a shipped API contract.
- **MINOR** — an article is added, or existing guidance is materially expanded.
- **PATCH** — clarification, wording, or typo fixes with no change in obligation.

**Compliance review:** checked at `/speckit-plan` (does the plan respect every article?),
`/speckit-analyze` (has drift appeared between spec, plan, and tasks?), and PR review (does the
diff violate anything?). A PR that violates an [NN] article does not merge.

**Runtime guidance:** `CLAUDE.md` at the repository root carries the day-to-day working rules
derived from this file. Where the two disagree, this file wins and `CLAUDE.md` is the bug.

**Changelog**

- `1.0.0` — 2026-08-08 — Ratified. Design system locked to the approved cream/gold direction
  (Articles 17–20). Covers `api`, `web`, `admin`; `mobile/` inherits Parts I–III and VII.

**Version**: 1.0.0 | **Ratified**: 2026-08-08 | **Last Amended**: 2026-08-08
