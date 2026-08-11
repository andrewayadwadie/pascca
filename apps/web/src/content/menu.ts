// Content fixture — real copy transcribed from files/site/menu.html (Governing Rule: an
// extraction, not a redesign). Read only through apps/web/src/lib/content (FR-020/FR-021);
// never import this file directly from a page or component.
//
// Prices are Int piastres — files/site's literal bare-integer EGP price × 100 (research R9;
// e.g. Margherita "165" → 16500). Four items are `isFeatured` with distinct `featuredRank`
// 1–4, matching index.html's "Most loved" grid order exactly (Calzone, Truffle Pasta, Shrimp
// Alfredo, Dessert Pizza) — for those four, `descriptionEn` uses the punchier marketing copy
// index.html gives them (rather than menu.html's shorter factual line for the same dish;
// price+category confirm it's the same item in both places) since the DTO has one description
// field and both source pages describe the same dish differently. Every other item's
// `descriptionEn` is menu.html's row copy verbatim. `imageSlot.label` is "{name} photo" —
// menu.html's own row markup just says the generic "Photo"; this is the one place this fixture
// is more descriptive than the literal source, purely for the placeholder's own caption text
// (Article 20 — no real photography exists yet either way).
import type { Category, MenuItem } from "@pascca/types/content";

export const categories: Category[] = [
  { slug: "pizza", nameEn: "Pizza", nameAr: null, sortOrder: 0 },
  { slug: "calzone", nameEn: "Calzone", nameAr: null, sortOrder: 1 },
  { slug: "pasta", nameEn: "Pasta", nameAr: null, sortOrder: 2 },
  { slug: "mains", nameEn: "Mains", nameAr: null, sortOrder: 3 },
  { slug: "starters", nameEn: "Starters & Sides", nameAr: null, sortOrder: 4 },
  { slug: "breakfast", nameEn: "Breakfast", nameAr: null, sortOrder: 5 },
  { slug: "desserts", nameEn: "Desserts", nameAr: null, sortOrder: 6 },
  { slug: "drinks", nameEn: "Drinks", nameAr: null, sortOrder: 7 },
];

function item(partial: {
  slug: string;
  categorySlug: string;
  nameEn: string;
  descriptionEn: string;
  price: number;
  isFasting?: boolean;
  isVegetarian?: boolean;
  featuredRank?: number;
  tone: MenuItem["imageSlot"]["tone"];
}): MenuItem {
  return {
    slug: partial.slug,
    categorySlug: partial.categorySlug,
    nameEn: partial.nameEn,
    nameAr: null,
    descriptionEn: partial.descriptionEn,
    descriptionAr: null,
    price: partial.price,
    isFasting: partial.isFasting ?? false,
    isVegetarian: partial.isVegetarian ?? false,
    isFeatured: partial.featuredRank !== undefined,
    featuredRank: partial.featuredRank ?? null,
    imageSlot: { ratio: "1/1", tone: partial.tone, label: `${partial.nameEn} photo` },
  };
}

export const menuItems: MenuItem[] = [
  // ---- Pizza ----
  item({
    slug: "margherita",
    categorySlug: "pizza",
    nameEn: "Margherita",
    descriptionEn: "Mozzarella, house tomato sauce and fresh basil.",
    price: 16500,
    isFasting: true,
    isVegetarian: true,
    tone: "warm",
  }),
  item({
    slug: "quattro-formaggi",
    categorySlug: "pizza",
    nameEn: "Quattro Formaggi",
    descriptionEn: "Four cheeses finished with honey and toasted nuts.",
    price: 23500,
    isVegetarian: true,
    tone: "gold",
  }),
  item({
    slug: "pepperoni",
    categorySlug: "pizza",
    nameEn: "Pepperoni",
    descriptionEn: "Smoked pepperoni, mozzarella and a drizzle of chilli oil.",
    price: 21500,
    tone: "ember",
  }),
  item({
    slug: "chicken-ranch",
    categorySlug: "pizza",
    nameEn: "Chicken Ranch",
    descriptionEn: "Grilled chicken, ranch, sweetcorn and mozzarella.",
    price: 22500,
    tone: "stone",
  }),
  item({
    slug: "vegetable-pizza",
    categorySlug: "pizza",
    nameEn: "Vegetable",
    descriptionEn: "Peppers, mushrooms, olives and red onion. A guest favourite.",
    price: 17500,
    isFasting: true,
    isVegetarian: true,
    tone: "herb",
  }),
  item({
    slug: "frutti-di-mare-pizza",
    categorySlug: "pizza",
    nameEn: "Frutti di Mare",
    descriptionEn: "Prawns and calamari with garlic, parsley and olive oil.",
    price: 28500,
    isFasting: true,
    tone: "cream",
  }),

  // ---- Calzone ----
  item({
    slug: "classic-calzone",
    categorySlug: "calzone",
    nameEn: "Calzone",
    descriptionEn:
      "Folded, sealed and baked in the stone oven. Guests keep calling it the best in Cairo — we're not going to argue.",
    price: 21000,
    featuredRank: 1,
    tone: "warm",
  }),
  item({
    slug: "chicken-calzone",
    categorySlug: "calzone",
    nameEn: "Chicken Calzone",
    descriptionEn: "Grilled chicken, peppers and a three-cheese blend.",
    price: 22500,
    tone: "gold",
  }),
  item({
    slug: "vegetable-calzone",
    categorySlug: "calzone",
    nameEn: "Vegetable Calzone",
    descriptionEn: "Seasonal vegetables, olives and herbs.",
    price: 19500,
    isFasting: true,
    isVegetarian: true,
    tone: "herb",
  }),

  // ---- Pasta ----
  item({
    slug: "truffle-pasta",
    categorySlug: "pasta",
    nameEn: "Truffle Pasta",
    descriptionEn: "Cream, parmesan and truffle. The dish that gets filmed more than anything else we serve.",
    price: 24500,
    isVegetarian: true,
    featuredRank: 2,
    tone: "gold",
  }),
  item({
    slug: "shrimp-alfredo",
    categorySlug: "pasta",
    nameEn: "Shrimp Alfredo",
    descriptionEn: "Fresh prawns, folded through alfredo at the pass so nothing sits and waits.",
    price: 26500,
    featuredRank: 3,
    tone: "stone",
  }),
  item({
    slug: "macarona-bechamel",
    categorySlug: "pasta",
    nameEn: "Macarona Béchamel",
    descriptionEn: "The Egyptian classic, baked golden. Order it and plan a nap.",
    price: 19000,
    tone: "ember",
  }),
  item({
    slug: "penne-arrabbiata",
    categorySlug: "pasta",
    nameEn: "Penne Arrabbiata",
    descriptionEn: "Spicy tomato, garlic and basil.",
    price: 15500,
    isFasting: true,
    isVegetarian: true,
    tone: "herb",
  }),
  item({
    slug: "beef-lasagna",
    categorySlug: "pasta",
    nameEn: "Beef Lasagna",
    descriptionEn: "Layered pasta, slow beef ragù and béchamel.",
    price: 23000,
    tone: "cream",
  }),

  // ---- Mains ----
  item({
    slug: "beef-steak",
    categorySlug: "mains",
    nameEn: "Beef Steak",
    descriptionEn: "Choose mushroom or pepper sauce, with wedges or grilled vegetables.",
    price: 39500,
    tone: "ember",
  }),
  item({
    slug: "grilled-chicken-breast",
    categorySlug: "mains",
    nameEn: "Grilled Chicken Breast",
    descriptionEn: "Marinated overnight, served with lemon butter.",
    price: 25500,
    tone: "warm",
  }),
  item({
    slug: "grilled-prawns",
    categorySlug: "mains",
    nameEn: "Grilled Prawns",
    descriptionEn: "Garlic, chilli and parsley, with rice or salad.",
    price: 34000,
    isFasting: true,
    tone: "stone",
  }),

  // ---- Starters & Sides ----
  item({
    slug: "cheddar-fries",
    categorySlug: "starters",
    nameEn: "Cheddar Fries",
    descriptionEn: "Reviewed as the cheesiest in Cairo. We take that seriously.",
    price: 11000,
    isVegetarian: true,
    tone: "gold",
  }),
  item({
    slug: "bruschetta",
    categorySlug: "starters",
    nameEn: "Bruschetta",
    descriptionEn: "Oven bread, tomato, garlic and basil.",
    price: 8500,
    isFasting: true,
    isVegetarian: true,
    tone: "warm",
  }),
  item({
    slug: "onion-soup",
    categorySlug: "starters",
    nameEn: "Onion Soup",
    descriptionEn: "Caramelised onion and toasted bread.",
    price: 9500,
    isFasting: true,
    isVegetarian: true,
    tone: "herb",
  }),
  item({
    slug: "caesar-salad",
    categorySlug: "starters",
    nameEn: "Caesar Salad",
    descriptionEn: "Romaine, croutons and parmesan. Add chicken for 45.",
    price: 13000,
    isVegetarian: true,
    tone: "cream",
  }),

  // ---- Breakfast ----
  item({
    slug: "pascca-breakfast-platter",
    categorySlug: "breakfast",
    nameEn: "Pascca Breakfast Platter",
    descriptionEn: "Eggs, cheeses, foul, bread and a hot drink. Built for two.",
    price: 26000,
    tone: "warm",
  }),
  item({
    slug: "shakshuka",
    categorySlug: "breakfast",
    nameEn: "Shakshuka",
    descriptionEn: "Eggs, tomato and peppers in a cast-iron pan.",
    price: 11500,
    isVegetarian: true,
    tone: "ember",
  }),
  item({
    slug: "pancakes",
    categorySlug: "breakfast",
    nameEn: "Pancakes",
    descriptionEn: "Four pieces with honey and butter.",
    price: 12000,
    isVegetarian: true,
    tone: "gold",
  }),
  item({
    slug: "foul-and-falafel",
    categorySlug: "breakfast",
    nameEn: "Foul & Falafel",
    descriptionEn: "Olive oil, lemon and cumin, with fresh bread.",
    price: 9000,
    isFasting: true,
    isVegetarian: true,
    tone: "herb",
  }),

  // ---- Desserts ----
  item({
    slug: "dessert-pizza",
    categorySlug: "desserts",
    nameEn: "Dessert Pizza",
    descriptionEn: "The same dough, finished with chocolate and nuts. Order it for the table.",
    price: 16500,
    isVegetarian: true,
    featuredRank: 4,
    tone: "ember",
  }),
  item({
    slug: "tiramisu",
    categorySlug: "desserts",
    nameEn: "Tiramisu",
    descriptionEn: "Mascarpone, espresso and cocoa.",
    price: 13500,
    isVegetarian: true,
    tone: "warm",
  }),
  item({
    slug: "seasonal-fruit",
    categorySlug: "desserts",
    nameEn: "Seasonal Fruit",
    descriptionEn: "Whatever the market had that morning.",
    price: 9500,
    isFasting: true,
    isVegetarian: true,
    tone: "cream",
  }),

  // ---- Drinks ----
  item({
    slug: "espresso-doppio",
    categorySlug: "drinks",
    nameEn: "Espresso Doppio",
    descriptionEn: "Beans roasted for us.",
    price: 5500,
    isFasting: true,
    isVegetarian: true,
    tone: "stone",
  }),
  item({
    slug: "cappuccino",
    categorySlug: "drinks",
    nameEn: "Cappuccino",
    descriptionEn: "Espresso and steamed milk.",
    price: 7500,
    isVegetarian: true,
    tone: "cream",
  }),
  item({
    slug: "fresh-orange",
    categorySlug: "drinks",
    nameEn: "Fresh Orange",
    descriptionEn: "Squeezed to order.",
    price: 7000,
    isFasting: true,
    isVegetarian: true,
    tone: "gold",
  }),
];
