-- Indexes for hot tables identified in production-readiness audit.
-- Apply with: psql $DATABASE_URL -f drizzle/0015_add_hot_table_indexes.sql
-- Uses IF NOT EXISTS to be idempotent.

-- brand_mentions is the hottest read path (monitor dashboard, analytics).
CREATE INDEX IF NOT EXISTS brand_mentions_brand_timestamp_idx
  ON brand_mentions (brand_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS brand_mentions_brand_platform_idx
  ON brand_mentions (brand_id, platform);

CREATE INDEX IF NOT EXISTS brand_mentions_sentiment_idx
  ON brand_mentions (sentiment);

CREATE INDEX IF NOT EXISTS brand_mentions_created_at_idx
  ON brand_mentions (created_at DESC);

-- brands: per-org active listing is the common query.
CREATE INDEX IF NOT EXISTS brands_org_active_idx
  ON brands (organization_id, is_active);

CREATE INDEX IF NOT EXISTS brands_domain_idx
  ON brands (domain);

CREATE INDEX IF NOT EXISTS brands_benchmark_idx
  ON brands (is_benchmark);

-- audits: latest-per-brand and status filtering.
CREATE INDEX IF NOT EXISTS audits_brand_created_idx
  ON audits (brand_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audits_status_idx
  ON audits (status);
