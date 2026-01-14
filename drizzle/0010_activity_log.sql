CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"brand_id" text NOT NULL,
	"user_id" text,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp with time zone NOT NULL DEFAULT now(),
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE no action ON UPDATE no action;
