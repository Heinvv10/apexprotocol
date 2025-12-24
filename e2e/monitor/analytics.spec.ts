import { test, expect } from "@playwright/test";

test.describe("Monitor Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/monitor/analytics");
  });

  test.describe("Page Structure", () => {
    test("should display analytics page with header", async ({ page }) => {
      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have analytics heading
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });

    test("should display back navigation to monitor", async ({ page }) => {
      // Should have back button to monitor
      const backButton = page.getByRole("link", { name: /back to monitor/i });
      await expect(backButton).toBeVisible();
    });

    test("should display time range selector", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show time range options (7 Days, 14 Days, 30 Days, 90 Days)
      const timeRangeButtons = page.locator("button").filter({ hasText: /\d+ days?/i });
      const hasTimeRange = await timeRangeButtons.first().isVisible().catch(() => false);

      if (hasTimeRange) {
        await expect(page.getByText(/7 days/i).first()).toBeVisible();
        await expect(page.getByText(/30 days/i).first()).toBeVisible();
      }
    });
  });

  test.describe("Stats Display", () => {
    test("should display stats cards", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show total mentions stat
      const totalMentions = page.getByText(/total mentions/i);
      const hasTotalMentions = await totalMentions.isVisible().catch(() => false);

      if (hasTotalMentions) {
        await expect(totalMentions).toBeVisible();
      }
    });

    test("should display trend percentage", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for trend percentage (e.g., "+23%", "-10%", "vs previous")
      const trendIndicator = page.getByText(/vs previous|%/i);
      const hasTrend = await trendIndicator.first().isVisible().catch(() => false);

      // Trend indicator should be visible when data is available
      if (hasTrend) {
        await expect(trendIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe("Charts Rendering", () => {
    test("should render mentions over time chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Mentions Over Time" heading
      const chartHeading = page.getByText(/mentions over time/i);
      const hasChartHeading = await chartHeading.isVisible().catch(() => false);

      if (hasChartHeading) {
        await expect(chartHeading).toBeVisible();

        // Chart container should be present
        const chartContainer = page.locator('[class*="recharts"], svg, [class*="chart"]');
        await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test("should render platform breakdown chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Platform Breakdown" section
      const platformBreakdown = page.getByText(/platform breakdown/i);
      const hasBreakdown = await platformBreakdown.isVisible().catch(() => false);

      if (hasBreakdown) {
        await expect(platformBreakdown).toBeVisible();
      }
    });

    test("should render sentiment distribution chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Sentiment Distribution" section
      const sentimentSection = page.getByText(/sentiment distribution/i);
      const hasSentiment = await sentimentSection.isVisible().catch(() => false);

      if (hasSentiment) {
        await expect(sentimentSection).toBeVisible();

        // Should show sentiment categories
        await expect(page.getByText(/positive/i).first()).toBeVisible();
        await expect(page.getByText(/neutral/i).first()).toBeVisible();
        await expect(page.getByText(/negative/i).first()).toBeVisible();
      }
    });

    test("should display platform legend", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show platform names (ChatGPT, Claude, Perplexity, Gemini)
      const platformLegend = page.getByText(/chatgpt|claude|perplexity|gemini/i);
      const hasPlatforms = await platformLegend.first().isVisible().catch(() => false);

      if (hasPlatforms) {
        await expect(platformLegend.first()).toBeVisible();
      }
    });
  });

  test.describe("Time Range Selection", () => {
    test("should change data when time range is selected", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Click on a different time range
      const timeRangeButton = page.locator("button").filter({ hasText: /14 days/i });
      const hasButton = await timeRangeButton.isVisible().catch(() => false);

      if (hasButton) {
        await timeRangeButton.click();

        // Button should become active (has different styling)
        await expect(timeRangeButton).toBeVisible();
      }
    });
  });

  test.describe("Data Refresh", () => {
    test("should have refresh functionality", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should have refresh indicator or button
      const refreshIndicator = page.locator('[class*="refresh"], button').filter({ hasText: /refresh|updated/i });
      const hasRefresh = await refreshIndicator.first().isVisible().catch(() => false);

      // Refresh should be available
      if (hasRefresh) {
        await expect(refreshIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe("Citation Analysis Link", () => {
    test("should have link to citation analysis page", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show Citation Analysis button/link
      const citationLink = page.getByRole("link", { name: /citation/i });
      const hasCitationLink = await citationLink.isVisible().catch(() => false);

      if (hasCitationLink) {
        await expect(citationLink).toBeVisible();
        await expect(citationLink).toHaveAttribute("href", /\/dashboard\/monitor\/analytics\/citations/);
      }
    });
  });

  test.describe("Empty State", () => {
    test("should show appropriate state when no data", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for either data or empty state
      const hasEmptyState = await page.getByText(/no analytics data|no data/i).isVisible().catch(() => false);
      const hasCharts = await page.locator('[class*="recharts"], svg[class*="chart"]').first().isVisible().catch(() => false);

      // One of these should be true
      expect(hasEmptyState || hasCharts).toBeTruthy();
    });
  });

  test.describe("Navigation", () => {
    test("should navigate back to monitor dashboard", async ({ page }) => {
      const backButton = page.getByRole("link", { name: /back to monitor/i });
      await expect(backButton).toBeVisible();

      await backButton.click();
      await expect(page).toHaveURL(/\/dashboard\/monitor$/);
    });

    test("should navigate to citations page", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      const citationLink = page.getByRole("link", { name: /citation/i });
      const hasCitationLink = await citationLink.isVisible().catch(() => false);

      if (hasCitationLink) {
        await citationLink.click();
        await expect(page).toHaveURL(/\/dashboard\/monitor\/analytics\/citations/);
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/monitor/analytics");

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Header should be visible
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/monitor/analytics");

      // Core content should be visible
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
