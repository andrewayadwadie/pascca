// Article 21 [NN]: `ar` is registered (generateStaticParams already includes it — 001) but
// disabled by flag, not by omission. A code-level constant, not a database row — no
// `SiteSetting` exists for it and this feature touches no database (research R10). Flipping
// this to `true` is the entire "turn Arabic on" task once real `ar` content exists; it is
// deliberately not an environment variable — there is nothing per-deployment about it yet.
export const arabicEnabled = false;

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
