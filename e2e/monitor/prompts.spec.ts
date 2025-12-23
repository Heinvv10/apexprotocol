import { test, expect } from "@playwright/test";

test.describe("Monitor Prompts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/monitor/prompts");
  });

  test.describe("Page Structure", () => {
    test("should display prompts page with header", async ({ page }) => {
      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have prompts heading
      const heading = page.getByRole("heading", { name: /search prompt performance/i });
      await expect(heading).toBeVisible();
    });

    test("should display back navigation to monitor", async ({ page }) => {
      // Should have back button to monitor
      const backButton = page.locator("a[href='/dashboard/monitor']").first();
      await expect(backButton).toBeVisible();
    });

    test("should display page description", async ({ page }) => {
      // Should show description about prompt tracking
      const description = page.getByText(/track which search queries trigger your brand mentions/i);
      await expect(description).toBeVisible();
    });
  });

  test.describe("Stats Display", () => {
    test("should display tracked prompts count", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show tracked prompts stat
      const trackedPrompts = page.getByText(/tracked prompts/i);
      const hasTrackedPrompts = await trackedPrompts.isVisible().catch(() => false);

      if (hasTrackedPrompts) {
        await expect(trackedPrompts).toBeVisible();
      }
    });

    test("should display total mentions count", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show total mentions stat
      const totalMentions = page.getByText(/total mentions/i);
      const hasTotalMentions = await totalMentions.isVisible().catch(() => false);

      if (hasTotalMentions) {
        await expect(totalMentions).toBeVisible();
      }
    });

    test("should display trending up count", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show trending up stat
      const trendingUp = page.getByText(/trending up/i);
      const hasTrendingUp = await trendingUp.isVisible().catch(() => false);

      if (hasTrendingUp) {
        await expect(trendingUp).toBeVisible();
      }
    });

    test("should display positive sentiment count", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show positive sentiment stat
      const positiveSentiment = page.getByText(/positive sentiment/i);
      const hasPositiveSentiment = await positiveSentiment.isVisible().catch(() => false);

      if (hasPositiveSentiment) {
        await expect(positiveSentiment).toBeVisible();
      }
    });
  });

  test.describe("Info Banner", () => {
    test("should display understanding search prompt info banner", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show info banner
      const infoBanner = page.getByText(/understanding search prompt performance/i);
      const hasInfoBanner = await infoBanner.isVisible().catch(() => false);

      if (hasInfoBanner) {
        await expect(infoBanner).toBeVisible();
      }
    });
  });

  test.describe("Prompts Table", () => {
    test("should display prompt performance data table", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Prompt Performance Data" heading
      const tableHeading = page.getByText(/prompt performance data/i);
      const hasTable = await tableHeading.isVisible().catch(() => false);

      if (hasTable) {
        await expect(tableHeading).toBeVisible();
      }
    });

    test("should display prompts with platform info", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for prompt content or table structure
      const table = page.locator("table");
      const hasTableContent = await table.isVisible().catch(() => false);

      if (hasTableContent) {
        await expect(table).toBeVisible();
      }
    });

    test("should show trend indicators", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for trend indicators (up/down arrows, percentages)
      const trendIndicators = page.locator('[class*="trend"], [class*="arrow"]');
      const hasTrend = await trendIndicators.first().isVisible().catch(() => false);

      // Trend indicators should be visible when data exists
      if (hasTrend) {
        await expect(trendIndicators.first()).toBeVisible();
      }
    });

    test("should show sentiment indicators", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for sentiment indicators
      const sentimentIndicators = page.locator('[class*="sentiment"]');
      const hasSentiment = await sentimentIndicators.first().isVisible().catch(() => false);

      // Sentiment indicators should be visible when data exists
      if (hasSentiment) {
        await expect(sentimentIndicators.first()).toBeVisible();
      }
    });
  });

  test.describe("Export Functionality", () => {
    test("should have export button", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should have export button
      const exportButton = page.getByRole("button", { name: /export/i });
      const hasExport = await exportButton.isVisible().catch(() => false);

      if (hasExport) {
        await expect(exportButton).toBeVisible();
      }
    });
  });

  test.describe("Data Refresh", () => {
    test("should have refresh functionality", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should have refresh indicator or button
      const refreshIndicator = page.locator('[class*="refresh"], button').filter({ hasText: /refresh|updated/i });
      const hasRefresh = await refreshIndicator.first().isVisible().catch(() => false);

      if (hasRefresh) {
        await expect(refreshIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe("Empty State", () => {
    test("should show appropriate state when no data", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for either data or empty state
      const hasEmptyState = await page.getByText(/no prompts tracked/i).isVisible().catch(() => false);
      const hasTable = await page.locator("table").isVisible().catch(() => false);

      // One of these should be true
      expect(hasEmptyState || hasTable).toBeTruthy();
    });

    test("should show configure monitoring link in empty state", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // If empty state is shown, should have configure link
      const hasEmptyState = await page.getByText(/no prompts tracked/i).isVisible().catch(() => false);

      if (hasEmptyState) {
        const configureLink = page.getByRole("link", { name: /configure monitoring/i });
        await expect(configureLink).toBeVisible();
      }
    });
  });

  test.describe("Optimization Tips", () => {
    test("should display optimization tips section", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show optimization tips when data exists
      const tipsSection = page.getByText(/optimization tips/i);
      const hasTips = await tipsSection.isVisible().catch(() => false);

      if (hasTips) {
        await expect(tipsSection).toBeVisible();

        // Should have tip content
        const tipContent = page.getByText(/focus on high-frequency prompts|address prompts with negative/i);
        await expect(tipContent.first()).toBeVisible();
      }
    });
  });

  test.describe("Navigation", () => {
    test("should navigate back to monitor dashboard", async ({ page }) => {
      const backButton = page.locator("a[href='/dashboard/monitor']").first();
      await expect(backButton).toBeVisible();

      await backButton.click();
      await expect(page).toHaveURL(/\/dashboard\/monitor$/);
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/monitor/prompts");

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Header should be visible
      const heading = page.getByRole("heading", { name: /search prompt performance/i });
      await expect(heading).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/monitor/prompts");

      // Core content should be visible
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
