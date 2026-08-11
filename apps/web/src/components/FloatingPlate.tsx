// .plate — hover transform via --spring, float keyframe (FR-032, contracts/component-api.md).
// Unchanged values; all motion lives in globals.css (research R14 — plain CSS, no library).
import type { ImageSlotProps } from "./ImageSlot";

export function FloatingPlate({ imageSlot }: { imageSlot: ImageSlotProps }) {
  return (
    <div className="plate">
      <span>{imageSlot.label}</span>
    </div>
  );
}
