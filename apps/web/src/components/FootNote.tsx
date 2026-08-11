"use client";

// .note rv (contracts/component-api.md) — one-shot IO reveal owned internally.
import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

export function FootNote({ children }: { children: ReactNode }) {
  const { ref, inView } = useReveal<HTMLParagraphElement>();
  return (
    <p ref={ref} className={`note rv${inView ? " in" : ""}`}>
      {children}
    </p>
  );
}
