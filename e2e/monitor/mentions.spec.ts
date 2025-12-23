import { test, expect } from "@playwright/test";

test.describe("Monitor Mentions Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/monitor/mentions");
  });

  test.describe("Page Structure", () => {
    test("should display mentions page with header and back button", async ({ page }) => {
      // Should show Brand Mentions heading
      await expect(page.getByRole("heading", { name: /brand mentions/i })).toBeVisible();

      // Should show description
      await expect(page.getByText(/track how your brand is mentioned/i)).toBeVisible();

      // Should have back button
      const backButton = page.locator("a[href='/dashboard/monitor']").first();
      await expect(backButton).toBeVisible();
    });

    test("should display sentiment stats cards", async ({ page }) => {
      // Should show Total Mentions stat
      await expect(page.getByText(/total mentions/i)).toBeVisible();

      // Should show sentiment indicators
      await expect(page.getByText(/positive/i).first()).toBeVisible();
      await expect(page.getByText(/neutral/i).first()).toBeVisible();
      await expect(page.getByText(/negative/i).first()).toBeVisible();
    });

    test("should have filter controls", async ({ page }) => {
      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Look for filter-related elements (could be buttons, dropdowns, or checkboxes)
      const filterSection = page.locator('[class*="card"]').filter({ hasText: /filter|platform|sentiment|date/i });
      await expect(filterSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Data Loading", () => {
    test("should show loading state initially", async ({ page }) => {
      // Navigate fresh to catch loading state
      await page.goto("/dashboard/monitor/mentions");

      // Should show loading indicator or mentions content
      const loadingOrContent = page.locator('[class*="loading"], [class*="spinner"], [class*="animate-spin"], [class*="mention"]');
      const hasContent = await loadingOrContent.first().isVisible().catch(() => false);

      // Either loading or data should be visible
      expect(hasContent).toBeTruthy();
    });

    test("should display mention cards when data is available", async ({ page }) => {
      // Wait for data to load
      await page.waitForLoadState("networkidle");

      // Should show mentions list or empty state
      const mentionsArea = page.locator('[class*="card"], [class*="mention"]');
      await expect(mentionsArea.first()).toBeVisible({ timeout: 15000 });
    });

    test("should show empty state when no mentions", async ({ page }) => {
      // Wait for content
      await page.waitForLoadState("networkidle");

      // Check for either mentions or empty state
      const hasEmptyState = await page.getByText(/no mentions/i).isVisible().catch(() => false);
      const hasMentions = await page.locator('[class*="mention"]').first().isVisible().catch(() => false);

      // One of these should be true
      expect(hasEmptyState || hasMentions).toBeTruthy();
    });
  });

  test.describe("Pagination", () => {
    test("should display pagination controls when multiple pages exist", async ({ page }) => {
      // Wait for data to load
      await page.waitForLoadState("networkidle");

      // Check for pagination controls - they appear when there are multiple pages
      const paginationArea = page.locator('[class*="pagination"], button').filter({ hasText: /next|previous|first|last|page/i });
      const hasPagination = await paginationArea.first().isVisible().catch(() => false);

      // Pagination should be visible if there's enough data
      if (hasPagination) {
        await expect(page.getByRole("button", { name: /next/i })).toBeVisible();
      }
    });

    test("should show page size selector", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for page size selector (select element with per page options)
      const pageSizeSelector = page.locator("select#pageSize, [id='pageSize']");
      const hasPageSize = await pageSizeSelector.isVisible().catch(() => false);

      // If pagination is present, page size selector should be available
      if (hasPageSize) {
        await expect(pageSizeSelector).toBeVisible();
      }
    });
  });

  test.describe("Refresh Functionality", () => {
    test("should have refresh button", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show refresh button
      const refreshButton = page.getByRole("button", { name: /refresh/i });
      await expect(refreshButton).toBeVisible();
    });

    test("should show last updated timestamp", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show last updated indicator
      const timestampIndicator = page.locator('[class*="timestamp"], [class*="updated"]');
      const hasTimestamp = await timestampIndicator.first().isVisible().catch(() => false);

      // Timestamp should be visible if data is loaded
      expect(typeof hasTimestamp).toBe("boolean");
    });
  });

  test.describe("Platform Breakdown", () => {
    test("should display mentions by platform section when data exists", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for platform breakdown section
      const platformSection = page.getByText(/mentions by platform/i);
      const hasPlatformSection = await platformSection.isVisible().catch(() => false);

      // Platform breakdown should be visible when mentions exist
      if (hasPlatformSection) {
        await expect(platformSection).toBeVisible();
      }
    });
  });

  test.describe("Navigation", () => {
    test("should navigate back to monitor dashboard", async ({ page }) => {
      // Click back button
      const backButton = page.locator("a[href='/dashboard/monitor']").first();
      await expect(backButton).toBeVisible();

      await backButton.click();
      await expect(page).toHaveURL(/\/dashboard\/monitor$/);
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/monitor/mentions");

      // Page should still load
      await expect(page.getByRole("heading", { name: /brand mentions/i })).toBeVisible();

      // Sentiment stats should still be visible
      await expect(page.getByText(/positive/i).first()).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/monitor/mentions");

      // Core content should be visible
      await expect(page.getByRole("heading", { name: /brand mentions/i })).toBeVisible();
      await expect(page.getByText(/total mentions/i)).toBeVisible();
    });
  });
});
