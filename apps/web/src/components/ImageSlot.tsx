// .ph .ph-warm…ph-cream .tag (contracts/component-api.md). Renders the designed placeholder
// today — correct aspect ratio, tone and label, never a broken icon — reserving full layout
// space so CLS is zero now and stays zero once real photography lands (Article 20, FR-042/
// FR-043). `src`/`alt` are accepted but unused: swapping to next/image later is a prop change,
// not a rewrite (FR-013).
export interface ImageSlotProps {
  ratio: string;
  tone: "warm" | "gold" | "stone" | "ember" | "herb" | "cream";
  label: string;
  badge?: string | undefined;
  src?: string | undefined;
  alt?: string | undefined;
}

export function ImageSlot({ ratio, tone, label, badge }: ImageSlotProps) {
  return (
    <div className={`ph ph-${tone}`} style={{ aspectRatio: ratio }}>
      {badge ? <span className="tag">{badge}</span> : null}
      <span>{label}</span>
    </div>
  );
}
