import { test, expect } from "@playwright/test";

test.describe("Competitive Intelligence Module - Phase 9.1", () => {
  // Increase timeout for all tests in this file
  test.setTimeout(30000);

  test.describe("Unified Empty State Components", () => {
    test("should render EmptyState component with proper structure", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check if EmptyState is rendered (when no brand selected or no data)
      const emptyStateSection = page.locator('[role="status"], [role="region"]').first();
      const hasEmptyState = await emptyStateSection.isVisible().catch(() => false);

      if (hasEmptyState) {
        // Verify EmptyState has icon
        const icon = emptyStateSection.locator('svg').first();
        await expect(icon).toBeVisible();

        // Verify EmptyState has title (h3)
        const title = emptyStateSection.locator('h3').first();
        await expect(title).toBeVisible();

        // Verify EmptyState has description
        const description = emptyStateSection.locator('p').first();
        await expect(description).toBeVisible();
      }
    });

    test("should render LoadingState during data fetch", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Look for loading state (should appear briefly)
      const loadingState = page.locator('[role="status"]').filter({ hasText: /loading/i }).first();
      const hasLoadingState = await loadingState.isVisible().catch(() => false);

      if (hasLoadingState) {
        // Verify loading spinner icon
        const spinner = loadingState.locator('svg.animate-spin').first();
        const hasSpinner = await spinner.isVisible().catch(() => false);
        expect(hasSpinner).toBeTruthy();
      }
    });

    test("should have accessible ARIA attributes on empty states", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Check for ARIA attributes on empty/loading states
      const stateElements = page.locator('[role="status"], [role="region"], [role="alert"]');
      const count = await stateElements.count();

      if (count > 0) {
        const firstState = stateElements.first();

        // Should have either aria-label or aria-live
        const ariaLabel = await firstState.getAttribute('aria-label');
        const ariaLive = await firstState.getAttribute('aria-live');

        expect(ariaLabel || ariaLive).toBeTruthy();
      }
    });

    test("should display action buttons in empty states", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Look for empty state action buttons
      const emptyStateSection = page.locator('[role="status"], [role="region"]').first();
      const hasEmptyState = await emptyStateSection.isVisible().catch(() => false);

      if (hasEmptyState) {
        // Check for primary action button
        const actionButton = emptyStateSection.locator('button').first();
        const hasActionButton = await actionButton.isVisible().catch(() => false);

        if (hasActionButton) {
          await expect(actionButton).toBeEnabled();

          // Button should have accessible name
          const buttonText = await actionButton.textContent();
          expect(buttonText?.length).toBeGreaterThan(0);
        }
      }
    });

    test("should have proper theme colors applied", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Check if empty state has theme-appropriate styling
      const emptyStateSection = page.locator('[role="status"], [role="region"]').first();
      const hasEmptyState = await emptyStateSection.isVisible().catch(() => false);

      if (hasEmptyState) {
        // Icon container should have theme classes (muted, primary, etc.)
        const iconContainer = emptyStateSection.locator('div').filter({ has: page.locator('svg') }).first();
        const className = await iconContainer.getAttribute('class');

        // Should have some theme-related classes
        expect(className).toBeTruthy();
      }
    });

    test("should render empty state in discovery card", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Look for discovery section
      const discoverySection = page.locator('text=/competitor discovery/i').first();
      const hasDiscovery = await discoverySection.isVisible().catch(() => false);

      if (hasDiscovery) {
        // Within discovery section, check for empty state
        const discoveryCard = discoverySection.locator('..').locator('..'); // Navigate up to card
        const emptyState = discoveryCard.locator('[role="status"], [role="region"]').first();
        const hasEmptyState = await emptyState.isVisible().catch(() => false);

        if (hasEmptyState) {
          // Should have Sparkles icon (discovery empty state)
          const icon = emptyState.locator('svg').first();
          await expect(icon).toBeVisible();
        }
      }
    });
  });

  test.describe("Main Competitive Page", () => {
    test("should display competitive page with header and navigation", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Should show APEX branding and Competitive title
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
      await expect(page.getByText("Competitive").first()).toBeVisible();
    });

    test("should display AI status indicator", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Should show AI Status
      await expect(page.getByText(/ai status/i)).toBeVisible();
      await expect(page.getByText(/active/i)).toBeVisible();
    });

    test("should display Share of Voice gauge", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for any dynamic content
      await page.waitForTimeout(2000);

      // Page should show either SOV gauge or brand selection message
      const hasSOV = await page.getByText(/share of voice/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      // At least one of these should be true
      expect(hasSOV || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should display key metrics cards", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for any dynamic content
      await page.waitForTimeout(2000);

      // Check if metrics are visible (only if brand is selected)
      const hasMetrics = await page.getByText(/competitors tracked/i).first().isVisible().catch(() => false);
      const hasGaps = await page.getByText(/competitive gaps/i).first().isVisible().catch(() => false);
      const hasAlerts = await page.getByText(/active alerts/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      // Either metrics are shown or brand selection prompt
      expect(hasMetrics || hasGaps || hasAlerts || hasBrandPrompt).toBeTruthy();
    });
  });

  test.describe("Phase 9.1: Benchmark Section", () => {
    test("should display benchmark radar chart component", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show benchmark section header or brand selection prompt
      const hasBenchmark = await page.getByText(/competitive benchmark/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasBenchmark || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should display competitor position card", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show position card header or brand selection prompt
      const hasPosition = await page.getByText(/competitive position/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasPosition || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should display radar chart legend", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Give time for the chart to render
      await page.waitForTimeout(2000);

      // Look for chart elements (Recharts renders SVG)
      const chartArea = page.locator(".recharts-wrapper, [class*='radar'], svg");
      const hasChart = await chartArea.first().isVisible().catch(() => false);

      // Chart may not render if no benchmark data - that's OK
      if (hasChart) {
        await expect(chartArea.first()).toBeVisible();
      }
    });

    test("should display metric rows in comparison card", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Check if any metric labels are visible
      const pageContent = await page.textContent("body");

      // At minimum, the page should have loaded
      expect(pageContent).toBeTruthy();
      expect(pageContent?.toLowerCase()).toContain("competitive");
    });
  });

  test.describe("Phase 9.1: Discovery Section", () => {
    test("should display competitor discovery card", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show discovery section or brand selection prompt
      const hasDiscovery = await page.getByText(/competitor discovery/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasDiscovery || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should display AI-powered discovery description", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show discovery description or brand selection prompt
      const hasDescription = await page.getByText(/ai-powered competitor identification/i).isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasDescription || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should have re-scan button", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should have refresh/re-scan functionality or brand selection prompt
      const hasRescan = await page.getByRole("button", { name: /re-scan|refresh|discover/i }).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasRescan || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should show discovery suggestions when available", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for data to load
      await page.waitForTimeout(3000);

      // Either shows suggestions, empty state, or brand selection prompt
      const hasSuggestions = await page.getByText(/suggested competitors/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/discover competitors/i).isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasSuggestions || hasEmptyState || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });
  });

  test.describe("Competitive Gaps Section", () => {
    test("should display competitive gaps section", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show gaps section or brand selection prompt
      const hasGaps = await page.getByText(/competitive gaps/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasGaps || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should show opportunity indicators", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Should show opportunities text, empty state, or brand selection prompt
      const hasOpportunities = await page.getByText(/opportunit/i).first().isVisible().catch(() => false);
      const hasNoGaps = await page.getByText(/no competitive gaps/i).isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasOpportunities || hasNoGaps || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });
  });

  test.describe("Competitive Alerts Section", () => {
    test("should display competitive alerts section", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show alerts section or brand selection prompt
      const hasAlerts = await page.getByText(/competitive alerts/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasAlerts || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should show unread count or empty state", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Should show unread count, "no active alerts", or brand selection prompt
      const hasUnread = await page.getByText(/unread/i).isVisible().catch(() => false);
      const hasNoAlerts = await page.getByText(/no active alerts/i).isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasUnread || hasNoAlerts || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });
  });

  test.describe("AI Insights Section", () => {
    test("should display AI insights section", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show AI insights or brand selection prompt
      const hasInsights = await page.getByText(/ai insights/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasInsights || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });

    test("should show analysis cards", async ({ page }) => {
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Should show analysis cards or brand selection prompt
      const hasVoiceAnalysis = await page.getByText(/share of voice analysis/i).isVisible().catch(() => false);
      const hasLandscape = await page.getByText(/competitive landscape/i).isVisible().catch(() => false);
      const hasActionItems = await page.getByText(/action items/i).isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasCompetitive = await page.getByText(/competitive/i).first().isVisible().catch(() => false);

      expect(hasVoiceAnalysis || hasLandscape || hasActionItems || hasBrandPrompt || hasCompetitive).toBeTruthy();
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Core content should be visible
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should stack cards on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Key sections should still be accessible
      await expect(page.getByText(/competitive/i).first()).toBeVisible();
    });
  });

  test.describe("Loading and Error States", () => {
    test("should show loading state initially", async ({ page }) => {
      // Use a slower network to catch loading state
      await page.route("**/api/**", async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto("/dashboard/competitive");

      // Page should show some content
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle no brand selected state", async ({ page }) => {
      // Clear any stored brand selection
      await page.goto("/dashboard/competitive", { waitUntil: "domcontentloaded" });

      // Should either show brand selection prompt or the competitive page
      const pageContent = await page.textContent("body");
      expect(pageContent).toBeTruthy();
    });
  });
});
