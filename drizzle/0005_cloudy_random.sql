ALTER TABLE "recommendations" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "baseline_score" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "post_implementation_score" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "score_improvement" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "effectiveness_score" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "user_rating" integer;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "user_feedback" text;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "feedback_at" timestamp with time zone;