// Hand-written content DTO barrel (research R6) — a deliberate, permanent sibling to the
// generated src/index.ts, exported separately via package.json's "./content" subpath. Nothing
// here is touched by scripts/generate.ts.
export type { Category, MenuItem } from "./menu";
export type { Branch } from "./branch";
export type { PageBlock, PageSeo, PageName } from "./page-block";
export type { Testimonial, FaqItem } from "./marketing";
export type { Milestone, TeamMember } from "./about";
export type { GalleryAlbum, GalleryImage, ImageTone, ImageSlotData } from "./gallery";
