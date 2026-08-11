"use client";

// .panel .panel-glow rv (contracts/component-api.md) — one-shot IO reveal owned internally.
import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

export function Panel({ glow, children }: { glow?: boolean; children: ReactNode }) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const base = glow ? "panel panel-glow" : "panel";
  return (
    <div ref={ref} className={`${base} rv${inView ? " in" : ""}`}>
      {children}
    </div>
  );
}
