// Migration test (002-content-schema-seed, T011, research R13 layer 2). Applies whatever
// migration files already exist under `prisma/migrations/` to a database via `prisma migrate
// deploy` — the same command `migrate.yml` runs against production (Article 32 [NN]) — and
// asserts every expected table landed. `migrate deploy` only ever applies committed migrations;
// it never generates one, so this test proves the committed SQL is reproducible from scratch,
// not just that it happened to work on whoever's machine ran `prisma migrate dev`.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnect, prisma } from "./helpers/db";

const apiRoot = path.resolve(import.meta.dirname, "..");

const expectedModels = [
  "User",
  "RefreshToken",
  "Branch",
  "BranchHour",
  "BranchClosure",
  "DiningTable",
  "Category",
  "MenuItem",
  "MenuItemVariant",
  "MenuItemBranch",
  "Reservation",
  "ReservationEvent",
  "GalleryAlbum",
  "GalleryImage",
  "Testimonial",
  "FaqItem",
  "TeamMember",
  "Milestone",
  "Post",
  "PageBlock",
  "PageSeo",
  "ContactMessage",
  "SiteSetting",
  "AuditLog",
];

beforeAll(() => {
  // `migrate deploy` needs no `--env-file-if-exists` flag here: this process is already vitest,
  // launched with DATABASE_URL present (tests/helpers/db.ts refuses to load otherwise), and
  // execFileSync inherits the parent's environment by default.
  execFileSync(
    process.execPath,
    [path.join(apiRoot, "node_modules/prisma/build/index.js"), "migrate", "deploy"],
    { cwd: apiRoot, stdio: "pipe" },
  );
});

afterAll(async () => {
  await disconnect();
});

describe("migration: all 24 tables exist after a clean deploy", () => {
  it("creates every expected application table plus Prisma's own migrations table", async () => {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    const tableNames = rows.map((r) => r.tablename);

    for (const model of expectedModels) {
      expect(tableNames, `expected table "${model}"`).toContain(model);
    }
    expect(tableNames).toContain("_prisma_migrations");
    expect(tableNames).toHaveLength(expectedModels.length + 1);
  });
});
