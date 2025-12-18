/**
 * Feedback Tables (GraphQL Support)
 * - recommendation_feedback: Stores user feedback on recommendations
 * - geo_score_history: Tracks GEO score changes over time
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { recommendations } from "./recommendations";
import { brands } from "./brands";

/**
 * Recommendation Feedback Table
 * Stores user feedback and ratings for recommendations
 */
export const recommendationFeedback = pgTable("recommendation_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  recommendationId: uuid("recommendation_id")
    .notNull()
    .references(() => recommendations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),

  // Feedback data
  rating: integer("rating").notNull(), // 1-5 star rating
  wasHelpful: boolean("was_helpful").notNull(),
  comment: text("comment"),

  // Impact tracking
  actualImpact: real("actual_impact"), // 0-100 scale, actual measured impact
  expectedImpact: real("expected_impact"), // What was predicted

  // Status
  implementationNotes: text("implementation_notes"),
  timeToImplement: integer("time_to_implement"), // in hours

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type RecommendationFeedback = typeof recommendationFeedback.$inferSelect;
export type NewRecommendationFeedback = typeof recommendationFeedback.$inferInsert;

// Relations
export const recommendationFeedbackRelations = relations(
  recommendationFeedback,
  ({ one }) => ({
    recommendation: one(recommendations, {
      fields: [recommendationFeedback.recommendationId],
      references: [recommendations.id],
    }),
  })
);

/**
 * GEO Score History Table
 * Tracks historical GEO scores for trend analysis
 */
export const geoScoreHistory = pgTable("geo_score_history", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Score components
  overallScore: real("overall_score").notNull(),
  visibilityScore: real("visibility_score").notNull(),
  sentimentScore: real("sentiment_score").notNull(),
  recommendationScore: real("recommendation_score").notNull(),
  competitorGapScore: real("competitor_gap_score"),

  // Platform breakdown
  platformScores: jsonb("platform_scores").$type<PlatformScoreBreakdown>(),

  // Change tracking
  previousScore: real("previous_score"),
  scoreChange: real("score_change"), // Difference from previous
  trend: text("trend").$type<"up" | "down" | "stable">(),

  // Calculation metadata
  mentionCount: integer("mention_count"),
  positiveMentions: integer("positive_mentions"),
  negativeMentions: integer("negative_mentions"),
  neutralMentions: integer("neutral_mentions"),
  recommendationCount: integer("recommendation_count"),
  completedRecommendations: integer("completed_recommendations"),

  // Additional context
  calculationNotes: text("calculation_notes"),
  dataQuality: real("data_quality"), // 0-100 confidence in score accuracy

  // Timestamps
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
});

// Platform score breakdown interface
export interface PlatformScoreBreakdown {
  chatgpt?: number;
  claude?: number;
  gemini?: number;
  perplexity?: number;
  grok?: number;
  deepseek?: number;
  meta_ai?: number;
  [key: string]: number | undefined;
}

// Types
export type GeoScoreHistory = typeof geoScoreHistory.$inferSelect;
export type NewGeoScoreHistory = typeof geoScoreHistory.$inferInsert;

// Relations
export const geoScoreHistoryRelations = relations(geoScoreHistory, ({ one }) => ({
  brand: one(brands, {
    fields: [geoScoreHistory.brandId],
    references: [brands.id],
  }),
}));
