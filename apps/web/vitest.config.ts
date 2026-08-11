import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import base from "@pascca/config/vitest/base";

export default mergeConfig(
  base,
  defineConfig({
    // apps/web's tsconfig sets jsx:"preserve" for Next's own SWC compiler (next build/dev).
    // Vitest doesn't go through that compiler, so tests need their own JSX transform —
    // @vitejs/plugin-react, same as apps/admin's vitest config.
    plugins: [react()],
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      environment: "node",
    },
  }),
);
