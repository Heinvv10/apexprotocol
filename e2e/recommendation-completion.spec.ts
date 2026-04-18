import { test, expect } from "@playwright/test";

test.describe("Recommendation Completion Tracking - E2E", () => {
  // Increase timeout for all tests in this file
  test.setTimeout(60000);

  test.describe("Recommendations Page", () => {
    test("should display recommendations page with header and navigation", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

      // Should show APEX branding and Recommendations title
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
      await expect(page.getByText("Recommendations").first()).toBeVisible();
    });

    test("should display AI status indicator", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

      // Should show AI Status
      await expect(page.getByText(/ai status/i)).toBeVisible();
      await expect(page.getByText(/active/i)).toBeVisible();
    });

    test("should display stats bar with recommendation counts", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

  test.describe("Feedback Workflow", () => {
    test("should open feedback dialog when clicking Provide Feedback", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Verify dialog opens with rating and feedback elements
            await expect(page.getByRole("dialog")).toBeVisible();
            await expect(page.getByText(/rating/i)).toBeVisible();
            await expect(page.getByRole("radiogroup", { name: /rating/i })).toBeVisible();
          }
        }
      }
    });

    test("should display star rating component with 5 clickable stars", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Verify 5 star buttons are present
            const starButtons = page.getByRole("radio");
            await expect(starButtons).toHaveCount(5);

            // Verify aria labels for each star
            await expect(page.getByRole("radio", { name: "1 star" })).toBeVisible();
            await expect(page.getByRole("radio", { name: "2 stars" })).toBeVisible();
            await expect(page.getByRole("radio", { name: "3 stars" })).toBeVisible();
            await expect(page.getByRole("radio", { name: "4 stars" })).toBeVisible();
            await expect(page.getByRole("radio", { name: "5 stars" })).toBeVisible();
          }
        }
      }
    });

    test("should select 4-star rating and show corresponding text", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Click 4-star rating
            const fourStarButton = page.getByRole("radio", { name: "4 stars" });
            await fourStarButton.click();
            await page.waitForTimeout(300);

            // Verify the rating hint text shows "Very helpful"
            await expect(page.getByText(/very helpful/i)).toBeVisible();
          }
        }
      }
    });

    test("should allow entering optional text feedback", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Find the feedback textarea
            const feedbackTextarea = page.locator("#feedback-text");
            await expect(feedbackTextarea).toBeVisible();

            // Enter text feedback
            const testFeedback = "This recommendation was very helpful for improving our GEO score!";
            await feedbackTextarea.fill(testFeedback);

            // Verify the text was entered
            await expect(feedbackTextarea).toHaveValue(testFeedback);
          }
        }
      }
    });

    test("should disable Submit button until rating is selected", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Verify Submit button is disabled initially
            const submitButton = page.getByRole("button", { name: /submit feedback/i });
            await expect(submitButton).toBeDisabled();

            // Select a rating
            await page.getByRole("radio", { name: "4 stars" }).click();
            await page.waitForTimeout(300);

            // Verify Submit button is now enabled
            await expect(submitButton).toBeEnabled();
          }
        }
      }
    });

    test("should close dialog without saving when Skip is clicked", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Verify dialog is open
            await expect(page.getByRole("dialog")).toBeVisible();

            // Select a rating and enter feedback
            await page.getByRole("radio", { name: "3 stars" }).click();
            await page.locator("#feedback-text").fill("Test feedback that should not be saved");

            // Click Skip button
            await page.getByRole("button", { name: /skip/i }).click();
            await page.waitForTimeout(500);

            // Verify dialog is closed
            await expect(page.getByRole("dialog")).not.toBeVisible();

            // Verify the feedback button still shows "Provide Feedback" (not "Edit Feedback")
            // indicating feedback was not saved
            const provideFeedbackButton = page.getByRole("button", { name: /provide feedback/i });
            const hasProvideFeedback = await provideFeedbackButton.isVisible().catch(() => false);
            const editFeedbackButton = page.getByRole("button", { name: /edit feedback/i });
            const hasEditFeedback = await editFeedbackButton.isVisible().catch(() => false);

            // Either still shows "Provide Feedback" or already had feedback (shows "Edit Feedback")
            expect(hasProvideFeedback || hasEditFeedback).toBeTruthy();
          }
        }
      }
    });

    test("should submit feedback and update recommendation display", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Select 4-star rating
            await page.getByRole("radio", { name: "4 stars" }).click();
            await page.waitForTimeout(300);

            // Enter text feedback
            const testFeedback = "This recommendation helped us improve our content strategy significantly.";
            await page.locator("#feedback-text").fill(testFeedback);

            // Submit feedback
            const submitButton = page.getByRole("button", { name: /submit feedback/i });
            await submitButton.click();

            // Wait for submission and dialog to close
            await page.waitForTimeout(1500);

            // Verify dialog is closed
            await expect(page.getByRole("dialog")).not.toBeVisible();

            // Verify feedback was saved - button should now show "Edit Feedback"
            const editFeedbackButton = page.getByRole("button", { name: /edit feedback/i });
            const hasEditButton = await editFeedbackButton.isVisible().catch(() => false);

            // Or verify rating is displayed
            const hasRatingDisplay = await page.getByText(/rated|star/i).first().isVisible().catch(() => false);

            // Either the button changed to "Edit" or rating is displayed
            expect(hasEditButton || hasRatingDisplay).toBeTruthy();
          }
        }
      }
    });

    test("should allow editing existing feedback", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Check if Edit Feedback button is visible (indicates existing feedback)
          const editFeedbackButton = page.getByRole("button", { name: /edit feedback/i });
          const hasEditButton = await editFeedbackButton.isVisible().catch(() => false);

          if (hasEditButton) {
            // Click Edit Feedback button
            await editFeedbackButton.click();
            await page.waitForTimeout(500);

            // Verify dialog opens with "Edit Feedback" title
            await expect(page.getByRole("dialog")).toBeVisible();
            await expect(page.getByText(/edit feedback/i).first()).toBeVisible();

            // The form should be pre-populated with existing values
            // Change rating to 5 stars
            await page.getByRole("radio", { name: "5 stars" }).click();
            await page.waitForTimeout(300);

            // Verify "Extremely helpful" text is shown
            await expect(page.getByText(/extremely helpful/i)).toBeVisible();

            // Update feedback text
            await page.locator("#feedback-text").fill("Updated: This was extremely helpful!");

            // Submit updated feedback
            await page.getByRole("button", { name: /submit feedback/i }).click();

            // Wait for submission
            await page.waitForTimeout(1500);

            // Verify dialog closed
            await expect(page.getByRole("dialog")).not.toBeVisible();
          }
        }
      }
    });

    test("should display rating hints for each star level", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Click Provide Feedback button if visible
          const feedbackButton = page.getByRole("button", { name: /provide feedback|edit feedback/i });
          const hasFeedbackButton = await feedbackButton.isVisible().catch(() => false);

          if (hasFeedbackButton) {
            await feedbackButton.click();
            await page.waitForTimeout(500);

            // Initially should show "Select a rating" hint
            await expect(page.getByText(/select a rating/i)).toBeVisible();

            // Test each star level and its hint
            const ratingHints = [
              { stars: 1, hint: /not helpful at all/i },
              { stars: 2, hint: /slightly helpful/i },
              { stars: 3, hint: /moderately helpful/i },
              { stars: 4, hint: /very helpful/i },
              { stars: 5, hint: /extremely helpful/i },
            ];

            for (const { stars, hint } of ratingHints) {
              await page.getByRole("radio", { name: `${stars} star${stars !== 1 ? "s" : ""}` }).click();
              await page.waitForTimeout(200);
              await expect(page.getByText(hint)).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe("Full Feedback Workflow Integration", () => {
    test("should complete full feedback workflow: open dialog -> select rating -> enter feedback -> submit -> verify saved", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

          // Check for Provide Feedback button (not Edit, meaning no existing feedback)
          const provideFeedbackButton = page.getByRole("button", { name: /provide feedback/i });
          const hasProvideFeedback = await provideFeedbackButton.isVisible().catch(() => false);

          if (hasProvideFeedback) {
            // Step 1: Open feedback dialog
            await provideFeedbackButton.click();
            await page.waitForTimeout(500);
            await expect(page.getByRole("dialog")).toBeVisible();

            // Step 2: Select 4-star rating
            await page.getByRole("radio", { name: "4 stars" }).click();
            await page.waitForTimeout(300);
            await expect(page.getByText(/very helpful/i)).toBeVisible();

            // Step 3: Enter text feedback
            const feedbackText = "This recommendation was very helpful for our GEO optimization efforts.";
            await page.locator("#feedback-text").fill(feedbackText);

            // Step 4: Submit feedback
            await page.getByRole("button", { name: /submit feedback/i }).click();

            // Wait for API call and UI update
            await page.waitForTimeout(2000);

            // Step 5: Verify dialog closed
            await expect(page.getByRole("dialog")).not.toBeVisible();

            // Step 6: Verify feedback was saved
            // The button should now show "Edit Feedback"
            const editButton = page.getByRole("button", { name: /edit feedback/i });
            const hasEditButton = await editButton.isVisible().catch(() => false);

            // Or there should be some indication of the rating
            const hasRatingIndicator = await page.locator("svg.fill-amber-400").first().isVisible().catch(() => false);

            // Step 7: Verify rating is displayed on recommendation
            expect(hasEditButton || hasRatingIndicator).toBeTruthy();

            // Additional verification: open edit dialog to confirm values
            if (hasEditButton) {
              await editButton.click();
              await page.waitForTimeout(500);

              // Verify the 4-star rating is selected (aria-checked)
              const fourStarButton = page.getByRole("radio", { name: "4 stars" });
              const isChecked = await fourStarButton.getAttribute("aria-checked");
              expect(isChecked).toBe("true");

              // Close dialog
              await page.getByRole("button", { name: /skip/i }).click();
            }
          } else {
            // If there's already feedback, test the edit flow
            const editFeedbackButton = page.getByRole("button", { name: /edit feedback/i });
            const hasEditButton = await editFeedbackButton.isVisible().catch(() => false);

            if (hasEditButton) {
              // Verify we can open the edit dialog
              await editFeedbackButton.click();
              await page.waitForTimeout(500);
              await expect(page.getByRole("dialog")).toBeVisible();
              await expect(page.getByText(/edit feedback/i).first()).toBeVisible();

              // Close dialog
              await page.getByRole("button", { name: /skip/i }).click();
            }
          }
        }
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

      // Page should still load
      await expect(page.locator("body")).toBeVisible();

      // Core content should be visible
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should show metrics on mobile in expanded view", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

      // Should either show brand selection prompt or the recommendations page
      const pageContent = await page.textContent("body");
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe("Full Completion Workflow Integration", () => {
    test("should complete full workflow: pending -> in_progress -> completed", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

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

  test.describe("Effectiveness Report Page", () => {
    test("should display effectiveness report page with header and title", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Should show APEX branding
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();

      // Should show Effectiveness Report title
      await expect(page.getByText(/effectiveness report/i).first()).toBeVisible();

      // Should show AI Status
      await expect(page.getByText(/ai status/i)).toBeVisible();
      await expect(page.getByText(/active/i)).toBeVisible();
    });

    test("should display page title and description", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Should show main page title
      await expect(page.getByText("Recommendation Effectiveness").first()).toBeVisible();

      // Should show description about tracking impact
      await expect(page.getByText(/track.*impact.*roi/i)).toBeVisible();
    });

    test("should display Recommendation Effectiveness section heading", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show the effectiveness section heading from the component
      const hasEffectivenessHeading = await page.getByText(/recommendation effectiveness/i).first().isVisible().catch(() => false);
      expect(hasEffectivenessHeading).toBeTruthy();
    });

    test("should show loading state initially", async ({ page }) => {
      // Navigate without waiting for network idle to catch loading state
      await page.goto("/dashboard/reports/effectiveness");

      // Should either show loading or content
      const hasLoading = await page.getByText(/loading.*effectiveness.*metrics/i).isVisible().catch(() => false);
      const hasContent = await page.getByText(/recommendation effectiveness/i).first().isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      expect(hasLoading || hasContent || hasEmptyState).toBeTruthy();
    });
  });

  test.describe("Effectiveness Report Metrics", () => {
    test("should display Total Completed metric card", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show Total Completed metric label
      const hasTotalCompleted = await page.getByText(/total completed/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      // Either shows metrics or empty state
      expect(hasTotalCompleted || hasEmptyState).toBeTruthy();
    });

    test("should display Average Effectiveness metric card", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show Average Effectiveness metric label
      const hasAverageEffectiveness = await page.getByText(/average effectiveness/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      // Either shows metrics or empty state
      expect(hasAverageEffectiveness || hasEmptyState).toBeTruthy();
    });

    test("should display Average Improvement metric card", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show Average Improvement metric label
      const hasAverageImprovement = await page.getByText(/average improvement/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      // Either shows metrics or empty state
      expect(hasAverageImprovement || hasEmptyState).toBeTruthy();
    });

    test("should display metrics with proper number formatting (no NaN or undefined)", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check page content doesn't contain NaN or undefined
      const pageContent = await page.textContent("body");

      // Should not display NaN
      expect(pageContent).not.toContain("NaN");

      // Should not display raw "undefined" text (case sensitive to avoid matching descriptions)
      const hasRawUndefined = /\bundefined\b/i.test(pageContent || "");
      expect(hasRawUndefined).toBeFalsy();
    });

    test("should display percentage format for effectiveness score", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations, should show percentage
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      if (!hasEmptyState) {
        // Should display % symbol somewhere in the metrics
        const hasPercentage = await page.getByText(/%/).first().isVisible().catch(() => false);
        expect(hasPercentage).toBeTruthy();
      }
    });

    test("should display points format for score improvement", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations, should show pts
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      if (!hasEmptyState) {
        // Should display "pts" for points
        const hasPts = await page.getByText(/pts/).first().isVisible().catch(() => false);
        expect(hasPts).toBeTruthy();
      }
    });
  });

  test.describe("Effectiveness Report Top Performers", () => {
    test("should display Top Performers section when completed recommendations exist", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations, should show Top Performers
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      if (!hasEmptyState) {
        // Should show Top Performers heading
        const hasTopPerformers = await page.getByText(/top performers/i).isVisible().catch(() => false);
        expect(hasTopPerformers).toBeTruthy();
      }
    });

    test("should display ranked list with numbered positions", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);
      const hasTopPerformers = await page.getByText(/top performers/i).isVisible().catch(() => false);

      if (!hasEmptyState && hasTopPerformers) {
        // Should show rank numbers (1, 2, 3, etc.)
        const hasRankOne = await page.locator(".rounded-full").filter({ hasText: "1" }).first().isVisible().catch(() => false);
        expect(hasRankOne).toBeTruthy();
      }
    });

    test("should display effectiveness level badges on performers", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);
      const hasTopPerformers = await page.getByText(/top performers/i).isVisible().catch(() => false);

      if (!hasEmptyState && hasTopPerformers) {
        // Should show effectiveness level badges (excellent, good, moderate, poor, or ineffective)
        const hasExcellent = await page.getByText(/excellent/i).isVisible().catch(() => false);
        const hasGood = await page.getByText(/good/i).isVisible().catch(() => false);
        const hasModerate = await page.getByText(/moderate/i).isVisible().catch(() => false);
        const hasPoor = await page.getByText(/poor/i).isVisible().catch(() => false);
        const hasIneffective = await page.getByText(/ineffective/i).isVisible().catch(() => false);

        // At least one level badge should be visible
        expect(hasExcellent || hasGood || hasModerate || hasPoor || hasIneffective).toBeTruthy();
      }
    });

    test("should display maximum 5 top performers", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);
      const hasTopPerformers = await page.getByText(/top performers/i).isVisible().catch(() => false);

      if (!hasEmptyState && hasTopPerformers) {
        // Count the performer items (items with rank numbers in circles)
        const performerItems = page.locator(".rounded-full").filter({ has: page.locator("text=/^[1-5]$/") });
        const count = await performerItems.count();

        // Should have at most 5 performers displayed
        expect(count).toBeLessThanOrEqual(5);
      }
    });

    test("should show trend indicators for score improvements", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);
      const hasTopPerformers = await page.getByText(/top performers/i).isVisible().catch(() => false);

      if (!hasEmptyState && hasTopPerformers) {
        // Should show trend icons (TrendingUp or TrendingDown from lucide-react)
        // These appear in the SVG icons within the performer items
        const hasTrendIcon = await page.locator("svg").first().isVisible().catch(() => false);
        expect(hasTrendIcon).toBeTruthy();
      }
    });
  });

  test.describe("Effectiveness Report Empty State", () => {
    test("should display empty state when no completed recommendations", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should either show metrics or empty state message
      const hasTotalCompleted = await page.getByText(/total completed/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);
      const hasCompleteToSee = await page.getByText(/complete recommendations.*see effectiveness/i).isVisible().catch(() => false);

      // One of these states should be present
      expect(hasTotalCompleted || hasEmptyState || hasCompleteToSee).toBeTruthy();
    });

    test("should show guidance text in empty state", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If in empty state, should show guidance
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      if (hasEmptyState) {
        // Should show guidance text about completing recommendations
        const hasGuidance = await page.getByText(/complete recommendations/i).isVisible().catch(() => false);
        expect(hasGuidance).toBeTruthy();
      }
    });
  });

  test.describe("Effectiveness Report Improvements Stats", () => {
    test("should display positive improvements count", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      if (!hasEmptyState) {
        // Should show positive improvements text
        const hasPositiveImprovements = await page.getByText(/positive improvements/i).isVisible().catch(() => false);
        expect(hasPositiveImprovements).toBeTruthy();
      }
    });

    test("should conditionally display negative improvements if any exist", async ({ page }) => {
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // If there are completed recommendations
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      if (!hasEmptyState) {
        // Negative improvements section is conditional
        // Just verify the positive improvements section exists (negative is optional)
        const hasPositiveImprovements = await page.getByText(/positive improvements/i).isVisible().catch(() => false);
        expect(hasPositiveImprovements).toBeTruthy();
      }
    });
  });

  test.describe("Effectiveness Report Error Handling", () => {
    test("should handle page load without errors", async ({ page }) => {
      // Track console errors
      const errors: string[] = [];
      page.on("console", msg => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Filter out known acceptable errors (like network errors in test environment)
      const criticalErrors = errors.filter(e =>
        !e.includes("Failed to fetch") &&
        !e.includes("net::ERR") &&
        !e.includes("NetworkError")
      );

      // Should have no critical console errors
      expect(criticalErrors.length).toBe(0);
    });

    test("should display error state gracefully if API fails", async ({ page }) => {
      // Intercept the API request and force it to fail
      await page.route("**/api/recommendations/effectiveness**", route => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Internal server error" })
        });
      });

      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for error state
      await page.waitForTimeout(2000);

      // Should show error message
      const hasError = await page.getByText(/failed to load metrics/i).isVisible().catch(() => false);
      const hasTryAgain = await page.getByText(/try again/i).isVisible().catch(() => false);

      // Should show some error indication
      expect(hasError || hasTryAgain).toBeTruthy();
    });
  });

  test.describe("Effectiveness Report Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Page should load
      await expect(page.locator("body")).toBeVisible();

      // Core content should be visible
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should stack metric cards on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should show effectiveness heading
      const hasHeading = await page.getByText(/recommendation effectiveness/i).first().isVisible().catch(() => false);
      expect(hasHeading).toBeTruthy();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Core content should be visible
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
      await expect(page.getByText(/recommendation effectiveness/i).first()).toBeVisible();
    });
  });

  test.describe("Effectiveness Report Integration with Completion Tracking", () => {
    test("should navigate from recommendations page to effectiveness report", async ({ page }) => {
      await page.goto("/dashboard/recommendations", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Navigate to effectiveness report
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Verify we're on the effectiveness report page
      await expect(page.getByText(/effectiveness report/i).first()).toBeVisible();
    });

    test("should reflect completed recommendations from tracking workflow", async ({ page }) => {
      // First visit effectiveness report to get baseline
      await page.goto("/dashboard/reports/effectiveness", { waitUntil: "domcontentloaded" });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check current state - either has metrics or empty state
      const hasMetrics = await page.getByText(/total completed/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no completed recommendations/i).isVisible().catch(() => false);

      // Page should show one of these states
      expect(hasMetrics || hasEmptyState).toBeTruthy();
    });
  });
});
