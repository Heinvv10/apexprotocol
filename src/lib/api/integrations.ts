/**
 * Integrations API Client
 * Centralized functions for calling Integration-related backend APIs
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

// Integration Types
export interface IntegrationSummary {
  totalIntegrations: number;
  activeIntegrations: number;
  healthyIntegrations: number;
  warningIntegrations: number;
  criticalIntegrations: number;
  totalWebhooks: number;
  activeWebhooks: number;
  totalApiCalls24h: number;
  successRate: number;
  avgResponseTime: number;
  integrations: Array<{
    id: string;
    name: string;
    type: string;
    status: "active" | "inactive" | "error";
    health: "healthy" | "warning" | "critical";
    lastSync: string;
    apiCallsToday: number;
    errorRate: number;
  }>;
  recentActivity: Array<{
    id: string;
    integration: string;
    type: "sync" | "error" | "webhook" | "config";
    message: string;
    timestamp: string;
  }>;
}

export interface IntegrationHealthItem {
  id: string;
  integration: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  uptimeChange: number;
  avgResponseTime: number;
  responseTimeChange: number;
  errorRate: number;
  errorRateChange: number;
  totalRequests: number;
  failedRequests: number;
  lastIncident: string;
  lastCheck: string;
  metrics: {
    latency: number[];
    errors: number[];
    requests: number[];
  };
  endpoints: Array<{
    path: string;
    avgTime: number;
    errorRate: number;
    requests: number;
  }>;
}

export interface IntegrationHealthAlert {
  id: string;
  integration: string;
  severity: "info" | "warning" | "error";
  type: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface IntegrationHealth {
  overall: "healthy" | "warning" | "critical";
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  lastCheck: string;
  integrations: IntegrationHealthItem[];
  alerts: IntegrationHealthAlert[];
}

export interface Webhook {
  id: string;
  integration: string;
  name: string;
  endpoint: string;
  events: string[];
  status: "active" | "warning" | "paused" | "failed";
  createdAt: string;
  lastTriggered: string;
  deliveryRate: number;
  totalDeliveries: number;
  failedDeliveries: number;
  avgResponseTime: number;
  retryPolicy: string;
  maxRetries: number;
}

export interface WebhooksList {
  webhooks: Webhook[];
  totalWebhooks: number;
  activeWebhooks: number;
}

export interface Credential {
  id: string;
  integration: string;
  name: string;
  type: "api_key" | "oauth_token" | "connection_string" | "oauth" | "basic" | "token";
  status: "active" | "expired" | "revoked" | "warning";
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string;
  lastRotated: string;
  rotationPolicy: string;
  permissions: string[];
  keyPreview: string;
  encrypted: boolean;
  auditLogs: number;
  needsRefresh?: boolean;
}

export interface CredentialsList {
  credentials: Credential[];
  totalCredentials: number;
  expiringCredentials: number;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  status: "active" | "inactive" | "configured" | "pending";
  category: "email" | "social" | "crm" | "analytics" | "payment" | "storage" | "other";
  icon: string;
  config: Record<string, unknown>;
  features: string[];
  requiredFields: string[];
  optionalFields: string[];
  documentation: string;
  lastConfigured: string | null;
}

export interface IntegrationConfigList {
  integrations: IntegrationConfig[];
  totalIntegrations: number;
  configuredIntegrations: number;
}

/**
 * Integration API Functions
 */

export async function getIntegrationSummary(): Promise<IntegrationSummary> {
  // For now, return mock data since Integration API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    totalIntegrations: 0,
    activeIntegrations: 0,
    healthyIntegrations: 0,
    warningIntegrations: 0,
    criticalIntegrations: 0,
    totalWebhooks: 0,
    activeWebhooks: 0,
    totalApiCalls24h: 0,
    successRate: 0,
    avgResponseTime: 0,
    integrations: [],
    recentActivity: [],
  };
}

export async function getIntegrationHealth(): Promise<IntegrationHealth> {
  // For now, return mock data since Integration API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    overall: "healthy",
    uptime: 0,
    avgResponseTime: 0,
    errorRate: 0,
    lastCheck: new Date().toISOString(),
    integrations: [],
    alerts: [],
  };
}

export async function getWebhooks(): Promise<WebhooksList> {
  // For now, return mock data since Integration API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    webhooks: [],
    totalWebhooks: 0,
    activeWebhooks: 0,
  };
}

export async function getCredentials(): Promise<CredentialsList> {
  // For now, return mock data since Integration API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    credentials: [],
    totalCredentials: 0,
    expiringCredentials: 0,
  };
}

export async function getIntegrationConfigs(): Promise<IntegrationConfigList> {
  // For now, return mock data since Integration API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    integrations: [],
    totalIntegrations: 0,
    configuredIntegrations: 0,
  };
}
