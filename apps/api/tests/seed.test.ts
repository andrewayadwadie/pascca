// Seed dataset tests (002-content-schema-seed, T025-T027, research R13 layer 3). Runs the real
// seed script against a freshly reset database and asserts every invariant
// contracts/seed-dataset.md promises. Nothing here is mocked — the entire value of a seed test
// is that the data really lands in a real database with real constraints enforced.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnect, prisma, resetDatabase } from "./helpers/db";

const apiRoot = path.resolve(import.meta.dirname, "..");

beforeAll(async () => {
  await resetDatabase();
  execFileSync(
    process.execPath,
    [path.join(apiRoot, "node_modules/tsx/dist/cli.mjs"), "prisma/seed.ts"],
    { cwd: apiRoot, stdio: "pipe" },
  );
}, 60_000);

afterAll(async () => {
  await disconnect();
});

describe("seed: exact counts fixed by FR-010/FR-014", () => {
  it("seeds exactly 2 branches", async () => {
    expect(await prisma.branch.count()).toBe(2);
  });

  it("seeds exactly 8 categories", async () => {
    expect(await prisma.category.count()).toBe(8);
  });

  it("seeds exactly 4 gallery albums", async () => {
    expect(await prisma.galleryAlbum.count()).toBe(4);
  });

  it("seeds exactly 5 testimonials", async () => {
    expect(await prisma.testimonial.count()).toBe(5);
  });

  it("seeds exactly 20 reservations", async () => {
    expect(await prisma.reservation.count()).toBe(20);
  });

  it("seeds exactly 8 PageSeo rows, one per Article 18 page", async () => {
    const rows = await prisma.pageSeo.findMany({ select: { page: true } });
    expect(rows.map((r) => r.page).sort()).toEqual(
      ["home", "menu", "about", "gallery", "branches", "reservations", "contact", "legal"].sort(),
    );
  });

  it("seeds 0 RefreshToken rows — live logins only (FR-014)", async () => {
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it("seeds 0 AuditLog rows — live mutations only (FR-014)", async () => {
    expect(await prisma.auditLog.count()).toBe(0);
  });

  it("does not seed any BranchClosure rows (operational data, spec Assumptions)", async () => {
    expect(await prisma.branchClosure.count()).toBe(0);
  });
});

describe("seed: approximate counts (ranges, not exact — contracts/seed-dataset.md)", () => {
  // 004-web-design-system-port (research R7/R8, T107): the menu now imports from
  // files/site/menu.html's real dish list via @pascca/web/content/menu, replacing 002's
  // independently-invented ~forty-item placeholder menu. files/site's real count is 31 (6
  // pizza + 3 calzone + 5 pasta + 3 mains + 4 starters + 4 breakfast + 3 desserts + 3 drinks) —
  // this range is widened around that real, verified number, not padded back toward "forty".
  it("seeds roughly thirty menu items", async () => {
    const count = await prisma.menuItem.count();
    expect(count).toBeGreaterThanOrEqual(25);
    expect(count).toBeLessThanOrEqual(40);
  });

  it("seeds at least one PageBlock per page (site renders before the dashboard is touched)", async () => {
    const pages = [
      "home",
      "menu",
      "about",
      "gallery",
      "branches",
      "reservations",
      "contact",
      "legal",
    ];
    for (const page of pages) {
      const count = await prisma.pageBlock.count({ where: { page } });
      expect(count, `page "${page}" has no seeded PageBlock`).toBeGreaterThan(0);
    }
  });
});

describe("seed: menu invariants", () => {
  it("every menu item has a positive price (Art 2 [NN])", async () => {
    const items = await prisma.menuItem.findMany({ select: { price: true } });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it("exactly 4 items are featured, each with a distinct non-null rank", async () => {
    const featured = await prisma.menuItem.findMany({
      where: { isFeatured: true },
      select: { featuredRank: true },
    });
    expect(featured).toHaveLength(4);
    const ranks = featured.map((f) => f.featuredRank);
    expect(ranks.every((r) => r !== null)).toBe(true);
    expect(new Set(ranks).size).toBe(4);
  });

  it("no non-featured item has a featuredRank", async () => {
    const count = await prisma.menuItem.count({
      where: { isFeatured: false, featuredRank: { not: null } },
    });
    expect(count).toBe(0);
  });

  it("has at least one fasting item and at least one vegetarian item, independently", async () => {
    expect(await prisma.menuItem.count({ where: { isFasting: true } })).toBeGreaterThan(0);
    expect(await prisma.menuItem.count({ where: { isVegetarian: true } })).toBeGreaterThan(0);
  });

  it("every menu item resolves to a seeded category", async () => {
    const items = await prisma.menuItem.findMany({ include: { category: true } });
    expect(items.length).toBeGreaterThan(0);
    const orphans = items.filter((item) => item.category === null);
    expect(orphans).toEqual([]);
  });
});

describe("seed: testimonials (Art 13 [NN])", () => {
  it("all 5 testimonials have consentGiven true and a publishedAt", async () => {
    const testimonials = await prisma.testimonial.findMany();
    expect(testimonials).toHaveLength(5);
    for (const t of testimonials) {
      expect(t.consentGiven).toBe(true);
      expect(t.publishedAt).not.toBeNull();
    }
  });

  it("sources span more than one enum member", async () => {
    const testimonials = await prisma.testimonial.findMany({ select: { source: true } });
    const sources = new Set(testimonials.map((t) => t.source));
    expect(sources.size).toBeGreaterThan(1);
  });
});

describe("seed: branch hours — the midnight-crossing model (research R3)", () => {
  it("shobra has a BranchHour with closesNextDay true and closesAt < opensAt", async () => {
    const shobra = await prisma.branch.findUniqueOrThrow({ where: { slug: "shobra" } });
    const hours = await prisma.branchHour.findMany({ where: { branchId: shobra.id } });
    const crossing = hours.find((h) => h.closesNextDay);
    expect(crossing).toBeDefined();
    expect(crossing!.closesAt).toBeLessThan(crossing!.opensAt);
  });

  it("every heliopolis hour row is isOpen24h", async () => {
    const heliopolis = await prisma.branch.findUniqueOrThrow({ where: { slug: "heliopolis" } });
    const hours = await prisma.branchHour.findMany({ where: { branchId: heliopolis.id } });
    expect(hours.length).toBeGreaterThan(0);
    for (const hour of hours) {
      expect(hour.isOpen24h).toBe(true);
    }
  });
});

describe("seed: users (Art 29 [NN], FR-012)", () => {
  it("seeds exactly one ADMIN and one MODERATOR, both active", async () => {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    const moderators = await prisma.user.findMany({ where: { role: "MODERATOR" } });
    expect(admins).toHaveLength(1);
    expect(moderators).toHaveLength(1);
    expect(admins[0]!.isActive).toBe(true);
    expect(moderators[0]!.isActive).toBe(true);
  });

  it("every seeded password hash is a real argon2id hash, not a placeholder", async () => {
    const users = await prisma.user.findMany({ select: { passwordHash: true } });
    expect(users.length).toBeGreaterThanOrEqual(2);
    for (const user of users) {
      expect(user.passwordHash.startsWith("$argon2id$")).toBe(true);
    }
  });
});

describe("seed: reservations — Article 26 [NN] confirmation policy (FR-011, T026)", () => {
  it("every partySize > 6 reservation is PENDING with requiresCall true", async () => {
    const large = await prisma.reservation.findMany({ where: { partySize: { gt: 6 } } });
    expect(large.length).toBeGreaterThan(0);
    for (const r of large) {
      expect(r.status).toBe("PENDING");
      expect(r.requiresCall).toBe(true);
    }
  });

  it("every partySize <= 6 reservation has requiresCall false", async () => {
    const small = await prisma.reservation.findMany({ where: { partySize: { lte: 6 } } });
    expect(small.length).toBeGreaterThan(0);
    for (const r of small) {
      expect(r.requiresCall).toBe(false);
    }
  });

  it("all six ReservationStatus values appear at least once", async () => {
    const rows = await prisma.reservation.findMany({ select: { status: true } });
    const statuses = new Set(rows.map((r) => r.status));
    expect(statuses).toEqual(
      new Set(["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
    );
  });

  it("both branches appear among seeded reservations", async () => {
    const rows = await prisma.reservation.findMany({ select: { branchId: true } });
    const branchIds = new Set(rows.map((r) => r.branchId));
    expect(branchIds.size).toBe(2);
  });

  it("at least one reservation has no table assigned and at least one does", async () => {
    expect(await prisma.reservation.count({ where: { tableId: null } })).toBeGreaterThan(0);
    expect(await prisma.reservation.count({ where: { tableId: { not: null } } })).toBeGreaterThan(
      0,
    );
  });

  it("at least one reservation carries staffNotes (so the later leak test has real data)", async () => {
    const count = await prisma.reservation.count({ where: { staffNotes: { not: null } } });
    expect(count).toBeGreaterThan(0);
  });
});

describe("seed: Tier 3 guard rail (Art 12 [NN], T027)", () => {
  it("never seeds a PageBlock for nav/footer/button micro-copy — that belongs in messages/*.json", async () => {
    const forbidden = ["nav", "nav-links", "footer", "footer-links", "buttons"];
    const rows = await prisma.pageBlock.findMany({ where: { block: { in: forbidden } } });
    expect(rows).toEqual([]);
  });
});
