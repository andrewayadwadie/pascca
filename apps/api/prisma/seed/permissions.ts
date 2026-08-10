// Seed module: RolePermission (003-auth-authorization, T036, research R5). One row per `✅` cell
// in Article 14's permission table — the seeded map `requirePermission` reads. `reservation:
// delete`'s `≤24h old` qualifier and the `CUSTOMER` rows' `own only` scoping are business rules
// the reservations feature enforces after this base grant passes, not something modeled here
// (data-model.md). Upserted on the `[role, permission]` unique key — safe to re-run.
import type { PrismaClient, Role } from "@prisma/client";

const GRANTS: Record<Role, string[]> = {
  ADMIN: [
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
    "user:read",
    "user:write",
    "settings:write",
    "audit:read",
  ],
  MODERATOR: ["reservation:read", "reservation:create", "reservation:update", "reservation:delete", "message:read", "message:update"],
  CUSTOMER: ["reservation:read", "reservation:create", "reservation:update"],
};

export async function seedPermissions(prisma: PrismaClient): Promise<number> {
  for (const [role, permissions] of Object.entries(GRANTS) as [Role, string[]][]) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        update: {},
        create: { role, permission },
      });
    }
  }
  return prisma.rolePermission.count();
}
