// FR-047 — Next.js's native sitemap.xml convention, covering all eight routes under the "en"
// default locale (Article 21 — "ar" stays unlisted while it 404s).
import type { MetadataRoute } from "next";

const ROUTES = ["", "/menu", "/about", "/gallery", "/branches", "/reservations", "/contact", "/legal"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pascca.com/en";
  return ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
