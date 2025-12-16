import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["node_modules", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["node_modules", "e2e", "**/*.test.ts", "**/*.test.tsx", "src/components/ui/**"],
    },
    // Use workspace projects for different environments
    environmentMatchGlobs: [
      // API routes use node environment
      ["src/app/api/**/*.test.ts", "node"],
      ["tests/api/**/*.test.ts", "node"],
      // Component tests use jsdom
      ["src/**/*.test.tsx", "jsdom"],
      ["tests/**/*.test.tsx", "jsdom"],
    ],
    // Setup file - handles both environments
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
