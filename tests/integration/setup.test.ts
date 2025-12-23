/**
 * Integration Test Setup Verification Tests
 *
 * These tests verify that the integration test infrastructure works correctly.
 * They test the setup, seeding, and cleanup utilities.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
  createTestContext,
  dbAssertions,
  skipIfNoDB,
} from "./setup";
import { TEST_IDS } from "./seed";

// Mock the database module for unit testing the setup utilities
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => vi.fn()),
}));

describe("Integration Test Setup Utilities", () => {
  describe("createTestContext", () => {
    it("should create a context with default values", () => {
      const context = createTestContext();

      expect(context.orgId).toBe(TEST_IDS.ORG);
      expect(context.userId).toBe(TEST_IDS.USERS[0]);
      expect(context.clerkUserId).toContain("clerk_test_");
      expect(typeof context.requireAuth).toBe("function");
    });

    it("should create a context with custom values", () => {
      const context = createTestContext({
        orgId: "custom-org",
        userId: "custom-user",
      });

      expect(context.orgId).toBe("custom-org");
      expect(context.userId).toBe("custom-user");
    });

    it("should return auth data from requireAuth()", () => {
      const context = createTestContext({
        orgId: "test-org",
        userId: "test-user",
      });

      const auth = context.requireAuth();

      expect(auth).toEqual({
        userId: "test-user",
        orgId: "test-org",
      });
    });
  });

  describe("TEST_IDS", () => {
    it("should have valid organization ID", () => {
      expect(TEST_IDS.ORG).toBe("test-org-integration-001");
    });

    it("should have valid user IDs", () => {
      expect(TEST_IDS.USERS).toHaveLength(2);
      expect(TEST_IDS.USERS[0]).toBe("test-user-001");
      expect(TEST_IDS.USERS[1]).toBe("test-user-002");
    });

    it("should have valid brand IDs", () => {
      expect(TEST_IDS.BRANDS).toHaveLength(3);
      expect(TEST_IDS.BRANDS[0]).toBe("test-brand-001");
    });

    it("should have valid mention IDs", () => {
      expect(TEST_IDS.MENTIONS).toHaveLength(5);
      expect(TEST_IDS.MENTIONS[0]).toBe("test-mention-001");
    });

    it("should have valid recommendation IDs", () => {
      expect(TEST_IDS.RECOMMENDATIONS).toHaveLength(5);
      expect(TEST_IDS.RECOMMENDATIONS[0]).toBe("test-rec-001");
    });

    it("should have valid audit IDs", () => {
      expect(TEST_IDS.AUDITS).toHaveLength(3);
      expect(TEST_IDS.AUDITS[0]).toBe("test-audit-001");
    });

    it("should have valid content IDs", () => {
      expect(TEST_IDS.CONTENT).toHaveLength(3);
      expect(TEST_IDS.CONTENT[0]).toBe("test-content-001");
    });
  });

  describe("isDatabaseConfigured", () => {
    it("should return false when DATABASE_URL is not set", () => {
      const originalDbUrl = process.env.DATABASE_URL;
      const originalTestDbUrl = process.env.TEST_DATABASE_URL;

      delete process.env.DATABASE_URL;
      delete process.env.TEST_DATABASE_URL;

      // isDatabaseConfigured catches errors and returns false
      const result = isDatabaseConfigured();

      // Restore
      if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl;
      if (originalTestDbUrl) process.env.TEST_DATABASE_URL = originalTestDbUrl;

      expect(result).toBe(false);
    });

    it("should return false when DATABASE_URL is placeholder", () => {
      const originalDbUrl = process.env.DATABASE_URL;
      const originalTestDbUrl = process.env.TEST_DATABASE_URL;

      process.env.DATABASE_URL = "postgresql://placeholder";
      delete process.env.TEST_DATABASE_URL;

      const result = isDatabaseConfigured();

      // Restore
      process.env.DATABASE_URL = originalDbUrl!;
      if (originalTestDbUrl) process.env.TEST_DATABASE_URL = originalTestDbUrl;

      expect(result).toBe(false);
    });
  });

  describe("skipIfNoDB", () => {
    it("should return true when database is not configured", () => {
      const originalDbUrl = process.env.DATABASE_URL;
      const originalTestDbUrl = process.env.TEST_DATABASE_URL;

      delete process.env.DATABASE_URL;
      delete process.env.TEST_DATABASE_URL;

      const result = skipIfNoDB();

      // Restore
      if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl;
      if (originalTestDbUrl) process.env.TEST_DATABASE_URL = originalTestDbUrl;

      expect(result).toBe(true);
    });
  });

  describe("setupIntegrationTest", () => {
    it("should return expected utilities", () => {
      // Note: This will not actually seed due to mocked database
      const setup = setupIntegrationTest({ autoSeed: false, autoCleanup: false });

      expect(typeof setup.getDb).toBe("function");
      expect(typeof setup.getSchema).toBe("function");
      expect(typeof setup.getSeededData).toBe("function");
      expect(typeof setup.seedTestData).toBe("function");
      expect(typeof setup.cleanup).toBe("function");
      expect(typeof setup.createContext).toBe("function");
      expect(typeof setup.isConfigured).toBe("function");
      expect(setup.testIds).toEqual(TEST_IDS);
    });

    it("should return schema with expected tables", () => {
      const setup = setupIntegrationTest({ autoSeed: false, autoCleanup: false });
      const schema = setup.getSchema();

      // Verify key tables exist
      expect(schema.organizations).toBeDefined();
      expect(schema.users).toBeDefined();
      expect(schema.brands).toBeDefined();
      expect(schema.brandMentions).toBeDefined();
      expect(schema.recommendations).toBeDefined();
      expect(schema.audits).toBeDefined();
      expect(schema.content).toBeDefined();
    });
  });
});

describe("Seed Data Structure", () => {
  describe("Brand Seed Data", () => {
    it("should have 3 brands configured", () => {
      expect(TEST_IDS.BRANDS).toHaveLength(3);
    });

    it("should have unique brand IDs", () => {
      const uniqueIds = new Set(TEST_IDS.BRANDS);
      expect(uniqueIds.size).toBe(TEST_IDS.BRANDS.length);
    });
  });

  describe("Mention Seed Data", () => {
    it("should have 5 mentions configured", () => {
      expect(TEST_IDS.MENTIONS).toHaveLength(5);
    });

    it("should have unique mention IDs", () => {
      const uniqueIds = new Set(TEST_IDS.MENTIONS);
      expect(uniqueIds.size).toBe(TEST_IDS.MENTIONS.length);
    });
  });

  describe("Recommendation Seed Data", () => {
    it("should have 5 recommendations configured", () => {
      expect(TEST_IDS.RECOMMENDATIONS).toHaveLength(5);
    });

    it("should have unique recommendation IDs", () => {
      const uniqueIds = new Set(TEST_IDS.RECOMMENDATIONS);
      expect(uniqueIds.size).toBe(TEST_IDS.RECOMMENDATIONS.length);
    });
  });

  describe("Audit Seed Data", () => {
    it("should have 3 audits configured", () => {
      expect(TEST_IDS.AUDITS).toHaveLength(3);
    });

    it("should have unique audit IDs", () => {
      const uniqueIds = new Set(TEST_IDS.AUDITS);
      expect(uniqueIds.size).toBe(TEST_IDS.AUDITS.length);
    });
  });

  describe("Content Seed Data", () => {
    it("should have 3 content items configured", () => {
      expect(TEST_IDS.CONTENT).toHaveLength(3);
    });

    it("should have unique content IDs", () => {
      const uniqueIds = new Set(TEST_IDS.CONTENT);
      expect(uniqueIds.size).toBe(TEST_IDS.CONTENT.length);
    });
  });

  describe("GEO Score History Seed Data", () => {
    it("should have 5 GEO score history items configured", () => {
      expect(TEST_IDS.GEO_SCORE_HISTORY).toHaveLength(5);
    });

    it("should have unique GEO score history IDs", () => {
      const uniqueIds = new Set(TEST_IDS.GEO_SCORE_HISTORY);
      expect(uniqueIds.size).toBe(TEST_IDS.GEO_SCORE_HISTORY.length);
    });

    it("should have correct ID prefix", () => {
      expect(TEST_IDS.GEO_SCORE_HISTORY[0]).toBe("test-geo-history-001");
    });
  });

  describe("Integration Seed Data", () => {
    it("should have 2 integrations configured", () => {
      expect(TEST_IDS.INTEGRATIONS).toHaveLength(2);
    });

    it("should have unique integration IDs", () => {
      const uniqueIds = new Set(TEST_IDS.INTEGRATIONS);
      expect(uniqueIds.size).toBe(TEST_IDS.INTEGRATIONS.length);
    });

    it("should have correct ID prefix", () => {
      expect(TEST_IDS.INTEGRATIONS[0]).toBe("test-integration-001");
    });
  });
});

describe("Test Context Creation", () => {
  it("should create context with organization isolation", () => {
    const context1 = createTestContext({ orgId: "org-1" });
    const context2 = createTestContext({ orgId: "org-2" });

    expect(context1.orgId).not.toBe(context2.orgId);
    expect(context1.requireAuth().orgId).toBe("org-1");
    expect(context2.requireAuth().orgId).toBe("org-2");
  });

  it("should support custom user IDs", () => {
    const context = createTestContext({
      userId: "admin-user",
      orgId: "admin-org",
    });

    expect(context.userId).toBe("admin-user");
    expect(context.orgId).toBe("admin-org");
    expect(context.clerkUserId).toContain("clerk_test_admin-user");
  });
});

describe("Database Assertion Utilities", () => {
  describe("dbAssertions structure", () => {
    it("should have expectRecordExists function", () => {
      expect(typeof dbAssertions.expectRecordExists).toBe("function");
    });

    it("should have expectRecordNotExists function", () => {
      expect(typeof dbAssertions.expectRecordNotExists).toBe("function");
    });

    it("should have getRecordCount function", () => {
      expect(typeof dbAssertions.getRecordCount).toBe("function");
    });
  });
});
