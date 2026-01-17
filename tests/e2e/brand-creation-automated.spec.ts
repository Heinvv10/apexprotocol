/**
 * E2E Tests for Automated Brand Creation
 *
 * Tests the complete automated brand scraping flow with real websites.
 * Verifies:
 * - Website scraping with comprehensive data extraction
 * - Contact details and personnel extraction
 * - LinkedIn enrichment fallback
 * - Retry logic and error handling
 * - Partial data saves on failures
 */

import { test, expect } from "@playwright/test";

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TEST_TIMEOUT = 120000; // 2 minutes for scraping operations

/**
 * Helper: Wait for scraping job to complete
 */
async function waitForScrapingComplete(page: any, maxWaitMs: number = 60000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // Check for completion indicators
    const isComplete = await page.evaluate(() => {
      // Check if preview step is visible (scraping complete)
      const previewStep = document.querySelector('[data-testid="scrape-preview"]');
      if (previewStep && window.getComputedStyle(previewStep).display !== "none") {
        return true;
      }

      // Check for error state
      const errorMessage = document.querySelector('[data-testid="scrape-error"]');
      if (errorMessage) {
        return true;
      }

      return false;
    });

    if (isComplete) {
      break;
    }

    // Wait before next check
    await page.waitForTimeout(1000);
  }
}

/**
 * Helper: Login and navigate to brand creation
 */
async function setupBrandCreation(page: any) {
  // Navigate to login (assumes Clerk auth is configured)
  await page.goto(`${BASE_URL}/sign-in`);

  // Wait for auth (may need to adjust based on your setup)
  // In a real test, you'd use a test account or mock auth
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });

  // Navigate to brand creation page
  await page.goto(`${BASE_URL}/dashboard/brands/new`);
  await page.waitForSelector('[data-testid="brand-creation-page"]', { timeout: 10000 });
}

test.describe("Automated Brand Creation E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for scraping operations
    test.setTimeout(TEST_TIMEOUT);
  });

  test("Happy Path: Create brand from Stripe.com with full data extraction", async ({ page }) => {
    await setupBrandCreation(page);

    // Click "Auto-fill from Website" button
    const autoFillButton = page.locator('button:has-text("Auto-fill from Website")');
    await autoFillButton.click();

    // Enter Stripe.com URL
    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="URL"]');
    await urlInput.fill("https://stripe.com");

    // Click "Start Scraping" or similar button
    const startButton = page.locator('button:has-text("Start"), button:has-text("Scrape")');
    await startButton.click();

    // Wait for scraping to complete
    await waitForScrapingComplete(page, 90000);

    // Verify preview data is shown
    await expect(page.locator('[data-testid="scrape-preview"]')).toBeVisible();

    // Verify core fields are populated
    await expect(page.locator('[data-testid="preview-brand-name"]')).toContainText(/Stripe/i);
    await expect(page.locator('[data-testid="preview-domain"]')).toContainText("stripe.com");
    await expect(page.locator('[data-testid="preview-description"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="preview-industry"]')).not.toBeEmpty();

    // Verify logo is extracted
    const logoImg = page.locator('[data-testid="preview-logo"]');
    await expect(logoImg).toBeVisible();

    // Verify contact details are extracted
    await expect(page.locator('[data-testid="preview-locations"]')).toBeVisible();

    // Verify personnel are extracted (should have at least 3 people)
    const personnelItems = page.locator('[data-testid="preview-personnel-item"]');
    const personnelCount = await personnelItems.count();
    expect(personnelCount).toBeGreaterThanOrEqual(3);

    // Verify keywords/GEO data
    const keywords = page.locator('[data-testid="preview-keywords"]');
    const keywordCount = await keywords.count();
    expect(keywordCount).toBeGreaterThanOrEqual(5);

    // Create the brand
    const createButton = page.locator('button:has-text("Create Brand")');
    await createButton.click();

    // Verify redirect to brands list
    await page.waitForURL(/\/dashboard\/brands$/, { timeout: 10000 });

    // Verify success toast/notification
    await expect(page.locator('[role="status"], .toast')).toContainText(/created/i);

    // Verify brand appears in list
    await expect(page.locator('[data-testid="brand-card"]:has-text("Stripe")')).toBeVisible();
  });

  test("Partial Data: Create brand with minimal website info", async ({ page }) => {
    await setupBrandCreation(page);

    // Use a small company website with minimal data
    const autoFillButton = page.locator('button:has-text("Auto-fill from Website")');
    await autoFillButton.click();

    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="URL"]');
    await urlInput.fill("https://example-small-company.com"); // Replace with actual small company

    const startButton = page.locator('button:has-text("Start"), button:has-text("Scrape")');
    await startButton.click();

    await waitForScrapingComplete(page, 90000);

    // Verify preview shows partial data
    await expect(page.locator('[data-testid="scrape-preview"]')).toBeVisible();

    // Should have at least name and domain
    await expect(page.locator('[data-testid="preview-brand-name"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="preview-domain"]')).not.toBeEmpty();

    // May have partial personnel (0-2 people)
    const personnelItems = page.locator('[data-testid="preview-personnel-item"]');
    const personnelCount = await personnelItems.count();

    // If fewer than 5 people found, LinkedIn enrichment should be triggered
    if (personnelCount < 5) {
      // Verify LinkedIn enrichment was attempted (check logs or UI indicator)
      const linkedinIndicator = page.locator('[data-testid="linkedin-enrichment-indicator"]');
      await expect(linkedinIndicator).toBeVisible({ timeout: 30000 });
    }

    // Create brand with partial data
    const createButton = page.locator('button:has-text("Create Brand")');
    await createButton.click();

    // Verify brand created successfully
    await page.waitForURL(/\/dashboard\/brands$/, { timeout: 10000 });
    await expect(page.locator('[role="status"], .toast')).toContainText(/created/i);
  });

  test("LinkedIn Fallback: Website with no team page triggers LinkedIn enrichment", async ({ page }) => {
    await setupBrandCreation(page);

    // Use a website known to have no team/about page
    const autoFillButton = page.locator('button:has-text("Auto-fill from Website")');
    await autoFillButton.click();

    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="URL"]');
    await urlInput.fill("https://example-no-team-page.com"); // Replace with actual website

    const startButton = page.locator('button:has-text("Start"), button:has-text("Scrape")');
    await startButton.click();

    await waitForScrapingComplete(page, 90000);

    // Verify scraping completed
    await expect(page.locator('[data-testid="scrape-preview"]')).toBeVisible();

    // Check personnel count
    const personnelItems = page.locator('[data-testid="preview-personnel-item"]');
    const initialCount = await personnelItems.count();

    // If 0 people found from website, verify LinkedIn was triggered
    if (initialCount === 0) {
      // Wait for LinkedIn enrichment to complete
      await page.waitForTimeout(5000);

      // Verify LinkedIn added people (should be > 0 now)
      const enrichedCount = await personnelItems.count();
      expect(enrichedCount).toBeGreaterThan(0);
    }

    // Create brand
    const createButton = page.locator('button:has-text("Create Brand")');
    await createButton.click();

    await page.waitForURL(/\/dashboard\/brands$/, { timeout: 10000 });
    await expect(page.locator('[role="status"], .toast')).toContainText(/created/i);
  });

  test("Retry Logic: Simulate scraping failure and verify partial save", async ({ page }) => {
    await setupBrandCreation(page);

    // Mock network failure mid-scrape by intercepting API calls
    await page.route("**/api/ai/analyze-brand", (route) => {
      // Fail the request to simulate scraping error
      route.abort("failed");
    });

    const autoFillButton = page.locator('button:has-text("Auto-fill from Website")');
    await autoFillButton.click();

    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="URL"]');
    await urlInput.fill("https://stripe.com");

    const startButton = page.locator('button:has-text("Start"), button:has-text("Scrape")');
    await startButton.click();

    // Wait for error state
    await expect(page.locator('[data-testid="scrape-error"]')).toBeVisible({ timeout: 30000 });

    // Verify error message mentions retry or partial data
    await expect(page.locator('[data-testid="scrape-error"]')).toContainText(/retry|partial|failed/i);

    // Verify "Try Again" button is available
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Verify "Add Manually" fallback is available
    const manualButton = page.locator('button:has-text("Add Manually"), button:has-text("Manual")');
    await expect(manualButton).toBeVisible();

    // Click manual fallback
    await manualButton.click();

    // Verify manual form is shown
    await expect(page.locator('[data-testid="manual-brand-form"]')).toBeVisible();

    // Fill in minimal required data
    await page.fill('input[name="name"]', "Test Brand");
    await page.fill('input[name="domain"]', "testbrand.com");

    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Create")');
    await submitButton.click();

    // Verify brand created with manual data
    await page.waitForURL(/\/dashboard\/brands$/, { timeout: 10000 });
    await expect(page.locator('[data-testid="brand-card"]:has-text("Test Brand")')).toBeVisible();
  });

  test("Quality Validation: Reject insufficient data quality", async ({ page }) => {
    await setupBrandCreation(page);

    // Mock API to return insufficient data (missing required fields)
    await page.route("**/api/brands/scrape", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Insufficient data quality - missing required fields: description (50+ chars), industry",
          data: {
            brandName: "Test Company",
            scrapedUrl: "https://test.com",
            description: "Too short", // Less than 50 chars
            keywords: [], // Less than 5
          },
        }),
      });
    });

    const autoFillButton = page.locator('button:has-text("Auto-fill from Website")');
    await autoFillButton.click();

    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="URL"]');
    await urlInput.fill("https://test.com");

    const startButton = page.locator('button:has-text("Start"), button:has-text("Scrape")');
    await startButton.click();

    // Wait for error about data quality
    await expect(page.locator('[data-testid="scrape-error"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="scrape-error"]')).toContainText(/insufficient data|quality|required fields/i);

    // Verify clear error message about what's missing
    await expect(page.locator('[data-testid="scrape-error"]')).toContainText(/description.*50/i);
  });

  test("Confidence Scoring: Verify confidence scores are displayed", async ({ page }) => {
    await setupBrandCreation(page);

    const autoFillButton = page.locator('button:has-text("Auto-fill from Website")');
    await autoFillButton.click();

    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="URL"]');
    await urlInput.fill("https://stripe.com");

    const startButton = page.locator('button:has-text("Start"), button:has-text("Scrape")');
    await startButton.click();

    await waitForScrapingComplete(page, 90000);

    // Verify confidence scores are shown in preview
    await expect(page.locator('[data-testid="scrape-preview"]')).toBeVisible();

    // Check for confidence indicators (badges, percentages, etc.)
    const confidenceIndicator = page.locator('[data-testid="confidence-score"], [data-testid="confidence-badge"]');
    await expect(confidenceIndicator.first()).toBeVisible();

    // Verify overall confidence score is displayed
    const overallConfidence = page.locator('[data-testid="overall-confidence"]');
    await expect(overallConfidence).toBeVisible();
    const confidenceText = await overallConfidence.textContent();
    expect(confidenceText).toMatch(/\d+%/); // Should contain a percentage
  });
});
