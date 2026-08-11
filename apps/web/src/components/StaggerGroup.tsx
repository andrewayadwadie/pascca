"use client";

// .stagger — one-shot IO reveal at 12% (FR-029). Provides its reveal state via context rather
// than rendering its own wrapping div, so a Grid nested directly inside gets ".grid-4.stagger"
// on ONE element — matching files/site's markup exactly (see stagger-context.ts).
import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";
import { StaggerContext } from "../lib/motion/stagger-context";

export function StaggerGroup({ children }: { children: ReactNode }) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref}>
      <StaggerContext.Provider value={inView}>{children}</StaggerContext.Provider>
    </div>
  );
}
