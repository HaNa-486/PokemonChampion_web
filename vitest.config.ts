import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    testTimeout: 15000,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/rendered-html.test.mjs", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["lib/**/*.ts", "components/**/*.tsx"],
    },
  },
});
