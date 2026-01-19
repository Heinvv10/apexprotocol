-- Phase 10: Expanded AI Platform Coverage (Tier 1)
-- Platform Registry Migration

-- Create platform tier enum type
CREATE TYPE platform_tier AS ENUM ('tier_1', 'tier_2', 'tier_3', 'tier_4');

-- Create integration status enum type
CREATE TYPE integration_status AS ENUM ('not_configured', 'configured', 'active', 'inactive', 'error');

-- Platform registry table
-- Stores configuration for all AI platforms that can be monitored
CREATE TABLE platform_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  tier platform_tier NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  api_endpoint TEXT,
  auth_method TEXT NOT NULL DEFAULT 'api_key',
  credentials JSONB DEFAULT '{}',
  rate_limit JSONB DEFAULT '{"requestsPerMinute": 10, "requestsPerDay": 1000}',
  query_config JSONB DEFAULT '{}',
  response_config JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  health_check JSONB DEFAULT '{"enabled": true, "intervalMinutes": 60}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Platform integrations table
-- Tracks which platforms are enabled for each brand
CREATE TABLE platform_integrations (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL REFERENCES platform_registry(id) ON DELETE CASCADE,
  status integration_status NOT NULL DEFAULT 'not_configured',
  is_monitoring BOOLEAN NOT NULL DEFAULT FALSE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  stats JSONB DEFAULT '{"totalQueries": 0, "successfulQueries": 0, "failedQueries": 0, "averageResponseTimeMs": 0}',
  config_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, platform_id)
);

-- Platform query results table
-- Stores results from multi-platform queries
CREATE TABLE platform_query_results (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL REFERENCES platform_integrations(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  parsed_data JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{"visibility": 0, "position": null, "confidence": 0}',
  response_time_ms INTEGER,
  status TEXT NOT NULL,
  query_executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX platform_integrations_brand_id_idx ON platform_integrations(brand_id);
CREATE INDEX platform_integrations_platform_id_idx ON platform_integrations(platform_id);
CREATE INDEX platform_integrations_status_idx ON platform_integrations(status);
CREATE INDEX platform_query_results_brand_id_idx ON platform_query_results(brand_id);
CREATE INDEX platform_query_results_integration_id_idx ON platform_query_results(integration_id);
CREATE INDEX platform_query_results_expires_at_idx ON platform_query_results(expires_at);

-- Extend ai_platform enum to include new Tier 1 platforms
ALTER TYPE ai_platform ADD VALUE 'openai_search' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'bing_copilot' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'notebooklm' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'cohere' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'janus' BEFORE 'copilot';
