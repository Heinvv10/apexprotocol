CREATE TYPE "public"."agent_kind" AS ENUM('visibility_gap_brief', 'competitor_audit', 'content_refresh');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('pending', 'running', 'awaiting_approval', 'approved', 'rejected', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_crawler" AS ENUM('gptbot', 'chatgpt_user', 'oai_searchbot', 'claudebot', 'anthropic_ai', 'claude_web', 'perplexitybot', 'perplexity_user', 'google_extended', 'googleother', 'bingbot_gpt', 'meta_externalagent', 'ccbot', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."alert_channel" AS ENUM('email', 'slack', 'whatsapp', 'webhook', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."alert_frequency" AS ENUM('immediate', 'hourly', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."alert_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_trigger" AS ENUM('threshold', 'anomaly', 'mention', 'competitor', 'crisis', 'schedule');--> statement-breakpoint
CREATE TYPE "public"."predictive_alert_type" AS ENUM('predicted_drop', 'emerging_opportunity', 'trend_reversal');--> statement-breakpoint
CREATE TYPE "public"."api_key_provider" AS ENUM('openai', 'anthropic', 'gemini', 'serper', 'pinecone');--> statement-breakpoint
CREATE TYPE "public"."attribution_model" AS ENUM('first_touch', 'last_touch', 'linear', 'time_decay', 'position_based');--> statement-breakpoint
CREATE TYPE "public"."best_practice_category" AS ENUM('schema', 'content', 'social', 'technical');--> statement-breakpoint
CREATE TYPE "public"."brand_voice_source_type" AS ENUM('paste', 'url', 'upload');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('email', 'social', 'webinar', 'landing_page', 'retargeting');--> statement-breakpoint
CREATE TYPE "public"."citation_type" AS ENUM('direct_quote', 'paraphrase', 'link', 'reference');--> statement-breakpoint
CREATE TYPE "public"."conversion_type" AS ENUM('signup', 'purchase', 'contact', 'download', 'demo_request', 'newsletter', 'free_trial', 'custom');--> statement-breakpoint
CREATE TYPE "public"."email_event_type" AS ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('brand', 'keyword', 'topic', 'platform');--> statement-breakpoint
CREATE TYPE "public"."geo_alert_type" AS ENUM('algorithm_change', 'strategy_deprecated', 'new_opportunity', 'competitor_move', 'score_impact', 'recommendation_updated');--> statement-breakpoint
CREATE TYPE "public"."geo_platform" AS ENUM('chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'all');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('website', 'linkedin', 'email', 'social', 'referral', 'webinar', 'imported', 'api');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'engaged', 'trialing', 'customer', 'lost', 'archived');--> statement-breakpoint
CREATE TYPE "public"."milestone_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."model_status" AS ENUM('training', 'active', 'failed', 'retired');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."period" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."platform_change_type" AS ENUM('citation_pattern', 'content_preference', 'feature_update', 'algorithm_change');--> statement-breakpoint
CREATE TYPE "public"."platform_tier" AS ENUM('tier_1', 'tier_2', 'tier_3', 'tier_4');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'scheduled', 'published', 'paused', 'archived', 'failed');--> statement-breakpoint
CREATE TYPE "public"."prediction_status" AS ENUM('active', 'stale', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."roadmap_status" AS ENUM('draft', 'active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."roadmap_target_position" AS ENUM('leader', 'top3', 'competitive');--> statement-breakpoint
CREATE TYPE "public"."schema_type" AS ENUM('FAQPage', 'Organization', 'Article', 'HowTo', 'Product', 'LocalBusiness', 'Person', 'Event', 'Review', 'BreadcrumbList');--> statement-breakpoint
CREATE TYPE "public"."score_category" AS ENUM('geo', 'seo', 'aeo', 'smo', 'ppo');--> statement-breakpoint
CREATE TYPE "public"."score_data_source" AS ENUM('scraped', 'estimated', 'manual');--> statement-breakpoint
CREATE TYPE "public"."simulation_status" AS ENUM('pending', 'running', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."simulation_type" AS ENUM('single', 'ab_test');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'past_due', 'trialing', 'none');--> statement-breakpoint
CREATE TYPE "public"."system_setting_type" AS ENUM('api_key', 'feature_flag', 'configuration', 'limit');--> statement-breakpoint
CREATE TYPE "public"."usage_event_kind" AS ENUM('llm_input_tokens', 'llm_output_tokens', 'audit_run', 'monitored_prompt_run', 'agent_run', 'serpapi_query', 'dataforseo_query', 'pdf_report_generated', 'embed_token_minted');--> statement-breakpoint
CREATE TYPE "public"."zapier_event" AS ENUM('score_changed', 'new_recommendation', 'alert_fired', 'mention_detected', 'audit_completed');--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'openai_search';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'bing_copilot';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'notebooklm';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'cohere';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'janus';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'mistral';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'llama';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'yandexgpt';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'kimi';--> statement-breakpoint
ALTER TYPE "public"."ai_platform" ADD VALUE 'qwen';--> statement-breakpoint
ALTER TYPE "public"."api_key_type" ADD VALUE 'gemini' BEFORE 'serper';--> statement-breakpoint
ALTER TYPE "public"."sentiment" ADD VALUE 'unrecognized';--> statement-breakpoint
CREATE TABLE "action_plan_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"knowledge_base_version" varchar(50) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actions_snapshot" jsonb NOT NULL,
	"changes_from_previous" jsonb,
	"downloaded_at" timestamp with time zone,
	"downloaded_by" uuid
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"triggered_by_id" text,
	"kind" "agent_kind" NOT NULL,
	"status" "agent_run_status" DEFAULT 'pending' NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb,
	"output" jsonb,
	"approved_by_id" text,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"brand_id" text,
	"name" text NOT NULL,
	"channel_type" "alert_channel" NOT NULL,
	"frequency" "alert_frequency" DEFAULT 'immediate',
	"config" jsonb,
	"enabled" boolean DEFAULT true,
	"messages_sent" integer DEFAULT 0,
	"last_used_at" timestamp,
	"last_error" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_rule_id" text,
	"alert_channel_id" text,
	"brand_id" text,
	"trigger" "alert_trigger",
	"priority" "alert_priority" DEFAULT 'medium',
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"channel_type" "alert_channel",
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"brand_id" text,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"trigger" "alert_trigger",
	"priority" "alert_priority" DEFAULT 'medium',
	"conditions" jsonb,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"frequency" text DEFAULT 'instant',
	"enabled" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bot_crawls" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"crawler" "ai_crawler" NOT NULL,
	"user_agent" text NOT NULL,
	"path" text NOT NULL,
	"http_status" integer,
	"source" text NOT NULL,
	"ip_redacted" text,
	"response_bytes" integer,
	"latency_ms" integer,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_voice_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"created_by_id" text,
	"label" text NOT NULL,
	"source_type" "brand_voice_source_type" NOT NULL,
	"source_url" text,
	"raw_text" text NOT NULL,
	"descriptor_json" jsonb,
	"extraction_error" text,
	"extracted_at" timestamp with time zone,
	"schema_version" text DEFAULT '0.5' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "browser_platform_health" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_name" text NOT NULL,
	"status" text NOT NULL,
	"last_status_change" timestamp with time zone DEFAULT now() NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0,
	"stats" jsonb DEFAULT '{"totalQueries":0,"successfulQueries":0,"failedQueries":0,"captchaCount":0,"rateLimitCount":0,"averageResponseTimeMs":0,"uptime":100}'::jsonb,
	"rate_limit_status" jsonb DEFAULT '{"limited":false}'::jsonb,
	"blocked_identifiers" jsonb DEFAULT '[]'::jsonb,
	"config" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "browser_platform_health_platform_name_unique" UNIQUE("platform_name")
);
--> statement-breakpoint
CREATE TABLE "browser_query_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"brand_id" text,
	"platform_name" text NOT NULL,
	"query" text NOT NULL,
	"status" text NOT NULL,
	"response" text,
	"extracted_data" jsonb DEFAULT '{}'::jsonb,
	"error_message" text,
	"error_type" text,
	"screenshot_path" text,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"response_time_ms" integer,
	"retry_count" integer DEFAULT 0,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "browser_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_name" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"suspension_reason" text,
	"encrypted_data" text,
	"metadata" jsonb DEFAULT '{"userAgent":"","viewport":{"width":1366,"height":768},"timezone":"UTC","language":"en","lastIpAddress":"","requestCount":0,"successCount":0,"failureCount":0}'::jsonb,
	"stats" jsonb DEFAULT '{"totalQueries":0,"successfulQueries":0,"failedQueries":0,"consecutiveFailures":0,"averageResponseTimeMs":0}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citation_conversions" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"mention_id" text,
	"source_platform" text NOT NULL,
	"visitor_session_id" text,
	"landing_page" text,
	"referrer_url" text,
	"conversion_type" "conversion_type" NOT NULL,
	"conversion_value" numeric(10, 2) DEFAULT '0',
	"currency" text DEFAULT 'USD',
	"attribution_confidence" numeric(3, 2) DEFAULT '0.5',
	"attribution_model" "attribution_model" DEFAULT 'last_touch',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"converted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citation_records" (
	"id" text PRIMARY KEY NOT NULL,
	"insight_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"citation_type" "citation_type" NOT NULL,
	"citation_text" text,
	"source_url" text,
	"source_title" text,
	"position" integer,
	"context" text,
	"content_type" text,
	"relevance_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citation_roi_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_conversions" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"total_citations" integer DEFAULT 0,
	"estimated_traffic" integer DEFAULT 0,
	"roi_percentage" numeric(8, 2),
	"cost_per_conversion" numeric(10, 2),
	"revenue_per_citation" numeric(10, 2),
	"platform_breakdown" jsonb DEFAULT '[]'::jsonb,
	"conversion_breakdown" jsonb DEFAULT '[]'::jsonb,
	"report_data" jsonb DEFAULT '{}'::jsonb,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citation_tracking_links" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"original_url" text NOT NULL,
	"tracking_url" text NOT NULL,
	"short_code" text,
	"utm_params" jsonb DEFAULT '{}'::jsonb,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"campaign_name" text,
	"target_platform" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "citation_tracking_links_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "competitor_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"competitor_name" text NOT NULL,
	"competitor_domain" text,
	"geo_score" integer DEFAULT 0 NOT NULL,
	"seo_score" integer DEFAULT 0 NOT NULL,
	"aeo_score" integer DEFAULT 0 NOT NULL,
	"smo_score" integer DEFAULT 0 NOT NULL,
	"ppo_score" integer DEFAULT 0 NOT NULL,
	"unified_score" integer DEFAULT 0 NOT NULL,
	"grade" text DEFAULT 'D' NOT NULL,
	"geo_breakdown" jsonb,
	"seo_breakdown" jsonb,
	"aeo_breakdown" jsonb,
	"smo_breakdown" jsonb,
	"ppo_breakdown" jsonb,
	"confidence" integer DEFAULT 50 NOT NULL,
	"data_source" "score_data_source" DEFAULT 'estimated' NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"dashboard_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"config" jsonb NOT NULL,
	"author_id" text,
	"message" text,
	"rolled_back_from_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_by_id" text,
	"head_version_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text,
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"affected_platforms" jsonb NOT NULL,
	"action_required" boolean DEFAULT false NOT NULL,
	"suggested_actions" jsonb NOT NULL,
	"related_changes" jsonb,
	"platform_change_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "geo_best_practices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(50) NOT NULL,
	"category" varchar(100) NOT NULL,
	"practice_title" varchar(255) NOT NULL,
	"practice_description" text NOT NULL,
	"implementation_steps" jsonb NOT NULL,
	"impact_score" integer NOT NULL,
	"effort_score" integer NOT NULL,
	"effective_since" timestamp with time zone NOT NULL,
	"deprecated_at" timestamp with time zone,
	"deprecation_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "improvement_roadmaps" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_competitor" text,
	"target_position" "roadmap_target_position" DEFAULT 'competitive' NOT NULL,
	"current_unified_score" integer DEFAULT 0 NOT NULL,
	"target_unified_score" integer DEFAULT 0 NOT NULL,
	"current_grade" text DEFAULT 'D' NOT NULL,
	"target_grade" text DEFAULT 'B' NOT NULL,
	"estimated_weeks" integer DEFAULT 12 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" "roadmap_status" DEFAULT 'draft' NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"ai_model" text,
	"generation_prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"keyword" text NOT NULL,
	"url" text NOT NULL,
	"current_position" integer DEFAULT 0 NOT NULL,
	"previous_position" integer DEFAULT 0 NOT NULL,
	"search_volume" integer DEFAULT 0,
	"difficulty" integer DEFAULT 0,
	"traffic" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"lead_id" uuid,
	"campaign_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"page_url" varchar(2048),
	"referrer" varchar(2048),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_content" varchar(255),
	"utm_term" varchar(255),
	"user_agent" varchar(512),
	"ip_address" varchar(50),
	"properties" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"lead_id" uuid NOT NULL,
	"sequence_id" uuid,
	"action" varchar(50) NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"external_campaign_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "campaign_type" DEFAULT 'email' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"budget" numeric(10, 2),
	"leads" integer DEFAULT 0,
	"opens" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"start_date" timestamp,
	"end_date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_email_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"lead_id" uuid,
	"campaign_id" uuid,
	"list_id" uuid,
	"event" "email_event_type" NOT NULL,
	"url" varchar(2048),
	"user_agent" varchar(512),
	"ip_address" varchar(50),
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_email_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"external_list_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"subscriber_count" integer DEFAULT 0,
	"unsubscribe_count" integer DEFAULT 0,
	"bounce_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_email_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_template" boolean DEFAULT false,
	"email_ids" jsonb,
	"trigger_type" varchar(100),
	"trigger_delay" integer,
	"enrollment_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"conversion_rate" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"external_lead_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"company" varchar(255),
	"title" varchar(255),
	"phone" varchar(20),
	"source" "lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"lead_score" integer DEFAULT 0,
	"mql_score" integer DEFAULT 0,
	"sql_score" integer DEFAULT 0,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"last_engaged_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"campaign_id" uuid,
	"date" timestamp NOT NULL,
	"period" "period" NOT NULL,
	"leads" integer DEFAULT 0,
	"email_sent" integer DEFAULT 0,
	"email_opened" integer DEFAULT 0,
	"email_clicked" integer DEFAULT 0,
	"email_bounced" integer DEFAULT 0,
	"social_impressions" integer DEFAULT 0,
	"social_engagements" integer DEFAULT 0,
	"website_visits" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"campaign_id" uuid,
	"external_post_id" varchar(255),
	"content" text NOT NULL,
	"platforms" jsonb NOT NULL,
	"image_urls" jsonb,
	"hashtags" jsonb,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "model_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version" text NOT NULL,
	"model_type" text DEFAULT 'linear_regression' NOT NULL,
	"trained_at" timestamp DEFAULT now() NOT NULL,
	"training_duration" integer,
	"data_points_used" integer,
	"date_range_start" timestamp,
	"date_range_end" timestamp,
	"performance_metrics" jsonb,
	"hyperparameters" jsonb,
	"status" "model_status" DEFAULT 'active' NOT NULL,
	"is_latest" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"error_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_metadata_model_version_unique" UNIQUE("model_version")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(50) NOT NULL,
	"change_detected" timestamp with time zone NOT NULL,
	"change_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"impact_assessment" text NOT NULL,
	"recommended_response" text NOT NULL,
	"confidence_score" integer NOT NULL,
	"source" varchar(255) NOT NULL,
	"affected_recommendations" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"query_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text NOT NULL,
	"platform" "ai_platform" NOT NULL,
	"response_content" text NOT NULL,
	"visibility_score" integer,
	"citation_count" integer DEFAULT 0 NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"prominence_score" integer,
	"content_type_performance" jsonb DEFAULT '{}'::jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"platform_id" text NOT NULL,
	"status" "integration_status" DEFAULT 'not_configured' NOT NULL,
	"is_monitoring" boolean DEFAULT false NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"stats" jsonb DEFAULT '{"totalQueries":0,"successfulQueries":0,"failedQueries":0,"averageResponseTimeMs":0}'::jsonb,
	"config_overrides" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text NOT NULL,
	"query_text" text NOT NULL,
	"brand_context" text,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "platform_query_results" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"query" text NOT NULL,
	"response" text NOT NULL,
	"parsed_data" jsonb DEFAULT '{}'::jsonb,
	"metrics" jsonb DEFAULT '{"visibility":0,"position":null,"confidence":0}'::jsonb,
	"response_time_ms" integer,
	"status" text NOT NULL,
	"query_executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_registry" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"tier" "platform_tier" NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"api_endpoint" text,
	"auth_method" text DEFAULT 'api_key' NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb,
	"rate_limit" jsonb DEFAULT '{"requestsPerMinute":10,"requestsPerDay":1000}'::jsonb,
	"query_config" jsonb DEFAULT '{}'::jsonb,
	"response_config" jsonb DEFAULT '{}'::jsonb,
	"features" jsonb DEFAULT '{}'::jsonb,
	"health_check" jsonb DEFAULT '{"enabled":true,"intervalMinutes":60}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_registry_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" text NOT NULL,
	"entity_type" "entity_type" DEFAULT 'brand' NOT NULL,
	"entity_id" text,
	"prediction_date" timestamp DEFAULT now() NOT NULL,
	"target_date" timestamp NOT NULL,
	"predicted_value" real NOT NULL,
	"confidence_lower" real NOT NULL,
	"confidence_upper" real NOT NULL,
	"confidence" real NOT NULL,
	"trend" text,
	"trend_magnitude" real,
	"explanation" text,
	"model_version" text NOT NULL,
	"status" "prediction_status" DEFAULT 'active' NOT NULL,
	"actual_value" real,
	"prediction_error" real,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictive_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" text NOT NULL,
	"prediction_id" uuid,
	"user_id" text NOT NULL,
	"alert_type" "predictive_alert_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"confidence" real NOT NULL,
	"current_value" real NOT NULL,
	"predicted_value" real NOT NULL,
	"predicted_change" real NOT NULL,
	"lead_time" integer NOT NULL,
	"predicted_impact_date" timestamp NOT NULL,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"action_recommendation" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp,
	"was_accurate" boolean,
	"validated_at" timestamp,
	"validation_notes" text,
	"last_alerted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_lift" (
	"id" text PRIMARY KEY NOT NULL,
	"recommendation_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"window_days" integer DEFAULT 30 NOT NULL,
	"pre_snapshot" jsonb NOT NULL,
	"post_snapshot" jsonb,
	"score_delta" integer,
	"revenue_cents_delta" integer,
	"projected_score_delta" integer,
	"projected_revenue_cents_delta" integer,
	"projection_confidence" integer,
	"reconciliation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"roadmap_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "score_category" NOT NULL,
	"phase" integer DEFAULT 1 NOT NULL,
	"order_in_phase" integer DEFAULT 0 NOT NULL,
	"expected_score_impact" integer DEFAULT 0 NOT NULL,
	"expected_days_to_complete" integer DEFAULT 7 NOT NULL,
	"difficulty" "milestone_difficulty" DEFAULT 'medium' NOT NULL,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"status" "milestone_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"actual_score_impact" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_progress_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"roadmap_id" text NOT NULL,
	"snapshot_date" date NOT NULL,
	"geo_score" integer DEFAULT 0 NOT NULL,
	"seo_score" integer DEFAULT 0 NOT NULL,
	"aeo_score" integer DEFAULT 0 NOT NULL,
	"smo_score" integer DEFAULT 0 NOT NULL,
	"ppo_score" integer DEFAULT 0 NOT NULL,
	"unified_score" integer DEFAULT 0 NOT NULL,
	"grade" text DEFAULT 'D' NOT NULL,
	"milestones_completed" integer DEFAULT 0 NOT NULL,
	"milestones_total" integer DEFAULT 0 NOT NULL,
	"rank_among_competitors" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schema_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schema_type" varchar(100) NOT NULL,
	"platform_relevance" jsonb NOT NULL,
	"template_code" text NOT NULL,
	"usage_instructions" text NOT NULL,
	"version" integer NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"superseded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_results" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_id" text NOT NULL,
	"platform" text NOT NULL,
	"baseline_score" real DEFAULT 0 NOT NULL,
	"baseline_citations" integer DEFAULT 0 NOT NULL,
	"baseline_response" text,
	"baseline_breakdown" jsonb,
	"enriched_score" real DEFAULT 0 NOT NULL,
	"enriched_citations" integer DEFAULT 0 NOT NULL,
	"enriched_response" text,
	"enriched_breakdown" jsonb,
	"variant_b_score" real,
	"variant_b_citations" integer,
	"variant_b_response" text,
	"variant_b_breakdown" jsonb,
	"score_delta" real DEFAULT 0 NOT NULL,
	"citation_delta" integer DEFAULT 0 NOT NULL,
	"variant_b_score_delta" real,
	"confidence" real DEFAULT 0 NOT NULL,
	"result_status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" "simulation_type" DEFAULT 'single' NOT NULL,
	"query" text NOT NULL,
	"content_title" text,
	"content_body" text NOT NULL,
	"content_type" text,
	"variant_b_title" text,
	"variant_b_body" text,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"brand_context_snapshot" text,
	"status" "simulation_status" DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"type" "system_setting_type" NOT NULL,
	"category" text,
	"value" jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_modified_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_organization_id" text,
	"kind" "usage_event_kind" NOT NULL,
	"quantity" bigint NOT NULL,
	"unit_cost_micro_cents" integer,
	"cost_cents" integer,
	"resource_type" text,
	"resource_id" text,
	"provider" text,
	"metadata" text,
	"idempotency_key" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zapier_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event" "zapier_event" NOT NULL,
	"target_url" text NOT NULL,
	"brand_id" text,
	"zapier_bundle_id" text,
	"last_fired_at" timestamp with time zone,
	"last_error" text,
	"failure_count" text DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_score_history" ALTER COLUMN "brand_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "branding" SET DEFAULT '{"themeId":"apexgeo-default","primaryColor":"#00E5CC","accentColor":"#8B5CF6","logoUrl":null,"logoDarkUrl":null,"faviconUrl":null,"appName":null,"tagline":null,"customDomain":null,"supportEmail":null,"showPoweredBy":true,"customFooterText":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ALTER COLUMN "recommendation_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "clerk_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "platform_scores" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "locations" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "personnel" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "is_benchmark" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "benchmark_tier" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "last_enriched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "indexed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "indexing_errors" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "visits" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "last_modified" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_status" "subscription_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "payfast_token" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "payfast_payment_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "platform_relevance" jsonb;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "schema_code" text;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "expected_score_impact" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "platform_tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "estimated_impact_low" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "estimated_impact_high" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "impact_source" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_user_id" text;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_triggered_by_id_users_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_channels" ADD CONSTRAINT "alert_channels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_channels" ADD CONSTRAINT "alert_channels_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_channel_id_alert_channels_id_fk" FOREIGN KEY ("alert_channel_id") REFERENCES "public"."alert_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_crawls" ADD CONSTRAINT "bot_crawls_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_samples" ADD CONSTRAINT "brand_voice_samples_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_samples" ADD CONSTRAINT "brand_voice_samples_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_conversions" ADD CONSTRAINT "citation_conversions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_conversions" ADD CONSTRAINT "citation_conversions_mention_id_brand_mentions_id_fk" FOREIGN KEY ("mention_id") REFERENCES "public"."brand_mentions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_records" ADD CONSTRAINT "citation_records_insight_id_platform_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."platform_insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_records" ADD CONSTRAINT "citation_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_roi_reports" ADD CONSTRAINT "citation_roi_reports_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_tracking_links" ADD CONSTRAINT "citation_tracking_links_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_scores" ADD CONSTRAINT "competitor_scores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_versions" ADD CONSTRAINT "dashboard_versions_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_versions" ADD CONSTRAINT "dashboard_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "improvement_roadmaps" ADD CONSTRAINT "improvement_roadmaps_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_analytics_events" ADD CONSTRAINT "marketing_analytics_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_analytics_events" ADD CONSTRAINT "marketing_analytics_events_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_analytics_events" ADD CONSTRAINT "marketing_analytics_events_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_automation_logs" ADD CONSTRAINT "marketing_automation_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_automation_logs" ADD CONSTRAINT "marketing_automation_logs_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_automation_logs" ADD CONSTRAINT "marketing_automation_logs_sequence_id_marketing_email_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."marketing_email_sequences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_events" ADD CONSTRAINT "marketing_email_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_events" ADD CONSTRAINT "marketing_email_events_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_events" ADD CONSTRAINT "marketing_email_events_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_events" ADD CONSTRAINT "marketing_email_events_list_id_marketing_email_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."marketing_email_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_lists" ADD CONSTRAINT "marketing_email_lists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_sequences" ADD CONSTRAINT "marketing_email_sequences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_social_posts" ADD CONSTRAINT "marketing_social_posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_social_posts" ADD CONSTRAINT "marketing_social_posts_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_query_id_platform_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."platform_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_integrations" ADD CONSTRAINT "platform_integrations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_integrations" ADD CONSTRAINT "platform_integrations_platform_id_platform_registry_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_queries" ADD CONSTRAINT "platform_queries_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_queries" ADD CONSTRAINT "platform_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_query_results" ADD CONSTRAINT "platform_query_results_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_query_results" ADD CONSTRAINT "platform_query_results_integration_id_platform_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."platform_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_lift" ADD CONSTRAINT "recommendation_lift_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_lift" ADD CONSTRAINT "recommendation_lift_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_lift" ADD CONSTRAINT "recommendation_lift_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_roadmap_id_improvement_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."improvement_roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_progress_snapshots" ADD CONSTRAINT "roadmap_progress_snapshots_roadmap_id_improvement_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."improvement_roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_client_organization_id_organizations_id_fk" FOREIGN KEY ("client_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zapier_subscriptions" ADD CONSTRAINT "zapier_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_runs_org_created_idx" ON "agent_runs" USING btree ("organization_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "agent_runs_brand_status_idx" ON "agent_runs" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "bot_crawls_brand_occurred_idx" ON "bot_crawls" USING btree ("brand_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "bot_crawls_brand_crawler_path_idx" ON "bot_crawls" USING btree ("brand_id","crawler","path");--> statement-breakpoint
CREATE INDEX "brand_voice_samples_brand_created_idx" ON "brand_voice_samples" USING btree ("brand_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "cs_brand_competitor_idx" ON "competitor_scores" USING btree ("brand_id","competitor_name");--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_versions_dashboard_number_idx" ON "dashboard_versions" USING btree ("dashboard_id","version_number");--> statement-breakpoint
CREATE INDEX "dashboard_versions_dashboard_created_idx" ON "dashboard_versions" USING btree ("dashboard_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "dashboards_org_slug_idx" ON "dashboards" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "idx_analytics_org" ON "marketing_analytics_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_campaign" ON "marketing_analytics_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_lead" ON "marketing_analytics_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_event_type" ON "marketing_analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_session" ON "marketing_analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_timestamp" ON "marketing_analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_automation_org" ON "marketing_automation_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_automation_lead" ON "marketing_automation_logs" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_automation_sequence" ON "marketing_automation_logs" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_org" ON "marketing_campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_status" ON "marketing_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaign_type" ON "marketing_campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_email_event_org" ON "marketing_email_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_email_event_lead" ON "marketing_email_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_email_event_campaign" ON "marketing_email_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_email_event_type" ON "marketing_email_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "idx_email_event_timestamp" ON "marketing_email_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_email_list_org" ON "marketing_email_lists" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_email_list_name" ON "marketing_email_lists" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_sequence_org" ON "marketing_email_sequences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sequence_template" ON "marketing_email_sequences" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "idx_lead_org" ON "marketing_leads" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_lead_email" ON "marketing_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_lead_status" ON "marketing_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lead_score" ON "marketing_leads" USING btree ("lead_score");--> statement-breakpoint
CREATE INDEX "idx_metrics_org" ON "marketing_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_metrics_campaign" ON "marketing_metrics" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_metrics_date" ON "marketing_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_social_post_org" ON "marketing_social_posts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_social_post_status" ON "marketing_social_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_social_post_published" ON "marketing_social_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_social_post_scheduled" ON "marketing_social_posts" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "model_metadata_version_idx" ON "model_metadata" USING btree ("model_version");--> statement-breakpoint
CREATE INDEX "model_metadata_status_idx" ON "model_metadata" USING btree ("status");--> statement-breakpoint
CREATE INDEX "model_metadata_latest_idx" ON "model_metadata" USING btree ("is_latest");--> statement-breakpoint
CREATE INDEX "predictions_brand_id_idx" ON "predictions" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "predictions_target_date_idx" ON "predictions" USING btree ("target_date");--> statement-breakpoint
CREATE INDEX "predictions_brand_target_idx" ON "predictions" USING btree ("brand_id","target_date");--> statement-breakpoint
CREATE INDEX "predictions_status_idx" ON "predictions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "predictive_alerts_brand_idx" ON "predictive_alerts" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "predictive_alerts_user_idx" ON "predictive_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "predictive_alerts_type_idx" ON "predictive_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "predictive_alerts_severity_idx" ON "predictive_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "predictive_alerts_unread_idx" ON "predictive_alerts" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "rec_lift_org_completed_idx" ON "recommendation_lift" USING btree ("organization_id","completed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "rec_lift_brand_window_idx" ON "recommendation_lift" USING btree ("brand_id","window_days");--> statement-breakpoint
CREATE UNIQUE INDEX "rps_roadmap_date_idx" ON "roadmap_progress_snapshots" USING btree ("roadmap_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "usage_events_org_kind_occurred_idx" ON "usage_events" USING btree ("organization_id","kind","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "usage_events_client_occurred_idx" ON "usage_events" USING btree ("client_organization_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "usage_events_idempotency_idx" ON "usage_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "zapier_sub_org_event_idx" ON "zapier_subscriptions" USING btree ("organization_id","event");--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audits_brand_created_idx" ON "audits" USING btree ("brand_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audits_status_idx" ON "audits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "brand_mentions_brand_timestamp_idx" ON "brand_mentions" USING btree ("brand_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "brand_mentions_brand_platform_idx" ON "brand_mentions" USING btree ("brand_id","platform");--> statement-breakpoint
CREATE INDEX "brand_mentions_sentiment_idx" ON "brand_mentions" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "brand_mentions_created_at_idx" ON "brand_mentions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "brands_org_active_idx" ON "brands" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "brands_domain_idx" ON "brands" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "brands_benchmark_idx" ON "brands" USING btree ("is_benchmark");--> statement-breakpoint
CREATE UNIQUE INDEX "sov_brand_date_platform_idx" ON "share_of_voice" USING btree ("brand_id","date","platform");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id");