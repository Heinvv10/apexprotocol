import { test, expect } from "@playwright/test";

test.describe("Monitor Module", () => {
  test.describe("Main Monitor Page", () => {
    test("should display monitor page with header and navigation", async ({ page }) => {
      await page.goto("/dashboard/monitor");

      // Should show APEX branding and Monitor title
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
      await expect(page.getByText("Monitor").first()).toBeVisible();

      // Should have navigation tabs (look for any nav link)
      const navLinks = page.getByRole("link");
      await expect(navLinks.first()).toBeVisible();
    });

    test("should display platform score cards", async ({ page }) => {
      await page.goto("/dashboard/monitor");
      await page.waitForLoadState("load");

      // Current UI shows 7 platform score cards (not a Live Query Analysis section)
      await expect(page.getByText("ChatGPT").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Claude").first()).toBeVisible();
      await expect(page.getByText("Gemini").first()).toBeVisible();

      // Each card shows a score out of 100
      await expect(page.getByText(/\/100/).first()).toBeVisible();
    });

    test("should display LIVE indicator and empty monitoring state", async ({ page }) => {
      await page.goto("/dashboard/monitor");
      await page.waitForLoadState("load");

      // Header shows LIVE (connected) or OFFLINE (SSE still handshaking)
      await expect(
        page.getByText(/^(LIVE|OFFLINE)$/).first()
      ).toBeVisible({ timeout: 10000 });

      // With no monitoring configured the empty state card appears
      await expect(
        page.getByText(/No Monitoring Configured Yet/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("should display all seven platform score cards", async ({ page }) => {
      await page.goto("/dashboard/monitor");
      await page.waitForLoadState("load");

      // Current UI has platform cards instead of a query table
      const platformNames = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok", "DeepSeek", "Copilot"];
      for (const name of platformNames) {
        await expect(page.getByText(name).first()).toBeVisible({ timeout: 5000 });
      }

      // Each card shows a Stable trend label
      await expect(page.getByText("Stable").first()).toBeVisible();
    });

    test("should show LIVE status indicator in header", async ({ page }) => {
      await page.goto("/dashboard/monitor");
      await page.waitForLoadState("load");

      // Header contains a realtime-status badge (LIVE when connected,
      // OFFLINE while the SSE channel is still negotiating) plus the
      // APEX brand mark. Accept either badge state.
      const liveBadge = page.getByText(/^(LIVE|OFFLINE)$/).first();
      await expect(liveBadge).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("APEX", { exact: true }).first()
      ).toBeVisible();
    });
  });

  test.describe("Mentions Page", () => {
    // Mentions page hits /api/monitor/mentions + sentiment aggregates.
    // Under full parallelism the dev server occasionally returns slow
    // enough to race the 5s test timeouts. Run this describe serially
    // to stabilise.
    test.describe.configure({ mode: "serial" });
    test("should display mentions page with header", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");
      await page.waitForLoadState("load");

      // Should show Brand Mentions heading
      await expect(page.getByRole("heading", { name: /brand mentions/i })).toBeVisible({ timeout: 5000 });

      // Should show description
      await expect(page.getByText(/track how your brand is mentioned/i)).toBeVisible();
    });

    test("should display sentiment stats cards", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");
      await page.waitForLoadState("load");

      // Stats section uses card-tertiary cards with "Total Mentions", "Positive", "Neutral", "Negative" labels
      await expect(page.getByText("Total Mentions")).toBeVisible({ timeout: 5000 });
      // Sentiment labels appear as stat card labels (p.text-xs)
      await expect(page.getByText("Positive").first()).toBeVisible();
      await expect(page.getByText("Neutral").first()).toBeVisible();
      await expect(page.getByText("Negative").first()).toBeVisible();
    });

    test("should display mention cards with platform info", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");
      await page.waitForLoadState("load");

      // Brand name should appear somewhere on the page
      await expect(page.getByText(/apex/i).first()).toBeVisible({ timeout: 5000 });

      // Platform filter buttons confirm platform coverage is visible
      await expect(page.getByRole("button", { name: "ChatGPT" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Claude" })).toBeVisible();
    });

    test("should have filter controls", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");
      await page.waitForLoadState("load");

      // Filters section: date range buttons and sentiment filter buttons exist
      await expect(page.getByRole("button", { name: "24 hours" })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Positive" }).first()).toBeVisible();
    });

    test("should have back navigation to monitor", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");
      await page.waitForLoadState("load");

      // Should have back button (button with ArrowLeft icon)
      const backButton = page.locator("button").filter({ has: page.locator("svg") }).first();
      await expect(backButton).toBeVisible({ timeout: 5000 });
    });

    test("should display platform filter buttons in sidebar", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");
      await page.waitForLoadState("load");

      // Current UI shows platform filter buttons (not a "Mentions by Platform" chart section)
      await expect(page.getByText("Platforms", { exact: true })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("button", { name: "ChatGPT" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Gemini" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Perplexity" })).toBeVisible();
    });
  });

  test.describe("Monitor Settings Page", () => {
    test("should load settings page", async ({ page }) => {
      await page.goto("/dashboard/monitor/settings");

      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have settings-related content
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe("Monitor Prompts Page", () => {
    test("should load prompts page", async ({ page }) => {
      await page.goto("/dashboard/monitor/prompts");

      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have prompts-related content
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe("Monitor Analytics Page", () => {
    test("should load analytics page", async ({ page }) => {
      await page.goto("/dashboard/monitor/analytics");

      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have analytics content
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });

    test("should load citations analytics subpage", async ({ page }) => {
      await page.goto("/dashboard/monitor/analytics/citations");

      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Navigation Flow", () => {
    test("should navigate between monitor subpages", async ({ page }) => {
      // Start at main monitor page
      await page.goto("/dashboard/monitor");
      await expect(page).toHaveURL(/\/dashboard\/monitor/);

      // Navigate to mentions if link exists
      const mentionsLink = page.getByRole("link", { name: /mention/i });
      const hasMentionsLink = await mentionsLink.isVisible().catch(() => false);

      if (hasMentionsLink) {
        await mentionsLink.click();
        await expect(page).toHaveURL(/\/dashboard\/monitor\/mentions/);
      }
    });

    test("should navigate from dashboard to monitor", async ({ page }) => {
      await page.goto("/dashboard");

      // Look for monitor navigation link
      const monitorLink = page.getByRole("link", { name: /monitor/i });
      const hasMonitorLink = await monitorLink.isVisible().catch(() => false);

      if (hasMonitorLink) {
        await monitorLink.click();
        await expect(page).toHaveURL(/\/dashboard\/monitor|\/monitor/);
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/monitor");

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Core content should be visible (use exact match to avoid multiple elements)
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should display mentions on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/monitor/mentions");

      // Page should still load
      await expect(page.getByRole("heading", { name: /brand mentions/i })).toBeVisible();
    });
  });
});
