"use client";

// .mcta — fixed pill, shown ≤1100px via CSS media query (Article 17, contracts/component-api.md)
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localeHref } from "../lib/i18n/href";

export function MobileCtaBar() {
  const locale = useLocale();
  const t = useTranslations("mobileCta");

  return (
    <div className="mcta">
      <Link href={localeHref(locale, "/menu")} className="m">
        {t("menu")}
      </Link>
      <Link href={localeHref(locale, "/reservations")} className="b">
        {t("book")}
      </Link>
    </div>
  );
}
