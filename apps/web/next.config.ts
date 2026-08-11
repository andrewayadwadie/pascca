import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next's own default trailing-slash redirect runs BEFORE middleware and would otherwise turn
  // the /pasca-menu/ → /en/menu redirect (FR-017, research R11) into two hops instead of one —
  // this hands trailing-slash handling to middleware.ts entirely, where the real redirect lives.
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
