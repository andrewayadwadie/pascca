// 003-auth-authorization (T015, Art 6: `docs/openapi.json`, research R9). Builds the app and
// calls `.ready()` — this triggers every plugin's registration (including every route's schema)
// WITHOUT binding a port or requiring a live database/Redis (both are lazy, see
// `plugins/prisma.ts`/`plugins/redis.ts`). `app.swagger()` then returns the exact document
// `@fastify/swagger` assembled from every route's Zod schema — no second, hand-written copy.
// `packages/types/scripts/generate.ts` reads the file this script writes.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildApp } from "../src/app.ts";
import { loadEnv } from "../src/config/env.ts";

const env = loadEnv();
const app = buildApp(env);

await app.ready();
const document = app.swagger();

const outPath = path.resolve(import.meta.dirname, "../../../docs/openapi.json");
await writeFile(outPath, JSON.stringify(document, null, 2) + "\n", "utf-8");

await app.close();

console.log(`OpenAPI document written to ${outPath}`);
