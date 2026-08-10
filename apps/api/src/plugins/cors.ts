// 003-auth-authorization (T007, research R1). Article 29 [NN]: CORS allow-list, never "*" — the
// env schema itself already refuses a wildcard (env.ts), this plugin just wires the parsed array
// through. `credentials: true` because the refresh-token cookie (FR-009) must travel on
// cross-origin requests from apps/web and apps/admin.
import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env.ts";

export default fp(async function corsPlugin(app: FastifyInstance, opts: { env: Env }) {
  await app.register(cors, {
    origin: opts.env.CORS_ORIGINS,
    credentials: true,
  });
});
