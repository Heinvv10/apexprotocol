/**
 * GraphQL Resolver Test Setup
 *
 * Provides test infrastructure for testing GraphQL resolvers with mocked
 * database client and authentication context.
 *
 * Usage:
 * ```typescript
 * import { beforeEach, describe, it, expect } from "vitest";
 * import { setupGraphQLTest, mockSelectResult, mockInsertResult } from "../setup";
 * import { createMockBrand, createMockGraphQLContext } from "../factories";
 *
 * describe("Brand Resolvers", () => {
 *   const { getDb, getSchema, getContext, resetMocks } = setupGraphQLTest();
 *
 *   beforeEach(() => {
 *     resetMocks();
 *   });
 *
 *   it("should fetch a brand by ID", async () => {
 *     const mockBrand = createMockBrand();
 *     mockSelectResult([mockBrand]);
 *
 *     // Test resolver...
 *   });
 * });
 * ```
 */

import { vi, beforeEach, afterEach } from "vitest";
import {
  createDbMock,
  createSchemaMock,
  resetDbMock,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  mockDeleteResult,
  getCallHistory,
  wasMethodCalled,
  getMethodCalls,
  type MockDatabase,
  type MockSchema,
} from "./mocks/db";
import {
  createMockGraphQLContext,
  resetIdCounter,
  type MockGraphQLContext,
} from "./factories";

// Re-export mock utilities for convenience
export {
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  mockDeleteResult,
  getCallHistory,
  wasMethodCalled,
  getMethodCalls,
};

// Re-export factory functions
export * from "./factories";

// Store instances for test suite
let dbMock: MockDatabase;
let schemaMock: MockSchema;
let contextMock: MockGraphQLContext;

/**
 * Main setup function for GraphQL resolver tests
 *
 * Creates and configures all mocks needed for testing GraphQL resolvers.
 * Call this at the top of your test file.
 *
 * @returns Object containing mock instances and utility functions
 */
export function setupGraphQLTest(options: { autoReset?: boolean } = {}) {
  const { autoReset = false } = options;

  // Initialize mocks
  dbMock = createDbMock();
  schemaMock = createSchemaMock();
  contextMock = createMockGraphQLContext();

  // Optional auto-reset in beforeEach
  if (autoReset) {
    beforeEach(() => {
      resetAllMocks();
    });
  }

  return {
    /**
     * Get the mocked database instance
     */
    getDb: () => dbMock,

    /**
     * Get the mocked schema instance
     */
    getSchema: () => schemaMock,

    /**
     * Get the mocked GraphQL context
     */
    getContext: () => contextMock,

    /**
     * Create a new context with custom values
     */
    createContext: (overrides: Partial<MockGraphQLContext> = {}) => {
      contextMock = createMockGraphQLContext(overrides);
      return contextMock;
    },

    /**
     * Reset all mocks and ID counters
     */
    resetMocks: resetAllMocks,

    /**
     * Get raw mock instances for advanced use cases
     */
    mocks: {
      db: dbMock,
      schema: schemaMock,
      context: contextMock,
    },
  };
}

/**
 * Reset all mock data, call history, and ID counters
 */
export function resetAllMocks(): void {
  resetDbMock();
  resetIdCounter();
  dbMock = createDbMock();
  contextMock = createMockGraphQLContext();
}

/**
 * Create a vi.mock call for the database module
 *
 * Use this in your test file's top-level vi.mock() call:
 * ```typescript
 * vi.mock("@/lib/db", () => createDbModuleMock());
 * ```
 */
export function createDbModuleMock() {
  const db = createDbMock();
  const schema = createSchemaMock();

  return {
    db,
    schema,
    getDb: () => db,
  };
}

/**

/**
 * Mock database error for testing error handling
 */
export class MockDatabaseError extends Error {
  code: string;
  constraint?: string;
  detail?: string;

  constructor(
    message: string,
    options: { code?: string; constraint?: string; detail?: string } = {}
  ) {
    super(message);
    this.name = "MockDatabaseError";
    this.code = options.code ?? "MOCK_ERROR";
    this.constraint = options.constraint;
    this.detail = options.detail;
  }
}

/**
 * Create common database error mocks
 */
export const DatabaseErrors = {
  connectionError: () =>
    new MockDatabaseError("Connection refused", { code: "ECONNREFUSED" }),

  uniqueViolation: (field: string) =>
    new MockDatabaseError(`duplicate key value violates unique constraint`, {
      code: "23505",
      constraint: `${field}_unique`,
      detail: `Key (${field})=(value) already exists.`,
    }),

  foreignKeyViolation: (table: string) =>
    new MockDatabaseError(`violates foreign key constraint`, {
      code: "23503",
      constraint: `${table}_fkey`,
      detail: `Key (id)=(123) is not present in table "${table}".`,
    }),

  notNullViolation: (column: string) =>
    new MockDatabaseError(`null value in column "${column}" violates not-null constraint`, {
      code: "23502",
    }),

  checkConstraintViolation: (constraint: string) =>
    new MockDatabaseError(`violates check constraint "${constraint}"`, {
      code: "23514",
      constraint,
    }),

  timeout: () =>
    new MockDatabaseError("Query timeout", { code: "57014" }),
};

/**
 * Helper to create a mock that throws an error
 */
export function mockDatabaseError(error: Error): void {
  const failingMock = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.reject(error)),
        then: (_: unknown, onRejected: (e: Error) => void) =>
          Promise.reject(error).catch(onRejected),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.reject(error)),
        then: (_: unknown, onRejected: (e: Error) => void) =>
          Promise.reject(error).catch(onRejected),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.reject(error)),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.reject(error)),
    })),
  };

  // Override the dbMock methods temporarily
  Object.assign(dbMock, failingMock);
}

/**
 * Assertion helpers for database operations
 */
export const dbAssertions = {
  /**
   * Assert that a SELECT query was executed
   */
  expectSelect: () => {
    if (!wasMethodCalled("select")) {
      throw new Error("Expected db.select() to be called");
    }
  },

  /**
   * Assert that an INSERT operation was executed
   */
  expectInsert: () => {
    if (!wasMethodCalled("insert")) {
      throw new Error("Expected db.insert() to be called");
    }
  },

  /**
   * Assert that an UPDATE operation was executed
   */
  expectUpdate: () => {
    if (!wasMethodCalled("update")) {
      throw new Error("Expected db.update() to be called");
    }
  },

  /**
   * Assert that a DELETE operation was executed
   */
  expectDelete: () => {
    if (!wasMethodCalled("delete")) {
      throw new Error("Expected db.delete() to be called");
    }
  },

  /**
   * Assert that .where() was called with specific criteria
   */
  expectWhere: () => {
    if (!wasMethodCalled("where")) {
      throw new Error("Expected .where() to be called");
    }
  },

  /**
   * Assert that .returning() was called (required for mutations)
   */
  expectReturning: () => {
    if (!wasMethodCalled("returning")) {
      throw new Error("Expected .returning() to be called");
    }
  },

  /**
   * Assert the number of database calls made
   */
  expectCallCount: (count: number) => {
    const history = getCallHistory();
    if (history.length !== count) {
      throw new Error(
        `Expected ${count} database calls, but got ${history.length}`
      );
    }
  },
};

/**
 * Type for resolver function signature
 */
export type ResolverFn<TResult = unknown, TArgs = Record<string, unknown>> = (
  parent: unknown,
  args: TArgs,
  context: MockGraphQLContext
) => Promise<TResult> | TResult;

/**
 * Helper to test a resolver function with mocked context
 */
export async function testResolver<TResult, TArgs = Record<string, unknown>>(
  resolver: ResolverFn<TResult, TArgs>,
  args: TArgs,
  contextOverrides: Partial<MockGraphQLContext> = {}
): Promise<TResult> {
  const context = {
    ...contextMock,
    ...contextOverrides,
  };

  return resolver(null, args, context);
}

/**
 * Helper to test a field resolver with parent data
 */
export async function testFieldResolver<
  TResult,
  TParent = unknown,
  TArgs = Record<string, unknown>
>(
  resolver: (
    parent: TParent,
    args: TArgs,
    context: MockGraphQLContext
  ) => Promise<TResult> | TResult,
  parent: TParent,
  args: TArgs = {} as TArgs,
  contextOverrides: Partial<MockGraphQLContext> = {}
): Promise<TResult> {
  const context = {
    ...contextMock,
    ...contextOverrides,
  };

  return resolver(parent, args, context);
}
