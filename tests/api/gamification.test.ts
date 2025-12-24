/**
 * Gamification API Route Unit Tests
 * Tests for /api/gamification endpoint
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("@/lib/db", () => {
  const mockGamificationRecord = {
    id: "user-gam-1",
    userId: "demo-user",
    organizationId: "demo-org",
    currentXP: 500,
    totalXP: 1500,
    level: 2,
    streaks: { currentDaily: 3, longestDaily: 5, currentWeekly: 1, longestWeekly: 2, lastLoginDate: "", lastWeekStartDate: "" },
    stats: { totalAudits: 5, totalMentions: 10, totalContent: 3, totalRecommendations: 0, recommendationsCompleted: 0, brandsCreated: 1, reportsGenerated: 2, integrationsConnected: 0, teamMembersInvited: 0, crisesResolved: 0, geoScoreImprovements: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLeaderboardData = [
    {
      id: "user-gam-1",
      userId: "demo-user",
      totalXP: 1500,
      level: 2,
      streaks: { currentDaily: 3, longestDaily: 5 },
    },
    {
      id: "user-gam-2",
      userId: "user_2",
      totalXP: 1200,
      level: 2,
      streaks: { currentDaily: 2, longestDaily: 4 },
    },
  ];

  const mockUserData = [
    { name: "Test User", email: "test@example.com" },
  ];

  const mockAchievements = [
    {
      id: "ach-1",
      userId: "demo-user",
      achievementId: "first_audit",
      unlockedAt: new Date(),
      xpAwarded: 100,
    },
  ];

  const exports: Record<string, unknown> = {
    db: {
      select: vi.fn((fields?: unknown) => ({
        from: vi.fn((table: unknown) => {
          // Detect table by checking which mock table schema it is
          const tableObj = table as Record<string, unknown>;

          // Check if it's userAchievements table (has achievementId field)
          const isAchievements = tableObj && "achievementId" in tableObj;
          // Check if it's users table (has email/clerkUserId or name fields)
          const isUsers = tableObj && ("email" in tableObj || "clerkUserId" in tableObj || "name" in tableObj);

          return {
            where: vi.fn((condition: unknown) => {
              // Detect table type for where() responses
              const tbl = table as Record<string, unknown>;
              const isAch = tbl && "achievementId" in tbl;
              const isUsr = tbl && ("email" in tbl || "clerkUserId" in tbl || "name" in tbl);

              // Create thenable object that can be awaited directly OR chained with .limit()
              const whereResult = {
                limit: vi.fn(() => {
                  if (isAch) return Promise.resolve(mockAchievements);
                  if (isUsr) return Promise.resolve(mockUserData);
                  return Promise.resolve([mockGamificationRecord]);
                }),
                // Make it thenable so it can be awaited directly
                then: (resolve: (value: any) => void) => {
                  if (isAch) return Promise.resolve(mockAchievements).then(resolve);
                  if (isUsr) return Promise.resolve(mockUserData).then(resolve);
                  return Promise.resolve([mockGamificationRecord]).then(resolve);
                },
              };

              return whereResult;
            }),
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve(mockLeaderboardData)),
            })),
            limit: vi.fn(() => {
              // select().from(userGamification).limit(1) - for single user progress
              return Promise.resolve([mockGamificationRecord]);
            }),
          };
        }),
      })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockGamificationRecord])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    },
    userGamification: {
    id: "id",
    userId: "userId",
    totalXP: "totalXP",
    level: "level",
    streaks: "streaks",
  },
  userAchievements: {
    id: "id",
    userId: "userId",
    achievementId: "achievementId",
    unlockedAt: "unlockedAt",
    xpAwarded: "xpAwarded",
  },
  users: {
    name: "name",
    email: "email",
    clerkUserId: "clerkUserId",
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
    desc: vi.fn(() => ({})),
  };
});

// Mock gamification module
vi.mock("@/lib/gamification", () => ({
  gamificationEngine: {
    getLevelForXP: vi.fn((xp: number) => ({
      level: Math.floor(xp / 1000) + 1,
      name: "Test Level",
      xpRequired: Math.floor(xp / 1000) * 1000,
      badge: "badge",
    })),
    getLevelProgress: vi.fn(() => ({
      currentLevelXP: 500,
      nextLevelXP: 1000,
      progress: 50,
    })),
    getNextLevel: vi.fn(() => ({
      level: 2,
      name: "Next Level",
      xpRequired: 1000,
      badge: "badge",
    })),
    getLeaderboardPosition: vi.fn(() => ({
      rank: 1,
      percentile: 99,
    })),
    getAchievementsWithStatus: vi.fn(() => [
      { id: "first_audit", name: "First Audit", category: "audit", unlocked: true, xpReward: 100 },
      { id: "content_creator", name: "Content Creator", category: "content", unlocked: false, xpReward: 50 },
    ]),
    processAction: vi.fn((actionType, progress) => ({
      updatedProgress: {
        ...progress,
        totalXP: progress.totalXP + 25,
        currentXP: progress.currentXP + 25,
      },
      result: {
        xpAwarded: 25,
        bonusXP: 0,
        streakBonus: 0,
        leveledUp: false,
        achievementsUnlocked: [],
      },
    })),
    updateDailyStreak: vi.fn((progress) => ({
      ...progress,
      streaks: { ...progress.streaks, currentDaily: progress.streaks.currentDaily + 1 },
    })),
  },
  createInitialProgress: vi.fn((userId: string, orgId: string) => ({
    userId,
    organizationId: orgId,
    totalXP: 0,
    currentXP: 0,
    level: 1,
    achievements: [],
    stats: { auditsCompleted: 0, contentCreated: 0 },
    streaks: { currentDaily: 0, longestDaily: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  ACHIEVEMENTS: [
    { id: "first_audit", name: "First Audit", category: "audit", xpReward: 100 },
    { id: "content_creator", name: "Content Creator", category: "content", xpReward: 50 },
  ],
  LEVELS: [
    { level: 1, name: "Beginner", xpRequired: 0, badge: "badge1" },
    { level: 2, name: "Intermediate", xpRequired: 1000, badge: "badge2" },
    { level: 3, name: "Advanced", xpRequired: 2000, badge: "badge3" },
    { level: 4, name: "Expert", xpRequired: 3000, badge: "badge4" },
    { level: 5, name: "Master", xpRequired: 4000, badge: "badge5" },
    { level: 6, name: "Champion", xpRequired: 5000, badge: "badge6" },
    { level: 7, name: "Legend", xpRequired: 6000, badge: "badge7" },
    { level: 8, name: "Mythic", xpRequired: 7000, badge: "badge8" },
    { level: 9, name: "Divine", xpRequired: 8000, badge: "badge9" },
    { level: 10, name: "Transcendent", xpRequired: 9000, badge: "badge10" },
  ],
  ACTION_XP_CONFIG: [
    { action: "daily_login", baseXP: 10 },
    { action: "complete_audit", baseXP: 100 },
    { action: "create_content", baseXP: 50 },
  ],
}));

describe("Gamification API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/gamification", () => {
    it("should return user progress by default", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        nextUrl: new URL("http://localhost:3000/api/gamification"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.progress).toBeDefined();
    }, 15000);

    it("should return achievements when action=achievements", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification?action=achievements",
        nextUrl: new URL("http://localhost:3000/api/gamification?action=achievements"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.achievements).toBeDefined();
      expect(data.summary).toBeDefined();
    });

    it("should return levels when action=levels", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification?action=levels",
        nextUrl: new URL("http://localhost:3000/api/gamification?action=levels"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.levels).toBeDefined();
      expect(Array.isArray(data.levels)).toBe(true);
    });

    it("should return actions config when action=actions", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification?action=actions",
        nextUrl: new URL("http://localhost:3000/api/gamification?action=actions"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.actions).toBeDefined();
    });

    it("should return leaderboard when action=leaderboard", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification?action=leaderboard",
        nextUrl: new URL("http://localhost:3000/api/gamification?action=leaderboard"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
    });

    it("should return stats when action=stats", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification?action=stats",
        nextUrl: new URL("http://localhost:3000/api/gamification?action=stats"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.streaks).toBeDefined();
    });

    it("should return error for unknown action", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification?action=unknown",
        nextUrl: new URL("http://localhost:3000/api/gamification?action=unknown"),
        json: async () => ({}),
      };

      const { GET } = await import("@/app/api/gamification/route");
      const response = await GET(request as never);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/gamification", () => {
    it("should record an action and award XP", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "record",
          actionType: "daily_login",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.progress).toBeDefined();
    });

    it("should require actionType for record action", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "record",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });

    it("should reject invalid action type", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "record",
          actionType: "invalid_action",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });

    it("should process daily login action", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "login",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.dailyXP).toBeDefined();
      expect(data.streaks).toBeDefined();
    });

    it("should require achievementId for unlock_achievement", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "unlock_achievement",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent achievement", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "unlock_achievement",
          achievementId: "non_existent",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);

      expect(response.status).toBe(404);
    });

    it("should reset user progress", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "reset",
          userId: "test-user",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain("reset");
    });

    it("should return error for unknown POST action", async () => {
      const request = {
        url: "http://localhost:3000/api/gamification",
        json: async () => ({
          action: "unknown_action",
        }),
      };

      const { POST } = await import("@/app/api/gamification/route");
      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });
  });
});
