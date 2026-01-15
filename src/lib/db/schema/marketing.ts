/**
 * Marketing System Schema
 * Database tables for integrated marketing automation platform
 * Integrates: Mautic (CRM), ListMonk (Email), Postiz (Social), Matomo (Analytics)
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

// ============================================================================
// Enums
// ============================================================================

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'archived',
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'email',
  'social',
  'webinar',
  'landing_page',
  'retargeting',
]);

export const emailEventTypeEnum = pgEnum('email_event_type', [
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'unsubscribed',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'engaged',
  'trialing',
  'customer',
  'lost',
  'archived',
]);

export const leadSourceEnum = pgEnum('lead_source', [
  'website',
  'linkedin',
  'email',
  'social',
  'referral',
  'webinar',
  'imported',
  'api',
]);

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'scheduled',
  'published',
  'paused',
  'archived',
  'failed',
]);

// ============================================================================
// Campaign Management
// ============================================================================

/**
 * Marketing campaigns table
 * Tracks all marketing campaigns (email, social, webinar, etc.)
 */
export const campaigns = pgTable(
  'marketing_campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalCampaignId: varchar('external_campaign_id', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: campaignTypeEnum('type').notNull().default('email'),
    status: campaignStatusEnum('status').notNull().default('draft'),
    budget: decimal('budget', { precision: 10, scale: 2 }),
    leads: integer('leads').default(0),
    opens: integer('opens').default(0),
    clicks: integer('clicks').default(0),
    conversions: integer('conversions').default(0),
    revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    metadata: jsonb('metadata').$type<{
      mauticId?: string;
      listmonkId?: string;
      subjects?: string[];
      abTest?: boolean;
      winner?: string;
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_campaign_org').on(table.organizationId),
    index('idx_campaign_status').on(table.status),
    index('idx_campaign_type').on(table.type),
  ]
);

// ============================================================================
// Lead Management
// ============================================================================

/**
 * Leads table
 * Tracks all leads/contacts and their engagement
 */
export const leads = pgTable(
  'marketing_leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalLeadId: varchar('external_lead_id', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    company: varchar('company', { length: 255 }),
    title: varchar('title', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    source: leadSourceEnum('source').notNull(),
    status: leadStatusEnum('status').notNull().default('new'),
    leadScore: integer('lead_score').default(0),
    mqlScore: integer('mql_score').default(0),
    sqlScore: integer('sql_score').default(0),
    tags: jsonb('tags').$type<string[]>().default([]),
    metadata: jsonb('metadata').$type<{
      mauticId?: string;
      listmonkId?: string;
      listId?: string;
      website?: string;
      industry?: string;
      companySize?: string;
      budget?: string;
      timezone?: string;
      attributes?: Record<string, unknown>;
      createdAt?: string;
      rawData?: unknown;
    }>(),
    lastEngagedAt: timestamp('last_engaged_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_lead_org').on(table.organizationId),
    index('idx_lead_email').on(table.email),
    index('idx_lead_status').on(table.status),
    index('idx_lead_score').on(table.leadScore),
  ]
);

// ============================================================================
// Email Management
// ============================================================================

/**
 * Email lists table
 * Tracks all email subscriber lists
 */
export const emailLists = pgTable(
  'marketing_email_lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalListId: varchar('external_list_id', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    subscriberCount: integer('subscriber_count').default(0),
    unsubscribeCount: integer('unsubscribe_count').default(0),
    bounceCount: integer('bounce_count').default(0),
    metadata: jsonb('metadata').$type<{
      listmonkId?: string;
      mauticId?: string;
      automation?: boolean;
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_email_list_org').on(table.organizationId),
    index('idx_email_list_name').on(table.name),
  ]
);

/**
 * Email events table
 * Tracks email sends, opens, clicks, bounces, etc.
 */
export const emailEvents = pgTable(
  'marketing_email_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'cascade',
    }),
    listId: uuid('list_id').references(() => emailLists.id, {
      onDelete: 'cascade',
    }),
    event: emailEventTypeEnum('event').notNull(),
    url: varchar('url', { length: 2048 }),
    userAgent: varchar('user_agent', { length: 512 }),
    ipAddress: varchar('ip_address', { length: 50 }),
    metadata: jsonb('metadata').$type<{
      browser?: string;
      device?: string;
      os?: string;
      region?: string;
      listmonkId?: string;
      campaignId?: string;
      linkId?: string;
      clickCount?: number;
      reason?: string;
      bounceType?: string;
      mauticEventId?: string;
      subject?: string;
      fromEmail?: string;
      clickedUrl?: string;
    }>(),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => [
    index('idx_email_event_org').on(table.organizationId),
    index('idx_email_event_lead').on(table.leadId),
    index('idx_email_event_campaign').on(table.campaignId),
    index('idx_email_event_type').on(table.event),
    index('idx_email_event_timestamp').on(table.timestamp),
  ]
);

// ============================================================================
// Social Media Management
// ============================================================================

/**
 * Social posts table
 * Tracks all scheduled and published social media posts
 */
export const socialPosts = pgTable(
  'marketing_social_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'set null',
    }),
    externalPostId: varchar('external_post_id', { length: 255 }),
    content: text('content').notNull(),
    platforms: jsonb('platforms').$type<string[]>().notNull(),
    imageUrls: jsonb('image_urls').$type<string[]>(),
    hashtags: jsonb('hashtags').$type<string[]>(),
    status: postStatusEnum('status').notNull().default('draft'),
    scheduledAt: timestamp('scheduled_at'),
    publishedAt: timestamp('published_at'),
    likes: integer('likes').default(0),
    comments: integer('comments').default(0),
    shares: integer('shares').default(0),
    views: integer('views').default(0),
    engagementRate: decimal('engagement_rate', { precision: 5, scale: 2 }).default('0'),
    metadata: jsonb('metadata').$type<{
      postizId?: string;
      linkedinId?: string;
      tiktokId?: string;
      instagramId?: string;
      twitterId?: string;
      failureReason?: string;
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_social_post_org').on(table.organizationId),
    index('idx_social_post_status').on(table.status),
    index('idx_social_post_published').on(table.publishedAt),
    index('idx_social_post_scheduled').on(table.scheduledAt),
  ]
);

// ============================================================================
// Analytics & Tracking
// ============================================================================

/**
 * Analytics events table
 * Tracks all visitor interactions (from Matomo)
 */
export const analyticsEvents = pgTable(
  'marketing_analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'set null',
    }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    sessionId: varchar('session_id', { length: 255 }),
    userId: varchar('user_id', { length: 255 }),
    pageUrl: varchar('page_url', { length: 2048 }),
    referrer: varchar('referrer', { length: 2048 }),
    utmSource: varchar('utm_source', { length: 255 }),
    utmMedium: varchar('utm_medium', { length: 255 }),
    utmCampaign: varchar('utm_campaign', { length: 255 }),
    utmContent: varchar('utm_content', { length: 255 }),
    utmTerm: varchar('utm_term', { length: 255 }),
    userAgent: varchar('user_agent', { length: 512 }),
    ipAddress: varchar('ip_address', { length: 50 }),
    properties: jsonb('properties').$type<Record<string, any>>(),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => [
    index('idx_analytics_org').on(table.organizationId),
    index('idx_analytics_campaign').on(table.campaignId),
    index('idx_analytics_lead').on(table.leadId),
    index('idx_analytics_event_type').on(table.eventType),
    index('idx_analytics_session').on(table.sessionId),
    index('idx_analytics_timestamp').on(table.timestamp),
  ]
);

/**
 * Marketing metrics table
 * Daily/monthly aggregated metrics for dashboards
 */
export const marketingMetrics = pgTable(
  'marketing_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'set null',
    }),
    date: timestamp('date').notNull(),
    period: pgEnum('period', ['day', 'week', 'month', 'year'])('period').notNull(),
    leads: integer('leads').default(0),
    emailSent: integer('email_sent').default(0),
    emailOpened: integer('email_opened').default(0),
    emailClicked: integer('email_clicked').default(0),
    emailBounced: integer('email_bounced').default(0),
    socialImpressions: integer('social_impressions').default(0),
    socialEngagements: integer('social_engagements').default(0),
    websiteVisits: integer('website_visits').default(0),
    conversions: integer('conversions').default(0),
    revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_metrics_org').on(table.organizationId),
    index('idx_metrics_campaign').on(table.campaignId),
    index('idx_metrics_date').on(table.date),
  ]
);

// ============================================================================
// Automation & Workflows
// ============================================================================

/**
 * Email sequences table
 * Pre-built and custom email sequences
 */
export const emailSequences = pgTable(
  'marketing_email_sequences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isTemplate: boolean('is_template').default(false),
    emailIds: jsonb('email_ids').$type<string[]>(),
    triggerType: varchar('trigger_type', {
      length: 100,
      enum: ['immediate', 'delayed', 'event', 'behavior'],
    }),
    triggerDelay: integer('trigger_delay'), // milliseconds
    enrollmentCount: integer('enrollment_count').default(0),
    conversionCount: integer('conversion_count').default(0),
    conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }).default('0'),
    isActive: boolean('is_active').default(true),
    metadata: jsonb('metadata').$type<{
      mauticId?: string;
      automationId?: string;
      tags?: string[];
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_sequence_org').on(table.organizationId),
    index('idx_sequence_template').on(table.isTemplate),
  ]
);

/**
 * Lead automation logs table
 * Tracks when leads are enrolled/unenrolled in sequences
 */
export const automationLogs = pgTable(
  'marketing_automation_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    sequenceId: uuid('sequence_id').references(() => emailSequences.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', {
      length: 50,
      enum: ['enrolled', 'unenrolled', 'paused', 'resumed', 'completed'],
    }).notNull(),
    reason: text('reason'),
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => [
    index('idx_automation_org').on(table.organizationId),
    index('idx_automation_lead').on(table.leadId),
    index('idx_automation_sequence').on(table.sequenceId),
  ]
);

// ============================================================================
// Type Exports
// ============================================================================

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type EmailList = typeof emailLists.$inferSelect;
export type NewEmailList = typeof emailLists.$inferInsert;

export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;

export type EmailSequence = typeof emailSequences.$inferSelect;
export type NewEmailSequence = typeof emailSequences.$inferInsert;

export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export type MarketingMetrics = typeof marketingMetrics.$inferSelect;
export type NewMarketingMetrics = typeof marketingMetrics.$inferInsert;

export type AutomationLog = typeof automationLogs.$inferSelect;
export type NewAutomationLog = typeof automationLogs.$inferInsert;

// ============================================================================
// Export for index
// ============================================================================

export {
  campaigns as marketingCampaigns,
  leads as marketingLeads,
  emailLists as marketingEmailLists,
  emailEvents as marketingEmailEvents,
  socialPosts as marketingSocialPosts,
  analyticsEvents as marketingAnalyticsEvents,
  marketingMetrics as marketingMetricsTable,
  emailSequences as marketingEmailSequences,
  automationLogs as marketingAutomationLogs,
};
