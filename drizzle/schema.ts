import { pgTable, uuid, text, integer, jsonb, timestamp, foreignKey, boolean, unique, varchar, index, date, real, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const aiPlatform = pgEnum("ai_platform", ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot'])
export const aiPlatformType = pgEnum("ai_platform_type", ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot'])
export const alertSeverity = pgEnum("alert_severity", ['info', 'warning', 'critical'])
export const apiKeyProvider = pgEnum("api_key_provider", ['openai', 'anthropic', 'gemini', 'serper', 'pinecone'])
export const apiKeyType = pgEnum("api_key_type", ['anthropic', 'openai', 'serper', 'pinecone', 'custom', 'user', 'gemini'])
export const auditActionType = pgEnum("audit_action_type", ['create', 'update', 'delete', 'access', 'security', 'system'])
export const auditStatus = pgEnum("audit_status", ['pending', 'in_progress', 'completed', 'failed'])
export const auditStatusType = pgEnum("audit_status_type", ['success', 'failure', 'warning'])
export const citationType = pgEnum("citation_type", ['direct_quote', 'paraphrase', 'link', 'reference'])
export const connectionStatus = pgEnum("connection_status", ['active', 'expired', 'revoked', 'error', 'pending'])
export const contentStatus = pgEnum("content_status", ['draft', 'review', 'approved', 'published', 'archived'])
export const contentType = pgEnum("content_type", ['blog_post', 'social_post', 'product_description', 'faq', 'landing_page', 'email', 'ad_copy', 'press_release'])
export const discoveryMethod = pgEnum("discovery_method", ['keyword_overlap', 'ai_co_occurrence', 'industry_match', 'search_overlap', 'manual'])
export const discoverySource = pgEnum("discovery_source", ['website_scrape', 'manual', 'linkedin', 'api_import'])
export const discoveryStatus = pgEnum("discovery_status", ['pending', 'confirmed', 'rejected'])
export const effort = pgEnum("effort", ['quick_win', 'moderate', 'major'])
export const emailDigestFrequency = pgEnum("email_digest_frequency", ['none', 'daily', 'weekly'])
export const enrichmentSource = pgEnum("enrichment_source", ['linkedin_public', 'clearbit', 'apollo', 'manual', 'website_scrape'])
export const eventType = pgEnum("event_type", ['conference', 'webinar', 'podcast', 'panel', 'workshop', 'meetup', 'summit'])
export const featureOwner = pgEnum("feature_owner", ['self', 'competitor', 'other'])
export const geoAlertType = pgEnum("geo_alert_type", ['algorithm_change', 'recommendation_updated', 'strategy_deprecated', 'new_opportunity', 'competitor_move', 'score_impact'])
export const geoPlatform = pgEnum("geo_platform", ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot'])
export const impact = pgEnum("impact", ['high', 'medium', 'low'])
export const integrationCategory = pgEnum("integration_category", ['ai_models', 'search_apis', 'analytics'])
export const integrationStatus = pgEnum("integration_status", ['configured', 'not_configured', 'disabled', 'error'])
export const jobStatus = pgEnum("job_status", ['pending', 'processing', 'completed', 'failed', 'cancelled'])
export const locationType = pgEnum("location_type", ['headquarters', 'branch', 'store', 'office', 'warehouse', 'factory', 'distribution_center'])
export const notificationType = pgEnum("notification_type", ['mention', 'score_change', 'recommendation', 'important'])
export const opportunityStatus = pgEnum("opportunity_status", ['open', 'applied', 'accepted', 'declined', 'expired'])
export const plan = pgEnum("plan", ['starter', 'professional', 'enterprise'])
export const priority = pgEnum("priority", ['critical', 'high', 'medium', 'low'])
export const publishingPlatform = pgEnum("publishing_platform", ['wordpress', 'medium'])
export const publishingStatus = pgEnum("publishing_status", ['success', 'failed'])
export const recommendationCategory = pgEnum("recommendation_category", ['technical_seo', 'content_optimization', 'schema_markup', 'citation_building', 'brand_consistency', 'competitor_analysis', 'content_freshness', 'authority_building'])
export const recommendationStatus = pgEnum("recommendation_status", ['pending', 'in_progress', 'completed', 'dismissed'])
export const reportFrequency = pgEnum("report_frequency", ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'])
export const reportStatus = pgEnum("report_status", ['scheduled', 'generating', 'completed', 'failed'])
export const reviewSource = pgEnum("review_source", ['google', 'yelp', 'facebook', 'trustpilot', 'manual'])
export const role = pgEnum("role", ['admin', 'editor', 'viewer'])
export const roleCategory = pgEnum("role_category", ['c_suite', 'founder', 'board', 'key_employee', 'ambassador', 'advisor', 'investor'])
export const scanJobPriority = pgEnum("scan_job_priority", ['high', 'normal', 'low'])
export const scanStatus = pgEnum("scan_status", ['pending', 'scanning', 'success', 'partial', 'failed'])
export const scheduleStatus = pgEnum("schedule_status", ['pending', 'completed', 'failed', 'cancelled'])
export const scheduleType = pgEnum("schedule_type", ['once', 'hourly', 'daily', 'weekly', 'monthly'])
export const sentiment = pgEnum("sentiment", ['positive', 'neutral', 'negative'])
export const serpFeatureType = pgEnum("serp_feature_type", ['featured_snippet', 'people_also_ask', 'ai_overview', 'knowledge_panel', 'local_pack', 'image_pack', 'video_carousel', 'top_stories'])
export const socialAccountType = pgEnum("social_account_type", ['company', 'personal', 'unknown'])
export const socialPlatform = pgEnum("social_platform", ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'github', 'pinterest', 'medium', 'reddit', 'discord', 'threads', 'mastodon', 'bluesky'])
export const socialPostType = pgEnum("social_post_type", ['text', 'image', 'video', 'carousel', 'story', 'reel', 'live', 'poll', 'thread', 'article'])
export const socialSentiment = pgEnum("social_sentiment", ['positive', 'neutral', 'negative'])
export const source = pgEnum("source", ['audit', 'monitoring', 'content', 'manual'])
export const syncJobStatus = pgEnum("sync_job_status", ['pending', 'running', 'completed', 'failed', 'cancelled'])
export const syncJobType = pgEnum("sync_job_type", ['metrics', 'mentions', 'followers', 'posts', 'profile', 'full_sync'])
export const systemSettingType = pgEnum("system_setting_type", ['api_key', 'feature_flag', 'configuration', 'limit', 'oauth'])


export const aiUsage = pgTable("ai_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id"),
	provider: text().notNull(),
	model: text().notNull(),
	operation: text().notNull(),
	inputTokens: integer("input_tokens").default(0),
	outputTokens: integer("output_tokens").default(0),
	totalTokens: integer("total_tokens").default(0),
	cost: text().default('0'),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const brands = pgTable("brands", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	name: text().notNull(),
	domain: text(),
	description: text(),
	industry: text(),
	logoUrl: text("logo_url"),
	keywords: jsonb().default([]),
	competitors: jsonb().default([]),
	voice: jsonb().default({"tone":"professional","avoidTopics":[],"keyMessages":[],"personality":[],"targetAudience":""}),
	visual: jsonb().default({"fontFamily":null,"accentColor":null,"colorPalette":[],"primaryColor":null,"secondaryColor":null}),
	monitoringEnabled: boolean("monitoring_enabled").default(true).notNull(),
	monitoringPlatforms: jsonb("monitoring_platforms").default(["chatgpt","claude","gemini","perplexity","grok","deepseek","copilot"]),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	tagline: text(),
	seoKeywords: jsonb("seo_keywords").default([]),
	geoKeywords: jsonb("geo_keywords").default([]),
	valuePropositions: jsonb("value_propositions").default([]),
	socialLinks: jsonb("social_links").default({}),
	confidence: jsonb().default({"overall":0,"perField":{}}),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "brands_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
]);

export const content = pgTable("content", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	authorId: text("author_id"),
	title: text().notNull(),
	type: contentType().notNull(),
	status: contentStatus().default('draft').notNull(),
	content: text().notNull(),
	excerpt: text(),
	keywords: jsonb().default([]),
	aiScore: integer("ai_score"),
	readabilityScore: integer("readability_score"),
	seoScore: integer("seo_score"),
	targetPlatform: text("target_platform"),
	version: integer().default(1).notNull(),
	parentId: text("parent_id"),
	aiMetadata: jsonb("ai_metadata").default({}),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "content_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "content_author_id_users_id_fk"
		}).onDelete("set null"),
]);

export const recommendations = pgTable("recommendations", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	auditId: text("audit_id"),
	assignedToId: text("assigned_to_id"),
	title: text().notNull(),
	description: text().notNull(),
	category: recommendationCategory().notNull(),
	priority: priority().default('medium').notNull(),
	status: recommendationStatus().default('pending').notNull(),
	effort: effort().default('moderate').notNull(),
	impact: impact().default('medium').notNull(),
	estimatedTime: text("estimated_time"),
	source: source().default('manual').notNull(),
	relatedMentionId: text("related_mention_id"),
	steps: jsonb().default([]),
	notes: text(),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	dismissedAt: timestamp("dismissed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	baselineScore: integer("baseline_score"),
	postImplementationScore: integer("post_implementation_score"),
	scoreImprovement: integer("score_improvement"),
	effectivenessScore: integer("effectiveness_score"),
	userRating: integer("user_rating"),
	userFeedback: text("user_feedback"),
	feedbackAt: timestamp("feedback_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "recommendations_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.auditId],
			foreignColumns: [audits.id],
			name: "recommendations_audit_id_audits_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "recommendations_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const organizations = pgTable("organizations", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	clerkOrgId: text("clerk_org_id"),
	plan: plan().default('starter').notNull(),
	brandLimit: integer("brand_limit").default(1).notNull(),
	userLimit: integer("user_limit").default(3).notNull(),
	branding: jsonb().default({"appName":null,"logoUrl":null,"faviconUrl":null,"accentColor":"#D82F71","customDomain":null,"primaryColor":"#4926FA"}),
	features: jsonb().default([]),
	settings: jsonb().default({"timezone":"UTC","dateFormat":"MM/DD/YYYY","defaultLanguage":"en"}),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	onboardingStatus: jsonb("onboarding_status").default({"auditRun":false,"brandAdded":false,"completedAt":null,"dismissedAt":null,"monitoringConfigured":false,"recommendationsReviewed":false}),
}, (table) => [
	unique("organizations_slug_unique").on(table.slug),
	unique("organizations_clerk_org_id_unique").on(table.clerkOrgId),
]);

export const monitoringJobs = pgTable("monitoring_jobs", {
	id: varchar({ length: 128 }).primaryKey().notNull(),
	brandId: varchar("brand_id", { length: 128 }).notNull(),
	orgId: varchar("org_id", { length: 128 }).notNull(),
	status: jobStatus().default('pending').notNull(),
	platforms: jsonb().default([]),
	queries: jsonb().default([]),
	mentionsFound: integer("mentions_found").default(0),
	error: text(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const audits = pgTable("audits", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	triggeredById: text("triggered_by_id"),
	url: text().notNull(),
	status: auditStatus().default('pending').notNull(),
	overallScore: integer("overall_score"),
	categoryScores: jsonb("category_scores").default([]),
	issues: jsonb().default([]),
	issueCount: integer("issue_count").default(0),
	criticalCount: integer("critical_count").default(0),
	highCount: integer("high_count").default(0),
	mediumCount: integer("medium_count").default(0),
	lowCount: integer("low_count").default(0),
	recommendations: jsonb().default([]),
	metadata: jsonb().default({}),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "audits_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.triggeredById],
			foreignColumns: [users.id],
			name: "audits_triggered_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const brandMentions = pgTable("brand_mentions", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	platform: aiPlatform().notNull(),
	query: text().notNull(),
	response: text().notNull(),
	sentiment: sentiment().default('neutral').notNull(),
	position: integer(),
	citationUrl: text("citation_url"),
	competitors: jsonb().default([]),
	promptCategory: text("prompt_category"),
	topics: jsonb().default([]),
	metadata: jsonb().default({}),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reviewed: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "brand_mentions_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const scheduledJobs = pgTable("scheduled_jobs", {
	id: varchar({ length: 128 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	scheduleType: scheduleType("schedule_type").notNull(),
	jobType: varchar("job_type", { length: 50 }).notNull(),
	brandId: varchar("brand_id", { length: 128 }).notNull(),
	orgId: varchar("org_id", { length: 128 }).notNull(),
	enabled: boolean().default(true).notNull(),
	config: jsonb().default({}),
	lastRunAt: timestamp("last_run_at", { mode: 'string' }),
	nextRunAt: timestamp("next_run_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	name: text().notNull(),
	type: apiKeyType().notNull(),
	encryptedKey: text("encrypted_key").notNull(),
	keyHash: text("key_hash").notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id"),
	displayName: text("display_name"),
	version: integer().default(1).notNull(),
	lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true, mode: 'string' }),
	scopes: jsonb(),
}, (table) => [
	index("api_keys_key_hash_idx").using("btree", table.keyHash.asc().nullsLast().op("text_ops")),
	index("api_keys_org_type_active_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.type.asc().nullsLast().op("enum_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("api_keys_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("api_keys_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "api_keys_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "api_keys_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const socialAccounts = pgTable("social_accounts", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	platform: socialPlatform().notNull(),
	accountType: socialAccountType("account_type").default('company'),
	accountId: text("account_id").notNull(),
	accountHandle: text("account_handle"),
	accountName: text("account_name"),
	profileUrl: text("profile_url"),
	avatarUrl: text("avatar_url"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true, mode: 'string' }),
	tokenMetadata: jsonb("token_metadata"),
	followersCount: integer("followers_count").default(0),
	followingCount: integer("following_count").default(0),
	postsCount: integer("posts_count").default(0),
	isActive: boolean("is_active").default(true).notNull(),
	isVerified: boolean("is_verified").default(false),
	connectionStatus: text("connection_status").default('connected'),
	lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
	lastErrorAt: timestamp("last_error_at", { withTimezone: true, mode: 'string' }),
	lastError: text("last_error"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_accounts_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const socialSyncJobs = pgTable("social_sync_jobs", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	socialAccountId: text("social_account_id"),
	platform: socialPlatform().notNull(),
	jobType: syncJobType("job_type").notNull(),
	status: syncJobStatus().default('pending'),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	recordsProcessed: integer("records_processed").default(0),
	recordsTotal: integer("records_total"),
	errorMessage: text("error_message"),
	retryCount: integer("retry_count").default(0),
	maxRetries: integer("max_retries").default(3),
	nextRetryAt: timestamp("next_retry_at", { withTimezone: true, mode: 'string' }),
	jobMetadata: jsonb("job_metadata"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_sync_jobs_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "social_sync_jobs_social_account_id_social_accounts_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	clerkUserId: text("clerk_user_id").notNull(),
	organizationId: text("organization_id"),
	email: text().notNull(),
	name: text(),
	avatarUrl: text("avatar_url"),
	role: role().default('viewer').notNull(),
	preferences: jsonb().default({"theme":"dark","auditAlerts":true,"weeklyDigest":true,"mentionAlerts":true,"pushNotifications":true,"emailNotifications":true}),
	isActive: boolean("is_active").default(true).notNull(),
	lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
	superAdminGrantedAt: timestamp("super_admin_granted_at", { withTimezone: true, mode: 'string' }),
	superAdminGrantedBy: text("super_admin_granted_by"),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "users_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	unique("users_clerk_user_id_unique").on(table.clerkUserId),
]);

export const competitorSnapshots = pgTable("competitor_snapshots", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	competitorName: text("competitor_name").notNull(),
	competitorDomain: text("competitor_domain").notNull(),
	snapshotDate: date("snapshot_date").notNull(),
	geoScore: integer("geo_score"),
	aiMentionCount: integer("ai_mention_count"),
	avgMentionPosition: real("avg_mention_position"),
	sentimentScore: real("sentiment_score"),
	socialFollowers: integer("social_followers"),
	socialEngagementRate: real("social_engagement_rate"),
	contentPageCount: integer("content_page_count"),
	blogPostCount: integer("blog_post_count"),
	lastContentPublished: timestamp("last_content_published", { withTimezone: true, mode: 'string' }),
	schemaTypes: jsonb("schema_types").default([]),
	structuredDataScore: integer("structured_data_score"),
	platformBreakdown: jsonb("platform_breakdown").default([]),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "competitor_snapshots_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const competitiveAlerts = pgTable("competitive_alerts", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	alertType: text("alert_type").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	severity: text().default('medium').notNull(),
	competitorName: text("competitor_name"),
	platform: text(),
	keyword: text(),
	previousValue: numeric("previous_value", { precision: 10, scale:  2 }),
	currentValue: numeric("current_value", { precision: 10, scale:  2 }),
	isRead: boolean("is_read").default(false).notNull(),
	isDismissed: boolean("is_dismissed").default(false).notNull(),
	triggeredAt: timestamp("triggered_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "competitive_alerts_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const socialPosts = pgTable("social_posts", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	socialAccountId: text("social_account_id"),
	platform: socialPlatform().notNull(),
	platformPostId: text("platform_post_id").notNull(),
	content: text(),
	postType: socialPostType("post_type"),
	postUrl: text("post_url"),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	isPublished: boolean("is_published").default(true),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	likesCount: integer("likes_count").default(0),
	commentsCount: integer("comments_count").default(0),
	sharesCount: integer("shares_count").default(0),
	savesCount: integer("saves_count").default(0),
	impressionsCount: integer("impressions_count").default(0),
	reachCount: integer("reach_count").default(0),
	engagementRate: real("engagement_rate"),
	sentimentScore: real("sentiment_score"),
	hashtags: jsonb().default([]),
	mentions: jsonb().default([]),
	mediaUrls: jsonb("media_urls").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_posts_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "social_posts_social_account_id_social_accounts_id_fk"
		}).onDelete("cascade"),
	unique("social_posts_brand_id_platform_platform_post_id_unique").on(table.brandId, table.platform, table.platformPostId),
]);

export const competitiveGaps = pgTable("competitive_gaps", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	gapType: text("gap_type").notNull(),
	keyword: text(),
	topic: text(),
	description: text().notNull(),
	competitorName: text("competitor_name").notNull(),
	competitorPosition: integer("competitor_position"),
	competitorUrl: text("competitor_url"),
	searchVolume: integer("search_volume"),
	difficulty: integer(),
	opportunity: integer(),
	isResolved: boolean("is_resolved").default(false).notNull(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	discoveredAt: timestamp("discovered_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "competitive_gaps_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const competitorMentions = pgTable("competitor_mentions", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	competitorName: text("competitor_name").notNull(),
	competitorDomain: text("competitor_domain"),
	platform: text().notNull(),
	query: text().notNull(),
	position: integer(),
	sentiment: text().default('neutral'),
	context: text(),
	citationUrl: text("citation_url"),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "competitor_mentions_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const serpFeatures = pgTable("serp_features", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	keyword: text().notNull(),
	featureType: serpFeatureType("feature_type").notNull(),
	ownedBy: featureOwner("owned_by").notNull(),
	competitorName: text("competitor_name"),
	snippetContent: text("snippet_content"),
	snippetUrl: text("snippet_url"),
	position: integer(),
	visibility: numeric({ precision: 5, scale:  2 }),
	searchEngine: text("search_engine").default('google').notNull(),
	metadata: jsonb().default({}),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "serp_features_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const shareOfVoice = pgTable("share_of_voice", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	date: date().notNull(),
	platform: text().notNull(),
	brandMentions: integer("brand_mentions").default(0).notNull(),
	totalMentions: integer("total_mentions").default(0).notNull(),
	sovPercentage: numeric("sov_percentage", { precision: 5, scale:  2 }),
	avgPosition: numeric("avg_position", { precision: 5, scale:  2 }),
	topPositions: integer("top_positions").default(0),
	positiveMentions: integer("positive_mentions").default(0),
	neutralMentions: integer("neutral_mentions").default(0),
	negativeMentions: integer("negative_mentions").default(0),
	competitorBreakdown: jsonb("competitor_breakdown").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "share_of_voice_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const apiRateLimits = pgTable("api_rate_limits", {
	id: text().primaryKey().notNull(),
	platform: socialPlatform().notNull(),
	endpoint: text().notNull(),
	requestsMade: integer("requests_made").default(0),
	requestsLimit: integer("requests_limit").notNull(),
	windowStartAt: timestamp("window_start_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	windowDurationSeconds: integer("window_duration_seconds").default(900),
	resetAt: timestamp("reset_at", { withTimezone: true, mode: 'string' }),
	consecutiveErrors: integer("consecutive_errors").default(0),
	backoffUntil: timestamp("backoff_until", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("api_rate_limits_platform_endpoint_unique").on(table.platform, table.endpoint),
]);

export const socialOauthTokens = pgTable("social_oauth_tokens", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	brandId: text("brand_id").notNull(),
	platform: socialPlatform().notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	tokenType: text("token_type").default('Bearer'),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	scopes: jsonb().default([]),
	accountId: text("account_id"),
	accountName: text("account_name"),
	accountHandle: text("account_handle"),
	profileUrl: text("profile_url"),
	avatarUrl: text("avatar_url"),
	connectionStatus: connectionStatus("connection_status").default('active'),
	lastError: text("last_error"),
	lastErrorAt: timestamp("last_error_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_oauth_tokens_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	unique("social_oauth_tokens_brand_id_platform_account_id_unique").on(table.brandId, table.platform, table.accountId),
]);

export const executiveReports = pgTable("executive_reports", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	portfolioId: text("portfolio_id"),
	title: text().notNull(),
	reportType: text("report_type").notNull(),
	periodStart: timestamp("period_start", { withTimezone: true, mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { withTimezone: true, mode: 'string' }).notNull(),
	content: jsonb().notNull(),
	pdfUrl: text("pdf_url"),
	pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true, mode: 'string' }),
	status: reportStatus().default('scheduled').notNull(),
	recipients: jsonb().default([]),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "executive_reports_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolios.id],
			name: "executive_reports_portfolio_id_portfolios_id_fk"
		}).onDelete("set null"),
]);

export const portfolios = pgTable("portfolios", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	name: text().notNull(),
	description: text(),
	settings: jsonb().default({"defaultView":"grid","compareMetrics":["unified_score","geo_score","mentions_count"],"alertThresholds":{"scoreDropPercent":10,"mentionDropPercent":20,"competitorGainPercent":15},"reportFrequency":"weekly","reportRecipients":[]}),
	aggregatedMetrics: jsonb("aggregated_metrics").default({"avgAeoScore":0,"avgGeoScore":0,"avgSeoScore":0,"totalBrands":0,"healthStatus":"healthy","totalMentions":0,"avgUnifiedScore":0,"totalRecommendations":0}),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metricsUpdatedAt: timestamp("metrics_updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "portfolios_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
]);

export const portfolioBrands = pgTable("portfolio_brands", {
	id: text().primaryKey().notNull(),
	portfolioId: text("portfolio_id").notNull(),
	brandId: text("brand_id").notNull(),
	displayOrder: integer("display_order").default(0),
	isHighlighted: boolean("is_highlighted").default(false),
	customLabel: text("custom_label"),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolios.id],
			name: "portfolio_brands_portfolio_id_portfolios_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "portfolio_brands_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const scheduledReports = pgTable("scheduled_reports", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	portfolioId: text("portfolio_id"),
	name: text().notNull(),
	frequency: reportFrequency().notNull(),
	dayOfWeek: integer("day_of_week"),
	dayOfMonth: integer("day_of_month"),
	timeOfDay: text("time_of_day").default('09:00'),
	recipients: jsonb().default([]),
	includeAllBrands: boolean("include_all_brands").default(true),
	brandIds: jsonb("brand_ids").default([]),
	sections: jsonb().default(["summary","scores","mentions","recommendations","competitive","insights"]),
	isActive: boolean("is_active").default(true).notNull(),
	lastRunAt: timestamp("last_run_at", { withTimezone: true, mode: 'string' }),
	nextRunAt: timestamp("next_run_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "scheduled_reports_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolios.id],
			name: "scheduled_reports_portfolio_id_portfolios_id_fk"
		}).onDelete("cascade"),
]);

export const peopleAiMentions = pgTable("people_ai_mentions", {
	id: text().primaryKey().notNull(),
	personId: text("person_id").notNull(),
	brandId: text("brand_id").notNull(),
	platform: aiPlatformType().notNull(),
	query: text(),
	responseSnippet: text("response_snippet"),
	fullResponse: text("full_response"),
	mentionedWithBrand: boolean("mentioned_with_brand").default(false),
	mentionedWithCompetitor: boolean("mentioned_with_competitor").default(false),
	competitorName: text("competitor_name"),
	sentiment: text(),
	sentimentScore: real("sentiment_score"),
	position: integer(),
	context: jsonb(),
	queryTimestamp: timestamp("query_timestamp", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.personId],
			foreignColumns: [brandPeople.id],
			name: "people_ai_mentions_person_id_brand_people_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "people_ai_mentions_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const peopleScores = pgTable("people_scores", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	date: date().notNull(),
	overallScore: integer("overall_score"),
	executiveVisibilityScore: integer("executive_visibility_score"),
	thoughtLeadershipScore: integer("thought_leadership_score"),
	aiMentionScore: integer("ai_mention_score"),
	socialEngagementScore: integer("social_engagement_score"),
	personBreakdown: jsonb("person_breakdown"),
	totalPeopleTracked: integer("total_people_tracked"),
	totalAiMentions: integer("total_ai_mentions"),
	totalSocialFollowers: integer("total_social_followers"),
	avgThoughtLeadershipScore: real("avg_thought_leadership_score"),
	topPerformerIds: jsonb("top_performer_ids").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "people_scores_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	unique("people_scores_brand_id_date_unique").on(table.brandId, table.date),
]);

export const brandPeople = pgTable("brand_people", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	name: text().notNull(),
	title: text(),
	roleCategory: roleCategory("role_category"),
	department: text(),
	bio: text(),
	shortBio: text("short_bio"),
	photoUrl: text("photo_url"),
	email: text(),
	phone: text(),
	socialProfiles: jsonb("social_profiles").default({}),
	linkedinUrl: text("linkedin_url"),
	twitterUrl: text("twitter_url"),
	personalWebsite: text("personal_website"),
	linkedinFollowers: integer("linkedin_followers"),
	twitterFollowers: integer("twitter_followers"),
	totalSocialFollowers: integer("total_social_followers"),
	thoughtLeadershipActivities: jsonb("thought_leadership_activities").default([]),
	thoughtLeadershipScore: integer("thought_leadership_score").default(0),
	publicationsCount: integer("publications_count").default(0),
	speakingEngagementsCount: integer("speaking_engagements_count").default(0),
	aiMentionCount: integer("ai_mention_count").default(0),
	aiVisibilityScore: integer("ai_visibility_score").default(0),
	discoveredFrom: discoverySource("discovered_from"),
	extractionMetadata: jsonb("extraction_metadata"),
	isVerified: boolean("is_verified").default(false),
	isActive: boolean("is_active").default(true).notNull(),
	isPrimary: boolean("is_primary").default(false),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "brand_people_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const socialScores = pgTable("social_scores", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	date: date().notNull(),
	overallScore: integer("overall_score"),
	reachScore: integer("reach_score"),
	engagementScore: integer("engagement_score"),
	sentimentScore: integer("sentiment_score"),
	growthScore: integer("growth_score"),
	consistencyScore: integer("consistency_score"),
	platformBreakdown: jsonb("platform_breakdown"),
	totalFollowers: integer("total_followers"),
	totalEngagements: integer("total_engagements"),
	avgEngagementRate: real("avg_engagement_rate"),
	avgSentiment: real("avg_sentiment"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_scores_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	unique("social_scores_brand_id_date_unique").on(table.brandId, table.date),
]);

export const socialMentions = pgTable("social_mentions", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	socialAccountId: text("social_account_id"),
	platform: socialPlatform().notNull(),
	postId: text("post_id"),
	postUrl: text("post_url"),
	authorHandle: text("author_handle"),
	authorName: text("author_name"),
	authorAvatarUrl: text("author_avatar_url"),
	authorFollowers: integer("author_followers"),
	authorVerified: boolean("author_verified").default(false),
	content: text(),
	contentType: text("content_type"),
	sentiment: socialSentiment(),
	sentimentScore: real("sentiment_score"),
	engagementLikes: integer("engagement_likes").default(0),
	engagementShares: integer("engagement_shares").default(0),
	engagementComments: integer("engagement_comments").default(0),
	engagementViews: integer("engagement_views").default(0),
	isInfluencer: boolean("is_influencer").default(false),
	influencerTier: text("influencer_tier"),
	hashtags: jsonb().default([]),
	mentionedCompetitors: jsonb("mentioned_competitors").default([]),
	mentionedProducts: jsonb("mentioned_products").default([]),
	mediaUrls: jsonb("media_urls").default([]),
	postTimestamp: timestamp("post_timestamp", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_mentions_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "social_mentions_social_account_id_social_accounts_id_fk"
		}).onDelete("set null"),
]);

export const socialMetrics = pgTable("social_metrics", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	socialAccountId: text("social_account_id"),
	platform: socialPlatform().notNull(),
	date: date().notNull(),
	followersCount: integer("followers_count"),
	followersGain: integer("followers_gain"),
	followersLost: integer("followers_lost"),
	followingCount: integer("following_count"),
	postsCount: integer("posts_count"),
	newPostsCount: integer("new_posts_count"),
	engagementRate: real("engagement_rate"),
	avgLikesPerPost: real("avg_likes_per_post"),
	avgCommentsPerPost: real("avg_comments_per_post"),
	avgSharesPerPost: real("avg_shares_per_post"),
	impressions: integer(),
	reach: integer(),
	profileViews: integer("profile_views"),
	mentionsCount: integer("mentions_count"),
	sentimentPositive: integer("sentiment_positive"),
	sentimentNeutral: integer("sentiment_neutral"),
	sentimentNegative: integer("sentiment_negative"),
	avgSentimentScore: real("avg_sentiment_score"),
	platformMetrics: jsonb("platform_metrics"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "social_metrics_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "social_metrics_social_account_id_social_accounts_id_fk"
		}).onDelete("cascade"),
	unique("social_metrics_social_account_id_date_unique").on(table.socialAccountId, table.date),
]);

export const discoveredCompetitors = pgTable("discovered_competitors", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	competitorName: text("competitor_name").notNull(),
	competitorDomain: text("competitor_domain"),
	discoveryMethod: discoveryMethod("discovery_method").notNull(),
	confidenceScore: real("confidence_score").notNull(),
	keywordOverlap: real("keyword_overlap"),
	aiCoOccurrence: real("ai_co_occurrence"),
	industryMatch: boolean("industry_match").default(false),
	sharedKeywords: jsonb("shared_keywords").default([]),
	coOccurrenceQueries: jsonb("co_occurrence_queries").default([]),
	metadata: jsonb().default({}),
	status: discoveryStatus().default('pending').notNull(),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "discovered_competitors_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const scanJobQueue = pgTable("scan_job_queue", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	brandId: text("brand_id").notNull(),
	platforms: jsonb().default([]),
	handles: jsonb().default({}),
	status: syncJobStatus().default('pending'),
	priority: scanJobPriority().default('normal'),
	attempts: integer().default(0),
	maxAttempts: integer("max_attempts").default(3),
	completedPlatforms: jsonb("completed_platforms").default([]),
	failedPlatforms: jsonb("failed_platforms").default({}),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).defaultNow(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "scan_job_queue_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const serviceScanResults = pgTable("service_scan_results", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	brandId: text("brand_id").notNull(),
	platform: socialPlatform().notNull(),
	platformAccountId: text("platform_account_id"),
	targetHandle: text("target_handle").notNull(),
	profileData: jsonb("profile_data"),
	postsData: jsonb("posts_data"),
	mentionsData: jsonb("mentions_data"),
	followerCount: integer("follower_count").default(0),
	followingCount: integer("following_count").default(0),
	postCount: integer("post_count").default(0),
	engagementRate: real("engagement_rate").default(0),
	avgLikes: integer("avg_likes").default(0),
	avgComments: integer("avg_comments").default(0),
	avgShares: integer("avg_shares").default(0),
	avgViews: integer("avg_views").default(0),
	postFrequency: real("post_frequency").default(0),
	mentionsCount: integer("mentions_count").default(0),
	sentimentPositive: integer("sentiment_positive").default(0),
	sentimentNeutral: integer("sentiment_neutral").default(0),
	sentimentNegative: integer("sentiment_negative").default(0),
	scanStatus: scanStatus("scan_status").default('pending'),
	errorCode: text("error_code"),
	errorMessage: text("error_message"),
	scannedAt: timestamp("scanned_at", { withTimezone: true, mode: 'string' }),
	nextScanAt: timestamp("next_scan_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "service_scan_results_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	unique("service_scan_results_brand_id_platform_target_handle_unique").on(table.brandId, table.platform, table.targetHandle),
]);

export const brandLocations = pgTable("brand_locations", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	placeId: text("place_id"),
	name: text().notNull(),
	address: text(),
	city: text(),
	state: text(),
	country: text(),
	postalCode: text("postal_code"),
	latitude: real(),
	longitude: real(),
	locationType: locationType("location_type").default('headquarters'),
	isPrimary: boolean("is_primary").default(false),
	phone: text(),
	website: text(),
	email: text(),
	rating: real(),
	reviewCount: integer("review_count").default(0),
	categories: jsonb().default([]),
	openingHours: jsonb("opening_hours"),
	photos: jsonb().default([]),
	priceLevel: integer("price_level"),
	isVerified: boolean("is_verified").default(false),
	isActive: boolean("is_active").default(true),
	metadata: jsonb().default({}),
	lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "brand_locations_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	unique("brand_locations_place_id_unique").on(table.placeId),
]);

export const brandReviews = pgTable("brand_reviews", {
	id: text().primaryKey().notNull(),
	locationId: text("location_id").notNull(),
	brandId: text("brand_id").notNull(),
	source: reviewSource().default('google'),
	externalId: text("external_id"),
	authorName: text("author_name"),
	authorPhotoUrl: text("author_photo_url"),
	authorProfileUrl: text("author_profile_url"),
	rating: integer().notNull(),
	text: text(),
	language: text().default('en'),
	sentiment: sentiment(),
	sentimentScore: real("sentiment_score"),
	keywords: jsonb().default([]),
	ownerResponse: text("owner_response"),
	ownerRespondedAt: timestamp("owner_responded_at", { withTimezone: true, mode: 'string' }),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [brandLocations.id],
			name: "brand_reviews_location_id_brand_locations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "brand_reviews_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const locationScores = pgTable("location_scores", {
	id: text().primaryKey().notNull(),
	locationId: text("location_id").notNull(),
	brandId: text("brand_id").notNull(),
	overallScore: integer("overall_score").default(0),
	ratingScore: integer("rating_score").default(0),
	reviewVolumeScore: integer("review_volume_score").default(0),
	sentimentScore: integer("sentiment_score").default(0),
	responseScore: integer("response_score").default(0),
	totalReviews: integer("total_reviews").default(0),
	positiveReviews: integer("positive_reviews").default(0),
	neutralReviews: integer("neutral_reviews").default(0),
	negativeReviews: integer("negative_reviews").default(0),
	topPositiveKeywords: jsonb("top_positive_keywords").default([]),
	topNegativeKeywords: jsonb("top_negative_keywords").default([]),
	periodStart: timestamp("period_start", { withTimezone: true, mode: 'string' }),
	periodEnd: timestamp("period_end", { withTimezone: true, mode: 'string' }),
	calculatedAt: timestamp("calculated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [brandLocations.id],
			name: "location_scores_location_id_brand_locations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "location_scores_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const peopleEnrichment = pgTable("people_enrichment", {
	id: text().primaryKey().notNull(),
	personId: text("person_id").notNull(),
	linkedinHeadline: text("linkedin_headline"),
	linkedinAbout: text("linkedin_about"),
	linkedinProfileUrl: text("linkedin_profile_url"),
	linkedinPublicId: text("linkedin_public_id"),
	currentPosition: text("current_position"),
	currentCompany: text("current_company"),
	currentCompanyLinkedinUrl: text("current_company_linkedin_url"),
	pastPositions: jsonb("past_positions").default([]),
	totalYearsExperience: integer("total_years_experience"),
	education: jsonb().default([]),
	skills: jsonb().default([]),
	topSkills: jsonb("top_skills").default([]),
	certifications: jsonb().default([]),
	languages: jsonb().default([]),
	influenceScore: real("influence_score"),
	linkedinConnectionCount: integer("linkedin_connection_count"),
	linkedinPostCount: integer("linkedin_post_count"),
	linkedinEngagementRate: real("linkedin_engagement_rate"),
	linkedinArticleCount: integer("linkedin_article_count"),
	conferenceAppearances: jsonb("conference_appearances").default([]),
	publications: jsonb().default([]),
	podcastAppearances: jsonb("podcast_appearances").default([]),
	awards: jsonb().default([]),
	volunteerExperience: jsonb("volunteer_experience").default([]),
	enrichmentSource: enrichmentSource("enrichment_source"),
	enrichmentConfidence: real("enrichment_confidence"),
	rawEnrichmentData: jsonb("raw_enrichment_data"),
	lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.personId],
			foreignColumns: [brandPeople.id],
			name: "people_enrichment_person_id_brand_people_id_fk"
		}).onDelete("cascade"),
	unique("people_enrichment_person_id_unique").on(table.personId),
]);

export const opportunityMatches = pgTable("opportunity_matches", {
	id: text().primaryKey().notNull(),
	personId: text("person_id").notNull(),
	opportunityId: text("opportunity_id").notNull(),
	matchScore: real("match_score"),
	matchReasons: jsonb("match_reasons").default([]),
	matchedTopics: jsonb("matched_topics").default([]),
	matchedSkills: jsonb("matched_skills").default([]),
	status: opportunityStatus().default('open'),
	userNotes: text("user_notes"),
	appliedAt: timestamp("applied_at", { withTimezone: true, mode: 'string' }),
	responseReceivedAt: timestamp("response_received_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.personId],
			foreignColumns: [brandPeople.id],
			name: "opportunity_matches_person_id_brand_people_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [speakingOpportunities.id],
			name: "opportunity_matches_opportunity_id_speaking_opportunities_id_fk"
		}).onDelete("cascade"),
	unique("opportunity_matches_person_id_opportunity_id_unique").on(table.personId, table.opportunityId),
]);

export const speakingOpportunities = pgTable("speaking_opportunities", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	organizer: text(),
	organizerUrl: text("organizer_url"),
	eventType: eventType("event_type").notNull(),
	eventDate: timestamp("event_date", { withTimezone: true, mode: 'string' }),
	eventEndDate: timestamp("event_end_date", { withTimezone: true, mode: 'string' }),
	location: text(),
	isVirtual: boolean("is_virtual").default(false),
	venue: text(),
	cfpUrl: text("cfp_url"),
	cfpDeadline: timestamp("cfp_deadline", { withTimezone: true, mode: 'string' }),
	applicationUrl: text("application_url"),
	topics: jsonb().default([]),
	targetAudience: text("target_audience"),
	expectedAudienceSize: integer("expected_audience_size"),
	isPaid: boolean("is_paid").default(false),
	compensationDetails: text("compensation_details"),
	coversTravelExpenses: boolean("covers_travel_expenses").default(false),
	requirements: text(),
	speakerBenefits: jsonb("speaker_benefits").default([]),
	sourceUrl: text("source_url"),
	sourceType: text("source_type"),
	isActive: boolean("is_active").default(true),
	isFeatured: boolean("is_featured").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const apiIntegrations = pgTable("api_integrations", {
	id: text().primaryKey().notNull(),
	serviceName: text("service_name").notNull(),
	provider: text().notNull(),
	description: text(),
	category: integrationCategory().notNull(),
	status: integrationStatus().default('not_configured').notNull(),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	config: jsonb().notNull(),
	lastVerified: timestamp("last_verified", { withTimezone: true, mode: 'string' }),
	lastError: text("last_error"),
	usageThisMonth: integer("usage_this_month").default(0),
	quotaRemaining: integer("quota_remaining"),
	rateLimit: text("rate_limit"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.clerkUserId],
			name: "api_integrations_created_by_users_clerk_user_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.clerkUserId],
			name: "api_integrations_updated_by_users_clerk_user_id_fk"
		}),
]);

export const systemAuditLogs = pgTable("system_audit_logs", {
	id: text().primaryKey().notNull(),
	actorId: text("actor_id"),
	actorName: text("actor_name"),
	actorEmail: text("actor_email"),
	actorRole: text("actor_role"),
	action: text().notNull(),
	actionType: auditActionType("action_type").notNull(),
	description: text().notNull(),
	targetType: text("target_type"),
	targetId: text("target_id"),
	targetName: text("target_name"),
	changes: jsonb(),
	metadata: jsonb(),
	status: auditStatusType().default('success').notNull(),
	errorMessage: text("error_message"),
	errorStack: text("error_stack"),
	integrityHash: text("integrity_hash"),
	previousLogHash: text("previous_log_hash"),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.clerkUserId],
			name: "system_audit_logs_actor_id_users_clerk_user_id_fk"
		}),
]);

export const userAchievements = pgTable("user_achievements", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	achievementId: text("achievement_id").notNull(),
	xpAwarded: integer("xp_awarded").default(0).notNull(),
	unlockedAt: timestamp("unlocked_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.clerkUserId],
			name: "user_achievements_user_id_users_clerk_user_id_fk"
		}).onDelete("cascade"),
]);

export const userGamification = pgTable("user_gamification", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id"),
	currentXp: integer("current_xp").default(0).notNull(),
	totalXp: integer("total_xp").default(0).notNull(),
	level: integer().default(1).notNull(),
	streaks: jsonb().default({"currentDaily":0,"longestDaily":0,"currentWeekly":0,"lastLoginDate":"","longestWeekly":0,"lastWeekStartDate":""}),
	stats: jsonb().default({"totalAudits":0,"totalContent":0,"brandsCreated":0,"totalMentions":0,"crisesResolved":0,"reportsGenerated":0,"teamMembersInvited":0,"geoScoreImprovements":0,"totalRecommendations":0,"integrationsConnected":0,"recommendationsCompleted":0}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.clerkUserId],
			name: "user_gamification_user_id_users_clerk_user_id_fk"
		}).onDelete("cascade"),
	unique("user_gamification_user_id_unique").on(table.userId),
]);

export const apiCallTracking = pgTable("api_call_tracking", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	endpoint: varchar({ length: 500 }).notNull(),
	method: varchar({ length: 10 }).notNull(),
	statusCode: integer("status_code").notNull(),
	responseTime: integer("response_time"),
	userId: varchar("user_id", { length: 255 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const storageTracking = pgTable("storage_tracking", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	resourceType: varchar("resource_type", { length: 100 }).notNull(),
	resourceId: uuid("resource_id"),
	sizeBytes: integer("size_bytes").notNull(),
	storageLocation: varchar("storage_location", { length: 500 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const geoScoreHistory = pgTable("geo_score_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	overallScore: real("overall_score").notNull(),
	visibilityScore: real("visibility_score").notNull(),
	sentimentScore: real("sentiment_score").notNull(),
	recommendationScore: real("recommendation_score").notNull(),
	competitorGapScore: real("competitor_gap_score"),
	platformScores: jsonb("platform_scores"),
	previousScore: real("previous_score"),
	scoreChange: real("score_change"),
	trend: text(),
	mentionCount: integer("mention_count"),
	positiveMentions: integer("positive_mentions"),
	negativeMentions: integer("negative_mentions"),
	neutralMentions: integer("neutral_mentions"),
	recommendationCount: integer("recommendation_count"),
	completedRecommendations: integer("completed_recommendations"),
	calculationNotes: text("calculation_notes"),
	dataQuality: real("data_quality"),
	calculatedAt: timestamp("calculated_at", { mode: 'string' }).defaultNow().notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }),
	periodEnd: timestamp("period_end", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "geo_score_history_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const recommendationFeedback = pgTable("recommendation_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	recommendationId: text("recommendation_id").notNull(),
	userId: text("user_id").notNull(),
	rating: integer().notNull(),
	wasHelpful: boolean("was_helpful").notNull(),
	comment: text(),
	actualImpact: real("actual_impact"),
	expectedImpact: real("expected_impact"),
	implementationNotes: text("implementation_notes"),
	timeToImplement: integer("time_to_implement"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	read: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.recommendationId],
			foreignColumns: [recommendations.id],
			name: "recommendation_feedback_recommendation_id_recommendations_id_fk"
		}).onDelete("cascade"),
]);

export const notificationPreferences = pgTable("notification_preferences", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id").notNull(),
	emailEnabled: boolean("email_enabled").default(true).notNull(),
	emailDigestFrequency: emailDigestFrequency("email_digest_frequency").default('none').notNull(),
	emailAddress: text("email_address"),
	inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
	mentionNotifications: boolean("mention_notifications").default(true).notNull(),
	scoreChangeNotifications: boolean("score_change_notifications").default(true).notNull(),
	recommendationNotifications: boolean("recommendation_notifications").default(true).notNull(),
	importantNotifications: boolean("important_notifications").default(true).notNull(),
	timezone: text().default('UTC').notNull(),
	digestHour: integer("digest_hour").default(9).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notification_preferences_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("notification_preferences_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("notification_preferences_user_id_unique").on(table.userId),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id").notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	metadata: jsonb().default({}),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	isArchived: boolean("is_archived").default(false).notNull(),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("notifications_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("notifications_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("notifications_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const notificationReads = pgTable("notification_reads", {
	id: text().primaryKey().notNull(),
	notificationId: text("notification_id").notNull(),
	userId: text("user_id").notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notification_reads_notification_id_idx").using("btree", table.notificationId.asc().nullsLast().op("text_ops")),
	index("notification_reads_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.notificationId],
			foreignColumns: [notifications.id],
			name: "notification_reads_notification_id_notifications_id_fk"
		}).onDelete("cascade"),
]);

export const contentItems = pgTable("content_items", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id").notNull(),
	title: text().notNull(),
	body: text().notNull(),
	geoData: jsonb("geo_data"),
	status: contentStatus().default('draft').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const contentMetrics = pgTable("content_metrics", {
	id: text().primaryKey().notNull(),
	contentId: text("content_id").notNull(),
	platform: publishingPlatform().notNull(),
	views: integer().default(0).notNull(),
	engagementScore: integer("engagement_score").default(0).notNull(),
	lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contentId],
			foreignColumns: [contentItems.id],
			name: "content_metrics_content_id_content_items_id_fk"
		}).onDelete("cascade"),
]);

export const contentSchedules = pgTable("content_schedules", {
	id: text().primaryKey().notNull(),
	contentId: text("content_id").notNull(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }).notNull(),
	qstashScheduleId: text("qstash_schedule_id"),
	qstashMessageId: text("qstash_message_id"),
	platforms: jsonb().default([]).notNull(),
	status: scheduleStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contentId],
			foreignColumns: [contentItems.id],
			name: "content_schedules_content_id_content_items_id_fk"
		}).onDelete("cascade"),
]);

export const publishingHistory = pgTable("publishing_history", {
	id: text().primaryKey().notNull(),
	contentId: text("content_id").notNull(),
	platform: publishingPlatform().notNull(),
	externalId: text("external_id").notNull(),
	externalUrl: text("external_url").notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }).notNull(),
	status: publishingStatus().notNull(),
	errorMessage: text("error_message"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contentId],
			foreignColumns: [contentItems.id],
			name: "publishing_history_content_id_content_items_id_fk"
		}).onDelete("cascade"),
]);

export const systemSettings = pgTable("system_settings", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	type: systemSettingType().notNull(),
	category: text(),
	value: jsonb().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	lastModifiedBy: text("last_modified_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_system_settings_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_system_settings_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_system_settings_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
	index("idx_system_settings_type").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	unique("system_settings_key_key").on(table.key),
]);

export const platformQueries = pgTable("platform_queries", {
	id: text().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	userId: text("user_id").notNull(),
	queryText: text("query_text").notNull(),
	brandContext: text("brand_context"),
	platforms: jsonb().default([]),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "platform_queries_brand_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "platform_queries_user_id_fkey"
		}).onDelete("cascade"),
]);

export const platformInsights = pgTable("platform_insights", {
	id: text().primaryKey().notNull(),
	queryId: text("query_id").notNull(),
	brandId: text("brand_id").notNull(),
	userId: text("user_id").notNull(),
	platform: aiPlatform().notNull(),
	responseContent: text("response_content").notNull(),
	visibilityScore: integer("visibility_score"),
	citationCount: integer("citation_count").default(0).notNull(),
	mentionCount: integer("mention_count").default(0).notNull(),
	prominenceScore: integer("prominence_score"),
	contentTypePerformance: jsonb("content_type_performance").default({}),
	recommendations: jsonb().default([]),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.queryId],
			foreignColumns: [platformQueries.id],
			name: "platform_insights_query_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "platform_insights_brand_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "platform_insights_user_id_fkey"
		}).onDelete("cascade"),
]);

export const citationRecords = pgTable("citation_records", {
	id: text().primaryKey().notNull(),
	insightId: text("insight_id").notNull(),
	brandId: text("brand_id").notNull(),
	citationType: citationType("citation_type").notNull(),
	citationText: text("citation_text"),
	sourceUrl: text("source_url"),
	sourceTitle: text("source_title"),
	position: integer(),
	context: text(),
	contentType: text("content_type"),
	relevanceScore: integer("relevance_score"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.insightId],
			foreignColumns: [platformInsights.id],
			name: "citation_records_insight_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "citation_records_brand_id_fkey"
		}).onDelete("cascade"),
]);

export const geoBestPractices = pgTable("geo_best_practices", {
	id: varchar({ length: 255 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	platform: varchar({ length: 50 }),
	category: varchar({ length: 100 }).notNull(),
	practiceTitle: varchar("practice_title", { length: 255 }).notNull(),
	practiceDescription: text("practice_description").notNull(),
	implementationSteps: jsonb("implementation_steps").default([]),
	impactScore: integer("impact_score").default(5),
	effortScore: integer("effort_score").default(5),
	effectiveSince: date("effective_since").default(sql`CURRENT_DATE`),
	deprecatedAt: date("deprecated_at"),
	deprecationReason: text("deprecation_reason"),
	version: integer().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_geo_best_practices_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_geo_best_practices_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
]);

export const schemaTemplates = pgTable("schema_templates", {
	id: varchar({ length: 255 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	schemaType: varchar("schema_type", { length: 100 }).notNull(),
	platformRelevance: jsonb("platform_relevance").default({}),
	templateCode: text("template_code").notNull(),
	usageInstructions: text("usage_instructions"),
	version: integer().default(1),
	isCurrent: boolean("is_current").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	supersededBy: varchar("superseded_by", { length: 255 }),
});

export const platformChanges = pgTable("platform_changes", {
	id: varchar({ length: 255 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	platform: varchar({ length: 50 }).notNull(),
	changeDetected: date("change_detected").notNull(),
	changeType: varchar("change_type", { length: 100 }).notNull(),
	description: text().notNull(),
	impactAssessment: text("impact_assessment"),
	recommendedResponse: text("recommended_response"),
	confidenceScore: integer("confidence_score").default(50),
	source: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_platform_changes_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
]);

export const actionPlans = pgTable("action_plans", {
	id: varchar({ length: 255 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	brandId: varchar("brand_id", { length: 255 }),
	version: integer().default(1),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow(),
	knowledgeBaseVersion: varchar("knowledge_base_version", { length: 50 }),
	actions: jsonb().default([]),
	totalImpactEstimate: integer("total_impact_estimate").default(0),
	totalEffortHours: integer("total_effort_hours").default(0),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_action_plans_org").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
]);

export const actionPlanProgress = pgTable("action_plan_progress", {
	id: varchar({ length: 255 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	actionPlanId: varchar("action_plan_id", { length: 255 }).notNull(),
	actionIndex: integer("action_index").notNull(),
	status: varchar({ length: 50 }).default('pending'),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const geoAlerts = pgTable("geo_alerts", {
	id: varchar({ length: 255 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	brandId: varchar("brand_id", { length: 255 }),
	alertType: geoAlertType("alert_type").notNull(),
	severity: alertSeverity().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	affectedPlatforms: jsonb("affected_platforms").default([]).notNull(),
	actionRequired: boolean("action_required").default(false).notNull(),
	suggestedActions: jsonb("suggested_actions").default([]),
	platformChangeId: varchar("platform_change_id", { length: 255 }),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	dismissedAt: timestamp("dismissed_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_geo_alerts_brand").using("btree", table.brandId.asc().nullsLast().op("text_ops")),
	index("idx_geo_alerts_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_geo_alerts_org").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("idx_geo_alerts_type").using("btree", table.alertType.asc().nullsLast().op("enum_ops")),
	index("idx_geo_alerts_unread").using("btree", table.readAt.asc().nullsLast().op("timestamptz_ops")),
]);
