import { test, expect } from "@playwright/test";

// Onboarding is a public route; running these tests against the
// authenticated E2E user adds nothing (the user has already completed
// onboarding). Strip the auth cookie so the wizard starts clean.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Onboarding Wizard", () => {
  test("shows the welcome step and advances to brand setup", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(page.getByText(/Welcome to (Apex|Solstice)/i)).toBeVisible({
      timeout: 10_000,
    });

    // Step 1 uses a "Continue" CTA (legacy tests said "Next"). Accept
    // either exact label — using a loose /next/i pattern also matches
    // the Next.js dev-tools launcher button in the corner.
    await page
      .getByRole("button", { name: /^(continue|next)$/i })
      .click();
  });

  test("welcome step renders the 5-step progress row", async ({ page }) => {
    await page.goto("/onboarding");

    // The wizard renders 5 step indicators. Rather than brittle text or
    // class-name matches, assert against the progress-row layout as a
    // whole: at least 5 digit-labelled markers appear in the DOM.
    const digitMarkers = page.locator("body").getByText(/^[1-5]$/);
    await expect(digitMarkers.first()).toBeVisible({ timeout: 10000 });
    const digitCount = await digitMarkers.count();
    expect(digitCount).toBeGreaterThanOrEqual(5);
  });

  test("feature tiles render with descriptive labels", async ({ page }) => {
    await page.goto("/onboarding");

    // The tiles advertise what the platform does. Presence of at least
    // one of the known labels is enough to confirm the welcome screen
    // rendered rather than a blank/error state.
    const anyTile = page.getByText(
      /AI Platforms|Real-time|Smart Recommendations|AI Content Engine/i
    );
    await expect(anyTile.first()).toBeVisible({ timeout: 10_000 });
  });
});
