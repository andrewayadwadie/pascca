import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest/base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/**/*.test.ts"],
    },
  }),
);
