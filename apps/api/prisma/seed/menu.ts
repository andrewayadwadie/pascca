// Seed module: Category, MenuItem, MenuItemVariant, MenuItemBranch (T031).
//
// Categories upserted on `slug`, in Article 18's fixed menu order. Items upserted on `slug`.
// Every price is Int piastres (research R2) — Article 2 [NN]: a dish without a price is a defect,
// so there is no such row here. Four items are `isFeatured` with distinct ranks 1–4 (human
// curation, Article 13 [NN] — never auto-ranked). `isFasting` and `isVegetarian` are independent
// flags: a fasting dish (no meat, no dairy) is not automatically "the" vegetarian dish, and vice
// versa — several rows below carry only one of the two on purpose.
//
// Variants exist only where a dish genuinely has sizes. MenuItemBranch rows exist only where a
// divergence is real — seeding one per item × branch would recreate the redundant second price
// source `null`-means-inherit was designed to avoid (Article 8 [NN]).
import type { PrismaClient } from "@prisma/client";
import type { SeededBranches } from "./branches";

interface ItemSeed {
  slug: string;
  nameEn: string;
  descriptionEn?: string;
  price: number; // piastres
  isFasting?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  prepMinutes?: number;
}

interface CategorySeed {
  slug: string;
  nameEn: string;
  descriptionEn: string;
  items: ItemSeed[];
}

// Article 18's fixed order: pizza, calzone, pasta, mains, starters, breakfast, desserts, drinks.
const CATEGORIES: CategorySeed[] = [
  {
    slug: "pizza",
    nameEn: "Pizza",
    descriptionEn: "Stone-oven, the way it should be. Freshly baked with love.",
    items: [
      {
        slug: "margherita-pizza",
        nameEn: "Margherita",
        descriptionEn: "Tomato, mozzarella, basil. The one that started it all.",
        price: 16000,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 14,
      },
      {
        slug: "quattro-formaggi-pizza",
        nameEn: "Quattro Formaggi",
        descriptionEn: "Four cheeses, one very good decision.",
        price: 19000,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 14,
      },
      {
        slug: "diavola-pizza",
        nameEn: "Diavola",
        descriptionEn: "Spicy salami, chili oil. Not for the faint of heart.",
        price: 19500,
        isSpicy: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 15,
      },
      {
        slug: "funghi-tartufo-pizza",
        nameEn: "Funghi e Tartufo",
        descriptionEn: "Wild mushrooms, a whisper of truffle.",
        price: 22000,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 16,
      },
      {
        slug: "marinara-pizza",
        nameEn: "Marinara",
        descriptionEn: "Tomato, garlic, oregano. No cheese, no compromise — صيامي.",
        price: 14000,
        isVegetarian: true,
        isFasting: true,
        allergens: ["gluten"],
        prepMinutes: 12,
      },
    ],
  },
  {
    slug: "calzone",
    nameEn: "Calzone",
    descriptionEn: "Everything a pizza is, folded in half and somehow better.",
    items: [
      {
        slug: "calzone-classico",
        nameEn: "Calzone Classico",
        descriptionEn: "Ham, mozzarella, tomato — the one everyone orders twice.",
        price: 18500,
        isVegetarian: false,
        allergens: ["gluten", "dairy"],
        prepMinutes: 16,
      },
      {
        slug: "calzone-piccante",
        nameEn: "Calzone Piccante",
        descriptionEn: "Spicy salami, hot honey drizzle.",
        price: 20000,
        isSpicy: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 17,
      },
      {
        slug: "calzone-funghi-tartufo",
        nameEn: "Calzone Funghi e Tartufo",
        descriptionEn: "Mushroom, truffle, a little indulgence.",
        price: 21000,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 17,
      },
      {
        slug: "calzone-verdure",
        nameEn: "Calzone alle Verdure",
        descriptionEn: "Roasted vegetables, ricotta.",
        price: 17500,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 16,
      },
      {
        slug: "calzone-quattro-stagioni",
        nameEn: "Calzone Quattro Stagioni",
        descriptionEn: "Four fillings, four moods, one calzone.",
        price: 21500,
        allergens: ["gluten", "dairy"],
        prepMinutes: 18,
      },
    ],
  },
  {
    slug: "pasta",
    nameEn: "Pasta",
    descriptionEn: "Fresh, daily, no shortcuts.",
    items: [
      {
        slug: "tagliatelle-tartufo",
        nameEn: "Tagliatelle al Tartufo",
        descriptionEn: "Our signature. Ask anyone who's had it.",
        price: 24000,
        isVegetarian: true,
        allergens: ["gluten", "dairy", "egg"],
        prepMinutes: 18,
      },
      {
        slug: "spaghetti-pomodoro",
        nameEn: "Spaghetti al Pomodoro",
        descriptionEn: "Tomato, basil, olive oil. Simple, and that's the point — صيامي.",
        price: 14000,
        isVegetarian: true,
        isFasting: true,
        allergens: ["gluten"],
        prepMinutes: 14,
      },
      {
        slug: "penne-arrabbiata",
        nameEn: "Penne all'Arrabbiata",
        descriptionEn: "Angry, in the best way — صيامي.",
        price: 15000,
        isVegetarian: true,
        isFasting: true,
        isSpicy: true,
        allergens: ["gluten"],
        prepMinutes: 14,
      },
      {
        slug: "fettuccine-alfredo",
        nameEn: "Fettuccine Alfredo",
        descriptionEn: "Butter, parmesan, cream. No apologies.",
        price: 17500,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 15,
      },
      {
        slug: "pasta-frutti-di-mare",
        nameEn: "Pasta ai Frutti di Mare",
        descriptionEn: "Whatever came in fresh from the sea today.",
        price: 23000,
        allergens: ["gluten", "shellfish"],
        prepMinutes: 20,
      },
    ],
  },
  {
    slug: "mains",
    nameEn: "Mains",
    descriptionEn: "For when pizza and pasta aren't the whole story.",
    items: [
      {
        slug: "pollo-milanese",
        nameEn: "Pollo alla Milanese",
        descriptionEn: "Breaded chicken, crisp edges, lemon.",
        price: 19500,
        allergens: ["gluten", "egg"],
        prepMinutes: 20,
      },
      {
        slug: "tagliata-manzo",
        nameEn: "Tagliata di Manzo",
        descriptionEn: "Sliced steak, rocket, parmesan shavings.",
        price: 28500,
        allergens: ["dairy"],
        prepMinutes: 22,
      },
      {
        slug: "salmone-griglia",
        nameEn: "Salmone alla Griglia",
        descriptionEn: "Grilled salmon, seasonal greens.",
        price: 26000,
        allergens: ["fish"],
        prepMinutes: 20,
      },
      {
        slug: "melanzane-parmigiana",
        nameEn: "Melanzane alla Parmigiana",
        descriptionEn: "Layers of eggplant, tomato, mozzarella. No meat required.",
        price: 17000,
        isVegetarian: true,
        allergens: ["dairy"],
        prepMinutes: 18,
      },
      {
        slug: "grigliata-mista",
        nameEn: "Grigliata Mista",
        descriptionEn: "The mixed grill — bring an appetite.",
        price: 32000,
        prepMinutes: 25,
      },
    ],
  },
  {
    slug: "starters",
    nameEn: "Starters",
    descriptionEn: "Something to share while you decide on everything else.",
    items: [
      {
        slug: "bruschetta-pomodoro",
        nameEn: "Bruschetta al Pomodoro",
        descriptionEn: "Toasted bread, tomato, basil, olive oil — صيامي.",
        price: 8500,
        isVegetarian: true,
        isFasting: true,
        allergens: ["gluten"],
        prepMinutes: 8,
      },
      {
        slug: "insalata-caprese",
        nameEn: "Insalata Caprese",
        descriptionEn: "Tomato, mozzarella, basil, done properly.",
        price: 9500,
        isVegetarian: true,
        allergens: ["dairy"],
        prepMinutes: 6,
      },
      {
        slug: "arancini-riso",
        nameEn: "Arancini di Riso",
        descriptionEn: "Crisp rice balls, molten centre.",
        price: 9000,
        isVegetarian: true,
        allergens: ["gluten", "dairy", "egg"],
        prepMinutes: 10,
      },
      {
        slug: "minestrone",
        nameEn: "Minestrone",
        descriptionEn: "Vegetable soup, the way a nonna would make it — صيامي.",
        price: 8000,
        isVegetarian: true,
        isFasting: true,
        prepMinutes: 10,
      },
      {
        slug: "calamari-fritti",
        nameEn: "Calamari Fritti",
        descriptionEn: "Fried squid, lemon, a little chili.",
        price: 12000,
        allergens: ["shellfish", "gluten"],
        prepMinutes: 12,
      },
    ],
  },
  {
    slug: "breakfast",
    nameEn: "Breakfast",
    descriptionEn: "Because a good morning deserves a good reason to get up.",
    items: [
      {
        slug: "pascca-breakfast",
        nameEn: "Pascca Breakfast",
        descriptionEn: "Eggs, cheeses, olives, fresh bread — the full spread.",
        price: 16000,
        isVegetarian: true,
        allergens: ["dairy", "egg", "gluten"],
        prepMinutes: 15,
      },
      {
        slug: "shakshuka",
        nameEn: "Shakshuka",
        descriptionEn: "Eggs poached in spiced tomato, straight from the pan.",
        price: 13500,
        isVegetarian: true,
        isSpicy: true,
        allergens: ["egg"],
        prepMinutes: 14,
      },
      {
        slug: "french-toast",
        nameEn: "French Toast",
        descriptionEn: "Brioche, maple, berries.",
        price: 12500,
        isVegetarian: true,
        allergens: ["gluten", "dairy", "egg"],
        prepMinutes: 10,
      },
      {
        slug: "avocado-toast",
        nameEn: "Avocado Toast",
        descriptionEn: "Sourdough, avocado, chili flakes — صيامي.",
        price: 13000,
        isVegetarian: true,
        isFasting: true,
        allergens: ["gluten"],
        prepMinutes: 8,
      },
      {
        slug: "croissant-plate",
        nameEn: "Croissant Plate",
        descriptionEn: "Warm croissant, jam, butter.",
        price: 9500,
        isVegetarian: true,
        allergens: ["gluten", "dairy"],
        prepMinutes: 5,
      },
    ],
  },
  {
    slug: "desserts",
    nameEn: "Desserts",
    descriptionEn: "You've come this far.",
    items: [
      {
        slug: "tiramisu",
        nameEn: "Tiramisu",
        descriptionEn: "Espresso-soaked, mascarpone, cocoa. The classic, done right.",
        price: 11000,
        isVegetarian: true,
        allergens: ["dairy", "egg", "gluten"],
        prepMinutes: 5,
      },
      {
        slug: "panna-cotta",
        nameEn: "Panna Cotta",
        descriptionEn: "Silky, simple, berry compote.",
        price: 9500,
        isVegetarian: true,
        allergens: ["dairy"],
        prepMinutes: 5,
      },
      {
        slug: "calzone-nutella",
        nameEn: "Calzone alla Nutella",
        descriptionEn: "Yes, a dessert calzone. You're welcome.",
        price: 12500,
        isVegetarian: true,
        allergens: ["gluten", "dairy", "nuts"],
        prepMinutes: 12,
      },
      {
        slug: "gelato-trio",
        nameEn: "Gelato Trio",
        descriptionEn: "Three scoops, your call.",
        price: 8500,
        isVegetarian: true,
        allergens: ["dairy"],
        prepMinutes: 3,
      },
      {
        slug: "cheesecake",
        nameEn: "New York Cheesecake",
        descriptionEn: "Dense, creamy, a little tart.",
        price: 11500,
        isVegetarian: true,
        allergens: ["dairy", "gluten", "egg"],
        prepMinutes: 4,
      },
    ],
  },
  {
    slug: "drinks",
    nameEn: "Drinks",
    descriptionEn: "Something on the side.",
    items: [
      {
        slug: "fresh-lemonade",
        nameEn: "Fresh Lemonade",
        price: 4500,
        isVegetarian: true,
        isFasting: true,
        prepMinutes: 4,
      },
      {
        slug: "italian-soda",
        nameEn: "Italian Soda",
        price: 5000,
        isVegetarian: true,
        isFasting: true,
        prepMinutes: 3,
      },
      {
        slug: "espresso",
        nameEn: "Espresso",
        price: 3500,
        isVegetarian: true,
        isFasting: true,
        prepMinutes: 3,
      },
      {
        slug: "cappuccino",
        nameEn: "Cappuccino",
        price: 4500,
        isVegetarian: true,
        allergens: ["dairy"],
        prepMinutes: 4,
      },
      {
        slug: "fresh-orange-juice",
        nameEn: "Fresh Orange Juice",
        price: 5500,
        isVegetarian: true,
        isFasting: true,
        prepMinutes: 3,
      },
    ],
  },
];

// Article 13 [NN]: featured dishes are chosen by a human, ranked by hand. One per signature
// theme named in Article 2 (stone oven, truffle pasta, calzone, breakfast/dessert).
const FEATURED_RANKS: Record<string, number> = {
  "tagliatelle-tartufo": 1,
  "margherita-pizza": 2,
  "calzone-classico": 3,
  tiramisu: 4,
};

// Only where a dish genuinely has sizes (research: variants are absolute prices, not deltas).
const VARIANTS: Record<string, Array<{ nameEn: string; price: number; isDefault?: boolean }>> = {
  "margherita-pizza": [
    { nameEn: "Regular", price: 16000, isDefault: true },
    { nameEn: "Large", price: 21000 },
  ],
  "quattro-formaggi-pizza": [
    { nameEn: "Regular", price: 19000, isDefault: true },
    { nameEn: "Large", price: 25000 },
  ],
  "diavola-pizza": [
    { nameEn: "Regular", price: 19500, isDefault: true },
    { nameEn: "Large", price: 25500 },
  ],
  "marinara-pizza": [
    { nameEn: "Regular", price: 14000, isDefault: true },
    { nameEn: "Large", price: 18500 },
  ],
  "calzone-classico": [
    { nameEn: "Regular", price: 18500, isDefault: true },
    { nameEn: "Large", price: 23500 },
  ],
  "calzone-piccante": [
    { nameEn: "Regular", price: 20000, isDefault: true },
    { nameEn: "Large", price: 25000 },
  ],
};

// Real per-branch divergence only (contracts/seed-dataset.md — not one row per item × branch).
interface BranchOverride {
  slug: string;
  branch: "shobra" | "heliopolis";
  price?: number;
  isAvailable?: boolean;
}
const BRANCH_OVERRIDES: BranchOverride[] = [
  { slug: "tagliata-manzo", branch: "heliopolis", price: 30500 },
  { slug: "grigliata-mista", branch: "heliopolis", price: 33500 },
  { slug: "calamari-fritti", branch: "heliopolis", price: 11500 },
  { slug: "salmone-griglia", branch: "shobra", isAvailable: false },
  { slug: "pasta-frutti-di-mare", branch: "shobra", isAvailable: false },
  { slug: "gelato-trio", branch: "shobra", isAvailable: false },
];

export async function seedMenu(prisma: PrismaClient, branches: SeededBranches): Promise<void> {
  const menuItemIdBySlug = new Map<string, string>();

  for (const [categoryIndex, category] of CATEGORIES.entries()) {
    const categoryRow = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        nameEn: category.nameEn,
        descriptionEn: category.descriptionEn,
        sortOrder: categoryIndex,
      },
    });

    for (const [itemIndex, item] of category.items.entries()) {
      const featuredRank = FEATURED_RANKS[item.slug];
      const row = await prisma.menuItem.upsert({
        where: { slug: item.slug },
        update: {},
        create: {
          categoryId: categoryRow.id,
          slug: item.slug,
          nameEn: item.nameEn,
          descriptionEn: item.descriptionEn ?? null,
          price: item.price,
          isFasting: item.isFasting ?? false,
          isVegetarian: item.isVegetarian ?? false,
          isSpicy: item.isSpicy ?? false,
          isFeatured: featuredRank !== undefined,
          featuredRank: featuredRank ?? null,
          allergens: item.allergens ?? [],
          prepMinutes: item.prepMinutes ?? null,
          sortOrder: itemIndex,
        },
      });
      menuItemIdBySlug.set(item.slug, row.id);

      const variants = VARIANTS[item.slug];
      if (variants) {
        for (const [variantIndex, variant] of variants.entries()) {
          await prisma.menuItemVariant.upsert({
            where: { menuItemId_nameEn: { menuItemId: row.id, nameEn: variant.nameEn } },
            update: {},
            create: {
              menuItemId: row.id,
              nameEn: variant.nameEn,
              price: variant.price,
              isDefault: variant.isDefault ?? false,
              sortOrder: variantIndex,
            },
          });
        }
      }
    }
  }

  for (const override of BRANCH_OVERRIDES) {
    const menuItemId = menuItemIdBySlug.get(override.slug);
    if (!menuItemId) throw new Error(`seedMenu: unknown item slug "${override.slug}"`);
    const branchId = override.branch === "shobra" ? branches.shobraId : branches.heliopolisId;

    await prisma.menuItemBranch.upsert({
      where: { menuItemId_branchId: { menuItemId, branchId } },
      update: {},
      create: {
        menuItemId,
        branchId,
        price: override.price ?? null,
        isAvailable: override.isAvailable ?? null,
      },
    });
  }
}
