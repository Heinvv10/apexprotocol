/**
 * People Enrichment Schema (Phase 9.3)
 *
 * Extended profile data from enrichment services (LinkedIn public data,
 * Clearbit, Apollo, etc.) and speaking opportunity tracking.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
  real,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brandPeople } from "./people";

// ============================================================================
// Enums
// ============================================================================

export const enrichmentSourceEnum = pgEnum("enrichment_source", [
  "linkedin_public",
  "clearbit",
  "apollo",
  "manual",
  "website_scrape",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "conference",
  "webinar",
  "podcast",
  "panel",
  "workshop",
  "meetup",
  "summit",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "applied",
  "accepted",
  "declined",
  "expired",
]);

// ============================================================================
// Types
// ============================================================================

export interface CareerPosition {
  title: string;
  company: string;
  companyLinkedinUrl?: string;
  location?: string;
  startDate: string; // YYYY-MM format
  endDate?: string; // YYYY-MM format or null for current
  isCurrent?: boolean;
  description?: string;
}

export interface Education {
  school: string;
  schoolLinkedinUrl?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Publication {
  title: string;
  publisher: string;
  publicationDate?: string;
  url?: string;
  description?: string;
  coAuthors?: string[];
}

export interface ConferenceAppearance {
  name: string;
  eventDate: string;
  topic?: string;
  role?: "speaker" | "panelist" | "moderator" | "keynote";
  url?: string;
  audienceSize?: number;
  location?: string;
}

export interface PodcastAppearance {
  podcastName: string;
  episodeTitle?: string;
  episodeDate: string;
  url?: string;
  downloads?: number;
}

// ============================================================================
// People Enrichment Table
// ============================================================================

export const peopleEnrichment = pgTable(
  "people_enrichment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    personId: text("person_id")
      .notNull()
      .references(() => brandPeople.id, { onDelete: "cascade" }),

    // LinkedIn profile data
    linkedinHeadline: text("linkedin_headline"),
    linkedinAbout: text("linkedin_about"),
    linkedinProfileUrl: text("linkedin_profile_url"),
    linkedinPublicId: text("linkedin_public_id"), // e.g., "johndoe" from linkedin.com/in/johndoe

    // Current position (denormalized for quick access)
    currentPosition: text("current_position"),
    currentCompany: text("current_company"),
    currentCompanyLinkedinUrl: text("current_company_linkedin_url"),

    // Career history
    pastPositions: jsonb("past_positions").$type<CareerPosition[]>().default([]),
    totalYearsExperience: integer("total_years_experience"),

    // Education
    education: jsonb("education").$type<Education[]>().default([]),

    // Skills and certifications
    skills: jsonb("skills").$type<string[]>().default([]),
    topSkills: jsonb("top_skills").$type<string[]>().default([]), // Top 5 endorsed
    certifications: jsonb("certifications").$type<Certification[]>().default([]),

    // Languages
    languages: jsonb("languages").$type<string[]>().default([]),

    // Influence metrics
    influenceScore: real("influence_score"), // 0-100 calculated score
    linkedinConnectionCount: integer("linkedin_connection_count"),
    linkedinPostCount: integer("linkedin_post_count"),
    linkedinEngagementRate: real("linkedin_engagement_rate"), // avg likes+comments per post
    linkedinArticleCount: integer("linkedin_article_count"),

    // Speaking & publications
    conferenceAppearances: jsonb("conference_appearances")
      .$type<ConferenceAppearance[]>()
      .default([]),
    publications: jsonb("publications").$type<Publication[]>().default([]),
    podcastAppearances: jsonb("podcast_appearances")
      .$type<PodcastAppearance[]>()
      .default([]),

    // Awards and honors
    awards: jsonb("awards")
      .$type<{ name: string; issuer?: string; date?: string }[]>()
      .default([]),

    // Volunteer and board positions
    volunteerExperience: jsonb("volunteer_experience")
      .$type<{ role: string; organization: string; description?: string }[]>()
      .default([]),

    // Data quality
    enrichmentSource: enrichmentSourceEnum("enrichment_source"),
    enrichmentConfidence: real("enrichment_confidence"), // 0-1 confidence in data accuracy
    rawEnrichmentData: jsonb("raw_enrichment_data").$type<Record<string, unknown>>(),

    // Timestamps
    lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniquePersonEnrichment: unique().on(table.personId),
  })
);

// ============================================================================
// Speaking Opportunities Table
// ============================================================================

export const speakingOpportunities = pgTable("speaking_opportunities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Event info
  name: text("name").notNull(),
  description: text("description"),
  organizer: text("organizer"),
  organizerUrl: text("organizer_url"),

  // Event details
  eventType: eventTypeEnum("event_type").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }),
  eventEndDate: timestamp("event_end_date", { withTimezone: true }),
  location: text("location"), // City, Country or "Virtual"
  isVirtual: boolean("is_virtual").default(false),
  venue: text("venue"),

  // Application details
  cfpUrl: text("cfp_url"), // Call for Papers URL
  cfpDeadline: timestamp("cfp_deadline", { withTimezone: true }),
  applicationUrl: text("application_url"),

  // Topics and audience
  topics: jsonb("topics").$type<string[]>().default([]),
  targetAudience: text("target_audience"),
  expectedAudienceSize: integer("expected_audience_size"),

  // Compensation
  isPaid: boolean("is_paid").default(false),
  compensationDetails: text("compensation_details"),
  coversTravelExpenses: boolean("covers_travel_expenses").default(false),

  // Requirements
  requirements: text("requirements"),
  speakerBenefits: jsonb("speaker_benefits").$type<string[]>().default([]),

  // Source
  sourceUrl: text("source_url"),
  sourceType: text("source_type"), // 'papercall', 'sessionize', 'manual', etc.

  // Status
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Opportunity Matches Table (links opportunities to people)
// ============================================================================

export const opportunityMatches = pgTable(
  "opportunity_matches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    personId: text("person_id")
      .notNull()
      .references(() => brandPeople.id, { onDelete: "cascade" }),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => speakingOpportunities.id, { onDelete: "cascade" }),

    // Match quality
    matchScore: real("match_score"), // 0-100 how well person matches opportunity
    matchReasons: jsonb("match_reasons").$type<string[]>().default([]),

    // Matching criteria
    matchedTopics: jsonb("matched_topics").$type<string[]>().default([]),
    matchedSkills: jsonb("matched_skills").$type<string[]>().default([]),

    // User action
    status: opportunityStatusEnum("status").default("open"),
    userNotes: text("user_notes"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    responseReceivedAt: timestamp("response_received_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniquePersonOpportunity: unique().on(table.personId, table.opportunityId),
  })
);

// ============================================================================
// Relations
// ============================================================================

export const peopleEnrichmentRelations = relations(peopleEnrichment, ({ one }) => ({
  person: one(brandPeople, {
    fields: [peopleEnrichment.personId],
    references: [brandPeople.id],
  }),
}));

export const speakingOpportunitiesRelations = relations(
  speakingOpportunities,
  ({ many }) => ({
    matches: many(opportunityMatches),
  })
);

export const opportunityMatchesRelations = relations(opportunityMatches, ({ one }) => ({
  person: one(brandPeople, {
    fields: [opportunityMatches.personId],
    references: [brandPeople.id],
  }),
  opportunity: one(speakingOpportunities, {
    fields: [opportunityMatches.opportunityId],
    references: [speakingOpportunities.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type PeopleEnrichmentRecord = typeof peopleEnrichment.$inferSelect;
export type NewPeopleEnrichmentRecord = typeof peopleEnrichment.$inferInsert;
export type SpeakingOpportunity = typeof speakingOpportunities.$inferSelect;
export type NewSpeakingOpportunity = typeof speakingOpportunities.$inferInsert;
export type OpportunityMatch = typeof opportunityMatches.$inferSelect;
export type NewOpportunityMatch = typeof opportunityMatches.$inferInsert;
