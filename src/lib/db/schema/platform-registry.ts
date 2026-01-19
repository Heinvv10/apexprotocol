import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";

/**
 * Platform tier enumeration for feature gating
 * Tier 1: Basic platforms (easy integration)
 * Tier 2: Regional/emerging platforms
 * Tier 3: Vertical/specialized platforms
 * Tier 4: Industry-specific platforms
 */
export const platformTierEnum = pgEnum("platform_tier", [
  "tier_1",
  "tier_2",
  "tier_3",
  "tier_4",
]);

/**
 * Integration status enumeration
 */
export const integrationStatusEnum = pgEnum("integration_status", [
  "not_configured",
  "configured",
  "active",
  "inactive",
  "error",
]);

/**
 * Platform registry table
 *
 * Stores configuration for all AI platforms that can be monitored.
 * Includes API credentials, rate limits, authentication methods, and metadata.
 *
 * @table platform_registry
 */
export const platformRegistry = pgTable("platform_registry", {
  /** Unique identifier for platform */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Platform name (e.g., "openai_search", "bing_copilot") */
  name: text("name").notNull().unique(),

  /** Human-readable display name */
  displayName: text("display_name").notNull(),

  /** Platform description */
  description: text("description"),

  /** Which tier this platform belongs to (determines rollout schedule) */
  tier: platformTierEnum("tier").notNull(),

  /** Whether this platform is enabled for new monitoring */
  enabled: boolean("enabled").default(false).notNull(),

  /** API endpoint URL template */
  apiEndpoint: text("api_endpoint"),

  /** Authentication method (none, api_key, oauth2, bearer, custom) */
  authMethod: text("auth_method").default("api_key").notNull(),

  /** Encrypted API credentials (stored securely) */
  credentials: jsonb("credentials").$type<PlatformCredentials>().default({}),

  /** Rate limiting configuration */
  rateLimit: jsonb("rate_limit").$type<RateLimitConfig>().default({
    requestsPerMinute: 10,
    requestsPerDay: 1000,
  }),

  /** Query parameters and options for this platform */
  queryConfig: jsonb("query_config").$type<QueryConfig>().default({}),

  /** Response parsing configuration */
  responseConfig: jsonb("response_config").$type<ResponseConfig>().default({}),

  /** Feature flags for platform-specific functionality */
  features: jsonb("features").$type<Record<string, boolean>>().default({}),

  /** Health check configuration */
  healthCheck: jsonb("health_check").$type<HealthCheckConfig>().default({
    enabled: true,
    intervalMinutes: 60,
  }),

  /** Metadata about platform integration */
  metadata: jsonb("metadata").$type<PlatformMetadata>().default({}),

  /** Timestamps */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Platform integration status per brand
 *
 * Tracks which platforms are enabled for each brand, monitoring status,
 * last sync time, and any errors encountered.
 *
 * @table platform_integrations
 */
export const platformIntegrations = pgTable("platform_integrations", {
  /** Unique identifier */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Reference to brand */
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  /** Reference to platform */
  platformId: text("platform_id")
    .notNull()
    .references(() => platformRegistry.id, { onDelete: "cascade" }),

  /** Current integration status */
  status: integrationStatusEnum("status").default("not_configured").notNull(),

  /** Whether monitoring is currently active */
  isMonitoring: boolean("is_monitoring").default(false).notNull(),

  /** Last successful query time */
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),

  /** Last attempted query time */
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),

  /** Error message from last failed attempt */
  lastError: text("last_error"),

  /** Number of consecutive failures */
  consecutiveFailures: integer("consecutive_failures").default(0).notNull(),

  /** Monitoring statistics */
  stats: jsonb("stats").$type<MonitoringStats>().default({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageResponseTimeMs: 0,
  }),

  /** Configuration overrides for this brand-platform combination */
  configOverrides: jsonb("config_overrides").$type<Record<string, unknown>>().default({}),

  /** Timestamps */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Platform query results cache
 *
 * Stores results from multi-platform queries for quick retrieval
 * and historical analysis.
 *
 * @table platform_query_results
 */
export const platformQueryResults = pgTable("platform_query_results", {
  /** Unique identifier */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Reference to brand */
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  /** Reference to platform integration */
  integrationId: text("integration_id")
    .notNull()
    .references(() => platformIntegrations.id, { onDelete: "cascade" }),

  /** The query that was executed */
  query: text("query").notNull(),

  /** Raw platform response */
  response: text("response").notNull(),

  /** Parsed/structured response data */
  parsedData: jsonb("parsed_data").$type<Record<string, unknown>>().default({}),

  /** Visibility metrics */
  metrics: jsonb("metrics").$type<VisibilityMetrics>().default({
    visibility: 0,
    position: null,
    confidence: 0,
  }),

  /** Response time in milliseconds */
  responseTimeMs: integer("response_time_ms"),

  /** Query execution status */
  status: text("status").notNull(), // success, partial, failed

  /** Timestamp of query execution */
  queryExecutedAt: timestamp("query_executed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  /** Timestamp when result expires */
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  /** Timestamps */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Relations
 */
export const platformRegistryRelations = relations(
  platformRegistry,
  ({ many }) => ({
    integrations: many(platformIntegrations),
  })
);

export const platformIntegrationsRelations = relations(
  platformIntegrations,
  ({ one, many }) => ({
    brand: one(brands, {
      fields: [platformIntegrations.brandId],
      references: [brands.id],
    }),
    platform: one(platformRegistry, {
      fields: [platformIntegrations.platformId],
      references: [platformRegistry.id],
    }),
    queryResults: many(platformQueryResults),
  })
);

export const platformQueryResultsRelations = relations(
  platformQueryResults,
  ({ one }) => ({
    brand: one(brands, {
      fields: [platformQueryResults.brandId],
      references: [brands.id],
    }),
    integration: one(platformIntegrations, {
      fields: [platformQueryResults.integrationId],
      references: [platformIntegrations.id],
    }),
  })
);

/**
 * Type definitions
 */

export interface PlatformCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  oauth2Config?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  customHeaders?: Record<string, string>;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  burstLimit?: number;
  burstDurationSeconds?: number;
}

export interface QueryConfig {
  maxRetries?: number;
  timeoutSeconds?: number;
  includeContext?: boolean;
  customParams?: Record<string, unknown>;
  queryTemplates?: Record<string, string>;
}

export interface ResponseConfig {
  parseJSON?: boolean;
  extractPosition?: boolean;
  extractSentiment?: boolean;
  customParsers?: Record<string, string>;
  fieldMappings?: Record<string, string>;
}

export interface HealthCheckConfig {
  enabled: boolean;
  intervalMinutes: number;
  testQuery?: string;
  expectedStatusCode?: number;
}

export interface PlatformMetadata {
  homepage?: string;
  documentation?: string;
  supportEmail?: string;
  integrationLevel?: "full" | "partial" | "basic";
  costPerQuery?: number;
  monthlyQuota?: number;
  features?: string[];
  tags?: string[];
  releaseDate?: string;
}

export interface MonitoringStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTimeMs: number;
  lastQueryTime?: string;
}

export interface VisibilityMetrics {
  visibility: number; // 0-100 percentage
  position: number | null; // Position in response (-1 if not found)
  confidence: number; // 0-100 confidence score
  sentiment?: "positive" | "neutral" | "negative";
  citationCount?: number;
}

// Type exports
export type PlatformRegistry = typeof platformRegistry.$inferSelect;
export type NewPlatformRegistry = typeof platformRegistry.$inferInsert;

export type PlatformIntegration = typeof platformIntegrations.$inferSelect;
export type NewPlatformIntegration = typeof platformIntegrations.$inferInsert;

export type PlatformQueryResult = typeof platformQueryResults.$inferSelect;
export type NewPlatformQueryResult = typeof platformQueryResults.$inferInsert;
