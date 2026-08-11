// Every internal link in this feature is written as a locale-agnostic route ("/menu",
// "/reservations") — matching PageBlock.ctaHref's own documented shape (data-model.md: "Locale-
// agnostic route; not bilingual"). Components resolve the current locale via next-intl's
// useLocale() and prefix it here, so a page.tsx or content fixture never hardcodes "/en/...".
// External links (http(s):, tel:, mailto:, #fragment) pass through unchanged.
export function localeHref(locale: string, href: string): string {
  if (/^([a-z]+:|#)/i.test(href)) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `/${locale}${path}`;
}
