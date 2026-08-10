// Seed idempotency tests (002-content-schema-seed, T040-T041, FR-013, SC-004). Runs the seed
// twice and asserts nothing changes on the second pass, then proves the seed never touches a row
// it did not create — the spec's own edge case.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnect, prisma, resetDatabase } from "./helpers/db";

const apiRoot = path.resolve(import.meta.dirname, "..");

function runSeedOnce(): void {
  execFileSync(
    process.execPath,
    [path.join(apiRoot, "node_modules/tsx/dist/cli.mjs"), "prisma/seed.ts"],
    { cwd: apiRoot, stdio: "pipe" },
  );
}

const MODELS = [
  "siteSetting",
  "user",
  "branch",
  "branchHour",
  "diningTable",
  "category",
  "menuItem",
  "menuItemVariant",
  "menuItemBranch",
  "galleryAlbum",
  "galleryImage",
  "testimonial",
  "faqItem",
  "teamMember",
  "milestone",
  "post",
  "pageSeo",
  "pageBlock",
  "reservation",
  "reservationEvent",
] as const;

async function countAll(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const model of MODELS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic count() across models
    counts[model] = await (prisma as any)[model].count();
  }
  return counts;
}

beforeAll(async () => {
  await resetDatabase();
}, 60_000);

afterAll(async () => {
  await disconnect();
});

describe("seed idempotency: re-running changes nothing (T040)", () => {
  it("seed run twice leaves every model's row count unchanged", async () => {
    runSeedOnce();
    const firstCounts = await countAll();

    runSeedOnce();
    const secondCounts = await countAll();

    expect(secondCounts).toEqual(firstCounts);
  }, 60_000);
});

describe("seed idempotency: never touches rows it did not create (T041)", () => {
  it("a hand-entered reservation survives a re-seed untouched", async () => {
    const branch = await prisma.branch.findFirstOrThrow();
    const handEntered = await prisma.reservation.create({
      data: {
        code: "HAND01", // deliberately NOT a SEED* code — this row is not seed-owned
        branchId: branch.id,
        customerName: "Walk-in Guest",
        phone: "+20 100 555 0000",
        partySize: 2,
        reservedAt: new Date(),
        status: "CONFIRMED",
      },
    });

    runSeedOnce();

    const stillThere = await prisma.reservation.findUnique({ where: { id: handEntered.id } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.code).toBe("HAND01");
    expect(stillThere?.customerName).toBe("Walk-in Guest");
  }, 60_000);

  it("a hand-entered contact message survives a re-seed untouched", async () => {
    const handEntered = await prisma.contactMessage.create({
      data: {
        name: "Untouched Guest",
        email: "untouched.guest.test@example.com",
        message: "This row was not created by the seed script.",
      },
    });

    runSeedOnce();

    const stillThere = await prisma.contactMessage.findUnique({ where: { id: handEntered.id } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.name).toBe("Untouched Guest");
  }, 60_000);
});
