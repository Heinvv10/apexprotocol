import { relations } from "drizzle-orm/relations";
import { organizations, brands, content, users, recommendations, audits, brandMentions, apiKeys, socialAccounts, socialSyncJobs, competitorSnapshots, competitiveAlerts, socialPosts, competitiveGaps, competitorMentions, serpFeatures, shareOfVoice, socialOauthTokens, executiveReports, portfolios, portfolioBrands, scheduledReports, brandPeople, peopleAiMentions, peopleScores, socialScores, socialMentions, socialMetrics, discoveredCompetitors, scanJobQueue, serviceScanResults, brandLocations, brandReviews, locationScores, peopleEnrichment, opportunityMatches, speakingOpportunities, apiIntegrations, systemAuditLogs, userAchievements, userGamification, geoScoreHistory, recommendationFeedback, notifications, notificationReads, contentItems, contentMetrics, contentSchedules, publishingHistory, platformQueries, platformInsights, citationRecords } from "./schema";

export const brandsRelations = relations(brands, ({one, many}) => ({
	organization: one(organizations, {
		fields: [brands.organizationId],
		references: [organizations.id]
	}),
	contents: many(content),
	recommendations: many(recommendations),
	audits: many(audits),
	brandMentions: many(brandMentions),
	socialAccounts: many(socialAccounts),
	socialSyncJobs: many(socialSyncJobs),
	competitorSnapshots: many(competitorSnapshots),
	competitiveAlerts: many(competitiveAlerts),
	socialPosts: many(socialPosts),
	competitiveGaps: many(competitiveGaps),
	competitorMentions: many(competitorMentions),
	serpFeatures: many(serpFeatures),
	shareOfVoices: many(shareOfVoice),
	socialOauthTokens: many(socialOauthTokens),
	portfolioBrands: many(portfolioBrands),
	peopleAiMentions: many(peopleAiMentions),
	peopleScores: many(peopleScores),
	brandPeople: many(brandPeople),
	socialScores: many(socialScores),
	socialMentions: many(socialMentions),
	socialMetrics: many(socialMetrics),
	discoveredCompetitors: many(discoveredCompetitors),
	scanJobQueues: many(scanJobQueue),
	serviceScanResults: many(serviceScanResults),
	brandLocations: many(brandLocations),
	brandReviews: many(brandReviews),
	locationScores: many(locationScores),
	geoScoreHistories: many(geoScoreHistory),
	platformQueries: many(platformQueries),
	platformInsights: many(platformInsights),
	citationRecords: many(citationRecords),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	brands: many(brands),
	apiKeys: many(apiKeys),
	users: many(users),
	executiveReports: many(executiveReports),
	portfolios: many(portfolios),
	scheduledReports: many(scheduledReports),
}));

export const contentRelations = relations(content, ({one}) => ({
	brand: one(brands, {
		fields: [content.brandId],
		references: [brands.id]
	}),
	user: one(users, {
		fields: [content.authorId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	contents: many(content),
	recommendations: many(recommendations),
	audits: many(audits),
	apiKeys: many(apiKeys),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id]
	}),
	apiIntegrations_createdBy: many(apiIntegrations, {
		relationName: "apiIntegrations_createdBy_users_clerkUserId"
	}),
	apiIntegrations_updatedBy: many(apiIntegrations, {
		relationName: "apiIntegrations_updatedBy_users_clerkUserId"
	}),
	systemAuditLogs: many(systemAuditLogs),
	userAchievements: many(userAchievements),
	userGamifications: many(userGamification),
	platformQueries: many(platformQueries),
	platformInsights: many(platformInsights),
}));

export const recommendationsRelations = relations(recommendations, ({one, many}) => ({
	brand: one(brands, {
		fields: [recommendations.brandId],
		references: [brands.id]
	}),
	audit: one(audits, {
		fields: [recommendations.auditId],
		references: [audits.id]
	}),
	user: one(users, {
		fields: [recommendations.assignedToId],
		references: [users.id]
	}),
	recommendationFeedbacks: many(recommendationFeedback),
}));

export const auditsRelations = relations(audits, ({one, many}) => ({
	recommendations: many(recommendations),
	brand: one(brands, {
		fields: [audits.brandId],
		references: [brands.id]
	}),
	user: one(users, {
		fields: [audits.triggeredById],
		references: [users.id]
	}),
}));

export const brandMentionsRelations = relations(brandMentions, ({one}) => ({
	brand: one(brands, {
		fields: [brandMentions.brandId],
		references: [brands.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	organization: one(organizations, {
		fields: [apiKeys.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const socialAccountsRelations = relations(socialAccounts, ({one, many}) => ({
	brand: one(brands, {
		fields: [socialAccounts.brandId],
		references: [brands.id]
	}),
	socialSyncJobs: many(socialSyncJobs),
	socialPosts: many(socialPosts),
	socialMentions: many(socialMentions),
	socialMetrics: many(socialMetrics),
}));

export const socialSyncJobsRelations = relations(socialSyncJobs, ({one}) => ({
	brand: one(brands, {
		fields: [socialSyncJobs.brandId],
		references: [brands.id]
	}),
	socialAccount: one(socialAccounts, {
		fields: [socialSyncJobs.socialAccountId],
		references: [socialAccounts.id]
	}),
}));

export const competitorSnapshotsRelations = relations(competitorSnapshots, ({one}) => ({
	brand: one(brands, {
		fields: [competitorSnapshots.brandId],
		references: [brands.id]
	}),
}));

export const competitiveAlertsRelations = relations(competitiveAlerts, ({one}) => ({
	brand: one(brands, {
		fields: [competitiveAlerts.brandId],
		references: [brands.id]
	}),
}));

export const socialPostsRelations = relations(socialPosts, ({one}) => ({
	brand: one(brands, {
		fields: [socialPosts.brandId],
		references: [brands.id]
	}),
	socialAccount: one(socialAccounts, {
		fields: [socialPosts.socialAccountId],
		references: [socialAccounts.id]
	}),
}));

export const competitiveGapsRelations = relations(competitiveGaps, ({one}) => ({
	brand: one(brands, {
		fields: [competitiveGaps.brandId],
		references: [brands.id]
	}),
}));

export const competitorMentionsRelations = relations(competitorMentions, ({one}) => ({
	brand: one(brands, {
		fields: [competitorMentions.brandId],
		references: [brands.id]
	}),
}));

export const serpFeaturesRelations = relations(serpFeatures, ({one}) => ({
	brand: one(brands, {
		fields: [serpFeatures.brandId],
		references: [brands.id]
	}),
}));

export const shareOfVoiceRelations = relations(shareOfVoice, ({one}) => ({
	brand: one(brands, {
		fields: [shareOfVoice.brandId],
		references: [brands.id]
	}),
}));

export const socialOauthTokensRelations = relations(socialOauthTokens, ({one}) => ({
	brand: one(brands, {
		fields: [socialOauthTokens.brandId],
		references: [brands.id]
	}),
}));

export const executiveReportsRelations = relations(executiveReports, ({one}) => ({
	organization: one(organizations, {
		fields: [executiveReports.organizationId],
		references: [organizations.id]
	}),
	portfolio: one(portfolios, {
		fields: [executiveReports.portfolioId],
		references: [portfolios.id]
	}),
}));

export const portfoliosRelations = relations(portfolios, ({one, many}) => ({
	executiveReports: many(executiveReports),
	organization: one(organizations, {
		fields: [portfolios.organizationId],
		references: [organizations.id]
	}),
	portfolioBrands: many(portfolioBrands),
	scheduledReports: many(scheduledReports),
}));

export const portfolioBrandsRelations = relations(portfolioBrands, ({one}) => ({
	portfolio: one(portfolios, {
		fields: [portfolioBrands.portfolioId],
		references: [portfolios.id]
	}),
	brand: one(brands, {
		fields: [portfolioBrands.brandId],
		references: [brands.id]
	}),
}));

export const scheduledReportsRelations = relations(scheduledReports, ({one}) => ({
	organization: one(organizations, {
		fields: [scheduledReports.organizationId],
		references: [organizations.id]
	}),
	portfolio: one(portfolios, {
		fields: [scheduledReports.portfolioId],
		references: [portfolios.id]
	}),
}));

export const peopleAiMentionsRelations = relations(peopleAiMentions, ({one}) => ({
	brandPerson: one(brandPeople, {
		fields: [peopleAiMentions.personId],
		references: [brandPeople.id]
	}),
	brand: one(brands, {
		fields: [peopleAiMentions.brandId],
		references: [brands.id]
	}),
}));

export const brandPeopleRelations = relations(brandPeople, ({one, many}) => ({
	peopleAiMentions: many(peopleAiMentions),
	brand: one(brands, {
		fields: [brandPeople.brandId],
		references: [brands.id]
	}),
	peopleEnrichments: many(peopleEnrichment),
	opportunityMatches: many(opportunityMatches),
}));

export const peopleScoresRelations = relations(peopleScores, ({one}) => ({
	brand: one(brands, {
		fields: [peopleScores.brandId],
		references: [brands.id]
	}),
}));

export const socialScoresRelations = relations(socialScores, ({one}) => ({
	brand: one(brands, {
		fields: [socialScores.brandId],
		references: [brands.id]
	}),
}));

export const socialMentionsRelations = relations(socialMentions, ({one}) => ({
	brand: one(brands, {
		fields: [socialMentions.brandId],
		references: [brands.id]
	}),
	socialAccount: one(socialAccounts, {
		fields: [socialMentions.socialAccountId],
		references: [socialAccounts.id]
	}),
}));

export const socialMetricsRelations = relations(socialMetrics, ({one}) => ({
	brand: one(brands, {
		fields: [socialMetrics.brandId],
		references: [brands.id]
	}),
	socialAccount: one(socialAccounts, {
		fields: [socialMetrics.socialAccountId],
		references: [socialAccounts.id]
	}),
}));

export const discoveredCompetitorsRelations = relations(discoveredCompetitors, ({one}) => ({
	brand: one(brands, {
		fields: [discoveredCompetitors.brandId],
		references: [brands.id]
	}),
}));

export const scanJobQueueRelations = relations(scanJobQueue, ({one}) => ({
	brand: one(brands, {
		fields: [scanJobQueue.brandId],
		references: [brands.id]
	}),
}));

export const serviceScanResultsRelations = relations(serviceScanResults, ({one}) => ({
	brand: one(brands, {
		fields: [serviceScanResults.brandId],
		references: [brands.id]
	}),
}));

export const brandLocationsRelations = relations(brandLocations, ({one, many}) => ({
	brand: one(brands, {
		fields: [brandLocations.brandId],
		references: [brands.id]
	}),
	brandReviews: many(brandReviews),
	locationScores: many(locationScores),
}));

export const brandReviewsRelations = relations(brandReviews, ({one}) => ({
	brandLocation: one(brandLocations, {
		fields: [brandReviews.locationId],
		references: [brandLocations.id]
	}),
	brand: one(brands, {
		fields: [brandReviews.brandId],
		references: [brands.id]
	}),
}));

export const locationScoresRelations = relations(locationScores, ({one}) => ({
	brandLocation: one(brandLocations, {
		fields: [locationScores.locationId],
		references: [brandLocations.id]
	}),
	brand: one(brands, {
		fields: [locationScores.brandId],
		references: [brands.id]
	}),
}));

export const peopleEnrichmentRelations = relations(peopleEnrichment, ({one}) => ({
	brandPerson: one(brandPeople, {
		fields: [peopleEnrichment.personId],
		references: [brandPeople.id]
	}),
}));

export const opportunityMatchesRelations = relations(opportunityMatches, ({one}) => ({
	brandPerson: one(brandPeople, {
		fields: [opportunityMatches.personId],
		references: [brandPeople.id]
	}),
	speakingOpportunity: one(speakingOpportunities, {
		fields: [opportunityMatches.opportunityId],
		references: [speakingOpportunities.id]
	}),
}));

export const speakingOpportunitiesRelations = relations(speakingOpportunities, ({many}) => ({
	opportunityMatches: many(opportunityMatches),
}));

export const apiIntegrationsRelations = relations(apiIntegrations, ({one}) => ({
	user_createdBy: one(users, {
		fields: [apiIntegrations.createdBy],
		references: [users.clerkUserId],
		relationName: "apiIntegrations_createdBy_users_clerkUserId"
	}),
	user_updatedBy: one(users, {
		fields: [apiIntegrations.updatedBy],
		references: [users.clerkUserId],
		relationName: "apiIntegrations_updatedBy_users_clerkUserId"
	}),
}));

export const systemAuditLogsRelations = relations(systemAuditLogs, ({one}) => ({
	user: one(users, {
		fields: [systemAuditLogs.actorId],
		references: [users.clerkUserId]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.clerkUserId]
	}),
}));

export const userGamificationRelations = relations(userGamification, ({one}) => ({
	user: one(users, {
		fields: [userGamification.userId],
		references: [users.clerkUserId]
	}),
}));

export const geoScoreHistoryRelations = relations(geoScoreHistory, ({one}) => ({
	brand: one(brands, {
		fields: [geoScoreHistory.brandId],
		references: [brands.id]
	}),
}));

export const recommendationFeedbackRelations = relations(recommendationFeedback, ({one}) => ({
	recommendation: one(recommendations, {
		fields: [recommendationFeedback.recommendationId],
		references: [recommendations.id]
	}),
}));

export const notificationReadsRelations = relations(notificationReads, ({one}) => ({
	notification: one(notifications, {
		fields: [notificationReads.notificationId],
		references: [notifications.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({many}) => ({
	notificationReads: many(notificationReads),
}));

export const contentMetricsRelations = relations(contentMetrics, ({one}) => ({
	contentItem: one(contentItems, {
		fields: [contentMetrics.contentId],
		references: [contentItems.id]
	}),
}));

export const contentItemsRelations = relations(contentItems, ({many}) => ({
	contentMetrics: many(contentMetrics),
	contentSchedules: many(contentSchedules),
	publishingHistories: many(publishingHistory),
}));

export const contentSchedulesRelations = relations(contentSchedules, ({one}) => ({
	contentItem: one(contentItems, {
		fields: [contentSchedules.contentId],
		references: [contentItems.id]
	}),
}));

export const publishingHistoryRelations = relations(publishingHistory, ({one}) => ({
	contentItem: one(contentItems, {
		fields: [publishingHistory.contentId],
		references: [contentItems.id]
	}),
}));

export const platformQueriesRelations = relations(platformQueries, ({one, many}) => ({
	brand: one(brands, {
		fields: [platformQueries.brandId],
		references: [brands.id]
	}),
	user: one(users, {
		fields: [platformQueries.userId],
		references: [users.id]
	}),
	platformInsights: many(platformInsights),
}));

export const platformInsightsRelations = relations(platformInsights, ({one, many}) => ({
	platformQuery: one(platformQueries, {
		fields: [platformInsights.queryId],
		references: [platformQueries.id]
	}),
	brand: one(brands, {
		fields: [platformInsights.brandId],
		references: [brands.id]
	}),
	user: one(users, {
		fields: [platformInsights.userId],
		references: [users.id]
	}),
	citationRecords: many(citationRecords),
}));

export const citationRecordsRelations = relations(citationRecords, ({one}) => ({
	platformInsight: one(platformInsights, {
		fields: [citationRecords.insightId],
		references: [platformInsights.id]
	}),
	brand: one(brands, {
		fields: [citationRecords.brandId],
		references: [brands.id]
	}),
}));