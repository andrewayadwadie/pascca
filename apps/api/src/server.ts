// Boot sequence per data-model.md's state machine: parse env → check infrastructure
// (concurrently, report every unreachable service) → listen. Every failure path exits before
// the port is bound (FR-006).
import { buildApp } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { checkInfrastructure } from "./lib/health.ts";

const env = loadEnv();

const results = await checkInfrastructure(env);
const failures = results.filter((r) => !r.ok);
if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`${failure.service}: unreachable${failure.error ? ` (${failure.error})` : ""}`);
  }
  process.exit(1);
}

const app = buildApp(env);

app
  .listen({ host: env.HOST, port: env.PORT })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
