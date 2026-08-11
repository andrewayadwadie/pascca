// Zod schema matching files/site/contact.html's fields exactly (US3). Submits nowhere (FR-033).
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "This field is required."),
  phone: z.string().min(6, "Enter a valid mobile number."),
  email: z.string().email("Enter a valid email address.").optional().or(z.literal("")),
  subject: z.string().min(1),
  message: z.string().min(10, "Say a little more — a few words is enough."),
});

export type ContactValues = z.infer<typeof contactSchema>;
