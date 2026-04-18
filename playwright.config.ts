import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3011";
const STORAGE_STATE_PATH =
  process.env.STORAGE_STATE_PATH ?? "e2e/.auth/storage-state.json";

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.ts", "tests/e2e/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Mint a Clerk sign-in token + seed the DB before any specs run.
  // See e2e/.auth/auth.setup.ts for the full flow.
  globalSetup: "./e2e/.auth/auth.setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // Every spec starts signed-in by default. Unauth specs can override
    // with `test.use({ storageState: { cookies: [], origins: [] } })`.
    storageState: STORAGE_STATE_PATH,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev -- --port 3011",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
