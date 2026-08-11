"use client";

// .shead rv (contracts/component-api.md) — one-shot IO reveal owned internally (FR-029), since
// the original markup puts the "rv" class directly on this element, not a separate wrapper.
// `emphasis` is the substring of `headline` rendered gold-italic (FR-011).
import { useReveal } from "../hooks/useReveal";
import { splitEmphasis } from "../lib/text/emphasis";
import { Eyebrow } from "./Eyebrow";
import { Lede } from "./Lede";

export interface SectionHeadProps {
  eyebrow: string;
  headline: string;
  emphasis?: string | undefined;
  lede?: string | undefined;
}

export function SectionHead({ eyebrow, headline, emphasis, lede }: SectionHeadProps) {
  const { before, emphasis: em, after } = splitEmphasis(headline, emphasis);
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`shead rv${inView ? " in" : ""}`}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>
          {before}
          {em ? <em>{em}</em> : null}
          {after}
        </h2>
      </div>
      {lede ? <Lede>{lede}</Lede> : null}
    </div>
  );
}
