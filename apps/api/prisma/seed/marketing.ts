// Seed module: Testimonial, FaqItem, TeamMember, Milestone, Post (T033).
//
// Testimonials are manual entry only — never scraped, never pulled live (Article 13 [NN]). All
// five rows here carry `consentGiven: true` (FR-010) because that is the only publishable state;
// a fixture with consent withheld would be modelling data the seed itself couldn't legally show.
// Posts stay `DRAFT` and nothing in this feature reads them publicly (Article 24, FR-007).
import type { PrismaClient } from "@prisma/client";
import type { SeededBranches } from "./branches";
import type { SeededUsers } from "./users";

export async function seedMarketing(
  prisma: PrismaClient,
  branches: SeededBranches,
  users: SeededUsers,
): Promise<void> {
  const testimonials: Array<{
    author: string;
    source: "GOOGLE" | "TRIPADVISOR" | "INSTAGRAM" | "RESTAURANT_GURU" | "DIRECT";
    rating: number;
    quoteEn: string;
    branchId: string;
    publishedAt: Date;
  }> = [
    {
      author: "Nourhan S.",
      source: "GOOGLE",
      rating: 5,
      quoteEn: "The truffle pasta alone is worth the drive. Warm staff, honest prices.",
      branchId: branches.shobraId,
      publishedAt: new Date("2025-03-14"),
    },
    {
      author: "Karim A.",
      source: "TRIPADVISOR",
      rating: 5,
      quoteEn: "Best calzone in Cairo, and I don't say that lightly.",
      branchId: branches.heliopolisId,
      publishedAt: new Date("2025-05-02"),
    },
    {
      author: "Mariam H.",
      source: "INSTAGRAM",
      rating: 4,
      quoteEn: "Went for breakfast on a whim, stayed for two hours. No regrets.",
      branchId: branches.heliopolisId,
      publishedAt: new Date("2025-06-19"),
    },
    {
      author: "Omar Y.",
      source: "RESTAURANT_GURU",
      rating: 5,
      quoteEn: "Booked for my sister's engagement — they made the table feel special without the fuss.",
      branchId: branches.shobraId,
      publishedAt: new Date("2025-08-30"),
    },
    {
      author: "Dina F.",
      source: "DIRECT",
      rating: 5,
      quoteEn: "Been coming to Shobra since 2019. Still my favourite pizza in the city.",
      branchId: branches.shobraId,
      publishedAt: new Date("2025-11-11"),
    },
  ];

  for (const [i, t] of testimonials.entries()) {
    const existing = await prisma.testimonial.findFirst({
      where: { author: t.author, quoteEn: t.quoteEn },
    });
    if (existing) {
      await prisma.testimonial.update({
        where: { id: existing.id },
        data: { ...t, consentGiven: true, sortOrder: i },
      });
    } else {
      await prisma.testimonial.create({
        data: { ...t, consentGiven: true, sortOrder: i },
      });
    }
  }

  const faqs: Array<{ questionEn: string; answerEn: string; category: string }> = [
    {
      questionEn: "Do I need a reservation?",
      answerEn: "Walk-ins are always welcome, but booking ahead — especially for parties over six — means we can actually promise you a table.",
      category: "booking",
    },
    {
      questionEn: "Can I change or cancel my reservation?",
      answerEn: "Yes — call the branch directly and we'll sort it out. No fees, no forms.",
      category: "booking",
    },
    {
      questionEn: "How far ahead can I book?",
      answerEn: "As far as you like. Same-day bookings need a little lead time so the kitchen can prep.",
      category: "booking",
    },
    {
      questionEn: "Do you take large groups?",
      answerEn: "Absolutely — parties over six get a personal call from us to nail down the details.",
      category: "booking",
    },
    {
      questionEn: "Is the menu marked for fasting and vegetarian dishes?",
      answerEn: "Every dish is tagged صيامي or vegetarian right on the menu — filter by whichever you need.",
      category: "general",
    },
    {
      questionEn: "Do you deliver?",
      answerEn: "Yes, through Talabat and elmenus — links are on our delivery page.",
      category: "general",
    },
    {
      questionEn: "Are prices the same at both branches?",
      answerEn: "Almost always. A few dishes vary slightly by branch, and the menu always shows the price you'll actually pay.",
      category: "general",
    },
    {
      questionEn: "What are your hours?",
      answerEn: "Shobra is open noon to 2am. Heliopolis never closes.",
      category: "general",
    },
    {
      questionEn: "Do you have parking?",
      answerEn: "Street parking at both branches — ask a member of staff if you need a hand finding a spot.",
      category: "general",
    },
    {
      questionEn: "Can I bring a cake for a birthday?",
      answerEn: "Of course — just let us know when you book and we'll have candles ready.",
      category: "booking",
    },
  ];

  for (const [i, f] of faqs.entries()) {
    const existing = await prisma.faqItem.findFirst({ where: { questionEn: f.questionEn } });
    if (existing) {
      await prisma.faqItem.update({ where: { id: existing.id }, data: { ...f, sortOrder: i } });
    } else {
      await prisma.faqItem.create({ data: { ...f, sortOrder: i } });
    }
  }

  const team: Array<{ slug: string; nameEn: string; roleEn: string; branchId?: string }> = [
    { slug: "founder", nameEn: "Youssef Pascca", roleEn: "Founder" },
    { slug: "head-chef", nameEn: "Amir Naguib", roleEn: "Head Chef" },
    { slug: "shobra-manager", nameEn: "Sara Kamel", roleEn: "Branch Manager", branchId: branches.shobraId },
    {
      slug: "heliopolis-manager",
      nameEn: "Hana Rizk",
      roleEn: "Branch Manager",
      branchId: branches.heliopolisId,
    },
    { slug: "pastry-chef", nameEn: "Laila Fouad", roleEn: "Pastry Chef" },
  ];

  for (const [i, member] of team.entries()) {
    await prisma.teamMember.upsert({
      where: { slug: member.slug },
      update: {},
      create: {
        slug: member.slug,
        nameEn: member.nameEn,
        roleEn: member.roleEn,
        branchId: member.branchId ?? null,
        sortOrder: i,
      },
    });
  }

  const milestones: Array<{ year: number; titleEn: string; descriptionEn: string }> = [
    { year: 2018, titleEn: "Shobra opens", descriptionEn: "The first stone oven, lit for the first time." },
    { year: 2020, titleEn: "The menu grows", descriptionEn: "Pasta and breakfast join the pizza and calzone." },
    { year: 2022, titleEn: "Delivery begins", descriptionEn: "Pascca goes live on Talabat and elmenus." },
    { year: 2023, titleEn: "Heliopolis opens", descriptionEn: "A second home, open around the clock." },
    { year: 2025, titleEn: "A place for occasions", descriptionEn: "Birthdays, engagements, family tables — we started hosting them properly." },
  ];

  for (const [i, m] of milestones.entries()) {
    const existing = await prisma.milestone.findFirst({ where: { year: m.year, titleEn: m.titleEn } });
    if (existing) {
      await prisma.milestone.update({ where: { id: existing.id }, data: { ...m, sortOrder: i } });
    } else {
      await prisma.milestone.create({ data: { ...m, sortOrder: i } });
    }
  }

  const posts: Array<{ slugEn: string; titleEn: string; bodyEn: string }> = [
    {
      slugEn: "how-we-fire-the-stone-oven",
      titleEn: "How We Fire the Stone Oven",
      bodyEn: "A short walk-through of the oven that's been running since 2018 — draft only, not published.",
    },
    {
      slugEn: "a-guide-to-fasting-friendly-dishes",
      titleEn: "A Guide to Our Fasting-Friendly Dishes",
      bodyEn: "Which dishes are صيامي and why — draft only, not published.",
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slugEn: post.slugEn },
      update: {},
      create: {
        slugEn: post.slugEn,
        titleEn: post.titleEn,
        bodyEn: post.bodyEn,
        status: "DRAFT",
        authorId: users.adminId,
      },
    });
  }
}
