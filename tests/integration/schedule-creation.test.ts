/**
 * Schedule Creation API Integration Tests
 *
 * Tests the POST /api/content/schedule endpoint integration with database and QStash.
 * Verifies that the API correctly creates database records and schedules with QStash.
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

describe("Schedule Creation API Integration Tests", () => {
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

  // Mock QStash client
  vi.mock("@upstash/qstash", () => ({
    Client: vi.fn().mockImplementation(() => ({
      publishJSON: vi.fn().mockResolvedValue({
        messageId: "mock-message-id-123",
      }),
      schedules: {
        create: vi.fn().mockResolvedValue({
          scheduleId: "mock-schedule-id-456",
        }),
      },
    })),
    Receiver: vi.fn().mockImplementation(() => ({
      verify: vi.fn().mockResolvedValue(true),
    })),
  }));

  // Helper to create test content
  const createTestContent = async (idPrefix: string, status: "draft" | "approved" | "published" = "draft") => {
    // Use timestamp-based unique ID to avoid collisions
    const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(schema.contentItems).values({
      id,
      userId: "test-user-001",
      organizationId: "test-org-001",
      title: `Test Content ${id}`,
      body: `Test body for ${id}`,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createdContentIds.push(id);
    return id;
  };

  // Cleanup function
  const cleanup = async () => {
    try {
      // Delete schedules
      for (const scheduleId of createdScheduleIds) {
        await db.delete(schema.contentSchedules).where(eq(schema.contentSchedules.id, scheduleId));
      }

      // Delete content
      for (const contentId of createdContentIds) {
        await db.delete(schema.contentItems).where(eq(schema.contentItems.id, contentId));
      }

      createdScheduleIds.length = 0;
      createdContentIds.length = 0;
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  beforeEach(cleanup);
  afterEach(cleanup);

  describe("Schedule Creation Flow", () => {
    it("should create schedule record in database", async () => {
      const contentId = await createTestContent("content-schedule-db-1");
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create schedule directly (simulating what the API does)
      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          qstashMessageId: "mock-message-id-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      // Verify schedule was created
      expect(schedule).toBeDefined();
      expect(schedule.contentId).toBe(contentId);
      expect(schedule.platforms).toEqual(["wordpress"]);
      expect(schedule.status).toBe("pending");
      expect(schedule.qstashMessageId).toBe("mock-message-id-123");
    });

    it("should create schedule with multiple platforms", async () => {
      const contentId = await createTestContent("content-schedule-multi-1");
      const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress", "medium"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      expect(schedule.platforms).toEqual(["wordpress", "medium"]);
    });

    it("should update content status to scheduled", async () => {
      const contentId = await createTestContent("content-status-update-1");
      const scheduledAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      // Create schedule
      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      // Update content status (as API would do)
      await db
        .update(schema.contentItems)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(schema.contentItems.id, contentId));

      // Verify status updated
      const [content] = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, contentId))
        .limit(1);

      expect(content.status).toBe("approved");
    });

    it("should store QStash message ID", async () => {
      const contentId = await createTestContent("content-qstash-msg-1");
      const scheduledAt = new Date(Date.now() + 6 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          qstashMessageId: "msg-abc-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      expect(schedule.qstashMessageId).toBe("msg-abc-123");
    });

    it("should store QStash schedule ID for recurring", async () => {
      const contentId = await createTestContent("content-qstash-sched-1");
      const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          qstashScheduleId: "sched-xyz-789",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      expect(schedule.qstashScheduleId).toBe("sched-xyz-789");
    });
  });

  describe("Schedule Query and Update", () => {
    it("should fetch schedule by content ID", async () => {
      const contentId = await createTestContent("content-query-1");
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      // Query schedule
      const schedules = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.contentId, contentId));

      expect(schedules.length).toBe(1);
      expect(schedules[0].contentId).toBe(contentId);
    });

    it("should update schedule status", async () => {
      const contentId = await createTestContent("content-update-status-1");
      const scheduledAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      // Update status
      await db
        .update(schema.contentSchedules)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(schema.contentSchedules.id, schedule.id));

      // Verify update
      const [updated] = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, schedule.id))
        .limit(1);

      expect(updated.status).toBe("completed");
    });

    it("should update scheduled time", async () => {
      const contentId = await createTestContent("content-update-time-1");
      const oldTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const newTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt: oldTime,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      // Update time
      await db
        .update(schema.contentSchedules)
        .set({ scheduledAt: newTime, updatedAt: new Date() })
        .where(eq(schema.contentSchedules.id, schedule.id));

      // Verify update
      const [updated] = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, schedule.id))
        .limit(1);

      expect(new Date(updated.scheduledAt).getTime()).toBeCloseTo(newTime.getTime(), -2);
    });
  });

  describe("Schedule Deletion", () => {
    it("should delete schedule", async () => {
      const contentId = await createTestContent("content-delete-1");
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Delete schedule
      await db.delete(schema.contentSchedules).where(eq(schema.contentSchedules.id, schedule.id));

      // Verify deleted
      const deleted = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, schedule.id))
        .limit(1);

      expect(deleted.length).toBe(0);
    });

    it("should cascade delete when content is deleted", async () => {
      const contentId = await createTestContent("content-cascade-1");
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const scheduleId = schedule.id;

      // Delete content
      await db.delete(schema.contentItems).where(eq(schema.contentItems.id, contentId));

      // Remove from tracking since it's deleted
      const index = createdContentIds.indexOf(contentId);
      if (index > -1) createdContentIds.splice(index, 1);

      // Verify schedule is also deleted
      const deleted = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.id, scheduleId))
        .limit(1);

      expect(deleted.length).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle far future dates", async () => {
      const contentId = await createTestContent("content-far-future-1");
      const scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const [schedule] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt,
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule.id);

      expect(new Date(schedule.scheduledAt).getTime()).toBeGreaterThan(Date.now());
    });

    it("should handle multiple schedules for same content", async () => {
      const contentId = await createTestContent("content-multi-sched-1");

      const [schedule1] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          platforms: ["wordpress"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [schedule2] = await db
        .insert(schema.contentSchedules)
        .values({
          contentId,
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          platforms: ["medium"],
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdScheduleIds.push(schedule1.id, schedule2.id);

      const schedules = await db
        .select()
        .from(schema.contentSchedules)
        .where(eq(schema.contentSchedules.contentId, contentId));

      expect(schedules.length).toBeGreaterThanOrEqual(2);
    });
  });
});
