// FR-011: one executing test — proves the runner is wired, not that there's nothing to test.
import { describe, expect, it } from "vitest";
import * as types from "../src/index";

describe("@pascca/types", () => {
  it("builds and imports cleanly", () => {
    expect(types).toBeDefined();
  });
});
