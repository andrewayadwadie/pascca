// 003-auth-authorization (T017, Art 7). Zod DTOs for the `users` module — in and out. No route
// or service hand-writes a shape this file doesn't already declare (Art 8).
import { z } from "zod";

export const ProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["ADMIN", "MODERATOR", "CUSTOMER"]),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().min(1).optional(),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const UpdateProfileBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    currentPassword: z.string().optional(),
  })
  .refine((body) => !body.password || Boolean(body.currentPassword), {
    message: "currentPassword is required to change password",
    path: ["currentPassword"],
  });
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;

// FR-013: minimal user-management set — US2.
export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["ADMIN", "MODERATOR", "CUSTOMER"]).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

export const ListUsersResponseSchema = z.object({
  items: z.array(ProfileResponseSchema),
  meta: z.object({ page: z.number(), limit: z.number(), total: z.number() }),
});

export const ChangeRoleBodySchema = z.object({ role: z.enum(["ADMIN", "MODERATOR", "CUSTOMER"]) });
export type ChangeRoleBody = z.infer<typeof ChangeRoleBodySchema>;

export const ChangeActiveBodySchema = z.object({ isActive: z.boolean() });
export type ChangeActiveBody = z.infer<typeof ChangeActiveBodySchema>;
