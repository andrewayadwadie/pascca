"use client";

// .phero .crumb — reuses the emphasis convention (FR-011, contracts/component-api.md). `crumb`
// is the breadcrumb line ("Home — Menu"); the "Home" segment links to "/", resolved to the
// current locale.
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { splitEmphasis } from "../lib/text/emphasis";
import { localeHref } from "../lib/i18n/href";
import { Lede } from "./Lede";

export interface PageHeroProps {
  crumb: string;
  headline: string;
  emphasis?: string | undefined;
  lede?: string | undefined;
}

export function PageHero({ crumb, headline, emphasis, lede }: PageHeroProps) {
  const { before, emphasis: em, after } = splitEmphasis(headline, emphasis);
  const locale = useLocale();
  const t = useTranslations("nav");

  return (
    <header className="phero">
      <div className="enter">
        <span className="crumb">
          <Link href={localeHref(locale, "/")}>{t("home")}</Link>
          {" "}
          {t("crumbSeparator")}
          {" "}
          {crumb}
        </span>
        <h1>
          {before}
          {em ? <em>{em}</em> : null}
          {after}
        </h1>
        {lede ? <Lede>{lede}</Lede> : null}
      </div>
    </header>
  );
}
