// Content fixture — real copy transcribed from files/site/about.html.
import type { Milestone, TeamMember } from "@pascca/types/content";

export const milestones: Milestone[] = [
  {
    year: 2018,
    titleEn: "Shobra opens on Shobra Street",
    titleAr: null,
    descriptionEn: null,
    descriptionAr: null,
    badge: "01",
  },
  {
    year: 2021,
    titleEn: "Heliopolis opens on Abd El-Aziz Fahmy",
    titleAr: null,
    descriptionEn: null,
    descriptionAr: null,
    badge: "02",
  },
  {
    year: 2023,
    titleEn: "Featured on the Bellies En Route food tour",
    titleAr: null,
    descriptionEn: null,
    descriptionAr: null,
    badge: "★",
  },
  {
    year: 2024,
    titleEn: "Heliopolis goes twenty-four hours",
    titleAr: null,
    descriptionEn: null,
    descriptionAr: null,
    badge: "24h",
  },
  {
    year: 2026,
    titleEn: "59K on Facebook, 19K on Instagram",
    titleAr: null,
    descriptionEn: null,
    descriptionAr: null,
    badge: "78K",
  },
];

export const teamMembers: TeamMember[] = [
  {
    slug: "head-of-kitchen",
    roleEn: "Head of Kitchen",
    roleAr: null,
    bioEn: "Runs both passes and signs off every new dish before it reaches the menu.",
    bioAr: null,
    imageSlot: { ratio: "1", tone: "stone", label: "Head of Kitchen photo" },
  },
  {
    slug: "pizzaiolo",
    roleEn: "Pizzaiolo",
    roleAr: null,
    bioEn: "Owns the dough. Decides when it's ready, and it is never before he says so.",
    bioAr: null,
    imageSlot: { ratio: "1", tone: "warm", label: "Pizzaiolo photo" },
  },
  {
    slug: "floor-manager",
    roleEn: "Floor Manager",
    roleAr: null,
    bioEn: "The reason your birthday table is set up before you walk in.",
    bioAr: null,
    imageSlot: { ratio: "1", tone: "cream", label: "Floor Manager photo" },
  },
];
