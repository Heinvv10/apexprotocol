CREATE TYPE "public"."integration_category" AS ENUM('ai_models', 'search_apis', 'analytics');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('configured', 'not_configured', 'disabled', 'error');--> statement-breakpoint
CREATE TABLE "api_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"service_name" text NOT NULL,
	"provider" text NOT NULL,
	"description" text,
	"category" "integration_category" NOT NULL,
	"status" "integration_status" DEFAULT 'not_configured' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL,
	"last_verified" timestamp with time zone,
	"last_error" text,
	"usage_this_month" integer DEFAULT 0,
	"quota_remaining" integer,
	"rate_limit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "api_integrations" ADD CONSTRAINT "api_integrations_created_by_users_clerk_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("clerk_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_integrations" ADD CONSTRAINT "api_integrations_updated_by_users_clerk_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("clerk_user_id") ON DELETE no action ON UPDATE no action;