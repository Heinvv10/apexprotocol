/**
 * E2E Tests for Admin Audit Logs UI
 * Tests the complete audit logs viewer workflow
 *
 * Protocol: Doc-Driven TDD (RED phase)
 * These tests are expected to FAIL until implementation is complete
 */

import { test, expect } from "@playwright/test";

test.describe("Admin Audit Logs - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set dev mode to bypass auth for E2E tests
    await page.goto("/admin/audit-logs");
  });

  test("should display audit logs table on page load (E2E-1)", async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Verify table exists
    const table = page.locator('[data-testid="audit-logs-table"]');
    await expect(table).toBeVisible();

    // Verify table headers
    await expect(page.locator("text=Timestamp")).toBeVisible();
    await expect(page.locator("text=Actor")).toBeVisible();
    await expect(page.locator("text=Action")).toBeVisible();
    await expect(page.locator("text=Target")).toBeVisible();
    await expect(page.locator("text=Details")).toBeVisible();
    await expect(page.locator("text=IP Address")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
  });

  test("should filter logs by action type (E2E-2.1)", async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click action filter dropdown
    await page.click('[data-testid="filter-action"]');

    // Select "update" action
    await page.click('[data-testid="filter-action-update"]');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify all visible logs show "update" action
    const actionCells = page.locator('[data-testid^="log-action-"]');
    const count = await actionCells.count();

    for (let i = 0; i < count; i++) {
      const text = await actionCells.nth(i).textContent();
      expect(text?.toLowerCase()).toContain("update");
    }

    // Verify filter chip is displayed
    await expect(page.locator('[data-testid="filter-chip-action"]')).toBeVisible();
  });

  test("should filter logs by status (E2E-2.2)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click status filter dropdown
    await page.click('[data-testid="filter-status"]');

    // Select "success" status
    await page.click('[data-testid="filter-status-success"]');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify filter chip is displayed
    await expect(page.locator('[data-testid="filter-chip-status"]')).toBeVisible();

    // Verify status badge colors (success should be green)
    const statusBadges = page.locator('[data-testid^="log-status-"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      const badge = statusBadges.nth(i);
      const text = await badge.textContent();
      expect(text?.toLowerCase()).toContain("success");
    }
  });

  test("should filter logs by date range (E2E-2.3)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Open date range picker
    await page.click('[data-testid="filter-date-range"]');

    // Select "Last 7 days"
    await page.click('[data-testid="filter-date-range-7days"]');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify filter chip is displayed
    await expect(page.locator('[data-testid="filter-chip-date-range"]')).toBeVisible();
  });

  test("should search logs by keyword (E2E-3)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Find search input
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill("john@example.com");

    // Wait for debounced search (300ms + buffer)
    await page.waitForTimeout(500);

    // Verify search results contain the keyword
    const rows = page.locator('[data-testid^="log-row-"]');
    const count = await rows.count();

    expect(count).toBeGreaterThan(0);

    // Verify at least one result contains the search term
    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.toLowerCase().includes("john@example.com")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("should open log details modal (E2E-4)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click on the first log row
    await page.click('[data-testid^="log-row-"]:first-child');

    // Wait for modal to open
    await page.waitForSelector('[data-testid="log-details-modal"]', { timeout: 5000 });

    // Verify modal is visible
    const modal = page.locator('[data-testid="log-details-modal"]');
    await expect(modal).toBeVisible();

    // Verify modal contains key sections
    await expect(page.locator("text=Actor Information")).toBeVisible();
    await expect(page.locator("text=Action Details")).toBeVisible();
    await expect(page.locator("text=Target Information")).toBeVisible();
    await expect(page.locator("text=Request Metadata")).toBeVisible();

    // Verify changes section (if present)
    const changesSection = page.locator('[data-testid="log-changes"]');
    if ((await changesSection.count()) > 0) {
      await expect(changesSection).toBeVisible();
    }

    // Verify related logs section
    await expect(page.locator("text=Related Logs")).toBeVisible();

    // Close modal
    await page.click('[data-testid="close-modal"]');
    await expect(modal).not.toBeVisible();
  });

  test("should export logs to CSV (E2E-5.1)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click export button
    await page.click('[data-testid="export-button"]');

    // Select CSV format
    await page.click('[data-testid="export-format-csv"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent("download");

    // Click confirm export
    await page.click('[data-testid="confirm-export"]');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/apex-audit-logs-\d{4}-\d{2}-\d{2}-\d{6}\.csv/);
  });

  test("should export logs to JSON (E2E-5.2)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click export button
    await page.click('[data-testid="export-button"]');

    // Select JSON format
    await page.click('[data-testid="export-format-json"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent("download");

    // Click confirm export
    await page.click('[data-testid="confirm-export"]');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/apex-audit-logs-\d{4}-\d{2}-\d{2}-\d{6}\.json/);
  });

  test("should show export limit warning for large result sets (E2E-5.3)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click export button
    await page.click('[data-testid="export-button"]');

    // Check if warning is displayed (only if result set > 10,000)
    const warningMessage = page.locator('[data-testid="export-limit-warning"]');

    // If warning exists, verify its content
    if ((await warningMessage.count()) > 0) {
      await expect(warningMessage).toBeVisible();
      await expect(warningMessage).toContainText("10,000");
      await expect(warningMessage).toContainText("filter");
    }
  });

  test("should paginate through results (E2E-6)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Verify pagination controls exist
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();

    // Get first row ID on page 1
    const firstRowPage1 = await page
      .locator('[data-testid^="log-row-"]:first-child')
      .getAttribute("data-testid");

    // Click next page
    await page.click('[data-testid="pagination-next"]');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Get first row ID on page 2
    const firstRowPage2 = await page
      .locator('[data-testid^="log-row-"]:first-child')
      .getAttribute("data-testid");

    // Verify rows are different
    expect(firstRowPage1).not.toBe(firstRowPage2);

    // Click previous page
    await page.click('[data-testid="pagination-prev"]');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Verify we're back to original row
    const firstRowPage1Again = await page
      .locator('[data-testid^="log-row-"]:first-child')
      .getAttribute("data-testid");

    expect(firstRowPage1Again).toBe(firstRowPage1);
  });

  test("should display active filters as chips (E2E-7)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Apply multiple filters
    await page.click('[data-testid="filter-action"]');
    await page.click('[data-testid="filter-action-update"]');

    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="filter-status-success"]');

    // Wait for filters to apply
    await page.waitForTimeout(500);

    // Verify filter chips are displayed
    await expect(page.locator('[data-testid="filter-chip-action"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-chip-status"]')).toBeVisible();

    // Verify chip content
    const actionChip = page.locator('[data-testid="filter-chip-action"]');
    await expect(actionChip).toContainText("update");

    const statusChip = page.locator('[data-testid="filter-chip-status"]');
    await expect(statusChip).toContainText("success");

    // Remove one filter by clicking X on chip
    await page.click('[data-testid="filter-chip-action-remove"]');

    // Wait for filter to be removed
    await page.waitForTimeout(500);

    // Verify action chip is gone
    await expect(page.locator('[data-testid="filter-chip-action"]')).not.toBeVisible();

    // Verify status chip still exists
    await expect(page.locator('[data-testid="filter-chip-status"]')).toBeVisible();
  });

  test("should clear all filters (E2E-8)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Apply multiple filters
    await page.click('[data-testid="filter-action"]');
    await page.click('[data-testid="filter-action-update"]');

    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="filter-status-success"]');

    // Wait for filters to apply
    await page.waitForTimeout(500);

    // Click clear all filters button
    await page.click('[data-testid="clear-all-filters"]');

    // Wait for filters to clear
    await page.waitForTimeout(500);

    // Verify all filter chips are gone
    await expect(page.locator('[data-testid="filter-chip-action"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="filter-chip-status"]')).not.toBeVisible();

    // Verify table shows unfiltered results
    const rows = page.locator('[data-testid^="log-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should show real-time updates notification (E2E-9)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Wait for potential real-time update (5-second polling interval)
    await page.waitForTimeout(6000);

    // Check if update notification appears
    const notification = page.locator('[data-testid="new-logs-notification"]');

    // If notification exists, verify it's clickable
    if ((await notification.count()) > 0) {
      await expect(notification).toBeVisible();
      await notification.click();

      // Wait for table to refresh
      await page.waitForTimeout(500);

      // Verify notification is gone after clicking
      await expect(notification).not.toBeVisible();
    }
  });

  test("should display empty state when no logs match filters (E2E-10)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Apply a search that will return no results
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill("nonexistent_log_entry_xyz123");

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Verify empty state is displayed
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No logs found");

    // Verify suggestion to adjust filters
    await expect(emptyState).toContainText("filter");
  });

  test("should display log status badges with correct colors (E2E-11)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Find status badges
    const successBadges = page.locator('[data-testid^="log-status-"][data-status="success"]');
    const failureBadges = page.locator('[data-testid^="log-status-"][data-status="failure"]');
    const warningBadges = page.locator('[data-testid^="log-status-"][data-status="warning"]');

    // Verify success badges are green
    if ((await successBadges.count()) > 0) {
      const successBadge = successBadges.first();
      await expect(successBadge).toHaveClass(/bg-green/);
    }

    // Verify failure badges are red
    if ((await failureBadges.count()) > 0) {
      const failureBadge = failureBadges.first();
      await expect(failureBadge).toHaveClass(/bg-red/);
    }

    // Verify warning badges are yellow/orange
    if ((await warningBadges.count()) > 0) {
      const warningBadge = warningBadges.first();
      await expect(warningBadge).toHaveClass(/bg-(yellow|orange)/);
    }
  });

  test("should display relative timestamps (E2E-12)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Find timestamp cells
    const timestampCells = page.locator('[data-testid^="log-timestamp-"]');
    const count = await timestampCells.count();

    expect(count).toBeGreaterThan(0);

    // Verify at least one timestamp shows relative format
    let foundRelativeTime = false;
    for (let i = 0; i < count; i++) {
      const text = await timestampCells.nth(i).textContent();
      if (
        text?.includes("ago") ||
        text?.includes("minute") ||
        text?.includes("hour") ||
        text?.includes("day")
      ) {
        foundRelativeTime = true;
        break;
      }
    }
    expect(foundRelativeTime).toBe(true);
  });

  test("should show integrity verification indicator (E2E-13)", async ({ page }) => {
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Click on a log row to open details
    await page.click('[data-testid^="log-row-"]:first-child');

    // Wait for modal to open
    await page.waitForSelector('[data-testid="log-details-modal"]', { timeout: 5000 });

    // Look for integrity hash section
    const integritySection = page.locator('[data-testid="integrity-hash"]');

    if ((await integritySection.count()) > 0) {
      await expect(integritySection).toBeVisible();

      // Verify hash is displayed
      const hashValue = page.locator('[data-testid="integrity-hash-value"]');
      await expect(hashValue).toBeVisible();

      const hashText = await hashValue.textContent();
      expect(hashText).toMatch(/sha256:[a-f0-9]+/);
    }
  });

  test("should handle API errors gracefully (E2E-14)", async ({ page }) => {
    // Intercept API request and return error
    await page.route("**/api/admin/audit-logs", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Internal server error",
        }),
      });
    });

    await page.goto("/admin/audit-logs");

    // Wait for error message to appear
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });

    // Verify error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("error");

    // Verify retry button exists
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test("should show loading state while fetching logs (E2E-15)", async ({ page }) => {
    // Delay the API response to test loading state
    await page.route("**/api/admin/audit-logs", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.continue();
    });

    await page.goto("/admin/audit-logs");

    // Verify loading indicator is shown
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible();

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="audit-logs-table"]', { timeout: 10000 });

    // Verify loading indicator is gone
    await expect(loadingIndicator).not.toBeVisible();
  });
});
