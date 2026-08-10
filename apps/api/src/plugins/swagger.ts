// 003-auth-authorization (T014, Art 8 [NN], research R9). `@fastify/swagger` assembles the
// OpenAPI 3.1 document from every route's Zod schema via `fastify-type-provider-zod`'s
// `jsonSchemaTransform` — no second, hand-written schema anywhere. Served as raw JSON at
// `/api/v1/openapi.json`; no UI is registered (nothing here needs one, and Article 29's Helmet
// defaults stay untouched rather than being pre-loosened for a surface that doesn't exist).
// `packages/types/scripts/generate.ts` (T015) reads this document's exported form
// (`docs/openapi.json`, written by `apps/api/scripts/export-openapi.ts`) to generate
// `packages/types`.
import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";

export default fp(async function swaggerPlugin(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "PASCca API", version: "1.0.0" },
    },
    transform: jsonSchemaTransform,
  });

  app.get("/api/v1/openapi.json", { schema: { hide: true } }, async () => app.swagger());
});
