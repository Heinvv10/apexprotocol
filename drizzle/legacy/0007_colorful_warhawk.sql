CREATE TYPE "public"."alert_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."predictive_alert_type" AS ENUM('predicted_drop', 'emerging_opportunity', 'trend_reversal');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('brand', 'keyword', 'topic', 'platform');--> statement-breakpoint
CREATE TYPE "public"."model_status" AS ENUM('training', 'active', 'failed', 'retired');--> statement-breakpoint
CREATE TYPE "public"."prediction_status" AS ENUM('active', 'stale', 'superseded');--> statement-breakpoint
ALTER TYPE "public"."api_key_type" ADD VALUE 'user';--> statement-breakpoint
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
ALTER TABLE "api_keys" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "last_rotated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "scopes" jsonb;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_organization_id_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_org_type_active_idx" ON "api_keys" USING btree ("organization_id","type","is_active");