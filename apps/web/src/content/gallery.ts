// Content fixture — real copy transcribed from files/site/gallery.html. The static markup has
// no per-image category tag (unlike menu.html's data-cat), only the album filter labels
// ("The food", "The rooms", "Breakfast", "Occasions") and eight images; each image is grouped
// into the album its caption plainly belongs to. Ratios preserve each image's own masonry span
// (m-a/m-b 16/10, m-c–e 4/3, m-f 21/7, m-g/m-h 16/9) — Article 20's zero-CLS box, not a new
// layout decision.
import type { GalleryAlbum } from "@pascca/types/content";

export const galleryAlbums: GalleryAlbum[] = [
  {
    slug: "the-food",
    titleEn: "The Food",
    titleAr: null,
    images: [
      { imageSlot: { ratio: "16/10", tone: "warm", label: "Stone oven" } },
      { imageSlot: { ratio: "4/3", tone: "gold", label: "Truffle pasta" } },
      { imageSlot: { ratio: "16/9", tone: "cream", label: "Calzone" } },
    ],
  },
  {
    slug: "the-rooms",
    titleEn: "The Rooms",
    titleAr: null,
    images: [
      { imageSlot: { ratio: "16/10", tone: "cream", label: "Heliopolis dining room" } },
      { imageSlot: { ratio: "4/3", tone: "herb", label: "Terrace seating" } },
      { imageSlot: { ratio: "21/7", tone: "ember", label: "Shobra dining room" } },
    ],
  },
  {
    slug: "breakfast",
    titleEn: "Breakfast",
    titleAr: null,
    images: [{ imageSlot: { ratio: "4/3", tone: "stone", label: "Breakfast platter" } }],
  },
  {
    slug: "occasions",
    titleEn: "Occasions",
    titleAr: null,
    images: [{ imageSlot: { ratio: "16/9", tone: "warm", label: "Birthday table" } }],
  },
];
