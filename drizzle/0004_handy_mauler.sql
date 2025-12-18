CREATE TYPE "public"."audit_action_type" AS ENUM('create', 'update', 'delete', 'access', 'security', 'system');--> statement-breakpoint
CREATE TYPE "public"."audit_status_type" AS ENUM('success', 'failure', 'warning');--> statement-breakpoint
CREATE TABLE "api_call_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"response_time" integer,
	"user_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_score_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"overall_score" real NOT NULL,
	"visibility_score" real NOT NULL,
	"sentiment_score" real NOT NULL,
	"recommendation_score" real NOT NULL,
	"competitor_gap_score" real,
	"platform_scores" jsonb,
	"previous_score" real,
	"score_change" real,
	"trend" text,
	"mention_count" integer,
	"positive_mentions" integer,
	"negative_mentions" integer,
	"neutral_mentions" integer,
	"recommendation_count" integer,
	"completed_recommendations" integer,
	"calculation_notes" text,
	"data_quality" real,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp
);
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"was_helpful" boolean NOT NULL,
	"comment" text,
	"actual_impact" real,
	"expected_impact" real,
	"implementation_notes" text,
	"time_to_implement" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" uuid,
	"size_bytes" integer NOT NULL,
	"storage_location" varchar(500),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"actor_email" text,
	"actor_role" text,
	"action" text NOT NULL,
	"action_type" "audit_action_type" NOT NULL,
	"description" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"target_name" text,
	"changes" jsonb,
	"metadata" jsonb,
	"status" "audit_status_type" DEFAULT 'success' NOT NULL,
	"error_message" text,
	"error_stack" text,
	"integrity_hash" text,
	"previous_log_hash" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_gamification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"current_xp" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"streaks" jsonb DEFAULT '{"currentDaily":0,"longestDaily":0,"currentWeekly":0,"longestWeekly":0,"lastLoginDate":"","lastWeekStartDate":""}'::jsonb,
	"stats" jsonb DEFAULT '{"totalAudits":0,"totalMentions":0,"totalContent":0,"totalRecommendations":0,"recommendationsCompleted":0,"brandsCreated":0,"reportsGenerated":0,"integrationsConnected":0,"teamMembersInvited":0,"crisesResolved":0,"geoScoreImprovements":0}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_gamification_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "geo_score_history" ADD CONSTRAINT "geo_score_history_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_actor_id_users_clerk_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;