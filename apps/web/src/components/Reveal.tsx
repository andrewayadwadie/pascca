"use client";

// .rv — one-shot IO reveal at 12% (FR-029, contracts/component-api.md).
import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

export function Reveal({ children }: { children: ReactNode }) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`rv${inView ? " in" : ""}`}>
      {children}
    </div>
  );
}
