"use client";

// New component (US4) — not present in files/site/'s static HTML (spec Assumptions). Follows
// the #ov overlay idiom and ImageSlot/MasonryGrid visual language exactly, no new design
// invented. Focus trap + scroll lock (FR-037); Escape/outside-click closes and returns focus to
// the triggering thumbnail (Edge Cases).
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useScrollLock } from "../hooks/useScrollLock";
import { ImageSlot, type ImageSlotProps } from "./ImageSlot";

export interface LightboxProps {
  images: { imageSlot: ImageSlotProps }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const open = index !== null;
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("a11y");

  useFocusTrap(ref, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index !== null && index < images.length - 1) onNavigate(index + 1);
      if (e.key === "ArrowLeft" && index !== null && index > 0) onNavigate(index - 1);
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [open, index, images.length, onClose, onNavigate]);

  if (!open || index === null) return null;
  const current = images[index];
  if (!current) return null;

  return (
    <div className="lightbox">
      {/* Decorative backdrop — the actual dialog content sits in the sibling below. A real
          <button> gives outside-click-to-close a native keyboard-accessible element instead of
          a click handler on a non-interactive/role=dialog node (jsx-a11y). */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("closeLightbox")}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", cursor: "default" }}
      />
      <div className="lightbox-frame" ref={ref} role="dialog" aria-modal="true">
        <button type="button" className="lightbox-x" onClick={onClose}>
          {t("closeLightbox")}
        </button>
        <ImageSlot {...current.imageSlot} />
        <p className="lightbox-caption">{current.imageSlot.label}</p>
      </div>
    </div>
  );
}
