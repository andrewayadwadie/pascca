// Hand-written content DTO — packages/types/src/content/ is a deliberate, permanent exception
// to "nothing under src/ is ever hand-written" (research R6). See src/content/index.ts.
//
// `ImageTone` matches files/site's `.ph-warm` … `.ph-cream` modifier classes exactly (data-
// model.md) — no new tone invented. `ImageSlotData` is the fixture-side shape every
// `imageSlot` field below (and on MenuItem, TeamMember) carries; the `ImageSlot` component's
// own props are a superset (adds `src`/`alt`, unused today — contracts/component-api.md).
export type ImageTone = "warm" | "gold" | "stone" | "ember" | "herb" | "cream";

export interface ImageSlotData {
  ratio: string;
  tone: ImageTone;
  label: string;
  badge?: string;
}

export interface GalleryImage {
  imageSlot: ImageSlotData;
}

export interface GalleryAlbum {
  slug: string;
  titleEn: string;
  titleAr: string | null;
  images: GalleryImage[];
}
