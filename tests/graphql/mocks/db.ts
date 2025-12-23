/**
 * Drizzle Database Mock for GraphQL Resolver Tests
 *
 * Provides a comprehensive mock of the Drizzle database client that supports
 * chained query methods used in GraphQL resolvers.
 */

import { vi } from "vitest";

// Type definitions for mock chain results
type MockChainResult<T = unknown> = {
  from: ReturnType<typeof createFromMock>;
  where: ReturnType<typeof createWhereMock>;
  orderBy: ReturnType<typeof createOrderByMock>;
  limit: ReturnType<typeof createLimitMock>;
  offset: ReturnType<typeof createOffsetMock>;
  values: ReturnType<typeof createValuesMock>;
  set: ReturnType<typeof createSetMock>;
  returning: ReturnType<typeof createReturningMock>;
  onConflictDoUpdate: ReturnType<typeof createOnConflictMock>;
  leftJoin: ReturnType<typeof createJoinMock>;
  innerJoin: ReturnType<typeof createJoinMock>;
  groupBy: ReturnType<typeof createGroupByMock>;
  then: (resolve: (value: T) => void) => Promise<T>;
};

// Store for mock data responses
let mockSelectResults: unknown[] = [];
let mockInsertResults: unknown[] = [];
let mockUpdateResults: unknown[] = [];
let mockDeleteResults: unknown = undefined;

// Track method calls for assertions
const callHistory: {
  method: string;
  args: unknown[];
  timestamp: number;
}[] = [];

/**
 * Reset all mock data and call history
 */
export function resetDbMock(): void {
  mockSelectResults = [];
  mockInsertResults = [];
  mockUpdateResults = [];
  mockDeleteResults = undefined;
  callHistory.length = 0;
}

/**
 * Set mock data for SELECT queries
 */
export function mockSelectResult(data: unknown[]): void {
  mockSelectResults = data;
}

/**
 * Set mock data for INSERT operations
 */
export function mockInsertResult(data: unknown[]): void {
  mockInsertResults = data;
}

/**
 * Set mock data for UPDATE operations
 */
export function mockUpdateResult(data: unknown[]): void {
  mockUpdateResults = data;
}

/**
 * Set mock data for DELETE operations
 */
export function mockDeleteResult(data: unknown): void {
  mockDeleteResults = data;
}

/**
 * Get call history for assertions
 */
export function getCallHistory() {
  return [...callHistory];
}

/**
 * Check if a specific method was called
 */
export function wasMethodCalled(method: string): boolean {
  return callHistory.some((call) => call.method === method);
}

/**
 * Get calls for a specific method
 */
export function getMethodCalls(method: string) {
  return callHistory.filter((call) => call.method === method);
}

// Chain method creators for fluent API
function createFromMock() {
  const fn = vi.fn(() => createChainedMethods(mockSelectResults));
  return fn;
}

function createWhereMock() {
  const fn = vi.fn((...args: unknown[]) => {
    callHistory.push({ method: "where", args, timestamp: Date.now() });
    return createChainedMethods(mockSelectResults);
  });
  return fn;
}

function createOrderByMock() {
  const fn = vi.fn((...args: unknown[]) => {
    callHistory.push({ method: "orderBy", args, timestamp: Date.now() });
    return createChainedMethods(mockSelectResults);
  });
  return fn;
}

function createLimitMock() {
  const fn = vi.fn((limit: number) => {
    callHistory.push({ method: "limit", args: [limit], timestamp: Date.now() });
    return createChainedMethods(mockSelectResults);
  });
  return fn;
}

function createOffsetMock() {
  const fn = vi.fn((offset: number) => {
    callHistory.push({
      method: "offset",
      args: [offset],
      timestamp: Date.now(),
    });
    return createChainedMethods(mockSelectResults);
  });
  return fn;
}

function createValuesMock() {
  const fn = vi.fn((values: unknown) => {
    callHistory.push({ method: "values", args: [values], timestamp: Date.now() });
    return createInsertChainedMethods();
  });
  return fn;
}

function createSetMock() {
  const fn = vi.fn((values: unknown) => {
    callHistory.push({ method: "set", args: [values], timestamp: Date.now() });
    return createUpdateChainedMethods();
  });
  return fn;
}

function createReturningMock() {
  const fn = vi.fn(() => {
    callHistory.push({ method: "returning", args: [], timestamp: Date.now() });
    return Promise.resolve(
      mockInsertResults.length > 0 ? mockInsertResults : mockUpdateResults
    );
  });
  return fn;
}

function createOnConflictMock() {
  const fn = vi.fn((config: unknown) => {
    callHistory.push({
      method: "onConflictDoUpdate",
      args: [config],
      timestamp: Date.now(),
    });
    return createInsertChainedMethods();
  });
  return fn;
}

function createJoinMock() {
  const fn = vi.fn((...args: unknown[]) => {
    callHistory.push({ method: "join", args, timestamp: Date.now() });
    return createChainedMethods(mockSelectResults);
  });
  return fn;
}

function createGroupByMock() {
  const fn = vi.fn((...args: unknown[]) => {
    callHistory.push({ method: "groupBy", args, timestamp: Date.now() });
    return createChainedMethods(mockSelectResults);
  });
  return fn;
}

// Create chained methods for SELECT queries
function createChainedMethods(results: unknown[]): MockChainResult {
  const chainedMethods: MockChainResult = {
    from: createFromMock(),
    where: createWhereMock(),
    orderBy: createOrderByMock(),
    limit: createLimitMock(),
    offset: createOffsetMock(),
    values: createValuesMock(),
    set: createSetMock(),
    returning: createReturningMock(),
    onConflictDoUpdate: createOnConflictMock(),
    leftJoin: createJoinMock(),
    innerJoin: createJoinMock(),
    groupBy: createGroupByMock(),
    then: (resolve) => {
      const result = Promise.resolve(results);
      return result.then(resolve);
    },
  };

  // Make the object thenable (Promise-like) for async/await
  Object.defineProperty(chainedMethods, "then", {
    value: (
      onFulfilled?: (value: unknown[]) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      return Promise.resolve(results).then(onFulfilled, onRejected);
    },
    enumerable: false,
  });

  Object.defineProperty(chainedMethods, "catch", {
    value: (onRejected?: (reason: unknown) => unknown) => {
      return Promise.resolve(results).catch(onRejected);
    },
    enumerable: false,
  });

  return chainedMethods;
}

// Create chained methods for INSERT operations
function createInsertChainedMethods() {
  const methods = {
    returning: createReturningMock(),
    onConflictDoUpdate: createOnConflictMock(),
    onConflictDoNothing: vi.fn(() => methods),
    then: (resolve: (value: unknown[]) => void) => {
      return Promise.resolve(mockInsertResults).then(resolve);
    },
  };

  Object.defineProperty(methods, "then", {
    value: (
      onFulfilled?: (value: unknown[]) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      return Promise.resolve(mockInsertResults).then(onFulfilled, onRejected);
    },
    enumerable: false,
  });

  return methods;
}

// Create chained methods for UPDATE operations
function createUpdateChainedMethods() {
  const methods = {
    where: vi.fn((...args: unknown[]) => {
      callHistory.push({ method: "where", args, timestamp: Date.now() });
      return {
        returning: createReturningMock(),
        then: (resolve: (value: unknown[]) => void) => {
          return Promise.resolve(mockUpdateResults).then(resolve);
        },
      };
    }),
    returning: createReturningMock(),
    then: (resolve: (value: unknown[]) => void) => {
      return Promise.resolve(mockUpdateResults).then(resolve);
    },
  };

  return methods;
}

// Create chained methods for DELETE operations
function createDeleteChainedMethods() {
  const methods = {
    where: vi.fn((...args: unknown[]) => {
      callHistory.push({
        method: "deleteWhere",
        args,
        timestamp: Date.now(),
      });
      return {
        returning: vi.fn(() => Promise.resolve(mockDeleteResults)),
        then: (resolve: (value: unknown) => void) => {
          return Promise.resolve(mockDeleteResults).then(resolve);
        },
      };
    }),
    returning: vi.fn(() => Promise.resolve(mockDeleteResults)),
    then: (resolve: (value: unknown) => void) => {
      return Promise.resolve(mockDeleteResults).then(resolve);
    },
  };

  return methods;
}

/**
 * Create the main database mock object
 */
export function createDbMock() {
  const dbMock = {
    select: vi.fn((...fields: unknown[]) => {
      callHistory.push({
        method: "select",
        args: fields,
        timestamp: Date.now(),
      });
      return {
        from: vi.fn((table: unknown) => {
          callHistory.push({
            method: "from",
            args: [table],
            timestamp: Date.now(),
          });
          return createChainedMethods(mockSelectResults);
        }),
      };
    }),

    insert: vi.fn((table: unknown) => {
      callHistory.push({
        method: "insert",
        args: [table],
        timestamp: Date.now(),
      });
      return {
        values: vi.fn((values: unknown) => {
          callHistory.push({
            method: "values",
            args: [values],
            timestamp: Date.now(),
          });
          return createInsertChainedMethods();
        }),
      };
    }),

    update: vi.fn((table: unknown) => {
      callHistory.push({
        method: "update",
        args: [table],
        timestamp: Date.now(),
      });
      return {
        set: vi.fn((values: unknown) => {
          callHistory.push({
            method: "set",
            args: [values],
            timestamp: Date.now(),
          });
          return createUpdateChainedMethods();
        }),
      };
    }),

    delete: vi.fn((table: unknown) => {
      callHistory.push({
        method: "delete",
        args: [table],
        timestamp: Date.now(),
      });
      return createDeleteChainedMethods();
    }),

    // Query builder for complex queries
    query: {
      brands: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      brandMentions: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      recommendations: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      audits: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      content: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      organizations: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      users: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      apiIntegrations: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      geoScoreHistory: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
      recommendationFeedback: {
        findFirst: vi.fn(() => Promise.resolve(mockSelectResults[0] ?? null)),
        findMany: vi.fn(() => Promise.resolve(mockSelectResults)),
      },
    },

    // Transaction support
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      callHistory.push({
        method: "transaction",
        args: [],
        timestamp: Date.now(),
      });
      // Create a mock transaction object that has the same API
      const txMock = createDbMock();
      return callback(txMock);
    }),
  };

  return dbMock;
}

/**
 * Create a mock for the schema tables
 * Maps table names to mock table objects for use in Drizzle queries
 */
export const createSchemaMock = () => ({
  brands: { name: "brands" },
  brandMentions: { name: "brandMentions" },
  recommendations: { name: "recommendations" },
  recommendationFeedback: { name: "recommendationFeedback" },
  audits: { name: "audits" },
  content: { name: "content" },
  organizations: { name: "organizations" },
  users: { name: "users" },
  apiIntegrations: { name: "apiIntegrations" },
  geoScoreHistory: { name: "geoScoreHistory" },
  apiKeys: { name: "apiKeys" },
  aiUsage: { name: "aiUsage" },
  monitoringJobs: { name: "monitoringJobs" },
  scheduledJobs: { name: "scheduledJobs" },
  serpFeatures: { name: "serpFeatures" },
  competitorMentions: { name: "competitorMentions" },
  shareOfVoice: { name: "shareOfVoice" },
  competitiveGaps: { name: "competitiveGaps" },
  competitiveAlerts: { name: "competitiveAlerts" },
  discoveredCompetitors: { name: "discoveredCompetitors" },
  competitorSnapshots: { name: "competitorSnapshots" },
  portfolios: { name: "portfolios" },
  portfolioBrands: { name: "portfolioBrands" },
  executiveReports: { name: "executiveReports" },
  scheduledReports: { name: "scheduledReports" },
  socialAccounts: { name: "socialAccounts" },
  socialMentions: { name: "socialMentions" },
  socialMetrics: { name: "socialMetrics" },
  socialScores: { name: "socialScores" },
  brandPeople: { name: "brandPeople" },
  peopleAiMentions: { name: "peopleAiMentions" },
  peopleScores: { name: "peopleScores" },
  brandLocations: { name: "brandLocations" },
  brandReviews: { name: "brandReviews" },
  locationScores: { name: "locationScores" },
  systemAuditLogs: { name: "systemAuditLogs" },
  userGamification: { name: "userGamification" },
  userAchievements: { name: "userAchievements" },
});

// Export default mock instance
export const mockDb = createDbMock();
export const mockSchema = createSchemaMock();

// Export type for the mock database
export type MockDatabase = ReturnType<typeof createDbMock>;
export type MockSchema = ReturnType<typeof createSchemaMock>;
