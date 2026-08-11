"use client";

// Client-side glue for /gallery — album filtering (client-only, unlike /menu's SSR-driven
// filter; files/site/gallery.html's own filters have no URL param to preserve) and the
// lightbox open/close/navigate state.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { GalleryAlbum } from "@pascca/types/content";
import { FilterPills } from "./FilterPills";
import { MasonryGrid } from "./MasonryGrid";
import { Lightbox } from "./Lightbox";

export function GalleryClient({ albums }: { albums: GalleryAlbum[] }) {
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const tFilters = useTranslations("filters");

  const visibleImages = useMemo(() => {
    const filtered = activeAlbum === "all" ? albums : albums.filter((a) => a.slug === activeAlbum);
    return filtered.flatMap((a) => a.images);
  }, [albums, activeAlbum]);

  const options = [{ value: "all", label: tFilters("everything") }, ...albums.map((a) => ({ value: a.slug, label: a.titleEn }))];

  return (
    <>
      <FilterPills options={options} value={activeAlbum} onChange={setActiveAlbum} resultCount={visibleImages.length} />
      <MasonryGrid items={visibleImages} onSelect={setLightboxIndex} />
      <Lightbox images={visibleImages} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </>
  );
}
