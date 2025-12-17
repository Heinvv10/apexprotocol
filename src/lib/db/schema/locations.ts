/**
 * Location Schema - Phase 9.2: Google Places Integration
 *
 * Stores brand locations and reviews from Google Places API
 * for local SEO signals and customer sentiment analysis.
 */

import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { sentimentEnum } from "./mentions";

// Enums
export const locationTypeEnum = pgEnum("location_type", [
  "headquarters",
  "branch",
  "store",
  "office",
  "warehouse",
  "factory",
  "distribution_center",
]);

export const reviewSourceEnum = pgEnum("review_source", [
  "google",
  "yelp",
  "facebook",
  "trustpilot",
  "manual",
]);

// Types
export interface LocationPhoto {
  url: string;
  attribution: string;
  width?: number;
  height?: number;
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface LocationMetadata {
  googlePlaceId?: string;
  googleMapsUrl?: string;
  lastGoogleSync?: string;
  syncErrors?: string[];
  verificationStatus?: "verified" | "unverified" | "pending";
}

export interface ReviewKeyword {
  word: string;
  count: number;
  sentiment: "positive" | "neutral" | "negative";
}

// Brand Locations table
export const brandLocations = pgTable("brand_locations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Google Places identification
  placeId: text("place_id").unique(), // Google Place ID

  // Basic info
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),

  // Geolocation
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Location type
  locationType: locationTypeEnum("location_type").default("headquarters"),
  isPrimary: boolean("is_primary").default(false),

  // Contact
  phone: text("phone"),
  website: text("website"),
  email: text("email"),

  // Google Places data
  rating: real("rating"), // 1-5
  reviewCount: integer("review_count").default(0),
  categories: jsonb("categories").$type<string[]>().default([]),
  openingHours: jsonb("opening_hours").$type<OpeningHours>(),
  photos: jsonb("photos").$type<LocationPhoto[]>().default([]),
  priceLevel: integer("price_level"), // 0-4

  // Status
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),

  // Metadata
  metadata: jsonb("metadata").$type<LocationMetadata>().default({}),

  // Sync tracking
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Brand Reviews table
export const brandReviews = pgTable("brand_reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  locationId: text("location_id")
    .notNull()
    .references(() => brandLocations.id, { onDelete: "cascade" }),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Review source
  source: reviewSourceEnum("source").default("google"),
  externalId: text("external_id"), // ID from source platform

  // Author info
  authorName: text("author_name"),
  authorPhotoUrl: text("author_photo_url"),
  authorProfileUrl: text("author_profile_url"),

  // Review content
  rating: integer("rating").notNull(), // 1-5
  text: text("text"),
  language: text("language").default("en"),

  // AI analysis
  sentiment: sentimentEnum("sentiment"), // positive, neutral, negative
  sentimentScore: real("sentiment_score"), // -1 to 1
  keywords: jsonb("keywords").$type<ReviewKeyword[]>().default([]),

  // Response tracking
  ownerResponse: text("owner_response"),
  ownerRespondedAt: timestamp("owner_responded_at", { withTimezone: true }),

  // Timestamps
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Location Scores table (aggregated metrics)
export const locationScores = pgTable("location_scores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  locationId: text("location_id")
    .notNull()
    .references(() => brandLocations.id, { onDelete: "cascade" }),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Scores (0-100)
  overallScore: integer("overall_score").default(0),
  ratingScore: integer("rating_score").default(0), // Based on Google rating
  reviewVolumeScore: integer("review_volume_score").default(0), // Based on review count
  sentimentScore: integer("sentiment_score").default(0), // Based on review sentiment
  responseScore: integer("response_score").default(0), // Based on owner responses

  // Review breakdown
  totalReviews: integer("total_reviews").default(0),
  positiveReviews: integer("positive_reviews").default(0),
  neutralReviews: integer("neutral_reviews").default(0),
  negativeReviews: integer("negative_reviews").default(0),

  // Keywords extracted
  topPositiveKeywords: jsonb("top_positive_keywords").$type<string[]>().default([]),
  topNegativeKeywords: jsonb("top_negative_keywords").$type<string[]>().default([]),

  // Score period
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),

  // Timestamps
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const brandLocationsRelations = relations(brandLocations, ({ one, many }) => ({
  brand: one(brands, {
    fields: [brandLocations.brandId],
    references: [brands.id],
  }),
  reviews: many(brandReviews),
  scores: many(locationScores),
}));

export const brandReviewsRelations = relations(brandReviews, ({ one }) => ({
  location: one(brandLocations, {
    fields: [brandReviews.locationId],
    references: [brandLocations.id],
  }),
  brand: one(brands, {
    fields: [brandReviews.brandId],
    references: [brands.id],
  }),
}));

export const locationScoresRelations = relations(locationScores, ({ one }) => ({
  location: one(brandLocations, {
    fields: [locationScores.locationId],
    references: [brandLocations.id],
  }),
  brand: one(brands, {
    fields: [locationScores.brandId],
    references: [brands.id],
  }),
}));

// Type exports
export type BrandLocation = typeof brandLocations.$inferSelect;
export type NewBrandLocation = typeof brandLocations.$inferInsert;
export type BrandReview = typeof brandReviews.$inferSelect;
export type NewBrandReview = typeof brandReviews.$inferInsert;
export type LocationScore = typeof locationScores.$inferSelect;
export type NewLocationScore = typeof locationScores.$inferInsert;
