CREATE TABLE "audit_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"audit_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by_id" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_shares" ADD CONSTRAINT "audit_shares_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_shares" ADD CONSTRAINT "audit_shares_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_shares" ADD CONSTRAINT "audit_shares_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_shares" ADD CONSTRAINT "audit_shares_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "audit_shares_token_idx" ON "audit_shares" USING btree ("token");--> statement-breakpoint
CREATE INDEX "audit_shares_audit_idx" ON "audit_shares" USING btree ("audit_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_shares_org_idx" ON "audit_shares" USING btree ("organization_id");