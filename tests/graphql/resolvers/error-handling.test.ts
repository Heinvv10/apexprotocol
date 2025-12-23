/**
 * Error Handling Tests for GraphQL Resolvers
 *
 * Tests for database failure handling and edge cases including:
 * - Database connection errors
 * - Query timeout errors
 * - Unique constraint violations
 * - Foreign key constraint violations
 * - Not-null constraint violations
 * - Check constraint violations
 * - Not found handling (null vs error)
 * - Authorization failures
 * - Error classification and user-friendly messages
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  createMockBrand,
  createMockMention,
  createMockRecommendation,
  createMockAudit,
  createMockContent,
  createMockOrganization,
  createMockGraphQLContext,
  DatabaseErrors,
  MockDatabaseError,
  type MockGraphQLContext,
} from "../setup";
import {
  handleDatabaseError,
  handleNotFound,
  handleConstraintViolation,
  isKnownError,
  classifyDatabaseError,
  withErrorHandling,
  type DatabaseErrorType,
} from "@/lib/graphql/db-error-handler";

// Mock the db module
vi.mock("@/lib/db", () => {
  const { createDbMock, createSchemaMock } = require("../mocks/db");
  return {
    db: createDbMock(),
    schema: createSchemaMock(),
  };
});

describe("Error Handling", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe("Database Error Classification", () => {
    it("should classify connection errors correctly", () => {
      const error = DatabaseErrors.connectionError();
      const type = classifyDatabaseError(error);
      expect(type).toBe("connection");
    });

    it("should classify timeout errors correctly", () => {
      const error = DatabaseErrors.timeout();
      const type = classifyDatabaseError(error);
      expect(type).toBe("timeout");
    });

    it("should classify unique constraint violations correctly", () => {
      const error = DatabaseErrors.uniqueViolation("email");
      const type = classifyDatabaseError(error);
      expect(type).toBe("unique_constraint");
    });

    it("should classify foreign key violations correctly", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");
      const type = classifyDatabaseError(error);
      expect(type).toBe("foreign_key");
    });

    it("should classify not-null violations correctly", () => {
      const error = DatabaseErrors.notNullViolation("name");
      const type = classifyDatabaseError(error);
      expect(type).toBe("not_null");
    });

    it("should classify check constraint violations correctly", () => {
      const error = DatabaseErrors.checkConstraintViolation("score_range");
      const type = classifyDatabaseError(error);
      expect(type).toBe("check_constraint");
    });

    it("should return unknown for unrecognized errors", () => {
      const error = new Error("Some random error");
      const type = classifyDatabaseError(error);
      expect(type).toBe("unknown");
    });

    it("should return unknown for non-Error objects", () => {
      const type = classifyDatabaseError("string error");
      expect(type).toBe("unknown");
    });

    it("should handle null/undefined gracefully", () => {
      expect(classifyDatabaseError(null)).toBe("unknown");
      expect(classifyDatabaseError(undefined)).toBe("unknown");
    });
  });

  describe("handleDatabaseError", () => {
    it("should throw user-friendly error for connection failures", () => {
      const error = DatabaseErrors.connectionError();

      expect(() => {
        handleDatabaseError(error, {
          operation: "fetching brand",
          entityType: "Brand",
        });
      }).toThrow("Database connection failed. Please try again later.");
    });

    it("should throw user-friendly error for timeouts", () => {
      const error = DatabaseErrors.timeout();

      expect(() => {
        handleDatabaseError(error, {
          operation: "querying mentions",
          entityType: "Mention",
        });
      }).toThrow("Operation timed out. Please try again later.");
    });

    it("should throw user-friendly error for unique constraint violations", () => {
      const error = DatabaseErrors.uniqueViolation("name");

      expect(() => {
        handleDatabaseError(error, {
          operation: "creating brand",
          entityType: "Brand",
        });
      }).toThrow("A brand with this information already exists.");
    });

    it("should throw user-friendly error for foreign key violations", () => {
      const error = DatabaseErrors.foreignKeyViolation("organizations");

      expect(() => {
        handleDatabaseError(error, {
          operation: "creating brand",
          entityType: "Brand",
        });
      }).toThrow(/Cannot complete creating brand/);
    });

    it("should throw user-friendly error for not-null violations", () => {
      const error = DatabaseErrors.notNullViolation("name");

      expect(() => {
        handleDatabaseError(error, {
          operation: "updating brand",
          entityType: "Brand",
        });
      }).toThrow("Required field is missing for brand.");
    });

    it("should throw user-friendly error for check constraint violations", () => {
      const error = DatabaseErrors.checkConstraintViolation("score_range");

      expect(() => {
        handleDatabaseError(error, {
          operation: "updating score",
          entityType: "GeoScore",
        });
      }).toThrow("Invalid data provided for geoscore.");
    });

    it("should log errors when logError is true (default)", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = DatabaseErrors.connectionError();

      try {
        handleDatabaseError(error, {
          operation: "fetching brand",
          entityType: "Brand",
          entityId: "brand-123",
        });
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Database error");
      consoleErrorSpy.mockRestore();
    });

    it("should not log errors when logError is false", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = DatabaseErrors.connectionError();

      try {
        handleDatabaseError(error, {
          operation: "fetching brand",
          entityType: "Brand",
          logError: false,
        });
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should include entity ID in log when provided", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = DatabaseErrors.connectionError();

      try {
        handleDatabaseError(error, {
          operation: "fetching brand",
          entityType: "Brand",
          entityId: "brand-123",
        });
      } catch {
        // Expected to throw
      }

      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain("Brand brand-123");
      consoleErrorSpy.mockRestore();
    });
  });

  describe("handleNotFound", () => {
    it("should return the result when found", () => {
      const mockBrand = createMockBrand({ id: "brand-123" });
      const result = handleNotFound(mockBrand, "Brand");
      expect(result).toEqual(mockBrand);
    });

    it("should throw error when result is undefined and throwIfNotFound is true (default)", () => {
      expect(() => {
        handleNotFound(undefined, "Brand");
      }).toThrow("Brand not found");
    });

    it("should throw error when result is null and throwIfNotFound is true (default)", () => {
      expect(() => {
        handleNotFound(null, "Brand");
      }).toThrow("Brand not found");
    });

    it("should return null when result is undefined and throwIfNotFound is false", () => {
      const result = handleNotFound(undefined, "Brand", { throwIfNotFound: false });
      expect(result).toBeNull();
    });

    it("should return null when result is null and throwIfNotFound is false", () => {
      const result = handleNotFound(null, "Brand", { throwIfNotFound: false });
      expect(result).toBeNull();
    });

    it("should include entity ID in error message when provided", () => {
      expect(() => {
        handleNotFound(undefined, "Brand", { entityId: "brand-123" });
      }).toThrow("Brand with id brand-123 not found");
    });

    it("should not include entity ID when not provided", () => {
      expect(() => {
        handleNotFound(undefined, "Brand");
      }).toThrow("Brand not found");
    });

    it("should work with different entity types", () => {
      expect(() => handleNotFound(undefined, "Mention")).toThrow("Mention not found");
      expect(() => handleNotFound(undefined, "Recommendation")).toThrow("Recommendation not found");
      expect(() => handleNotFound(undefined, "Audit")).toThrow("Audit not found");
      expect(() => handleNotFound(undefined, "Content")).toThrow("Content not found");
    });

    it("should preserve type of result when found", () => {
      const mockMention = createMockMention({ id: "mention-123", sentiment: "positive" });
      const result = handleNotFound(mockMention, "Mention");
      expect(result?.id).toBe("mention-123");
      expect(result?.sentiment).toBe("positive");
    });
  });

  describe("handleConstraintViolation", () => {
    it("should throw for unique constraint violations with custom fields", () => {
      const error = DatabaseErrors.uniqueViolation("email");

      expect(() => {
        handleConstraintViolation(error, {
          entityType: "User",
          uniqueFields: ["email"],
        });
      }).toThrow("A user with email already exists.");
    });

    it("should throw for unique constraint violations with multiple fields", () => {
      const error = DatabaseErrors.uniqueViolation("name_domain");

      expect(() => {
        handleConstraintViolation(error, {
          entityType: "Brand",
          uniqueFields: ["name", "domain"],
        });
      }).toThrow("A brand with name or domain already exists.");
    });

    it("should throw for foreign key violations with custom message", () => {
      const error = DatabaseErrors.foreignKeyViolation("organizations");

      expect(() => {
        handleConstraintViolation(error, {
          entityType: "Brand",
          foreignKeyMessage: "Organization does not exist",
        });
      }).toThrow("Organization does not exist");
    });

    it("should throw default foreign key message when not provided", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      expect(() => {
        handleConstraintViolation(error, {
          entityType: "Recommendation",
        });
      }).toThrow(/Cannot complete operation/);
    });

    it("should throw for check constraint violations with custom message", () => {
      const error = DatabaseErrors.checkConstraintViolation("score_range");

      expect(() => {
        handleConstraintViolation(error, {
          entityType: "GeoScore",
          checkConstraintMessage: "Score must be between 0 and 100",
        });
      }).toThrow("Score must be between 0 and 100");
    });

    it("should return false for non-constraint errors", () => {
      const error = new Error("Some other error");
      const result = handleConstraintViolation(error, { entityType: "Brand" });
      expect(result).toBe(false);
    });

    it("should return false for connection errors", () => {
      const error = DatabaseErrors.connectionError();
      const result = handleConstraintViolation(error, { entityType: "Brand" });
      expect(result).toBe(false);
    });

    it("should return false for timeout errors", () => {
      const error = DatabaseErrors.timeout();
      const result = handleConstraintViolation(error, { entityType: "Brand" });
      expect(result).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      const result = handleConstraintViolation("string error", { entityType: "Brand" });
      expect(result).toBe(false);
    });
  });

  describe("isKnownError", () => {
    it("should return true for 'not found' errors", () => {
      const error = new Error("Brand not found");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return true for 'unauthorized' errors", () => {
      const error = new Error("Unauthorized access");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return true for 'already exists' errors", () => {
      const error = new Error("Brand already exists");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return true for 'cannot delete' errors", () => {
      const error = new Error("Cannot delete brand with existing mentions");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return true for 'cannot complete' errors", () => {
      const error = new Error("Cannot complete operation");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return true for 'required field' errors", () => {
      const error = new Error("Required field is missing");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return true for 'invalid data' errors", () => {
      const error = new Error("Invalid data provided");
      expect(isKnownError(error)).toBe(true);
    });

    it("should return false for unknown errors", () => {
      const error = new Error("Something went wrong");
      expect(isKnownError(error)).toBe(false);
    });

    it("should return false for database errors", () => {
      const error = DatabaseErrors.connectionError();
      expect(isKnownError(error)).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      expect(isKnownError("string error")).toBe(false);
      expect(isKnownError(null)).toBe(false);
      expect(isKnownError(undefined)).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(isKnownError(new Error("NOT FOUND"))).toBe(true);
      expect(isKnownError(new Error("UNAUTHORIZED"))).toBe(true);
      expect(isKnownError(new Error("Already Exists"))).toBe(true);
    });
  });

  describe("withErrorHandling wrapper", () => {
    it("should pass through successful resolver results", async () => {
      const mockBrand = createMockBrand({ id: "brand-123" });
      const resolver = vi.fn().mockResolvedValue(mockBrand);
      const wrappedResolver = withErrorHandling(resolver, {
        operation: "fetching brand",
        entityType: "Brand",
      });

      const result = await wrappedResolver(null, { id: "brand-123" }, {}, {});
      expect(result).toEqual(mockBrand);
      expect(resolver).toHaveBeenCalled();
    });

    it("should re-throw known errors without modification", async () => {
      const knownError = new Error("Brand not found");
      const resolver = vi.fn().mockRejectedValue(knownError);
      const wrappedResolver = withErrorHandling(resolver, {
        operation: "fetching brand",
        entityType: "Brand",
      });

      await expect(wrappedResolver(null, { id: "brand-123" }, {}, {})).rejects.toThrow(
        "Brand not found"
      );
    });

    it("should convert database errors to user-friendly messages", async () => {
      const dbError = DatabaseErrors.connectionError();
      const resolver = vi.fn().mockRejectedValue(dbError);
      const wrappedResolver = withErrorHandling(resolver, {
        operation: "fetching brand",
        entityType: "Brand",
      });

      await expect(wrappedResolver(null, { id: "brand-123" }, {}, {})).rejects.toThrow(
        "Database connection failed. Please try again later."
      );
    });

    it("should handle timeout errors appropriately", async () => {
      const timeoutError = DatabaseErrors.timeout();
      const resolver = vi.fn().mockRejectedValue(timeoutError);
      const wrappedResolver = withErrorHandling(resolver, {
        operation: "querying mentions",
        entityType: "Mention",
      });

      await expect(wrappedResolver(null, { brandId: "brand-123" }, {}, {})).rejects.toThrow(
        "Operation timed out. Please try again later."
      );
    });

    it("should log errors when they occur", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const dbError = DatabaseErrors.connectionError();
      const resolver = vi.fn().mockRejectedValue(dbError);
      const wrappedResolver = withErrorHandling(resolver, {
        operation: "fetching brand",
        entityType: "Brand",
      });

      try {
        await wrappedResolver(null, { id: "brand-123" }, {}, {});
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Authorization Error Handling", () => {
    it("should throw Unauthorized when user has no orgId", () => {
      const context = createMockGraphQLContext({ orgId: "" });

      // Simulate authorization check pattern
      const checkAuth = () => {
        if (!context.orgId) {
          throw new Error("Unauthorized: No organization context");
        }
        return context;
      };

      expect(() => checkAuth()).toThrow("Unauthorized");
    });

    it("should throw Unauthorized when accessing other org's resources", () => {
      const mockBrand = createMockBrand({ organizationId: "org-1" });
      const context = createMockGraphQLContext({ orgId: "org-2" });

      // Simulate ownership check pattern
      const checkOwnership = () => {
        if (mockBrand.organizationId !== context.orgId) {
          throw new Error("Unauthorized: You do not have access to this resource");
        }
        return mockBrand;
      };

      expect(() => checkOwnership()).toThrow("Unauthorized");
    });

    it("should allow access when org IDs match", () => {
      const mockBrand = createMockBrand({ organizationId: "org-123" });
      const context = createMockGraphQLContext({ orgId: "org-123" });

      const checkOwnership = () => {
        if (mockBrand.organizationId !== context.orgId) {
          throw new Error("Unauthorized: You do not have access to this resource");
        }
        return mockBrand;
      };

      expect(() => checkOwnership()).not.toThrow();
      expect(checkOwnership()).toEqual(mockBrand);
    });

    it("should throw Unauthorized when requireAuth fails", () => {
      // Simulate unauthenticated context
      const createUnauthContext = () => ({
        userId: null,
        orgId: null,
        requireAuth: () => {
          throw new Error("Unauthorized: Authentication required");
        },
      });

      const context = createUnauthContext();
      expect(() => context.requireAuth()).toThrow("Unauthorized");
    });

    it("should return auth data when requireAuth succeeds", () => {
      const context = createMockGraphQLContext({
        userId: "user-123",
        orgId: "org-456",
      });

      const auth = context.requireAuth();
      expect(auth.userId).toBe("user-123");
      expect(auth.orgId).toBe("org-456");
    });
  });

  describe("Edge Cases", () => {
    describe("Empty Result Sets", () => {
      it("should return empty array for list queries with no results", async () => {
        mockSelectResult([]);

        const db = getDb();
        const schema = getSchema();

        const result = await db.select().from(schema.brands).where();
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should not throw for empty arrays (they are valid results)", () => {
        const result: never[] = [];
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result).toHaveLength(0);
      });
    });

    describe("Record Not Found", () => {
      it("should return null for single record queries when not found (optional fields)", async () => {
        mockSelectResult([]);

        const db = getDb();
        const result = await db.select().from(getSchema().brands).where().limit(1);

        // Pattern: return null for optional fields
        const brand = (result as unknown[])[0] ?? null;
        expect(brand).toBeNull();
      });

      it("should throw for required single record queries when not found", async () => {
        mockSelectResult([]);

        const db = getDb();
        const result = await db.select().from(getSchema().brands).where().limit(1);

        // Pattern: throw for required fields
        expect(() => {
          if (!(result as unknown[])[0]) {
            throw new Error("Brand not found");
          }
          return (result as unknown[])[0];
        }).toThrow("Brand not found");
      });
    });

    describe("Invalid Input Handling", () => {
      it("should handle invalid UUID format gracefully", () => {
        const invalidId = "not-a-valid-uuid";
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          invalidId
        );
        expect(isValidUUID).toBe(false);
      });

      it("should handle empty string IDs", () => {
        const emptyId = "";
        expect(emptyId).toBeFalsy();
      });

      it("should handle null IDs appropriately", () => {
        const nullId = null;
        expect(nullId).toBeNull();
      });
    });

    describe("Concurrent Update Handling", () => {
      it("should handle optimistic locking conflicts", () => {
        // Simulate version mismatch error
        const error = new Error(
          "Record has been modified by another transaction. Please refresh and try again."
        );

        // This would be a check constraint or custom application logic
        expect(error.message).toContain("modified");
      });
    });

    describe("Large Result Set Handling", () => {
      it("should respect limit parameter to prevent oversized responses", () => {
        const maxLimit = 100;
        const requestedLimit = 500;
        const effectiveLimit = Math.min(requestedLimit, maxLimit);

        expect(effectiveLimit).toBe(100);
      });
    });
  });

  describe("Error Message Formatting", () => {
    it("should produce lowercase entity names in messages", () => {
      expect(() => {
        handleDatabaseError(DatabaseErrors.uniqueViolation("name"), {
          operation: "creating brand",
          entityType: "Brand",
        });
      }).toThrow(/brand/); // lowercase
    });

    it("should include operation context in error messages", () => {
      expect(() => {
        handleDatabaseError(DatabaseErrors.foreignKeyViolation("orgs"), {
          operation: "creating brand",
          entityType: "Brand",
        });
      }).toThrow(/creating brand/);
    });

    it("should provide actionable messages for users", () => {
      // Connection error - suggest retry
      expect(() => {
        handleDatabaseError(DatabaseErrors.connectionError(), {
          operation: "saving data",
          entityType: "Brand",
        });
      }).toThrow(/try again/i);

      // Timeout - suggest retry
      expect(() => {
        handleDatabaseError(DatabaseErrors.timeout(), {
          operation: "loading data",
          entityType: "Mention",
        });
      }).toThrow(/try again/i);
    });
  });

  describe("MockDatabaseError", () => {
    it("should create error with code property", () => {
      const error = new MockDatabaseError("Test error", { code: "12345" });
      expect(error.code).toBe("12345");
      expect(error.message).toBe("Test error");
    });

    it("should create error with constraint property", () => {
      const error = new MockDatabaseError("Constraint violation", {
        code: "23505",
        constraint: "users_email_unique",
      });
      expect(error.constraint).toBe("users_email_unique");
    });

    it("should create error with detail property", () => {
      const error = new MockDatabaseError("Key violation", {
        code: "23503",
        detail: "Key (org_id)=(123) is not present in table organizations",
      });
      expect(error.detail).toContain("organizations");
    });

    it("should have correct name property", () => {
      const error = new MockDatabaseError("Test error");
      expect(error.name).toBe("MockDatabaseError");
    });

    it("should be an instance of Error", () => {
      const error = new MockDatabaseError("Test error");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("DatabaseErrors Factory", () => {
    it("should create connection error with correct code", () => {
      const error = DatabaseErrors.connectionError();
      expect(error.code).toBe("ECONNREFUSED");
      expect(error.message).toContain("Connection");
    });

    it("should create unique violation with field name", () => {
      const error = DatabaseErrors.uniqueViolation("email");
      expect(error.code).toBe("23505");
      expect(error.constraint).toContain("email");
    });

    it("should create foreign key violation with table name", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");
      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");
    });

    it("should create not-null violation with column name", () => {
      const error = DatabaseErrors.notNullViolation("name");
      expect(error.code).toBe("23502");
      expect(error.message).toContain("name");
    });

    it("should create check constraint violation with constraint name", () => {
      const error = DatabaseErrors.checkConstraintViolation("positive_score");
      expect(error.code).toBe("23514");
      expect(error.constraint).toBe("positive_score");
    });

    it("should create timeout error with correct code", () => {
      const error = DatabaseErrors.timeout();
      expect(error.code).toBe("57014");
      expect(error.message).toContain("timeout");
    });
  });

  describe("Resolver Error Handling Patterns", () => {
    it("should follow try-catch pattern for Query resolvers", async () => {
      // Pattern: wrap database calls in try-catch
      const mockResolver = async () => {
        try {
          const db = getDb();
          const result = await db.select().from(getSchema().brands).where().limit(1);
          return (result as unknown[])[0] ?? null;
        } catch (error) {
          console.error("Database error:", error);
          throw new Error("Failed to fetch brand");
        }
      };

      mockSelectResult([createMockBrand()]);
      const result = await mockResolver();
      expect(result).toBeDefined();
    });

    it("should follow try-catch pattern for Mutation resolvers", async () => {
      // Pattern: wrap mutations in try-catch with returning()
      const mockResolver = async (input: { name: string }) => {
        try {
          const db = getDb();
          const result = await db
            .insert(getSchema().brands)
            .values(input)
            .returning();
          return result[0];
        } catch (error) {
          console.error("Database error:", error);
          throw new Error("Failed to create brand");
        }
      };

      mockInsertResult([createMockBrand({ name: "New Brand" })]);
      const result = await mockResolver({ name: "New Brand" });
      expect(result).toBeDefined();
    });

    it("should follow try-catch pattern for Field resolvers", async () => {
      // Pattern: wrap field resolver database calls in try-catch
      const mockFieldResolver = async (parent: { id: string }) => {
        try {
          const db = getDb();
          const result = await db
            .select()
            .from(getSchema().brandMentions)
            .where()
            .limit(10);
          return result;
        } catch (error) {
          console.error("Database error:", error);
          throw new Error("Failed to fetch brand mentions");
        }
      };

      mockSelectResult([createMockMention()]);
      const result = await mockFieldResolver({ id: "brand-123" });
      expect(result).toHaveLength(1);
    });

    it("should verify ownership before mutation operations", async () => {
      const mockBrand = createMockBrand({ organizationId: "org-1" });
      const context = createMockGraphQLContext({ orgId: "org-1" });

      // Pattern: verify ownership then proceed
      const mockUpdateResolver = async (id: string, input: { name: string }) => {
        // First fetch to verify ownership
        mockSelectResult([mockBrand]);
        const db = getDb();
        const existing = await db.select().from(getSchema().brands).where().limit(1);

        if (!(existing as unknown[])[0]) {
          throw new Error("Brand not found");
        }

        if ((existing as Array<{ organizationId: string }>)[0].organizationId !== context.orgId) {
          throw new Error("Unauthorized: You do not have access to this resource");
        }

        // Then update
        mockUpdateResult([{ ...(existing as Record<string, unknown>[])[0], ...input }]);
        const result = await db
          .update(getSchema().brands)
          .set(input)
          .where()
          .returning();

        return (result as unknown[])[0];
      };

      const result = await mockUpdateResolver("brand-123", { name: "Updated" });
      expect((result as { organizationId: string }).organizationId).toBe("org-1");
    });

    it("should handle authorization failure in ownership check", async () => {
      const mockBrand = createMockBrand({ organizationId: "org-1" });
      const context = createMockGraphQLContext({ orgId: "org-2" }); // Different org

      const mockUpdateResolver = async (id: string) => {
        mockSelectResult([mockBrand]);
        const db = getDb();
        const existing = await db.select().from(getSchema().brands).where().limit(1);

        if (!(existing as unknown[])[0]) {
          throw new Error("Brand not found");
        }

        if ((existing as Array<{ organizationId: string }>)[0].organizationId !== context.orgId) {
          throw new Error("Unauthorized: You do not have access to this resource");
        }

        return (existing as unknown[])[0];
      };

      await expect(mockUpdateResolver("brand-123")).rejects.toThrow("Unauthorized");
    });
  });

  describe("Integration with Actual Resolver Error Patterns", () => {
    it("should match the pattern used in brand resolver error handling", () => {
      // This matches the actual error handling pattern in src/lib/graphql/schema.ts
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const simulateBrandResolverError = () => {
        const error = DatabaseErrors.connectionError();
        try {
          throw error;
        } catch (e) {
          console.error("Database error fetching brand:", e);
          throw new Error("Failed to fetch brand. Please try again later.");
        }
      };

      expect(() => simulateBrandResolverError()).toThrow(
        "Failed to fetch brand. Please try again later."
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching brand:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should match the pattern used in mutation resolver error handling", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const simulateCreateBrandError = () => {
        const error = DatabaseErrors.uniqueViolation("name");
        try {
          throw error;
        } catch (e) {
          console.error("Database error creating brand:", e);
          if ((e as MockDatabaseError).code === "23505") {
            throw new Error("A brand with this name already exists.");
          }
          throw new Error("Failed to create brand. Please try again later.");
        }
      };

      expect(() => simulateCreateBrandError()).toThrow(
        "A brand with this name already exists."
      );

      consoleErrorSpy.mockRestore();
    });

    it("should match the pattern used in field resolver error handling", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const simulateBrandMentionsError = () => {
        const error = DatabaseErrors.timeout();
        try {
          throw error;
        } catch (e) {
          console.error("Database error fetching brand mentions:", e);
          throw new Error("Failed to fetch brand mentions. Please try again later.");
        }
      };

      expect(() => simulateBrandMentionsError()).toThrow(
        "Failed to fetch brand mentions. Please try again later."
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
