-- Migration: Row-Level Security Setup
-- Description: Enables RLS on all tenant-scoped tables for multi-tenant data isolation
-- Date: 2024-01-01

-- Enable RLS on users table
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_org_isolation ON users;
CREATE POLICY users_org_isolation ON users
  FOR ALL
  USING (
    organization_id IS NULL OR
    organization_id = current_setting('app.current_organization_id', true)::text
  );

-- Enable RLS on brands table
ALTER TABLE IF EXISTS brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brands_org_isolation ON brands;
CREATE POLICY brands_org_isolation ON brands
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

-- Enable RLS on mentions table
ALTER TABLE IF EXISTS mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mentions_org_isolation ON mentions;
CREATE POLICY mentions_org_isolation ON mentions
  FOR ALL
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Enable RLS on audits table
ALTER TABLE IF EXISTS audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audits_org_isolation ON audits;
CREATE POLICY audits_org_isolation ON audits
  FOR ALL
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Enable RLS on content table
ALTER TABLE IF EXISTS content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_org_isolation ON content;
CREATE POLICY content_org_isolation ON content
  FOR ALL
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Enable RLS on recommendations table
ALTER TABLE IF EXISTS recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recommendations_org_isolation ON recommendations;
CREATE POLICY recommendations_org_isolation ON recommendations
  FOR ALL
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Enable RLS on api_keys table
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_keys_org_isolation ON api_keys;
CREATE POLICY api_keys_org_isolation ON api_keys
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

-- Create indexes to support RLS policy checks
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_brands_organization_id ON brands(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);

-- Grant necessary permissions for app role
-- Note: These should be adjusted based on your Neon database role setup
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
