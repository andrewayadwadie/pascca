import { defineConfig, mergeConfig } from "vitest/config";
import base from "@pascca/config/vitest/base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      environment: "node",
    },
  }),
);
