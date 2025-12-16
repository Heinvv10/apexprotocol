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
  serpFeatures,
  competitorMentions,
  shareOfVoice,
  competitiveGaps,
  competitiveAlerts,
  serpFeatureTypeEnum,
  featureOwnerEnum,
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
} from "./competitive";

export {
  serpFeaturesRelations,
  competitorMentionsRelations,
  shareOfVoiceRelations,
  competitiveGapsRelations,
  competitiveAlertsRelations,
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
} from "./social";

export {
  socialAccountsRelations,
  socialMentionsRelations,
  socialMetricsRelations,
  socialScoresRelations,
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
