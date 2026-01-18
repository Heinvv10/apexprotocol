// Schema exports for Drizzle ORM

// Tables
export {
  organizations,
  planEnum,
  type Organization,
  type NewOrganization,
  type BrandingSettings,
  type OrganizationSettings,
  type OnboardingStatus,
} from "./organizations";

export {
  users,
  roleEnum,
  type User,
  type NewUser,
  type UserPreferences,
} from "./users";

export {
  brands,
  type Brand,
  type NewBrand,
  type BrandCompetitor,
  type BrandVoice,
  type BrandVisual,
} from "./brands";

export {
  brandMentions,
  aiPlatformEnum,
  sentimentEnum,
  type BrandMention,
  type NewBrandMention,
  type CompetitorMention,
  type MentionMetadata,
} from "./mentions";

export {
  content,
  contentTypeEnum,
  contentStatusEnum,
  type Content,
  type NewContent,
  type AIMetadata,
} from "./content";

export {
  keywords,
  keywordsRelations,
  type Keyword,
  type NewKeyword,
} from "./keywords";

export {
  audits,
  auditStatusEnum,
  type Audit,
  type NewAudit,
  type CategoryScore,
  type AuditIssue,
  type AuditMetadata,
} from "./audits";

export {
  recommendations,
  priorityEnum,
  recommendationStatusEnum,
  effortEnum,
  impactEnum,
  recommendationCategoryEnum,
  sourceEnum,
  type Recommendation,
  type NewRecommendation,
} from "./recommendations";

export {
  apiKeys,
  apiKeyTypeEnum,
  type ApiKey,
  type NewApiKey,
} from "./api-keys";

export {
  systemSettings,
  systemSettingTypeEnum,
  apiKeyProviderEnum,
  type SystemSetting,
  type NewSystemSetting,
} from "./system-settings";

export {
  apiIntegrations,
  integrationCategoryEnum,
  integrationStatusEnum,
  type ApiIntegration,
  type NewApiIntegration,
} from "./api-integrations";

export {
  aiUsage,
  type AIUsage,
  type NewAIUsage,
} from "./ai-usage";

export {
  monitoringJobs,
  scheduledJobs,
  jobStatusEnum,
  scheduleTypeEnum,
  type MonitoringJob,
  type NewMonitoringJob,
  type ScheduledJob,
  type NewScheduledJob,
} from "./jobs";

export {
  notifications,
  notificationPreferences,
  notificationReads,
  notificationTypeEnum,
  emailDigestFrequencyEnum,
  type Notification,
  type NewNotification,
  type NotificationPreference,
  type NewNotificationPreference,
  type NotificationRead,
  type NewNotificationRead,
  type NotificationMetadata,
} from "./notifications";

// Relations
export { organizationsRelations } from "./organizations";
export { usersRelations } from "./users";
export { brandsRelations } from "./brands";
export { brandMentionsRelations } from "./mentions";
export { contentRelations } from "./content";
export { auditsRelations } from "./audits";
export { recommendationsRelations } from "./recommendations";
export { apiKeysRelations } from "./api-keys";
export { aiUsageRelations } from "./ai-usage";
export { monitoringJobsRelations, scheduledJobsRelations } from "./jobs";
export {
  notificationsRelations,
  notificationReadsRelations,
  notificationPreferencesRelations,
} from "./notifications";

export {
  serpFeatures,
  competitorMentions,
  shareOfVoice,
  competitiveGaps,
  competitiveAlerts,
  // Phase 9.1: Competitor Discovery Tables
  discoveredCompetitors,
  competitorSnapshots,
  // Enhanced Competitive Intelligence Tables
  competitorScores,
  improvementRoadmaps,
  roadmapMilestones,
  roadmapProgressSnapshots,
  // Enums
  serpFeatureTypeEnum,
  featureOwnerEnum,
  discoveryMethodEnum,
  discoveryStatusEnum,
  scoreDataSourceEnum,
  roadmapStatusEnum,
  roadmapTargetPositionEnum,
  scoreCategoryEnum,
  milestoneStatusEnum,
  milestoneDifficultyEnum,
  // Types
  type SerpFeature,
  type NewSerpFeature,
  type SerpFeatureMetadata,
  type CompetitorMentionRecord,
  type NewCompetitorMentionRecord,
  type ShareOfVoiceRecord,
  type NewShareOfVoiceRecord,
  type CompetitorSOV,
  type CompetitiveGap,
  type NewCompetitiveGap,
  type CompetitiveAlert,
  type NewCompetitiveAlert,
  // Phase 9.1: New types
  type DiscoveredCompetitor,
  type NewDiscoveredCompetitor,
  type DiscoveryMetadata,
  type CompetitorSnapshot,
  type NewCompetitorSnapshot,
  type PlatformMetrics as CompetitorPlatformMetrics,
  // Enhanced Competitive Intelligence Types
  type ScoreBreakdown,
  type MilestoneActionItem,
  type CompetitorScoreRecord,
  type NewCompetitorScoreRecord,
  type ImprovementRoadmap,
  type NewImprovementRoadmap,
  type RoadmapMilestone,
  type NewRoadmapMilestone,
  type RoadmapProgressSnapshot,
  type NewRoadmapProgressSnapshot,
} from "./competitive";

export {
  serpFeaturesRelations,
  competitorMentionsRelations,
  shareOfVoiceRelations,
  competitiveGapsRelations,
  competitiveAlertsRelations,
  // Phase 9.1: New relations
  discoveredCompetitorsRelations,
  competitorSnapshotsRelations,
  // Enhanced Competitive Intelligence Relations
  competitorScoresRelations,
  improvementRoadmapsRelations,
  roadmapMilestonesRelations,
  roadmapProgressSnapshotsRelations,
} from "./competitive";

// Portfolio & Enterprise Features
export {
  portfolios,
  portfolioBrands,
  executiveReports,
  scheduledReports,
  reportFrequencyEnum,
  reportStatusEnum,
  type Portfolio,
  type NewPortfolio,
  type PortfolioSettings,
  type PortfolioMetrics,
  type PortfolioBrand,
  type NewPortfolioBrand,
  type ExecutiveReport,
  type NewExecutiveReport,
  type ReportContent,
  type ScheduledReport,
  type NewScheduledReport,
} from "./portfolios";

export {
  portfoliosRelations,
  portfolioBrandsRelations,
  executiveReportsRelations,
  scheduledReportsRelations,
} from "./portfolios";

// Social Media (Phase 7.1)
export {
  socialAccounts,
  socialMentions,
  socialMetrics,
  socialScores,
  socialPlatformEnum,
  socialSentimentEnum,
  socialAccountTypeEnum,
  type SocialAccount,
  type NewSocialAccount,
  type SocialMention,
  type NewSocialMention,
  type SocialMetric,
  type NewSocialMetric,
  type SocialScore,
  type NewSocialScore,
  type PlatformMetrics,
  type TokenMetadata,
  type SocialPlatformBreakdown,
  // Phase 8: OAuth & Sync
  socialOauthTokens,
  apiRateLimits,
  socialSyncJobs,
  socialPosts,
  connectionStatusEnum,
  syncJobStatusEnum,
  syncJobTypeEnum,
  socialPostTypeEnum,
  type SocialOauthToken,
  type NewSocialOauthToken,
  type ApiRateLimit,
  type NewApiRateLimit,
  type SocialSyncJob,
  type NewSocialSyncJob,
  type SocialPost,
  type NewSocialPost,
  // Phase 8.5/8.6: Service Scanner
  serviceScanResults,
  scanJobQueue,
  scanStatusEnum,
  scanJobPriorityEnum,
  type ServiceScanResult,
  type NewServiceScanResult,
  type ScanJob,
  type NewScanJob,
} from "./social";

export {
  socialAccountsRelations,
  socialMentionsRelations,
  socialMetricsRelations,
  socialScoresRelations,
  // Phase 8 relations
  socialOauthTokensRelations,
  socialSyncJobsRelations,
  socialPostsRelations,
} from "./social";

// People/Leadership (Phase 7.2)
export {
  brandPeople,
  peopleAiMentions,
  peopleScores,
  roleCategoryEnum,
  discoverySourceEnum,
  aiPlatformTypeEnum,
  type BrandPerson,
  type NewBrandPerson,
  type PersonAiMention,
  type NewPersonAiMention,
  type PeopleScore,
  type NewPeopleScore,
  type PersonSocialProfiles,
  type ThoughtLeadershipActivity,
  type PersonExtractionMetadata,
  type PersonAIMentionContext,
  type PersonScoreBreakdown,
} from "./people";

export {
  brandPeopleRelations,
  peopleAiMentionsRelations,
  peopleScoresRelations,
} from "./people";

// Locations (Phase 9.2)
export {
  brandLocations,
  brandReviews,
  locationScores,
  locationTypeEnum,
  reviewSourceEnum,
  type BrandLocation,
  type NewBrandLocation,
  type BrandReview,
  type NewBrandReview,
  type LocationScore,
  type NewLocationScore,
  type LocationPhoto,
  type OpeningHours,
  type LocationMetadata,
  type ReviewKeyword,
} from "./locations";

export {
  brandLocationsRelations,
  brandReviewsRelations,
  locationScoresRelations,
} from "./locations";

// People Enrichment (Phase 9.3)
export {
  peopleEnrichment,
  speakingOpportunities,
  opportunityMatches,
  enrichmentSourceEnum,
  eventTypeEnum,
  opportunityStatusEnum,
  type PeopleEnrichmentRecord,
  type NewPeopleEnrichmentRecord,
  type SpeakingOpportunity,
  type NewSpeakingOpportunity,
  type OpportunityMatch,
  type NewOpportunityMatch,
  type CareerPosition,
  type Education,
  type Certification,
  type Publication,
  type ConferenceAppearance,
  type PodcastAppearance,
} from "./enrichment";

export {
  peopleEnrichmentRelations,
  speakingOpportunitiesRelations,
  opportunityMatchesRelations,
} from "./enrichment";

// System Audit Logs (Admin Phase 5)
export {
  systemAuditLogs,
  auditActionTypeEnum,
  auditStatusTypeEnum,
  type SystemAuditLog,
  type NewSystemAuditLog,
} from "./system-audit-logs";

// Gamification (F151)
export {
  userGamification,
  userAchievements,
  userGamificationRelations,
  userAchievementsRelations,
  type UserGamification,
  type NewUserGamification,
  type UserAchievement,
  type NewUserAchievement,
  type StreakData,
  type UserStats,
} from "./gamification";

// Feedback & GEO Score History (GraphQL Support)
export {
  recommendationFeedback,
  geoScoreHistory,
  recommendationFeedbackRelations,
  geoScoreHistoryRelations,
  type RecommendationFeedback,
  type NewRecommendationFeedback,
  type GeoScoreHistory,
  type NewGeoScoreHistory,
  type PlatformScoreBreakdown,
} from "./feedback";

// Usage Tracking (F176)
export {
  apiCallTracking,
  storageTracking,
  apiCallTrackingRelations,
  storageTrackingRelations,
  type ApiCallTracking,
  type NewApiCallTracking,
  type StorageTracking,
  type NewStorageTracking,
} from "./usage-tracking";

// AI Platform Insights (Phase 018)
export {
  platformQueries,
  platformInsights,
  citationRecords,
  citationTypeEnum,
  platformQueriesRelations,
  platformInsightsRelations,
  citationRecordsRelations,
  type PlatformQuery,
  type NewPlatformQuery,
  type PlatformInsight,
  type NewPlatformInsight,
  type CitationRecord,
  type NewCitationRecord,
  type ContentTypePerformance,
  type InsightMetadata,
} from "./ai-platform-insights";

// Predictions (ML Models)
export {
  predictions,
  modelMetadata,
  predictiveAlerts,
  // Enums
  entityTypeEnum,
  predictionStatusEnum,
  alertTypeEnum,
  modelStatusEnum,
  // Types
  type Prediction,
  type NewPrediction,
  type PredictionMetadata,
  type ModelMetadataRecord,
  type NewModelMetadata,
  type PerformanceMetrics,
  type ModelHyperparameters,
  type PredictiveAlert,
  type NewPredictiveAlert,
  // Relations
  predictionsRelations,
  predictiveAlertsRelations,
} from "./predictions";

// Content Publishing
export {
  contentItems,
  contentSchedules,
  publishingHistory,
  contentMetrics,
  contentItemsRelations,
  contentSchedulesRelations,
  publishingHistoryRelations,
  contentMetricsRelations,
  type ContentItem,
  type NewContentItem,
  type ContentSchedule,
  type NewContentSchedule,
  type PublishingHistory,
  type NewPublishingHistory,
  type ContentMetrics,
  type NewContentMetrics,
} from "./content-publishing";

// Citation ROI (Phase 15)
export {
  citationConversions,
  citationTrackingLinks,
  citationRoiReports,
  conversionTypeEnum,
  attributionModelEnum,
  citationConversionsRelations,
  citationTrackingLinksRelations,
  citationRoiReportsRelations,
  type CitationConversion,
  type NewCitationConversion,
  type CitationTrackingLink,
  type NewCitationTrackingLink,
  type CitationRoiReport,
  type NewCitationRoiReport,
  type ConversionMetadata,
  type UTMParams,
  type TrackingLinkMetadata,
  type PlatformROIBreakdown,
  type ConversionTypeBreakdown,
  type ROIReportData,
} from "./citation-roi";

// Activity Log (Dashboard Analytics)
export {
  activityLog,
  activityLogRelations,
  type ActivityLog,
  type NewActivityLog,
  type ActivityType,
} from "./activity-log";

// GEO Knowledge Base (PRD-001: User Deliverables & Dynamic Adaptability System)
export {
  // Tables
  geoBestPractices,
  schemaTemplates,
  platformChanges,
  geoAlerts,
  actionPlanVersions,
  // Enums
  geoPlatformEnum,
  bestPracticeCategoryEnum,
  platformChangeTypeEnum,
  geoAlertTypeEnum,
  alertSeverityEnum,
  schemaTypeEnum,
  // Relations
  geoBestPracticesRelations,
  schemaTemplatesRelations,
  platformChangesRelations,
  geoAlertsRelations,
  actionPlanVersionsRelations,
  // Types
  type GeoBestPractice,
  type NewGeoBestPractice,
  type SchemaTemplate,
  type NewSchemaTemplate,
  type PlatformChange,
  type NewPlatformChange,
  type GeoAlert,
  type NewGeoAlert,
  type ActionPlanVersion,
  type NewActionPlanVersion,
  // Interface types for JSONB
  type ImplementationStep,
  type PlatformRelevance,
  type SchemaVariables,
  type ActionSnapshot,
  type VersionChanges,
  // Enum types
  type GeoPlatform,
  type BestPracticeCategory,
  type PlatformChangeType,
  type GeoAlertType,
  type AlertSeverity,
  type SchemaType,
} from "./geo-knowledge-base";

// Marketing System (Phase M1: Foundation)
export {
  // Campaigns
  campaigns as marketingCampaigns,
  campaignStatusEnum,
  campaignTypeEnum,
  type Campaign,
  type NewCampaign,
  // Leads
  leads as marketingLeads,
  leadStatusEnum,
  leadSourceEnum,
  type Lead,
  type NewLead,
  // Email
  emailLists as marketingEmailLists,
  emailEvents as marketingEmailEvents,
  emailEventTypeEnum,
  emailSequences as marketingEmailSequences,
  type EmailList,
  type NewEmailList,
  type EmailEvent,
  type NewEmailEvent,
  type EmailSequence,
  type NewEmailSequence,
  // Social
  socialPosts as marketingSocialPosts,
  postStatusEnum,
  type SocialPost as MarketingSocialPost,
  type NewSocialPost as NewMarketingSocialPost,
  // Analytics
  analyticsEvents as marketingAnalyticsEvents,
  marketingMetrics,
  type AnalyticsEvent,
  type NewAnalyticsEvent,
  type MarketingMetrics,
  type NewMarketingMetrics,
  // Automation
  automationLogs as marketingAutomationLogs,
  type AutomationLog,
  type NewAutomationLog,
} from "./marketing";
