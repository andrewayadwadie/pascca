// Content fixture — every Article-18 section for all eight pages, transcribed verbatim from
// files/site/*.html (Governing Rule). Block keys reuse apps/api/prisma/seed/page-content.ts's
// existing naming (data-model.md). Only what a dashboard would plausibly edit per-section lives
// here — headline/emphasis/eyebrow/sub/primary-cta (Article 12 Tier 2). Repeated button
// micro-copy (secondary CTAs like "See the menu") is Tier 3, in messages/en.json. Small fixed
// presentational structure a single page assembles around its blocks (hero stat numbers,
// floating badges, value-card triples, stats-list rows, press-strip names, legal body
// sections) is not modelled by any entity this feature's frozen contracts define — it stays a
// typed local constant in that page's own page.tsx, documented there, not invented content.
import type { PageBlock, PageSeo } from "@pascca/types/content";

function block(partial: {
  page: PageBlock["page"];
  block: string;
  headlineEn: string;
  emphasisEn?: string;
  eyebrowEn?: string;
  subEn?: string;
  ctaLabelEn?: string;
  ctaHref?: string;
  sortOrder: number;
}): PageBlock {
  return {
    page: partial.page,
    block: partial.block,
    headlineEn: partial.headlineEn,
    headlineAr: null,
    emphasisEn: partial.emphasisEn ?? null,
    eyebrowEn: partial.eyebrowEn ?? null,
    eyebrowAr: null,
    subEn: partial.subEn ?? null,
    subAr: null,
    ctaLabelEn: partial.ctaLabelEn ?? null,
    ctaLabelAr: null,
    ctaHref: partial.ctaHref ?? null,
    sortOrder: partial.sortOrder,
  };
}

export const pageBlocks: PageBlock[] = [
  // ==================== HOME (index.html) ====================
  block({
    page: "home",
    block: "hero",
    headlineEn: "Freshly baked with love",
    emphasisEn: "with love",
    eyebrowEn: "Heliopolis & Shobra · Cairo",
    subEn:
      "A neighbourhood Italian kitchen since 2018. Pizza from the stone oven, pasta made to order, and a breakfast worth setting the alarm for — in two rooms across Cairo.",
    ctaLabelEn: "Book a table",
    ctaHref: "/reservations",
    sortOrder: 0,
  }),
  block({
    page: "home",
    block: "press-strip",
    headlineEn: "As seen around Cairo",
    sortOrder: 1,
  }),
  block({
    page: "home",
    block: "signature-dishes",
    headlineEn: "Dishes people come back for",
    emphasisEn: "come back for",
    eyebrowEn: "Most loved",
    subEn: "Chosen by our kitchen, not by an algorithm. The full list — with prices — lives on the menu page.",
    sortOrder: 2,
  }),
  block({
    page: "home",
    block: "story",
    headlineEn: "A pizzeria that grew into a room",
    emphasisEn: "into a room",
    eyebrowEn: "Our story",
    subEn:
      "We opened in Shobra in 2018 as a pizzeria and very little has changed about how we work: dough proved properly, sauce made in-house, and produce that arrives daily rather than weekly. What did change is the room — Heliopolis gave us space for long breakfasts, birthdays and first dates, and it never closes.",
    ctaLabelEn: "Read our story",
    ctaHref: "/about",
    sortOrder: 3,
  }),
  block({
    page: "home",
    block: "breakfast",
    headlineEn: "Breakfast, unhurried",
    emphasisEn: "unhurried",
    eyebrowEn: "Mornings",
    subEn:
      "Served from 8am at both branches. Platters built to share, eggs cooked how you ask, fresh juice, and coffee that keeps coming. Friday mornings fill up early — that's not a warning, it's an invitation.",
    ctaLabelEn: "Breakfast menu",
    ctaHref: "/menu#breakfast",
    sortOrder: 4,
  }),
  block({
    page: "home",
    block: "occasions",
    headlineEn: "Rooms for the big ones",
    emphasisEn: "the big ones",
    eyebrowEn: "Occasions",
    subEn: "Birthdays, engagements and long family tables. Tell us in the booking notes and we'll set the room up before you arrive.",
    sortOrder: 5,
  }),
  block({
    page: "home",
    block: "testimonials",
    headlineEn: "What people say",
    emphasisEn: "say",
    eyebrowEn: "Guests",
    subEn: "Collected from Google, Tripadvisor and Restaurant Guru. Curated by us, published with permission.",
    sortOrder: 6,
  }),
  block({
    page: "home",
    block: "delivery",
    headlineEn: "We deliver across Cairo",
    emphasisEn: "across Cairo",
    eyebrowEn: "Can't make it in?",
    subEn:
      "Both kitchens deliver through talabat and elmenus — Heliopolis Square and Al Khalafawy and everything around them. Ordering directly from this site is coming soon.",
    ctaLabelEn: "Order on talabat",
    ctaHref: "https://www.talabat.com/egypt/pascca",
    sortOrder: 7,
  }),
  block({
    page: "home",
    block: "faq",
    headlineEn: "Before you come",
    emphasisEn: "you come",
    eyebrowEn: "Good to know",
    subEn: "Anything else, message us on WhatsApp — we answer faster there than anywhere else.",
    ctaLabelEn: "Contact us",
    ctaHref: "/contact",
    sortOrder: 8,
  }),
  block({
    page: "home",
    block: "reservation-cta",
    headlineEn: "Your table is waiting",
    emphasisEn: "waiting",
    eyebrowEn: "Reservations",
    subEn: "Pick a branch, a date and a time. Parties of six or fewer are confirmed instantly.",
    ctaLabelEn: "Book a table",
    ctaHref: "/reservations",
    sortOrder: 9,
  }),

  // ==================== MENU (menu.html) ====================
  block({
    page: "menu",
    block: "hero",
    headlineEn: "Everything we bake and plate",
    emphasisEn: "bake and plate",
    subEn: "Prices in Egyptian pounds, the same at both branches. Fasting and vegetarian dishes are marked — use the filters to see only those.",
    sortOrder: 0,
  }),
  block({
    page: "menu",
    block: "filter-bar",
    headlineEn: "Find what you're craving",
    subEn: "Filter by صيامي, vegetarian, or category.",
    sortOrder: 1,
  }),
  block({
    page: "menu",
    block: "category-groups",
    headlineEn: "Pizza to drinks, in order",
    sortOrder: 2,
  }),
  block({
    page: "menu",
    block: "cta",
    headlineEn: "Seen something you want?",
    emphasisEn: "you want",
    ctaLabelEn: "Book a table",
    ctaHref: "/reservations",
    sortOrder: 3,
  }),

  // ==================== ABOUT (about.html) ====================
  block({
    page: "about",
    block: "hero",
    headlineEn: "A pizzeria that grew into a room",
    emphasisEn: "into a room",
    subEn: "We opened on Shobra Street in 2018 with one oven and a short menu. Eight years later there are two kitchens, one of which never closes.",
    sortOrder: 0,
  }),
  block({
    page: "about",
    block: "story",
    headlineEn: "Freshly baked, every day",
    emphasisEn: "every day",
    eyebrowEn: "Our story",
    subEn: '"Some come to Pascca for the food, others come for emotional support. We serve both."',
    sortOrder: 1,
  }),
  block({
    page: "about",
    block: "values",
    headlineEn: "Four things we don't rush",
    emphasisEn: "don't rush",
    eyebrowEn: "How we work",
    sortOrder: 2,
  }),
  block({
    page: "about",
    block: "milestones",
    headlineEn: "How we got here",
    emphasisEn: "got here",
    eyebrowEn: "Milestones",
    sortOrder: 3,
  }),
  block({
    page: "about",
    block: "team",
    headlineEn: "Behind the pass",
    emphasisEn: "the pass",
    eyebrowEn: "The people",
    subEn: "Profiles, photos and titles are all managed from the dashboard — add or remove a team member without touching the site.",
    sortOrder: 4,
  }),
  block({
    page: "about",
    block: "cta",
    headlineEn: "Come and see the room",
    emphasisEn: "see the room",
    ctaLabelEn: "Book a table",
    ctaHref: "/reservations",
    sortOrder: 5,
  }),

  // ==================== GALLERY (gallery.html) ====================
  block({
    page: "gallery",
    block: "hero",
    headlineEn: "The food and the room",
    emphasisEn: "the room",
    subEn: "Albums are managed from the dashboard — upload, reorder, caption and publish without a developer.",
    sortOrder: 0,
  }),
  block({
    page: "gallery",
    block: "album-filters",
    headlineEn: "Browse by album",
    sortOrder: 1,
  }),
  block({
    page: "gallery",
    block: "masonry-grid",
    headlineEn: "Straight from the kitchen and the dining room",
    subEn: "Every slot is sized and ready — the client's Instagram archive drops straight in.",
    sortOrder: 2,
  }),
  block({
    page: "gallery",
    block: "instagram-cta",
    headlineEn: "Post it @pasccarestaurant",
    emphasisEn: "@pasccarestaurant",
    eyebrowEn: "Tag us",
    subEn: "Nineteen thousand people already do. The best ones end up on this page.",
    ctaLabelEn: "Follow on Instagram",
    ctaHref: "https://www.instagram.com/pasccarestaurant/",
    sortOrder: 3,
  }),

  // ==================== BRANCHES (branches.html) ====================
  block({
    page: "branches",
    block: "hero",
    headlineEn: "Two rooms, one kitchen",
    emphasisEn: "one kitchen",
    subEn: "Same menu, same prices, same standard. One of them never closes.",
    sortOrder: 0,
  }),
  block({
    page: "branches",
    block: "branch-cards",
    headlineEn: "Find your nearest Pascca",
    sortOrder: 1,
  }),
  block({
    page: "branches",
    block: "map",
    headlineEn: "Get directions",
    sortOrder: 2,
  }),
  block({
    page: "branches",
    block: "large-groups",
    headlineEn: "More than eight of you?",
    emphasisEn: "eight of you",
    eyebrowEn: "Large groups",
    subEn: "Call the group line and we'll agree a table plan and a set menu before you arrive. Birthdays, engagements and family tables are most of our weekend.",
    ctaLabelEn: "Call 0102 507 0801",
    ctaHref: "tel:01025070801",
    sortOrder: 3,
  }),

  // ==================== RESERVATIONS (reservations.html) ====================
  block({
    page: "reservations",
    block: "hero",
    headlineEn: "Book your table in a minute",
    emphasisEn: "in a minute",
    subEn: "Six guests or fewer are confirmed instantly. Above that, a member of staff calls you to plan the table.",
    sortOrder: 0,
  }),
  block({
    page: "reservations",
    block: "how-it-works",
    headlineEn: "Three steps, no phone call",
    emphasisEn: "no phone call",
    eyebrowEn: "How it works",
    subEn: "Your table is held for fifteen minutes past the time you choose. If you are running late, call the branch and we will hold it longer.",
    sortOrder: 1,
  }),
  block({
    page: "reservations",
    block: "booking-faq",
    headlineEn: "About booking",
    emphasisEn: "booking",
    eyebrowEn: "Questions",
    sortOrder: 2,
  }),

  // ==================== CONTACT (contact.html) ====================
  block({
    page: "contact",
    block: "hero",
    headlineEn: "Talk to us",
    emphasisEn: "to us",
    subEn: "WhatsApp is the fastest way to reach us. Everything sent here lands in the same inbox our managers watch.",
    sortOrder: 0,
  }),
  block({
    page: "contact",
    block: "contact-rail",
    headlineEn: "Reach us directly",
    sortOrder: 1,
  }),
  block({
    page: "contact",
    block: "branch-cards",
    headlineEn: "Or find us in person",
    sortOrder: 2,
  }),

  // ==================== LEGAL (legal.html) ====================
  block({
    page: "legal",
    block: "hero",
    headlineEn: "Privacy & terms",
    emphasisEn: "& terms",
    subEn: "Plain language. If anything here is unclear, email Pasccapizzeria@gmail.com and we will explain it.",
    sortOrder: 0,
  }),
  block({
    page: "legal",
    block: "privacy",
    headlineEn: "What we collect",
    emphasisEn: "collect",
    eyebrowEn: "Privacy notice",
    sortOrder: 1,
  }),
  block({
    page: "legal",
    block: "terms",
    headlineEn: "Using this site",
    emphasisEn: "this site",
    eyebrowEn: "Terms of use",
    sortOrder: 2,
  }),
];

export const pageSeo: PageSeo[] = [
  {
    page: "home",
    titleEn: "Pascca — Italian Restaurant in Heliopolis & Shobra, Cairo",
    descriptionEn:
      "Pascca serves pizza, pasta, calzone and breakfast, freshly baked with love. Two branches in Heliopolis and Shobra, Cairo. Book a table online.",
  },
  {
    page: "menu",
    titleEn: "Menu — Pascca | Pizza, Pasta, Calzone & Breakfast in Cairo",
    descriptionEn:
      "The full Pascca menu with prices: stone-oven pizza, calzone, Italian pasta, steaks, breakfast platters and desserts. Fasting and vegetarian dishes marked.",
  },
  {
    page: "about",
    titleEn: "About — Pascca | An Italian kitchen in Heliopolis & Shobra",
    descriptionEn:
      "Pascca opened in Shobra in 2018 as a pizzeria and grew into two Cairo rooms. Our story, how we work, and the people behind the pass.",
  },
  {
    page: "gallery",
    titleEn: "Gallery — Pascca | The food and the room",
    descriptionEn:
      "Photographs of Pascca: the stone oven, the dining rooms in Heliopolis and Shobra, breakfast, and the dishes people keep coming back for.",
  },
  {
    page: "branches",
    titleEn: "Branches — Pascca | Heliopolis & Shobra, Cairo",
    descriptionEn:
      "Pascca has two branches in Cairo: 273 Shobra Street and 40 Abd El-Aziz Fahmy Street in El-Nozha, Heliopolis. Addresses, hours, phone numbers and directions.",
  },
  {
    page: "reservations",
    titleEn: "Reservations — Pascca | Book a table in Heliopolis or Shobra",
    descriptionEn:
      "Book a table at Pascca in Heliopolis or Shobra. Parties of six or fewer are confirmed instantly. For larger groups call 0102 507 0801.",
  },
  {
    page: "contact",
    titleEn: "Contact — Pascca | Get in touch",
    descriptionEn: "Contact Pascca Restaurant: phone, WhatsApp, email and a message form. Two branches in Heliopolis and Shobra, Cairo.",
  },
  {
    page: "legal",
    titleEn: "Privacy & Terms — Pascca",
    descriptionEn:
      "How Pascca Restaurant handles the personal information you give us when booking a table or sending a message, and the terms of using this site.",
  },
];
