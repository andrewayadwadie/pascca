// 003-auth-authorization (T028, T061, Art 7): HTTP + swagger schema only. Every response is a
// Zod schema (Art 8: OpenAPI is generated from these, never hand-written); every failure is an
// `AppError` thrown up to `plugins/errors.ts`'s handler, never a `reply.code()` call in here for
// an error case.
//
// FR-009/FR-010's web/mobile branch: a request carrying `x-client-platform: web` gets the
// refresh token ONLY as an httpOnly cookie (never in the JSON body); everyone else (mobile, or
// any caller not sending that header) gets it in the body. `packages/api-client` (the web app's
// only path to this API) is responsible for always sending the header — see
// `contracts/auth-endpoints.md`'s client-detection note.
import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Env } from "../../config/env.ts";
import { createAuthRepository } from "./auth.repository.ts";
import { createAuthService } from "./auth.service.ts";
import { createUsersRepository } from "../users/users.repository.ts";
import { createUsersService } from "../users/users.service.ts";
import { createAuditWriter } from "../../lib/audit.ts";
import {
  AccessTokenResponseSchema,
  LoginBodySchema,
  LogoutBodySchema,
  RefreshBodySchema,
  TokenResponseSchema,
} from "./auth.schema.ts";
import { RegisterBodySchema } from "../users/users.schema.ts";
import { registerAuthRateLimit } from "../../plugins/rate-limit.ts";
import { AppError, envelope, ok } from "../../plugins/errors.ts";
import { hashPassword } from "../../lib/hash.ts";
import type { RequestMeta } from "./auth.service.ts";

const REFRESH_COOKIE = "pascca_rt";

function isWebClient(request: FastifyRequest): boolean {
  return request.headers["x-client-platform"] === "web";
}

// `exactOptionalPropertyTypes` (tsconfig base) means `{userAgent: undefined}` is a type error
// where `RequestMeta.userAgent?: string` is declared — the key must be OMITTED, not present with
// an undefined value. `request.headers["user-agent"]` is always `string | undefined`, so this
// builds the object conditionally rather than every call site repeating the same dance.
function requestMeta(request: FastifyRequest): RequestMeta {
  const userAgent = request.headers["user-agent"];
  return { ip: request.ip, ...(userAgent ? { userAgent } : {}) };
}

function setRefreshCookie(reply: FastifyReply, env: Env, value: string): void {
  reply.setCookie(REFRESH_COOKIE, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
    path: "/api/v1/auth",
    signed: true,
  });
}

function clearRefreshCookie(reply: FastifyReply, env: Env): void {
  reply.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth", secure: env.NODE_ENV === "production" });
}

const authRoutes: FastifyPluginAsyncZod<{ env: Env }> = async (parent, opts) => {
  const authRepository = createAuthRepository(parent.prisma);
  const usersRepository = createUsersRepository(parent.prisma);
  const auditWriter = createAuditWriter(parent.prisma);
  const usersService = createUsersService(usersRepository, auditWriter);
  const authService = createAuthService({
    authRepository,
    usersService,
    jwtAccessSecret: opts.env.JWT_ACCESS_SECRET,
  });

  // Clarification Q1: all four routes live in one child scope so `registerAuthRateLimit`'s
  // single `global:true` registration gives them one shared 5/min/IP budget (research R7 — see
  // plugins/rate-limit.ts for why per-route config can't do this).
  await parent.register(async (app: typeof parent) => {
    await registerAuthRateLimit(app);

    app.post(
      "/auth/register",
      { schema: { body: RegisterBodySchema, response: { 201: envelope(TokenResponseSchema) } } },
      async (request, reply) => {
        const existing = await usersService.findByEmailForAuth(request.body.email);
        if (existing) throw new AppError("AUTH_EMAIL_TAKEN", 409, "Email is already registered");

        const passwordHash = await hashPassword(request.body.password);
        const user = await usersService.createCustomer({
          email: request.body.email,
          name: request.body.name,
          passwordHash,
          ...(request.body.phone ? { phone: request.body.phone } : {}),
        });
        const meta = requestMeta(request);
        const tokens = await authService.issueSessionForNewAccount(user, meta);
        const profile = usersService.toProfileResponse(user);

        reply.code(201);
        if (isWebClient(request)) {
          setRefreshCookie(reply, opts.env, tokens.refreshToken);
          return ok({ user: profile, accessToken: tokens.accessToken });
        }
        return ok({ user: profile, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      },
    );

    app.post(
      "/auth/login",
      { schema: { body: LoginBodySchema, response: { 200: envelope(TokenResponseSchema) } } },
      async (request, reply) => {
        const meta = requestMeta(request);
        const result = await authService.login(request.body.email, request.body.password, meta);

        if (isWebClient(request)) {
          setRefreshCookie(reply, opts.env, result.refreshToken);
          return ok({ user: result.user, accessToken: result.accessToken });
        }
        return ok(result);
      },
    );

    app.post(
      "/auth/refresh",
      { schema: { body: RefreshBodySchema, response: { 200: envelope(AccessTokenResponseSchema) } } },
      async (request, reply) => {
        const presented = isWebClient(request) ? request.cookies[REFRESH_COOKIE] : request.body.refreshToken;
        if (!presented) throw new AppError("AUTH_TOKEN_INVALID", 401, "No refresh token presented");

        const meta = requestMeta(request);
        const tokens = await authService.refresh(presented, meta);

        if (isWebClient(request)) {
          setRefreshCookie(reply, opts.env, tokens.refreshToken);
          return ok({ accessToken: tokens.accessToken });
        }
        return ok(tokens);
      },
    );

    app.post(
      "/auth/logout",
      { preHandler: [app.authenticate], schema: { body: LogoutBodySchema } },
      async (request, reply) => {
        const presented = isWebClient(request) ? request.cookies[REFRESH_COOKIE] : request.body.refreshToken;
        if (presented) await authService.logout(presented);
        if (isWebClient(request)) clearRefreshCookie(reply, opts.env);
        reply.code(204);
      },
    );
  });
};

export default authRoutes;
