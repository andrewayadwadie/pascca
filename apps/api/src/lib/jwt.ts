// 003-auth-authorization (T011, research R3, R2-revised). Framework-agnostic on purpose — this
// must be callable from `auth.service.ts` (no `req`/`reply` in scope, Article 7) and from
// `plugins/auth.ts`'s custom preHandler with no shared Fastify decorator in between. HS256,
// signed with `JWT_ACCESS_SECRET`. The payload is deliberately minimal: `sub` + `role`, nothing
// else — no permission list. `requirePermission` re-derives the actual grant from the seeded
// `RolePermission` table on every request (see `permissions.service.ts`), so a role change or a
// grant edit takes effect on the very next request, not after the token's 15-minute lifetime.
import { createSigner, createVerifier } from "fast-jwt";

const ACCESS_TOKEN_TTL = "15m";

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export interface VerifiedAccessToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

export function signAccessToken(secret: string, payload: AccessTokenPayload): string {
  const sign = createSigner({ key: secret, algorithm: "HS256", expiresIn: parseTtlMs(ACCESS_TOKEN_TTL) });
  return sign(payload);
}

/** Throws (fast-jwt's own error types) on an expired, malformed, or badly-signed token. */
export function verifyAccessToken(secret: string, token: string): VerifiedAccessToken {
  const verify = createVerifier({ key: secret, algorithms: ["HS256"] });
  return verify(token) as VerifiedAccessToken;
}

function parseTtlMs(ttl: string): number {
  const match = /^(\d+)m$/.exec(ttl);
  if (!match) throw new Error(`Unsupported TTL format: ${ttl}`);
  return Number(match[1]) * 60 * 1000;
}
