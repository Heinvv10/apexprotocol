/**
 * Predictions Tables (ML Forecasting Support)
 * - predictions: Stores GEO score predictions from ML model
 * - modelMetadata: Tracks model versions, training history, and performance
 * - predictiveAlerts: Stores alerts triggered by predicted visibility drops
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  uuid,
  pgEnum,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { brands } from "./brands";
import { alertSeverityEnum } from "./geo-knowledge-base";

// Enums
export const entityTypeEnum = pgEnum("entity_type", [
  "brand",
  "keyword",
  "topic",
  "platform",
]);

export const predictionStatusEnum = pgEnum("prediction_status", [
  "active",
  "stale",
  "superseded",
]);

export const alertTypeEnum = pgEnum("predictive_alert_type", [
  "predicted_drop",
  "emerging_opportunity",
  "trend_reversal",
]);

export const modelStatusEnum = pgEnum("model_status", [
  "training",
  "active",
  "failed",
  "retired",
]);

/**
 * Predictions Table
 * Stores GEO score predictions from the ML forecasting model
 */
export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Foreign keys
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    // Entity identification
    entityType: entityTypeEnum("entity_type").notNull().default("brand"),
    entityId: text("entity_id"), // Optional: keyword/topic ID if not brand-level

    // Prediction dates
    predictionDate: timestamp("prediction_date").notNull().defaultNow(), // When prediction was made
    targetDate: timestamp("target_date").notNull(), // Date being predicted for

    // Prediction values
    predictedValue: real("predicted_value").notNull(), // Predicted GEO score (0-100)
    confidenceLower: real("confidence_lower").notNull(), // Lower bound of 95% CI
    confidenceUpper: real("confidence_upper").notNull(), // Upper bound of 95% CI
    confidence: real("confidence").notNull(), // Overall confidence score (0-1)

    // Trend analysis
    trend: text("trend").$type<"up" | "down" | "stable">(),
    trendMagnitude: real("trend_magnitude"), // Percentage change from current
    explanation: text("explanation"), // Human-readable explanation of prediction

    // Model tracking
    modelVersion: text("model_version").notNull(),

    // Status tracking
    status: predictionStatusEnum("status").notNull().default("active"),

    // Validation (for comparing predictions to actual values later)
    actualValue: real("actual_value"), // Filled in later when actual score is known
    predictionError: real("prediction_error"), // Difference between predicted and actual

    // Metadata
    metadata: jsonb("metadata").$type<PredictionMetadata>(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("predictions_brand_id_idx").on(table.brandId),
    index("predictions_target_date_idx").on(table.targetDate),
    index("predictions_brand_target_idx").on(table.brandId, table.targetDate),
    index("predictions_status_idx").on(table.status),
  ]
);

// Prediction metadata interface
export interface PredictionMetadata {
  historicalDataPoints?: number;
  dataQuality?: number; // 0-100 score for input data quality
  seasonalityDetected?: boolean;
  outlierCount?: number;
  trainingDuration?: number; // milliseconds
  algorithmUsed?: string;
  features?: string[];
  warnings?: string[];
}

// Types
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

// Relations
export const predictionsRelations = relations(predictions, ({ one }) => ({
  brand: one(brands, {
    fields: [predictions.brandId],
    references: [brands.id],
  }),
}));

/**
 * Model Metadata Table
 * Tracks ML model versions, training history, and performance metrics
 */
export const modelMetadata = pgTable(
  "model_metadata",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Model identification
    modelVersion: text("model_version").notNull().unique(),
    modelType: text("model_type").notNull().default("linear_regression"),

    // Training info
    trainedAt: timestamp("trained_at").notNull().defaultNow(),
    trainingDuration: integer("training_duration"), // milliseconds
    dataPointsUsed: integer("data_points_used"),
    dateRangeStart: timestamp("date_range_start"),
    dateRangeEnd: timestamp("date_range_end"),

    // Performance metrics
    performanceMetrics: jsonb("performance_metrics").$type<PerformanceMetrics>(),

    // Hyperparameters (for future extensibility)
    hyperparameters: jsonb("hyperparameters").$type<ModelHyperparameters>(),

    // Status
    status: modelStatusEnum("status").notNull().default("active"),
    isLatest: boolean("is_latest").notNull().default(true),

    // Error tracking
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("model_metadata_version_idx").on(table.modelVersion),
    index("model_metadata_status_idx").on(table.status),
    index("model_metadata_latest_idx").on(table.isLatest),
  ]
);

// Performance metrics interface
export interface PerformanceMetrics {
  mae?: number; // Mean Absolute Error
  rmse?: number; // Root Mean Square Error
  mape?: number; // Mean Absolute Percentage Error
  r2?: number; // R-squared coefficient
  accuracy?: number; // Overall accuracy percentage
  avgConfidence?: number; // Average confidence score
}

// Hyperparameters interface
export interface ModelHyperparameters {
  lookbackPeriod?: number; // Days of historical data used
  predictionHorizon?: number; // Days to predict ahead
  confidenceLevel?: number; // e.g., 0.95 for 95% CI
  outlierThreshold?: number; // Standard deviations for outlier detection
  minDataPoints?: number; // Minimum required data points
}

// Types
export type ModelMetadataRecord = typeof modelMetadata.$inferSelect;
export type NewModelMetadata = typeof modelMetadata.$inferInsert;

/**
 * Predictive Alerts Table
 * Stores alerts triggered by predicted visibility drops or opportunities
 */
export const predictiveAlerts = pgTable(
  "predictive_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Foreign keys
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    predictionId: uuid("prediction_id").references(() => predictions.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").notNull(), // Clerk user ID to notify

    // Alert classification
    alertType: alertTypeEnum("alert_type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),

    // Prediction details
    confidence: real("confidence").notNull(), // 0-1 scale
    currentValue: real("current_value").notNull(), // Current GEO score
    predictedValue: real("predicted_value").notNull(), // Predicted GEO score
    predictedChange: real("predicted_change").notNull(), // Percentage change

    // Timing
    leadTime: integer("lead_time").notNull(), // Days until predicted impact
    predictedImpactDate: timestamp("predicted_impact_date").notNull(),

    // Content
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    actionRecommendation: text("action_recommendation"),

    // Status tracking
    isRead: boolean("is_read").notNull().default(false),
    isDismissed: boolean("is_dismissed").notNull().default(false),
    dismissedAt: timestamp("dismissed_at"),

    // Validation (track if prediction was accurate)
    wasAccurate: boolean("was_accurate"),
    validatedAt: timestamp("validated_at"),
    validationNotes: text("validation_notes"),

    // Rate limiting
    lastAlertedAt: timestamp("last_alerted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("predictive_alerts_brand_idx").on(table.brandId),
    index("predictive_alerts_user_idx").on(table.userId),
    index("predictive_alerts_type_idx").on(table.alertType),
    index("predictive_alerts_severity_idx").on(table.severity),
    index("predictive_alerts_unread_idx").on(table.userId, table.isRead),
  ]
);

// Types
export type PredictiveAlert = typeof predictiveAlerts.$inferSelect;
export type NewPredictiveAlert = typeof predictiveAlerts.$inferInsert;

// Relations
export const predictiveAlertsRelations = relations(
  predictiveAlerts,
  ({ one }) => ({
    brand: one(brands, {
      fields: [predictiveAlerts.brandId],
      references: [brands.id],
    }),
    prediction: one(predictions, {
      fields: [predictiveAlerts.predictionId],
      references: [predictions.id],
    }),
  })
);
