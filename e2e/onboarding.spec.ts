import { test, expect } from "@playwright/test";

test.describe("Onboarding Wizard", () => {
  test("should complete full onboarding flow and track progress", async ({ page }) => {
    // Navigate to onboarding page
    await page.goto("http://localhost:3000/onboarding");
    
    // Step 1: Welcome screen
    await expect(page.getByText("Welcome to Apex")).toBeVisible();
    await page.getByRole("button", { name: /next/i }).click();
    
    // Step 2: Brand setup
    await expect(page.getByText("Set Up Your Brand")).toBeVisible();
    await page.fill('input[placeholder*="brand name" i]', "Test Wizard Brand");
    await page.fill('input[placeholder*="website" i]', "https://testwizard.com");
    await page.selectOption('select', "Technology");
    await page.getByRole("button", { name: /next/i }).click();
    
    // Step 3: Platform selection
    await expect(page.getByText("Select AI Platforms")).toBeVisible();
    // Platforms should be pre-selected, verify at least one is selected
    const selectedCount = await page.locator('[class*="border-primary"]').count();
    expect(selectedCount).toBeGreaterThan(0);
    await page.getByRole("button", { name: /next/i }).click();
    
    // Step 4: Competitors (optional)
    await expect(page.getByText("Add Competitors")).toBeVisible();
    // Add a competitor
    await page.fill('input[placeholder*="competitor" i]', "Competitor A");
    await page.getByRole("button", { name: /next/i }).click();
    
    // Step 5: Complete screen
    await expect(page.getByText("You're All Set!")).toBeVisible();
    await page.getByRole("button", { name: /get started/i }).click();
    
    // Should redirect to dashboard
    await page.waitForURL("**/dashboard");
    
    // Wait for onboarding status to load
    await page.waitForTimeout(2000);
    
    // Verify progress tracking - should show at least 50% (brand + monitoring)
    const progressText = await page.locator('text=/\d+%/').first().textContent();
    const progressValue = parseInt(progressText || "0");
    expect(progressValue).toBeGreaterThanOrEqual(50);
    
    // Verify brand was created
    await page.goto("http://localhost:3000/dashboard/brands");
    await expect(page.getByText("Test Wizard Brand")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("http://localhost:3000/onboarding");
    
    // Skip welcome
    await page.getByRole("button", { name: /next/i }).click();
    
    // Try to proceed without brand name
    await expect(page.getByRole("button", { name: /next/i })).toBeDisabled();
    
    // Fill brand name
    await page.fill('input[placeholder*="brand name" i]', "Test Brand");
    
    // Next button should be enabled
    await expect(page.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  test("should allow skipping optional steps", async ({ page }) => {
    await page.goto("http://localhost:3000/onboarding");
    
    // Navigate through wizard
    await page.getByRole("button", { name: /next/i }).click();
    
    // Fill only required fields
    await page.fill('input[placeholder*="brand name" i]', "Minimal Brand");
    await page.getByRole("button", { name: /next/i }).click();
    
    // Platform selection (pre-selected)
    await page.getByRole("button", { name: /next/i }).click();
    
    // Skip competitors (empty is ok)
    await page.getByRole("button", { name: /next/i }).click();
    
    // Complete without competitors
    await page.getByRole("button", { name: /get started/i }).click();
    
    // Should still redirect successfully
    await page.waitForURL("**/dashboard");
  });
});
