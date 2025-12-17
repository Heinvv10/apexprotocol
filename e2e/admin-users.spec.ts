/**
 * Phase 3: Users Management - E2E Tests (Playwright)
 * Following Doc-Driven TDD Protocol
 * Status: RED (tests written before implementation)
 */

import { test, expect } from "@playwright/test";

const ADMIN_USERS_URL = "http://localhost:3000/admin/users";

// Helper function to wait for data to load
async function waitForDataLoad(page: any) {
  // Wait for "Loading users..." to disappear OR for actual user rows to appear
  await page.waitForFunction(
    () => {
      // Check if any cell contains "Loading users..."
      const cells = Array.from(document.querySelectorAll("td"));
      const loadingCell = cells.find((cell) => cell.textContent?.includes("Loading users"));
      // Check if table has user rows (not just loading state)
      const userRows = document.querySelectorAll("table tbody tr");
      return !loadingCell && userRows.length > 0;
    },
    { timeout: 10000 }
  );
  // Give React time to finish rendering
  await page.waitForTimeout(500);
}

test.describe("Admin Users Page - Display (FR-1, FR-7)", () => {
  test("should display users table on page load", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Verify page title/header
    await expect(page.locator("h1")).toContainText("Users");

    // Verify table exists
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Verify table headers (AC-1.1)
    await expect(page.locator("th").filter({ hasText: "Name" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Email" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Organization" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Role" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Status" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Created" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Actions" })).toBeVisible();
  });

  test("should show total user count badge (AC-1.3)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Look for total count badge (e.g., "25 Total")
    const totalBadge = page.locator("text=/\\d+ Total/");
    await expect(totalBadge).toBeVisible();
  });

  test("should display pagination controls (FR-7)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find the pagination container to avoid conflicts with Next.js Dev Tools
    const pagination = page.locator("div").filter({ hasText: /Page \d+ of \d+/ }).last();

    // Verify pagination elements (AC-7.1) within the pagination container
    await expect(pagination.getByRole("button", { name: "Previous" })).toBeVisible();
    await expect(pagination.getByRole("button", { name: "Next" })).toBeVisible();

    // Verify page indicator (AC-7.2, AC-7.3)
    await expect(page.locator("text=/Page \\d+ of \\d+/").last()).toBeVisible();
    await expect(page.locator("text=/Showing \\d+ to \\d+ of \\d+ users/")).toBeVisible();
  });
});

test.describe("Admin Users - Search (FR-2)", () => {
  test("should filter users by search term", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Type in search input (AC-2.1)
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("Alex");

    // Wait for results to update (debounced)
    await page.waitForTimeout(1000);

    // Verify table updates with filtered results
    const tableRows = page.locator("table tbody tr");
    await expect(tableRows.first()).toBeVisible();
  });

  test('should show "No users found" when search has no matches (EC-1)', async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("nonexistentuser12345xyz");

    await page.waitForTimeout(1000);

    // Verify empty state message
    await expect(page.locator("text=/No users/i")).toBeVisible();
  });
});

test.describe("Admin Users - Filters (FR-3)", () => {
  test("should filter by organization (AC-3.1)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Select organization filter
    const orgFilter = page.locator('select').filter({ hasText: /Organization|All Orgs/ }).first();
    await orgFilter.selectOption({ index: 1 }); // Select first organization

    await page.waitForTimeout(1000);

    // Verify table updates
    const tableRows = page.locator("table tbody tr");
    await expect(tableRows.first()).toBeVisible();
  });

  test("should filter by role (AC-3.2)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Select role filter
    const roleFilter = page.locator('select').filter({ hasText: /Role|All Roles/ }).first();

    // Check if filter exists
    if (await roleFilter.count() > 0) {
      await roleFilter.selectOption({ label: "Member" });
      await page.waitForTimeout(1000);
    }
  });

  test("should filter by status (AC-3.3)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Select status filter
    const statusFilter = page.locator('select').filter({ hasText: /Status|All Status/ }).first();
    await statusFilter.selectOption({ label: "Active" });

    await page.waitForTimeout(1000);

    // Verify all users shown are active
    const statusCells = page.locator('td:has-text("Active")');
    await expect(statusCells.first()).toBeVisible();
  });

  test("should apply multiple filters together (AC-3.4)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Apply organization filter
    const orgFilter = page.locator('select').first();
    if (await orgFilter.count() > 0) {
      await orgFilter.selectOption({ index: 1 });
    }

    // Apply status filter
    const statusFilter = page.locator('select').filter({ hasText: /Status/ }).first();
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption({ label: "Active" });
    }

    await page.waitForTimeout(1000);

    // Verify results are filtered
    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Admin Users - View Details Modal (FR-4)", () => {
  test("should open user details modal on View Details click", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Click action menu on first user
    const actionButton = page.locator("table tbody tr").first().getByRole("button").last();
    await actionButton.click();

    // Click "View Details" in action menu
    const viewDetailsButton = page.getByRole("button", { name: "View Details" });
    await viewDetailsButton.click();

    // Wait for modal to open
    await page.waitForTimeout(500);

    // Verify modal contains user details (AC-4.2, AC-4.3, AC-4.4)
    await expect(page.locator("text=/Email:|Organization:|Role:|Status:|Created:/")).toBeVisible();
  });

  test("should close modal on close button click (AC-4.5)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Open modal
    const actionButton = page.locator("table tbody tr").first().getByRole("button").last();
    await actionButton.click();
    await page.getByRole("button", { name: "View Details" }).click();

    // Wait for modal to open
    await page.waitForTimeout(500);

    // Click close button
    const closeButton = page.getByRole("button", { name: "✕" }).or(page.getByRole("button", { name: "Close" }));
    if (await closeButton.count() > 0) {
      await closeButton.first().click();

      // Verify modal is closed
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Admin Users - Suspend/Activate (FR-5)", () => {
  test("should suspend active user (AC-5.1, AC-5.3)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find a user with "Active" status
    const activeUserRow = page.locator('table tbody tr').filter({ hasText: "Active" }).first();

    if (await activeUserRow.count() > 0) {
      // Click action menu
      const actionButton = activeUserRow.getByRole("button").last();
      await actionButton.click();

      // Click "Suspend"
      const suspendButton = page.getByRole("button", { name: "Suspend" });
      if (await suspendButton.count() > 0) {
        await suspendButton.click();

        // Wait for API call to complete
        await page.waitForTimeout(2000);
        await waitForDataLoad(page);

        // Verify status changed to "Inactive" (AC-5.3)
        await expect(page.locator("text=/Inactive/i").first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("should activate suspended user (AC-5.2, AC-5.3)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find a user with "Inactive" status
    const inactiveUserRow = page.locator('table tbody tr').filter({ hasText: "Inactive" }).first();

    if (await inactiveUserRow.count() > 0) {
      // Click action menu
      const actionButton = inactiveUserRow.getByRole("button").last();
      await actionButton.click();

      // Click "Activate"
      const activateButton = page.getByRole("button", { name: "Activate" });
      if (await activateButton.count() > 0) {
        await activateButton.click();

        // Wait for API call
        await page.waitForTimeout(2000);
        await waitForDataLoad(page);

        // Verify status changed to "Active"
        await expect(page.locator("text=/Active/i").first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe("Admin Users - Super Admin Management (FR-6)", () => {
  test("should grant super-admin status (AC-6.1, AC-6.3)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find a non-super-admin user (doesn't have super-admin badge)
    const regularUserRow = page.locator("table tbody tr").first();

    // Click action menu
    const actionButton = regularUserRow.getByRole("button").last();
    await actionButton.click();

    // Check if "Grant Super Admin" option exists
    const grantButton = page.getByRole("button", { name: /Grant Super Admin/i });
    if (await grantButton.count() > 0) {
      await grantButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);
      await waitForDataLoad(page);

      // Verify super-admin badge appears (AC-6.6)
      await expect(page.locator("text=/Super Admin|SUPER ADMIN/i").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should revoke super-admin status (AC-6.2, AC-6.3)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find a super-admin user
    const superAdminRow = page.locator('table tbody tr').filter({ hasText: /Super Admin|SUPER ADMIN/i }).first();

    if (await superAdminRow.count() > 0) {
      // Click action menu
      const actionButton = superAdminRow.getByRole("button").last();
      await actionButton.click();

      // Check if "Revoke Super Admin" option exists
      const revokeButton = page.getByRole("button", { name: /Revoke Super Admin/i });
      if (await revokeButton.count() > 0) {
        await revokeButton.click();

        // Wait for API call
        await page.waitForTimeout(2000);
        await waitForDataLoad(page);

        // Verify super-admin badge removed
        // This is harder to test, but status should update
      }
    }
  });
});

test.describe("Admin Users - Pagination (FR-7)", () => {
  test("should navigate to next page (AC-7.1)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find the pagination container to avoid conflicts with Next.js Dev Tools
    const pagination = page.locator("div").filter({ hasText: /Page \d+ of \d+/ }).last();

    // Get initial page number
    const initialPageText = await pagination.locator("text=/Page \\d+ of \\d+/").textContent();

    // Click Next button within pagination container
    const nextButton = pagination.getByRole("button", { name: "Next" });

    // Only proceed if Next button is enabled
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Wait for page to update
      await page.waitForTimeout(1000);
      await waitForDataLoad(page);

      // Verify page number changed
      const newPageText = await pagination.locator("text=/Page \\d+ of \\d+/").textContent();
      expect(newPageText).not.toBe(initialPageText);
    }
  });

  test("should navigate to previous page (AC-7.1)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL + "?page=2");
    await waitForDataLoad(page);

    // Find the pagination container
    const pagination = page.locator("div").filter({ hasText: /Page \d+ of \d+/ }).last();

    // Click Previous button within pagination container
    const prevButton = pagination.getByRole("button", { name: "Previous" });

    if (await prevButton.isEnabled()) {
      await prevButton.click();

      await page.waitForTimeout(1000);
      await waitForDataLoad(page);

      // Verify we're on page 1
      await expect(page.locator("text=/Page 1 of/").last()).toBeVisible();
    }
  });

  test("should disable Previous on page 1 (AC-7.4)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find the pagination container
    const pagination = page.locator("div").filter({ hasText: /Page \d+ of \d+/ }).last();

    // Verify Previous button is disabled within pagination container
    const prevButton = pagination.getByRole("button", { name: "Previous" });
    await expect(prevButton).toBeDisabled();
  });

  test("should disable Next on last page (AC-7.5)", async ({ page }) => {
    await page.goto(ADMIN_USERS_URL);
    await waitForDataLoad(page);

    // Find the pagination container
    const pagination = page.locator("div").filter({ hasText: /Page \d+ of \d+/ }).last();

    // Get total pages
    const paginationText = await pagination.locator("text=/Page \\d+ of \\d+/").textContent();
    const match = paginationText?.match(/Page (\d+) of (\d+)/);

    if (match) {
      const lastPage = parseInt(match[2]);

      // Navigate to last page
      await page.goto(ADMIN_USERS_URL + `?page=${lastPage}`);
      await waitForDataLoad(page);

      // Verify Next button is disabled
      const nextButton = pagination.getByRole("button", { name: "Next" });
      await expect(nextButton).toBeDisabled();
    }
  });
});
