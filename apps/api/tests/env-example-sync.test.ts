// FR-008, US2 scenario 4, research R7: the two key lists (schema, .env.example) must be
// identical, in both directions. Drift fails here, naming the specific keys — not discovered
// weeks later as a confusing deployment failure.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { schema } from "../src/config/env.ts";

function readEnvExampleKeys(): string[] {
  // process.cwd(), not import.meta.url — consistent with apps/admin's smoke test fix; Vitest
  // always runs with cwd set to the package root, which is more reliable across environments.
  const path = join(process.cwd(), "..", "..", ".env.example");
  const content = readFileSync(path, "utf-8");

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split("=")[0])
    .filter((key): key is string => Boolean(key));
}

describe(".env.example stays in sync with the env schema (FR-008)", () => {
  it("has no key present in the schema but missing from .env.example", () => {
    const schemaKeys = new Set(Object.keys(schema.shape));
    const exampleKeys = new Set(readEnvExampleKeys());

    const missingFromExample = [...schemaKeys].filter((k) => !exampleKeys.has(k));
    expect(missingFromExample, `schema keys missing from .env.example: ${missingFromExample.join(", ")}`).toEqual([]);
  });

  it("has no key present in .env.example but absent from the schema (stale entry)", () => {
    const schemaKeys = new Set(Object.keys(schema.shape));
    const exampleKeys = new Set(readEnvExampleKeys());

    const staleInExample = [...exampleKeys].filter((k) => !schemaKeys.has(k));
    expect(staleInExample, `.env.example keys not in the schema: ${staleInExample.join(", ")}`).toEqual([]);
  });
});
