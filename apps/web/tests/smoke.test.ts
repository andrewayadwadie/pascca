// 004-web-design-system-port: en.json now carries this feature's real Tier-3 UI chrome
// (nav/footer/forms/filters/a11y strings — FR-024). ar.json stays an empty object — Arabic
// content genuinely isn't populated yet (Article 21 [NN], AR-003); `arabicEnabled` (config.ts)
// is what actually keeps the "ar" route from ever rendering it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("apps/web smoke", () => {
  it("messages/en.json parses and carries real UI-chrome namespaces", () => {
    const path = fileURLToPath(new URL("../src/messages/en.json", import.meta.url));
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    for (const namespace of ["nav", "footer", "forms", "filters", "a11y"]) {
      expect(parsed).toHaveProperty(namespace);
    }
  });

  it("messages/ar.json parses as an empty object (Arabic content not populated yet)", () => {
    const path = fileURLToPath(new URL("../src/messages/ar.json", import.meta.url));
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    expect(parsed).toEqual({});
  });
});
