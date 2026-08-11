// Content fixture — real copy transcribed from files/site/branches.html (fixes the
// TODO(client-data) placeholder divergence in apps/api/prisma/seed/branches.ts — research R8).
import type { Branch } from "@pascca/types/content";

export const branches: Branch[] = [
  {
    slug: "shobra",
    nameEn: "Shobra",
    nameAr: null,
    addressEn: "273 Shobra Street, Cairo",
    addressAr: null,
    phone: "0120 125 1110",
    mapUrl: "https://maps.google.com/?q=30.0969839,31.2456441",
    hoursLabel: "12pm — 2am",
    ratingLabel: "4.4★ · 76",
    deliveryAreaLabel: "Al Khalafawy",
  },
  {
    slug: "heliopolis",
    nameEn: "Heliopolis",
    nameAr: null,
    addressEn: "40 Abd El-Aziz Fahmy Street, El-Nozha",
    addressAr: null,
    phone: "0110 114 8075",
    mapUrl: "https://maps.google.com/?q=30.1094691,31.3362255",
    hoursLabel: "24 hours",
    ratingLabel: "4.1★ · 441",
    deliveryAreaLabel: null,
  },
];
