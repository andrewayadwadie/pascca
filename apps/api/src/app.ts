// Article 4 [NN]: capabilities live under /api/v1. This feature mounts the prefix and registers
// ZERO routes under it — the first endpoint feature is Article 9-compliant by default, it just
// has to register inside this scope. (Article 11: build the phase in front of you.)
import Fastify, { type FastifyInstance } from "fastify";
import type { Env } from "./config/env.ts";

export function buildApp(env: Env): FastifyInstance {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  });

  // Infrastructure probe for UptimeRobot (Article 5), deliberately OUTSIDE /api/v1 — it is not
  // a product capability under Article 4, it's a liveness check. The only route this feature
  // ships.
  app.get("/health", async () => ({ status: "ok" }));

  app.register(
    async (v1) => {
      // No routes yet. The first API feature registers here.
      void v1;
    },
    { prefix: "/api/v1" },
  );

  return app;
}
