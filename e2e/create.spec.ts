import { test, expect } from "@playwright/test";

test.describe("Create Module", () => {
  test.describe("Main Create Page", () => {
    test("should display create page with header", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Should show Create heading
      await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();

      // Should show description
      await expect(page.getByText(/generate and manage ai-optimized content/i)).toBeVisible();
    });

    test("should display New Content button", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Should have New Content button
      const newContentButton = page.getByRole("link", { name: /new content/i });
      await expect(newContentButton).toBeVisible();
      await expect(newContentButton).toHaveAttribute("href", "/dashboard/create/new");
    });

    test("should display content stats cards", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Should show stats labels
      await expect(page.getByText(/total content/i)).toBeVisible();
      await expect(page.getByText(/published/i).first()).toBeVisible();
      await expect(page.getByText(/drafts/i)).toBeVisible();
      await expect(page.getByText(/scheduled/i).first()).toBeVisible();
    });

    test("should display search input", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Should have search input
      const searchInput = page.getByPlaceholder(/search content/i);
      await expect(searchInput).toBeVisible();
    });

    test("should display filter dropdowns", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Should have filter buttons
      await expect(page.getByRole("button", { name: /all status/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /all types/i })).toBeVisible();
    });

    test("should display content list with mock data", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Should show content cards
      await expect(page.getByText(/ultimate guide to ai-optimized content/i)).toBeVisible({ timeout: 10000 });
    });

    test("should filter content by search query", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Enter search query
      const searchInput = page.getByPlaceholder(/search content/i);
      await searchInput.fill("FAQ");

      // Should filter to FAQ content
      await expect(page.getByText(/product faq/i)).toBeVisible();
    });

    test("should navigate to new content page", async ({ page }) => {
      await page.goto("/dashboard/create");

      // Click New Content button
      await page.getByRole("link", { name: /new content/i }).click();

      // Should navigate to new content page
      await expect(page).toHaveURL(/\/dashboard\/create\/new/);
    });
  });

  test.describe("New Content Editor Page", () => {
    test("should display new content page with header", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should show New Content heading
      await expect(page.getByRole("heading", { name: /new content/i })).toBeVisible();

      // Should show description
      await expect(page.getByText(/create ai-optimized content for your brand/i)).toBeVisible();
    });

    test("should have back button", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should have back button (link to /dashboard/create)
      const backButton = page.getByRole("link", { name: "Back", exact: true });
      await expect(backButton).toBeVisible();
    });

    test("should have action buttons", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should have Preview, Save Draft, and Publish buttons
      await expect(page.getByRole("button", { name: /preview/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /publish/i })).toBeVisible();
    });

    test("should have title input field", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should have title input
      const titleInput = page.getByPlaceholder(/enter content title/i);
      await expect(titleInput).toBeVisible();

      // Should be able to type in title
      await titleInput.fill("Test Article Title");
      await expect(titleInput).toHaveValue("Test Article Title");
    });

    test("should have content type selector", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should show Content Type section
      await expect(page.getByText(/content type/i)).toBeVisible();

      // Should have dropdown with Article selected by default
      await expect(page.getByRole("button", { name: /article/i })).toBeVisible();
    });

    test("should display AI Optimization Tips", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should show AI Optimization Tips section
      await expect(page.getByText(/ai optimization tips/i)).toBeVisible();

      // Should show tip items
      await expect(page.getByText(/use clear, descriptive headings/i)).toBeVisible();
    });

    test("should display SEO Preview", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should show Preview section
      await expect(page.getByText(/preview/i).first()).toBeVisible();

      // Should show placeholder text
      await expect(page.getByText(/your content title/i)).toBeVisible();
    });

    test("should update SEO preview when title changes", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Enter a title
      const titleInput = page.getByPlaceholder(/enter content title/i);
      await titleInput.fill("My Amazing Article");

      // SEO preview should update
      await expect(page.getByText(/my amazing article/i)).toBeVisible();
    });

    test("should show word count", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Should show word count (0 initially)
      await expect(page.getByText(/0 words/i)).toBeVisible();
    });

    test("should navigate back to create list", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Click back button (link to /dashboard/create)
      const backButton = page.getByRole("link", { name: "Back", exact: true });
      await backButton.click();

      // Should navigate back
      await expect(page).toHaveURL(/\/dashboard\/create$/);
    });
  });

  test.describe("Content Type Selection", () => {
    test("should open content type dropdown", async ({ page }) => {
      await page.goto("/dashboard/create/new");

      // Click the content type dropdown
      await page.getByRole("button", { name: /article/i }).click();

      // Should show content type options (use exact match to avoid multiple elements)
      await expect(page.getByText("FAQ", { exact: true })).toBeVisible();
      await expect(page.getByText("Landing Page", { exact: true })).toBeVisible();
      await expect(page.getByText("Product Page", { exact: true })).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("should display create page on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/create");

      // Core elements should still be visible
      await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /new content/i })).toBeVisible();
    });

    test("should display new content page on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/create/new");

      // Core elements should still be visible
      await expect(page.getByRole("heading", { name: /new content/i })).toBeVisible();
      await expect(page.getByPlaceholder(/enter content title/i)).toBeVisible();
    });
  });
});
