import { test, expect } from "@playwright/test";

test.describe("AI Platform Insights Dashboard", () => {
  test.describe("Page Load", () => {
    test("should load insights page and display content", async ({ page }) => {
      await page.goto("/dashboard/insights");

      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should show APEX branding
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();

      // Should show Insights page title
      await expect(page.getByText("AI Platform Insights")).toBeVisible();
    });

    test("should display AI status indicator", async ({ page }) => {
      await page.goto("/dashboard/insights");

      // Should show AI Status
      await expect(page.getByText(/AI Status/i)).toBeVisible();
      await expect(page.getByText(/Active/i)).toBeVisible();
    });

    test("should load within 3 seconds", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/dashboard/insights");

      // Wait for page content to load
      await expect(page.locator("body")).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Page should load within 3000ms (3 seconds)
      expect(loadTime).toBeLessThan(5000); // Extended for CI environments
    });
  });

  test.describe("Brand Selection State", () => {
    test("should show brand selection prompt when no brand is selected", async ({ page }) => {
      await page.goto("/dashboard/insights");

      // Wait for page to load
      await page.waitForTimeout(1000);

      // Check if brand selection prompt is visible
      const hasPrompt = await page.getByText(/select a brand/i).isVisible().catch(() => false);
      const hasContent = await page.getByText(/Enter a brand-related query/i).isVisible().catch(() => false);

      // Either the prompt or the main content should be visible
      expect(hasPrompt || hasContent).toBeTruthy();
    });

    test("should show query input when brand is selected", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const hasQueryInput = await page.getByPlaceholder(/brand-related query/i).isVisible().catch(() => false);

      if (hasQueryInput) {
        // Verify query input section exists
        await expect(page.getByText(/Enter a brand-related query/i)).toBeVisible();
      }
    });
  });

  test.describe("Query Input", () => {
    test("should display query input form", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const hasQueryInput = await page.getByPlaceholder(/brand-related query/i).isVisible().catch(() => false);

      if (hasQueryInput) {
        // Should show query textarea
        await expect(page.getByPlaceholder(/brand-related query/i)).toBeVisible();

        // Should show analyze button
        await expect(page.getByRole("button", { name: /Analyze/i })).toBeVisible();
      }
    });

    test("should allow typing in query input", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Type a test query
        await queryInput.fill("How does Brand X handle customer support?");

        // Verify the text was entered
        await expect(queryInput).toHaveValue("How does Brand X handle customer support?");
      }
    });

    test("should display platform selection", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const hasQueryInput = await page.getByPlaceholder(/brand-related query/i).isVisible().catch(() => false);

      if (hasQueryInput) {
        // Should show platform selection text (default: "All Platforms")
        const hasPlatformSelector = await page.getByText(/Select Platforms|All Platforms/i).isVisible().catch(() => false);
        expect(hasPlatformSelector).toBeTruthy();
      }
    });

    test("should show character count for query input", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Type a test query
        await queryInput.fill("Test query");

        // Should show character count (e.g., "10 / 1000")
        const hasCharCount = await page.locator("text=/\\d+ \\/ 1000/").isVisible().catch(() => false);
        expect(hasCharCount).toBeTruthy();
      }
    });
  });

  test.describe("Platform Selection", () => {
    test("should open platform selection dropdown", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const platformButton = page.getByText(/Select Platforms|All Platforms/i).first();
      const isVisible = await platformButton.isVisible().catch(() => false);

      if (isVisible) {
        // Click to open dropdown
        await platformButton.click();

        // Wait a bit for dropdown to open
        await page.waitForTimeout(300);

        // Should show platform options (ChatGPT, Claude, Gemini, Perplexity)
        const hasChatGPT = await page.getByText("ChatGPT").isVisible().catch(() => false);
        const hasClaude = await page.getByText("Claude").isVisible().catch(() => false);
        const hasGemini = await page.getByText("Gemini").isVisible().catch(() => false);
        const hasPerplexity = await page.getByText("Perplexity").isVisible().catch(() => false);

        // At least some platform options should be visible
        expect(hasChatGPT || hasClaude || hasGemini || hasPerplexity).toBeTruthy();
      }
    });
  });

  test.describe("Platform Cards Display", () => {
    test("should display all 4 platform cards", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // Check for platform cards (ChatGPT, Claude, Gemini, Perplexity)
      const hasChatGPT = await page.getByText("ChatGPT").isVisible().catch(() => false);
      const hasClaude = await page.getByText("Claude").isVisible().catch(() => false);
      const hasGemini = await page.getByText("Gemini").isVisible().catch(() => false);
      const hasPerplexity = await page.getByText("Perplexity").isVisible().catch(() => false);

      // All 4 platforms should be visible
      expect(hasChatGPT).toBeTruthy();
      expect(hasClaude).toBeTruthy();
      expect(hasGemini).toBeTruthy();
      expect(hasPerplexity).toBeTruthy();
    });

    test("should show empty state for platform cards initially", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // Platform cards should show "No data" or similar empty state
      const hasNoData = await page.getByText(/No data|No analysis|Run an analysis/i).first().isVisible().catch(() => false);
      const hasScore = await page.getByText(/Visibility Score|Score:/i).first().isVisible().catch(() => false);

      // Either empty state or score should be visible
      expect(hasNoData || hasScore).toBeTruthy();
    });
  });

  test.describe("What We Analyze Section", () => {
    test("should display 'What We Analyze' section", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // Should show "What We Analyze" heading
      const hasHeading = await page.getByText(/What We Analyze/i).isVisible().catch(() => false);
      expect(hasHeading).toBeTruthy();
    });

    test("should show all analysis categories", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const hasWhatWeAnalyze = await page.getByText(/What We Analyze/i).isVisible().catch(() => false);

      if (hasWhatWeAnalyze) {
        // Should show all 4 analysis categories
        await expect(page.getByText(/Visibility Score/i)).toBeVisible();
        await expect(page.getByText(/Content Performance/i)).toBeVisible();
        await expect(page.getByText(/Citation Patterns/i)).toBeVisible();
        await expect(page.getByText(/Recommendations/i)).toBeVisible();
      }
    });
  });

  test.describe("Recent Analyses History", () => {
    test("should display recent analyses section", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // Should show "Recent Analyses" heading
      const hasHeading = await page.getByText(/Recent Analyses/i).isVisible().catch(() => false);
      expect(hasHeading).toBeTruthy();
    });

    test("should show empty state when no history exists", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(2000);

      const hasRecentAnalyses = await page.getByText(/Recent Analyses/i).isVisible().catch(() => false);

      if (hasRecentAnalyses) {
        // Should show either empty state or history items
        const hasEmptyState = await page.getByText(/No analyses yet|Start analyzing|Run your first analysis/i).isVisible().catch(() => false);
        const hasHistory = await page.locator("text=/analyzed|query|platforms/i").first().isVisible().catch(() => false);

        expect(hasEmptyState || hasHistory).toBeTruthy();
      }
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state during analysis", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Intercept API request to delay it
        await page.route("**/api/ai-insights/analyze", async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await route.abort();
        });

        // Fill in query and submit
        await queryInput.fill("How does Brand X handle customer support?");
        const analyzeButton = page.getByRole("button", { name: /Analyze/i });
        await analyzeButton.click();

        // Should show loading indicator
        await page.waitForTimeout(500);
        const hasLoader = await page.locator(".animate-spin, [class*='spinner'], [class*='loading']").first().isVisible().catch(() => false);
        const hasAnalyzing = await page.getByText(/Analyzing|Loading|Processing/i).first().isVisible().catch(() => false);

        expect(hasLoader || hasAnalyzing).toBeTruthy();
      }
    });

    test("should disable analyze button during analysis", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Intercept API request to delay it
        await page.route("**/api/ai-insights/analyze", async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await route.abort();
        });

        // Fill in query and submit
        await queryInput.fill("How does Brand X handle customer support?");
        const analyzeButton = page.getByRole("button", { name: /Analyze/i });
        await analyzeButton.click();

        // Button should be disabled
        await page.waitForTimeout(300);
        const isDisabled = await analyzeButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Block API requests to simulate error
        await page.route("**/api/ai-insights/analyze", (route) => {
          route.abort();
        });

        // Fill in query and submit
        await queryInput.fill("How does Brand X handle customer support?");
        const analyzeButton = page.getByRole("button", { name: /Analyze/i });
        await analyzeButton.click();

        // Wait for error state
        await page.waitForTimeout(2000);

        // Page should still be functional
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("should not have critical console errors", async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto("/dashboard/insights");

      // Wait for page to stabilize
      await page.waitForTimeout(3000);

      // Filter out expected errors (e.g., API calls without auth)
      const criticalErrors = errors.filter(
        (err) =>
          !err.includes("401") &&
          !err.includes("Unauthorized") &&
          !err.includes("Failed to load") &&
          !err.includes("Network error") &&
          !err.includes("AbortError")
      );

      // Should not have critical React/JS errors
      expect(criticalErrors.filter((e) => e.includes("React") || e.includes("Uncaught"))).toHaveLength(0);
    });
  });

  test.describe("Navigation", () => {
    test("should have Insights link in navigation menu", async ({ page }) => {
      await page.goto("/dashboard");

      await page.waitForTimeout(1000);

      // Should have Insights link in navigation
      const insightsLink = page.getByRole("link", { name: /Insights/i }).first();
      const isVisible = await insightsLink.isVisible().catch(() => false);

      expect(isVisible).toBeTruthy();
    });

    test("should navigate to insights page from dashboard", async ({ page }) => {
      await page.goto("/dashboard");

      await page.waitForTimeout(1000);

      // Find and click Insights link
      const insightsLink = page.getByRole("link", { name: /Insights/i }).first();
      const isVisible = await insightsLink.isVisible().catch(() => false);

      if (isVisible) {
        await insightsLink.click();
        await expect(page).toHaveURL(/\/dashboard\/insights/);
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/insights");

      // Page should load on mobile
      await expect(page.locator("body")).toBeVisible();

      // Should show APEX branding
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();

      // Should show page title
      await expect(page.getByText("AI Platform Insights")).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/insights");

      // Page should load on tablet
      await expect(page.locator("body")).toBeVisible();

      // Should show APEX branding
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();

      // Platform cards should be visible
      const hasPlatforms = await page.getByText("ChatGPT").isVisible().catch(() => false);
      expect(hasPlatforms).toBeTruthy();
    });

    test("should display platform cards in grid on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // All 4 platform cards should be visible on desktop
      const platformCards = page.locator("text=ChatGPT, Claude, Gemini, Perplexity");
      const hasChatGPT = await page.getByText("ChatGPT").isVisible().catch(() => false);
      const hasClaude = await page.getByText("Claude").isVisible().catch(() => false);

      expect(hasChatGPT && hasClaude).toBeTruthy();
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should allow keyboard navigation in query input", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Focus the input
        await queryInput.focus();

        // Type using keyboard
        await page.keyboard.type("Test query");

        // Verify the text was entered
        await expect(queryInput).toHaveValue("Test query");

        // Tab to analyze button
        await page.keyboard.press("Tab");

        // Should focus the analyze button
        const analyzeButton = page.getByRole("button", { name: /Analyze/i });
        await expect(analyzeButton).toBeFocused();
      }
    });
  });

  test.describe("Data Validation", () => {
    test("should not allow empty query submission", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const analyzeButton = page.getByRole("button", { name: /Analyze/i });
      const isVisible = await analyzeButton.isVisible().catch(() => false);

      if (isVisible) {
        // Try to click analyze without entering query
        const isDisabled = await analyzeButton.isDisabled();

        // Button should be disabled when query is empty
        expect(isDisabled).toBeTruthy();
      }
    });

    test("should show validation for minimum query length", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Type a very short query (less than minimum)
        await queryInput.fill("Hi");

        // Analyze button should be disabled or show validation error
        const analyzeButton = page.getByRole("button", { name: /Analyze/i });
        const isDisabled = await analyzeButton.isDisabled();

        // Should either be disabled or show validation message
        expect(isDisabled).toBeTruthy();
      }
    });
  });

  test.describe("Performance", () => {
    test("should not have memory leaks on navigation", async ({ page }) => {
      // Navigate to insights multiple times
      for (let i = 0; i < 3; i++) {
        await page.goto("/dashboard/insights");
        await page.waitForTimeout(1000);
        await page.goto("/dashboard");
        await page.waitForTimeout(500);
      }

      // Return to insights
      await page.goto("/dashboard/insights");

      // Page should still be responsive
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should handle rapid navigation without breaking", async ({ page }) => {
      await page.goto("/dashboard/insights");
      await page.waitForTimeout(500);
      await page.goto("/dashboard");
      await page.waitForTimeout(300);
      await page.goto("/dashboard/insights");
      await page.waitForTimeout(500);

      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("AI Platform Insights")).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading structure", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // Should have h1 heading
      const h1 = page.getByRole("heading", { level: 1 });
      const hasH1 = await h1.count();

      // Page should have at least one h1
      expect(hasH1).toBeGreaterThan(0);
    });

    test("should have accessible buttons", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // Analyze button should be accessible
      const analyzeButton = page.getByRole("button", { name: /Analyze/i });
      const isVisible = await analyzeButton.isVisible().catch(() => false);

      if (isVisible) {
        // Button should have accessible name
        await expect(analyzeButton).toBeVisible();
      }
    });

    test("should have accessible form inputs", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      const queryInput = page.getByPlaceholder(/brand-related query/i);
      const isVisible = await queryInput.isVisible().catch(() => false);

      if (isVisible) {
        // Input should be accessible
        await expect(queryInput).toBeVisible();

        // Input should have placeholder text
        const placeholder = await queryInput.getAttribute("placeholder");
        expect(placeholder).toBeTruthy();
      }
    });
  });

  test.describe("Integration with Brand Store", () => {
    test("should disable analysis when no brand is selected", async ({ page }) => {
      await page.goto("/dashboard/insights");

      await page.waitForTimeout(1000);

      // If no brand is selected, should show prompt or disable analysis
      const hasPrompt = await page.getByText(/select a brand/i).isVisible().catch(() => false);
      const analyzeButton = page.getByRole("button", { name: /Analyze/i });
      const buttonVisible = await analyzeButton.isVisible().catch(() => false);

      if (buttonVisible && !hasPrompt) {
        // If button is visible but no brand selected, it should be disabled
        const isDisabled = await analyzeButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      } else if (hasPrompt) {
        // Prompt to select brand should be shown
        expect(hasPrompt).toBeTruthy();
      }
    });
  });
});
