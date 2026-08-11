// Seed module: Branch, BranchHour, DiningTable (T030, refactored T106). Branches upserted on
// `slug`; hours on `[branchId, dayOfWeek]`; tables on `[branchId, code]` (research R6).
//
// 004-web-design-system-port (FR-022, research R7/R8): nameEn/addressEn/phone/mapUrl now import
// from `@pascca/web/content/branches` instead of the independent, already-diverged placeholder
// copy this module used to hand-write (the old TODO(client-data) Shobra address "26 July
// Corridor, Shobra, Cairo" is replaced by files/site's real "273 Shobra Street, Cairo"). Only
// `latitude`/`longitude` (parsed straight out of the fixture's `mapUrl` — a Google Maps
// "?q=lat,lng" link, so this isn't a second coordinate source, just a derived read) and the
// operational fields no page ever shows (seatCapacity, per-day hours/table structure) stay
// seed-local — nothing in `files/site/` models those.
import type { PrismaClient } from "@prisma/client";
import { branches as branchContent } from "@pascca/web/content/branches";

export interface SeededBranches {
  shobraId: string;
  heliopolisId: string;
  tableIds: { shobra: string[]; heliopolis: string[] };
}

const DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday … 6 = Saturday — every day, both branches open

function coordsFromMapUrl(mapUrl: string | null): { latitude: number; longitude: number } {
  const match = mapUrl?.match(/q=(-?[\d.]+),(-?[\d.]+)/);
  if (!match) throw new Error(`seedBranches: could not parse coordinates from mapUrl "${mapUrl}"`);
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
}

function branchBySlug(slug: string) {
  const branch = branchContent.find((b) => b.slug === slug);
  if (!branch) throw new Error(`seedBranches: no fixture branch with slug "${slug}"`);
  return branch;
}

export async function seedBranches(prisma: PrismaClient): Promise<SeededBranches> {
  const shobraContent = branchBySlug("shobra");
  const heliopolisContent = branchBySlug("heliopolis");
  const shobraCoords = coordsFromMapUrl(shobraContent.mapUrl);
  const heliopolisCoords = coordsFromMapUrl(heliopolisContent.mapUrl);

  const shobra = await prisma.branch.upsert({
    where: { slug: "shobra" },
    update: {},
    create: {
      slug: "shobra",
      nameEn: shobraContent.nameEn,
      addressEn: shobraContent.addressEn,
      descriptionEn: "Where it all started in 2018 — the original stone oven, still going.",
      phone: shobraContent.phone,
      whatsapp: null,
      email: null,
      latitude: shobraCoords.latitude,
      longitude: shobraCoords.longitude,
      mapUrl: shobraContent.mapUrl,
      seatCapacity: 60,
      sortOrder: 0,
    },
  });

  const heliopolis = await prisma.branch.upsert({
    where: { slug: "heliopolis" },
    update: {},
    create: {
      slug: "heliopolis",
      nameEn: heliopolisContent.nameEn,
      addressEn: heliopolisContent.addressEn,
      descriptionEn: "Open around the clock — because a craving doesn't check the time.",
      phone: heliopolisContent.phone,
      whatsapp: null,
      email: null,
      latitude: heliopolisCoords.latitude,
      longitude: heliopolisCoords.longitude,
      mapUrl: heliopolisContent.mapUrl,
      seatCapacity: 80,
      sortOrder: 1,
    },
  });

  for (const dayOfWeek of DAYS) {
    await prisma.branchHour.upsert({
      where: { branchId_dayOfWeek: { branchId: shobra.id, dayOfWeek } },
      update: {},
      create: {
        branchId: shobra.id,
        dayOfWeek,
        opensAt: 720, // 12:00
        closesAt: 120, // 02:00 the following day — NOT after opensAt, matches "12pm — 2am" (FR-022)
        closesNextDay: true,
        isOpen24h: false,
      },
    });

    await prisma.branchHour.upsert({
      where: { branchId_dayOfWeek: { branchId: heliopolis.id, dayOfWeek } },
      update: {},
      create: {
        branchId: heliopolis.id,
        dayOfWeek,
        opensAt: 0,
        closesAt: 0,
        closesNextDay: true,
        isOpen24h: true,
      },
    });
  }

  const shobraTables = [
    { code: "T1", seats: 2 },
    { code: "T2", seats: 2 },
    { code: "T3", seats: 4 },
    { code: "T4", seats: 4 },
    { code: "T5", seats: 6 },
    { code: "TERRACE-1", seats: 8, labelEn: "Terrace, by the window" },
  ];
  const heliopolisTables = [
    { code: "T1", seats: 2 },
    { code: "T2", seats: 4 },
    { code: "T3", seats: 4 },
    { code: "T4", seats: 6 },
    { code: "T5", seats: 6 },
    { code: "TERRACE-1", seats: 10, labelEn: "Terrace, by the window" },
  ];

  const shobraTableIds: string[] = [];
  for (const [i, t] of shobraTables.entries()) {
    const table = await prisma.diningTable.upsert({
      where: { branchId_code: { branchId: shobra.id, code: t.code } },
      update: {},
      create: {
        branchId: shobra.id,
        code: t.code,
        labelEn: t.labelEn ?? null,
        seats: t.seats,
        sortOrder: i,
      },
    });
    shobraTableIds.push(table.id);
  }

  const heliopolisTableIds: string[] = [];
  for (const [i, t] of heliopolisTables.entries()) {
    const table = await prisma.diningTable.upsert({
      where: { branchId_code: { branchId: heliopolis.id, code: t.code } },
      update: {},
      create: {
        branchId: heliopolis.id,
        code: t.code,
        labelEn: t.labelEn ?? null,
        seats: t.seats,
        sortOrder: i,
      },
    });
    heliopolisTableIds.push(table.id);
  }

  return {
    shobraId: shobra.id,
    heliopolisId: heliopolis.id,
    tableIds: { shobra: shobraTableIds, heliopolis: heliopolisTableIds },
  };
}
