// Gold-italic headline convention (FR-011, contracts/component-api.md): `emphasis` must be a
// verbatim substring of `headline`. Shared by SectionHead, PageHero, HomeHero — three different
// heading tags, so this returns the three text spans rather than a shared JSX component.
export interface EmphasisSplit {
  before: string;
  emphasis: string | null;
  after: string;
}

export function splitEmphasis(headline: string, emphasis?: string | null): EmphasisSplit {
  if (!emphasis) return { before: headline, emphasis: null, after: "" };
  const idx = headline.indexOf(emphasis);
  if (idx === -1) return { before: headline, emphasis: null, after: "" };
  return {
    before: headline.slice(0, idx),
    emphasis: headline.slice(idx, idx + emphasis.length),
    after: headline.slice(idx + emphasis.length),
  };
}
