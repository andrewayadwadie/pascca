// Article 21 [NN]: en default, ar registered but flagged off. No page content or user-facing
// string ships in this feature (AR-003) — this is the routing shell the first content feature
// extends.
import type { ReactNode } from "react";
import "../../styles/globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  // "ar" is registered here, not just "en", so the route segment exists and turning Arabic on
  // later is a content-entry task, never a rebuild (Article 21). It stays unreachable in
  // practice until a feature flag and real ar content exist.
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
