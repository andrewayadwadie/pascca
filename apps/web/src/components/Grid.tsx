"use client";

// .grid-2 .grid-3 .grid-4 (contracts/component-api.md). Merges "stagger"/"in" onto this same
// element when rendered inside a StaggerGroup (stagger-context.ts) — matching files/site's
// "grid-4 stagger" single-element markup instead of double-wrapping.
import type { ReactNode } from "react";
import { useStaggerInView } from "../lib/motion/stagger-context";

export function Grid({ cols, children }: { cols: 2 | 3 | 4; children: ReactNode }) {
  const staggerInView = useStaggerInView();
  const staggerClass = staggerInView === null ? "" : staggerInView ? " stagger in" : " stagger";
  return <div className={`grid-${cols}${staggerClass}`}>{children}</div>;
}
