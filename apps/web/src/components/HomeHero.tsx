"use client";

// .hero (left column: eyebrow/h1/lede/hero-b/hero-stats) — contracts/component-api.md. The
// page assembles the outer `<header class="hero">` grid and the `.stage` (FloatingPlate +
// FloatingBadge) on the other side; neither is a prop HomeHero itself was frozen to accept.
import { splitEmphasis } from "../lib/text/emphasis";
import { Eyebrow } from "./Eyebrow";
import { Lede } from "./Lede";
import { Button } from "./Button";

export interface HomeHeroProps {
  eyebrow: string;
  headline: string;
  emphasis?: string | undefined;
  lede: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: { value: string; label: string }[];
}

export function HomeHero({ eyebrow, headline, emphasis, lede, primaryCta, secondaryCta, stats }: HomeHeroProps) {
  const { before, emphasis: em, after } = splitEmphasis(headline, emphasis);
  return (
    <div className="enter">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>
        {before}
        {em ? <em>{em}</em> : null}
        {after}
      </h1>
      <Lede>{lede}</Lede>
      <div className="hero-b">
        <Button variant="white" size="md" href={primaryCta.href}>
          {primaryCta.label}
        </Button>
        <Button variant="outline" size="md" href={secondaryCta.href}>
          {secondaryCta.label}
        </Button>
      </div>
      <div className="hero-stats">
        {stats.map((stat) => (
          <div className="hs" key={stat.label}>
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
