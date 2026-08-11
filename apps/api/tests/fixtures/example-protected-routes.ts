// 003-auth-authorization (T033, research R11). One throwaway route per permission string that
// has no real endpoint yet — every domain in Article 14's table except `user:*`/`audit:read`
// (those ARE real: `/users*`, `/permissions`). Mounted only from within a test's own app
// instance, registered AFTER `buildApp()` but BEFORE `.ready()` — never inside `buildApp()`
// itself, so this never appears in the real OpenAPI document or production route table. Proves
// `requirePermission` gates correctly for every permission string the constitution names, using
// the exact same primitive (`app.requirePermission`) a real future route will use.
import type { FastifyInstance } from "fastify";

export const FIXTURE_PERMISSIONS = [
  "reservation:read",
  "reservation:create",
  "reservation:update",
  "reservation:delete",
  "message:read",
  "message:update",
  "menu:write",
  "category:write",
  "gallery:write",
  "branch:write",
  "content:write",
  "testimonial:write",
  "team:write",
  "post:write",
  "settings:write",
] as const;

export function fixturePath(permission: string): string {
  return `/api/v1/_test/${permission.replace(":", "-")}`;
}

export default async function exampleProtectedRoutes(app: FastifyInstance): Promise<void> {
  for (const permission of FIXTURE_PERMISSIONS) {
    app.get(
      fixturePath(permission),
      { preHandler: [app.authenticate, app.requirePermission(permission)] },
      async () => ({ ok: true, permission }),
    );
  }
}
