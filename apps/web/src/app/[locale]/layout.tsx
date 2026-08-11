// Article 21 [NN]: en default, ar registered but flagged off via notFound() (research R10), not
// a redirect — the route segment exists, it just doesn't render. Plus Jakarta Sans self-hosts
// automatically via next/font/google (FR-008, research R4) — its generated CSS variable feeds
// globals.css's `--sans` token. Skip-to-content link is the first focusable element (FR-035).
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../../styles/globals.css";
import { arabicEnabled, locales } from "../../lib/i18n/config";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://pascca.com"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "ar" && !arabicEnabled) notFound();

  const dir = locale === "ar" ? "rtl" : "ltr";
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "a11y" });

  return (
    <html lang={locale} dir={dir} className={plusJakartaSans.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
