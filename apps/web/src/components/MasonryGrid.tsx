"use client";

// .masonry .m-a…m-h (contracts/component-api.md). `onSelect` opens the lightbox (US4). The
// eight span classes cycle if there are more than eight images — files/site's own masonry only
// ever shows exactly eight, this fixture's albums have between 1 and 6.
import { useTranslations } from "next-intl";
import type { ImageSlotProps } from "./ImageSlot";
import { ImageSlot } from "./ImageSlot";

const SPAN_CLASSES = ["m-a", "m-b", "m-c", "m-d", "m-e", "m-f", "m-g", "m-h"];

export function MasonryGrid({
  items,
  onSelect,
}: {
  items: { imageSlot: ImageSlotProps }[];
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("a11y");
  return (
    <div className="masonry rv">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          className={SPAN_CLASSES[i % SPAN_CLASSES.length]}
          style={{ display: "block", width: "100%", padding: 0, cursor: "pointer" }}
          onClick={() => onSelect(i)}
          aria-label={`${t("openLightbox")} — ${item.imageSlot.label}`}
        >
          <ImageSlot {...item.imageSlot} />
        </button>
      ))}
    </div>
  );
}
