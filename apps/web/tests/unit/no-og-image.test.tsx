// @vitest-environment node
// FR-050: OG-image generation is a deliberate deferral (no OG tags exist anywhere in
// files/site/ to extract from — spec Assumptions), not a silently-dropped requirement. Asserts
// every route's generateMetadata() never sets openGraph.images, so nothing links to a
// non-existent asset.
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../src/messages/en.json")).default;
  return {
    getTranslations: async (namespace: string) => {
      const ns = (messages as Record<string, Record<string, string>>)[namespace] ?? {};
      return (key: string) => ns[key] ?? key;
    },
  };
});

const ROUTES: Array<{ name: string; importFn: () => Promise<{ generateMetadata?: () => Promise<unknown> }> }> = [
  { name: "home", importFn: () => import("../../src/app/[locale]/page") },
  { name: "menu", importFn: () => import("../../src/app/[locale]/menu/page") },
  { name: "about", importFn: () => import("../../src/app/[locale]/about/page") },
  { name: "gallery", importFn: () => import("../../src/app/[locale]/gallery/page") },
  { name: "branches", importFn: () => import("../../src/app/[locale]/branches/page") },
  { name: "reservations", importFn: () => import("../../src/app/[locale]/reservations/page") },
  { name: "contact", importFn: () => import("../../src/app/[locale]/contact/page") },
  { name: "legal", importFn: () => import("../../src/app/[locale]/legal/page") },
];

describe("FR-050: no route emits an og:image pointing at a nonexistent asset", () => {
  it.each(ROUTES)("$name's generateMetadata() has no openGraph.images", async ({ importFn }) => {
    const mod = await importFn();
    if (!mod.generateMetadata) return; // gallery is a client page; metadata lives on its layout
    const metadata = (await mod.generateMetadata()) as { openGraph?: { images?: unknown } };
    expect(metadata.openGraph?.images).toBeUndefined();
  });
});
