"use client";

// Client-side glue between the server-rendered /menu page (which already filtered server-side,
// research R12) and FilterPills: on change, pushes the new filter into the URL query string via
// router.replace (no full navigation) so the address bar always reflects what's rendered —
// shareable and bookmarkable (FR-031).
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterPills } from "./FilterPills";

const FILTER_VALUES = [
  "all",
  "pizza",
  "calzone",
  "pasta",
  "mains",
  "starters",
  "breakfast",
  "desserts",
  "drinks",
  "fasting",
  "veg",
] as const;

export function MenuFilterBar({ value, resultCount }: { value: string; resultCount: number }) {
  const router = useRouter();
  const t = useTranslations("filters");

  const options = FILTER_VALUES.map((v) => ({ value: v, label: t(v) }));

  function handleChange(next: string) {
    const params = new URLSearchParams(window.location.search);
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    const query = params.toString();
    router.replace(`${window.location.pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  return <FilterPills options={options} value={value} onChange={handleChange} resultCount={resultCount} />;
}
