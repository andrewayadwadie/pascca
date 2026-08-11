// Seed module: Category, MenuItem (T031, refactored T107).
//
// 004-web-design-system-port (FR-022, research R7/R8): every category and item now imports from
// `@pascca/web/content/menu` instead of the independent placeholder menu this module used to
// hand-write — that placeholder menu (Diavola, Tagliatelle al Tartufo, Funghi e Tartufo…) had
// already diverged into a genuinely different dish list from files/site/menu.html's real one
// (Margherita, Quattro Formaggi, Truffle Pasta…), not just different prices. `MenuItemVariant`/
// `MenuItemBranch` rows are dropped — files/site models neither sizes nor per-branch price
// overrides for any dish, so seeding them would itself be inventing data the source doesn't
// have (data-model.md's own rule).
import type { PrismaClient } from "@prisma/client";
import { categories as categoryContent, menuItems as menuItemContent } from "@pascca/web/content/menu";

export async function seedMenu(prisma: PrismaClient): Promise<void> {
  for (const category of categoryContent) {
    const categoryRow = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        sortOrder: category.sortOrder,
      },
    });

    const items = menuItemContent.filter((item) => item.categorySlug === category.slug);

    for (const [itemIndex, item] of items.entries()) {
      await prisma.menuItem.upsert({
        where: { slug: item.slug },
        update: {},
        create: {
          categoryId: categoryRow.id,
          slug: item.slug,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          descriptionEn: item.descriptionEn,
          descriptionAr: item.descriptionAr,
          price: item.price,
          isFasting: item.isFasting,
          isVegetarian: item.isVegetarian,
          isFeatured: item.isFeatured,
          featuredRank: item.featuredRank,
          sortOrder: itemIndex,
        },
      });
    }
  }
}
