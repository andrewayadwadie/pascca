// Seed module: Reservation, ReservationEvent, ContactMessage (T035).
//
// Reservations have no natural key, so they upsert on deterministic, seed-owned codes
// `SEED01`…`SEED20` (research R6) — the same trick that makes re-seeding idempotent doubles as an
// obvious marker that a row is fixture data. Every invariant in contracts/seed-dataset.md and
// Article 26 [NN]'s confirmation policy is satisfied structurally by the data below, not by
// post-hoc filtering: every partySize > 6 row IS PENDING + requiresCall, every ≤ 6 row IS NOT.
//
// `reservedAt` is computed relative to `now` at seed time so the "past vs. future" story stays
// true no matter when this script runs. ContactMessage rows ride along here — the plan's seed
// file split (site-settings/users/branches/menu/gallery/marketing/page-content/reservations)
// didn't name a home for this Tier-1 entity, and it sits immediately before Reservation in the
// dependency order research R7 specifies, so it lives here rather than inventing a ninth file.
import type { PrismaClient, ReservationOccasion, ReservationStatus } from "@prisma/client";
import type { SeededBranches } from "./branches";
import type { SeededUsers } from "./users";

function daysFromNow(days: number, hours = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return d;
}

interface ReservationSeed {
  code: string;
  branch: "shobra" | "heliopolis";
  table: number | null; // index into that branch's tableIds, or null for unassigned
  customerName: string;
  phone: string;
  partySize: number;
  reservedAt: Date;
  status: ReservationStatus;
  occasion?: ReservationOccasion;
  staffNotes?: string;
  handledBy?: "admin" | "moderator" | null;
  history: Array<{ from: ReservationStatus | null; to: ReservationStatus; actor?: "admin" | "moderator" | null }>;
}

function buildReservations(): ReservationSeed[] {
  return [
    {
      code: "SEED01", branch: "shobra", table: 0, customerName: "Youssef Adel", phone: "+20 100 100 0001",
      partySize: 2, reservedAt: daysFromNow(2), status: "CONFIRMED",
      history: [{ from: null, to: "PENDING" }, { from: "PENDING", to: "CONFIRMED" }],
    },
    {
      code: "SEED02", branch: "shobra", table: 2, customerName: "Mona Farouk", phone: "+20 100 100 0002",
      partySize: 4, reservedAt: daysFromNow(3), status: "CONFIRMED",
      history: [{ from: null, to: "CONFIRMED" }],
    },
    {
      code: "SEED03", branch: "shobra", table: null, customerName: "Tarek Aziz", phone: "+20 100 100 0003",
      partySize: 8, reservedAt: daysFromNow(1), status: "PENDING", occasion: "BUSINESS",
      staffNotes: "Large party — confirm headcount before calling back.",
      history: [{ from: null, to: "PENDING" }],
    },
    {
      code: "SEED04", branch: "heliopolis", table: null, customerName: "Nadia Salem", phone: "+20 100 100 0004",
      partySize: 3, reservedAt: daysFromNow(5), status: "PENDING",
      history: [{ from: null, to: "PENDING" }],
    },
    {
      code: "SEED05", branch: "heliopolis", table: null, customerName: "Hassan Ibrahim", phone: "+20 100 100 0005",
      partySize: 10, reservedAt: daysFromNow(4), status: "PENDING", occasion: "FAMILY",
      staffNotes: "Ten guests, asked about the terrace — confirm availability on the call.",
      history: [{ from: null, to: "PENDING" }],
    },
    {
      code: "SEED06", branch: "shobra", table: 1, customerName: "Rania Sami", phone: "+20 100 100 0006",
      partySize: 2, reservedAt: daysFromNow(0, 2), status: "SEATED", handledBy: "moderator",
      history: [
        { from: null, to: "CONFIRMED" },
        { from: "CONFIRMED", to: "SEATED", actor: "moderator" },
      ],
    },
    {
      code: "SEED07", branch: "heliopolis", table: 3, customerName: "Ahmed Fathy", phone: "+20 100 100 0007",
      partySize: 6, reservedAt: daysFromNow(0, 1), status: "SEATED", handledBy: "moderator",
      history: [
        { from: null, to: "CONFIRMED" },
        { from: "CONFIRMED", to: "SEATED", actor: "moderator" },
      ],
    },
    {
      code: "SEED08", branch: "shobra", table: 3, customerName: "Dalia Nabil", phone: "+20 100 100 0008",
      partySize: 4, reservedAt: daysFromNow(-1), status: "COMPLETED", handledBy: "moderator",
      history: [
        { from: null, to: "CONFIRMED" },
        { from: "CONFIRMED", to: "SEATED", actor: "moderator" },
        { from: "SEATED", to: "COMPLETED", actor: "moderator" },
      ],
    },
    {
      code: "SEED09", branch: "heliopolis", table: 0, customerName: "Amr Khalil", phone: "+20 100 100 0009",
      partySize: 2, reservedAt: daysFromNow(-2), status: "COMPLETED",
      history: [
        { from: null, to: "CONFIRMED" },
        { from: "CONFIRMED", to: "SEATED" },
        { from: "SEATED", to: "COMPLETED" },
      ],
    },
    {
      code: "SEED10", branch: "shobra", table: null, customerName: "Salma Adel", phone: "+20 100 100 0010",
      partySize: 5, reservedAt: daysFromNow(-3), status: "COMPLETED",
      history: [{ from: null, to: "CONFIRMED" }, { from: "CONFIRMED", to: "COMPLETED" }],
    },
    {
      code: "SEED11", branch: "heliopolis", table: 1, customerName: "Karim Nour", phone: "+20 100 100 0011",
      partySize: 3, reservedAt: daysFromNow(-4), status: "NO_SHOW", handledBy: "admin",
      staffNotes: "Never arrived, no call ahead — third time this quarter.",
      history: [{ from: null, to: "CONFIRMED" }, { from: "CONFIRMED", to: "NO_SHOW", actor: "admin" }],
    },
    {
      code: "SEED12", branch: "shobra", table: null, customerName: "Yara Hamdy", phone: "+20 100 100 0012",
      partySize: 2, reservedAt: daysFromNow(-5), status: "NO_SHOW",
      history: [{ from: null, to: "CONFIRMED" }, { from: "CONFIRMED", to: "NO_SHOW" }],
    },
    {
      code: "SEED13", branch: "heliopolis", table: null, customerName: "Omar Sultan", phone: "+20 100 100 0013",
      partySize: 4, reservedAt: daysFromNow(-1), status: "CANCELLED",
      history: [{ from: null, to: "CONFIRMED" }, { from: "CONFIRMED", to: "CANCELLED" }],
    },
    {
      code: "SEED14", branch: "shobra", table: null, customerName: "Farida Wael", phone: "+20 100 100 0014",
      partySize: 6, reservedAt: daysFromNow(1), status: "CANCELLED",
      history: [{ from: null, to: "CONFIRMED" }, { from: "CONFIRMED", to: "CANCELLED" }],
    },
    {
      code: "SEED15", branch: "heliopolis", table: null, customerName: "Mostafa Reda", phone: "+20 100 100 0015",
      partySize: 12, reservedAt: daysFromNow(6), status: "PENDING", occasion: "BUSINESS",
      staffNotes: "Corporate dinner — needs the terrace, confirm on the call.",
      history: [{ from: null, to: "PENDING" }],
    },
    {
      code: "SEED16", branch: "shobra", table: 4, customerName: "Heba Younis", phone: "+20 100 100 0016",
      partySize: 2, reservedAt: daysFromNow(7), status: "CONFIRMED", occasion: "BIRTHDAY",
      history: [{ from: null, to: "CONFIRMED" }],
    },
    {
      code: "SEED17", branch: "heliopolis", table: 4, customerName: "Ziad Mansour", phone: "+20 100 100 0017",
      partySize: 4, reservedAt: daysFromNow(2), status: "CONFIRMED", occasion: "ENGAGEMENT",
      history: [{ from: null, to: "CONFIRMED" }],
    },
    {
      code: "SEED18", branch: "shobra", table: null, customerName: "Passant Gaber", phone: "+20 100 100 0018",
      partySize: 6, reservedAt: daysFromNow(3), status: "CONFIRMED",
      history: [{ from: null, to: "CONFIRMED" }],
    },
    {
      code: "SEED19", branch: "heliopolis", table: null, customerName: "Sherif Osman", phone: "+20 100 100 0019",
      partySize: 2, reservedAt: daysFromNow(8), status: "PENDING",
      history: [{ from: null, to: "PENDING" }],
    },
    {
      code: "SEED20", branch: "shobra", table: null, customerName: "Nourhan Zaki", phone: "+20 100 100 0020",
      partySize: 9, reservedAt: daysFromNow(9), status: "PENDING", occasion: "FAMILY",
      staffNotes: "Confirm dietary restrictions — two guests fasting.",
      history: [{ from: null, to: "PENDING" }],
    },
  ];
}

export async function seedReservations(
  prisma: PrismaClient,
  branches: SeededBranches,
  users: SeededUsers,
): Promise<void> {
  const resolveActor = (who: "admin" | "moderator" | null | undefined): string | null => {
    if (who === "admin") return users.adminId;
    if (who === "moderator") return users.moderatorId;
    return null;
  };

  for (const r of buildReservations()) {
    const branchId = r.branch === "shobra" ? branches.shobraId : branches.heliopolisId;
    const tableIds = r.branch === "shobra" ? branches.tableIds.shobra : branches.tableIds.heliopolis;
    const tableId = r.table === null ? null : (tableIds[r.table] ?? null);
    // partySize > 6 is always PENDING + requiresCall (Article 26 [NN], FR-011) — computed, never
    // hand-typed per row, so this invariant cannot silently drift as rows are added later.
    const requiresCall = r.partySize > 6;

    const reservation = await prisma.reservation.upsert({
      where: { code: r.code },
      update: {
        branchId,
        tableId,
        customerName: r.customerName,
        phone: r.phone,
        partySize: r.partySize,
        reservedAt: r.reservedAt,
        status: requiresCall ? "PENDING" : r.status,
        occasion: r.occasion ?? "NONE",
        staffNotes: r.staffNotes ?? null,
        requiresCall,
        handledById: resolveActor(r.handledBy),
      },
      create: {
        code: r.code,
        branchId,
        tableId,
        customerName: r.customerName,
        phone: r.phone,
        partySize: r.partySize,
        reservedAt: r.reservedAt,
        status: requiresCall ? "PENDING" : r.status,
        occasion: r.occasion ?? "NONE",
        staffNotes: r.staffNotes ?? null,
        requiresCall,
        handledById: resolveActor(r.handledBy),
      },
    });

    // Append-only — never updated, never deleted (an editable history isn't a history). No
    // `deleteMany`-then-recreate: idempotency here is insert-if-missing, checked per event
    // against the one thing that makes a (reservationId, fromStatus, toStatus) transition
    // unique in this fixture data — none of the seeded histories repeat the same transition
    // twice for one reservation (research R6's pattern, applied without a schema-level unique
    // constraint that would incorrectly forbid a *real* reservation revisiting a status later).
    for (const event of r.history) {
      const exists = await prisma.reservationEvent.findFirst({
        where: { reservationId: reservation.id, fromStatus: event.from, toStatus: event.to },
      });
      if (!exists) {
        await prisma.reservationEvent.create({
          data: {
            reservationId: reservation.id,
            fromStatus: event.from,
            toStatus: event.to,
            actorId: resolveActor(event.actor),
          },
        });
      }
    }
  }

  const contactMessages: Array<{
    name: string;
    email: string;
    subject: string;
    message: string;
    status: "NEW" | "READ" | "HANDLED" | "ARCHIVED";
  }> = [
    {
      name: "Layla Ashraf",
      email: "layla.ashraf.seed@example.com",
      subject: "Private event enquiry",
      message: "Hi — do you take bookings for a 25-person birthday dinner? Would love the terrace at Heliopolis.",
      status: "NEW",
    },
    {
      name: "Bassem Fahmy",
      email: "bassem.fahmy.seed@example.com",
      subject: "Menu question",
      message: "Is the Marinara pizza actually dairy-free, or just meat-free? Checking for a fasting guest.",
      status: "READ",
    },
    {
      name: "Rasha Kotb",
      email: "rasha.kotb.seed@example.com",
      subject: "Great evening",
      message: "Just wanted to say the calzone last night was excellent — thank you to the whole team.",
      status: "HANDLED",
    },
    {
      name: "Adham Latif",
      email: "adham.latif.seed@example.com",
      subject: "Delivery coverage",
      message: "Do you deliver to Nasr City from the Heliopolis branch?",
      status: "NEW",
    },
    {
      name: "Nesma Gouda",
      email: "nesma.gouda.seed@example.com",
      subject: "Lost item",
      message: "I think I left a scarf at the Shobra branch on Tuesday evening — could someone check?",
      status: "ARCHIVED",
    },
  ];

  for (const [i, m] of contactMessages.entries()) {
    const existing = await prisma.contactMessage.findFirst({ where: { email: m.email } });
    if (existing) {
      await prisma.contactMessage.update({ where: { id: existing.id }, data: m });
    } else {
      await prisma.contactMessage.create({
        data: { ...m, createdAt: daysFromNow(-i - 1) },
      });
    }
  }
}
