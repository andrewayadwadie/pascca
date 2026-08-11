"use client";

// Shared by MobileNavOverlay and Lightbox (FR-037). Locks body scroll while `active` is true —
// ports app.js's `document.body.style.overflow = 'hidden'` behaviour to a React effect.
import { useEffect } from "react";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
