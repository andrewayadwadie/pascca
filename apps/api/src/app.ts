// Article 4 [NN]: capabilities live under /api/v1.
//
// 003-auth-authorization (T016): the plugin stack every module needs, registered once here in
// dependency order — prisma/redis (decorators other plugins and every module read) before
// cors/helmet (the security baseline) before errors (so every later plugin's thrown errors are
// caught) before auth (needs prisma) before swagger (assembles the document from whatever routes
// end up registered in the /api/v1 scope below). Zod is wired as Fastify's validator/serializer
// compiler here, once, for every route registered after this point — Article 7's `.schema.ts`
// files feed it, nothing hand-writes JSON Schema. Rate limiting is NOT a global/root-level
// plugin here — `plugins/rate-limit.ts`'s `registerAuthRateLimit` is registered inside
// `auth.routes.ts`'s own child scope instead (see that file's comment for why: a shared budget
// across multiple routes needs one scope-level `global:true` registration, not a per-route one).
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import type { Env } from "./config/env.ts";
import prismaPlugin from "./plugins/prisma.ts";
import redisPlugin from "./plugins/redis.ts";
import corsPlugin from "./plugins/cors.ts";
import helmetPlugin from "./plugins/helmet.ts";
import errorsPlugin from "./plugins/errors.ts";
import authPlugin from "./plugins/auth.ts";
import rbacPlugin from "./plugins/rbac.ts";
import swaggerPlugin from "./plugins/swagger.ts";
import authRoutes from "./modules/auth/auth.routes.ts";
import usersRoutes from "./modules/users/users.routes.ts";
import permissionsRoutes from "./modules/permissions/permissions.routes.ts";

export function buildApp(env: Env): FastifyInstance {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Infrastructure probe for UptimeRobot (Article 5), deliberately OUTSIDE /api/v1 — it is not
  // a product capability under Article 4, it's a liveness check.
  app.get("/health", async () => ({ status: "ok" }));

  app.register(prismaPlugin);
  app.register(redisPlugin, { env });
  app.register(corsPlugin, { env });
  app.register(helmetPlugin);
  app.register(errorsPlugin);
  app.register(authPlugin, { env });
  app.register(rbacPlugin);
  app.register(swaggerPlugin);

  app.register(
    async (v1) => {
      v1.register(authRoutes, { env });
      v1.register(usersRoutes, { env });
      v1.register(permissionsRoutes);
    },
    { prefix: "/api/v1" },
  );

  return app;
}
