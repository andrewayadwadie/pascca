# Copilot instructions — PASCca

Bilingual (English-first, Arabic-ready) website, admin dashboard, and Phase 8 Flutter app for
**PASCca** — an Italian restaurant with two Cairo branches (Shobra since 2018, Heliopolis /
El-Nozha).

**`.specify/memory/constitution.md` v3.0.0 governs this repo and outranks this file.** Articles
marked `[NN]` are non-negotiable and need client sign-off to amend (Article 34). Read it before
suggesting anything structural. Related: [`CLAUDE.md`](../CLAUDE.md) (workflow + stack),
[`PRODUCT.md`](../PRODUCT.md) (product truth), [`.impeccable.md`](../.impeccable.md) (design
context + delivery track).

## Stack

Fixed by Article 5 — substitutions require a constitution amendment, not a preference.

- **Runtime** Node.js 22 LTS, TypeScript strict, pnpm + Turborepo
- **`apps/api`** Fastify 5 + fastify-type-provider-zod + Prisma 6 + PostgreSQL 16. Everything
  under `/api/v1`. OpenAPI 3.1 generated from Zod
- **`apps/web`** Next.js 15 App Router, `/[locale]/…` with `en` default and `ar` behind a flag,
  next-intl, ISR `revalidate: 60`
- **`apps/admin`** Vite + React 19 SPA, pure API client
- **`packages/types`** generated from OpenAPI — never hand-written (one deliberate exception:
  the hand-written `src/content/` sibling for content DTOs)
- **`packages/config/tokens.css`** the single source of design tokens
- Redis 7 + BullMQ · Cloudflare R2 + sharp · JWT access 15m / rotating refresh 30d
- Vitest · Playwright · `@axe-core/playwright` · k6

## Rules that get violated by accident

- **Scope (Art 1 [NN])** — ordering, payments, loyalty, delivery tracking are Phase 9. Not
  built, not scaffolded, not stubbed. Do not suggest "a small start" on any of them.
- **Prices always visible (Art 2 [NN])** — a dish rendered without its price is a defect. Copy
  never implies expensive; the restaurant is EGP 200–400 per person.
- **Content is DB-backed (Art 3 [NN])** — a hardcoded price, phone number, or hero string is a
  defect. Only UI chrome is hardcoded, in `messages/{en,ar}.json`.
- **API-first (Art 4 [NN])** — no server action touches Prisma. If the Flutter app could not do
  it with zero backend changes, it is not done.
- **Four-file modules (Art 7 [NN])** — `routes` / `service` / `repository` / `schema`. No Prisma
  in a route, no `reply.code()` in a service, no business `if` in a repository. Cross-module
  reads go through the other module's *service*.
- **Three content tiers (Art 12 [NN])** — Tier 1 Entities (full CRUD) · Tier 2 PageBlocks
  (dashboard copy, falls back to a seeded default) · Tier 3 UI chrome (i18n only). Never move a
  Tier 3 string into the dashboard.
- **Permissions are data (Art 14 [NN])** — `requirePermission('menu:write')`, never
  `if (user.role === 'ADMIN')`. Unauthorised UI is **not rendered**, not disabled. Seeded roles:
  `ADMIN` (all), `MODERATOR` (`reservation:*` + `message:read/update`), `CUSTOMER`.
- **Audit + soft delete (Art 15 [NN])** — every Tier-1/Tier-2 mutation writes an `AuditLog` JSON
  diff. 30-day soft-delete window. `staffNotes` and audit data never leave via public or
  customer endpoints.
- **Errors are contracts (Art 10 [NN])** — enveloped responses, permanent codes registered in
  `docs/api.md`. Clients switch on `code`, never on `message`.
- **Tokens are locked (Art 16 [NN])** — no raw hex, rgba, px radius, or cubic-bezier anywhere
  outside `packages/config/tokens.css`. Tailwind arbitrary values containing colour literals are
  forbidden and CI greps for them. Gold `#D4AF37` is the only accent and is **never** body copy —
  gold-family *text* uses `--gold-ink`. The base surface is light warm; the dark set is scoped to
  `[data-surface="dark"]`. `--w*` is ink on the **current** surface, not white — a solid
  inverting fill uses `--contrast`/`--contrast-ink`, never `--w`. Self-hosted fonts only, no CDN.
- **English first, Arabic-ready (Art 21 [NN])** — routes `/[locale]/…`, `ar` gated by
  `notFound()` not a redirect. Content strings carry `xEn`/`xAr` fields. **Logical CSS
  properties only** — `margin-left` in layout is a violation, and it is lint-enforced.
- **Booking (Art 25 [NN])** — availability by seat overlap inside one transaction under
  `pg_advisory_xact_lock`. Party ≤6 auto-confirms; >6 stays PENDING with `requiresCall`; 15-min
  hold; `durationMin` defaults to 90. The concurrency test fires real concurrent requests.
- **Page order (Art 18 [NN])** — the section order of all eight pages is fixed. Reordering or
  omitting a section requires client sign-off.
- **Migrations never run automatically on deploy (Art 32).**

## Definition of done (Art 31)

Endpoint exists and is in the OpenAPI spec · types regenerated · UI consumes the real endpoint
with no mock data left · both locales render correctly in both directions · Article 30 tests for
that area pass · audit log fires where Article 15 requires ·
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Workflow

Spec Kit drives every feature: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-analyze` → `/speckit-implement`. Specs live in `specs/NNN-slug/`. Branch numbering is
sequential. Compliance is checked at `/speckit-plan`, `/speckit-analyze`, and PR review.

Shell is Windows PowerShell 5.1 — no `&&`, no `??`, no ternary. Spec-kit `.ps1` files carry a
UTF-8 BOM; keep it when editing them.

---

## Design Context

### Users

Two audiences on the same eight routes, both mostly on a phone:

- **Cairo locals who already know Pascca** — deciding tonight. Price, distance, open-or-not, then
  call or book. Speed is the whole experience.
- **Discovery visitors from Instagram, Google, or a delivery app** — 26.3K people follow the
  Instagram account, and the food photography is what brought them. They arrive already looking
  at pictures. The site's job is to not be a downgrade from the feed.

Staff use `apps/admin`: non-technical operators editing menu, prices, images, and page copy, and
handling reservations. `ADMIN` has everything; `MODERATOR` is scoped to reservations and
messages — enforced through `requirePermission`, never a role check in a component.

### Brand Personality

**Warm · Generous · Unpretentious.**

Pascca is the place you go back to every week, not the place you save up for. Two facts anchor
this and neither may be softened: **EGP 200–400 per person**, and **prices are visible everywhere
a dish appears**. The voice is plain, warm, and quietly funny. Never luxury-formal, never scarce,
never "inquire for pricing."

The emotional goal is **appetite plus ease** — the visitor should feel hungry, and feel that
booking is a thirty-second job.

Pascca is **two restaurants in one day**: heavy breakfast and brunch (eggs, pancakes, pastries,
coffee) alongside the pizza and pasta. Design that tells only the dinner half is incomplete.

### Aesthetic Direction

**Light, warm, food-first — with dark kept as a deliberate accent, not a default.**

✅ Ratified in constitution **v3.0.0** (2026-08-19). `packages/config/tokens.css` implements it.
The light ink scale is solved for WCAG AA against `--surface-3`, not copied from the dark scale;
`scripts/check-token-contrast.mjs` enforces this in CI. See [`.impeccable.md`](../.impeccable.md).

- **Surfaces:** cream and warm off-white as the base; photography sits on light ground. Dark
  (`#0A0A0A` / `#141414`) is retained and used on purpose — footer, evening/dinner sections, the
  reservation panel.
- **Accent:** gold `#D4AF37` unchanged as the only accent. On light ground it needs a darker
  companion for text use. Gold is banned for body copy in both worlds — accessibility, not style.
- **Typography:** unchanged. **Zodiak** (self-hosted) for display, **Plus Jakarta Sans** for
  body. Zodiak reads better on cream than on black; this direction costs nothing typographically.
- **Photography is the design.** Real dish and interior photos via R2 → WebP/AVIF at three sizes
  with blurHash. Until they land, every slot renders a **designed placeholder** — never stock,
  never AI-generated food, never an empty box.
- **Motion:** reveal on scroll, staggered grids, dish-card hover, filter transitions, the 3D
  floating plate. All of it disabled under `prefers-reduced-motion`. A motion library plus video
  heroes are recorded but also pending amendment (Article 19); scroll-jacking and parallax stay
  banned regardless.
- **Bilingual by construction:** logical CSS properties only, so Arabic is a flag flip.

**Anti-references** — what this must not become:

- A dark "fine dining" site implying a price the restaurant does not charge. Direct Article 2
  violation, and the failure mode the current build is closest to.
- A template restaurant site: stock pasta photo, full-bleed hero with centered serif, three
  identical feature cards, a menu locked in a PDF.
- Scroll-jacked, parallaxed, or cursor-trailed. Motion that makes a hungry person wait is a
  broken button.
- Anything that hides prices or hours, or makes finding the nearer branch take more than one tap.

**Real proof to use, never to invent:** 4.1★ from 417 Google reviews · #120 of 8,156 Cairo
restaurants on Restaurant Guru · 26.3K Instagram followers · three consented guest testimonials ·
outdoor seating, wheelchair accessible, takeaway, delivery via talabat and elmenus.

**Never fabricate:** testimonials, customer names, press quotes, awards, benchmarks, review
counts, ratings, dish photography, prices, or delivery-coverage claims. If a slot needs content
that does not exist, it stays a designed placeholder or the section does not ship.

### Design Principles

1. **The photograph is the argument.** Pascca is sold by how the food looks. Layout frames
   photography rather than competing with it. A section with no real image is a deliberately
   designed absence — never a stock stand-in.
2. **Price is never hidden.** Every dish shows its price, everywhere it appears. Positioning, not
   data completeness. Non-negotiable.
3. **Two restaurants, one day.** Breakfast and dinner are both first-class — which is exactly why
   the palette needs both a light base and a dark treatment.
4. **Booking is thirty seconds.** From any page, on a phone, one hand. Party ≤6 confirms
   instantly; >6 says plainly that someone will call. No account, no funnel, no upsell.
5. **Motion serves appetite, never ego.** Every animation reveals food, confirms an action, or
   gets out of the way. If it delays a tap or costs a Lighthouse point without earning it, cut it.

### Accessibility floor (Art 28 [NN])

Verifiable on the deployed build, not asserted: zero axe violations on all eight routes ·
Lighthouse mobile ≥95 perf / 100 a11y / 100 SEO per route · fully keyboard-operable including the
accordion, both filter bars, and the gallery lightbox · works at 320px · CLS < 0.05 ·
`prefers-reduced-motion` disables the entire motion budget · contrast checked · gold never body
copy.
