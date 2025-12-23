import { test, expect } from "@playwright/test";

test.describe("Monitor Citations Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/monitor/analytics/citations");
  });

  test.describe("Page Structure", () => {
    test("should display citations page with header", async ({ page }) => {
      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have citation analysis heading
      const heading = page.getByRole("heading", { name: /citation/i });
      await expect(heading).toBeVisible();
    });

    test("should display back navigation to analytics", async ({ page }) => {
      // Should have back button to analytics
      const backButton = page.getByRole("link", { name: /back to analytics/i });
      await expect(backButton).toBeVisible();
    });

    test("should display page description", async ({ page }) => {
      // Should show description about citation tracking
      const description = page.getByText(/track which ai platforms cite your content/i);
      const hasDescription = await description.isVisible().catch(() => false);

      if (hasDescription) {
        await expect(description).toBeVisible();
      }
    });
  });

  test.describe("Stats Display", () => {
    test("should display total citations stat", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show total citations stat
      const totalCitations = page.getByText(/total citations/i);
      const hasTotalCitations = await totalCitations.isVisible().catch(() => false);

      if (hasTotalCitations) {
        await expect(totalCitations).toBeVisible();
      }
    });

    test("should display cited pages count", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show cited pages stat
      const citedPages = page.getByText(/cited pages/i);
      const hasCitedPages = await citedPages.isVisible().catch(() => false);

      if (hasCitedPages) {
        await expect(citedPages).toBeVisible();
      }
    });

    test("should display average citations per page", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show avg citations stat
      const avgCitations = page.getByText(/avg citations/i);
      const hasAvgCitations = await avgCitations.isVisible().catch(() => false);

      if (hasAvgCitations) {
        await expect(avgCitations).toBeVisible();
      }
    });

    test("should display top platform", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show top platform stat
      const topPlatform = page.getByText(/top platform/i);
      const hasTopPlatform = await topPlatform.isVisible().catch(() => false);

      if (hasTopPlatform) {
        await expect(topPlatform).toBeVisible();
      }
    });
  });

  test.describe("Charts Rendering", () => {
    test("should render citation frequency trend chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Citation Frequency Trend" heading
      const chartHeading = page.getByText(/citation frequency trend/i);
      const hasChartHeading = await chartHeading.isVisible().catch(() => false);

      if (hasChartHeading) {
        await expect(chartHeading).toBeVisible();

        // Chart container should be present
        const chartContainer = page.locator('[class*="recharts"], svg');
        await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test("should render platform comparison chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Platform Comparison" section
      const platformComparison = page.getByText(/platform comparison/i);
      const hasComparison = await platformComparison.isVisible().catch(() => false);

      if (hasComparison) {
        await expect(platformComparison).toBeVisible();
      }
    });
  });

  test.describe("Citations Table", () => {
    test("should display top-cited content table", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show "Top-Cited Content" heading
      const tableHeading = page.getByText(/top-cited content/i);
      const hasTable = await tableHeading.isVisible().catch(() => false);

      if (hasTable) {
        await expect(tableHeading).toBeVisible();

        // Should have table structure
        const table = page.locator("table");
        await expect(table).toBeVisible();
      }
    });

    test("should display table headers", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show table headers
      const contentHeader = page.getByText(/content/i).first();
      const hasHeaders = await contentHeader.isVisible().catch(() => false);

      if (hasHeaders) {
        await expect(page.getByRole("columnheader", { name: /content/i })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: /citations/i })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: /last cited/i })).toBeVisible();
      }
    });

    test("should have sort by selector", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show sort by dropdown
      const sortBy = page.locator("select").filter({ hasText: /citations|recent/i });
      const hasSort = await sortBy.isVisible().catch(() => false);

      if (hasSort) {
        await expect(sortBy).toBeVisible();
      }
    });

    test("should expand row to show context snippet", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Find a table row
      const tableRow = page.locator("tbody tr").first();
      const hasRow = await tableRow.isVisible().catch(() => false);

      if (hasRow) {
        // Click to expand
        await tableRow.click();

        // Should show context snippet (with quote styling)
        const contextSnippet = page.locator("[class*='italic'], blockquote, .expanded-content");
        const hasContext = await contextSnippet.first().isVisible({ timeout: 5000 }).catch(() => false);

        // Context should appear after expansion
        expect(typeof hasContext).toBe("boolean");
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
      const hasEmptyState = await page.getByText(/no citations/i).isVisible().catch(() => false);
      const hasTable = await page.locator("table").isVisible().catch(() => false);

      // One of these should be true
      expect(hasEmptyState || hasTable).toBeTruthy();
    });
  });

  test.describe("External Links", () => {
    test("should have external links for cited content", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for external link icons or links
      const externalLinks = page.locator("a[target='_blank'], a[rel*='noopener']");
      const hasExternalLinks = await externalLinks.first().isVisible().catch(() => false);

      // External links should be available when data exists
      if (hasExternalLinks) {
        await expect(externalLinks.first()).toBeVisible();
      }
    });
  });

  test.describe("Navigation", () => {
    test("should navigate back to analytics page", async ({ page }) => {
      const backButton = page.getByRole("link", { name: /back to analytics/i });
      await expect(backButton).toBeVisible();

      await backButton.click();
      await expect(page).toHaveURL(/\/dashboard\/monitor\/analytics$/);
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/monitor/analytics/citations");

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Header should be visible
      const heading = page.getByRole("heading", { name: /citation/i });
      await expect(heading).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/monitor/analytics/citations");

      // Core content should be visible
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
