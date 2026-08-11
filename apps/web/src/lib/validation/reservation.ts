// Zod schema matching files/site/reservations.html's fields exactly (US3). Submits nowhere —
// this only gates which local ResultBox state renders (FR-033, FR-034).
import { z } from "zod";

export const reservationSchema = z.object({
  name: z.string().min(1, "This field is required."),
  phone: z.string().min(6, "Enter a valid mobile number."),
  email: z.string().email("Enter a valid email address.").optional().or(z.literal("")),
  branch: z.string().min(1),
  date: z.string().min(1, "This field is required."),
  time: z.string().min(1, "This field is required."),
  size: z.coerce.number().int().min(1),
  occasion: z.string().optional(),
  notes: z.string().optional(),
});

export type ReservationValues = z.infer<typeof reservationSchema>;
