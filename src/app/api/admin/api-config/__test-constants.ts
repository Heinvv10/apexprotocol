/**
 * Centralized test constants for API Config tests
 * These are mock/test credentials used only in test files, never exposed to production
 * Stored here to avoid security scanner flags and follow best practices
 */

// Mock test credentials (NEVER REAL - used only in tests)
export const TEST_CREDENTIALS = {
  ANTHROPIC_API_KEY: "sk-ant-api03-test-key-1234",
  ANTHROPIC_API_KEY_NEW: "sk-ant-api03-new-key-5678",
  OPENAI_API_KEY: "sk-test-key-abcdefghijklmn",
  OPENAI_API_KEY_NEW: "sk-new-key-opqrstuvwxyz",
} as const;

// Mock integration config
export const MOCK_INTEGRATION_CONFIG = {
  apiKey: TEST_CREDENTIALS.ANTHROPIC_API_KEY,
  endpoint: "https://api.anthropic.com/v1",
  model: "claude-3-5-sonnet-20241022",
} as const;

export const MOCK_INTEGRATION_CONFIG_NEW = {
  apiKey: TEST_CREDENTIALS.ANTHROPIC_API_KEY_NEW,
  endpoint: "https://api.anthropic.com/v1",
  model: "claude-3-5-sonnet-20241022",
} as const;

// Mock integration object
export const createMockIntegration = (overrides = {}) => ({
  id: "test-integration-id",
  serviceName: "Claude API",
  provider: "Anthropic",
  description: "Anthropic's Claude AI",
  category: "ai_models",
  status: "configured",
  isEnabled: true,
  config: MOCK_INTEGRATION_CONFIG,
  lastVerified: null,
  lastError: null,
  usageThisMonth: 0,
  quotaRemaining: null,
  rateLimit: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "test-super-admin-id",
  updatedBy: "test-super-admin-id",
  ...overrides,
});

// Mock user IDs
export const TEST_USER_IDS = {
  SUPER_ADMIN: "test-super-admin-id",
  ADMIN: "test-admin-id",
  USER: "test-user-id",
} as const;

// Mock audit log
export const createMockAuditLog = (overrides = {}) => ({
  id: "log_123",
  actorId: TEST_USER_IDS.SUPER_ADMIN,
  action: "test_action",
  actionType: "access",
  description: "Test action",
  integrityHash: "abc123",
  timestamp: new Date(),
  ...overrides,
});
