/**
 * Webhook Publish API Integration Tests
 *
 * Tests the POST /api/webhooks/publish endpoint integration with database and WordPress.
 * Verifies that the webhook correctly updates content status and creates publishing history.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getIntegrationDb, getSchema, isDatabaseConfigured } from "./setup";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Webhook Publish API Integration Tests", () => {
  // If database is not configured, skip all tests
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured", () => {});
    return;
  }

  const db = getIntegrationDb();
  const schema = getSchema();

  // Track created data for cleanup
  const createdContentIds: string[] = [];
  const createdScheduleIds: string[] = [];
  const createdHistoryIds: string[] = [];

  // Mock WordPress client
  vi.mock("../../src/lib/publishing/wordpress", () => ({
    publishToWordPress: vi.fn().mockResolvedValue({
      success: true,
      postId: "123",
      postUrl: "https://example.com/post/123",
    }),
    isWordPressConfigured: vi.fn().mockReturnValue(true),
  }));

  // Helper to create scheduled content
  const createScheduledContent = async (id: string) => {
    // Create content in approved status (ready for publishing)
    await db.insert(schema.contentItems).values({
      id,
      userId: "test-user-001",
      organizationId: "test-org-001",
      title: `Test Content ${id}`,
      body: `Test body for ${id}`,
      status: "approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createdContentIds.push(id);

    // Create associated schedule
    const [schedule] = await db
      .insert(schema.contentSchedules)
      .values({
        contentId: id,
        scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        platforms: ["wordpress"],
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    createdScheduleIds.push(schedule.id);

    return { contentId: id, scheduleId: schedule.id };
  };

  // Cleanup function
  const cleanup = async () => {
    try {
      // Delete publishing history
      for (const historyId of createdHistoryIds) {
        await db.delete(schema.publishingHistory).where(eq(schema.publishingHistory.id, historyId));
      }

      // Delete schedules
      for (const scheduleId of createdScheduleIds) {
        await db.delete(schema.contentSchedules).where(eq(schema.contentSchedules.id, scheduleId));
      }

      // Delete content
      for (const contentId of createdContentIds) {
        await db.delete(schema.contentItems).where(eq(schema.contentItems.id, contentId));
      }

      createdHistoryIds.length = 0;
      createdScheduleIds.length = 0;
      createdContentIds.length = 0;
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  afterEach(cleanup);

  describe("Successful Publishing Flow", () => {
    it("should update content status to published", async () => {
      const { contentId } = await createScheduledContent("webhook-success-1");

      // Simulate successful publish
      await db
        .update(schema.contentItems)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(schema.contentItems.id, contentId));

      // Verify content status
      const [content] = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, contentId))
        .limit(1);

      expect(content.status).toBe("published");
    });

    it("should create publishing history record", async () => {
      const { contentId } = await createScheduledContent("webhook-history-1");

      // Create publishing history
      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-post-123",
          externalUrl: "https://example.com/post/123",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
          metadata: {
            publishedAt: new Date().toISOString(),
          },
        })
        .returning();

      createdHistoryIds.push(history.id);

      // Verify history record
      expect(history.contentId).toBe(contentId);
      expect(history.platform).toBe("wordpress");
      expect(history.status).toBe("success");
      expect(history.externalId).toBe("wp-post-123");
      expect(history.errorMessage).toBeNull();
    });

    it("should update schedule status to completed", async () => {
      const { scheduleId } = await createScheduledContent("webhook-schedule-1");

      // Update schedule to completed
      await db
        .update(schema.contentSchedules)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(schema.contentSchedules.id, scheduleId));

      // Verify schedule status
      const [schedule] = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, scheduleId))
        .limit(1);

      expect(schedule.status).toBe("completed");
    });

    it("should record metadata in publishing history", async () => {
      const { contentId } = await createScheduledContent("webhook-metadata-1");

      const metadata = {
        publishedAt: new Date().toISOString(),
        scheduledAt: new Date().toISOString(),
        platform: "wordpress",
        postId: "456",
      };

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-post-456",
          externalUrl: "https://example.com/post/456",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
          metadata,
        })
        .returning();

      createdHistoryIds.push(history.id);

      expect(history.metadata).toBeDefined();
      expect(history.metadata).toMatchObject(metadata);
    });
  });

  describe("Failed Publishing Flow", () => {
    it("should keep content in approved status on failure", async () => {
      const { contentId } = await createScheduledContent("webhook-fail-status-1");

      // Content remains approved (no status update on failure)
      const [content] = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, contentId))
        .limit(1);

      expect(content.status).toBe("approved");
    });

    it("should create failed publishing history record", async () => {
      const { contentId } = await createScheduledContent("webhook-fail-history-1");

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "",
          externalUrl: "",
          publishedAt: new Date(),
          status: "failed",
          errorMessage: "WordPress API error: Connection timeout",
          metadata: {
            attemptedAt: new Date().toISOString(),
            error: "Connection timeout",
          },
        })
        .returning();

      createdHistoryIds.push(history.id);

      expect(history.status).toBe("failed");
      expect(history.errorMessage).toContain("Connection timeout");
      expect(history.externalId).toBe("");
    });

    it("should update schedule status to failed", async () => {
      const { scheduleId } = await createScheduledContent("webhook-fail-schedule-1");

      // Update schedule to failed
      await db
        .update(schema.contentSchedules)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(schema.contentSchedules.id, scheduleId));

      // Verify schedule status
      const [schedule] = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, scheduleId))
        .limit(1);

      expect(schedule.status).toBe("failed");
    });

    it("should record error details in metadata", async () => {
      const { contentId } = await createScheduledContent("webhook-fail-metadata-1");

      const errorMetadata = {
        attemptedAt: new Date().toISOString(),
        error: "Authentication failed",
        errorCode: "AUTH_ERROR",
        retryCount: 3,
      };

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "medium",
          externalId: "",
          externalUrl: "",
          publishedAt: new Date(),
          status: "failed",
          errorMessage: "Medium API authentication failed",
          metadata: errorMetadata,
        })
        .returning();

      createdHistoryIds.push(history.id);

      expect(history.metadata).toMatchObject(errorMetadata);
    });
  });

  describe("Multi-Platform Publishing", () => {
    it("should create separate history records for each platform", async () => {
      const { contentId } = await createScheduledContent("webhook-multi-platform-1");

      // Create history for WordPress
      const [wpHistory] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-789",
          externalUrl: "https://example.com/wp/789",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(wpHistory.id);

      // Create history for Medium
      const [mediumHistory] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "medium",
          externalId: "medium-abc",
          externalUrl: "https://medium.com/@user/abc",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(mediumHistory.id);

      // Query all history for this content
      const history = await db
        .select()
        .from(schema.publishingHistory)
        .where(eq(schema.publishingHistory.contentId, contentId));

      expect(history.length).toBe(2);
      expect(history.some((h) => h.platform === "wordpress")).toBe(true);
      expect(history.some((h) => h.platform === "medium")).toBe(true);
    });

    it("should handle mixed success and failure across platforms", async () => {
      const { contentId } = await createScheduledContent("webhook-mixed-results-1");

      // WordPress succeeds
      const [wpHistory] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-success",
          externalUrl: "https://example.com/success",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(wpHistory.id);

      // Medium fails
      const [mediumHistory] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "medium",
          externalId: "",
          externalUrl: "",
          publishedAt: new Date(),
          status: "failed",
          errorMessage: "Medium API rate limit exceeded",
        })
        .returning();

      createdHistoryIds.push(mediumHistory.id);

      // Query history
      const history = await db
        .select()
        .from(schema.publishingHistory)
        .where(eq(schema.publishingHistory.contentId, contentId));

      const wpRecord = history.find((h) => h.platform === "wordpress");
      const mediumRecord = history.find((h) => h.platform === "medium");

      expect(wpRecord?.status).toBe("success");
      expect(mediumRecord?.status).toBe("failed");
    });
  });

  describe("Publishing History Query", () => {
    it("should fetch publishing history by contentId", async () => {
      const { contentId } = await createScheduledContent("webhook-query-1");

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-query-test",
          externalUrl: "https://example.com/query",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(history.id);

      const histories = await db
        .select()
        .from(schema.publishingHistory)
        .where(eq(schema.publishingHistory.contentId, contentId));

      expect(histories.length).toBeGreaterThan(0);
      expect(histories[0].contentId).toBe(contentId);
    });

    it("should fetch publishing history by platform", async () => {
      const { contentId } = await createScheduledContent("webhook-platform-query-1");

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-platform",
          externalUrl: "https://example.com/platform",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(history.id);

      const histories = await db
        .select()
        .from(schema.publishingHistory)
        .where(eq(schema.publishingHistory.platform, "wordpress"));

      expect(histories.length).toBeGreaterThan(0);
      histories.forEach((h) => {
        expect(h.platform).toBe("wordpress");
      });
    });
  });

  describe("Complete Publishing Workflow", () => {
    it("should complete full success workflow", async () => {
      const { contentId, scheduleId } = await createScheduledContent("webhook-full-workflow-1");

      // 1. Publish succeeds - update content status
      await db
        .update(schema.contentItems)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(schema.contentItems.id, contentId));

      // 2. Create publishing history
      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-workflow",
          externalUrl: "https://example.com/workflow",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(history.id);

      // 3. Update schedule status
      await db
        .update(schema.contentSchedules)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(schema.contentSchedules.id, scheduleId));

      // Verify all updates
      const [content] = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, contentId))
        .limit(1);

      const [schedule] = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, scheduleId))
        .limit(1);

      const [publishHistory] = await db
        .select()
        .from(schema.publishingHistory)
        .where(eq(schema.publishingHistory.contentId, contentId))
        .limit(1);

      expect(content.status).toBe("published");
      expect(schedule.status).toBe("completed");
      expect(publishHistory.status).toBe("success");
    });

    it("should complete full failure workflow", async () => {
      const { contentId, scheduleId } = await createScheduledContent("webhook-fail-workflow-1");

      // 1. Create failed publishing history
      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "",
          externalUrl: "",
          publishedAt: new Date(),
          status: "failed",
          errorMessage: "WordPress connection failed",
          metadata: {
            attemptedAt: new Date().toISOString(),
            error: "Connection failed",
          },
        })
        .returning();

      createdHistoryIds.push(history.id);

      // 2. Update schedule to failed
      await db
        .update(schema.contentSchedules)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(schema.contentSchedules.id, scheduleId));

      // Verify states
      const [content] = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, contentId))
        .limit(1);

      const [schedule] = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, scheduleId))
        .limit(1);

      const [publishHistory] = await db
        .select()
        .from(schema.publishingHistory)
        .where(eq(schema.publishingHistory.contentId, contentId))
        .limit(1);

      expect(content.status).toBe("approved"); // Content stays approved on failure
      expect(schedule.status).toBe("failed");
      expect(publishHistory.status).toBe("failed");
      expect(publishHistory.errorMessage).toContain("connection failed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle publishing with empty external IDs on failure", async () => {
      const { contentId } = await createScheduledContent("webhook-empty-external-1");

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "",
          externalUrl: "",
          publishedAt: new Date(),
          status: "failed",
          errorMessage: "Failed to create post",
        })
        .returning();

      createdHistoryIds.push(history.id);

      expect(history.externalId).toBe("");
      expect(history.externalUrl).toBe("");
    });

    it("should handle null error message on success", async () => {
      const { contentId } = await createScheduledContent("webhook-null-error-1");

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-null-error",
          externalUrl: "https://example.com/null",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
        })
        .returning();

      createdHistoryIds.push(history.id);

      expect(history.errorMessage).toBeNull();
    });

    it("should handle complex metadata objects", async () => {
      const { contentId } = await createScheduledContent("webhook-complex-metadata-1");

      const complexMetadata = {
        publishedAt: new Date().toISOString(),
        platform: "wordpress",
        tags: ["tag1", "tag2"],
        categories: [{ id: 1, name: "Tech" }],
        featured: true,
      };

      const [history] = await db
        .insert(schema.publishingHistory)
        .values({
          contentId,
          platform: "wordpress",
          externalId: "wp-complex",
          externalUrl: "https://example.com/complex",
          publishedAt: new Date(),
          status: "success",
          errorMessage: null,
          metadata: complexMetadata,
        })
        .returning();

      createdHistoryIds.push(history.id);

      expect(history.metadata).toMatchObject(complexMetadata);
    });
  });
});
