// Hand-written content DTO (research R6) — see src/content/index.ts.
import type { ImageSlotData } from "./gallery";

export interface Milestone {
  year: number;
  titleEn: string;
  titleAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  /** The stats-list right-hand value ("01", "★", "24h", "78K"). */
  badge: string;
}

export interface TeamMember {
  slug: string;
  roleEn: string;
  roleAr: string | null;
  bioEn: string | null;
  bioAr: string | null;
  imageSlot: ImageSlotData;
}
