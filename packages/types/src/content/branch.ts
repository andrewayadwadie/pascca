// Hand-written content DTO (research R6) — see src/content/index.ts.
export interface Branch {
  slug: string;
  nameEn: string;
  nameAr: string | null;
  addressEn: string;
  addressAr: string | null;
  phone: string;
  mapUrl: string | null;
  /** Display string ("12pm — 2am", "24 hours") — the real per-day BranchHour model is a 002
   *  concern; this fixture only needs the label files/site shows (data-model.md). */
  hoursLabel: string;
  ratingLabel: string | null;
  deliveryAreaLabel: string | null;
}
