// Schema-shape tests (002-content-schema-seed, T010). No database — this is a text-level
// structural check against `prisma/schema.prisma` itself, so it runs everywhere (including a
// laptop with no Postgres) and catches the one regression a runtime test never would: someone
// adding `descriptionEn` without `descriptionAr` two features from now (research R13).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prisma/schema.prisma",
);
const schemaText = readFileSync(schemaPath, "utf-8");

/**
 * Splits the schema into `{ name, body }` per `model` block. Deliberately simple (line-based,
 * not a real Prisma parser) — this test only needs to reason about field *names*, never types
 * or attributes in depth, and a hand-rolled parser here would be more code to get wrong than
 * the schema itself.
 */
function parseModels(text: string): Array<{ name: string; body: string }> {
  const models: Array<{ name: string; body: string }> = [];
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(text)) !== null) {
    models.push({ name: match[1]!, body: match[2]! });
  }
  return models;
}

/** Field names declared directly on a model (skips `@@...` block attributes and comments). */
function fieldNames(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("@@") && !line.startsWith("//"))
    .map((line) => line.split(/\s+/)[0])
    .filter((name): name is string => Boolean(name));
}

const models = parseModels(schemaText);

function modelByName(name: string) {
  const model = models.find((m) => m.name === name);
  if (!model) throw new Error(`Expected schema.prisma to declare model "${name}"`);
  return model;
}

describe("schema shape: models exist", () => {
  // FR-001 — the 22 requested models plus PageSeo (data-model.md Domain 6 — SEO is per-page,
  // not per-block, so it cannot live inside PageBlock's JSON value without duplicating across
  // every block on a page). RolePermission added by 003-auth-authorization (data-model.md) —
  // the seeded role→permission map Article 14 [NN] requires.
  const expectedModels = [
    "User",
    "RefreshToken",
    "RolePermission",
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

  it.each(expectedModels)("declares model %s", (name) => {
    expect(models.some((m) => m.name === name)).toBe(true);
  });

  it("declares exactly 24 models (no stray extras, none missing)", () => {
    expect(models.map((m) => m.name).sort()).toEqual([...expectedModels].sort());
  });
});

describe("schema shape: bilingual column pairs (Art 21 [NN], FR-002)", () => {
  for (const model of models) {
    const fields = fieldNames(model.body);
    const enFields = fields.filter((f) => /En$/.test(f));
    const arFields = fields.filter((f) => /Ar$/.test(f));

    for (const en of enFields) {
      const stem = en.slice(0, -2);
      it(`${model.name}.${en} has an ${stem}Ar sibling`, () => {
        expect(fields).toContain(`${stem}Ar`);
      });
    }
    for (const ar of arFields) {
      const stem = ar.slice(0, -2);
      it(`${model.name}.${ar} has a ${stem}En sibling`, () => {
        expect(fields).toContain(`${stem}En`);
      });
    }
  }

  // Entered data — supplied by a guest or staff member about one specific transaction, with
  // exactly one true value (data-model.md's "authored content vs. entered data" rule). Each
  // stays a single column on the model that owns it, even though the pairing check above would
  // happily accept a same-named `*En`/`*Ar` pair if one existed. This is scoped per (model,
  // field) rather than globally: the *same* stem is legitimately bilingual elsewhere — `name` is
  // `nameEn`/`nameAr` on Branch/Category/MenuItem/TeamMember (authored content), and `slug` is
  // deliberately bilingual on Post (data-model.md — an Arabic article needs its own URL). Only
  // the specific owning model is asserted single-column here, not the field name in the abstract.
  const enteredDataFields: Array<[model: string, field: string]> = [
    ["User", "name"],
    ["Reservation", "customerName"],
    ["Reservation", "phone"],
    ["Reservation", "email"],
    ["Reservation", "notes"],
    ["Reservation", "staffNotes"],
    ["Testimonial", "author"],
    ["ContactMessage", "name"],
    ["ContactMessage", "email"],
    ["ContactMessage", "message"],
    ["ContactMessage", "subject"],
    ["Reservation", "code"],
    ["Branch", "slug"],
    ["Category", "slug"],
    ["MenuItem", "slug"],
  ];

  it.each(enteredDataFields)("%s.%s stays single-column, never bilingual-ized", (model, field) => {
    const fields = fieldNames(modelByName(model).body);
    expect(fields).toContain(field);
    expect(fields).not.toContain(`${field}En`);
    expect(fields).not.toContain(`${field}Ar`);
  });

  it("PageBlock.ctaHref is not bilingual (a route/URL is locale-agnostic)", () => {
    const fields = fieldNames(modelByName("PageBlock").body);
    expect(fields).toContain("ctaHref");
    expect(fields).not.toContain("ctaHrefEn");
    expect(fields).not.toContain("ctaHrefAr");
  });
});

describe("schema shape: soft delete columns (Art 15 [NN])", () => {
  // The constitution's Tier 1 list, minus AuditLog — which data-model.md deliberately makes
  // append-only (test below) since an editable/deletable audit log defeats its own purpose —
  // plus DiningTable, SiteSetting (full-CRUD content Article 12's list doesn't spell out by
  // name but data-model.md treats identically) and Tier 2's PageBlock/PageSeo (task T010(b)).
  const softDeletableModels = [
    "Branch",
    "BranchHour",
    "BranchClosure",
    "DiningTable",
    "Category",
    "MenuItem",
    "MenuItemVariant",
    "MenuItemBranch",
    "GalleryAlbum",
    "GalleryImage",
    "Testimonial",
    "FaqItem",
    "TeamMember",
    "Milestone",
    "Post",
    "Reservation",
    "ContactMessage",
    "User",
    "SiteSetting",
    "PageBlock",
    "PageSeo",
  ];

  it.each(softDeletableModels)("%s declares deletedAt DateTime?", (name) => {
    const fields = fieldNames(modelByName(name).body);
    expect(fields).toContain("deletedAt");
  });
});

describe("schema shape: append-only models carry no updatedAt/deletedAt", () => {
  // An audit trail or status-change history that can be edited or deleted is not a trail —
  // Article 15 [NN]'s entire point is that this history is tamper-evident.
  const appendOnlyModels = ["AuditLog", "ReservationEvent"];

  it.each(appendOnlyModels)("%s has no updatedAt", (name) => {
    const fields = fieldNames(modelByName(name).body);
    expect(fields).not.toContain("updatedAt");
  });

  it.each(appendOnlyModels)("%s has no deletedAt", (name) => {
    const fields = fieldNames(modelByName(name).body);
    expect(fields).not.toContain("deletedAt");
  });
});

describe("schema shape: required indexes (FR-003, FR-006)", () => {
  it("MenuItem declares @@index([isFasting])", () => {
    expect(modelByName("MenuItem").body).toMatch(/@@index\(\[isFasting\]\)/);
  });

  it("MenuItem declares @@index([isFeatured])", () => {
    expect(modelByName("MenuItem").body).toMatch(/@@index\(\[isFeatured\]\)/);
  });

  it("Reservation declares @@index([branchId, reservedAt])", () => {
    expect(modelByName("Reservation").body).toMatch(/@@index\(\[branchId,\s*reservedAt\]\)/);
  });

  it("Reservation declares @@index([status, reservedAt])", () => {
    expect(modelByName("Reservation").body).toMatch(/@@index\(\[status,\s*reservedAt\]\)/);
  });

  it("Reservation declares @@index([phone])", () => {
    expect(modelByName("Reservation").body).toMatch(/@@index\(\[phone\]\)/);
  });
});

describe("schema shape: Tier 12 [NN] guard rails", () => {
  it("PageBlock is keyed by (page, block) — clarification 2026-08-10", () => {
    expect(modelByName("PageBlock").body).toMatch(/@@unique\(\[page,\s*block\]\)/);
  });

  it("PageSeo is keyed by page alone", () => {
    const fields = fieldNames(modelByName("PageSeo").body);
    expect(fields).toContain("page");
  });
});
