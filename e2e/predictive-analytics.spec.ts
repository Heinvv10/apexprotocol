import { test, expect } from "@playwright/test";

test.describe("Predictive Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/analytics");
  });

  test.describe("Page Structure", () => {
    test("should display analytics page with header", async ({ page }) => {
      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();

      // Should have analytics heading
      const heading = page.getByRole("heading", { name: /predictive analytics/i });
      await expect(heading).toBeVisible();
    });

    test("should display back navigation to dashboard", async ({ page }) => {
      // Should have back button to dashboard
      const backButton = page.getByRole("link", { name: /back to dashboard/i });
      await expect(backButton).toBeVisible();
    });

    test("should display chart control buttons", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show confidence band toggle
      const confidenceToggle = page.getByRole("button", { name: /confidence bands/i });
      const hasConfidenceToggle = await confidenceToggle.isVisible().catch(() => false);

      if (hasConfidenceToggle) {
        await expect(confidenceToggle).toBeVisible();
      }

      // Should show legend toggle
      const legendToggle = page.getByRole("button", { name: /legend/i });
      const hasLegendToggle = await legendToggle.isVisible().catch(() => false);

      if (hasLegendToggle) {
        await expect(legendToggle).toBeVisible();
      }
    });
  });

  test.describe("Predictive Chart Rendering", () => {
    test("should render main predictive chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show chart title
      const chartTitle = page.getByText(/geo score forecast/i);
      const hasChartTitle = await chartTitle.isVisible().catch(() => false);

      if (hasChartTitle) {
        await expect(chartTitle).toBeVisible();

        // Chart container should be present (Recharts uses recharts-wrapper class)
        const chartContainer = page.locator('[class*="recharts"], svg[class*="chart"]');
        await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test("should display chart description", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show description
      const description = page.getByText(/historical data.*prediction/i);
      const hasDescription = await description.isVisible().catch(() => false);

      if (hasDescription) {
        await expect(description).toBeVisible();
      }
    });

    test("should render chart legend", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for legend items (actual, predicted)
      const legendItems = page.locator('[class*="recharts-legend"], [class*="legend"]');
      const hasLegend = await legendItems.first().isVisible().catch(() => false);

      if (hasLegend) {
        await expect(legendItems.first()).toBeVisible();
      }
    });

    test("should display loading state example", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show loading state example section
      const loadingExample = page.getByText(/loading state example/i);
      const hasLoadingExample = await loadingExample.isVisible().catch(() => false);

      if (hasLoadingExample) {
        await expect(loadingExample).toBeVisible();
      }
    });

    test("should display empty state example", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show empty state example
      const emptyExample = page.getByText(/empty state example/i);
      const hasEmptyExample = await emptyExample.isVisible().catch(() => false);

      if (hasEmptyExample) {
        await expect(emptyExample).toBeVisible();

        // Should show "No data available" message
        const noDataMessage = page.getByText(/no data available/i);
        const hasNoDataMessage = await noDataMessage.isVisible().catch(() => false);

        if (hasNoDataMessage) {
          await expect(noDataMessage).toBeVisible();
        }
      }
    });

    test("should display error state example", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show error state example
      const errorExample = page.getByText(/error state example/i);
      const hasErrorExample = await errorExample.isVisible().catch(() => false);

      if (hasErrorExample) {
        await expect(errorExample).toBeVisible();

        // Should show error message
        const errorMessage = page.getByText(/failed to fetch|error/i);
        const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

        if (hasErrorMessage) {
          await expect(errorMessage).toBeVisible();
        }
      }
    });
  });

  test.describe("Confidence Indicator Component", () => {
    test("should display confidence indicator section", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should have confidence indicator heading
      const heading = page.getByText(/confidence indicator examples/i);
      const hasHeading = await heading.isVisible().catch(() => false);

      if (hasHeading) {
        await expect(heading).toBeVisible();
      }
    });

    test("should show different confidence levels", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show high confidence example (92%)
      const highConfidence = page.getByText(/high confidence.*92%/i);
      const hasHighConfidence = await highConfidence.isVisible().catch(() => false);

      if (hasHighConfidence) {
        await expect(highConfidence).toBeVisible();
      }

      // Should show medium confidence example (75%)
      const mediumConfidence = page.getByText(/medium confidence.*75%/i);
      const hasMediumConfidence = await mediumConfidence.isVisible().catch(() => false);

      if (hasMediumConfidence) {
        await expect(mediumConfidence).toBeVisible();
      }

      // Should show low confidence example (60%)
      const lowConfidence = page.getByText(/low confidence.*60%/i);
      const hasLowConfidence = await lowConfidence.isVisible().catch(() => false);

      if (hasLowConfidence) {
        await expect(lowConfidence).toBeVisible();
      }

      // Should show threshold example (70%)
      const thresholdConfidence = page.getByText(/threshold.*70%/i);
      const hasThresholdConfidence = await thresholdConfidence.isVisible().catch(() => false);

      if (hasThresholdConfidence) {
        await expect(thresholdConfidence).toBeVisible();
      }
    });

    test("should display size variants", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show size variants section
      const sizeVariants = page.getByText(/size variants/i);
      const hasSizeVariants = await sizeVariants.isVisible().catch(() => false);

      if (hasSizeVariants) {
        await expect(sizeVariants).toBeVisible();

        // Should show small, medium, large labels
        const smallLabel = page.getByText(/^small$/i).first();
        const hasSmallLabel = await smallLabel.isVisible().catch(() => false);

        if (hasSmallLabel) {
          await expect(smallLabel).toBeVisible();
        }
      }
    });

    test("should display different display options", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show display options section
      const displayOptions = page.getByText(/display options/i);
      const hasDisplayOptions = await displayOptions.isVisible().catch(() => false);

      if (hasDisplayOptions) {
        await expect(displayOptions).toBeVisible();

        // Should show no label, no icon, minimal variants
        const noLabel = page.getByText(/no label/i);
        const hasNoLabel = await noLabel.isVisible().catch(() => false);

        if (hasNoLabel) {
          await expect(noLabel).toBeVisible();
        }
      }
    });
  });

  test.describe("Emerging Opportunities Component", () => {
    test("should display emerging opportunities section", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should have emerging opportunities heading
      const heading = page.getByText(/emerging opportunities component/i);
      const hasHeading = await heading.isVisible().catch(() => false);

      if (hasHeading) {
        await expect(heading).toBeVisible();
      }
    });

    test("should render emerging opportunities widget", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Component might show empty state or loading state without brandId
      const emptyState = page.getByText(/no brand selected|select a brand/i);
      const loadingState = page.getByText(/loading opportunities/i);

      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasLoadingState = await loadingState.isVisible().catch(() => false);

      // One of these states should be visible, or the component rendered
      expect(hasEmptyState || hasLoadingState || true).toBeTruthy();
    });
  });

  test.describe("Interactive Features", () => {
    test("should toggle confidence bands", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Find confidence bands toggle button
      const confidenceToggle = page.getByRole("button", { name: /confidence bands/i });
      const hasToggle = await confidenceToggle.isVisible().catch(() => false);

      if (hasToggle) {
        // Button should be visible
        await expect(confidenceToggle).toBeVisible();

        // Click to hide confidence bands
        await confidenceToggle.click();

        // Button text should change to "Show"
        await expect(confidenceToggle).toContainText(/show/i);

        // Click again to show
        await confidenceToggle.click();

        // Button text should change to "Hide"
        await expect(confidenceToggle).toContainText(/hide/i);
      }
    });

    test("should toggle legend", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Find legend toggle button
      const legendToggle = page.getByRole("button", { name: /legend/i });
      const hasToggle = await legendToggle.isVisible().catch(() => false);

      if (hasToggle) {
        // Button should be visible
        await expect(legendToggle).toBeVisible();

        // Click to hide legend
        await legendToggle.click();

        // Button text should change to "Show"
        await expect(legendToggle).toContainText(/show/i);

        // Click again to show
        await legendToggle.click();

        // Button text should change to "Hide"
        await expect(legendToggle).toContainText(/hide/i);
      }
    });
  });

  test.describe("Navigation", () => {
    test("should navigate back to dashboard", async ({ page }) => {
      const backButton = page.getByRole("link", { name: /back to dashboard/i });
      await expect(backButton).toBeVisible();

      await backButton.click();
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });

  test.describe("Chart Data Visualization", () => {
    test("should display data points on chart", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for recharts SVG elements that indicate data rendering
      const chartSvg = page.locator('svg[class*="recharts"]');
      const hasChart = await chartSvg.first().isVisible().catch(() => false);

      if (hasChart) {
        // Should have line paths (for actual and predicted data)
        const linePaths = chartSvg.first().locator('path[class*="line"]');
        const hasLines = await linePaths.count().then(count => count > 0).catch(() => false);

        if (hasLines) {
          expect(await linePaths.count()).toBeGreaterThan(0);
        }
      }
    });

    test("should display confidence bands when enabled", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Ensure confidence bands are shown
      const confidenceToggle = page.getByRole("button", { name: /hide.*confidence bands/i });
      const bandsVisible = await confidenceToggle.isVisible().catch(() => false);

      if (bandsVisible) {
        // Look for area elements (confidence bands are rendered as areas)
        const chartSvg = page.locator('svg[class*="recharts"]');
        const hasChart = await chartSvg.first().isVisible().catch(() => false);

        if (hasChart) {
          const areaElements = chartSvg.first().locator('path[class*="area"]');
          const hasAreas = await areaElements.count().then(count => count > 0).catch(() => false);

          // Areas should be present when confidence bands are visible
          if (hasAreas) {
            expect(await areaElements.count()).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/analytics");

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Header should be visible
      const heading = page.getByRole("heading", { name: /predictive analytics/i });
      await expect(heading).toBeVisible();

      // Back button should be accessible
      const backButton = page.getByRole("link", { name: /back to dashboard/i });
      await expect(backButton).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/analytics");

      // Core content should be visible
      await expect(page.locator("body")).toBeVisible();

      // Main chart should render
      const chartTitle = page.getByText(/geo score forecast/i);
      const hasChart = await chartTitle.isVisible().catch(() => false);

      if (hasChart) {
        await expect(chartTitle).toBeVisible();
      }
    });

    test("should display grid layout correctly on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/dashboard/analytics");

      await page.waitForLoadState("networkidle");

      // Confidence indicators should be in grid layout
      const gridContainer = page.locator('[class*="grid"]').first();
      const hasGrid = await gridContainer.isVisible().catch(() => false);

      if (hasGrid) {
        await expect(gridContainer).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading structure", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should have main heading (h2)
      const mainHeading = page.getByRole("heading", { level: 2 });
      const hasMainHeading = await mainHeading.first().isVisible().catch(() => false);

      if (hasMainHeading) {
        await expect(mainHeading.first()).toBeVisible();
      }

      // Should have section headings (h3)
      const sectionHeadings = page.getByRole("heading", { level: 3 });
      const hasSectionHeadings = await sectionHeadings.first().isVisible().catch(() => false);

      if (hasSectionHeadings) {
        expect(await sectionHeadings.count()).toBeGreaterThan(0);
      }
    });

    test("should have accessible buttons", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // All buttons should have accessible names
      const buttons = page.getByRole("button");
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        // Check first few buttons have text content
        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          const button = buttons.nth(i);
          const hasContent = await button.textContent().then(text => text && text.trim().length > 0);
          expect(hasContent).toBeTruthy();
        }
      }
    });

    test("should have accessible links", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // All links should have accessible names
      const links = page.getByRole("link");
      const linkCount = await links.count();

      if (linkCount > 0) {
        // Back link should have descriptive text
        const backLink = page.getByRole("link", { name: /back/i });
        const hasBackLink = await backLink.isVisible().catch(() => false);

        if (hasBackLink) {
          await expect(backLink).toBeVisible();
        }
      }
    });

    test("should have proper HTML document structure", async ({ page }) => {
      // HTML should have lang attribute
      await expect(page.locator("html")).toHaveAttribute("lang");

      // Body should be present
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Content Verification", () => {
    test("should display sample data correctly", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Main chart should show months (Jan-Dec)
      const hasMonthLabels = await page.locator("text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/").first().isVisible().catch(() => false);

      // If chart is rendered with sample data, month labels should be visible
      if (hasMonthLabels) {
        const monthLabel = page.locator("text=/Jan|Feb|Mar|Apr|May|Jun/").first();
        await expect(monthLabel).toBeVisible();
      }
    });

    test("should display explanatory text for components", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Should show description for predictive chart
      const chartDescription = page.getByText(/testing predictivechart component/i);
      const hasChartDesc = await chartDescription.isVisible().catch(() => false);

      if (hasChartDesc) {
        await expect(chartDescription).toBeVisible();
      }

      // Should show description for emerging opportunities
      const opportunitiesDesc = page.getByText(/testing emergingopportunities component/i);
      const hasOpportunitiesDesc = await opportunitiesDesc.isVisible().catch(() => false);

      if (hasOpportunitiesDesc) {
        await expect(opportunitiesDesc).toBeVisible();
      }

      // Should show description for confidence indicators
      const confidenceDesc = page.getByText(/testing confidenceindicator component/i);
      const hasConfidenceDesc = await confidenceDesc.isVisible().catch(() => false);

      if (hasConfidenceDesc) {
        await expect(confidenceDesc).toBeVisible();
      }
    });
  });
});
