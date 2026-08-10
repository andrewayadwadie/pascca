// 003-auth-authorization (T039, Art 7). Prisma-only, read-only access to `RolePermission` — no
// business rules, no in-memory caching (that's `permissions.service.ts`'s job, research R6).
import type { PrismaClient, RolePermission } from "@prisma/client";

export function createPermissionsRepository(prisma: PrismaClient) {
  return {
    findAll(): Promise<RolePermission[]> {
      return prisma.rolePermission.findMany();
    },
  };
}

export type PermissionsRepository = ReturnType<typeof createPermissionsRepository>;
