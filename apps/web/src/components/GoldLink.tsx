"use client";

// .link-g (contracts/component-api.md)
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { localeHref } from "../lib/i18n/href";

export function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("cta");
  return (
    <Link href={localeHref(locale, href)} className="link-g">
      <i>{t("arrowIcon")}</i>
      {children}
    </Link>
  );
}
