// FR-011: one executing test — proves the runner is wired, not that there's nothing to test.
import { describe, expect, it } from "vitest";
import * as apiClient from "../src/index";

describe("@pascca/api-client", () => {
  it("builds and imports cleanly", () => {
    expect(apiClient).toBeDefined();
  });
});
