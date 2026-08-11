// FR-047 — Next.js's native robots.txt convention.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://pascca.com/sitemap.xml",
  };
}
