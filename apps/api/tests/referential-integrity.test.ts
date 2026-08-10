// Referential-integrity tests (002-content-schema-seed, T045, SC-006). Walks every seeded
// foreign-key relation explicitly — by name, not by trusting the orchestrator's insertion order —
// and asserts zero orphaned references. Postgres's own FK constraints make a genuinely dangling
// reference impossible to insert in the first place; the value of this test is as a named,
// enumerated regression guard: if research R7's dependency order in `prisma/seed/index.ts` is
// ever reordered by mistake, or a relation's constraint is ever loosened, this is what catches it.
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

/**
 * Asserts every non-null value returned by `fetchChildFks` appears in the set returned by
 * `fetchParentIds`. Fetches both sides in bulk (this feature seeds ~200 rows total) rather than
 * querying per-row, so the whole suite stays fast.
 */
async function assertNoOrphans(
  label: string,
  fetchChildFks: () => Promise<Array<string | null>>,
  fetchParentIds: () => Promise<string[]>,
): Promise<void> {
  const [childFks, parentIds] = await Promise.all([fetchChildFks(), fetchParentIds()]);
  const parentIdSet = new Set(parentIds);
  const orphans = childFks.filter((fk): fk is string => fk !== null && !parentIdSet.has(fk));
  expect(orphans, `${label}: orphaned FK value(s) ${orphans.join(", ")}`).toEqual([]);
}

/** Resolves a findMany({ select: { id: true } }) promise down to a plain array of ids. */
async function ids(rows: Promise<Array<{ id: string }>>): Promise<string[]> {
  return (await rows).map((r) => r.id);
}

describe("referential integrity: zero orphaned foreign keys (T045, SC-006)", () => {
  it("RefreshToken.userId -> User", async () => {
    await assertNoOrphans(
      "RefreshToken.userId",
      async () => (await prisma.refreshToken.findMany({ select: { userId: true } })).map((r) => r.userId),
      () => ids(prisma.user.findMany({ select: { id: true } })),
    );
  });

  it("BranchHour.branchId -> Branch", async () => {
    await assertNoOrphans(
      "BranchHour.branchId",
      async () => (await prisma.branchHour.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("BranchClosure.branchId -> Branch", async () => {
    await assertNoOrphans(
      "BranchClosure.branchId",
      async () => (await prisma.branchClosure.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("DiningTable.branchId -> Branch", async () => {
    await assertNoOrphans(
      "DiningTable.branchId",
      async () => (await prisma.diningTable.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("MenuItem.categoryId -> Category", async () => {
    await assertNoOrphans(
      "MenuItem.categoryId",
      async () => (await prisma.menuItem.findMany({ select: { categoryId: true } })).map((r) => r.categoryId),
      () => ids(prisma.category.findMany({ select: { id: true } })),
    );
  });

  it("MenuItemVariant.menuItemId -> MenuItem", async () => {
    await assertNoOrphans(
      "MenuItemVariant.menuItemId",
      async () =>
        (await prisma.menuItemVariant.findMany({ select: { menuItemId: true } })).map((r) => r.menuItemId),
      () => ids(prisma.menuItem.findMany({ select: { id: true } })),
    );
  });

  it("MenuItemBranch.menuItemId -> MenuItem", async () => {
    await assertNoOrphans(
      "MenuItemBranch.menuItemId",
      async () =>
        (await prisma.menuItemBranch.findMany({ select: { menuItemId: true } })).map((r) => r.menuItemId),
      () => ids(prisma.menuItem.findMany({ select: { id: true } })),
    );
  });

  it("MenuItemBranch.branchId -> Branch", async () => {
    await assertNoOrphans(
      "MenuItemBranch.branchId",
      async () => (await prisma.menuItemBranch.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("Reservation.branchId -> Branch", async () => {
    await assertNoOrphans(
      "Reservation.branchId",
      async () => (await prisma.reservation.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("Reservation.tableId -> DiningTable (nullable — at least one seeded row is null, FR-011)", async () => {
    await assertNoOrphans(
      "Reservation.tableId",
      async () => (await prisma.reservation.findMany({ select: { tableId: true } })).map((r) => r.tableId),
      () => ids(prisma.diningTable.findMany({ select: { id: true } })),
    );
  });

  it("Reservation.handledById -> User (nullable)", async () => {
    await assertNoOrphans(
      "Reservation.handledById",
      async () => (await prisma.reservation.findMany({ select: { handledById: true } })).map((r) => r.handledById),
      () => ids(prisma.user.findMany({ select: { id: true } })),
    );
  });

  it("ReservationEvent.reservationId -> Reservation", async () => {
    await assertNoOrphans(
      "ReservationEvent.reservationId",
      async () =>
        (await prisma.reservationEvent.findMany({ select: { reservationId: true } })).map(
          (r) => r.reservationId,
        ),
      () => ids(prisma.reservation.findMany({ select: { id: true } })),
    );
  });

  it("ReservationEvent.actorId -> User (nullable)", async () => {
    await assertNoOrphans(
      "ReservationEvent.actorId",
      async () => (await prisma.reservationEvent.findMany({ select: { actorId: true } })).map((r) => r.actorId),
      () => ids(prisma.user.findMany({ select: { id: true } })),
    );
  });

  it("GalleryImage.albumId -> GalleryAlbum", async () => {
    await assertNoOrphans(
      "GalleryImage.albumId",
      async () => (await prisma.galleryImage.findMany({ select: { albumId: true } })).map((r) => r.albumId),
      () => ids(prisma.galleryAlbum.findMany({ select: { id: true } })),
    );
  });

  it("GalleryImage.branchId -> Branch (nullable)", async () => {
    await assertNoOrphans(
      "GalleryImage.branchId",
      async () => (await prisma.galleryImage.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("Testimonial.branchId -> Branch (nullable)", async () => {
    await assertNoOrphans(
      "Testimonial.branchId",
      async () => (await prisma.testimonial.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("TeamMember.branchId -> Branch (nullable)", async () => {
    await assertNoOrphans(
      "TeamMember.branchId",
      async () => (await prisma.teamMember.findMany({ select: { branchId: true } })).map((r) => r.branchId),
      () => ids(prisma.branch.findMany({ select: { id: true } })),
    );
  });

  it("Post.authorId -> User (nullable)", async () => {
    await assertNoOrphans(
      "Post.authorId",
      async () => (await prisma.post.findMany({ select: { authorId: true } })).map((r) => r.authorId),
      () => ids(prisma.user.findMany({ select: { id: true } })),
    );
  });

  it("ContactMessage.handledById -> User (nullable — all seeded rows are unhandled by a real actor)", async () => {
    await assertNoOrphans(
      "ContactMessage.handledById",
      async () =>
        (await prisma.contactMessage.findMany({ select: { handledById: true } })).map((r) => r.handledById),
      () => ids(prisma.user.findMany({ select: { id: true } })),
    );
  });

  it("AuditLog.actorId -> User (nullable — AuditLog is seeded empty, FR-014)", async () => {
    await assertNoOrphans(
      "AuditLog.actorId",
      async () => (await prisma.auditLog.findMany({ select: { actorId: true } })).map((r) => r.actorId),
      () => ids(prisma.user.findMany({ select: { id: true } })),
    );
  });
});
