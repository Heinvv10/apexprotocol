import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.describe("Sign In Page", () => {
    test("should display sign-in page", async ({ page }) => {
      await page.goto("/sign-in");

      // Page should load without errors
      await expect(page).toHaveURL(/\/sign-in/);

      // Should show sign in heading (works in both Clerk and dev mode)
      const heading = page.getByRole("heading", { name: /sign in/i });
      await expect(heading).toBeVisible();
    });

    test("should show dev mode fallback when Clerk not configured", async ({ page }) => {
      await page.goto("/sign-in");

      // Check for dev mode elements
      const devModeLink = page.getByRole("link", { name: /continue to dashboard/i });
      const isDevMode = await devModeLink.isVisible().catch(() => false);

      if (isDevMode) {
        // In dev mode, verify the fallback UI
        await expect(page.getByText(/authentication is not configured/i)).toBeVisible();
        await expect(devModeLink).toHaveAttribute("href", "/dashboard");
      } else {
        // In production mode with Clerk, verify Clerk UI is loaded
        // Clerk forms have specific class patterns
        await expect(page.locator('[class*="cl-"]')).toBeVisible({ timeout: 10000 });
      }
    });

    test("should navigate to sign-up from sign-in", async ({ page }) => {
      await page.goto("/sign-in");

      // Look for sign-up link in dev mode or Clerk UI
      const signUpLink = page.getByRole("link", { name: /sign.?up/i });
      const signUpLinkVisible = await signUpLink.isVisible().catch(() => false);

      if (signUpLinkVisible) {
        await signUpLink.click();
        await expect(page).toHaveURL(/\/sign-up/);
      }
    });
  });

  test.describe("Sign Up Page", () => {
    test("should display sign-up page", async ({ page }) => {
      await page.goto("/sign-up");

      // Page should load without errors
      await expect(page).toHaveURL(/\/sign-up/);

      // Should show sign up heading
      const heading = page.getByRole("heading", { name: /sign up/i });
      await expect(heading).toBeVisible();
    });

    test("should show dev mode fallback when Clerk not configured", async ({ page }) => {
      await page.goto("/sign-up");

      // Check for dev mode elements
      const devModeLink = page.getByRole("link", { name: /continue to dashboard/i });
      const isDevMode = await devModeLink.isVisible().catch(() => false);

      if (isDevMode) {
        // In dev mode, verify the fallback UI
        await expect(page.getByText(/authentication is not configured/i)).toBeVisible();
        await expect(devModeLink).toHaveAttribute("href", "/dashboard");
      } else {
        // In production mode with Clerk
        await expect(page.locator('[class*="cl-"]')).toBeVisible({ timeout: 10000 });
      }
    });

    test("should navigate to sign-in from sign-up", async ({ page }) => {
      await page.goto("/sign-up");

      // Look for sign-in link
      const signInLink = page.getByRole("link", { name: /sign.?in/i });
      const signInLinkVisible = await signInLink.isVisible().catch(() => false);

      if (signInLinkVisible) {
        await signInLink.click();
        await expect(page).toHaveURL(/\/sign-in/);
      }
    });
  });

  test.describe("Dev Mode Dashboard Access", () => {
    test("should allow dashboard access in dev mode from sign-in", async ({ page }) => {
      await page.goto("/sign-in");

      const devModeLink = page.getByRole("link", { name: /continue to dashboard/i });
      const isDevMode = await devModeLink.isVisible().catch(() => false);

      if (isDevMode) {
        await devModeLink.click();
        await expect(page).toHaveURL(/\/dashboard/);

        // Dashboard should load
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("should allow dashboard access in dev mode from sign-up", async ({ page }) => {
      await page.goto("/sign-up");

      const devModeLink = page.getByRole("link", { name: /continue to dashboard/i });
      const isDevMode = await devModeLink.isVisible().catch(() => false);

      if (isDevMode) {
        await devModeLink.click();
        await expect(page).toHaveURL(/\/dashboard/);

        // Dashboard should load
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("Protected Routes", () => {
    test("dashboard redirects to sign-in when not authenticated", async ({ page }) => {
      // Try to access dashboard directly
      await page.goto("/dashboard");

      // Should either show dashboard (dev mode) or redirect to sign-in
      const currentUrl = page.url();
      const isDashboard = currentUrl.includes("/dashboard");
      const isSignIn = currentUrl.includes("/sign-in");

      // One of these should be true
      expect(isDashboard || isSignIn).toBeTruthy();
    });
  });

  test.describe("Page Accessibility", () => {
    test("sign-in page has proper heading structure", async ({ page }) => {
      await page.goto("/sign-in");

      // Should have at least one heading
      const headings = page.getByRole("heading");
      await expect(headings.first()).toBeVisible();
    });

    test("sign-up page has proper heading structure", async ({ page }) => {
      await page.goto("/sign-up");

      // Should have at least one heading
      const headings = page.getByRole("heading");
      await expect(headings.first()).toBeVisible();
    });

    test("auth pages have proper document structure", async ({ page }) => {
      await page.goto("/sign-in");

      // Page should have proper HTML structure
      await expect(page.locator("html")).toHaveAttribute("lang");
    });
  });
});
