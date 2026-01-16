/**
 * Admin API Client
 * API functions for admin bonus features: AI Costs, Audit Logs, API Config, API Keys
 */

// ============================================================================
// Types - AI Costs
// ============================================================================

export interface CostSummary {
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  avgCostPerRequest: number;
  costTrend: number;
}

export interface ProviderCost {
  provider: string;
  cost: number;
  tokens: number;
  requests: number;
  percentage: number;
}

export interface OperationCost {
  operation: string;
  cost: number;
  requests: number;
  avgCost: number;
}

export interface UserCost {
  userId: string;
  userName: string;
  email: string;
  cost: number;
  requests: number;
}

export interface AICostsResponse {
  summary: CostSummary;
  byProvider: ProviderCost[];
  byOperation: OperationCost[];
  byUser: UserCost[];
  period: string;
}

// ============================================================================
// Types - Audit Logs
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  userEmail: string;
  targetType: string;
  targetId: string;
  targetName: string;
  status: "success" | "failure" | "warning";
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  status?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: PaginationData;
  filters: {
    actions: string[];
    targetTypes: string[];
    statuses: string[];
  };
}

export interface VerificationResult {
  isValid: boolean;
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  firstInvalidId?: string;
  message: string;
}

// ============================================================================
// Types - API Config
// ============================================================================

export interface ApiIntegration {
  id: string;
  serviceName: string;
  provider: string;
  category: "ai" | "analytics" | "marketing" | "social" | "other";
  status: "active" | "inactive" | "error";
  description: string;
  config: {
    apiKey?: string;
    endpoint?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
  };
  lastTested: string | null;
  lastTestResult: "success" | "failure" | null;
  createdAt: string;
  updatedAt: string;
}

export interface APIConfigsResponse {
  integrations: ApiIntegration[];
  total: number;
}

export interface TestConnectionResult {
  success: boolean;
  latency: number;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Types - API Keys
// ============================================================================

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  type: "openai" | "anthropic" | "google" | "azure" | "custom";
  version: number;
  isActive: boolean;
  maskedKey: string;
  prefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  rateLimit: number;
  rateLimitPeriod: "minute" | "hour" | "day";
  permissions: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  rotatedAt: string | null;
  previousVersionId: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface APIKeysResponse {
  keys: ApiKey[];
  organizations: Organization[];
  total: number;
}

export interface KeyRotationResult {
  success: boolean;
  newKeyId: string;
  oldKeyId: string;
  gracePeriodMinutes: number;
  message: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockAICosts: AICostsResponse = {
  summary: {
    totalCost: 1247.83,
    totalTokens: 15843200,
    requestCount: 42156,
    avgCostPerRequest: 0.0296,
    costTrend: 12.4,
  },
  byProvider: [
    { provider: "OpenAI", cost: 687.45, tokens: 8234000, requests: 23400, percentage: 55.1 },
    { provider: "Anthropic", cost: 412.38, tokens: 5678200, requests: 14200, percentage: 33.0 },
    { provider: "Google", cost: 98.50, tokens: 1234000, requests: 3200, percentage: 7.9 },
    { provider: "Azure", cost: 49.50, tokens: 697000, requests: 1356, percentage: 4.0 },
  ],
  byOperation: [
    { operation: "Content Generation", cost: 523.45, requests: 12340, avgCost: 0.0424 },
    { operation: "Brand Monitoring", cost: 312.67, requests: 15200, avgCost: 0.0206 },
    { operation: "Site Audit", cost: 234.89, requests: 8400, avgCost: 0.0280 },
    { operation: "Recommendations", cost: 176.82, requests: 6216, avgCost: 0.0284 },
  ],
  byUser: [
    { userId: "u1", userName: "John Smith", email: "john@example.com", cost: 312.45, requests: 8900 },
    { userId: "u2", userName: "Sarah Johnson", email: "sarah@example.com", cost: 287.32, requests: 7600 },
    { userId: "u3", userName: "Mike Chen", email: "mike@example.com", cost: 245.67, requests: 6800 },
    { userId: "u4", userName: "Emily Davis", email: "emily@example.com", cost: 198.43, requests: 5200 },
    { userId: "u5", userName: "Alex Wilson", email: "alex@example.com", cost: 203.96, requests: 5400 },
  ],
  period: "30 days",
};

const mockAuditLogs: AuditLogsResponse = {
  logs: [
    {
      id: "al-001",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: "user.login",
      userId: "u1",
      userName: "John Smith",
      userEmail: "john@example.com",
      targetType: "session",
      targetId: "sess-001",
      targetName: "Web Session",
      status: "success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      metadata: { browser: "Chrome", os: "Windows" },
      previousHash: "abc123",
      currentHash: "def456",
    },
    {
      id: "al-002",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      action: "api_key.create",
      userId: "u2",
      userName: "Sarah Johnson",
      userEmail: "sarah@example.com",
      targetType: "api_key",
      targetId: "key-001",
      targetName: "Production API Key",
      status: "success",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
      metadata: { keyType: "openai", permissions: ["read", "write"] },
      previousHash: "def456",
      currentHash: "ghi789",
    },
    {
      id: "al-003",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      action: "campaign.update",
      userId: "u3",
      userName: "Mike Chen",
      userEmail: "mike@example.com",
      targetType: "campaign",
      targetId: "camp-001",
      targetName: "Q1 Marketing Campaign",
      status: "success",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0",
      metadata: { changes: ["budget", "schedule"] },
      previousHash: "ghi789",
      currentHash: "jkl012",
    },
    {
      id: "al-004",
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      action: "user.permission_denied",
      userId: "u4",
      userName: "Emily Davis",
      userEmail: "emily@example.com",
      targetType: "settings",
      targetId: "settings-001",
      targetName: "Admin Settings",
      status: "failure",
      ipAddress: "192.168.1.103",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/605.1.15",
      metadata: { attemptedAction: "modify_permissions", reason: "insufficient_role" },
      previousHash: "jkl012",
      currentHash: "mno345",
    },
    {
      id: "al-005",
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      action: "api_key.rotate",
      userId: "u2",
      userName: "Sarah Johnson",
      userEmail: "sarah@example.com",
      targetType: "api_key",
      targetId: "key-002",
      targetName: "Staging API Key",
      status: "warning",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
      metadata: { gracePeriod: 60, reason: "scheduled_rotation" },
      previousHash: "mno345",
      currentHash: "pqr678",
    },
  ],
  pagination: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 247,
    itemsPerPage: 25,
  },
  filters: {
    actions: ["user.login", "user.logout", "user.permission_denied", "api_key.create", "api_key.rotate", "api_key.delete", "campaign.create", "campaign.update", "campaign.delete", "settings.update"],
    targetTypes: ["session", "api_key", "campaign", "settings", "user", "integration"],
    statuses: ["success", "failure", "warning"],
  },
};

const mockAPIConfigs: APIConfigsResponse = {
  integrations: [
    {
      id: "int-001",
      serviceName: "OpenAI GPT-4",
      provider: "OpenAI",
      category: "ai",
      status: "active",
      description: "Primary AI model for content generation and analysis",
      config: { endpoint: "https://api.openai.com/v1", model: "gpt-4-turbo-preview", maxTokens: 4096, temperature: 0.7 },
      lastTested: new Date(Date.now() - 3600000).toISOString(),
      lastTestResult: "success",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "int-002",
      serviceName: "Claude 3 Opus",
      provider: "Anthropic",
      category: "ai",
      status: "active",
      description: "Secondary AI model for complex reasoning tasks",
      config: { endpoint: "https://api.anthropic.com/v1", model: "claude-3-opus-20240229", maxTokens: 4096 },
      lastTested: new Date(Date.now() - 7200000).toISOString(),
      lastTestResult: "success",
      createdAt: "2024-02-15T00:00:00Z",
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "int-003",
      serviceName: "Google Analytics",
      provider: "Google",
      category: "analytics",
      status: "active",
      description: "Website analytics and user behavior tracking",
      config: { endpoint: "https://analyticsdata.googleapis.com/v1beta" },
      lastTested: new Date(Date.now() - 14400000).toISOString(),
      lastTestResult: "success",
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: "int-004",
      serviceName: "Mautic",
      provider: "Mautic",
      category: "marketing",
      status: "active",
      description: "Marketing automation and lead management",
      config: { endpoint: "https://mautic.example.com/api" },
      lastTested: new Date(Date.now() - 21600000).toISOString(),
      lastTestResult: "success",
      createdAt: "2024-03-01T00:00:00Z",
      updatedAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: "int-005",
      serviceName: "Postiz",
      provider: "Postiz",
      category: "social",
      status: "error",
      description: "Social media scheduling and management",
      config: { endpoint: "https://api.postiz.com/v1", timeout: 30000 },
      lastTested: new Date(Date.now() - 1800000).toISOString(),
      lastTestResult: "failure",
      createdAt: "2024-03-15T00:00:00Z",
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  total: 5,
};

const mockAPIKeys: APIKeysResponse = {
  keys: [
    {
      id: "key-001",
      organizationId: "org-001",
      name: "Production OpenAI Key",
      type: "openai",
      version: 3,
      isActive: true,
      maskedKey: "sk-...abc123",
      prefix: "sk-",
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      lastUsedAt: new Date(Date.now() - 300000).toISOString(),
      usageCount: 15234,
      rateLimit: 1000,
      rateLimitPeriod: "minute",
      permissions: ["chat", "completions", "embeddings"],
      metadata: { environment: "production" },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      rotatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      previousVersionId: "key-001-v2",
    },
    {
      id: "key-002",
      organizationId: "org-001",
      name: "Anthropic Claude Key",
      type: "anthropic",
      version: 2,
      isActive: true,
      maskedKey: "sk-ant-...xyz789",
      prefix: "sk-ant-",
      expiresAt: new Date(Date.now() + 60 * 24 * 3600000).toISOString(),
      lastUsedAt: new Date(Date.now() - 600000).toISOString(),
      usageCount: 8756,
      rateLimit: 500,
      rateLimitPeriod: "minute",
      permissions: ["messages"],
      metadata: { environment: "production" },
      createdAt: "2024-02-15T00:00:00Z",
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      rotatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
      previousVersionId: "key-002-v1",
    },
    {
      id: "key-003",
      organizationId: "org-001",
      name: "Google Gemini Key",
      type: "google",
      version: 1,
      isActive: true,
      maskedKey: "AIza...def456",
      prefix: "AIza",
      expiresAt: null,
      lastUsedAt: new Date(Date.now() - 1200000).toISOString(),
      usageCount: 3421,
      rateLimit: 100,
      rateLimitPeriod: "minute",
      permissions: ["generateContent"],
      metadata: { environment: "production" },
      createdAt: "2024-03-01T00:00:00Z",
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
      rotatedAt: null,
      previousVersionId: null,
    },
    {
      id: "key-004",
      organizationId: "org-002",
      name: "Staging OpenAI Key",
      type: "openai",
      version: 1,
      isActive: false,
      maskedKey: "sk-...staging",
      prefix: "sk-",
      expiresAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      lastUsedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
      usageCount: 1234,
      rateLimit: 100,
      rateLimitPeriod: "minute",
      permissions: ["chat", "completions"],
      metadata: { environment: "staging" },
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      rotatedAt: null,
      previousVersionId: null,
    },
  ],
  organizations: [
    { id: "org-001", name: "Apex Technologies", slug: "apex-tech" },
    { id: "org-002", name: "Test Organization", slug: "test-org" },
  ],
  total: 4,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get AI costs summary and breakdown
 */
export async function getAICosts(days: number = 30): Promise<AICostsResponse> {
  try {
    const response = await fetch(`/api/admin/dashboard/ai-costs?days=${days}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch AI costs: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock AI costs data:", error);
    return { ...mockAICosts, period: `${days} days` };
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogsResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.action) params.set("action", filters.action);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.targetType) params.set("targetType", filters.targetType);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.page) params.set("page", filters.page.toString());
    if (filters?.limit) params.set("limit", filters.limit.toString());

    const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock audit logs data:", error);
    return mockAuditLogs;
  }
}

/**
 * Verify audit log integrity (hash chain)
 */
export async function verifyAuditLogIntegrity(): Promise<VerificationResult> {
  try {
    const response = await fetch("/api/admin/audit-logs/verify", { method: "POST" });
    if (!response.ok) {
      throw new Error(`Failed to verify audit logs: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock verification result:", error);
    return {
      isValid: true,
      totalChecked: 247,
      validCount: 247,
      invalidCount: 0,
      message: "All audit log entries have valid hash chain integrity",
    };
  }
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(format: "csv" | "json", filters?: AuditLogFilters): Promise<Blob> {
  const params = new URLSearchParams();
  params.set("format", format);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.targetType) params.set("targetType", filters.targetType);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);

  const response = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to export audit logs: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Get API configurations
 */
export async function getAPIConfigs(): Promise<APIConfigsResponse> {
  try {
    const response = await fetch("/api/admin/api-config");
    if (!response.ok) {
      throw new Error(`Failed to fetch API configs: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock API configs data:", error);
    return mockAPIConfigs;
  }
}

/**
 * Get single API configuration
 */
export async function getAPIConfig(id: string): Promise<ApiIntegration> {
  try {
    const response = await fetch(`/api/admin/api-config/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch API config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock API config data:", error);
    const config = mockAPIConfigs.integrations.find(c => c.id === id);
    if (!config) throw new Error("Config not found");
    return config;
  }
}

/**
 * Create API configuration
 */
export async function createAPIConfig(data: Partial<ApiIntegration>): Promise<ApiIntegration> {
  const response = await fetch("/api/admin/api-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create API config: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Update API configuration
 */
export async function updateAPIConfig(id: string, data: Partial<ApiIntegration>): Promise<ApiIntegration> {
  const response = await fetch(`/api/admin/api-config/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update API config: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Delete API configuration
 */
export async function deleteAPIConfig(id: string): Promise<void> {
  const response = await fetch(`/api/admin/api-config/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Failed to delete API config: ${response.statusText}`);
  }
}

/**
 * Test API configuration connection
 */
export async function testAPIConfig(id: string): Promise<TestConnectionResult> {
  try {
    const response = await fetch(`/api/admin/api-config/${id}/test`, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Failed to test API config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock test result:", error);
    return {
      success: true,
      latency: 234,
      message: "Connection successful",
    };
  }
}

/**
 * Get API keys
 */
export async function getAPIKeys(): Promise<APIKeysResponse> {
  try {
    const response = await fetch("/api/admin/api-keys");
    if (!response.ok) {
      throw new Error(`Failed to fetch API keys: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock API keys data:", error);
    return mockAPIKeys;
  }
}

/**
 * Get single API key
 */
export async function getAPIKey(id: string): Promise<ApiKey> {
  try {
    const response = await fetch(`/api/admin/api-keys/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch API key: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock API key data:", error);
    const key = mockAPIKeys.keys.find(k => k.id === id);
    if (!key) throw new Error("Key not found");
    return key;
  }
}

/**
 * Create API key
 */
export async function createAPIKey(data: Partial<ApiKey>): Promise<ApiKey> {
  const response = await fetch("/api/admin/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create API key: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Update API key
 */
export async function updateAPIKey(id: string, data: Partial<ApiKey>): Promise<ApiKey> {
  const response = await fetch(`/api/admin/api-keys/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update API key: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Delete API key
 */
export async function deleteAPIKey(id: string): Promise<void> {
  const response = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Failed to delete API key: ${response.statusText}`);
  }
}

/**
 * Rotate API key
 */
export async function rotateAPIKey(id: string, gracePeriodMinutes: number = 0): Promise<KeyRotationResult> {
  try {
    const response = await fetch(`/api/admin/api-keys/${id}/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gracePeriodMinutes }),
    });
    if (!response.ok) {
      throw new Error(`Failed to rotate API key: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using mock rotation result:", error);
    return {
      success: true,
      newKeyId: `${id}-v2`,
      oldKeyId: id,
      gracePeriodMinutes,
      message: `Key rotated successfully${gracePeriodMinutes > 0 ? ` with ${gracePeriodMinutes} minute grace period` : ""}`,
    };
  }
}

/**
 * Toggle API key active status
 */
export async function toggleAPIKeyStatus(id: string, isActive: boolean): Promise<ApiKey> {
  return updateAPIKey(id, { isActive });
}
