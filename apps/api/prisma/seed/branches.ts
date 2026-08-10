// Seed module: Branch, BranchHour, DiningTable (T030). Branches upserted on `slug`; hours on
// `[branchId, dayOfWeek]`; tables on `[branchId, code]` (research R6).
//
// ⚠️ contracts/seed-dataset.md: the address, phone, and coordinate values below are marked
// TODO(client-data) — realistic placeholders that make the site demoable, NOT client-supplied
// facts. They must be replaced with verified values, or the PR description must disclose plainly
// that this data is unverified, before this branch merges (T049).
//
// The *structure* of the hours is not a placeholder — it is given directly by the feature
// request and is the single most load-bearing subtlety in this schema (research R3): Shobra
// closes at 02:00, past midnight, so `closesAt (120) < opensAt (720)` is correct, not a bug.
// Heliopolis is open 24 hours, every day.
import type { PrismaClient } from "@prisma/client";

export interface SeededBranches {
  shobraId: string;
  heliopolisId: string;
  tableIds: { shobra: string[]; heliopolis: string[] };
}

const DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday … 6 = Saturday — every day, both branches open

export async function seedBranches(prisma: PrismaClient): Promise<SeededBranches> {
  const shobra = await prisma.branch.upsert({
    where: { slug: "shobra" },
    update: {},
    create: {
      slug: "shobra",
      nameEn: "Pascca — Shobra",
      addressEn: "26 July Corridor, Shobra, Cairo", // TODO(client-data): unverified placeholder
      descriptionEn: "Where it all started in 2018 — the original stone oven, still going.",
      phone: "+20 2 2222 0001", // TODO(client-data): unverified placeholder
      whatsapp: null,
      email: "shobra@pascca.local", // TODO(client-data): unverified placeholder
      latitude: 30.0667, // TODO(client-data): district-level, not the exact building
      longitude: 31.246,
      seatCapacity: 60,
      sortOrder: 0,
    },
  });

  const heliopolis = await prisma.branch.upsert({
    where: { slug: "heliopolis" },
    update: {},
    create: {
      slug: "heliopolis",
      nameEn: "Pascca — Heliopolis",
      addressEn: "El Nozha Street, Heliopolis, Cairo", // TODO(client-data): unverified placeholder
      descriptionEn: "Open around the clock — because a craving doesn't check the time.",
      phone: "+20 2 2222 0002", // TODO(client-data): unverified placeholder
      whatsapp: null,
      email: "heliopolis@pascca.local", // TODO(client-data): unverified placeholder
      latitude: 30.0808, // TODO(client-data): district-level, not the exact building
      longitude: 31.3231,
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
        closesAt: 120, // 02:00 the following day — NOT after opensAt, see module comment
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
