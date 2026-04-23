CREATE TYPE "public"."engagement_autonomy_mode" AS ENUM('drafted', 'autonomous', 'off');--> statement-breakpoint
CREATE TYPE "public"."engagement_draft_status" AS ENUM('pending', 'approved', 'rejected', 'posted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."engagement_kind" AS ENUM('reply', 'comment', 'answer', 'quote');--> statement-breakpoint
CREATE TABLE "social_engagement_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"kind" "engagement_kind" NOT NULL,
	"target_url" text NOT NULL,
	"source_ref" text,
	"draft_text" text NOT NULL,
	"generation_context" jsonb DEFAULT '{}'::jsonb,
	"status" "engagement_draft_status" DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"post_url" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_engagement_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"autonomy_mode" "engagement_autonomy_mode" DEFAULT 'drafted' NOT NULL,
	"autonomous_daily_cap" text,
	"topic_allowlist" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_engagement_drafts" ADD CONSTRAINT "social_engagement_drafts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_engagement_drafts" ADD CONSTRAINT "social_engagement_drafts_credential_id_social_browser_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."social_browser_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_engagement_settings" ADD CONSTRAINT "social_engagement_settings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sed_brand_status_idx" ON "social_engagement_drafts" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "sed_credential_status_idx" ON "social_engagement_drafts" USING btree ("credential_id","status");--> statement-breakpoint
CREATE INDEX "sed_source_ref_idx" ON "social_engagement_drafts" USING btree ("platform","source_ref");--> statement-breakpoint
CREATE INDEX "ses_brand_platform_idx" ON "social_engagement_settings" USING btree ("brand_id","platform");