// 003-auth-authorization (T020, Art 7). Zod DTOs for the `auth` module.
import { z } from "zod";
import { ProfileResponseSchema } from "../users/users.schema.ts";

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;

// Mobile sends the refresh token in the body; web relies on the httpOnly cookie (FR-009/FR-010).
export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshBody = z.infer<typeof RefreshBodySchema>;

export const LogoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type LogoutBody = z.infer<typeof LogoutBodySchema>;

export const TokenResponseSchema = z.object({
  user: ProfileResponseSchema,
  accessToken: z.string(),
  // Present only for mobile responses — web gets the refresh token exclusively via cookie.
  refreshToken: z.string().optional(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const AccessTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});
export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>;
