// Seed orchestrator (T036). Runs every module in research R7's dependency order, passing
// captured IDs forward so nothing looks up a foreign key by guessing — the structural guarantee
// behind SC-006 (zero orphaned references).
//
// Deliberately NOT one top-level transaction: a full-seed transaction is a single very long
// write, and if it fails you learn nothing about *where*. Each module is independently
// idempotent (research R6), so a failed run is fixed by correcting the data and re-running — the
// completed modules no-op on the retry.
import type { PrismaClient } from "@prisma/client";
import { seedSiteSettings } from "./site-settings";
import { seedUsers } from "./users";
import { seedBranches } from "./branches";
import { seedMenu } from "./menu";
import { seedGallery } from "./gallery";
import { seedMarketing } from "./marketing";
import { seedPageContent } from "./page-content";
import { seedReservations } from "./reservations";

export interface SeedCounts {
  siteSettings: number;
  users: number;
  branches: number;
  branchHours: number;
  diningTables: number;
  categories: number;
  menuItems: number;
  menuItemVariants: number;
  menuItemBranches: number;
  galleryAlbums: number;
  galleryImages: number;
  testimonials: number;
  faqItems: number;
  teamMembers: number;
  milestones: number;
  posts: number;
  pageSeo: number;
  pageBlocks: number;
  contactMessages: number;
  reservations: number;
  reservationEvents: number;
}

export async function runSeed(prisma: PrismaClient): Promise<SeedCounts> {
  await seedSiteSettings(prisma);
  const users = await seedUsers(prisma);
  const branches = await seedBranches(prisma);
  await seedMenu(prisma, branches);
  await seedGallery(prisma, branches);
  await seedMarketing(prisma, branches, users);
  await seedPageContent(prisma);
  await seedReservations(prisma, branches, users);

  return {
    siteSettings: await prisma.siteSetting.count(),
    users: await prisma.user.count(),
    branches: await prisma.branch.count(),
    branchHours: await prisma.branchHour.count(),
    diningTables: await prisma.diningTable.count(),
    categories: await prisma.category.count(),
    menuItems: await prisma.menuItem.count(),
    menuItemVariants: await prisma.menuItemVariant.count(),
    menuItemBranches: await prisma.menuItemBranch.count(),
    galleryAlbums: await prisma.galleryAlbum.count(),
    galleryImages: await prisma.galleryImage.count(),
    testimonials: await prisma.testimonial.count(),
    faqItems: await prisma.faqItem.count(),
    teamMembers: await prisma.teamMember.count(),
    milestones: await prisma.milestone.count(),
    posts: await prisma.post.count(),
    pageSeo: await prisma.pageSeo.count(),
    pageBlocks: await prisma.pageBlock.count(),
    contactMessages: await prisma.contactMessage.count(),
    reservations: await prisma.reservation.count(),
    reservationEvents: await prisma.reservationEvent.count(),
  };
}
