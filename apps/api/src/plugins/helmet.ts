// 003-auth-authorization (T008, research R1). Article 29 [NN] names Helmet by hand. Nothing this
// feature ships renders HTML, so there's no first-party inline-script/CSP tuning to do here yet —
// that's the web app's concern when it ships. Fastify's swagger UI (if enabled) is the one thing
// on this server that could want a relaxed CSP; T014 keeps swagger UI off in production, so the
// defaults are left as-is rather than pre-loosened for a surface that doesn't exist yet.
import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";

export default fp(async function helmetPlugin(app: FastifyInstance) {
  await app.register(helmet);
});
