# Contract: `lib/content` Accessor Functions

`apps/web/src/lib/content/index.ts` is the *only* module any page or component may import to
read content (FR-020, FR-021). Today every function reads the fixture; the day a real API
exists, each function's *body* changes to a `fetch`/`openapi-fetch` call while every signature
below stays identical — that is the whole point of the seam (SC-008). A future feature is free
to change an implementation; changing one of these signatures is a breaking change to this
contract.

```ts
// apps/web/src/lib/content/index.ts

import type {
  PageBlockDTO, MenuItemDTO, CategoryDTO, BranchDTO, TestimonialDTO,
  FaqItemDTO, MilestoneDTO, TeamMemberDTO, GalleryAlbumDTO,
} from "@pascca/types/content";

/** All PageBlock rows for one page, in Article 18 section order. Never returns an empty array
 *  for a known page — every page's every section has a seeded/fixture default (FR-023). */
export function getPageBlocks(page: PageName): PageBlockDTO[];

/** MenuItems where isFeatured is true, ordered by featuredRank (Article 13 [NN] — human
 *  curation only, never computed here). */
export function getFeaturedDishes(): MenuItemDTO[];

/** Every Category with its MenuItems attached, in Article 18's fixed category order. */
export function getMenu(): { category: CategoryDTO; items: MenuItemDTO[] }[];

/** Both branches, in the order files/site displays them (Shobra, then Heliopolis). */
export function getBranches(): BranchDTO[];

/** Published testimonials (consentGiven === true only — Article 13 [NN] is enforced even at
 *  the fixture layer, not just imagined for the future API). */
export function getTestimonials(): TestimonialDTO[];

/** FAQ items for one page ("home" | "reservations" — the only two Article 18 assigns one to). */
export function getFaq(page: "home" | "reservations"): FaqItemDTO[];

/** One gallery album's images, or every album's images concatenated if no slug given. */
export function getGallery(albumSlug?: string): GalleryAlbumDTO[];

/** Milestones in chronological order (About page's stats-list panel). */
export function getMilestones(): MilestoneDTO[];

/** Team members, in files/site's display order. */
export function getTeam(): TeamMemberDTO[];

type PageName =
  | "home" | "menu" | "about" | "gallery" | "branches"
  | "reservations" | "contact" | "legal";
```

## Guarantees every implementation (fixture today, fetch later) must hold

1. **Synchronous today, `Promise`-returning after the seam swap is a breaking change** — noted
   explicitly so the future feature that does the swap knows to update every call site's
   `await`, not silently break page rendering. (Not a constraint on *this* feature; a note for
   whoever crosses the seam next.)
2. Every function is pure with respect to its arguments — no hidden request-context, cookies,
   or locale state read from outside the explicit parameter list. (Locale itself is deliberately
   out of these signatures — only `xEn` is populated in any locale today; the day `ar` content
   exists, these functions gain a `locale` parameter as an additive change, not a breaking one.)
3. `getPageBlocks`/`getFaq` never throw for a *known* `page` value — an unknown value is a
   caller bug (TypeScript's `PageName` union already prevents it at compile time for any code
   inside this repo).
