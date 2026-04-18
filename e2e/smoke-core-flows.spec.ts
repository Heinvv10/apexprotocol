/**
 * Core-flow smoke tests. These protect against silent regressions
 * that `feature_list.json` can't catch (e.g. the 2026-04-16 citations
 * bug where every mention rendered as "Omitted" due to a data-shape
 * mismatch).
 *
 * Keep this suite fast (<60s) and focused on wiring, not behaviour.
 *
 * Auth is handled by e2e/.auth/auth.setup.ts (the globalSetup in
 * playwright.config.ts). By default every spec starts with a live
 * storage state; no env-var gates required.
 */

import { test, expect } from "@playwright/test";

test.describe("Core flow smoke @smoke", () => {
  test("monitor page loads without 500-ing @auth", async ({ page }) => {
    await page.goto("/dashboard/monitor");

    // The page always renders the APEX Monitor brand header regardless of
    // whether a brand is selected — that's what we're guarding against
    // (a blank page or 500 spinner).
    await expect(
      page.getByText("Monitor", { exact: true }).first()
    ).toBeVisible({ timeout: 10000 });

    // And either a platform-score table (brand selected) OR a "Select a
    // Brand" empty state (clean org) — anything except a hung spinner.
    const scoreCards = page.locator(
      "table, [role='table'], [class*='table'], [data-testid='empty-state']"
    );
    const selectBrandPrompt = page.getByText(/Select a Brand/i);
    await expect(scoreCards.or(selectBrandPrompt).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("citation badges render real statuses, not all 'Omitted' @auth", async ({ page }) => {
await page.goto("/dashboard/monitor");

    // If the page has mention rows at all, they shouldn't ALL be "Omitted" —
    // that would indicate the mention→QueryRow transformer is broken, which
    // is the exact regression we fixed on 2026-04-16.
    const rows = page.locator('tr:has-text("Grok"), tr:has-text("Perplexity"), tr:has-text("ChatGPT")');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const omittedBadges = page.getByText("Omitted", { exact: true });
      const omittedCount = await omittedBadges.count();
      expect(omittedCount).toBeLessThan(rowCount);
    }
    // If rowCount === 0, the test passes trivially — empty DB is fine.
  });

  test("platform score cards render with numeric values @auth", async ({ page }) => {
    await page.goto("/dashboard/monitor");

    // Platform cards only show when a brand is selected. Tolerate the
    // clean-org empty state by skipping the score check when we land
    // on the "Select a Brand" prompt — the shape regression we're
    // guarding against still shows up whenever a brand IS selected.
    const emptyPrompt = page.getByText(/Select a Brand/i);
    if (await emptyPrompt.isVisible().catch(() => false)) {
      test.skip(true, "No brand selected — empty state, score check is a no-op");
    }

    await expect(page.getByText(/ChatGPT|Claude|Gemini|Perplexity/).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("/100").first()).toBeVisible();
  });

  test("nav sidebar links to all primary sections @auth", async ({ page }) => {
await page.goto("/dashboard/monitor");

    // These nav items need to exist or half the app is unreachable.
    for (const label of ["Overview", "Brands", "Monitor", "Create", "Audit"]) {
      await expect(page.getByRole("link", { name: new RegExp(label, "i") }).first()).toBeVisible();
    }
  });

  test("security headers are applied", async ({ request }) => {
    const response = await request.get("/dashboard/monitor");

    // These come from next.config.ts; verify they didn't get dropped.
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBeTruthy();
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});
