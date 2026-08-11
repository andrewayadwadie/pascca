"use client";

// .filters (contracts/component-api.md) — controlled, `resultCount` feeds an aria-live region
// announcing the filtered count (FR-039).
import { useTranslations } from "next-intl";

export interface FilterPillsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
}

export function FilterPills({ options, value, onChange, resultCount }: FilterPillsProps) {
  const t = useTranslations("filters");
  return (
    <>
      <div className="filters rv" role="group">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "on" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {resultCount !== undefined ? (
        <p className="sr-only" role="status" aria-live="polite">
          {t("resultsAnnouncement", { count: resultCount })}
        </p>
      ) : null}
    </>
  );
}
