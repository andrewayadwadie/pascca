// Hand-written content DTO (research R6) — see src/content/index.ts.
import type { ImageSlotData } from "./gallery";

export interface Category {
  slug: string;
  nameEn: string;
  nameAr: string | null;
  sortOrder: number;
}

export interface MenuItem {
  slug: string;
  categorySlug: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  /** Int piastres — matches apps/api/prisma/schema.prisma's MenuItem.price exactly (research R9).
   *  Non-optional: Article 2 [NN] makes a priceless dish unrepresentable. */
  price: number;
  isFasting: boolean;
  isVegetarian: boolean;
  isFeatured: boolean;
  featuredRank: number | null;
  imageSlot: ImageSlotData;
}
