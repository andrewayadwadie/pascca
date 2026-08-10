// FR-011: one executing test — proves the runner is wired and the app renders without throwing.
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("apps/admin smoke", () => {
  it("renders without throwing", () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it.each(["en", "ar"])("messages/%s.json parses as an empty object", (locale) => {
    // process.cwd(), not import.meta.url — under the jsdom test environment, import.meta.url
    // resolves to a synthetic path rather than this file's real location (verified during
    // implementation). Vitest always runs with cwd set to the package root.
    const path = join(process.cwd(), "src", "messages", `${locale}.json`);
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    expect(parsed).toEqual({});
  });
});
