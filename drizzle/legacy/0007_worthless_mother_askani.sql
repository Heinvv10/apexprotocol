CREATE TYPE "public"."publishing_platform" AS ENUM('wordpress', 'medium');--> statement-breakpoint
CREATE TYPE "public"."publishing_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."api_key_type" ADD VALUE 'user';--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"geo_data" jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"platform" "publishing_platform" NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"qstash_schedule_id" text,
	"qstash_message_id" text,
	"platforms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "schedule_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishing_history" (
	"id" text PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"platform" "publishing_platform" NOT NULL,
	"external_id" text NOT NULL,
	"external_url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"status" "publishing_status" NOT NULL,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "last_rotated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "scopes" jsonb;--> statement-breakpoint
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_schedules" ADD CONSTRAINT "content_schedules_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_history" ADD CONSTRAINT "publishing_history_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_organization_id_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_org_type_active_idx" ON "api_keys" USING btree ("organization_id","type","is_active");