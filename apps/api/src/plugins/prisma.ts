// 003-auth-authorization (T005, research R1): this feature's first real Prisma consumer at
// request time — 002 only ever used PrismaClient from `prisma/seed.ts` and test helpers, never
// from a running server. `fastify-plugin` (fp) is required here, not optional ceremony: without
// it Fastify's encapsulation would scope `fastify.prisma` to this plugin's own child context and
// every module registered as a sibling would never see the decorator.
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async function prismaPlugin(app: FastifyInstance) {
  const prisma = new PrismaClient();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
