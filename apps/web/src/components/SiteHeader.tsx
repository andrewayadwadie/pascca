"use client";

// nav / #ov / .brg (contracts/component-api.md). Owns the sticky/`small` scroll-triggered state
// (FR-027, ports app.js's `scrollY > 60` listener) and the mobile-nav open/close state —
// composes MobileNavOverlay internally since both are frozen at zero shared props
// (component-api.md); reads the current route for aria-current via usePathname().
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { localeHref } from "../lib/i18n/href";
import { MobileNavOverlay } from "./MobileNavOverlay";

const NAV_L_LINKS = ["/menu", "/about", "/gallery"] as const;
const NAV_L_KEYS: Record<(typeof NAV_L_LINKS)[number], string> = {
  "/menu": "menu",
  "/about": "about",
  "/gallery": "gallery",
};

export function SiteHeader() {
  const [small, setSmall] = useState(false);
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");

  useEffect(() => {
    function onScroll() {
      setSmall(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentPath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  return (
    <>
      <nav className={small ? "small" : ""}>
        <div className="nav-l">
          {NAV_L_LINKS.map((href) => (
            <Link
              key={href}
              href={localeHref(locale, href)}
              aria-current={currentPath === href ? "page" : undefined}
            >
              {t(NAV_L_KEYS[href])}
            </Link>
          ))}
        </div>
        <Link href={localeHref(locale, "/")} className="brand">
          <b>{t("brandName")}</b>
          <span>{t("brandTagline")}</span>
        </Link>
        <div className="nav-r">
          <Link href={localeHref(locale, "/branches")} className="acct">
            {t("branches")}
          </Link>
          <Link href={localeHref(locale, "/reservations")} className="btn btn-g btn-sm">
            {t("bookTable")}
          </Link>
          <button
            type="button"
            className="brg"
            aria-label={t("openMenu")}
            aria-expanded={open}
            aria-controls="ov"
            onClick={() => setOpen(true)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
      <MobileNavOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
