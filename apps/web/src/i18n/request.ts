// next-intl request config (T017) — reads the `[locale]` route segment, falls back to
// defaultLocale for anything unrecognised (arabicEnabled's notFound() gate in layout.tsx is
// what actually blocks "ar" from rendering; this file just resolves which message bundle to
// load once a request is allowed through).
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "../lib/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = locales.includes(requested as (typeof locales)[number])
    ? (requested as (typeof locales)[number])
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
