"use client";

// Shared between Accordion (owns the "one open at a time" state, FR-030) and AccordionItem
// (reads/toggles it) — two separately frozen components (contracts/component-api.md) that need
// to coordinate without either's prop signature changing.
import { createContext, useContext } from "react";

export interface AccordionContextValue {
  openId: string | null;
  toggle: (id: string) => void;
}

export const AccordionContext = createContext<AccordionContextValue | null>(null);

export function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be rendered inside an Accordion");
  return ctx;
}
