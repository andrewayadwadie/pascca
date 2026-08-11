// SC-003: a fixture component containing a literal JSX string fails `pnpm --filter @pascca/web
// lint` — exercises the no-restricted-syntax JSXText rule (packages/config/eslint/react.js,
// T013). Runs ESLint programmatically against a throwaway fixture file INSIDE this workspace
// (not an OS tmpdir) so the flat config's own file-matching applies exactly as it does for real
// app source — this stays a fast, isolated test, not a shell-out to the whole lint script.
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const webRoot = fileURLToPath(new URL("../..", import.meta.url));
const fixtureDir = path.join(webRoot, "tests", "lint", "__fixtures__");
const fixtureFile = path.join(fixtureDir, "HardcodedString.tsx");

describe("no-hardcoded-strings lint rule (SC-003)", () => {
  // ESLint's own cold-start (flat config resolution + typescript-eslint parser) routinely takes
  // 4-5s alone; under a monorepo-wide parallel test run (turbo running every workspace's tests
  // at once) that grows past Vitest's 5000ms default. 20s gives real headroom without masking
  // an actual hang.
  it("flags a literal JSX string", async () => {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(fixtureFile, `export function Fixture() {\n  return <span>hi</span>;\n}\n`, "utf-8");

    try {
      const eslint = new ESLint({ cwd: webRoot });
      const results = await eslint.lintFiles([fixtureFile]);
      const messages = results.flatMap((r) => r.messages);
      expect(
        messages.some((m) => m.ruleId === "no-restricted-syntax" && /Hardcoded JSX text/.test(m.message)),
      ).toBe(true);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  }, 20_000);
});
