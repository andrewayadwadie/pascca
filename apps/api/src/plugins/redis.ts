// 003-auth-authorization (T006, research R1). `lazyConnect: true` deliberately — this decorator
// must be safe to register during `buildApp()` (used by `packages/types`' OpenAPI export script
// and by every test that builds an app without a live Redis) without forcing a connection
// attempt. The one place that DOES need Redis reachable before serving traffic is
// `lib/health.ts`'s boot-time check in `server.ts`, which is deliberately separate from this
// decorator (it uses its own throwaway connection — see that file's own comment).
import fp from "fastify-plugin";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env.ts";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async function redisPlugin(app: FastifyInstance, opts: { env: Env }) {
  const redis = new Redis(opts.env.REDIS_URL, { lazyConnect: true });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    redis.disconnect();
  });
});
