// Hand-written content DTO (research R6) — see src/content/index.ts.
export type PageName =
  | "home"
  | "menu"
  | "about"
  | "gallery"
  | "branches"
  | "reservations"
  | "contact"
  | "legal";

export interface PageBlock {
  page: PageName;
  /** Section key within the page, in Article 18 order. Reuses the exact keys
   *  apps/api/prisma/seed/page-content.ts already defined. */
  block: string;
  headlineEn: string;
  headlineAr: string | null;
  /** Substring of `headlineEn` rendered gold-italic (FR-011, contracts/component-api.md's
   *  "Gold-italic headline convention"). `null` where the source headline carries no <em>. Not
   *  itemised in data-model.md's original field table — added here because every headline-
   *  accepting component (SectionHead, PageHero, HomeHero) freezes an `emphasis` prop that has
   *  to read from *something*, and a JSX-literal substring would defeat FR-025. */
  emphasisEn: string | null;
  eyebrowEn: string | null;
  eyebrowAr: string | null;
  subEn: string | null;
  subAr: string | null;
  ctaLabelEn: string | null;
  ctaLabelAr: string | null;
  /** Locale-agnostic route; not bilingual (matches PageSeo/PageBlock's own schema comment). */
  ctaHref: string | null;
  /** Fixed by Article 18 — the fixture's array order IS the section order. */
  sortOrder: number;
}

export interface PageSeo {
  page: PageName;
  titleEn: string;
  descriptionEn: string;
}
