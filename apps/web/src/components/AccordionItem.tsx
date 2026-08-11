"use client";

// .q>button .ic .a — real <button>, aria-expanded/aria-controls (FR-030, FR-036,
// contracts/component-api.md).
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useAccordionContext } from "../lib/motion/accordion-context";

export interface AccordionItemProps {
  id: string;
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ id, question, children }: AccordionItemProps) {
  const { openId, toggle } = useAccordionContext();
  const t = useTranslations("cta");
  const open = openId === id;
  const panelId = `accordion-panel-${id}`;
  const buttonId = `accordion-button-${id}`;

  return (
    <div className={open ? "q on" : "q"}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => toggle(id)}
      >
        {question}
        <span className="ic" aria-hidden="true">
          {t("arrowIcon")}
        </span>
      </button>
      <div id={panelId} role="region" aria-labelledby={buttonId} className="a">
        <p>{children}</p>
      </div>
    </div>
  );
}
