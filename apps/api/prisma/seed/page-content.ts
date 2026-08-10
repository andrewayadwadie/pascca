// Seed module: PageSeo, PageBlock (T034). PageSeo upserted on `page`; PageBlock on `[page,
// block]` (research R6). This is what makes the site render before anyone opens the dashboard
// (FR-010, Article 12 [NN]) — every named section of all eight Article 18 pages gets a seeded
// default. Every `value` carries a non-empty `headlineEn`; every `*Ar` key stays `null` (Article
// 21 [NN] — Arabic is a content-entry task, not something this seed fabricates). No Tier 3 string
// (nav labels, button micro-copy) is seeded here — those live in messages/{en,ar}.json.
//
// Copy is written in Article 2 [NN]'s voice: warm, plain, a little funny, never implying
// expensive. Every dish mention elsewhere already carries a price — nothing here needs to.
import type { PrismaClient } from "@prisma/client";

interface BlockSeed {
  block: string;
  headlineEn: string;
  eyebrowEn?: string;
  subEn?: string;
  ctaLabelEn?: string;
  ctaHref?: string;
}

interface PageSeed {
  page: string;
  titleEn: string;
  descriptionEn: string;
  blocks: BlockSeed[];
}

const PAGES: PageSeed[] = [
  {
    page: "home",
    titleEn: "Pascca — Freshly Baked With Love",
    descriptionEn: "A cosy neighbourhood Italian restaurant with two Cairo branches. Stone-oven pizza, calzone, truffle pasta, and breakfast worth waking up for.",
    blocks: [
      { block: "hero", headlineEn: "Freshly Baked With Love", subEn: "Two Cairo branches. One stone oven that never really cools down.", ctaLabelEn: "Book a table", ctaHref: "/reservations" },
      { block: "press-strip", headlineEn: "As seen around Cairo" },
      { block: "signature-dishes", headlineEn: "The dishes people ask for by name", eyebrowEn: "Signature", subEn: "Chosen by us, not an algorithm." },
      { block: "story", headlineEn: "Started in Shobra, 2018", subEn: "A stone oven, a small room, and a lot of stubbornness about doing it properly." },
      { block: "breakfast", headlineEn: "Mornings, done properly", ctaLabelEn: "See the breakfast menu", ctaHref: "/menu" },
      { block: "occasions", headlineEn: "Birthdays, engagements, family tables", subEn: "We've hosted them all — and we'd like to host yours." },
      { block: "testimonials", headlineEn: "What people are saying", eyebrowEn: "Reviews" },
      { block: "delivery", headlineEn: "Can't make it in? We'll come to you", ctaLabelEn: "Order delivery" },
      { block: "faq", headlineEn: "Questions people actually ask" },
      { block: "reservation-cta", headlineEn: "Table for two? Twelve? We've got you", ctaLabelEn: "Book now", ctaHref: "/reservations" },
    ],
  },
  {
    page: "menu",
    titleEn: "Menu — Pascca",
    descriptionEn: "Pizza, calzone, pasta, mains, starters, breakfast, desserts, and drinks. Every price shown, every time.",
    blocks: [
      { block: "hero", headlineEn: "The Menu", subEn: "Prices shown right here — no surprises at the table." },
      { block: "filter-bar", headlineEn: "Find what you're craving", subEn: "Filter by صيامي, vegetarian, or category." },
      { block: "category-groups", headlineEn: "Pizza to drinks, in order" },
      { block: "cta", headlineEn: "Ready to book a table?", ctaLabelEn: "Reserve now", ctaHref: "/reservations" },
    ],
  },
  {
    page: "about",
    titleEn: "About — Pascca",
    descriptionEn: "The story of Pascca, from a single stone oven in Shobra in 2018 to two branches and a menu people drive across the city for.",
    blocks: [
      { block: "hero", headlineEn: "About Pascca", subEn: "A neighbourhood restaurant that happens to make very good pizza." },
      { block: "story", headlineEn: "How it started", subEn: "One oven, one room, 2018." },
      { block: "values", headlineEn: "What we actually care about", eyebrowEn: "Values" },
      { block: "milestones", headlineEn: "The story so far" },
      { block: "team", headlineEn: "The people behind the ovens" },
      { block: "cta", headlineEn: "Come see for yourself", ctaLabelEn: "Find a branch", ctaHref: "/branches" },
    ],
  },
  {
    page: "gallery",
    titleEn: "Gallery — Pascca",
    descriptionEn: "The food, the rooms, breakfast, and the occasions we've hosted — a look inside both branches.",
    blocks: [
      { block: "hero", headlineEn: "A Look Inside", subEn: "The food, the rooms, and the people who show up for both." },
      { block: "album-filters", headlineEn: "Browse by album" },
      { block: "masonry-grid", headlineEn: "Straight from the kitchen and the dining room" },
      { block: "instagram-cta", headlineEn: "See more on Instagram", ctaLabelEn: "Follow along" },
    ],
  },
  {
    page: "branches",
    titleEn: "Branches — Pascca",
    descriptionEn: "Shobra, open noon to 2am. Heliopolis, open around the clock. Find directions, hours, and phone numbers for both.",
    blocks: [
      { block: "hero", headlineEn: "Two Branches, One Kitchen Philosophy", subEn: "Shobra since 2018. Heliopolis, open around the clock." },
      { block: "branch-cards", headlineEn: "Find your nearest Pascca" },
      { block: "map", headlineEn: "Get directions" },
      { block: "large-groups", headlineEn: "Bringing more than six?", subEn: "Give us a call — we'll sort out the details personally." },
    ],
  },
  {
    page: "reservations",
    titleEn: "Reservations — Pascca",
    descriptionEn: "Book a table at either branch in under a minute. Parties of six or fewer are confirmed instantly.",
    blocks: [
      { block: "hero", headlineEn: "Book a Table", subEn: "Takes about a minute. Parties of six or fewer are confirmed right away." },
      { block: "how-it-works", headlineEn: "How it works", subEn: "Pick a branch, pick a time, tell us how many. Done." },
      { block: "booking-faq", headlineEn: "Booking questions" },
    ],
  },
  {
    page: "contact",
    titleEn: "Contact — Pascca",
    descriptionEn: "Reach either Pascca branch by phone, email, or a message form — we read every one.",
    blocks: [
      { block: "hero", headlineEn: "Get In Touch", subEn: "Phone, email, or the form below — we read all of it." },
      { block: "contact-rail", headlineEn: "Reach us directly" },
      { block: "branch-cards", headlineEn: "Or find us in person" },
    ],
  },
  {
    page: "legal",
    titleEn: "Legal — Pascca",
    descriptionEn: "Pascca's privacy notice and terms — what we collect, why, and for how long.",
    blocks: [
      { block: "hero", headlineEn: "Legal", subEn: "The not-very-exciting but important part." },
      { block: "privacy", headlineEn: "Privacy notice", subEn: "What we collect when you book a table or send a message, and how long we keep it." },
      { block: "terms", headlineEn: "Terms" },
    ],
  },
];

export async function seedPageContent(prisma: PrismaClient): Promise<void> {
  for (const page of PAGES) {
    await prisma.pageSeo.upsert({
      where: { page: page.page },
      update: {},
      create: {
        page: page.page,
        titleEn: page.titleEn,
        descriptionEn: page.descriptionEn,
      },
    });

    for (const [i, block] of page.blocks.entries()) {
      const value = {
        headlineEn: block.headlineEn,
        headlineAr: null,
        eyebrowEn: block.eyebrowEn ?? null,
        eyebrowAr: null,
        subEn: block.subEn ?? null,
        subAr: null,
        ctaLabelEn: block.ctaLabelEn ?? null,
        ctaLabelAr: null,
      };

      await prisma.pageBlock.upsert({
        where: { page_block: { page: page.page, block: block.block } },
        update: { value, ctaHref: block.ctaHref ?? null, sortOrder: i },
        create: {
          page: page.page,
          block: block.block,
          value,
          ctaHref: block.ctaHref ?? null,
          sortOrder: i,
        },
      });
    }
  }
}
