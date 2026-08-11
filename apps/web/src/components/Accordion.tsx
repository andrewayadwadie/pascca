"use client";

// .q — enforces one-open-at-a-time via internal state (FR-030, contracts/component-api.md).
// Ports app.js's accordion click handler exactly: opening one closes whichever was open.
import { Children, isValidElement, useState, type ReactNode } from "react";
import { AccordionContext } from "../lib/motion/accordion-context";

function findDefaultOpenId(children: ReactNode): string | null {
  let found: string | null = null;
  Children.forEach(children, (child) => {
    if (found) return;
    if (isValidElement<{ id?: string; defaultOpen?: boolean }>(child) && child.props.defaultOpen) {
      found = child.props.id ?? null;
    }
  });
  return found;
}

export function Accordion({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(() => findDefaultOpenId(children));

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return <AccordionContext.Provider value={{ openId, toggle }}>{children}</AccordionContext.Provider>;
}
