CREATE TYPE "public"."citation_type" AS ENUM('direct_quote', 'paraphrase', 'link', 'reference');--> statement-breakpoint
CREATE TABLE "citation_records" (
	"id" text PRIMARY KEY NOT NULL,
	"insight_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"citation_type" "citation_type" NOT NULL,
	"citation_text" text,
	"source_url" text,
	"source_title" text,
	"position" integer,
	"context" text,
	"content_type" text,
	"relevance_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"query_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text NOT NULL,
	"platform" "ai_platform" NOT NULL,
	"response_content" text NOT NULL,
	"visibility_score" integer,
	"citation_count" integer DEFAULT 0 NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"prominence_score" integer,
	"content_type_performance" jsonb DEFAULT '{}'::jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text NOT NULL,
	"query_text" text NOT NULL,
	"brand_context" text,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "citation_records" ADD CONSTRAINT "citation_records_insight_id_platform_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."platform_insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_records" ADD CONSTRAINT "citation_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_query_id_platform_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."platform_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_queries" ADD CONSTRAINT "platform_queries_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_queries" ADD CONSTRAINT "platform_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;