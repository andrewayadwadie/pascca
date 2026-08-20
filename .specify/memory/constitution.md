<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 (2026-08-08) → 2.0.0 (2026-08-09)
Bump rationale: MINOR. Design system relocked; product positioning clarified (pricing
visibility, brand voice, three-tier content model). No shipped code to break (MVP not yet
started). Articles reordered (reduced from 30 to 34, Parts I–VIII instead of I–IX). Old
Part IV (Public website) merged into new Part IV structure with emphasis on brand.

Principles redefined:
  Old Art 1 (Scope) → New Art 1 (What we building) — simplified scope, emphasised 4 jobs
  Old Art 2 (Fasting) → removed from first position; now implied by content model
  New Art 2 (Brand positioning) — replaces fasting focus; adds pricing + voice rules
  Old Art 14 (Bilingual) → New Art 21 (English first, Arabic-ready) — inverted direction
       (en launches, ar infrastructure built but disabled behind flag)
  Old Art 17 (Token set) — tokens themselves fully rewritten (dark/gold vs cream/gold)
  New Art 12 (Content 3-tiers) — replaces implicit content handling with explicit rules
  New Art 5 (Tech track) — makes the stack prescriptive and amendable only by constitution

Added sections: Article 2 (Brand positioning), explicit Tech track (Article 5 new content),
three-tier model (Article 12), delivery surfacing (Article 23), blog flag (Article 24),
explicit confirmation policy (Article 26), email-first notifications (Article 27).

Removed sections: none. Parts renamed for clarity. Restructured governance.

Templates requiring updates:
  ✅ CLAUDE.md — done 2026-08-10 with this amendment. Stack table rewritten to Article 5;
       "Non-negotiables" remapped (tokens 17→16, i18n 14→21 and inverted to English-first,
       permissions 10→14, errors 9→10, booking 11→25, audit 12→15); DoD 27→31; amendment
       article 30→34; migrations 28→32.
  ✅ .specify/templates/plan-template.md — done 2026-08-10 during /speckit-plan for
       001-monorepo-scaffold. Gate table rebuilt from 29 rows (v1 numbering) to 33 rows
       (v2 numbering); Technical Context updated to Node 22 / Fastify 5 / Prisma 6 /
       Next 15 / React 19 and English-first; source tree updated (packages/api-client,
       packages/config/{tsconfig,eslint}, messages/{en,ar}).
  ✅ .specify/templates/tasks-template.md — done 2026-08-10, same pass. 40 article
       references remapped to v2 numbering; risk-area test list updated to Article 30
       (adds confirmation policy, Tier-2 content fallback, testimonial consent, axe);
       i18n tasks inverted to en-default with ar behind a flag.
  ⚠ docs/api.md — PENDING. Article 10 error-code registry. Created (empty) by
       001-monorepo-scaffold; populated by the first API feature.
  ⚠ .env.example — PENDING. Created by 001-monorepo-scaffold, kept in sync by test.
  ⚠ packages/config/tokens.css — PENDING. The Article 16 block below is normative until
       001-monorepo-scaffold creates the file verbatim from it.

Follow-up TODOs: none deferred. All bracket tokens replaced. All articles numbered and
assigned to parts. Version and amendment dates set.

Correction note (2026-08-10): the three ✅ template rows above were originally written as
already-done in the same pass that produced this version, before the edits had actually been
made. They were completed during /speckit-plan for 001-monorepo-scaffold and verified by
scanning both templates for stale v1 article references. Recorded rather than quietly fixed.
-->

# PASCca Constitution

## Core Principles

This constitution governs the PASCca platform: one backend (`apps/api`) serving a public marketing website (`apps/web`), a role-based admin dashboard (`apps/admin`), and — from Phase 8 — a Flutter mobile app (`mobile/`). It supersedes all other practices, conventions, and developer preference.

**Marker legend:**

- **[NN]** — non-negotiable. Amending the article requires client sign-off (Article 34).
  A pull request that violates an [NN] article is rejected, not discussed.
- Unmarked articles are binding but amendable by written agreement inside the team.

**Compliance is checked at three points:** `/speckit-plan` (does the plan respect every article?), `/speckit-analyze` (has drift appeared between spec, plan, and tasks?), and PR review (does the diff violate anything?).

**Scope:** `apps/api`, `apps/web`, `apps/admin` are bound by all eight parts. `mobile/` inherits Parts I–III and Part VII.

## Part I — Product

### Article 1 — What we are building [NN]

One backend serving three clients: a public marketing website, a role-based admin dashboard, and from Phase 8 a Flutter app. The client is Pascca, an Italian restaurant with two Cairo branches (Shobra since 2018, Heliopolis/El-Nozha).

The site has exactly four jobs, in priority order: 1) communicate the brand · 2) present the menu properly · 3) take a reservation · 4) open a contact channel. Any proposed feature that does not serve one of these is out of scope.

MVP scope is fixed: home, menu, about, gallery, branches, reservations, contact, legal, and the dashboard. Online ordering, payments, loyalty and delivery tracking are Phase 9.

### Article 2 — Brand positioning [NN]

Pascca is a cosy neighbourhood Italian restaurant, not a fine-dining room. Their own words — "freshly baked with love" — govern the copy. The visual language is dark and crafted; the voice is warm, plain and a little funny. Never write copy that implies expensive.

Consequences that are not negotiable:

- Prices are always visible. Hiding prices is a fine-dining convention and it will cost this client bookings. Every dish shows a price everywhere it appears.
- Signature guest-facing themes to lead with: the stone oven, breakfast, calzone, truffle pasta, occasions (birthdays, engagements, family tables), and delivery.
- Fasting (صيامي) and vegetarian dishes are marked and filterable, but they are a menu attribute, not the brand story.

### Article 3 — The client owns their content [NN]

Anything the client could want to change without a developer must be editable in the dashboard. Hardcoded content in a component is a defect. See Article 12 for the three-tier split that makes this safe.

## Part II — Architecture

### Article 4 — API-first [NN]

The website is the API's first client, not its owner. No feature is complete until it is reachable through a documented, versioned endpoint a mobile app could call. Forbidden: web-only shortcut endpoints, server actions that hit Prisma directly, data rendered to HTML with no JSON equivalent.

Compliance test: could the Flutter app deliver this feature with zero backend changes? If no, it isn't done.

### Article 5 — Tech track [NN]

Chosen to match existing production experience. Substitutions require an amendment.

| Layer | Locked choice |
|---|---|
| Runtime | Node.js 22 LTS · TypeScript strict |
| API framework | Fastify 5 + fastify-type-provider-zod |
| ORM / DB | Prisma 6 · PostgreSQL 16 |
| Cache, locks, queues | Redis 7 · BullMQ |
| Auth | JWT access 15m + rotating refresh 30d |
| Storage | Cloudflare R2, presigned uploads, sharp → WebP/AVIF |
| Docs | @fastify/swagger → OpenAPI 3.1 (source of truth) |
| Public web | Next.js 15 App Router · Tailwind 4 · Motion · next-intl · TanStack Query |
| Dashboard | Vite + React 19 SPA · TanStack Query + Table · shadcn/ui · dnd-kit |
| Shared | packages/types generated from OpenAPI · packages/api-client (openapi-fetch) · packages/config (tokens, eslint, tsconfig) |
| Monorepo | pnpm workspaces + Turborepo |
| Mobile (Ph. 8) | Flutter · Clean Architecture · Cubit/Bloc · Freezed · Dio/Retrofit · Injectable/GetIt · GoRouter |
| Email | Transactional provider (Resend or equivalent) |
| Errors / uptime | Sentry · UptimeRobot on /health |

### Article 6 — Project structure [NN]

```
pascca/
├─ .specify/                     constitution, specs, plans, tasks
├─ apps/
│  ├─ api/
│  │  ├─ prisma/{schema.prisma,migrations,seed.ts}
│  │  └─ src/
│  │     ├─ modules/             auth users branches categories menu
│  │     │                       reservations gallery testimonials posts
│  │     │                       content contact settings uploads audit
│  │     ├─ plugins/             auth rbac prisma redis swagger ratelimit errors
│  │     ├─ lib/                 jwt hash storage mailer slugify availability
│  │     ├─ config/env.ts        Zod-validated, fails fast
│  │     └─ app.ts server.ts
│  ├─ web/src/{app/[locale],components,lib,messages,styles}
│  └─ admin/src/{routes,features,components,lib,hooks}
├─ packages/{types,api-client,config}
├─ docs/{api.md,openapi.json,postman/,adr/}
├─ docker-compose.yml            postgres + redis + minio
└─ turbo.json  pnpm-workspace.yaml
```

### Article 7 — Module boundaries [NN]

Every API module is exactly four files:

```
<name>.routes.ts       HTTP + swagger schema only. No business logic. No Prisma.
<name>.service.ts      Business rules. No req, no reply, no HTTP status codes.
<name>.repository.ts   Prisma only. No business rules.
<name>.schema.ts       Zod DTOs, in and out.
```

Reject on sight: Prisma in a route, reply.code() in a service, a business if in a repository, a service importing another module's repository. Cross-module reads go through the other module's *service*.

### Article 8 — One source of truth [NN]

| Concern | Single source |
|---|---|
| Data shape | prisma/schema.prisma |
| API contracts | Zod → TS types → OpenAPI 3.1 |
| Shared types | packages/types, generated |
| Design values | packages/config/tokens.css (Article 16) |
| UI chrome strings | messages/{en,ar}.json |
| Content | the database, via the dashboard |

Hand-written interfaces duplicating Prisma models are forbidden.

### Article 9 — Versioning [NN]

All endpoints under /api/v1. Once the mobile app ships, v1 is frozen: fields may be added, never removed, renamed, or retyped. Breaking changes require /api/v2 alongside.

### Article 10 — Errors are contracts [NN]

```jsonc
{ "success": true,  "data": {…}, "meta": { "page":1, "limit":20, "total":42 } }
{ "success": false, "error": { "code":"RES_SLOT_UNAVAILABLE", "message":"…", "details":[] } }
```

Clients switch on code, never on message. Codes are permanent once shipped. Maintain the register in docs/api.md; a thrown error without a registered code is a bug.

### Article 11 — Phase discipline

Build the phase in front of you. Do not create Order tables while building reservations. The schema must be designed so ordering can be added without altering existing tables — satisfied by design review, not by writing code early.

## Part III — Content Model & Dashboard

### Article 12 — Content is three tiers, not one [NN]

"Everything editable" without structure destroys a design in a week. Content is split:

**Tier 1 — Entities.** Full CRUD, own dashboard screens: Branch · BranchHour · BranchClosure · Category · MenuItem · MenuItemVariant · MenuItemBranch · GalleryAlbum · GalleryImage · Testimonial · FaqItem · TeamMember · Milestone · Post · Reservation · ContactMessage · User · AuditLog

**Tier 2 — Page copy.** A PageBlock model keyed (page, block, field) editing headline, eyebrow, sub-copy, CTA label and CTA target for each named section, plus per-page SEO title, description and OG image. Rendered through a <Block> component that falls back to a seeded default if empty. Character limits are enforced server-side per field so no one can paste a paragraph into a headline.

**Tier 3 — UI chrome.** Nav labels, form labels, button micro-copy, validation messages, error strings. These live in i18n files and are not dashboard-editable. Attempting to move a Tier 3 string into the dashboard is a violation.

### Article 13 — Curation is manual [NN]

- Featured dishes on the home page are chosen by a human: isFeatured + featuredRank. No auto-ranking — we have no order data until Phase 9, and the client wants control.
- Testimonials are entered manually into a Testimonial model (author, source, rating, quote, branch, consentGiven, publishedAt). Never scraped, never pulled live from Google. A testimonial without consentGiven = true cannot be published — the API rejects it.
- Gallery is organised into albums (The food, The rooms, Breakfast, Occasions) with drag-ordering and an optional branch tag per image.

### Article 14 — Dashboard rules [NN]

apps/admin is a pure API client: no business logic the API doesn't also enforce, no DB access, no SSR. It deploys independently of the public site.

Permissions are data, not conditionals — requirePermission('menu:write') against a seeded role→permissions map. if (user.role === 'ADMIN') in a handler is forbidden.

| Permission | ADMIN | MODERATOR | CUSTOMER |
|---|---|---|---|
| reservation:read/create/update | ✅ | ✅ | own only |
| reservation:delete | ✅ | ✅ (≤24h old) | ❌ |
| message:read/update | ✅ | ✅ | ❌ |
| menu:write category:write gallery:write branch:write content:write | ✅ | ❌ | ❌ |
| testimonial:write team:write post:write | ✅ | ❌ | ❌ |
| user:* settings:write audit:read | ✅ | ❌ | ❌ |

Enforced in three independent layers — API preHandler (the real gate), route guard, and UI rendering. A moderator must not see a disabled control; it is not rendered at all. An ADMIN cannot delete their own account, and the last active ADMIN cannot be demoted.

Operator ergonomics are requirements, not polish: optimistic status updates with rollback; live new-booking feed over SSE with sound and browser notification; 5-second undo toast on delete; drag-reorder for menu and gallery; one-tap availability toggle (86-ing a dish in under three seconds); CSV export; / focuses search, c opens new booking, Esc closes any modal.

### Article 15 — Every destructive action is reversible and recorded [NN]

Admin deletes are soft deletes with a 30-day window. Every create/update/delete on Tier 1 and Tier 2 content writes an AuditLog (actor, entity, id, JSON diff). Reservation status changes also write a ReservationEvent. staffNotes and audit data never leave via public or customer endpoints.

## Part IV — Design System

### Article 16 — The token set is locked [NN]

Every colour, font, radius and easing derives from packages/config/tokens.css. No component may introduce a raw hex, a one-off font stack, or an arbitrary radius.

The base surface is **light and warm**. Dark is retained as a named *treatment*, not the default: any section may opt into it with `data-surface="dark"`, which reassigns the same token names to the original dark values. Components therefore never branch on surface — they read the same tokens either way.

```css
:root{
  /* surfaces — light warm base */
  --bg:#FBF7F0; --surface:#FFFFFF; --surface-2:#F4EDE2; --surface-3:#EAE0D1;
  /* accent — the only accent */
  --gold:#D4AF37; --gold-2:#F4A460; --gold-dim:rgba(212,175,55,.12);
  --gold-ink:#77621F;   /* gold-family TEXT on light — AA on every light surface. Never body copy. */
  /* ink — always reads on the current surface */
  --w:#161210; --w70:rgba(22,18,16,.8); --w60:rgba(22,18,16,.7);
  --w50:rgba(22,18,16,.62); --w40:rgba(22,18,16,.61);
  --w20:rgba(22,18,16,.2); --w10:rgba(22,18,16,.1); --w06:rgba(22,18,16,.06);
  /* contrast — the solid fill that inverts the current surface */
  --contrast:#161210; --contrast-ink:#FBF7F0;
  /* geometry */
  --r-sm:14px; --r:24px; --r-lg:32px; --pill:999px;
  --pad:clamp(20px,5vw,80px); --maxw:1440px;
  /* motion */
  --spring:cubic-bezier(0.175,0.885,0.32,1.275); --ease:cubic-bezier(.22,1,.36,1);
}

/* the dark treatment — the v2.0.0 values, preserved, now scoped */
[data-surface="dark"]{
  --bg:#0A0A0A; --surface:#141414; --surface-2:#1B1B1B; --surface-3:#232323;
  --gold-ink:var(--gold);
  --w:#FFFFFF; --w70:rgba(255,255,255,.7); --w60:rgba(255,255,255,.6);
  --w50:rgba(255,255,255,.5); --w40:rgba(255,255,255,.55);
  --w20:rgba(255,255,255,.2); --w10:rgba(255,255,255,.1); --w06:rgba(255,255,255,.06);
  --contrast:#FFFFFF; --contrast-ink:#000000;
}
```

Type: display Zodiak 400/700 + italics (h1–h4, prices, pull-quotes) · body & UI Plus Jakarta Sans 400–700. Zodiak must be self-hosted as woff2 in apps/web/public/fonts with font-display:swap and a size-adjust fallback — no third-party font CDN in production. Uppercase labels use letter-spacing between .18em and .4em.

Structural rules: gold is the only accent, and gold is never body copy on any surface — use --gold-ink for gold-family text on light. Cards are --surface with a 1px --w06 border and --r-lg; buttons are pills. Solid inverting buttons and bars use --contrast/--contrast-ink, never --w, so they survive both treatments. No decorative gradients — gradients appear only as photographic overlays or the ambient gold radial glow. One shadow recipe for elevation, one for the floating plate.

Surface discipline: photography-led sections default to light. The dark treatment is reserved for the footer, evening/dinner sections, and the reservation panel — a deliberate change of register, not decoration. A section that opts into dark opts into the dark ink scale with it, automatically, so contrast holds at every boundary.

### Article 17 — Signature components [NN]

These are part of the brand, not the page:

- 3D floating plate. perspective:1000px container; circular image up to 550px; filter: drop-shadow(0 25px 50px rgba(0,0,0,.5)); 3s float keyframe; on hover translateY(-15px) rotate(2deg) scale(1.05) over 500ms with --spring; behind it a gold radial at 5% opacity with 120px blur.
- Floating badges anchored to the plate, one rotated −6°, animating on offset delays.
- Glassmorphism nav — the current surface at .95 alpha (--bg-95, which the dark treatment reassigns) + 10px backdrop blur, centred wordmark with the gold RISTORANTE sub-label at .4em.
- Mobile floating CTA bar — fixed pill at bottom:24px, --surface glass, two equal buttons: Menu (white) and Book (gold), both uppercase and letterspaced. Shown ≤1100px.
- Designed image placeholder — correct aspect ratio, a labelled slot, never a broken icon.

### Article 18 — Page inventory and section order [NN]

Eight pages, one design system. Changing the section order of a page requires client sign-off.

| Page | Sections in order |
|---|---|
| / | Hero (3D plate) · Press strip · Signature dishes · Story panel · Breakfast · Occasions · Testimonials · Delivery · FAQ · Reservation CTA |
| /menu | Page hero · Filter bar · Category groups (pizza, calzone, pasta, mains, starters, breakfast, desserts, drinks) · CTA |
| /about | Page hero · Story + photo mosaic + metric · Values ×4 · Milestones · Team · CTA |
| /gallery | Page hero · Album filters · Masonry grid · Instagram CTA |
| /branches | Page hero · Two branch cards · Map · Large-groups panel |
| /reservations | Page hero · How-it-works + booking form · Booking FAQ |
| /contact | Page hero · Contact rail + message form · Branch cards |
| /legal | Page hero · Privacy notice · Terms |

Every page carries the same nav, footer, mobile CTA bar and page-hero pattern.

### Article 19 — Motion budget [NN]

Budgeted, not frozen. Ten items. Adding an eleventh means removing one.

1. Hero load stagger (~1.1s)
2. Plate float + hover
3. Ambient gold glow
4. Scroll reveal, one-shot, 12% threshold
5. Staggered card entrance
6. Accordion max-height, one open at a time
7. Micro: card lift on --spring, image scale on hover, arrow nudge, filter pill transition
8. Spring-physics gesture response on dish cards and the gallery lightbox
9. Scroll-linked reveal on the signature-dish and breakfast sections
10. Video hero — muted, looped, playsinline, poster-first

A motion library is permitted, for items 8–10 only. It must be tree-shakeable, lazy-loaded below the fold, and absent from the initial route bundle of any page that does not use it.

Video rules, all mandatory: the poster image is the LCP element and the video attaches only after it paints; `muted` + `playsinline` + `loop` + `preload="none"`; ≤ 2.5 MB and ≤ 12 s per clip, H.264 with a WebM sibling; no autoplay when `navigator.connection.saveData` is set; and the still poster is a complete experience on its own. Video never carries information nothing else carries.

@media (prefers-reduced-motion: reduce) disables all ten items and pins every video to its poster frame. Parallax, scroll-jacking, cursor trails and page-transition overlays remain prohibited — they hurt LCP on the mobile-first audience, and nothing in the brief needs them.

Article 28's Lighthouse floor still governs. If the video hero cannot hold mobile performance ≥ 95, the video is cut before the target is.

### Article 20 — Images [NN]

The client has ~169 Instagram posts and 78K followers across Meta — request the Meta media archive before commissioning any photography.

- Every slot has a designed placeholder with correct aspect ratio and a visible label.
- All images served from R2 as WebP/AVIF in three sizes (thumb 400 / card 900 / full 1800), through next/image with explicit width, height and a blurHash.
- Every image carries altEn (and altAr once Arabic ships). Decorative images use a deliberate alt="".
- CLS from images must be zero.

## Part V — Web Behaviour

### Article 21 — English first, Arabic-ready [NN]

The site launches in English only. It is nonetheless built i18n-complete from day one:

- routes are /[locale]/…, en default, ar registered and disabled behind a flag;
- content models carry _en and _ar columns from the first migration;
- all UI strings live in messages/en.json; no literal user-facing string in a component;
- layout uses logical properties only (margin-inline-start, padding-block, inset-inline-end, text-align:start). margin-left in a layout context is a violation;
- the Arabic font stack is declared and bound to html[lang="ar"] even while unused.

Turning Arabic on later must be a content-entry task, never a rebuild.

### Article 22 — Rendering and SEO [NN]

Menu, gallery, branches, FAQ, testimonials, posts and page copy → ISR, revalidate: 60, plus on-demand revalidation webhook fired when the dashboard saves. Availability lookup and booking submission are client-side and never cached.

Required on every deploy:

- LocalBusiness + Restaurant JSON-LD per branch (address, geo, hours, phone, aggregateRating, servesCuisine, priceRange); Menu/MenuItem JSON-LD on /menu; FAQPage on the FAQ blocks.
- Unique title and meta description per page, driven by Tier 2 PageBlock SEO fields.
- sitemap.xml and robots.txt generated, never hand-written. OG images via next/og.
- The legacy WordPress path /pasca-menu/ 301-redirects to /menu. Existing QR codes must not 404.

### Article 23 — Delivery is surfaced, not owned

Until Phase 9, delivery is a linked band pointing at talabat and elmenus. These links live in SiteSetting so they can be swapped or removed from the dashboard the day own-ordering launches.

### Article 24 — Blog exists in the model, not the nav

Post is modelled and CRUD-able from day one. The public /blog route ships behind a feature flag, off by default. An abandoned blog is worse than no blog; it turns on when the client commits to publishing.

## Part VI — Reservations

### Article 25 — Booking correctness over booking speed [NN]

Availability and insertion happen in one transaction guarded by a per-branch-per-day advisory lock (pg_advisory_xact_lock). Availability is seat-overlap, not a naive slot table:

```
bookedSeats = SUM(partySize) WHERE branchId = ?
              AND status IN (PENDING, CONFIRMED, SEATED)
              AND reservedAt < slotEnd AND reservedAt + durationMin > slotStart
```

Two simultaneous requests for the last seats must yield exactly one confirmation and one 409 RES_SLOT_UNAVAILABLE, proven by a test firing genuinely concurrent requests. Past-midnight closing (Shobra closes 2am), branch closure dates, and a 60-minute lead time on same-day bookings are part of the calculation, not later edge cases.

### Article 26 — Confirmation policy [NN]

- Party ≤ 6 → auto-confirmed, status CONFIRMED immediately.
- Party > 6 → status PENDING with requiresCall = true; the UI says a member of staff will phone; the dashboard surfaces these at the top of the queue.
- Tables are held 15 minutes past the booked time; durationMin defaults to 90.
- Table assignment is manual in v1. Seat capacity per branch drives availability; DiningTable exists but auto-assignment is out of scope.

### Article 27 — Notifications [NN]

v1 ships dashboard + transactional email only. WhatsApp Business API is a Phase 6 add-on and launch must never be blocked on Meta approval. The notification layer is written against a NotificationChannel interface so adding WhatsApp is a new adapter, not a refactor. No user-facing copy anywhere may promise WhatsApp confirmation until that adapter is live.

## Part VII — Quality, Security, Delivery

### Article 28 — Quality floor [NN]

- Lighthouse ≥95 performance / 100 accessibility / 100 SEO on mobile, on the deployed build.
- LCP < 2.0s on throttled 4G · CLS < 0.05 · no font-swap shift.
- Works at 320px. Keyboard-only usable. Visible focus on every interactive element.
- Real <label> on every control; aria-label on every icon-only button; accordion, modal and filter state correctly announced.
- WCAG AA contrast. Gold on --bg is permitted for large display text, prices, borders and icons — never for body copy. Body copy uses --w, --w70 or --w60; --w20 is decorative only.

### Article 29 — Security baseline [NN]

Helmet · CORS allow-list, never * · rate limits (5/min on POST /reservations, /contact, all /auth/*) · argon2 hashing · refresh rotation with reuse detection and family revocation · httpOnly + SameSite cookies for web, secure storage for mobile · Zod on every input including query and params · no raw SQL interpolation · presigned uploads with MIME allow-list, size cap and server-side sniffing · EXIF stripped · no PII in logs · nightly pg_dump to R2, 30-day retention, restore rehearsed before launch.

The privacy notice must be live before the site is public — we collect guest phone numbers, with a stated retention period (reservations 12 months, messages 6 months).

### Article 30 — Tests where the risk is

Mandatory; a phase is not complete without them.

| Area | Test |
|---|---|
| Availability | slot generation incl. past-midnight close, closures, same-day lead time |
| Booking | genuinely concurrent requests for the last seats → exactly one winner |
| Confirmation | party ≤6 auto-confirms, >6 stays PENDING with requiresCall |
| Permissions | every role × every admin endpoint, asserting status codes |
| Auth | refresh reuse detection revokes the family |
| Content | Tier 2 PageBlock falls back to seeded default when empty; length limits enforced |
| Testimonials | publishing without consentGiven is rejected |
| i18n | locale routing works with ar disabled; no hardcoded strings (lint rule) |
| a11y | axe clean on all eight pages; reduced-motion snapshot |
| Load | k6 on GET /menu and POST /reservations at 200 concurrent |

### Article 31 — Definition of done

Endpoint exists and is in the OpenAPI spec · types regenerated · UI consumes the real endpoint with no mock data left · content is dashboard-editable per Article 12 · mandatory tests pass · audit log fires where Article 15 requires · pnpm lint && typecheck && test && build green.

### Article 32 — Deployment

CI: lint → typecheck → test → build on every PR; deploy on merge to main. Migrations run as a separate, explicitly approved step — never automatically on deploy. WordPress stays live on the apex domain until cutover; the new build runs on new.pasccarestaurant.com first.

### Article 33 — Deliverables to the client

Not just code. Required at handover: three tagged Postman collections (public, customer, admin) generated from the OpenAPI spec; a one-page operations handbook for the dashboard; a 20-minute recorded walkthrough; and credentials handed over through a channel that is not plaintext WhatsApp.

## Part VIII — Governance

### Article 34 — Amendment

Amending requires a written statement of the article and reason, an assessment of what breaks, a version bump, and — for any [NN] article or Article 18 — client sign-off.

Compliance is checked at three points: /plan (does the plan respect every article?), /analyze (has drift appeared between spec, plan and tasks?), and PR review.

## Changelog

- `3.0.0` — 2026-08-19 — **Design direction inverted.** Light warm base; dark demoted to a scoped `data-surface="dark"` treatment (Art. 16, 17). Motion budget widened 7 → 10 items, permitting a lazy-loaded motion library and a poster-first video hero (Art. 19). Client sign-off recorded 2026-08-19.
  - *Unchanged:* gold #D4AF37 as the only accent, Zodiak, Plus Jakarta Sans, all geometry and easing values, Art. 18 page order, Art. 20 image pipeline, Art. 28 quality floor. No token name was removed — only rebound.
  - *Reason:* the brand's own Instagram (26.3K followers, breakfast/brunch-led, bright food photography) is the strongest asset the product has, and a black base fought it while implying a price point the restaurant does not charge (EGP 200–400/person) — straining Art. 2.
  - *Assessed breakage:* `packages/config/tokens.css` rewritten; the three `--w`-as-background rules in `apps/web/src/styles/globals.css` move to `--contrast`; `ImageSlot` tone gradients were tuned against black and need re-checking on the light base; `specs/004-web-design-system-port` assertions that name dark surfaces are now stale and must be re-read, not silently trusted.
- `2.0.0` — 2026-08-09 — Design system relocked to the dark/gold Delizoso direction (Art. 16–19). Added: brand positioning and visible pricing (Art. 2), tech track (Art. 5), three-tier content model (Art. 12), manual curation and testimonial consent (Art. 13), English-first/Arabic-ready (Art. 21), delivery surfacing (Art. 23), feature-flagged blog (Art. 24), confirmation policy (Art. 26), email-first notifications (Art. 27).
- `1.0.0` — 2026-08-08 — Ratified.

**Version**: 3.0.0 | **Ratified**: 2026-08-08 | **Last Amended**: 2026-08-19
