/**
 * Core-flow smoke tests. These protect against silent regressions
 * that `feature_list.json` can't catch (e.g. the 2026-04-16 citations
 * bug where every mention rendered as "Omitted" due to a data-shape
 * mismatch).
 *
 * Keep this suite fast (<60s) and focused on wiring, not behaviour.
 */

import { test, expect } from "@playwright/test";

test.describe("Core flow smoke @smoke", () => {
  test("monitor page loads and renders mention rows", async ({ page }) => {
    await page.goto("/dashboard/monitor");

    await expect(page.getByRole("heading", { name: /live query analysis/i })).toBeVisible({
      timeout: 10000,
    });

    // The table should render — either real rows or an empty-state message.
    // What we're guarding against: the page 500-ing or hanging on spinners.
    const tableOrEmpty = page.locator("table, [role='table'], [class*='table'], [data-testid='empty-state']");
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test("citation badges render real statuses, not all 'Omitted'", async ({ page }) => {
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

  test("platform score cards render with numeric values", async ({ page }) => {
    await page.goto("/dashboard/monitor");

    // At least one platform card (ChatGPT, Claude, Gemini, etc.) should render.
    await expect(page.getByText(/ChatGPT|Claude|Gemini|Perplexity/).first()).toBeVisible({
      timeout: 10000,
    });

    // And the /100 score suffix should appear, confirming the score renders.
    await expect(page.getByText("/100").first()).toBeVisible();
  });

  test("nav sidebar links to all primary sections", async ({ page }) => {
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
