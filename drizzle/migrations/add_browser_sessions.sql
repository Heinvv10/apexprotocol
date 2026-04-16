-- Migration: Add Browser Session Tables for Perplexity & Browser-based Queries
-- Date: 2026-04-14
-- Description: Creates tables for managing persistent browser sessions,
--              query logs, and platform health monitoring for browser-based
--              platform queries (Perplexity, Claude Web, etc.)

-- ============================================================================
-- Browser Sessions Table
-- ============================================================================
-- Stores encrypted session data for browser-based platform queries.
-- Sessions are automatically cleaned up after expiration.

CREATE TABLE IF NOT EXISTS browser_sessions (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  suspension_reason TEXT,
  encrypted_data TEXT,
  metadata JSONB DEFAULT '{
    "userAgent": "",
    "viewport": {"width": 1366, "height": 768},
    "timezone": "UTC",
    "language": "en",
    "lastIpAddress": "",
    "requestCount": 0,
    "successCount": 0,
    "failureCount": 0
  }' NOT NULL,
  stats JSONB DEFAULT '{
    "totalQueries": 0,
    "successfulQueries": 0,
    "failedQueries": 0,
    "consecutiveFailures": 0,
    "averageResponseTimeMs": 0
  }' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Create index for faster session lookups
CREATE INDEX idx_browser_sessions_platform_user ON browser_sessions(platform_name, user_id)
WHERE status = 'active';

CREATE INDEX idx_browser_sessions_expires ON browser_sessions(expires_at);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(status);

-- ============================================================================
-- Browser Query Logs Table
-- ============================================================================
-- Stores historical records of browser queries for debugging and analytics.

CREATE TABLE IF NOT EXISTS browser_query_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand_id TEXT,
  platform_name TEXT NOT NULL,
  query TEXT NOT NULL,
  status TEXT NOT NULL,
  response TEXT,
  extracted_data JSONB DEFAULT '{}' NOT NULL,
  error_message TEXT,
  error_type TEXT,
  screenshot_path TEXT,
  metrics JSONB DEFAULT '{}' NOT NULL,
  response_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_browser_query_logs_session ON browser_query_logs(session_id);
CREATE INDEX idx_browser_query_logs_brand ON browser_query_logs(brand_id);
CREATE INDEX idx_browser_query_logs_platform ON browser_query_logs(platform_name);
CREATE INDEX idx_browser_query_logs_status ON browser_query_logs(status);
CREATE INDEX idx_browser_query_logs_executed ON browser_query_logs(executed_at DESC);

-- ============================================================================
-- Browser Platform Health Table
-- ============================================================================
-- Tracks platform health status, rate limits, and blocklists for monitoring.

CREATE TABLE IF NOT EXISTS browser_platform_health (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{
    "totalQueries": 0,
    "successfulQueries": 0,
    "failedQueries": 0,
    "captchaCount": 0,
    "rateLimitCount": 0,
    "averageResponseTimeMs": 0,
    "uptime": 100
  }' NOT NULL,
  rate_limit_status JSONB DEFAULT '{"limited": false}' NOT NULL,
  blocked_identifiers JSONB DEFAULT '[]' NOT NULL,
  config JSONB DEFAULT '{}' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_browser_platform_health_status ON browser_platform_health(status);
CREATE INDEX idx_browser_platform_health_updated ON browser_platform_health(updated_at DESC);

-- ============================================================================
-- Utility: Session Cleanup Function
-- ============================================================================
-- PostgreSQL function to clean up expired sessions.
-- Can be called manually or via pg_cron for automatic cleanup.

CREATE OR REPLACE FUNCTION cleanup_expired_browser_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM browser_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Data Consistency: Foreign Key Considerations
-- ============================================================================
-- Note: browser_sessions.user_id references auth system users
-- Note: browser_query_logs.session_id should be cleaned with browser_sessions
-- Note: browser_query_logs.brand_id optionally references brands table

-- Optional: Add explicit foreign key constraints if needed:
-- ALTER TABLE browser_query_logs
-- ADD CONSTRAINT fk_browser_query_logs_session
-- FOREIGN KEY (session_id) REFERENCES browser_sessions(id) ON DELETE CASCADE;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
-- Additional compound indexes for common query patterns

-- Find active sessions for a user on a platform
CREATE INDEX idx_browser_sessions_lookup
ON browser_sessions(platform_name, user_id, status, expires_at DESC)
WHERE status = 'active';

-- Find recent queries for a session
CREATE INDEX idx_browser_query_logs_recent
ON browser_query_logs(session_id, executed_at DESC);

-- Find failures for debugging
CREATE INDEX idx_browser_query_logs_failures
ON browser_query_logs(platform_name, status, executed_at DESC)
WHERE status IN ('failed', 'captcha', 'rate_limit');

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE browser_sessions IS
'Encrypted browser session storage for persistent platform queries (Perplexity, Claude Web, etc.)';

COMMENT ON TABLE browser_query_logs IS
'Historical logs of all browser queries for debugging, compliance, and analytics';

COMMENT ON TABLE browser_platform_health IS
'Platform health monitoring, rate limit tracking, and blocklist management';

COMMENT ON COLUMN browser_sessions.encrypted_data IS
'AES-256-GCM encrypted session data (cookies, localStorage, etc.)';

COMMENT ON COLUMN browser_query_logs.error_type IS
'Error classification: captcha, rate_limit, timeout, auth_failure, network_error, content_extraction, etc.';

COMMENT ON COLUMN browser_platform_health.status IS
'Health status: healthy, degraded, down, rate_limited, blocked';
