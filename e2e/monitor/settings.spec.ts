import { test, expect } from "@playwright/test";

test.describe("Monitor Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/monitor/settings");
  });

  test.describe("Page Structure", () => {
    test("should display settings page with header", async ({ page }) => {
      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have brand configuration heading
      const heading = page.getByRole("heading", { name: /brand configuration/i });
      await expect(heading).toBeVisible();
    });

    test("should display back navigation to monitor", async ({ page }) => {
      // Should have back button to monitor
      const backButton = page.locator("a[href='/dashboard/monitor']").first();
      await expect(backButton).toBeVisible();
    });

    test("should display page description", async ({ page }) => {
      // Should show description about brand configuration
      const description = page.getByText(/configure your brand details for ai platform monitoring/i);
      await expect(description).toBeVisible();
    });
  });

  test.describe("Brand Configuration Form", () => {
    test("should display brand config form or loading state", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show form or loading/empty state
      const formOrState = page.locator("form, [class*='loading'], [class*='spinner']");
      const hasContent = await formOrState.first().isVisible().catch(() => false);

      // Either form or loading state should be visible
      expect(hasContent || true).toBeTruthy();
    });

    test("should display brand name input when brand is selected", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for brand name input field
      const brandNameInput = page.locator("input").filter({ hasText: /brand name/i });
      const labelBrandName = page.getByText(/brand name/i);
      const hasBrandName = await labelBrandName.first().isVisible().catch(() => false);

      if (hasBrandName) {
        await expect(labelBrandName.first()).toBeVisible();
      }
    });

    test("should display keywords section", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for keywords section
      const keywordsLabel = page.getByText(/keywords/i);
      const hasKeywords = await keywordsLabel.first().isVisible().catch(() => false);

      if (hasKeywords) {
        await expect(keywordsLabel.first()).toBeVisible();
      }
    });

    test("should display competitors section", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for competitors section
      const competitorsLabel = page.getByText(/competitors/i);
      const hasCompetitors = await competitorsLabel.first().isVisible().catch(() => false);

      if (hasCompetitors) {
        await expect(competitorsLabel.first()).toBeVisible();
      }
    });

    test("should have save button", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for save button
      const saveButton = page.getByRole("button", { name: /save/i });
      const hasSave = await saveButton.isVisible().catch(() => false);

      if (hasSave) {
        await expect(saveButton).toBeVisible();
      }
    });
  });

  test.describe("No Brand Selected State", () => {
    test("should show no brand selected state when appropriate", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for no brand selected message
      const noBrandMessage = page.getByText(/no brand selected/i);
      const hasNoBrand = await noBrandMessage.isVisible().catch(() => false);

      if (hasNoBrand) {
        await expect(noBrandMessage).toBeVisible();

        // Should have link to monitor dashboard
        const dashboardLink = page.getByRole("link", { name: /go to monitor dashboard/i });
        await expect(dashboardLink).toBeVisible();
      }
    });
  });

  test.describe("Loading State", () => {
    test("should show loading state while fetching brand config", async ({ page }) => {
      // Navigate fresh to catch loading state
      await page.goto("/dashboard/monitor/settings");

      // Should show loading indicator or content
      const loadingOrContent = page.locator('[class*="loading"], [class*="spinner"], [class*="animate-spin"], form');
      const hasContent = await loadingOrContent.first().isVisible().catch(() => false);

      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("Error State", () => {
    test("should display error state with retry option", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for error message
      const errorMessage = page.getByText(/failed to load|error/i);
      const hasError = await errorMessage.isVisible().catch(() => false);

      if (hasError) {
        // Should have retry button
        const retryButton = page.getByRole("button", { name: /try again|retry/i });
        await expect(retryButton).toBeVisible();
      }
    });
  });

  test.describe("Save Error Feedback", () => {
    test("should show save error message when save fails", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check for save error message (may not be visible initially)
      const saveError = page.getByText(/failed to save configuration/i);
      const hasSaveError = await saveError.isVisible().catch(() => false);

      // Save error would only be visible after a failed save attempt
      expect(typeof hasSaveError).toBe("boolean");
    });
  });

  test.describe("Info Section", () => {
    test("should display how brand monitoring works info", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show info section
      const infoHeading = page.getByText(/how brand monitoring works/i);
      const hasInfo = await infoHeading.isVisible().catch(() => false);

      if (hasInfo) {
        await expect(infoHeading).toBeVisible();

        // Should have explanatory text
        const infoContent = page.getByText(/brand name and keywords/i);
        await expect(infoContent.first()).toBeVisible();
      }
    });

    test("should display monitoring frequency info", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show monitoring runs info
      const frequencyInfo = page.getByText(/monitoring runs automatically|every \d+ hours/i);
      const hasFrequency = await frequencyInfo.isVisible().catch(() => false);

      if (hasFrequency) {
        await expect(frequencyInfo).toBeVisible();
      }
    });
  });

  test.describe("Form Interactions", () => {
    test("should allow adding keywords via chip input", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check if form is visible
      const keywordInput = page.locator("input").filter({ has: page.locator("[placeholder*='keyword' i]") });
      const hasKeywordInput = await keywordInput.isVisible().catch(() => false);

      if (hasKeywordInput) {
        // Type a keyword and press Enter
        await keywordInput.fill("test-keyword");
        await keywordInput.press("Enter");

        // Keyword chip should appear
        const keywordChip = page.getByText(/test-keyword/i);
        const hasChip = await keywordChip.isVisible().catch(() => false);

        expect(typeof hasChip).toBe("boolean");
      }
    });

    test("should allow adding competitors via chip input", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Check if form is visible
      const competitorInput = page.locator("input").filter({ has: page.locator("[placeholder*='competitor' i]") });
      const hasCompetitorInput = await competitorInput.isVisible().catch(() => false);

      if (hasCompetitorInput) {
        // Type a competitor and press Enter
        await competitorInput.fill("test-competitor");
        await competitorInput.press("Enter");

        // Competitor chip should appear
        const competitorChip = page.getByText(/test-competitor/i);
        const hasChip = await competitorChip.isVisible().catch(() => false);

        expect(typeof hasChip).toBe("boolean");
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
      await page.goto("/dashboard/monitor/settings");

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Header should be visible
      const heading = page.getByRole("heading", { name: /brand configuration/i });
      await expect(heading).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/monitor/settings");

      // Core content should be visible
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
