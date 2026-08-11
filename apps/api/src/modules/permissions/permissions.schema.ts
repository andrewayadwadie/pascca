// 003-auth-authorization (T038, Art 7). Zod DTO for `GET /permissions`'s response.
import { z } from "zod";

export const PermissionMapResponseSchema = z.record(z.enum(["ADMIN", "MODERATOR", "CUSTOMER"]), z.array(z.string()));
export type PermissionMapResponse = z.infer<typeof PermissionMapResponseSchema>;
