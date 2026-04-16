/**
 * Browser Sessions Schema
 *
 * Drizzle ORM schema for persistent browser session storage.
 * Used by the browser query system to store and reuse sessions
 * across multiple queries.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

/**
 * Browser sessions table
 *
 * Stores encrypted session data for browser-based platform queries.
 * Sessions are automatically cleaned up after expiration.
 *
 * @table browser_sessions
 */
export const browserSessions = pgTable("browser_sessions", {
  /** Unique session identifier */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Platform name (e.g., "perplexity", "claude_web") */
  platformName: text("platform_name").notNull(),

  /** User ID who owns this session */
  userId: text("user_id").notNull(),

  /** Session status: active, expired, revoked, suspended */
  status: text("status").notNull().default("active"),

  /** Reason for suspension/revocation */
  suspensionReason: text("suspension_reason"),

  /** Encrypted session data (cookies, localStorage, etc.) */
  encryptedData: text("encrypted_data"),

  /** Session metadata */
  metadata: jsonb("metadata").$type<SessionMetadata>().default({
    userAgent: "",
    viewport: { width: 1366, height: 768 },
    timezone: "UTC",
    language: "en",
    lastIpAddress: "",
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
  }),

  /** Statistics about this session */
  stats: jsonb("stats").$type<SessionStats>().default({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    consecutiveFailures: 0,
    averageResponseTimeMs: 0,
  }),

  /** When this session was created */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  /** When this session was last used */
  lastUsedAt: timestamp("last_used_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  /** When this session expires and can be deleted */
  expiresAt: timestamp("expires_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
});

/**
 * Browser query logs table
 *
 * Stores historical records of browser queries for debugging,
 * analytics, and compliance.
 *
 * @table browser_query_logs
 */
export const browserQueryLogs = pgTable("browser_query_logs", {
  /** Unique log entry identifier */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Reference to session */
  sessionId: text("session_id").notNull(),

  /** Brand being monitored */
  brandId: text("brand_id"),

  /** Platform being queried */
  platformName: text("platform_name").notNull(),

  /** The query that was executed */
  query: text("query").notNull(),

  /** Query execution status */
  status: text("status").notNull(), // success, partial, failed, captcha, rate_limit

  /** Response content */
  response: text("response"),

  /** Extracted data from response */
  extractedData: jsonb("extracted_data").$type<ExtractedData>().default({}),

  /** Error message if query failed */
  errorMessage: text("error_message"),

  /** Error type if applicable */
  errorType: text("error_type"), // captcha, rate_limit, timeout, auth, etc.

  /** Path to error screenshot if captured */
  screenshotPath: text("screenshot_path"),

  /** Query execution metrics */
  metrics: jsonb("metrics").$type<QueryMetrics>().default({}),

  /** Response time in milliseconds */
  responseTimeMs: integer("response_time_ms"),

  /** Number of retries needed */
  retryCount: integer("retry_count").default(0),

  /** When query was executed */
  executedAt: timestamp("executed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  /** When log entry was created */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Browser platform health table
 *
 * Tracks platform health status, rate limits, and blocklists.
 * Used for monitoring and circuit-breaking.
 *
 * @table browser_platform_health
 */
export const browserPlatformHealth = pgTable("browser_platform_health", {
  /** Unique identifier */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Platform name */
  platformName: text("platform_name").notNull().unique(),

  /** Overall health status */
  status: text("status").notNull(), // healthy, degraded, down, rate_limited, blocked

  /** Last known status change time */
  lastStatusChange: timestamp("last_status_change", { withTimezone: true })
    .defaultNow()
    .notNull(),

  /** Last successful query time */
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),

  /** Last failed query time */
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),

  /** Consecutive failure count */
  consecutiveFailures: integer("consecutive_failures").default(0),

  /** Platform metrics and stats */
  stats: jsonb("stats").$type<PlatformHealthStats>().default({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    captchaCount: 0,
    rateLimitCount: 0,
    averageResponseTimeMs: 0,
    uptime: 100,
  }),

  /** Current rate limit status */
  rateLimitStatus: jsonb("rate_limit_status").$type<RateLimitStatus>().default({
    limited: false,
  }),

  /** Blocklist entries (IPs, fingerprints, etc.) */
  blockedIdentifiers: jsonb("blocked_identifiers").$type<string[]>().default([]),

  /** Configuration for this platform */
  config: jsonb("config").$type<Record<string, unknown>>().default({}),

  /** When was health status last updated */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Type definitions
 */

export interface SessionMetadata {
  userAgent?: string;
  viewport?: { width: number; height: number };
  timezone?: string;
  language?: string;
  lastIpAddress?: string;
  requestCount?: number;
  successCount?: number;
  failureCount?: number;
  [key: string]: unknown;
}

export interface SessionStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  consecutiveFailures: number;
  averageResponseTimeMs: number;
}

export interface ExtractedData {
  mainContent?: string;
  citations?: Array<{ url: string; title?: string; description?: string }>;
  relatedQueries?: string[];
  metadata?: Record<string, unknown>;
}

export interface QueryMetrics {
  navigationStartMs?: number;
  navigationEndMs?: number;
  domReadyMs?: number;
  contentReadyMs?: number;
  cpuUsagePercent?: number;
  memoryUsageMb?: number;
  networkBytesDown?: number;
  captchaDetected?: boolean;
  rateLimitHit?: boolean;
}

export interface PlatformHealthStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  captchaCount: number;
  rateLimitCount: number;
  averageResponseTimeMs: number;
  uptime: number; // 0-100
}

export interface RateLimitStatus {
  limited: boolean;
  retryAfterSeconds?: number;
  remainingQuota?: number;
  resetAt?: string; // ISO timestamp
}

// Type exports
export type BrowserSession = typeof browserSessions.$inferSelect;
export type NewBrowserSession = typeof browserSessions.$inferInsert;

export type BrowserQueryLog = typeof browserQueryLogs.$inferSelect;
export type NewBrowserQueryLog = typeof browserQueryLogs.$inferInsert;

export type BrowserPlatformHealth = typeof browserPlatformHealth.$inferSelect;
export type NewBrowserPlatformHealth = typeof browserPlatformHealth.$inferInsert;
