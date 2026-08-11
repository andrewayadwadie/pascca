# Data Model: Web Design System Port

Not a database model — this feature touches no migration. These are the **content-fixture DTO
shapes** this feature defines in `packages/types/src/content/` (hand-written, R6) and populates
with real data in `apps/web/src/content/*.ts` (R7/R8). Every field name is chosen to match the
already-shipped `apps/api/prisma/schema.prisma` model of the same name field-for-field (R5), so
a future feature that replaces a fixture accessor with a real `fetch` needs zero reshaping.

Where a field exists in the real Prisma model but has no value in `files/site/` (e.g.
`allergens`, `prepMinutes`, `whatsapp`), it is simply omitted from the fixture — nothing in this
feature invents data the source doesn't have.

## PageBlock

| Field | Type | Notes |
|---|---|---|
| `page` | `string` | One of `home`, `menu`, `about`, `gallery`, `branches`, `reservations`, `contact`, `legal` |
| `block` | `string` | Section key within the page (Article 18 order). Reuses the exact keys `apps/api/prisma/seed/page-content.ts` already defined (`hero`, `press-strip`, `signature-dishes`, `story`, `breakfast`, `occasions`, `testimonials`, `delivery`, `faq`, `reservation-cta` for `home`; equivalents per other page) |
| `headlineEn` / `headlineAr` | `string` / `string \| null` | Required in English; `Ar` stays `null` |
| `eyebrowEn` / `eyebrowAr` | `string \| null` / `string \| null` | |
| `subEn` / `subAr` | `string \| null` / `string \| null` | The section's lede/sub-copy |
| `ctaLabelEn` / `ctaLabelAr` | `string \| null` / `string \| null` | |
| `ctaHref` | `string \| null` | Locale-agnostic route; not bilingual (matches `PageSeo`/`PageBlock`'s own schema comment) |
| `sortOrder` | `number` | Fixed by Article 18 — the fixture's array order IS the section order |

**Validation rule carried from FR-023**: `getPageBlocks(page)` returning no row for a requested
`block` key means the `<Block>` component renders that block's seeded default — never an empty
section. The fixture itself has no "missing" case (every Article-18 section for every page has
an entry), so this path is exercised by `<Block>`'s own defensive fallback, tested directly
against a stub that omits a key.

## MenuItem ("Dish")

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | Unique, matches `MenuItem.slug` |
| `categorySlug` | `string` | FK-equivalent to `Category.slug` |
| `nameEn` / `nameAr` | `string` / `string \| null` | |
| `descriptionEn` / `descriptionAr` | `string \| null` / `string \| null` | |
| `price` | `number` | **Int, piastres** — matches `MenuItem.price` exactly (R9); display divides by 100 |
| `isFasting` | `boolean` | صيامي |
| `isVegetarian` | `boolean` | |
| `isFeatured` | `boolean` | Home page's "Most loved" grid |
| `featuredRank` | `number \| null` | Human-curated order among featured items (Article 13 [NN]) |
| `imageSlot` | `{ ratio: string; tone: ImageTone; label: string; badge?: string }` | Drives `ImageSlot` |

**Validation rule**: every `MenuItem` has a non-null `price` (Article 2 [NN] — a priceless dish
is unrepresentable). The fixture's TypeScript type makes `price` non-optional, so this is a
compile-time guarantee, not a runtime check.

## Category

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | One of `pizza`, `calzone`, `pasta`, `mains`, `starters`, `breakfast`, `desserts`, `drinks` — Article 18's fixed order |
| `nameEn` / `nameAr` | `string` / `string \| null` | |
| `sortOrder` | `number` | |

## Branch

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | `shobra` \| `heliopolis` |
| `nameEn` / `nameAr` | `string` / `string \| null` | |
| `addressEn` / `addressAr` | `string` / `string \| null` | Real values from `files/site` (fixes the placeholder divergence — R8) |
| `phone` | `string` | |
| `mapUrl` | `string \| null` | Google Maps link, from `files/site/branches.html`'s `href` |
| `hoursLabel` | `string` | Display string (`"12pm — 2am"`, `"24 hours"`) — the real per-day `BranchHour` model is a 002 concern; this fixture only needs the label `files/site` shows |
| `ratingLabel` | `string \| null` | e.g. `"4.4★ · 76"` — display-only, not a structured rating field in this fixture |
| `deliveryAreaLabel` | `string \| null` | Shobra only, per source |

## Testimonial

| Field | Type | Notes |
|---|---|---|
| `author` | `string` | e.g. `"Tripadvisor guest"` — source uses role labels, not real names |
| `source` | `string` | `"Tripadvisor"` \| `"Restaurant Guru"` \| `"Instagram"` |
| `rating` | `number \| null` | 5 for every source entry (★★★★★) |
| `quoteEn` / `quoteAr` | `string` / `string \| null` | |
| `branchSlug` | `string \| null` | e.g. `"heliopolis"` |
| `consentGiven` | `boolean` | Always `true` in this fixture — Article 13 [NN] forbids publishing otherwise |

## FaqItem

| Field | Type | Notes |
|---|---|---|
| `page` | `string` | `home` or `reservations` — the only two pages with a FAQ block per Article 18 |
| `questionEn` / `questionAr` | `string` / `string \| null` | |
| `answerEn` / `answerAr` | `string` / `string \| null` | |
| `sortOrder` | `number` | |

## Milestone

| Field | Type | Notes |
|---|---|---|
| `year` | `number` | |
| `titleEn` / `titleAr` | `string` / `string \| null` | e.g. `"Shobra opens on Shobra Street"` |
| `descriptionEn` / `descriptionAr` | `string \| null` / `string \| null` | |
| `badge` | `string` | The `stats-list` right-hand value (`"01"`, `"★"`, `"24h"`, `"78K"`) |

## TeamMember

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | |
| `roleEn` / `roleAr` | `string` / `string \| null` | e.g. `"Head of Kitchen"` — `files/site/about.html` names roles, not people |
| `bioEn` / `bioAr` | `string \| null` / `string \| null` | |
| `imageSlot` | `{ ratio: string; tone: ImageTone; label: string }` | |

## GalleryAlbum / GalleryImage

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | `the-food` \| `the-rooms` \| `breakfast` \| `occasions` |
| `titleEn` / `titleAr` | `string` / `string \| null` | |
| `images[].tone` | `ImageTone` | Reuses `ImageSlot`'s tone enum |
| `images[].label` | `string` | e.g. `"Stone oven"` |
| `images[].badge` | `string \| null` | |

## Shared value types

```ts
type ImageTone = "warm" | "gold" | "stone" | "ember" | "herb" | "cream";
// matches files/site's .ph-warm … .ph-cream modifier classes exactly — no new tone invented.
```

## Relationships (fixture-level, informational only — no FK enforcement at this layer)

- `MenuItem.categorySlug` → `Category.slug`
- `Testimonial.branchSlug` / `TeamMember` (via its own branch reference, where source shows one)
  → `Branch.slug`
- `GalleryImage` has no branch tag in `files/site/gallery.html`'s masonry grid (no per-image
  branch badge shown) — the fixture omits it; the real `GalleryImage.branchId` field is
  nullable and unused by this feature's data.

## Reconciliation with existing seed data (R8)

`apps/api/prisma/seed/{branches,menu,gallery,page-content}.ts` currently hand-write their own
version of overlapping content. This feature's task list replaces those modules' literal arrays
with imports from `apps/web/src/content/*` (via the `@pascca/web/content/*` subpath, R7),
changing the *seeded values* for:

- `Branch.addressEn`, `phone`, coordinates (from unverified placeholders to `files/site`'s real
  values — the placeholders were explicitly marked `TODO(client-data)` in the source comment,
  so this is a fix, not a regression)
- `MenuItem.price` and copy (from 002's independently-chosen placeholder prices to
  `files/site/menu.html`'s literal prices)
- `PageBlock.value` copy (from 002's own on-brand-but-different pre-written copy to
  `files/site/`'s literal headline/lede text — required by this feature's Governing Rule:
  "Reproduce them faithfully")

No existing test asserts an exact copy string, price, address, or phone number (verified by
search) — every existing assertion is structural (row counts, `@@unique` shape, forbidden
Tier‑3 block names). This reconciliation is therefore additive-safe against 002's test suite.
