-- Create prediction enums
CREATE TYPE "entity_type" AS ENUM ('brand', 'keyword', 'topic', 'platform');
CREATE TYPE "prediction_status" AS ENUM ('active', 'stale', 'superseded');
CREATE TYPE "predictive_alert_type" AS ENUM ('predicted_drop', 'emerging_opportunity', 'trend_reversal');
CREATE TYPE "model_status" AS ENUM ('training', 'active', 'failed', 'retired');

-- Create predictions table
CREATE TABLE IF NOT EXISTS "predictions" (
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

-- Create model_metadata table
CREATE TABLE IF NOT EXISTS "model_metadata" (
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

-- Create predictive_alerts table
CREATE TABLE IF NOT EXISTS "predictive_alerts" (
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

-- Add foreign keys
DO $$ BEGIN
 ALTER TABLE "predictions" ADD CONSTRAINT "predictions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "predictions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for predictions
CREATE INDEX IF NOT EXISTS "predictions_brand_id_idx" ON "predictions" ("brand_id");
CREATE INDEX IF NOT EXISTS "predictions_target_date_idx" ON "predictions" ("target_date");
CREATE INDEX IF NOT EXISTS "predictions_brand_target_idx" ON "predictions" ("brand_id","target_date");
CREATE INDEX IF NOT EXISTS "predictions_status_idx" ON "predictions" ("status");

-- Create indexes for model_metadata
CREATE INDEX IF NOT EXISTS "model_metadata_version_idx" ON "model_metadata" ("model_version");
CREATE INDEX IF NOT EXISTS "model_metadata_status_idx" ON "model_metadata" ("status");
CREATE INDEX IF NOT EXISTS "model_metadata_latest_idx" ON "model_metadata" ("is_latest");

-- Create indexes for predictive_alerts
CREATE INDEX IF NOT EXISTS "predictive_alerts_brand_idx" ON "predictive_alerts" ("brand_id");
CREATE INDEX IF NOT EXISTS "predictive_alerts_user_idx" ON "predictive_alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "predictive_alerts_type_idx" ON "predictive_alerts" ("alert_type");
CREATE INDEX IF NOT EXISTS "predictive_alerts_severity_idx" ON "predictive_alerts" ("severity");
CREATE INDEX IF NOT EXISTS "predictive_alerts_unread_idx" ON "predictive_alerts" ("user_id","is_read");
