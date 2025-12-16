CREATE TYPE "public"."ai_platform_type" AS ENUM('chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot');--> statement-breakpoint
CREATE TYPE "public"."discovery_source" AS ENUM('website_scrape', 'manual', 'linkedin', 'api_import');--> statement-breakpoint
CREATE TYPE "public"."feature_owner" AS ENUM('self', 'competitor', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('scheduled', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role_category" AS ENUM('c_suite', 'founder', 'board', 'key_employee', 'ambassador', 'advisor', 'investor');--> statement-breakpoint
CREATE TYPE "public"."serp_feature_type" AS ENUM('featured_snippet', 'people_also_ask', 'ai_overview', 'knowledge_panel', 'local_pack', 'image_pack', 'video_carousel', 'top_stories');--> statement-breakpoint
CREATE TYPE "public"."social_account_type" AS ENUM('company', 'personal', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'github', 'pinterest', 'medium', 'reddit', 'discord', 'threads', 'mastodon', 'bluesky');--> statement-breakpoint
CREATE TYPE "public"."social_sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TABLE "brand_people" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"role_category" "role_category",
	"department" text,
	"bio" text,
	"short_bio" text,
	"photo_url" text,
	"email" text,
	"phone" text,
	"social_profiles" jsonb DEFAULT '{}'::jsonb,
	"linkedin_url" text,
	"twitter_url" text,
	"personal_website" text,
	"linkedin_followers" integer,
	"twitter_followers" integer,
	"total_social_followers" integer,
	"thought_leadership_activities" jsonb DEFAULT '[]'::jsonb,
	"thought_leadership_score" integer DEFAULT 0,
	"publications_count" integer DEFAULT 0,
	"speaking_engagements_count" integer DEFAULT 0,
	"ai_mention_count" integer DEFAULT 0,
	"ai_visibility_score" integer DEFAULT 0,
	"discovered_from" "discovery_source",
	"extraction_metadata" jsonb,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_enriched_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "competitive_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"alert_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"competitor_name" text,
	"platform" text,
	"keyword" text,
	"previous_value" numeric(10, 2),
	"current_value" numeric(10, 2),
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitive_gaps" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"gap_type" text NOT NULL,
	"keyword" text,
	"topic" text,
	"description" text NOT NULL,
	"competitor_name" text NOT NULL,
	"competitor_position" integer,
	"competitor_url" text,
	"search_volume" integer,
	"difficulty" integer,
	"opportunity" integer,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"competitor_name" text NOT NULL,
	"competitor_domain" text,
	"platform" text NOT NULL,
	"query" text NOT NULL,
	"position" integer,
	"sentiment" text DEFAULT 'neutral',
	"context" text,
	"citation_url" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "executive_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"portfolio_id" text,
	"title" text NOT NULL,
	"report_type" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"content" jsonb NOT NULL,
	"pdf_url" text,
	"pdf_generated_at" timestamp with time zone,
	"status" "report_status" DEFAULT 'scheduled' NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people_ai_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "ai_platform_type" NOT NULL,
	"query" text,
	"response_snippet" text,
	"full_response" text,
	"mentioned_with_brand" boolean DEFAULT false,
	"mentioned_with_competitor" boolean DEFAULT false,
	"competitor_name" text,
	"sentiment" text,
	"sentiment_score" real,
	"position" integer,
	"context" jsonb,
	"query_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"date" date NOT NULL,
	"overall_score" integer,
	"executive_visibility_score" integer,
	"thought_leadership_score" integer,
	"ai_mention_score" integer,
	"social_engagement_score" integer,
	"person_breakdown" jsonb,
	"total_people_tracked" integer,
	"total_ai_mentions" integer,
	"total_social_followers" integer,
	"avg_thought_leadership_score" real,
	"top_performer_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_scores_brand_id_date_unique" UNIQUE("brand_id","date")
);
--> statement-breakpoint
CREATE TABLE "portfolio_brands" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_highlighted" boolean DEFAULT false,
	"custom_label" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"settings" jsonb DEFAULT '{"defaultView":"grid","alertThresholds":{"scoreDropPercent":10,"mentionDropPercent":20,"competitorGainPercent":15},"reportRecipients":[],"reportFrequency":"weekly","compareMetrics":["unified_score","geo_score","mentions_count"]}'::jsonb,
	"aggregated_metrics" jsonb DEFAULT '{"totalBrands":0,"avgUnifiedScore":0,"avgGeoScore":0,"avgSeoScore":0,"avgAeoScore":0,"totalMentions":0,"totalRecommendations":0,"healthStatus":"healthy"}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metrics_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheduled_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"portfolio_id" text,
	"name" text NOT NULL,
	"frequency" "report_frequency" NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"time_of_day" text DEFAULT '09:00',
	"recipients" jsonb DEFAULT '[]'::jsonb,
	"include_all_brands" boolean DEFAULT true,
	"brand_ids" jsonb DEFAULT '[]'::jsonb,
	"sections" jsonb DEFAULT '["summary","scores","mentions","recommendations","competitive","insights"]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serp_features" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"keyword" text NOT NULL,
	"feature_type" "serp_feature_type" NOT NULL,
	"owned_by" "feature_owner" NOT NULL,
	"competitor_name" text,
	"snippet_content" text,
	"snippet_url" text,
	"position" integer,
	"visibility" numeric(5, 2),
	"search_engine" text DEFAULT 'google' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_of_voice" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"date" date NOT NULL,
	"platform" text NOT NULL,
	"brand_mentions" integer DEFAULT 0 NOT NULL,
	"total_mentions" integer DEFAULT 0 NOT NULL,
	"sov_percentage" numeric(5, 2),
	"avg_position" numeric(5, 2),
	"top_positions" integer DEFAULT 0,
	"positive_mentions" integer DEFAULT 0,
	"neutral_mentions" integer DEFAULT 0,
	"negative_mentions" integer DEFAULT 0,
	"competitor_breakdown" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"account_type" "social_account_type" DEFAULT 'company',
	"account_id" text NOT NULL,
	"account_handle" text,
	"account_name" text,
	"profile_url" text,
	"avatar_url" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"token_metadata" jsonb,
	"followers_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"posts_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false,
	"connection_status" text DEFAULT 'connected',
	"last_synced_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"social_account_id" text,
	"platform" "social_platform" NOT NULL,
	"post_id" text,
	"post_url" text,
	"author_handle" text,
	"author_name" text,
	"author_avatar_url" text,
	"author_followers" integer,
	"author_verified" boolean DEFAULT false,
	"content" text,
	"content_type" text,
	"sentiment" "social_sentiment",
	"sentiment_score" real,
	"engagement_likes" integer DEFAULT 0,
	"engagement_shares" integer DEFAULT 0,
	"engagement_comments" integer DEFAULT 0,
	"engagement_views" integer DEFAULT 0,
	"is_influencer" boolean DEFAULT false,
	"influencer_tier" text,
	"hashtags" jsonb DEFAULT '[]'::jsonb,
	"mentioned_competitors" jsonb DEFAULT '[]'::jsonb,
	"mentioned_products" jsonb DEFAULT '[]'::jsonb,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"post_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"social_account_id" text,
	"platform" "social_platform" NOT NULL,
	"date" date NOT NULL,
	"followers_count" integer,
	"followers_gain" integer,
	"followers_lost" integer,
	"following_count" integer,
	"posts_count" integer,
	"new_posts_count" integer,
	"engagement_rate" real,
	"avg_likes_per_post" real,
	"avg_comments_per_post" real,
	"avg_shares_per_post" real,
	"impressions" integer,
	"reach" integer,
	"profile_views" integer,
	"mentions_count" integer,
	"sentiment_positive" integer,
	"sentiment_neutral" integer,
	"sentiment_negative" integer,
	"avg_sentiment_score" real,
	"platform_metrics" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_metrics_social_account_id_date_unique" UNIQUE("social_account_id","date")
);
--> statement-breakpoint
CREATE TABLE "social_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"date" date NOT NULL,
	"overall_score" integer,
	"reach_score" integer,
	"engagement_score" integer,
	"sentiment_score" integer,
	"growth_score" integer,
	"consistency_score" integer,
	"platform_breakdown" jsonb,
	"total_followers" integer,
	"total_engagements" integer,
	"avg_engagement_rate" real,
	"avg_sentiment" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_scores_brand_id_date_unique" UNIQUE("brand_id","date")
);
--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "visual" SET DEFAULT '{"primaryColor":null,"secondaryColor":null,"accentColor":null,"colorPalette":[],"fontFamily":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "seo_keywords" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "geo_keywords" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "value_propositions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "social_links" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "confidence" jsonb DEFAULT '{"overall":0,"perField":{}}'::jsonb;--> statement-breakpoint
ALTER TABLE "brand_people" ADD CONSTRAINT "brand_people_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitive_alerts" ADD CONSTRAINT "competitive_alerts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitive_gaps" ADD CONSTRAINT "competitive_gaps_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_mentions" ADD CONSTRAINT "competitor_mentions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_reports" ADD CONSTRAINT "executive_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_reports" ADD CONSTRAINT "executive_reports_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_ai_mentions" ADD CONSTRAINT "people_ai_mentions_person_id_brand_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."brand_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_ai_mentions" ADD CONSTRAINT "people_ai_mentions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_scores" ADD CONSTRAINT "people_scores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_brands" ADD CONSTRAINT "portfolio_brands_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_brands" ADD CONSTRAINT "portfolio_brands_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serp_features" ADD CONSTRAINT "serp_features_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_of_voice" ADD CONSTRAINT "share_of_voice_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_mentions" ADD CONSTRAINT "social_mentions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_mentions" ADD CONSTRAINT "social_mentions_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_metrics" ADD CONSTRAINT "social_metrics_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_metrics" ADD CONSTRAINT "social_metrics_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_scores" ADD CONSTRAINT "social_scores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;