// Hand-written content DTO (research R6) — see src/content/index.ts.
import type { PageName } from "./page-block";

export interface Testimonial {
  /** e.g. "Tripadvisor guest" — source uses role labels, not real names (data-model.md). */
  author: string;
  source: string;
  rating: number | null;
  quoteEn: string;
  quoteAr: string | null;
  branchSlug: string | null;
  /** Always true in this fixture — Article 13 [NN] forbids publishing otherwise. */
  consentGiven: boolean;
}

export interface FaqItem {
  /** "home" | "reservations" — the only two pages with a FAQ block per Article 18. */
  page: Extract<PageName, "home" | "reservations">;
  questionEn: string;
  questionAr: string | null;
  answerEn: string;
  answerAr: string | null;
  sortOrder: number;
}
