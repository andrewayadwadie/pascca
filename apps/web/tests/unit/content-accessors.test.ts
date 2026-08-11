// One assertion per accessor: returns non-empty data for every known page/key, and
// getTestimonials() correctly filters on consentGiven (contracts/content-accessors.md).
import { describe, expect, it } from "vitest";
import {
  getBranches,
  getFaq,
  getFeaturedDishes,
  getGallery,
  getMenu,
  getMilestones,
  getPageBlocks,
  getPageSeo,
  getTeam,
  getTestimonials,
} from "../../src/lib/content";

const PAGES = [
  "home",
  "menu",
  "about",
  "gallery",
  "branches",
  "reservations",
  "contact",
  "legal",
] as const;

describe("lib/content accessors", () => {
  it.each(PAGES)("getPageBlocks(%s) returns a non-empty, sorted array", (page) => {
    const blocks = getPageBlocks(page);
    expect(blocks.length).toBeGreaterThan(0);
    const sorted = blocks.every(
      (b, i) => i === 0 || blocks[i - 1]!.sortOrder <= b.sortOrder,
    );
    expect(sorted).toBe(true);
  });

  it.each(PAGES)("getPageSeo(%s) returns a title and description", (page) => {
    const seo = getPageSeo(page);
    expect(seo?.titleEn).toBeTruthy();
    expect(seo?.descriptionEn).toBeTruthy();
  });

  it("getFeaturedDishes returns exactly 4 items ordered by featuredRank", () => {
    const dishes = getFeaturedDishes();
    expect(dishes).toHaveLength(4);
    expect(dishes.map((d) => d.featuredRank)).toEqual([1, 2, 3, 4]);
  });

  it("getMenu returns all 8 categories, each with items", () => {
    const menu = getMenu();
    expect(menu).toHaveLength(8);
    for (const group of menu) {
      expect(group.items.length).toBeGreaterThan(0);
      expect(group.items.every((i) => i.categorySlug === group.category.slug)).toBe(true);
    }
  });

  it("getBranches returns Shobra then Heliopolis", () => {
    const branches = getBranches();
    expect(branches.map((b) => b.slug)).toEqual(["shobra", "heliopolis"]);
  });

  it("getTestimonials returns only consentGiven testimonials", () => {
    const testimonials = getTestimonials();
    expect(testimonials.length).toBeGreaterThan(0);
    expect(testimonials.every((t) => t.consentGiven)).toBe(true);
  });

  it.each(["home", "reservations"] as const)("getFaq(%s) returns a non-empty array", (page) => {
    expect(getFaq(page).length).toBeGreaterThan(0);
  });

  it("getGallery() with no slug returns all albums", () => {
    expect(getGallery().length).toBe(4);
  });

  it("getGallery(slug) returns only the matching album", () => {
    const result = getGallery("the-food");
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("the-food");
  });

  it("getMilestones returns items in chronological order", () => {
    const milestones = getMilestones();
    expect(milestones.length).toBeGreaterThan(0);
    const sorted = milestones.every((m, i) => i === 0 || milestones[i - 1]!.year <= m.year);
    expect(sorted).toBe(true);
  });

  it("getTeam returns a non-empty array", () => {
    expect(getTeam().length).toBeGreaterThan(0);
  });
});
