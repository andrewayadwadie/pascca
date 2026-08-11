// 003-auth-authorization (T041, FR-011, FR-012, Art 14 [NN]). THE authorization primitive: every
// permission-gated route in this codebase (and every future one) decorates itself with
// `requirePermission('some:permission')` — never an inline `if (user.role === 'ADMIN')`. Loads
// the seeded `RolePermission` grants into `permissions.service.ts`'s cache once at boot
// (`fp`-registered so this runs during `buildApp()`/`.ready()`, before any request is served),
// then decorates `app.requirePermission` as a preHandler *factory* — routes call
// `app.requirePermission('menu:write')` to get the actual preHandler function.
import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";
import { createPermissionsRepository } from "../modules/permissions/permissions.repository.ts";
import { createPermissionsService, type PermissionsService } from "../modules/permissions/permissions.service.ts";
import { AppError } from "./errors.ts";

declare module "fastify" {
  interface FastifyInstance {
    requirePermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    permissionsService: PermissionsService;
  }
}

export default fp(async function rbacPlugin(app: FastifyInstance) {
  const permissionsRepository = createPermissionsRepository(app.prisma);
  const permissionsService = createPermissionsService(permissionsRepository);
  await permissionsService.load();

  app.decorate("permissionsService", permissionsService);

  app.decorate("requirePermission", (permission: string) => {
    return async (request: FastifyRequest) => {
      if (!request.user) {
        throw new AppError("AUTHZ_UNAUTHENTICATED", 401, "Authentication required");
      }
      if (!permissionsService.hasPermission(request.user.role as Role, permission)) {
        throw new AppError("AUTHZ_FORBIDDEN", 403, `Missing required permission: ${permission}`);
      }
    };
  });
});
