-- Notification system migration (notifications only, no other table modifications)
-- Generated from 0006_faulty_jasper_sitwell.sql

-- Create enums
CREATE TYPE "public"."email_digest_frequency" AS ENUM('none', 'daily', 'weekly');
CREATE TYPE "public"."notification_type" AS ENUM('mention', 'score_change', 'recommendation', 'important');

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"email_digest_frequency" "email_digest_frequency" DEFAULT 'none' NOT NULL,
	"email_address" text,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"mention_notifications" boolean DEFAULT true NOT NULL,
	"score_change_notifications" boolean DEFAULT true NOT NULL,
	"recommendation_notifications" boolean DEFAULT true NOT NULL,
	"important_notifications" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"digest_hour" integer DEFAULT 9 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);

-- Create notification_reads table
CREATE TABLE IF NOT EXISTS "notification_reads" (
	"id" text PRIMARY KEY NOT NULL,
	"notification_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk"
  FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "notification_preferences_organization_id_idx" ON "notification_preferences" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "notification_reads_notification_id_idx" ON "notification_reads" USING btree ("notification_id");
CREATE INDEX IF NOT EXISTS "notification_reads_user_id_idx" ON "notification_reads" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_organization_id_idx" ON "notifications" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");
