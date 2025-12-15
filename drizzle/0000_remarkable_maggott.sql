CREATE TYPE "public"."ai_platform" AS ENUM('chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot');--> statement-breakpoint
CREATE TYPE "public"."api_key_type" AS ENUM('anthropic', 'openai', 'serper', 'pinecone', 'custom');--> statement-breakpoint
CREATE TYPE "public"."audit_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'approved', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('blog_post', 'social_post', 'product_description', 'faq', 'landing_page', 'email', 'ad_copy', 'press_release');--> statement-breakpoint
CREATE TYPE "public"."effort" AS ENUM('quick_win', 'moderate', 'major');--> statement-breakpoint
CREATE TYPE "public"."impact" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."recommendation_category" AS ENUM('technical_seo', 'content_optimization', 'schema_markup', 'citation_building', 'brand_consistency', 'competitor_analysis', 'content_freshness', 'authority_building');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('pending', 'in_progress', 'completed', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."schedule_type" AS ENUM('once', 'hourly', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('audit', 'monitoring', 'content', 'manual');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"operation" text NOT NULL,
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"cost" text DEFAULT '0',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "api_key_type" NOT NULL,
	"encrypted_key" text NOT NULL,
	"key_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"triggered_by_id" text,
	"url" text NOT NULL,
	"status" "audit_status" DEFAULT 'pending' NOT NULL,
	"overall_score" integer,
	"category_scores" jsonb DEFAULT '[]'::jsonb,
	"issues" jsonb DEFAULT '[]'::jsonb,
	"issue_count" integer DEFAULT 0,
	"critical_count" integer DEFAULT 0,
	"high_count" integer DEFAULT 0,
	"medium_count" integer DEFAULT 0,
	"low_count" integer DEFAULT 0,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "ai_platform" NOT NULL,
	"query" text NOT NULL,
	"response" text NOT NULL,
	"sentiment" "sentiment" DEFAULT 'neutral' NOT NULL,
	"position" integer,
	"citation_url" text,
	"competitors" jsonb DEFAULT '[]'::jsonb,
	"prompt_category" text,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"description" text,
	"industry" text,
	"logo_url" text,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"competitors" jsonb DEFAULT '[]'::jsonb,
	"voice" jsonb DEFAULT '{"tone":"professional","personality":[],"targetAudience":"","keyMessages":[],"avoidTopics":[]}'::jsonb,
	"visual" jsonb DEFAULT '{"primaryColor":null,"secondaryColor":null,"fontFamily":null}'::jsonb,
	"monitoring_enabled" boolean DEFAULT true NOT NULL,
	"monitoring_platforms" jsonb DEFAULT '["chatgpt","claude","gemini","perplexity","grok","deepseek","copilot"]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"author_id" text,
	"title" text NOT NULL,
	"type" "content_type" NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"ai_score" integer,
	"readability_score" integer,
	"seo_score" integer,
	"target_platform" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_id" text,
	"ai_metadata" jsonb DEFAULT '{}'::jsonb,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_jobs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"brand_id" varchar(128) NOT NULL,
	"org_id" varchar(128) NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"queries" jsonb DEFAULT '[]'::jsonb,
	"mentions_found" integer DEFAULT 0,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"clerk_org_id" text,
	"plan" "plan" DEFAULT 'starter' NOT NULL,
	"brand_limit" integer DEFAULT 1 NOT NULL,
	"user_limit" integer DEFAULT 3 NOT NULL,
	"branding" jsonb DEFAULT '{"primaryColor":"#4926FA","accentColor":"#D82F71","logoUrl":null,"faviconUrl":null,"appName":null,"customDomain":null}'::jsonb,
	"features" jsonb DEFAULT '[]'::jsonb,
	"settings" jsonb DEFAULT '{"timezone":"UTC","dateFormat":"MM/DD/YYYY","defaultLanguage":"en"}'::jsonb,
	"onboarding_status" jsonb DEFAULT '{"brandAdded":false,"monitoringConfigured":false,"auditRun":false,"recommendationsReviewed":false,"completedAt":null,"dismissedAt":null}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"audit_id" text,
	"assigned_to_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "recommendation_category" NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "recommendation_status" DEFAULT 'pending' NOT NULL,
	"effort" "effort" DEFAULT 'moderate' NOT NULL,
	"impact" "impact" DEFAULT 'medium' NOT NULL,
	"estimated_time" text,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"related_mention_id" text,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_jobs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"schedule_type" "schedule_type" NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"brand_id" varchar(128) NOT NULL,
	"org_id" varchar(128) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"organization_id" text,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"preferences" jsonb DEFAULT '{"theme":"dark","emailNotifications":true,"pushNotifications":true,"weeklyDigest":true,"mentionAlerts":true,"auditAlerts":true}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_triggered_by_id_users_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;