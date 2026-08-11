// Content fixture — real copy transcribed from files/site/index.html (testimonials, home FAQ)
// and files/site/reservations.html (booking FAQ).
import type { FaqItem, Testimonial } from "@pascca/types/content";

export const testimonials: Testimonial[] = [
  {
    author: "Tripadvisor guest",
    source: "Tripadvisor",
    rating: 5,
    quoteEn:
      "The seating and atmosphere were relaxing and chic, the shrimp was properly fresh, and the calzone is the best I've had in Cairo. This is becoming our weekly outing.",
    quoteAr: null,
    branchSlug: "heliopolis",
    consentGiven: true,
  },
  {
    author: "Restaurant Guru guest",
    source: "Restaurant Guru",
    rating: 5,
    quoteEn:
      "Perfectly cooked vegetable pizza and tasty pasta. Fast service, a nice atmosphere, and staff who genuinely seem glad you came.",
    quoteAr: null,
    branchSlug: null,
    consentGiven: true,
  },
  {
    author: "Instagram guest",
    source: "Instagram",
    rating: 5,
    quoteEn:
      "One of the most affordable breakfast spots with really good quality. We came for the food and stayed three hours.",
    quoteAr: null,
    branchSlug: "heliopolis",
    consentGiven: true,
  },
];

export const faqItems: FaqItem[] = [
  // ---- home (5) ----
  {
    page: "home",
    questionEn: "Do I need to book?",
    questionAr: null,
    answerEn:
      "Not on a quiet weekday, but weekends and Friday breakfast fill up. Booking takes under a minute and holds your table for fifteen minutes past the time you choose.",
    answerAr: null,
    sortOrder: 0,
  },
  {
    page: "home",
    questionEn: "Is there outdoor seating?",
    questionAr: null,
    answerEn:
      "Yes, at the Heliopolis branch on Abd El-Aziz Fahmy. Mention it in your booking notes and we'll keep a terrace table if the weather allows.",
    answerAr: null,
    sortOrder: 1,
  },
  {
    page: "home",
    questionEn: "Do you have fasting and vegetarian dishes?",
    questionAr: null,
    answerEn:
      "Plenty. Fasting and vegetarian items are marked throughout the menu, and you can filter for them on the menu page.",
    answerAr: null,
    sortOrder: 2,
  },
  {
    page: "home",
    questionEn: "Can you host a birthday or a large group?",
    questionAr: null,
    answerEn:
      "We do this most weekends. For eight guests or fewer, book online and add the occasion in the notes. Above eight, call 0102 507 0801 so we can plan the table and the menu with you.",
    answerAr: null,
    sortOrder: 3,
  },
  {
    page: "home",
    questionEn: "What are your opening hours?",
    questionAr: null,
    answerEn: "Shobra opens midday until 2am. Heliopolis is open twenty-four hours. Breakfast is served from 8am at both.",
    answerAr: null,
    sortOrder: 4,
  },

  // ---- reservations (4) ----
  {
    page: "reservations",
    questionEn: "How long is my table held?",
    questionAr: null,
    answerEn:
      "Fifteen minutes past your booked time. Call the branch if you are running later than that and we will do our best to keep it.",
    answerAr: null,
    sortOrder: 0,
  },
  {
    page: "reservations",
    questionEn: "Can I book the terrace?",
    questionAr: null,
    answerEn:
      "The terrace is at Heliopolis and depends on weather and availability. Add it to the notes and we will keep one if we can.",
    answerAr: null,
    sortOrder: 1,
  },
  {
    page: "reservations",
    questionEn: "How do I cancel or change a booking?",
    questionAr: null,
    answerEn:
      "Your confirmation carries a reference code. Reply to it, or call the branch with the code and we will move or cancel it.",
    answerAr: null,
    sortOrder: 2,
  },
  {
    page: "reservations",
    questionEn: "Do you take walk-ins?",
    questionAr: null,
    answerEn: "Always. Booking simply guarantees the table, which matters on weekends and Friday mornings.",
    answerAr: null,
    sortOrder: 3,
  },
];
