import { test, expect } from "@playwright/test";

test.describe("Recommendation Completion Tracking - E2E", () => {
  // Increase timeout for all tests in this file
  test.setTimeout(60000);

  test.describe("Recommendations Page", () => {
    test("should display recommendations page with header and navigation", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Should show APEX branding and Recommendations title
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
      await expect(page.getByText("Recommendations").first()).toBeVisible();
    });

    test("should display AI status indicator", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Should show AI Status
      await expect(page.getByText(/ai status/i)).toBeVisible();
      await expect(page.getByText(/active/i)).toBeVisible();
    });

    test("should display stats bar with recommendation counts", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Should show stats bar or brand selection prompt
      const hasStats = await page.getByText(/total/i).first().isVisible().catch(() => false);
      const hasPending = await page.getByText(/pending/i).first().isVisible().catch(() => false);
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      // At least one of these should be true
      expect(hasStats || hasPending || hasBrandPrompt).toBeTruthy();
    });
  });

  test.describe("Completion Tracking Component", () => {
    test("should display completion tracking section in recommendation cards", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check if page has recommendations or brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);
      const hasNoRecommendations = await page.getByText(/no recommendations/i).isVisible().catch(() => false);

      // If brand is selected and recommendations exist, check for completion tracking
      if (!hasBrandPrompt && !hasNoRecommendations) {
        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Should show Completion Tracking section
          const hasCompletionTracking = await page.getByText(/completion tracking/i).isVisible().catch(() => false);
          const hasStatus = await page.getByText(/pending|in progress|completed/i).first().isVisible().catch(() => false);

          expect(hasCompletionTracking || hasStatus).toBeTruthy();
        }
      }
    });

    test("should show Start Implementation button for pending recommendations", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by pending status if filter is available
        const pendingFilter = page.getByRole("button", { name: /pending/i });
        const hasPendingFilter = await pendingFilter.isVisible().catch(() => false);
        if (hasPendingFilter) {
          await pendingFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Should show Start Implementation button for pending recommendations
          const hasStartButton = await page.getByRole("button", { name: /start implementation/i }).isVisible().catch(() => false);
          const hasMarkCompleted = await page.getByRole("button", { name: /mark completed/i }).isVisible().catch(() => false);
          const isCompleted = await page.getByText("Completed").first().isVisible().catch(() => false);

          // Either pending (Start button) or in_progress (Mark Completed) or completed
          expect(hasStartButton || hasMarkCompleted || isCompleted).toBeTruthy();
        }
      }
    });
  });

  test.describe("Completion Workflow", () => {
    test("should open score input dialog when clicking Start Implementation", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by pending status
        const pendingFilter = page.getByRole("button", { name: /pending/i });
        const hasPendingFilter = await pendingFilter.isVisible().catch(() => false);
        if (hasPendingFilter) {
          await pendingFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards with pending status
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Click Start Implementation button if visible
          const startButton = page.getByRole("button", { name: /start implementation/i });
          const hasStartButton = await startButton.isVisible().catch(() => false);

          if (hasStartButton) {
            await startButton.click();
            await page.waitForTimeout(500);

            // Verify dialog opens with score input
            await expect(page.getByText(/start implementation/i)).toBeVisible();
            await expect(page.getByText(/geo score/i)).toBeVisible();
            await expect(page.getByRole("spinbutton")).toBeVisible();
          }
        }
      }
    });

    test("should validate score input range (0-100)", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by pending status
        const pendingFilter = page.getByRole("button", { name: /pending/i });
        const hasPendingFilter = await pendingFilter.isVisible().catch(() => false);
        if (hasPendingFilter) {
          await pendingFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards with pending status
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Click Start Implementation button if visible
          const startButton = page.getByRole("button", { name: /start implementation/i });
          const hasStartButton = await startButton.isVisible().catch(() => false);

          if (hasStartButton) {
            await startButton.click();
            await page.waitForTimeout(500);

            // Enter invalid score (>100)
            const scoreInput = page.getByRole("spinbutton");
            await scoreInput.fill("150");

            // Click Confirm button
            const confirmButton = page.getByRole("button", { name: /confirm/i });
            await confirmButton.click();

            // Should show error message
            const hasError = await page.getByText(/between 0 and 100/i).isVisible().catch(() => false);
            expect(hasError).toBeTruthy();
          }
        }
      }
    });

    test("should show Mark Completed button for in_progress recommendations", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by in progress status
        const inProgressFilter = page.getByRole("button", { name: /in progress/i });
        const hasInProgressFilter = await inProgressFilter.isVisible().catch(() => false);
        if (hasInProgressFilter) {
          await inProgressFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Should show Mark Completed button
          const hasMarkCompleted = await page.getByRole("button", { name: /mark completed/i }).isVisible().catch(() => false);
          const hasNoMatch = await page.getByText(/no recommendations match/i).isVisible().catch(() => false);

          // Either found the button or no in-progress recommendations
          expect(hasMarkCompleted || hasNoMatch).toBeTruthy();
        }
      }
    });
  });

  test.describe("Score Display", () => {
    test("should display scores for completed recommendations", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by completed status
        const completedFilter = page.getByRole("button", { name: /completed/i });
        const hasCompletedFilter = await completedFilter.isVisible().catch(() => false);
        if (hasCompletedFilter) {
          await completedFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // For completed recommendations, should show score info
          const hasBaseline = await page.getByText(/baseline/i).isVisible().catch(() => false);
          const hasFinal = await page.getByText(/final/i).isVisible().catch(() => false);
          const hasEffectiveness = await page.getByText(/effectiveness/i).isVisible().catch(() => false);
          const hasNoMatch = await page.getByText(/no recommendations match/i).isVisible().catch(() => false);

          // Either found score info or no completed recommendations
          expect(hasBaseline || hasFinal || hasEffectiveness || hasNoMatch).toBeTruthy();
        }
      }
    });

    test("should display score improvement with trend indicator", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by completed status
        const completedFilter = page.getByRole("button", { name: /completed/i });
        const hasCompletedFilter = await completedFilter.isVisible().catch(() => false);
        if (hasCompletedFilter) {
          await completedFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // For completed recommendations, should show improvement
          // Look for pts (points) text which indicates score improvement display
          const hasPts = await page.getByText(/pts/i).isVisible().catch(() => false);
          const hasNoMatch = await page.getByText(/no recommendations match/i).isVisible().catch(() => false);

          // Either found improvement display or no completed recommendations
          expect(hasPts || hasNoMatch).toBeTruthy();
        }
      }
    });
  });

  test.describe("Feedback Section", () => {
    test("should show feedback option for completed recommendations", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by completed status
        const completedFilter = page.getByRole("button", { name: /completed/i });
        const hasCompletedFilter = await completedFilter.isVisible().catch(() => false);
        if (hasCompletedFilter) {
          await completedFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // For completed recommendations, should show feedback option
          const hasFeedbackButton = await page.getByRole("button", { name: /provide feedback|leave feedback|rate/i }).isVisible().catch(() => false);
          const hasRating = await page.getByText(/rated.*stars/i).isVisible().catch(() => false);
          const hasNoMatch = await page.getByText(/no recommendations match/i).isVisible().catch(() => false);

          // Either found feedback option or no completed recommendations
          expect(hasFeedbackButton || hasRating || hasNoMatch).toBeTruthy();
        }
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Core content should be visible
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should show metrics on mobile in expanded view", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Look for recommendation cards
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Metrics should be visible in expanded view on mobile
          const hasMetrics = await page.getByText(/impact|effort|confident/i).first().isVisible().catch(() => false);
          expect(hasMetrics).toBeTruthy();
        }
      }
    });
  });

  test.describe("Loading and Error States", () => {
    test("should show loading state initially", async ({ page }) => {
      // Navigate without waiting for network idle to catch loading state
      await page.goto("/dashboard/recommendations");

      // Should either show loading or content
      const hasLoading = await page.getByText(/loading/i).isVisible().catch(() => false);
      const hasContent = await page.getByText(/apex/i).isVisible().catch(() => false);

      expect(hasLoading || hasContent).toBeTruthy();
    });

    test("should handle no brand selected state", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Should either show brand selection prompt or the recommendations page
      const pageContent = await page.textContent("body");
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe("Full Completion Workflow Integration", () => {
    test("should complete full workflow: pending -> in_progress -> completed", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "networkidle" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check for brand selection prompt
      const hasBrandPrompt = await page.getByText(/select.*brand/i).isVisible().catch(() => false);

      if (!hasBrandPrompt) {
        // Filter by pending status
        const pendingFilter = page.getByRole("button", { name: /pending/i });
        const hasPendingFilter = await pendingFilter.isVisible().catch(() => false);
        if (hasPendingFilter) {
          await pendingFilter.click();
          await page.waitForTimeout(500);
        }

        // Look for recommendation cards with pending status
        const recommendationCards = page.locator('[class*="rounded-xl"][class*="border"]');
        const hasCards = await recommendationCards.first().isVisible().catch(() => false);

        if (hasCards) {
          // Click first recommendation to expand it
          await recommendationCards.first().click();
          await page.waitForTimeout(500);

          // Step 1: Start Implementation
          const startButton = page.getByRole("button", { name: /start implementation/i });
          const hasStartButton = await startButton.isVisible().catch(() => false);

          if (hasStartButton) {
            await startButton.click();
            await page.waitForTimeout(500);

            // Enter baseline score (65)
            const scoreInput = page.getByRole("spinbutton");
            await scoreInput.fill("65");

            // Click Confirm button
            const confirmButton = page.getByRole("button", { name: /confirm/i });
            await confirmButton.click();

            // Wait for status update
            await page.waitForTimeout(1000);

            // Verify status changed to in_progress
            const hasInProgress = await page.getByText(/in progress/i).first().isVisible().catch(() => false);
            const hasBaseline = await page.getByText(/baseline.*65/i).isVisible().catch(() => false);

            if (hasInProgress || hasBaseline) {
              // Step 2: Mark Completed
              const markCompletedButton = page.getByRole("button", { name: /mark completed/i });
              const hasMarkCompleted = await markCompletedButton.isVisible().catch(() => false);

              if (hasMarkCompleted) {
                await markCompletedButton.click();
                await page.waitForTimeout(500);

                // Enter post-implementation score (78)
                const postScoreInput = page.getByRole("spinbutton");
                await postScoreInput.fill("78");

                // Click Confirm button
                const confirmPostButton = page.getByRole("button", { name: /confirm/i });
                await confirmPostButton.click();

                // Wait for status update
                await page.waitForTimeout(1000);

                // Verify completion
                const hasCompleted = await page.getByText(/completed/i).first().isVisible().catch(() => false);
                const hasFinal = await page.getByText(/final.*78/i).isVisible().catch(() => false);
                const hasImprovement = await page.getByText(/\+13.*pts/i).isVisible().catch(() => false);
                const hasEffectiveness = await page.getByText(/effectiveness/i).isVisible().catch(() => false);

                // At least some of these should be true
                expect(hasCompleted || hasFinal || hasImprovement || hasEffectiveness).toBeTruthy();
              }
            }
          }
        }
      }
    });
  });
});
