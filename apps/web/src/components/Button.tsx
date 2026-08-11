"use client";

// .btn .btn-w .btn-g .btn-o (contracts/component-api.md). Renders <a> when `href` is given
// (auto-locale-prefixed, external hrefs pass through), else <button>.
import Link from "next/link";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { localeHref } from "../lib/i18n/href";

export interface ButtonProps {
  variant: "white" | "gold" | "outline";
  size: "md" | "sm";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonProps["variant"], string> = {
  white: "btn-w",
  gold: "btn-g",
  outline: "btn-o",
};

export function Button({ variant, size, href, onClick, type = "button", children }: ButtonProps) {
  const locale = useLocale();
  const className = `btn ${VARIANT_CLASS[variant]}${size === "sm" ? " btn-sm" : ""}`;
  const isExternal = href ? /^([a-z]+:)/i.test(href) : false;

  if (href) {
    const resolvedHref = localeHref(locale, href);
    if (isExternal) {
      return (
        <a
          href={href}
          className={className}
          target={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"}
          rel={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "noopener"}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={resolvedHref} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} onClick={onClick}>
      {children}
    </button>
  );
}
