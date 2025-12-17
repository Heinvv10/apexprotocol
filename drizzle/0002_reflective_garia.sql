CREATE TYPE "public"."connection_status" AS ENUM('active', 'expired', 'revoked', 'error', 'pending');--> statement-breakpoint
CREATE TYPE "public"."discovery_method" AS ENUM('keyword_overlap', 'ai_co_occurrence', 'industry_match', 'search_overlap', 'manual');--> statement-breakpoint
CREATE TYPE "public"."discovery_status" AS ENUM('pending', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."enrichment_source" AS ENUM('linkedin_public', 'clearbit', 'apollo', 'manual', 'website_scrape');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('conference', 'webinar', 'podcast', 'panel', 'workshop', 'meetup', 'summit');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('headquarters', 'branch', 'store', 'office', 'warehouse', 'factory', 'distribution_center');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('open', 'applied', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('google', 'yelp', 'facebook', 'trustpilot', 'manual');--> statement-breakpoint
CREATE TYPE "public"."scan_job_priority" AS ENUM('high', 'normal', 'low');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('pending', 'scanning', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."social_post_type" AS ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'live', 'poll', 'thread', 'article');--> statement-breakpoint
CREATE TYPE "public"."sync_job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."sync_job_type" AS ENUM('metrics', 'mentions', 'followers', 'posts', 'profile', 'full_sync');--> statement-breakpoint
CREATE TABLE "api_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" "social_platform" NOT NULL,
	"endpoint" text NOT NULL,
	"requests_made" integer DEFAULT 0,
	"requests_limit" integer NOT NULL,
	"window_start_at" timestamp with time zone DEFAULT now(),
	"window_duration_seconds" integer DEFAULT 900,
	"reset_at" timestamp with time zone,
	"consecutive_errors" integer DEFAULT 0,
	"backoff_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_rate_limits_platform_endpoint_unique" UNIQUE("platform","endpoint")
);
--> statement-breakpoint
CREATE TABLE "brand_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"place_id" text,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"latitude" real,
	"longitude" real,
	"location_type" "location_type" DEFAULT 'headquarters',
	"is_primary" boolean DEFAULT false,
	"phone" text,
	"website" text,
	"email" text,
	"rating" real,
	"review_count" integer DEFAULT 0,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"opening_hours" jsonb,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"price_level" integer,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_locations_place_id_unique" UNIQUE("place_id")
);
--> statement-breakpoint
CREATE TABLE "brand_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"source" "review_source" DEFAULT 'google',
	"external_id" text,
	"author_name" text,
	"author_photo_url" text,
	"author_profile_url" text,
	"rating" integer NOT NULL,
	"text" text,
	"language" text DEFAULT 'en',
	"sentiment" "sentiment",
	"sentiment_score" real,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"owner_response" text,
	"owner_responded_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"competitor_name" text NOT NULL,
	"competitor_domain" text NOT NULL,
	"snapshot_date" date NOT NULL,
	"geo_score" integer,
	"ai_mention_count" integer,
	"avg_mention_position" real,
	"sentiment_score" real,
	"social_followers" integer,
	"social_engagement_rate" real,
	"content_page_count" integer,
	"blog_post_count" integer,
	"last_content_published" timestamp with time zone,
	"schema_types" jsonb DEFAULT '[]'::jsonb,
	"structured_data_score" integer,
	"platform_breakdown" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovered_competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"competitor_name" text NOT NULL,
	"competitor_domain" text,
	"discovery_method" "discovery_method" NOT NULL,
	"confidence_score" real NOT NULL,
	"keyword_overlap" real,
	"ai_co_occurrence" real,
	"industry_match" boolean DEFAULT false,
	"shared_keywords" jsonb DEFAULT '[]'::jsonb,
	"co_occurrence_queries" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "discovery_status" DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"overall_score" integer DEFAULT 0,
	"rating_score" integer DEFAULT 0,
	"review_volume_score" integer DEFAULT 0,
	"sentiment_score" integer DEFAULT 0,
	"response_score" integer DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"positive_reviews" integer DEFAULT 0,
	"neutral_reviews" integer DEFAULT 0,
	"negative_reviews" integer DEFAULT 0,
	"top_positive_keywords" jsonb DEFAULT '[]'::jsonb,
	"top_negative_keywords" jsonb DEFAULT '[]'::jsonb,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"opportunity_id" text NOT NULL,
	"match_score" real,
	"match_reasons" jsonb DEFAULT '[]'::jsonb,
	"matched_topics" jsonb DEFAULT '[]'::jsonb,
	"matched_skills" jsonb DEFAULT '[]'::jsonb,
	"status" "opportunity_status" DEFAULT 'open',
	"user_notes" text,
	"applied_at" timestamp with time zone,
	"response_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunity_matches_person_id_opportunity_id_unique" UNIQUE("person_id","opportunity_id")
);
--> statement-breakpoint
CREATE TABLE "people_enrichment" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"linkedin_headline" text,
	"linkedin_about" text,
	"linkedin_profile_url" text,
	"linkedin_public_id" text,
	"current_position" text,
	"current_company" text,
	"current_company_linkedin_url" text,
	"past_positions" jsonb DEFAULT '[]'::jsonb,
	"total_years_experience" integer,
	"education" jsonb DEFAULT '[]'::jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"top_skills" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"influence_score" real,
	"linkedin_connection_count" integer,
	"linkedin_post_count" integer,
	"linkedin_engagement_rate" real,
	"linkedin_article_count" integer,
	"conference_appearances" jsonb DEFAULT '[]'::jsonb,
	"publications" jsonb DEFAULT '[]'::jsonb,
	"podcast_appearances" jsonb DEFAULT '[]'::jsonb,
	"awards" jsonb DEFAULT '[]'::jsonb,
	"volunteer_experience" jsonb DEFAULT '[]'::jsonb,
	"enrichment_source" "enrichment_source",
	"enrichment_confidence" real,
	"raw_enrichment_data" jsonb,
	"last_enriched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_enrichment_person_id_unique" UNIQUE("person_id")
);
--> statement-breakpoint
CREATE TABLE "scan_job_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"handles" jsonb DEFAULT '{}'::jsonb,
	"status" "sync_job_status" DEFAULT 'pending',
	"priority" "scan_job_priority" DEFAULT 'normal',
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"completed_platforms" jsonb DEFAULT '[]'::jsonb,
	"failed_platforms" jsonb DEFAULT '{}'::jsonb,
	"scheduled_for" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_scan_results" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"platform_account_id" text,
	"target_handle" text NOT NULL,
	"profile_data" jsonb,
	"posts_data" jsonb,
	"mentions_data" jsonb,
	"follower_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"engagement_rate" real DEFAULT 0,
	"avg_likes" integer DEFAULT 0,
	"avg_comments" integer DEFAULT 0,
	"avg_shares" integer DEFAULT 0,
	"avg_views" integer DEFAULT 0,
	"post_frequency" real DEFAULT 0,
	"mentions_count" integer DEFAULT 0,
	"sentiment_positive" integer DEFAULT 0,
	"sentiment_neutral" integer DEFAULT 0,
	"sentiment_negative" integer DEFAULT 0,
	"scan_status" "scan_status" DEFAULT 'pending',
	"error_code" text,
	"error_message" text,
	"scanned_at" timestamp with time zone,
	"next_scan_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_scan_results_brand_id_platform_target_handle_unique" UNIQUE("brand_id","platform","target_handle")
);
--> statement-breakpoint
CREATE TABLE "social_oauth_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" text DEFAULT 'Bearer',
	"expires_at" timestamp with time zone,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"account_id" text,
	"account_name" text,
	"account_handle" text,
	"profile_url" text,
	"avatar_url" text,
	"connection_status" "connection_status" DEFAULT 'active',
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_oauth_tokens_brand_id_platform_account_id_unique" UNIQUE("brand_id","platform","account_id")
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"social_account_id" text,
	"platform" "social_platform" NOT NULL,
	"platform_post_id" text NOT NULL,
	"content" text,
	"post_type" "social_post_type",
	"post_url" text,
	"published_at" timestamp with time zone,
	"is_published" boolean DEFAULT true,
	"scheduled_at" timestamp with time zone,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"shares_count" integer DEFAULT 0,
	"saves_count" integer DEFAULT 0,
	"impressions_count" integer DEFAULT 0,
	"reach_count" integer DEFAULT 0,
	"engagement_rate" real,
	"sentiment_score" real,
	"hashtags" jsonb DEFAULT '[]'::jsonb,
	"mentions" jsonb DEFAULT '[]'::jsonb,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_posts_brand_id_platform_platform_post_id_unique" UNIQUE("brand_id","platform","platform_post_id")
);
--> statement-breakpoint
CREATE TABLE "social_sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"social_account_id" text,
	"platform" "social_platform" NOT NULL,
	"job_type" "sync_job_type" NOT NULL,
	"status" "sync_job_status" DEFAULT 'pending',
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"records_processed" integer DEFAULT 0,
	"records_total" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"next_retry_at" timestamp with time zone,
	"job_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"organizer" text,
	"organizer_url" text,
	"event_type" "event_type" NOT NULL,
	"event_date" timestamp with time zone,
	"event_end_date" timestamp with time zone,
	"location" text,
	"is_virtual" boolean DEFAULT false,
	"venue" text,
	"cfp_url" text,
	"cfp_deadline" timestamp with time zone,
	"application_url" text,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"target_audience" text,
	"expected_audience_size" integer,
	"is_paid" boolean DEFAULT false,
	"compensation_details" text,
	"covers_travel_expenses" boolean DEFAULT false,
	"requirements" text,
	"speaker_benefits" jsonb DEFAULT '[]'::jsonb,
	"source_url" text,
	"source_type" text,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "super_admin_granted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "super_admin_granted_by" text;--> statement-breakpoint
ALTER TABLE "brand_locations" ADD CONSTRAINT "brand_locations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_reviews" ADD CONSTRAINT "brand_reviews_location_id_brand_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."brand_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_reviews" ADD CONSTRAINT "brand_reviews_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_snapshots" ADD CONSTRAINT "competitor_snapshots_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovered_competitors" ADD CONSTRAINT "discovered_competitors_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_scores" ADD CONSTRAINT "location_scores_location_id_brand_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."brand_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_scores" ADD CONSTRAINT "location_scores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_person_id_brand_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."brand_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_opportunity_id_speaking_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."speaking_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_enrichment" ADD CONSTRAINT "people_enrichment_person_id_brand_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."brand_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_job_queue" ADD CONSTRAINT "scan_job_queue_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_scan_results" ADD CONSTRAINT "service_scan_results_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_oauth_tokens" ADD CONSTRAINT "social_oauth_tokens_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_sync_jobs" ADD CONSTRAINT "social_sync_jobs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_sync_jobs" ADD CONSTRAINT "social_sync_jobs_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;