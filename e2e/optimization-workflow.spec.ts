import { test, expect } from "@playwright/test";

test.describe("Content Optimization Workflow", () => {
  test.describe("Rich Text Editor Optimization", () => {
    test("should display rich text editor on new content page", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Editor should be visible
      await expect(page.locator(".ProseMirror")).toBeVisible();
    });

    test("should display optimize button in toolbar", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should have Optimize for GEO button (Sparkles icon)
      const optimizeButton = page.getByTitle("Optimize for GEO");
      await expect(optimizeButton).toBeVisible();
    });

    test("should type content in editor", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Click in editor and type
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");

      // Content should be visible in editor
      await expect(editor).toContainText("This is test content for optimization.");
    });

    test("should use toolbar formatting buttons", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Type some content
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("Test heading");

      // Select all text
      await page.keyboard.press("Control+a");

      // Click Heading 1 button
      await page.getByTitle("Heading 1").click();

      // Should create heading
      await expect(editor.locator("h1")).toBeVisible();
    });

    test("should format text with bold", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("Bold text");

      // Select all text
      await page.keyboard.press("Control+a");

      // Click Bold button
      await page.getByTitle("Bold").click();

      // Should have bold element
      await expect(editor.locator("strong")).toBeVisible();
    });

    test("should format text with italic", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("Italic text");

      // Select all text
      await page.keyboard.press("Control+a");

      // Click Italic button
      await page.getByTitle("Italic").click();

      // Should have italic element
      await expect(editor.locator("em")).toBeVisible();
    });
  });

  test.describe("Optimization API Integration", () => {
    test("should trigger optimization when clicking optimize button", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Add more descriptive keywords",
                confidence: 0.85,
                originalText: "test content",
                suggestedText: "comprehensive test content for GEO optimization",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Your content has good potential but could use some improvements.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");

      // Click optimize button
      await page.getByTitle("Optimize for GEO").click();

      // Should show analyzing state
      await expect(page.getByText(/analyzing content/i)).toBeVisible({ timeout: 10000 });

      // Should show suggestions panel after analysis
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });
    });

    test("should display suggestions after optimization", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Add more descriptive keywords",
                confidence: 0.85,
                originalText: "test content",
                suggestedText: "comprehensive test content",
              },
              {
                id: "2",
                type: "structure",
                description: "Improve heading structure",
                confidence: 0.72,
                originalText: "",
                suggestedText: "<h2>Introduction</h2>",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Your content has good potential.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for suggestions
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Should show suggestion types
      await expect(page.getByText(/keyword suggestions/i)).toBeVisible();
      await expect(page.getByText(/structure suggestions/i)).toBeVisible();

      // Should show suggestion descriptions
      await expect(page.getByText(/add more descriptive keywords/i)).toBeVisible();
      await expect(page.getByText(/improve heading structure/i)).toBeVisible();
    });

    test("should display overall score and citation probability", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Test suggestion",
                confidence: 0.85,
                originalText: "test",
                suggestedText: "improved test",
              },
            ],
            analysis: {
              overallScore: 82,
              citationProbability: "high",
              summary: "Great content!",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for suggestions panel
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Should show overall score
      await expect(page.getByText(/overall score/i)).toBeVisible();
      await expect(page.getByText("82/100")).toBeVisible();

      // Should show citation probability
      await expect(page.getByText(/citation probability/i)).toBeVisible();
      await expect(page.getByText("high")).toBeVisible();
    });

    test("should handle optimization error gracefully", async ({ page }) => {
      // Mock API error
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Content is too short for analysis",
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("Short content.");
      await page.getByTitle("Optimize for GEO").click();

      // Should show error message
      await expect(page.getByText(/analysis failed/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/content is too short for analysis/i)).toBeVisible();
    });

    test("should show success message when content is already optimized", async ({ page }) => {
      // Mock API response with no suggestions
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [],
            analysis: {
              overallScore: 95,
              citationProbability: "high",
              summary: "Your content is already well-optimized for GEO.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is perfectly optimized content with excellent structure and keywords.");
      await page.getByTitle("Optimize for GEO").click();

      // Should show success message
      await expect(page.getByText(/content looks great/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/already well-optimized/i)).toBeVisible();
      await expect(page.getByText("95/100")).toBeVisible();
    });
  });

  test.describe("Suggestion Interactions", () => {
    test("should apply suggestion when clicking apply button", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Add more descriptive keywords",
                confidence: 0.85,
                originalText: "test content",
                suggestedText: "comprehensive test content for GEO optimization",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Your content has good potential.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for suggestions
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Click apply button
      await page.getByRole("button", { name: /apply/i }).first().click();

      // Suggestion should be removed from list (count should decrease)
      // The suggestion panel should update or the suggestion should disappear
      await page.waitForTimeout(500); // Give time for state update
    });

    test("should dismiss suggestion when clicking dismiss button", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "First suggestion",
                confidence: 0.85,
                originalText: "test",
                suggestedText: "improved test",
              },
              {
                id: "2",
                type: "structure",
                description: "Second suggestion",
                confidence: 0.72,
                originalText: "",
                suggestedText: "<h2>Title</h2>",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Your content has good potential.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for suggestions
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Should show 2 suggestions initially
      await expect(page.getByText("2 suggestions")).toBeVisible();

      // Click dismiss button on first suggestion
      const dismissButtons = page.getByRole("button", { name: /^$/ }).filter({ hasText: "" });
      await dismissButtons.first().click();

      // Should show 1 suggestion after dismissing
      await expect(page.getByText("1 suggestion")).toBeVisible({ timeout: 2000 });
    });

    test("should expand and collapse suggestion details", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Add more descriptive keywords",
                confidence: 0.85,
                originalText: "test content",
                suggestedText: "comprehensive test content",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Your content has good potential.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for suggestions
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Initially, details should be hidden
      await expect(page.getByText(/original:/i)).not.toBeVisible();

      // Click show details
      await page.getByText(/show details/i).first().click();

      // Details should be visible
      await expect(page.getByText(/original:/i)).toBeVisible();
      await expect(page.getByText(/suggested:/i)).toBeVisible();

      // Click hide details
      await page.getByText(/hide details/i).first().click();

      // Details should be hidden again
      await expect(page.getByText(/original:/i)).not.toBeVisible();
    });

    test("should clear all suggestions when clicking clear all button", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Test suggestion",
                confidence: 0.85,
                originalText: "test",
                suggestedText: "improved test",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Your content has good potential.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is test content for optimization.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for suggestions
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Click Clear All button
      await page.getByRole("button", { name: /clear all/i }).click();

      // Suggestions panel should disappear
      await expect(page.getByText(/geo optimization suggestions/i)).not.toBeVisible();
    });

    test("should close panel when clicking close button on success message", async ({ page }) => {
      // Mock API response with no suggestions
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [],
            analysis: {
              overallScore: 95,
              citationProbability: "high",
              summary: "Your content is already well-optimized for GEO.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This is perfectly optimized content.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for success message
      await expect(page.getByText(/content looks great/i)).toBeVisible({ timeout: 10000 });

      // Click Close button
      await page.getByRole("button", { name: /close/i }).click();

      // Panel should disappear
      await expect(page.getByText(/content looks great/i)).not.toBeVisible();
    });

    test("should dismiss error panel when clicking dismiss button", async ({ page }) => {
      // Mock API error
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Content is too short for analysis",
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Add content and optimize
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("Short.");
      await page.getByTitle("Optimize for GEO").click();

      // Wait for error message
      await expect(page.getByText(/analysis failed/i)).toBeVisible({ timeout: 10000 });

      // Click Dismiss button
      await page.getByRole("button", { name: /dismiss/i }).click();

      // Error panel should disappear
      await expect(page.getByText(/analysis failed/i)).not.toBeVisible();
    });
  });

  test.describe("Full Optimization Workflow", () => {
    test("should complete full optimization workflow from start to finish", async ({ page }) => {
      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Add semantic keywords for better AI understanding",
                confidence: 0.88,
                originalText: "product features",
                suggestedText: "comprehensive product features and capabilities",
              },
              {
                id: "2",
                type: "structure",
                description: "Add FAQ section for better AI snippet extraction",
                confidence: 0.92,
                originalText: "",
                suggestedText: "<h2>Frequently Asked Questions</h2>",
              },
              {
                id: "3",
                type: "formatting",
                description: "Use bullet points for better readability",
                confidence: 0.75,
                originalText: "Feature one, feature two, feature three",
                suggestedText: "<ul><li>Feature one</li><li>Feature two</li><li>Feature three</li></ul>",
              },
            ],
            analysis: {
              overallScore: 68,
              citationProbability: "medium",
              summary: "Your content has good foundation but needs structural improvements for better AI visibility.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Step 1: Enter title
      const titleInput = page.getByPlaceholder(/enter content title/i);
      await titleInput.fill("Complete Guide to AI Optimization");

      // Step 2: Add content to editor
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await editor.fill("This guide covers product features and how to use them effectively.");

      // Step 3: Click optimize button
      await page.getByTitle("Optimize for GEO").click();

      // Step 4: Wait for analysis to complete
      await expect(page.getByText(/analyzing content/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });

      // Step 5: Verify analysis results
      await expect(page.getByText("68/100")).toBeVisible();
      await expect(page.getByText("medium")).toBeVisible();
      await expect(page.getByText(/structural improvements/i)).toBeVisible();

      // Step 6: Verify all suggestion types are shown
      await expect(page.getByText(/keyword suggestions/i)).toBeVisible();
      await expect(page.getByText(/structure suggestions/i)).toBeVisible();
      await expect(page.getByText(/formatting suggestions/i)).toBeVisible();

      // Step 7: Expand details for first suggestion
      await page.getByText(/show details/i).first().click();
      await expect(page.getByText(/original:/i)).toBeVisible();
      await expect(page.getByText(/suggested:/i)).toBeVisible();

      // Step 8: Apply first suggestion
      const applyButtons = page.getByRole("button", { name: /apply/i });
      await applyButtons.first().click();
      await page.waitForTimeout(500); // Wait for state update

      // Step 9: Dismiss second suggestion
      const dismissButtons = page.getByRole("button", { name: /^$/ }).filter({ hasText: "" });
      await dismissButtons.first().click();
      await page.waitForTimeout(500);

      // Step 10: Verify suggestion count decreased
      await expect(page.getByText("1 suggestion")).toBeVisible();

      // Step 11: Clear remaining suggestions
      await page.getByRole("button", { name: /clear all/i }).click();

      // Step 12: Verify panel is closed
      await expect(page.getByText(/geo optimization suggestions/i)).not.toBeVisible();

      // Step 13: Verify title is still filled
      await expect(titleInput).toHaveValue("Complete Guide to AI Optimization");
    });
  });

  test.describe("Responsive Design", () => {
    test("should display optimization workflow on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Mock the API response
      await page.route("/api/optimize", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                id: "1",
                type: "keyword",
                description: "Test suggestion",
                confidence: 0.85,
                originalText: "test",
                suggestedText: "improved test",
              },
            ],
            analysis: {
              overallScore: 75,
              citationProbability: "medium",
              summary: "Good content.",
            },
          }),
        });
      });

      await page.goto("/dashboard/create/new");

      // Editor should be visible on mobile
      const editor = page.locator(".ProseMirror");
      await expect(editor).toBeVisible();

      // Optimize button should be visible
      await expect(page.getByTitle("Optimize for GEO")).toBeVisible();

      // Add content and optimize
      await editor.click();
      await editor.fill("Mobile test content.");
      await page.getByTitle("Optimize for GEO").click();

      // Suggestions should be visible on mobile
      await expect(page.getByText(/geo optimization suggestions/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
