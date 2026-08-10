import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import base from "@pascca/config/vitest/base";

export default mergeConfig(
  base,
  defineConfig({
    plugins: [react()],
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      environment: "jsdom",
    },
  }),
);
