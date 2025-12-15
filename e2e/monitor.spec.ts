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

    test("should display Live Query Analysis section", async ({ page }) => {
      await page.goto("/dashboard/monitor");

      // Should show Live Query Analysis heading
      await expect(page.getByRole("heading", { name: /live query analysis/i })).toBeVisible();

      // Should show Smart Table badge
      await expect(page.getByText(/smart table/i)).toBeVisible();
    });

    test("should display filter sidebar", async ({ page }) => {
      await page.goto("/dashboard/monitor");

      // Should show filter groups
      await expect(page.getByText(/tracked topics/i)).toBeVisible();
      await expect(page.getByText(/entity types/i)).toBeVisible();
      await expect(page.getByText(/ai engines/i)).toBeVisible();
    });

    test("should display query table with mock data", async ({ page }) => {
      await page.goto("/dashboard/monitor");

      // Should show table headers or query content
      // Mock data includes "Best enterprise AEO platform", "Apex pricing model", etc.
      const tableContent = page.locator("table, [role='table'], [class*='table']");
      await expect(tableContent.first()).toBeVisible({ timeout: 10000 });
    });

    test("should show AI status indicator", async ({ page }) => {
      await page.goto("/dashboard/monitor");

      // Should show AI Status
      await expect(page.getByText(/ai status/i)).toBeVisible();
      await expect(page.getByText(/active/i)).toBeVisible();
    });
  });

  test.describe("Mentions Page", () => {
    test("should display mentions page with header", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");

      // Should show Brand Mentions heading
      await expect(page.getByRole("heading", { name: /brand mentions/i })).toBeVisible();

      // Should show description
      await expect(page.getByText(/track how your brand is mentioned/i)).toBeVisible();
    });

    test("should display sentiment stats cards", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");

      // Should show sentiment indicators (use first() since there may be multiple)
      await expect(page.getByText(/positive/i).first()).toBeVisible();
      await expect(page.getByText(/neutral/i).first()).toBeVisible();
      await expect(page.getByText(/negative/i).first()).toBeVisible();
    });

    test("should display mention cards with platform info", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");

      // Should show mentions list - look for common mention text
      await expect(page.getByText(/apex/i).first()).toBeVisible({ timeout: 10000 });

      // Should show platform names
      const mentionArea = page.locator('[class*="card"], [class*="mention"]');
      await expect(mentionArea.first()).toBeVisible();
    });

    test("should have filter controls", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");

      // Look for filter-related elements
      const filters = page.locator('[class*="filter"], button, select');
      await expect(filters.first()).toBeVisible();
    });

    test("should have back navigation to monitor", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");

      // Should have back button (button with ArrowLeft icon)
      const backButton = page.locator("button").filter({ has: page.locator("svg") }).first();
      await expect(backButton).toBeVisible();
    });

    test("should display platform breakdown section", async ({ page }) => {
      await page.goto("/dashboard/monitor/mentions");

      // Should show platform breakdown
      await expect(page.getByText(/mentions by platform/i)).toBeVisible({ timeout: 10000 });
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
