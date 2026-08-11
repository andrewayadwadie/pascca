// @vitest-environment jsdom
// SC-008: swapping one getX() implementation for a stub returning different data changes the
// rendered page with zero component edits — proving the fixture→fetch seam is real, not
// aspirational. Mocks the lib/content module (not a component) so the home page's own source
// is untouched by this test.
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type * as LibContent from "../../src/lib/content";

vi.mock("../../src/lib/content", async (importOriginal) => {
  const actual = await importOriginal<typeof LibContent>();
  return {
    ...actual,
    getFeaturedDishes: () => [
      {
        slug: "stub-dish",
        categorySlug: "pizza",
        nameEn: "Stub Dish From The Seam Test",
        nameAr: null,
        descriptionEn: "This text only exists if the seam is real.",
        descriptionAr: null,
        price: 1234,
        isFasting: false,
        isVegetarian: false,
        isFeatured: true,
        featuredRank: 1,
        imageSlot: { ratio: "1/1", tone: "warm" as const, label: "Stub" },
      },
    ],
  };
});

vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));

// jsdom has no IntersectionObserver (Reveal/SectionHead/Panel/FootNote/StaggerGroup all use
// one, useReveal.ts) — a minimal stub is enough since this test isn't exercising scroll reveal.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error — test-only global polyfill, not a real IntersectionObserver
globalThis.IntersectionObserver = MockIntersectionObserver;

// getTranslations() (next-intl/server) needs Next's own request-context machinery, unavailable
// when calling the page function directly outside Next's render pipeline — stub it with a
// direct en.json lookup so this test can render the Server Component at all. Not what this
// test is checking; the seam under test is getFeaturedDishes(), mocked above.
vi.mock("next-intl/server", async () => {
  const messages = (await import("../../src/messages/en.json")).default;
  return {
    getTranslations: async (namespace: string) => {
      const ns = (messages as Record<string, Record<string, string>>)[namespace] ?? {};
      return (key: string) => ns[key] ?? key;
    },
  };
});

describe("content seam (SC-008)", () => {
  it("renders a stubbed getFeaturedDishes() result on the home page with no component edit", async () => {
    const { default: HomePage } = await import("../../src/app/[locale]/page");
    const messages = (await import("../../src/messages/en.json")).default;
    const { NextIntlClientProvider } = await import("next-intl");
    const element = await HomePage();

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        {element}
      </NextIntlClientProvider>,
    );

    expect(container.textContent).toContain("Stub Dish From The Seam Test");
    expect(container.textContent).not.toContain("Calzone");
  });
});
