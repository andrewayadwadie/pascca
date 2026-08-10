// @pascca/config/vitest/base — the shared Vitest configuration every workspace member extends.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
