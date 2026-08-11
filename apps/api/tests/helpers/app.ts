// 003-auth-authorization: shared HTTP-level test app builder. Every auth/users/permissions
// integration test uses `app.inject()` against a real, `.ready()`-awaited Fastify instance —
// same plugin stack as production, same route registration, just never bound to a port.
import { loadEnv } from "../../src/config/env.ts";
import { buildApp } from "../../src/app.ts";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

export async function buildTestApp(opts: { extraPlugins?: FastifyPluginAsync[] } = {}): Promise<FastifyInstance> {
  const env = loadEnv();
  const app = buildApp(env);
  // research R11: fixture routes (permission-matrix test) register AFTER buildApp() assembles
  // the real app, BEFORE `.ready()` — never inside `buildApp()` itself, so they never appear in
  // the real OpenAPI document or production route table.
  for (const plugin of opts.extraPlugins ?? []) {
    await app.register(plugin);
  }
  await app.ready();
  return app;
}
