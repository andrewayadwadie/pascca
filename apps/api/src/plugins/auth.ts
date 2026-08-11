// 003-auth-authorization (T012). Registers the refresh-token cookie support (`@fastify/cookie`)
// and exports `authenticate` — the ONE preHandler every protected route uses to establish
// `request.user`. Deliberately re-checks `isActive`/`deletedAt` against the database on every
// call (FR-004): a still-unexpired access token must not outlive a deactivation. This is a
// heavier preHandler than a pure-JWT check for exactly that reason — the spec requires it, not
// an oversight.
//
// Every failure here — missing header, malformed token, expired token, bad signature, or a
// deactivated/deleted account — collapses to the single `AUTHZ_UNAUTHENTICATED` code. Article 10
// distinguishes *kinds* of failure a client needs to branch on; "your access token isn't good
// enough to proceed" is one kind regardless of which of those five things caused it. (Refresh
// *tokens* get the more specific `AUTH_TOKEN_EXPIRED`/`AUTH_TOKEN_INVALID` codes — that's
// `auth.service.ts`'s concern, not this preHandler's.)
import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Env } from "../config/env.ts";
import { verifyAccessToken } from "../lib/jwt.ts";
import { AppError } from "./errors.ts";

export interface RequestUser {
  id: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: RequestUser;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function authPlugin(app: FastifyInstance, opts: { env: Env }) {
  await app.register(cookie, { secret: opts.env.COOKIE_SECRET });

  app.decorate("authenticate", async function authenticate(request: FastifyRequest) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("AUTHZ_UNAUTHENTICATED", 401, "Missing bearer token");
    }

    let payload;
    try {
      payload = verifyAccessToken(opts.env.JWT_ACCESS_SECRET, header.slice("Bearer ".length));
    } catch {
      throw new AppError("AUTHZ_UNAUTHENTICATED", 401, "Invalid or expired access token");
    }

    // FR-004: re-checked on every request, never trusted from the token alone.
    const user = await app.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError("AUTHZ_UNAUTHENTICATED", 401, "Account is no longer active");
    }

    request.user = { id: user.id, role: user.role };
  });
});
