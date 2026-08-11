"use client";

// #ov (contracts/component-api.md) — clip-path wipe (FR-028), focus trap + scroll lock
// (FR-037, useFocusTrap/useScrollLock), real button semantics (FR-036). Escape closes (ports
// app.js's keydown listener); every link closes it too.
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useScrollLock } from "../hooks/useScrollLock";
import { localeHref } from "../lib/i18n/href";

const LINKS = ["/menu", "/about", "/gallery", "/branches", "/reservations", "/contact"] as const;
const LINK_KEYS: Record<(typeof LINKS)[number], string> = {
  "/menu": "menu",
  "/about": "about",
  "/gallery": "gallery",
  "/branches": "branches",
  "/reservations": "reservations",
  "/contact": "contact",
};

export function MobileNavOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations("nav");

  useFocusTrap(ref, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  return (
    <div
      id="ov"
      ref={ref}
      className={open ? "on" : ""}
      role="dialog"
      aria-modal="true"
      inert={!open}
    >
      <button type="button" className="x" onClick={onClose}>
        {t("closeMenu")}
      </button>
      {LINKS.map((href) => (
        <Link key={href} href={localeHref(locale, href)} onClick={onClose}>
          {t(LINK_KEYS[href])}
        </Link>
      ))}
    </div>
  );
}
