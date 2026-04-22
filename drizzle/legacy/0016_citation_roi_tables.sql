-- Citation ROI tables — unblocks Phase 15 feature after Drizzle schema
-- was added in src/lib/db/schema/citation-roi.ts but no migration was
-- generated. drizzle-kit generate needs an interactive prompt to
-- resolve enum-name conflicts across the 15 prior migrations, so this
-- migration was hand-written against the schema.

CREATE TYPE "conversion_type" AS ENUM (
  'signup',
  'purchase',
  'contact',
  'download',
  'demo_request',
  'newsletter',
  'free_trial',
  'custom'
);

CREATE TYPE "attribution_model" AS ENUM (
  'first_touch',
  'last_touch',
  'linear',
  'time_decay',
  'position_based'
);

CREATE TABLE IF NOT EXISTS "citation_conversions" (
  "id" text PRIMARY KEY NOT NULL,
  "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
  "mention_id" text REFERENCES "brand_mentions"("id") ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS "citation_conversions_brand_id_idx" ON "citation_conversions"("brand_id");
CREATE INDEX IF NOT EXISTS "citation_conversions_converted_at_idx" ON "citation_conversions"("converted_at");
CREATE INDEX IF NOT EXISTS "citation_conversions_source_platform_idx" ON "citation_conversions"("source_platform");

CREATE TABLE IF NOT EXISTS "citation_tracking_links" (
  "id" text PRIMARY KEY NOT NULL,
  "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
  "original_url" text NOT NULL,
  "tracking_url" text NOT NULL,
  "short_code" text UNIQUE,
  "utm_params" jsonb DEFAULT '{}'::jsonb,
  "clicks" integer DEFAULT 0,
  "conversions" integer DEFAULT 0,
  "campaign_name" text,
  "target_platform" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "citation_tracking_links_brand_id_idx" ON "citation_tracking_links"("brand_id");
CREATE INDEX IF NOT EXISTS "citation_tracking_links_short_code_idx" ON "citation_tracking_links"("short_code");
