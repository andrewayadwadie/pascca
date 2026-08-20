"use client";

// footer / .fc / .fbar (contracts/component-api.md). "Visit us" phone/address rows read
// through getBranches() rather than a separate hardcoded copy (Article 8 [NN] — no duplicated
// source of truth; the same numbers already live in the Branch fixture).
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getBranches } from "../lib/content";
import { localeHref } from "../lib/i18n/href";

const EXPLORE_LINKS = ["/menu", "/about", "/gallery", "/branches", "/reservations", "/contact"] as const;
const EXPLORE_KEYS: Record<(typeof EXPLORE_LINKS)[number], string> = {
  "/menu": "menu",
  "/about": "about",
  "/gallery": "gallery",
  "/branches": "branches",
  "/reservations": "reservations",
  "/contact": "contact",
};

export function SiteFooter() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const branches = getBranches();
  const year = new Date().getFullYear();

  return (
    <footer data-surface="dark">
      <div className="fc">
        <div className="fbrand">
          <b>{tNav("brandName")}</b>
          <span>{tNav("brandTagline")}</span>
          <p>{t("tagline")}</p>
        </div>
        <div>
          <h5>{t("explore")}</h5>
          <ul className="plain">
            {EXPLORE_LINKS.map((href) => (
              <li key={href}>
                <Link href={localeHref(locale, href)}>{tNav(EXPLORE_KEYS[href])}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5>{t("hoursHeading")}</h5>
          <ul>
            {branches.map((branch) => (
              <li key={branch.slug}>
                <span>{branch.nameEn}</span>
                <b>{branch.hoursLabel}</b>
              </li>
            ))}
            <li>
              <span>{t("hoursBreakfast")}</span>
            </li>
          </ul>
        </div>
        <div>
          <h5>{t("visitHeading")}</h5>
          <ul className="visit plain">
            <li>
              <i>{t("iconAddress")}</i>
              <span>
                {branches.map((branch, i) => (
                  <span key={branch.slug}>
                    {branch.addressEn}
                    {i < branches.length - 1 ? <br /> : null}
                  </span>
                ))}
              </span>
            </li>
            <li>
              <i>{t("iconPhone")}</i>
              <span>
                {branches.map((branch, i) => (
                  <span key={branch.slug}>
                    <a href={`tel:${branch.phone.replace(/\s+/g, "")}`}>{branch.phone}</a>
                    {i < branches.length - 1 ? t("addressSeparator") : ""}
                  </span>
                ))}
              </span>
            </li>
            <li>
              <i>{t("iconEmail")}</i>
              <a href={`mailto:${t("email")}`}>{t("email")}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="fbar">
        <ul>
          <li>
            <Link href={localeHref(locale, "/legal")}>{t("privacy")}</Link>
          </li>
          <li>
            <Link href={localeHref(locale, "/legal#terms")}>{t("terms")}</Link>
          </li>
          <li>
            <a href="https://www.instagram.com/pasccarestaurant/" target="_blank" rel="noopener">
              {t("instagram")}
            </a>
          </li>
          <li>
            <a href="https://www.facebook.com/pasccaRestaurant/" target="_blank" rel="noopener">
              {t("facebook")}
            </a>
          </li>
        </ul>
        <span>{t("copyright", { year })}</span>
      </div>
    </footer>
  );
}
