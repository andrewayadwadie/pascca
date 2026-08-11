"use client";

// files/site's CSS needs `.grid-4.stagger` to be the SAME element — `.stagger>*` selects the
// grid's direct children (the cards) for the per-card transition-delay. StaggerGroup and Grid
// are frozen as two separate components with independent prop shapes (contracts/component-
// api.md), so this context lets StaggerGroup provide its reveal state to a Grid nested directly
// inside it without either signature changing: Grid merges "stagger"/"in" onto its own
// className when it detects it's inside a StaggerGroup, instead of StaggerGroup rendering a
// second wrapping div around Grid's own.
import { createContext, useContext } from "react";

export const StaggerContext = createContext<boolean | null>(null);

export function useStaggerInView(): boolean | null {
  return useContext(StaggerContext);
}
