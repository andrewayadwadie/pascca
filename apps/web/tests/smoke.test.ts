// FR-011: one executing test — proves the runner is wired. Full page rendering needs the Next.js
// dev/build pipeline (exercised in T035's manual verification); this test checks what's
// meaningfully unit-testable in isolation: the message files exist and are valid, empty JSON
// (AR-003 — no user-facing string ships yet).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("apps/web smoke", () => {
  it.each(["en", "ar"])("messages/%s.json parses as an empty object", (locale) => {
    const path = fileURLToPath(new URL(`../src/messages/${locale}.json`, import.meta.url));
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    expect(parsed).toEqual({});
  });
});
