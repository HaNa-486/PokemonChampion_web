import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Full-catalog jsdom renders can exceed 15s on loaded CI/desktop runners.
    // Keep enough headroom to prevent one timeout's pending user events from
    // contaminating the following test while preserving all assertions.
    testTimeout: 30000,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/rendered-html.test.mjs", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["lib/**/*.ts", "components/**/*.tsx"],
    },
  },
});
