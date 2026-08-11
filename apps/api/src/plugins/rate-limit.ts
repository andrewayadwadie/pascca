// 003-auth-authorization (T013, Clarification Q1, research R7 — revised during implementation).
//
// `@fastify/rate-limit`'s per-route `config.rateLimit` option creates a SEPARATE child store per
// route internally (`pluginComponent.store.child({...routeInfo})`), even when every route shares
// the same `keyGenerator` — it's designed for "each route gets its own limit," not "these routes
// share one limit." Getting Clarification Q1's single combined 5/min/IP budget across
// register+login+refresh+logout instead requires registering rate-limit with `global: true`
// inside ONE child Fastify scope that all four routes live in — one plugin instance, one store,
// genuinely shared counting. `registerAuthRateLimit` is that scope-level registration;
// `auth.routes.ts` wraps its four routes in the scope this returns into.
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "./errors.ts";

export async function registerAuthRateLimit(scope: FastifyInstance): Promise<void> {
  await scope.register(rateLimit, {
    global: true,
    max: 5,
    timeWindow: "1 minute",
    redis: scope.redis,
    keyGenerator: (request: FastifyRequest) => `auth:${request.ip}`,
    // See plugins/errors.ts / auth.service.ts's AppError usage — @fastify/rate-limit does
    // `throw errorResponseBuilder(...)` internally, so returning an AppError instance (not a
    // plain object) is what lets the global error handler's `instanceof AppError` branch catch
    // it and respond 429, instead of falling through to the generic 500 branch.
    errorResponseBuilder: () =>
      new AppError("AUTH_RATE_LIMITED", 429, "Too many requests — try again in a minute"),
  });
}
