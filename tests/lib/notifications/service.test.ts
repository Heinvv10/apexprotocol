/**
 * Notification Service Unit Tests
 * Tests for notification service layer
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Redis client - use factory function to avoid hoisting issues
vi.mock("@/lib/redis", () => {
  const mockRedisClient = {
    exists: vi.fn(),
    setex: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  };

  return {
    getRedisClient: () => mockRedisClient,
    publish: vi.fn(),
  };
});

// Mock database
vi.mock("@/lib/db", () => {
  const mockNotification = {
    id: "notif-1",
    userId: "user-1",
    organizationId: "org-1",
    type: "mention",
    title: "New Mention",
    message: "You were mentioned in a post",
    metadata: { brandId: "brand-1", mentionId: "mention-1" },
    isRead: false,
    readAt: null,
    isArchived: false,
    archivedAt: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
  };

  const mockNotificationsList = [
    {
      id: "notif-1",
      userId: "user-1",
      organizationId: "org-1",
      type: "mention",
      title: "New Mention",
      message: "You were mentioned",
      metadata: {},
      isRead: false,
      readAt: null,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "notif-2",
      userId: "user-1",
      organizationId: "org-1",
      type: "score_change",
      title: "Score Changed",
      message: "Your score increased",
      metadata: {},
      isRead: false,
      readAt: null,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date("2024-01-02T00:00:00Z"),
    },
  ];

  const mockPreferences = {
    id: "pref-1",
    userId: "user-1",
    organizationId: "org-1",
    emailEnabled: true,
    emailDigestFrequency: "none",
    inAppEnabled: true,
    mentionNotifications: true,
    scoreChangeNotifications: true,
    recommendationNotifications: true,
    importantNotifications: true,
    timezone: "UTC",
    digestHour: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUnreadNotifications = [
    { id: "notif-1" },
    { id: "notif-2" },
  ];

  const exports: Record<string, unknown> = {
    db: {
      select: vi.fn((fields?: unknown) => ({
        from: vi.fn((table: unknown) => {
          const tableObj = table as Record<string, unknown>;

          // Check if it's notifications table
          const isNotifications = tableObj && "type" in tableObj && "title" in tableObj;

          return {
            where: vi.fn(() => {
              const whereResult = {
                orderBy: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve(mockNotificationsList)),
                })),
                groupBy: vi.fn(() => Promise.resolve([
                  { type: "mention", count: 2 },
                  { type: "score_change", count: 1 },
                ])),
                // Make it thenable so it can be awaited directly
                then: (resolve: (value: any) => void) => {
                  if (fields && typeof fields === "object" && "count" in fields) {
                    // This is a count query
                    return Promise.resolve([{ count: 3 }]).then(resolve);
                  }
                  return Promise.resolve(mockNotificationsList).then(resolve);
                },
              };
              return whereResult;
            }),
          };
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockNotification])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([mockPreferences])),
          })),
        })),
      })),
      query: {
        notificationPreferences: {
          findFirst: vi.fn(() => Promise.resolve(mockPreferences)),
        },
        notifications: {
          findFirst: vi.fn(() => Promise.resolve(mockNotification)),
          findMany: vi.fn(() => Promise.resolve(mockUnreadNotifications)),
        },
      },
    },
    notifications: {
      id: "id",
      userId: "userId",
      organizationId: "organizationId",
      type: "type",
      title: "title",
      message: "message",
      metadata: "metadata",
      isRead: "isRead",
      readAt: "readAt",
      isArchived: "isArchived",
      archivedAt: "archivedAt",
      createdAt: "createdAt",
    },
    notificationPreferences: {
      id: "id",
      userId: "userId",
      organizationId: "organizationId",
      emailEnabled: "emailEnabled",
      emailDigestFrequency: "emailDigestFrequency",
      inAppEnabled: "inAppEnabled",
      mentionNotifications: "mentionNotifications",
      scoreChangeNotifications: "scoreChangeNotifications",
      recommendationNotifications: "recommendationNotifications",
      importantNotifications: "importantNotifications",
      timezone: "timezone",
      digestHour: "digestHour",
    },
    notificationReads: {
      id: "id",
      notificationId: "notificationId",
      userId: "userId",
      readAt: "readAt",
    },
  };

  return exports;
});

// Mock Drizzle ORM helpers
vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn(() => ({})),
    and: vi.fn((...args) => args),
    desc: vi.fn(() => ({})),
    count: vi.fn(() => ({ count: "count" })),
    sql: {},
  };
});

// Mock cuid2
vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => "mock-id-123"),
}));

// Import service after mocks
import { NotificationService } from "@/lib/notifications/service";

describe("NotificationService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getRedisClient, publish } = await import("@/lib/redis");
    const redis = getRedisClient();
    vi.mocked(redis.exists).mockResolvedValue(0);
    vi.mocked(redis.setex).mockResolvedValue("OK");
    vi.mocked(publish).mockResolvedValue(undefined);
  });

  describe("createNotification", () => {
    it("should create and publish a notification successfully", async () => {
      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned in a post",
        metadata: { brandId: "brand-1", mentionId: "mention-1" },
      };

      const result = await NotificationService.createNotification(input);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("notification");
      expect(result.published).toBe(true);
      expect(result.deduplicated).toBe(false);

      const { publish } = await import("@/lib/redis");
      expect(publish).toHaveBeenCalledWith(
        `notifications:${input.userId}`,
        expect.objectContaining({
          type: input.type,
          title: input.title,
          message: input.message,
        })
      );
    });

    it("should deduplicate similar notifications", async () => {
      const { getRedisClient, publish } = await import("@/lib/redis");
      const redis = getRedisClient();
      vi.mocked(redis.exists).mockResolvedValue(1); // Simulate existing notification

      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
        metadata: { mentionId: "mention-1" },
      };

      const result = await NotificationService.createNotification(input);

      expect(result.deduplicated).toBe(true);
      expect(result.published).toBe(false);
      expect(publish).not.toHaveBeenCalled();
    });

    it("should block notification if user preferences disable it", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({
        id: "pref-1",
        userId: "user-1",
        organizationId: "org-1",
        emailEnabled: true,
        emailDigestFrequency: "none",
        emailAddress: null,
        inAppEnabled: false, // Disabled
        mentionNotifications: true,
        scoreChangeNotifications: true,
        recommendationNotifications: true,
        importantNotifications: true,
        timezone: "UTC",
        digestHour: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
      };

      await expect(
        NotificationService.createNotification(input)
      ).rejects.toThrow("Notification blocked by user preferences");
    });

    it("should block notification if specific type is disabled", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({
        id: "pref-1",
        userId: "user-1",
        organizationId: "org-1",
        emailEnabled: true,
        emailDigestFrequency: "none",
        emailAddress: null,
        inAppEnabled: true,
        mentionNotifications: false, // Disabled
        scoreChangeNotifications: true,
        recommendationNotifications: true,
        importantNotifications: true,
        timezone: "UTC",
        digestHour: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
      };

      await expect(
        NotificationService.createNotification(input)
      ).rejects.toThrow("Notification blocked by user preferences");
    });

    it("should handle Redis publish failure gracefully", async () => {
      const { db } = await import("@/lib/db");
      // Reset preferences mock to return default preferences
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({
        id: "pref-1",
        userId: "user-1",
        organizationId: "org-1",
        emailEnabled: true,
        emailDigestFrequency: "none",
        emailAddress: null,
        inAppEnabled: true,
        mentionNotifications: true,
        scoreChangeNotifications: true,
        recommendationNotifications: true,
        importantNotifications: true,
        timezone: "UTC",
        digestHour: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { publish } = await import("@/lib/redis");
      vi.mocked(publish).mockRejectedValue(new Error("Redis error"));

      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
      };

      const result = await NotificationService.createNotification(input);

      expect(result.published).toBe(false);
      expect(result).toHaveProperty("notification");
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count for a user", async () => {
      const result = await NotificationService.getUnreadCount("user-1");

      expect(result).toHaveProperty("count");
      expect(result).toHaveProperty("byType");
      expect(typeof result.count).toBe("number");
      expect(typeof result.byType).toBe("object");
    });

    it("should return count by notification type", async () => {
      const result = await NotificationService.getUnreadCount("user-1");

      expect(result.byType).toHaveProperty("mention");
      expect(result.byType).toHaveProperty("score_change");
    });
  });

  describe("getNotifications", () => {
    it("should retrieve notifications for a user", async () => {
      const result = await NotificationService.getNotifications("user-1");

      expect(result).toHaveProperty("notifications");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("hasMore");
      expect(Array.isArray(result.notifications)).toBe(true);
    });

    it("should support pagination with limit and offset", async () => {
      const result = await NotificationService.getNotifications("user-1", {
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty("notifications");
      expect(result).toHaveProperty("hasMore");
    });

    it("should filter by notification type", async () => {
      const result = await NotificationService.getNotifications("user-1", {
        type: "mention",
      });

      expect(result).toHaveProperty("notifications");
    });

    it("should optionally exclude read notifications", async () => {
      const result = await NotificationService.getNotifications("user-1", {
        includeRead: false,
      });

      expect(result).toHaveProperty("notifications");
    });

    it("should optionally exclude archived notifications", async () => {
      const result = await NotificationService.getNotifications("user-1", {
        includeArchived: false,
      });

      expect(result).toHaveProperty("notifications");
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      await expect(
        NotificationService.markAsRead("notif-1", "user-1")
      ).resolves.toBeUndefined();

      const { db } = await import("@/lib/db");
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const result = await NotificationService.markAllAsRead("user-1");

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("should return 0 if no unread notifications", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.notifications.findMany).mockResolvedValue([]);

      const result = await NotificationService.markAllAsRead("user-1");

      expect(result).toBe(0);
    });

    it("should create read tracking records for each notification", async () => {
      const { db } = await import("@/lib/db");
      // Ensure the mock returns unread notifications
      vi.mocked(db.query.notifications.findMany).mockResolvedValue([
        { id: "notif-1" } as any,
        { id: "notif-2" } as any,
      ]);

      await NotificationService.markAllAsRead("user-1");

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("archiveNotification", () => {
    it("should archive a notification", async () => {
      await expect(
        NotificationService.archiveNotification("notif-1", "user-1")
      ).resolves.toBeUndefined();

      const { db } = await import("@/lib/db");
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("deleteNotification", () => {
    it("should delete (archive) a notification", async () => {
      await expect(
        NotificationService.deleteNotification("notif-1", "user-1")
      ).resolves.toBeUndefined();

      const { db } = await import("@/lib/db");
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("getOrCreatePreferences", () => {
    it("should return existing preferences if found", async () => {
      const result = await NotificationService.getOrCreatePreferences(
        "user-1",
        "org-1"
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("inAppEnabled");
    });

    it("should create default preferences if none exist", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue(
        undefined
      );

      const result = await NotificationService.getOrCreatePreferences(
        "user-1",
        "org-1"
      );

      expect(result).toBeDefined();
    });

    it("should create preferences with correct defaults", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue(
        undefined
      );

      await NotificationService.getOrCreatePreferences("user-1", "org-1");

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("updatePreferences", () => {
    it("should update notification preferences", async () => {
      const updates = {
        emailEnabled: false,
        mentionNotifications: false,
      };

      const result = await NotificationService.updatePreferences(
        "user-1",
        updates
      );

      expect(result).toBeDefined();
      const { db } = await import("@/lib/db");
      expect(db.update).toHaveBeenCalled();
    });

    it("should update email digest frequency", async () => {
      const updates = {
        emailDigestFrequency: "daily" as const,
      };

      await NotificationService.updatePreferences("user-1", updates);

      const { db } = await import("@/lib/db");
      expect(db.update).toHaveBeenCalled();
    });

    it("should update timezone and digest hour", async () => {
      const updates = {
        timezone: "America/New_York",
        digestHour: 14,
      };

      await NotificationService.updatePreferences("user-1", updates);

      const { db } = await import("@/lib/db");
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("Redis deduplication", () => {
    it("should check Redis for duplicate notifications", async () => {
      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
        metadata: { mentionId: "mention-1" },
      };

      await NotificationService.createNotification(input);

      const { getRedisClient } = await import("@/lib/redis");
      const redis = getRedisClient();
      expect(redis.exists).toHaveBeenCalled();
    });

    it("should set deduplication key in Redis after creating notification", async () => {
      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
        metadata: { mentionId: "mention-1" },
      };

      await NotificationService.createNotification(input);

      const { getRedisClient } = await import("@/lib/redis");
      const redis = getRedisClient();
      expect(redis.setex).toHaveBeenCalled();
    });

    it("should handle Redis errors gracefully (fail open)", async () => {
      const { getRedisClient } = await import("@/lib/redis");
      const redis = getRedisClient();
      vi.mocked(redis.exists).mockRejectedValue(new Error("Redis error"));

      const input = {
        userId: "user-1",
        organizationId: "org-1",
        type: "mention" as const,
        title: "New Mention",
        message: "You were mentioned",
      };

      const result = await NotificationService.createNotification(input);

      expect(result).toHaveProperty("notification");
      expect(result.deduplicated).toBe(false);
    });
  });
});
