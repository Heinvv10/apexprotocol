CREATE TYPE "public"."social_browser_action_status" AS ENUM('success', 'failure', 'aborted');--> statement-breakpoint
CREATE TYPE "public"."social_browser_action_type" AS ENUM('login', 'session_restore', 'post', 'thread', 'reply', 'quote', 'comment', 'navigate', 'screenshot', 'logout');--> statement-breakpoint
CREATE TYPE "public"."social_browser_credential_status" AS ENUM('active', 'flagged', 'disabled');--> statement-breakpoint
CREATE TABLE "social_browser_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"credential_id" text NOT NULL,
	"action_type" "social_browser_action_type" NOT NULL,
	"target_url" text,
	"status" "social_browser_action_status" NOT NULL,
	"error_message" text,
	"screenshot_ref" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_browser_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"username" text NOT NULL,
	"profile_url" text,
	"password_encrypted" jsonb NOT NULL,
	"totp_secret_encrypted" jsonb,
	"session_state_encrypted" jsonb,
	"session_expires_at" timestamp with time zone,
	"user_agent" text NOT NULL,
	"viewport_width" integer DEFAULT 1366 NOT NULL,
	"viewport_height" integer DEFAULT 768 NOT NULL,
	"status" "social_browser_credential_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp with time zone,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_browser_credentials_brand_id_platform_username_unique" UNIQUE("brand_id","platform","username")
);
--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "social_browser_actions" ADD CONSTRAINT "social_browser_actions_credential_id_social_browser_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."social_browser_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_browser_credentials" ADD CONSTRAINT "social_browser_credentials_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;