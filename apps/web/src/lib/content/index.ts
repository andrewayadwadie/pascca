// The ONLY module any page or component may import to read content (FR-020/FR-021,
// contracts/content-accessors.md). Every function here reads a fixture today; the day a real
// API exists, only these function BODIES change to a fetch call — every signature below is
// frozen (contracts/content-accessors.md). Pages must never import apps/web/src/content/*
// directly.
import type {
  Branch,
  Category,
  FaqItem,
  GalleryAlbum,
  MenuItem,
  Milestone,
  PageBlock,
  PageName,
  PageSeo,
  TeamMember,
  Testimonial,
} from "@pascca/types/content";
import { branches } from "../../content/branches";
import { galleryAlbums } from "../../content/gallery";
import { faqItems, testimonials } from "../../content/marketing";
import { categories, menuItems } from "../../content/menu";
import { pageBlocks, pageSeo } from "../../content/page-blocks";
import { milestones, teamMembers } from "../../content/about";

/** All PageBlock rows for one page, in Article 18 section order. Never returns an empty array
 *  for a known page — every page's every section has a seeded/fixture default (FR-023). */
export function getPageBlocks(page: PageName): PageBlock[] {
  return pageBlocks
    .filter((b) => b.page === page)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** One page's SEO title/description (FR-046). */
export function getPageSeo(page: PageName): PageSeo | undefined {
  return pageSeo.find((s) => s.page === page);
}

/** MenuItems where isFeatured is true, ordered by featuredRank (Article 13 [NN] — human
 *  curation only, never computed here). */
export function getFeaturedDishes(): MenuItem[] {
  return menuItems
    .filter((item) => item.isFeatured)
    .slice()
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));
}

/** Every Category with its MenuItems attached, in Article 18's fixed category order. */
export function getMenu(): { category: Category; items: MenuItem[] }[] {
  return categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      category,
      items: menuItems.filter((item) => item.categorySlug === category.slug),
    }));
}

/** Both branches, in the order files/site displays them (Shobra, then Heliopolis). */
export function getBranches(): Branch[] {
  return branches;
}

/** Published testimonials (consentGiven === true only — Article 13 [NN] is enforced even at
 *  the fixture layer, not just imagined for the future API). */
export function getTestimonials(): Testimonial[] {
  return testimonials.filter((t) => t.consentGiven);
}

/** FAQ items for one page ("home" | "reservations" — the only two Article 18 assigns one to). */
export function getFaq(page: "home" | "reservations"): FaqItem[] {
  return faqItems
    .filter((f) => f.page === page)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** One gallery album's images, or every album if no slug given. */
export function getGallery(albumSlug?: string): GalleryAlbum[] {
  if (!albumSlug) return galleryAlbums;
  return galleryAlbums.filter((a) => a.slug === albumSlug);
}

/** Milestones in chronological order (About page's stats-list panel). */
export function getMilestones(): Milestone[] {
  return milestones.slice().sort((a, b) => a.year - b.year);
}

/** Team members, in files/site's display order. */
export function getTeam(): TeamMember[] {
  return teamMembers;
}
