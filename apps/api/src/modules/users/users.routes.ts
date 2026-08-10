// 003-auth-authorization (T029, T044, T062, Art 7): HTTP + swagger schema only.
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { createUsersRepository } from "./users.repository.ts";
import { createUsersService } from "./users.service.ts";
import { createAuditWriter } from "../../lib/audit.ts";
import {
  ChangeActiveBodySchema,
  ChangeRoleBodySchema,
  ListUsersQuerySchema,
  ProfileResponseSchema,
  UpdateProfileBodySchema,
} from "./users.schema.ts";
import { AppError, envelope, envelopeWithMeta, ok, okWithMeta } from "../../plugins/errors.ts";
import { verifyPassword, hashPassword } from "../../lib/hash.ts";
import { createAuthRepository } from "../auth/auth.repository.ts";
import { createAuthService } from "../auth/auth.service.ts";
import type { Env } from "../../config/env.ts";

const usersRoutes: FastifyPluginAsyncZod<{ env: Env }> = async (app, opts) => {
  const usersRepository = createUsersRepository(app.prisma);
  const auditWriter = createAuditWriter(app.prisma);
  const usersService = createUsersService(usersRepository, auditWriter);

  // US4/FR-017: password-change-revokes-other-sessions needs `auth.service.ts` — a
  // users→auth cross-module service call, never touching `auth.repository` directly (Art 7).
  const authRepository = createAuthRepository(app.prisma);
  const authService = createAuthService({ authRepository, usersService, jwtAccessSecret: opts.env.JWT_ACCESS_SECRET });

  app.get(
    "/me",
    { preHandler: [app.authenticate], schema: { response: { 200: envelope(ProfileResponseSchema) } } },
    async (request) => {
      const profile = await usersService.getProfile(request.user!.id);
      if (!profile) throw new AppError("AUTHZ_UNAUTHENTICATED", 401, "Account no longer exists");
      return ok(profile);
    },
  );

  app.patch(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: { body: UpdateProfileBodySchema, response: { 200: envelope(ProfileResponseSchema) } },
    },
    async (request) => {
      const userId = request.user!.id;
      const body = request.body;

      let passwordHash: string | undefined;
      if (body.password) {
        const current = await usersRepository.findById(userId);
        if (!current || !(await verifyPassword(current.passwordHash, body.currentPassword!))) {
          throw new AppError("AUTH_INVALID_CREDENTIALS", 401, "Current password is incorrect");
        }
        passwordHash = await hashPassword(body.password);
      }

      const updated = await usersService.updateProfile(userId, {
        ...(body.name ? { name: body.name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.email ? { email: body.email } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      });

      // Clarification Q2: a successful password change revokes other sessions. No refresh
      // token is available here to "keep" (this is an access-token-authenticated route, not a
      // refresh call), so this revokes ALL of this user's refresh-token sessions; the caller's
      // already-issued access token remains valid until its own 15-minute expiry regardless
      // (FR-004 only mandates live re-checking of isActive/deletedAt, not access-token
      // revocation on password change).
      if (passwordHash) {
        await authService.revokeAllSessions(userId);
      }

      return ok(updated);
    },
  );

  app.get(
    "/users",
    {
      preHandler: [app.authenticate, app.requirePermission("user:read")],
      schema: {
        querystring: ListUsersQuerySchema,
        response: { 200: envelopeWithMeta(z.array(ProfileResponseSchema), z.object({ page: z.number(), limit: z.number(), total: z.number() })) },
      },
    },
    async (request) => {
      const { page, limit, role, isActive } = request.query;
      const { data, meta } = await usersService.listUsers({
        page,
        limit,
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      });
      return okWithMeta(data, meta);
    },
  );

  app.patch(
    "/users/:id/role",
    {
      preHandler: [app.authenticate, app.requirePermission("user:write")],
      schema: {
        params: z.object({ id: z.string() }),
        body: ChangeRoleBodySchema,
        response: { 200: envelope(ProfileResponseSchema) },
      },
    },
    async (request) => {
      const updated = await usersService.changeRole(request.user!.id, request.params.id, request.body.role);
      return ok(updated);
    },
  );

  app.patch(
    "/users/:id/active",
    {
      preHandler: [app.authenticate, app.requirePermission("user:write")],
      schema: {
        params: z.object({ id: z.string() }),
        body: ChangeActiveBodySchema,
        response: { 200: envelope(ProfileResponseSchema) },
      },
    },
    async (request) => {
      const updated = await usersService.changeActiveStatus(request.user!.id, request.params.id, request.body.isActive);
      return ok(updated);
    },
  );

  app.delete(
    "/users/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("user:write")],
      schema: { params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      await usersService.deleteUser(request.user!.id, request.params.id);
      reply.code(204);
    },
  );
};

export default usersRoutes;
