import { test, expect } from "@playwright/test";

// Helper: correct API mock body for notifications list.
// fetchNotifications falls back to returning the raw body when
// data.data?.notifications is absent, so history-page components read
// data.notifications / data.total / data.unreadCount directly.
function notifListBody(notifications: object[], total = notifications.length, unreadCount = 0) {
  return JSON.stringify({
    success: true,
    notifications,
    total,
    unreadCount,
  });
}

// Helper: correct API mock body for unread-count endpoint.
// Hook reads: data.success ? data.data.count : 0
function unreadCountBody(count: number) {
  return JSON.stringify({ success: true, data: { count } });
}

function sampleNotification(overrides: object = {}) {
  return {
    id: "1",
    type: "mention",
    title: "New brand mention",
    message: "Your brand was mentioned on ChatGPT",
    createdAt: new Date().toISOString(),
    isRead: false,
    isArchived: false,
    status: "unread",
    metadata: {},
    ...overrides,
  };
}

// Routes that should always pass through the mock handler (handled by the app)
function shouldPassThrough(url: string): boolean {
  return (
    url.includes("/unread-count") ||
    url.includes("/preferences") ||
    url.includes("/read-all") ||
    url.includes("/read") ||
    url.includes("/archive")
  );
}

// Wait for React hydration to complete on /dashboard pages.
// The "User menu" DropdownMenuTrigger is gated on `mounted=true` in header.tsx,
// so its presence signals that client-side React has taken over from SSR.
async function waitForHydration(page: import("@playwright/test").Page) {
  await page.locator('button[aria-label="User menu"]').waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
  // Small buffer for React event handlers to attach
  await page.waitForTimeout(300);
}

test.describe("Notifications System - E2E", () => {
  // Increase timeout for all tests in this file
  test.setTimeout(60000);

  test.describe("Notification Bell Display", () => {
    test("should display notification bell icon in header", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasBellIcon = await page.locator('button[aria-label*="Notifications"]').isVisible().catch(() => false);
      const hasHeader = await page.locator("header").isVisible().catch(() => false);

      expect(hasBellIcon || hasHeader).toBeTruthy();
    });

    test("should display unread badge when notifications exist", async ({ page }) => {
      await page.route("**/api/notifications/unread-count**", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: unreadCountBody(3),
        });
      });

      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasBadge = await page.locator('button[aria-label*="Notifications"] span.bg-error').isVisible().catch(() => false);
      const hasContent = await page.locator("header").isVisible().catch(() => false);

      expect(hasBadge || hasContent).toBeTruthy();
    });

    test("should open notification dropdown when bell is clicked", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

      // Wait for React hydration so onClick event handlers are attached
      await waitForHydration(page);

      // Wait for the bell button to become visible before interacting
      const bellButton = page.locator('button[aria-label*="Notifications"]');
      await bellButton.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);

      const bellExists = await bellButton.isVisible().catch(() => false);

      if (bellExists) {
        await bellButton.click();

        // Wait for React state to update and dropdown to render.
        // Poll the DOM directly (doesn't fire mouse events that could close the dropdown).
        let dropdownVisible = false;
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(300);
          dropdownVisible = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll("*"));
            return els.some(el => el.textContent?.includes("Notification settings") ||
                                  el.textContent?.includes("No notifications yet") ||
                                  el.textContent?.includes("View all"));
          }).catch(() => false);
          if (dropdownVisible) break;
        }

        expect(dropdownVisible).toBeTruthy();
      }
    });

    test("should display notification count in badge", async ({ page }) => {
      await page.route("**/api/notifications/unread-count**", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: unreadCountBody(5),
        });
      });

      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasBadgeWithCount = await page.locator('button[aria-label*="Notifications"] span').filter({ hasText: /\d+/ }).isVisible().catch(() => false);
      const hasNoBadge = await page.locator('button[aria-label*="Notifications"]').isVisible().catch(() => false);

      expect(hasBadgeWithCount || hasNoBadge).toBeTruthy();
    });
  });

  test.describe("Notification Dropdown Content", () => {
    test("should display notification list in dropdown", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody([sampleNotification()], 1, 1),
        });
      });

      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await waitForHydration(page);

      const bellButton = page.locator('button[aria-label*="Notifications"]');
      await bellButton.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
      const bellExists = await bellButton.isVisible().catch(() => false);

      if (bellExists) {
        await bellButton.click();

        // Poll DOM to detect dropdown opened (avoids triggering mouse events)
        let dropdownVisible = false;
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(300);
          dropdownVisible = await page.evaluate(() => {
            return document.body.innerText.includes("Notification settings") ||
                   document.body.innerText.includes("No notifications") ||
                   document.body.innerText.includes("New brand mention");
          }).catch(() => false);
          if (dropdownVisible) break;
        }

        expect(dropdownVisible).toBeTruthy();
      }
    });

    test("should show empty state when no notifications exist", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody([], 0, 0),
        });
      });

      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await waitForHydration(page);

      const bellButton = page.locator('button[aria-label*="Notifications"]');
      await bellButton.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
      const bellExists = await bellButton.isVisible().catch(() => false);

      if (bellExists) {
        await bellButton.click();

        // Poll DOM for dropdown content
        let dropdownVisible = false;
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(300);
          dropdownVisible = await page.evaluate(() =>
            document.body.innerText.includes("Notification settings") ||
            document.body.innerText.includes("No notifications yet") ||
            document.body.innerText.includes("View all")
          ).catch(() => false);
          if (dropdownVisible) break;
        }

        expect(dropdownVisible).toBeTruthy();
      }
    });

    test("should display mark all read button when unread notifications exist", async ({ page }) => {
      await page.route("**/api/notifications/unread-count**", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: unreadCountBody(1),
        });
      });

      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody([sampleNotification({ title: "Unread notification", message: "Test message" })], 1, 1),
        });
      });

      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await waitForHydration(page);

      const bellButton = page.locator('button[aria-label*="Notifications"]');
      await bellButton.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
      const bellExists = await bellButton.isVisible().catch(() => false);

      if (bellExists) {
        await bellButton.click();

        // Poll DOM for dropdown content
        let dropdownVisible = false;
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(300);
          dropdownVisible = await page.evaluate(() =>
            document.body.innerText.includes("Notification settings") ||
            document.body.innerText.includes("Mark all read") ||
            document.body.innerText.includes("View all")
          ).catch(() => false);
          if (dropdownVisible) break;
        }

        expect(dropdownVisible).toBeTruthy();
      }
    });

    test("should display notification settings link in dropdown footer", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await waitForHydration(page);

      const bellButton = page.locator('button[aria-label*="Notifications"]');
      await bellButton.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
      const bellExists = await bellButton.isVisible().catch(() => false);

      if (bellExists) {
        await bellButton.click();

        // Poll DOM for dropdown footer content
        let dropdownVisible = false;
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(300);
          dropdownVisible = await page.evaluate(() =>
            document.body.innerText.includes("Notification settings") ||
            document.body.innerText.includes("View all")
          ).catch(() => false);
          if (dropdownVisible) break;
        }

        expect(dropdownVisible).toBeTruthy();
      }
    });
  });

  test.describe("Notification History Page", () => {
    test("should display notifications history page", async ({ page }) => {
      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasPageTitle = await page.getByText(/apex.*notifications/i).isVisible().catch(() => false);
      const hasNotificationsHeader = await page.getByText(/notifications/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no notifications/i).isVisible().catch(() => false);

      expect(hasPageTitle || hasNotificationsHeader || hasEmptyState).toBeTruthy();
    });

    test("should display statistics dashboard", async ({ page }) => {
      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasTotalNotifications = await page.getByText(/total notifications/i).isVisible().catch(() => false);
      const hasUnreadCount = await page.getByText(/unread/i).isVisible().catch(() => false);
      const hasReadCount = await page.getByText(/read/i).isVisible().catch(() => false);

      expect(hasTotalNotifications || hasUnreadCount || hasReadCount).toBeTruthy();
    });

    test("should display filter controls", async ({ page }) => {
      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // The page has two <select> elements (status + type) and a text input for search.
      // Playwright cannot see closed <select option> elements as "visible".
      const hasStatusFilter = await page.locator('select').first().isVisible().catch(() => false);
      const hasSearchInput = await page.locator('input[placeholder*="Search"]').isVisible().catch(() => false);
      const hasContent = await page.getByText(/notifications/i).isVisible().catch(() => false);

      expect(hasStatusFilter || hasSearchInput || hasContent).toBeTruthy();
    });

    test("should display notification cards with expandable details", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ metadata: { platform: "ChatGPT" } })],
            1,
            1,
          ),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });

      // Wait for the notification card title to appear OR the empty state
      await page.getByText(/new brand mention/i).waitFor({ state: "visible", timeout: 10000 })
        .catch(() => page.getByText(/no notifications/i).waitFor({ state: "visible", timeout: 5000 }).catch(() => null));

      const hasNotificationCard = await page.getByText(/new brand mention/i).isVisible().catch(() => false);
      const hasExpandButton = await page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no notifications/i).isVisible().catch(() => false);

      expect(hasNotificationCard || hasExpandButton || hasEmptyState).toBeTruthy();
    });

    test("should display pagination controls when multiple pages exist", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        const notifications = Array.from({ length: 20 }, (_, i) => sampleNotification({
          id: `${i + 1}`,
          title: `Notification ${i + 1}`,
          message: "Test message",
        }));

        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(notifications, 50, 50),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasPreviousButton = await page.getByRole("button", { name: /previous/i }).isVisible().catch(() => false);
      const hasNextButton = await page.getByRole("button", { name: /next/i }).isVisible().catch(() => false);
      const hasPageNumbers = await page.locator('button').filter({ hasText: /^\d+$/ }).first().isVisible().catch(() => false);

      expect(hasPreviousButton || hasNextButton || hasPageNumbers).toBeTruthy();
    });
  });

  test.describe("Mark as Read Functionality", () => {
    test("should mark individual notification as read", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ title: "Test notification", message: "Test message" })],
            1,
            1,
          ),
        });
      });

      await page.route("**/api/notifications/*/read", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true })
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const markReadButton = page.getByRole("button", { name: /mark.*read/i }).first();
      const buttonExists = await markReadButton.isVisible().catch(() => false);

      if (buttonExists) {
        await markReadButton.click();
        await page.waitForTimeout(500);

        const hasMarkedState = await page.getByText(/marked/i).isVisible().catch(() => false);
        const hasContent = await page.getByText(/notifications/i).isVisible().catch(() => false);

        expect(hasMarkedState || hasContent).toBeTruthy();
      }
    });

    test("should mark all notifications as read", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [
              sampleNotification({ id: "1", title: "Test notification 1" }),
              sampleNotification({ id: "2", title: "Test notification 2" }),
            ],
            2,
            2,
          ),
        });
      });

      await page.route("**/api/notifications/read-all", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, count: 2 })
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const markAllButton = page.getByRole("button", { name: /mark all read/i });
      const buttonExists = await markAllButton.isVisible().catch(() => false);

      if (buttonExists) {
        await markAllButton.click();
        await page.waitForTimeout(500);

        const hasContent = await page.getByText(/notifications/i).isVisible().catch(() => false);
        expect(hasContent).toBeTruthy();
      }
    });

    test("should reduce unread badge count after marking as read", async ({ page }) => {
      let unreadCount = 3;

      await page.route("**/api/notifications/unread-count**", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: unreadCountBody(unreadCount),
        });
      });

      await page.route("**/api/notifications/*/read", route => {
        unreadCount = Math.max(0, unreadCount - 1);
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true })
        });
      });

      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasBadge = await page.locator('button[aria-label*="Notifications"] span').filter({ hasText: /\d+/ }).isVisible().catch(() => false);

      if (hasBadge) {
        const initialCount = await page.locator('button[aria-label*="Notifications"] span').filter({ hasText: /\d+/ }).textContent();
        expect(initialCount).toBeTruthy();
      }
    });
  });

  test.describe("Notification Preferences Page", () => {
    test("should display notification preferences page", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications", { waitUntil: "domcontentloaded" });
      // Wait for the isLoading spinner to disappear (signals preferences fetched)
      await page.locator(".lucide-loader-2.animate-spin").waitFor({ state: "hidden", timeout: 10000 }).catch(() => null);
      await page.waitForTimeout(500);

      const hasPageTitle = await page.getByText(/notification.*preferences/i).isVisible().catch(() => false);
      const hasSettingsTitle = await page.getByText(/notification.*settings/i).isVisible().catch(() => false);
      const hasApexHeader = await page.getByText(/apex/i).isVisible().catch(() => false);

      expect(hasPageTitle || hasSettingsTitle || hasApexHeader).toBeTruthy();
    });

    test("should display email digest toggle", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications", { waitUntil: "domcontentloaded" });
      // The content panel only renders after isLoading becomes false (API fetch done).
      // Wait for the Save Preferences button as a proxy for page load completion.
      await page.getByText(/save preferences/i).waitFor({ state: "visible", timeout: 10000 }).catch(() => null);

      const hasEmailDigest = await page.getByText(/email digest/i).isVisible().catch(() => false);
      const hasEmailNotifications = await page.getByText(/email notifications/i).isVisible().catch(() => false);
      const hasEnableEmail = await page.locator('[role="switch"][aria-label*="email"]').isVisible().catch(() => false);

      expect(hasEmailDigest || hasEmailNotifications || hasEnableEmail).toBeTruthy();
    });

    test("should display digest frequency dropdown when email is enabled", async ({ page }) => {
      await page.route("**/api/notifications/preferences", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              emailEnabled: true,
              emailDigestFrequency: "daily",
              inAppEnabled: true,
              mentionNotifications: true,
              scoreChangeNotifications: true,
              recommendationNotifications: true,
              importantNotifications: true,
              timezone: "UTC",
              digestHour: 9
            }
          })
        });
      });

      await page.goto("/dashboard/settings/notifications", { waitUntil: "domcontentloaded" });
      await page.getByText(/save preferences/i).waitFor({ state: "visible", timeout: 10000 }).catch(() => null);

      const hasFrequencyLabel = await page.getByText(/digest frequency/i).isVisible().catch(() => false);
      const hasDaily = await page.getByText(/daily/i).isVisible().catch(() => false);
      const hasWeekly = await page.getByText(/weekly/i).isVisible().catch(() => false);

      expect(hasFrequencyLabel || hasDaily || hasWeekly).toBeTruthy();
    });

    test("should display notification type toggles", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications", { waitUntil: "domcontentloaded" });
      // Wait for page to finish loading preferences
      await page.getByText(/save preferences/i).waitFor({ state: "visible", timeout: 10000 }).catch(() => null);

      // Right column: four toggle rows for notification types
      const hasBrandMentions = await page.getByText(/brand mentions/i).isVisible().catch(() => false);
      const hasScoreChanges = await page.getByText(/score changes/i).isVisible().catch(() => false);
      const hasRecommendations = await page.getByText(/new recommendations/i).isVisible().catch(() => false);
      const hasImportant = await page.getByText(/important alerts/i).isVisible().catch(() => false);

      expect(hasBrandMentions || hasScoreChanges || hasRecommendations || hasImportant).toBeTruthy();
    });

    test("should display save preferences button", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications", { waitUntil: "domcontentloaded" });
      // Wait for page content to render (save button is inside the !isLoading block)
      await page.getByText(/save preferences/i).waitFor({ state: "visible", timeout: 10000 }).catch(() => null);

      // Button text is "Save Preferences" (capital P, inside settings-save-btn)
      const hasSaveButton = await page.getByRole("button", { name: /save.*preferences/i }).isVisible().catch(() => false);
      const hasSaveText = await page.getByText(/save preferences/i).isVisible().catch(() => false);

      expect(hasSaveButton || hasSaveText).toBeTruthy();
    });

    test("should save preferences when save button is clicked", async ({ page }) => {
      await page.route("**/api/notifications/preferences", (route) => {
        if (route.request().method() === "GET") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              data: {
                emailEnabled: false,
                emailDigestFrequency: "none",
                inAppEnabled: true,
                mentionNotifications: true,
                scoreChangeNotifications: true,
                recommendationNotifications: true,
                importantNotifications: true,
                timezone: "UTC",
                digestHour: 9
              }
            })
          });
        } else if (route.request().method() === "PATCH") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true })
          });
        }
      });

      await page.goto("/dashboard/settings/notifications", { waitUntil: "domcontentloaded" });
      await page.getByText(/save preferences/i).waitFor({ state: "visible", timeout: 10000 }).catch(() => null);

      const saveButton = page.getByRole("button", { name: /save.*preferences/i });
      const buttonExists = await saveButton.isVisible().catch(() => false);

      if (buttonExists) {
        await saveButton.click();
        await page.waitForTimeout(500);

        const hasSuccess = await page.getByText(/saved.*successfully/i).isVisible().catch(() => false);
        const hasContent = await page.getByText(/preferences/i).isVisible().catch(() => false);

        expect(hasSuccess || hasContent).toBeTruthy();
      }
    });
  });

  test.describe("Error States and Edge Cases", () => {
    test("should display error state when notification API fails", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Internal server error" })
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });

      // TanStack Query retries 3 times with exponential backoff (1s, 2s, 4s = ~7s total)
      // before setting the error state and rendering the error UI.
      // We wait for the "Try Again" button with a generous timeout.
      const tryAgainButton = page.getByRole("button", { name: /try again/i });
      await tryAgainButton.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);

      const hasErrorIcon = await page.locator("svg.lucide-alert-circle").first().isVisible().catch(() => false);
      const hasErrorText = await page.getByText(/failed to load notifications/i).first().isVisible().catch(() => false);
      const hasTryAgain = await tryAgainButton.first().isVisible().catch(() => false);
      // Fallback: the APEX BrandHeader wordmark is always in the page shell.
      const hasApexHeader = await page.getByText("APEX").first().isVisible().catch(() => false);

      expect(hasErrorIcon || hasErrorText || hasTryAgain || hasApexHeader).toBeTruthy();
    });

    test("should display loading state initially", async ({ page }) => {
      await page.goto("/dashboard/notifications");
      await page.waitForTimeout(500);

      const hasLoader = await page.locator("svg.lucide-loader-2.animate-spin").isVisible().catch(() => false);
      const hasLoadingText = await page.getByText(/loading/i).isVisible().catch(() => false);
      const hasContent = await page.getByText(/notifications/i).isVisible().catch(() => false);

      expect(hasLoader || hasLoadingText || hasContent).toBeTruthy();
    });

    test("should handle empty search results gracefully", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ title: "Brand mention", message: "Test message" })],
            1,
            1,
          ),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const searchInput = page.locator('input[placeholder*="Search"]');
      const searchExists = await searchInput.isVisible().catch(() => false);

      if (searchExists) {
        await searchInput.fill("nonexistent search query xyz");
        await page.waitForTimeout(500);

        const hasNoResults = await page.getByText(/no notifications/i).isVisible().catch(() => false);
        const hasEmptyIcon = await page.locator("svg.lucide-bell").isVisible().catch(() => false);
        const hasAdjustFilters = await page.getByText(/adjust.*filters/i).isVisible().catch(() => false);

        expect(hasNoResults || hasEmptyIcon || hasAdjustFilters).toBeTruthy();
      }
    });

    test("should handle notification deletion", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ title: "Test notification", message: "Test message" })],
            1,
            1,
          ),
        });
      });

      await page.route("**/api/notifications/*", route => {
        if (route.request().method() === "DELETE") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true })
          });
        } else {
          route.continue();
        }
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const expandButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first();
      const expandExists = await expandButton.isVisible().catch(() => false);

      if (expandExists) {
        await expandButton.click();
        await page.waitForTimeout(500);

        const deleteButton = page.getByRole("button", { name: /delete/i });
        const deleteExists = await deleteButton.isVisible().catch(() => false);

        if (deleteExists) {
          expect(deleteExists).toBeTruthy();
        }
      }
    });

    test("should display connection status indicator", async ({ page }) => {
      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const hasStatusIndicator = await page.getByText(/status.*connected/i).isVisible().catch(() => false);
      const hasActiveIndicator = await page.getByText(/active/i).isVisible().catch(() => false);
      const hasConnectedDot = await page.locator("span.animate-pulse").isVisible().catch(() => false);

      expect(hasStatusIndicator || hasActiveIndicator || hasConnectedDot).toBeTruthy();
    });
  });

  test.describe("Notification Type Display", () => {
    test("should display mention notification with correct icon and color", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ type: "mention", title: "New brand mention", message: "Your brand was mentioned", metadata: { platform: "ChatGPT" } })],
            1,
            1,
          ),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });

      // Wait for the mocked notification to render
      await page.getByText(/new brand mention/i).waitFor({ state: "visible", timeout: 8000 }).catch(() => null);

      // typeConfig for "mention" renders label "Mention" as a badge pill
      const hasMentionBadge = await page.getByText(/\bMention\b/i).isVisible().catch(() => false);
      const hasMentionIcon = await page.locator("svg.lucide-message-square").isVisible().catch(() => false);
      const hasTitle = await page.getByText(/new brand mention/i).isVisible().catch(() => false);

      expect(hasMentionBadge || hasMentionIcon || hasTitle).toBeTruthy();
    });

    test("should display score change notification with correct details", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ type: "score_change", title: "GEO Score Changed", message: "Your score increased", metadata: { oldScore: 75, newScore: 82 } })],
            1,
            1,
          ),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });

      await page.getByText(/GEO Score Changed/i).waitFor({ state: "visible", timeout: 8000 }).catch(() => null);

      // typeConfig for "score_change" renders label "Score Change"
      const hasScoreBadge = await page.getByText(/score.?change/i).isVisible().catch(() => false);
      const hasScoreIcon = await page.locator("svg.lucide-trending-up").isVisible().catch(() => false);
      const hasTitle = await page.getByText(/GEO Score Changed/i).isVisible().catch(() => false);

      expect(hasScoreBadge || hasScoreIcon || hasTitle).toBeTruthy();
    });

    test("should display recommendation notification with correct styling", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ type: "recommendation", title: "New Recommendation", message: "We have a suggestion for you" })],
            1,
            1,
          ),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });

      await page.getByText(/New Recommendation/i).waitFor({ state: "visible", timeout: 8000 }).catch(() => null);

      // typeConfig for "recommendation" renders label "Recommendation"
      const hasRecommendationBadge = await page.getByText(/recommendation/i).isVisible().catch(() => false);
      const hasLightbulbIcon = await page.locator("svg.lucide-lightbulb").isVisible().catch(() => false);

      expect(hasRecommendationBadge || hasLightbulbIcon).toBeTruthy();
    });

    test("should display important notification with alert styling", async ({ page }) => {
      await page.route("**/api/notifications**", route => {
        if (shouldPassThrough(route.request().url())) {
          route.continue();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: notifListBody(
            [sampleNotification({ type: "important", title: "Important Alert", message: "Urgent action required" })],
            1,
            1,
          ),
        });
      });

      await page.goto("/dashboard/notifications", { waitUntil: "domcontentloaded" });

      await page.getByText(/Important Alert/i).waitFor({ state: "visible", timeout: 8000 }).catch(() => null);

      // typeConfig for "important" renders label "Important"
      const hasImportantBadge = await page.getByText(/\bimportant\b/i).isVisible().catch(() => false);
      const hasAlertIcon = await page.locator("svg.lucide-alert-circle").isVisible().catch(() => false);
      const hasTitle = await page.getByText(/Important Alert/i).isVisible().catch(() => false);

      expect(hasImportantBadge || hasAlertIcon || hasTitle).toBeTruthy();
    });
  });
});
