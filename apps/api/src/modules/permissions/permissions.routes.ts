// 003-auth-authorization (T042, Art 7). `GET /permissions` — lists the full seeded map. Exists
// so this module is a real four-file citizen (Art 7) rather than a routes-less exception, and
// doubles as the operator-visible mirror of `contracts/permission-matrix.md`.
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { PermissionMapResponseSchema } from "./permissions.schema.ts";
import { envelope, ok } from "../../plugins/errors.ts";

const permissionsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/permissions",
    {
      preHandler: [app.authenticate, app.requirePermission("audit:read")],
      schema: { response: { 200: envelope(PermissionMapResponseSchema) } },
    },
    async () => ok(app.permissionsService.listAll()),
  );
};

export default permissionsRoutes;
