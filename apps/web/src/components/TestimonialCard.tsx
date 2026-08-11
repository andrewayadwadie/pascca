"use client";

// .rc .st .who .av (contracts/component-api.md)
import { useTranslations } from "next-intl";

export interface TestimonialCardProps {
  stars: number;
  quote: string;
  author: string;
  source: string;
}

export function TestimonialCard({ stars, quote, author, source }: TestimonialCardProps) {
  const t = useTranslations("icons");
  const star = t("star");
  return (
    <div className="rc">
      <div className="st">{star.repeat(stars)}</div>
      <q>{quote}</q>
      <div className="who">
        <span className="av"></span>
        <div>
          <b>{author}</b>
          <span>{source}</span>
        </div>
      </div>
    </div>
  );
}
