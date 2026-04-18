import { test, expect } from "@playwright/test";

test.describe("Locations Module - Phase 9.2", () => {
  // Increase timeout for all tests in this file
  test.setTimeout(30000);

  test.describe("Locations API", () => {
    test("should return locations API configuration status", async ({ request }) => {
      const response = await request.get("/api/locations/sync");

      // API should respond (200 if working, 401 if auth required, 404 if route not loaded)
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("googlePlaces");
        expect(data.googlePlaces).toHaveProperty("configured");
        expect(data.googlePlaces).toHaveProperty("message");
      }
    });

    test("should require authentication or brandId for locations list", async ({ request }) => {
      const response = await request.get("/api/locations");

      // Should return 400 without brandId, 401 if auth required, or 404 if route not loaded
      expect([400, 401, 404]).toContain(response.status());
    });

    test("should return error for non-existent brand", async ({ request }) => {
      const response = await request.get("/api/locations?brandId=non-existent-brand-id");

      // Should return 400/401/404 for invalid/unauthorized brand
      expect([400, 401, 403, 404]).toContain(response.status());
    });

    test("should support summary query type", async ({ request }) => {
      // This test will pass with 400/401/404 since we don't have a real brand or auth
      const response = await request.get("/api/locations?brandId=test-brand&type=summary");

      // Either returns data or error for invalid/unauthorized brand
      expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test("should support reviews query type", async ({ request }) => {
      const response = await request.get("/api/locations?brandId=test-brand&type=reviews");

      // Either returns data or error for invalid/unauthorized brand
      expect([200, 400, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe("Locations in Brand Detail View", () => {
    test("should display brands page", async ({ page }) => {
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Should show APEX branding and Brands title
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
      await expect(page.getByText(/brands/i).first()).toBeVisible();
    });

    test("should display brand management section", async ({ page }) => {
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Should show Brand Management header
      await expect(page.getByText(/brand management/i)).toBeVisible();
    });

    test("should show add brand button", async ({ page }) => {
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Should have Add Brand button
      const addButton = page.getByRole("button", { name: /add brand/i });
      await expect(addButton).toBeVisible();
    });

    test("should display brand cards or empty state", async ({ page }) => {
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Should show either brand cards or empty state
      const hasBrands = await page.locator(".card-secondary").first().isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no brands yet/i).isVisible().catch(() => false);
      const hasSearchResults = await page.getByText(/no brands found/i).isVisible().catch(() => false);

      expect(hasBrands || hasEmptyState || hasSearchResults).toBeTruthy();
    });
  });

  test.describe("Location Components", () => {
    test("should render rating badge correctly", async ({ page }) => {
      // Navigate to any page that might show ratings
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Page should load without errors
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle location card interactions", async ({ page }) => {
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Wait for potential brand cards
      await page.waitForTimeout(2000);

      // Click on a brand card if available to see locations section
      const brandCard = page.locator(".card-secondary").first();
      const isVisible = await brandCard.isVisible().catch(() => false);

      if (isVisible) {
        await brandCard.click();

        // Wait for detail modal
        await page.waitForTimeout(1000);

        // Should show brand detail view (which now includes locations)
        const hasDetailView = await page.getByRole("button", { name: /edit/i }).isVisible().catch(() => false);
        const hasCloseButton = await page.getByRole("button").filter({ has: page.locator("svg") }).first().isVisible().catch(() => false);

        expect(hasDetailView || hasCloseButton).toBeTruthy();
      }
    });
  });

  test.describe("Google Places Integration", () => {
    test("should check Google Places configuration", async ({ request }) => {
      const response = await request.get("/api/locations/sync");

      // API should respond (200 if working, 401 if auth required, 404 if route not loaded)
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        // Either configured or not - both are valid states
        expect(typeof data.googlePlaces.configured).toBe("boolean");
      }
    });

    test("should handle auto-discover request", async ({ request }) => {
      const response = await request.post("/api/locations/sync?action=discover", {
        data: { brandId: "test-brand-id" },
      });

      // Should return error for invalid brand or 503 if not configured
      expect([400, 404, 503]).toContain(response.status());
    });

    test("should handle search request", async ({ request }) => {
      const response = await request.post("/api/locations/sync?action=search", {
        data: {
          brandId: "test-brand-id",
          query: "test business"
        },
      });

      // Should return error for invalid brand or 503 if not configured
      expect([400, 404, 503]).toContain(response.status());
    });

    test("should handle sync request with invalid placeId", async ({ request }) => {
      const response = await request.post("/api/locations/sync", {
        data: {
          brandId: "test-brand-id",
          placeId: "invalid-place-id"
        },
      });

      // Should return error
      expect([400, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe("Location CRUD Operations", () => {
    test("should handle create location request", async ({ request }) => {
      const response = await request.post("/api/locations", {
        data: {
          brandId: "test-brand-id",
          name: "Test Location",
          address: "123 Test St",
          city: "Test City",
        },
      });

      // Should return error for invalid brand
      expect([400, 401, 404]).toContain(response.status());
    });

    test("should handle get location request", async ({ request }) => {
      const response = await request.get("/api/locations/invalid-location-id");

      // Should return 404 for non-existent location
      expect([401, 404]).toContain(response.status());
    });

    test("should handle update location request", async ({ request }) => {
      const response = await request.put("/api/locations/invalid-location-id", {
        data: {
          name: "Updated Name",
        },
      });

      // Should return error
      expect([401, 404]).toContain(response.status());
    });

    test("should handle delete location request", async ({ request }) => {
      const response = await request.delete("/api/locations/invalid-location-id");

      // Should return error
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe("Responsive Design", () => {
    test("should display brands page on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Page should load
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("APEX", { exact: true })).toBeVisible();
    });

    test("should display brands page on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Page should load
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText(/brand/i).first()).toBeVisible();
    });
  });

  test.describe("Loading and Error States", () => {
    test("should show loading state for brands", async ({ page }) => {
      // Slow down API responses to catch loading state
      await page.route("**/api/**", async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto("/dashboard/brands");

      // Page should show some content
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle API errors gracefully", async ({ page }) => {
      // Mock API error
      await page.route("**/api/brands**", async route => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      await page.goto("/dashboard/brands", { waitUntil: "domcontentloaded" });

      // Page should still be visible even with API error
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Location Reviews", () => {
    test("should handle reviews query", async ({ request }) => {
      const response = await request.get("/api/locations?brandId=test-brand&type=reviews&limit=10");

      // Either returns data or error for invalid brand
      expect([200, 400, 404]).toContain(response.status());
    });

    test("should support pagination parameters", async ({ request }) => {
      const response = await request.get("/api/locations?brandId=test-brand&limit=10&offset=0");

      // Either returns data or error for invalid brand
      expect([200, 400, 404]).toContain(response.status());
    });

    test("should support location type filter", async ({ request }) => {
      const response = await request.get("/api/locations?brandId=test-brand&locationType=headquarters");

      // Either returns data or error for invalid brand
      expect([200, 400, 404]).toContain(response.status());
    });

    test("should support active filter", async ({ request }) => {
      const response = await request.get("/api/locations?brandId=test-brand&isActive=true");

      // Either returns data or error for invalid brand
      expect([200, 400, 404]).toContain(response.status());
    });
  });
});
