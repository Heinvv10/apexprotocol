/**
 * Notification API Route Unit Tests
 * Tests for /api/notifications endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { GET as getNotificationById, DELETE as deleteNotificationById } from "@/app/api/notifications/[id]/route";
import { PATCH as markAsRead, DELETE as markAsUnread } from "@/app/api/notifications/[id]/read/route";
import { PATCH as archiveNotification, DELETE as unarchiveNotification } from "@/app/api/notifications/[id]/archive/route";
import { PATCH as markAllAsRead } from "@/app/api/notifications/read-all/route";
import { GET as getUnreadCount } from "@/app/api/notifications/unread-count/route";
import { GET as getPreferences, PATCH as updatePreferences } from "@/app/api/notifications/preferences/route";

// Set DATABASE_URL to make isDatabaseConfigured() return true
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock auth
vi.mock("@/lib/auth/supabase-server", () => ({
  getUserId: vi.fn(() => Promise.resolve("demo-user")),
  getOrganizationId: vi.fn(() => Promise.resolve("demo-org")),
}));

vi.mock("@/lib/auth/supabase-server", () => ({
  getUserId: vi.fn(() => Promise.resolve("demo-user")),
  getOrganizationId: vi.fn(() => Promise.resolve("demo-org")),
}));

// Mock notification service
vi.mock("@/lib/notifications/service", () => ({
  getOrCreatePreferences: vi.fn(async (userId: string, orgId: string) => ({
    id: "pref-1",
    userId,
    organizationId: orgId,
    emailEnabled: true,
    emailDigestFrequency: "daily",
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
  })),
  updatePreferences: vi.fn(async (userId: string, data: any) => ({
    id: "pref-1",
    userId,
    organizationId: "demo-org",
    emailEnabled: data.emailEnabled ?? true,
    emailDigestFrequency: data.emailDigestFrequency ?? "daily",
    emailAddress: data.emailAddress ?? null,
    inAppEnabled: data.inAppEnabled ?? true,
    mentionNotifications: data.mentionNotifications ?? true,
    scoreChangeNotifications: data.scoreChangeNotifications ?? true,
    recommendationNotifications: data.recommendationNotifications ?? true,
    importantNotifications: data.importantNotifications ?? true,
    timezone: data.timezone ?? "UTC",
    digestHour: data.digestHour ?? 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}));

// Mock database
vi.mock("@/lib/db", () => {
  const mockNotifications = [
    {
      id: "notif-1",
      userId: "demo-user",
      organizationId: "demo-org",
      type: "mention",
      title: "New mention on ChatGPT",
      message: "Your brand was mentioned in ChatGPT",
      metadata: { platform: "ChatGPT", brandName: "Acme Corp" },
      isRead: false,
      readAt: null,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date("2025-01-01T10:00:00Z"),
    },
    {
      id: "notif-2",
      userId: "demo-user",
      organizationId: "demo-org",
      type: "score_change",
      title: "GEO Score increased",
      message: "Your GEO score increased by 10 points",
      metadata: { oldScore: 50, newScore: 60, scoreChange: 10 },
      isRead: true,
      readAt: new Date("2025-01-01T11:00:00Z"),
      isArchived: false,
      archivedAt: null,
      createdAt: new Date("2025-01-01T09:00:00Z"),
    },
    {
      id: "notif-3",
      userId: "demo-user",
      organizationId: "demo-org",
      type: "recommendation",
      title: "New recommendation",
      message: "A new recommendation is available",
      metadata: { recommendationId: "rec-1" },
      isRead: false,
      readAt: null,
      isArchived: true,
      archivedAt: new Date("2025-01-01T12:00:00Z"),
      createdAt: new Date("2025-01-01T08:00:00Z"),
    },
  ];

  const mockPreferences = {
    id: "pref-1",
    userId: "demo-user",
    organizationId: "demo-org",
    emailEnabled: true,
    emailDigestFrequency: "daily",
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
  };

  const mockNotificationReads: any[] = [];

  const exports: Record<string, unknown> = {
    db: {
      select: vi.fn((fields?: unknown) => ({
        from: vi.fn((table: unknown) => {
          const tableObj = table as Record<string, unknown>;

          // Check if it's notificationReads table
          const isReads = tableObj && "notificationId" in tableObj;
          // Check if it's notificationPreferences table
          const isPrefs = tableObj && "emailDigestFrequency" in tableObj;
          // Check if this is a count query by looking at the fields parameter
          const isCountQuery = fields && typeof fields === "object" && "count" in fields;

          return {
            where: vi.fn((condition: unknown) => {
              // Create thenable object that can be awaited directly OR chained with .limit()
              const whereResult = {
                limit: vi.fn((limitNum: number) => {
                  if (isReads) return Promise.resolve(mockNotificationReads);
                  if (isPrefs) return Promise.resolve([mockPreferences]);
                  if (isCountQuery) return Promise.resolve([{ count: 2 }]);
                  // For notifications table
                  return Promise.resolve(mockNotifications.slice(0, limitNum));
                }),
                orderBy: vi.fn(() => ({
                  limit: vi.fn((limitNum: number) => ({
                    offset: vi.fn((offsetNum: number) => Promise.resolve(mockNotifications.slice(offsetNum, offsetNum + limitNum))),
                  })),
                })),
                // Make it thenable so it can be awaited directly
                then: (resolve: (value: any) => void) => {
                  if (isReads) return Promise.resolve(mockNotificationReads).then(resolve);
                  if (isPrefs) return Promise.resolve([mockPreferences]).then(resolve);
                  if (isCountQuery) return Promise.resolve([{ count: 2 }]).then(resolve);
                  return Promise.resolve(mockNotifications).then(resolve);
                },
              };

              return whereResult;
            }),
            orderBy: vi.fn(() => ({
              limit: vi.fn((limitNum: number) => ({
                offset: vi.fn((offsetNum: number) => Promise.resolve(mockNotifications.slice(offsetNum, offsetNum + limitNum))),
              })),
            })),
            limit: vi.fn((limitNum: number) => {
              if (isReads) return Promise.resolve(mockNotificationReads);
              if (isPrefs) return Promise.resolve([mockPreferences]);
              if (isCountQuery) return Promise.resolve([{ count: 2 }]);
              return Promise.resolve(mockNotifications.slice(0, limitNum));
            }),
          };
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(mockNotificationReads)),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{
              ...mockNotifications[0],
              isRead: true,
              readAt: new Date(),
            }])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
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
      emailAddress: "emailAddress",
      inAppEnabled: "inAppEnabled",
      mentionNotifications: "mentionNotifications",
      scoreChangeNotifications: "scoreChangeNotifications",
      recommendationNotifications: "recommendationNotifications",
      importantNotifications: "importantNotifications",
      timezone: "timezone",
      digestHour: "digestHour",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
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
    count: vi.fn(() => "count_column"), // Returns a column reference, not the result
  };
});

describe("Notification API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("should return notifications for authenticated user", async () => {
      const url = new URL("http://localhost:3000/api/notifications?limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notifications).toBeDefined();
      expect(Array.isArray(data.data.notifications)).toBe(true);
    });

    it("should support pagination with limit and offset", async () => {
      const url = new URL("http://localhost:3000/api/notifications?limit=10&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.meta).toBeDefined();
      expect(data.data.meta.limit).toBe(10);
      expect(data.data.meta.offset).toBe(0);
    });

    it("should filter by notification type", async () => {
      const url = new URL("http://localhost:3000/api/notifications?type=mention&limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should filter by read status", async () => {
      const url = new URL("http://localhost:3000/api/notifications?isRead=false&limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should filter by archived status", async () => {
      const url = new URL("http://localhost:3000/api/notifications?isArchived=true&limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return total count in metadata", async () => {
      const url = new URL("http://localhost:3000/api/notifications?limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.meta.total).toBeDefined();
    });
  });

  describe("GET /api/notifications/[id]", () => {
    it("should return a single notification by ID", async () => {
      const request = new Request("http://localhost:3000/api/notifications/notif-1");
      const params = Promise.resolve({ id: "notif-1" });
      const response = await getNotificationById(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it("should return 404 for non-existent notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/non-existent");
      const params = Promise.resolve({ id: "non-existent" });
      const response = await getNotificationById(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Notification not found");
    });
  });

  describe("DELETE /api/notifications/[id]", () => {
    it("should delete a notification", async () => {
      const request = new Request("http://localhost:3000/api/notifications/notif-1");
      const params = Promise.resolve({ id: "notif-1" });
      const response = await deleteNotificationById(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Notification deleted successfully");
    });

    it("should return 404 when deleting non-existent notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/non-existent");
      const params = Promise.resolve({ id: "non-existent" });
      const response = await deleteNotificationById(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("PATCH /api/notifications/[id]/read", () => {
    it("should mark notification as read", async () => {
      const request = new Request("http://localhost:3000/api/notifications/notif-1/read");
      const params = Promise.resolve({ id: "notif-1" });
      const response = await markAsRead(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("marked as read");
    });

    it("should handle already read notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: "notif-2",
              userId: "demo-user",
              organizationId: "demo-org",
              isRead: true,
              readAt: new Date(),
            }])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/notif-2/read");
      const params = Promise.resolve({ id: "notif-2" });
      const response = await markAsRead(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Notification already marked as read");
    });

    it("should return 404 for non-existent notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/non-existent/read");
      const params = Promise.resolve({ id: "non-existent" });
      const response = await markAsRead(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE /api/notifications/[id]/read", () => {
    it("should mark notification as unread", async () => {
      const request = new Request("http://localhost:3000/api/notifications/notif-2/read");
      const params = Promise.resolve({ id: "notif-2" });
      const response = await markAsUnread(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Notification marked as unread");
    });

    it("should return 404 for non-existent notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/non-existent/read");
      const params = Promise.resolve({ id: "non-existent" });
      const response = await markAsUnread(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("PATCH /api/notifications/[id]/archive", () => {
    it("should archive notification", async () => {
      const request = new Request("http://localhost:3000/api/notifications/notif-1/archive");
      const params = Promise.resolve({ id: "notif-1" });
      const response = await archiveNotification(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Notification archived");
    });

    it("should handle already archived notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: "notif-3",
              userId: "demo-user",
              organizationId: "demo-org",
              isArchived: true,
              archivedAt: new Date(),
            }])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/notif-3/archive");
      const params = Promise.resolve({ id: "notif-3" });
      const response = await archiveNotification(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Notification already archived");
    });

    it("should return 404 for non-existent notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/non-existent/archive");
      const params = Promise.resolve({ id: "non-existent" });
      const response = await archiveNotification(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE /api/notifications/[id]/archive", () => {
    it("should unarchive notification", async () => {
      const request = new Request("http://localhost:3000/api/notifications/notif-3/archive");
      const params = Promise.resolve({ id: "notif-3" });
      const response = await unarchiveNotification(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Notification unarchived");
    });

    it("should return 404 for non-existent notification", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/non-existent/archive");
      const params = Promise.resolve({ id: "non-existent" });
      const response = await unarchiveNotification(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("should mark all unread notifications as read", async () => {
      const request = new Request("http://localhost:3000/api/notifications/read-all");
      const response = await markAllAsRead(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBeDefined();
    });

    it("should handle case with no unread notifications", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any));

      const request = new Request("http://localhost:3000/api/notifications/read-all");
      const response = await markAllAsRead(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("No unread notifications to mark as read");
      expect(data.data.count).toBe(0);
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("should return unread notification count", async () => {
      const request = new Request("http://localhost:3000/api/notifications/unread-count");
      const response = await getUnreadCount(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBeDefined();
      expect(typeof data.data.count).toBe("number");
    });
  });

  describe("GET /api/notifications/preferences", () => {
    it("should return user notification preferences", async () => {
      const request = new Request("http://localhost:3000/api/notifications/preferences");
      const response = await getPreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.emailEnabled).toBeDefined();
      expect(data.data.emailDigestFrequency).toBeDefined();
      expect(data.data.inAppEnabled).toBeDefined();
    });

    it("should create default preferences if none exist", async () => {
      const request = new Request("http://localhost:3000/api/notifications/preferences");
      const response = await getPreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.emailEnabled).toBe(true);
      expect(data.data.inAppEnabled).toBe(true);
    });

    it("should include meta information", async () => {
      const request = new Request("http://localhost:3000/api/notifications/preferences");
      const response = await getPreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta).toBeDefined();
      expect(data.meta.timestamp).toBeDefined();
    });
  });

  describe("PATCH /api/notifications/preferences", () => {
    it("should update user notification preferences", async () => {
      const requestBody = {
        emailEnabled: false,
        emailDigestFrequency: "weekly",
        mentionNotifications: false,
      };

      const request = new Request("http://localhost:3000/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      });

      const response = await updatePreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.message).toBe("Notification preferences updated successfully");
    });

    it("should validate preference data", async () => {
      const requestBody = {
        emailDigestFrequency: "invalid-value", // Invalid enum value
      };

      const request = new Request("http://localhost:3000/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      });

      const response = await updatePreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation error");
      expect(data.details).toBeDefined();
    });

    it("should allow partial updates", async () => {
      const requestBody = {
        timezone: "America/New_York",
      };

      const request = new Request("http://localhost:3000/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      });

      const response = await updatePreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should validate email format when provided", async () => {
      const requestBody = {
        emailAddress: "invalid-email",
      };

      const request = new Request("http://localhost:3000/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      });

      const response = await updatePreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should validate digestHour range (0-23)", async () => {
      const requestBody = {
        digestHour: 25, // Invalid hour
      };

      const request = new Request("http://localhost:3000/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      });

      const response = await updatePreferences(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      const { getUserId } = await import("@/lib/auth/supabase-server");
      vi.mocked(getUserId).mockResolvedValueOnce(null);

      const url = new URL("http://localhost:3000/api/notifications?limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when organization is not found", async () => {
      const { getOrganizationId } = await import("@/lib/auth/supabase-server");
      vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

      const url = new URL("http://localhost:3000/api/notifications?limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      const { db } = await import("@/lib/db");
      vi.spyOn(db, "select").mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const url = new URL("http://localhost:3000/api/notifications?limit=50&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it("should handle invalid request parameters", async () => {
      const url = new URL("http://localhost:3000/api/notifications?limit=invalid&offset=0");
      const request = {
        nextUrl: { searchParams: url.searchParams },
      } as any;
      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
