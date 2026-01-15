/**
 * Integrations Hooks (F171, F172, F173)
 * Wire Integrations UI to OAuth and external APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type IntegrationType =
  | "slack"
  | "jira"
  | "github"
  | "google_search_console"
  | "google_analytics"
  | "hubspot"
  | "salesforce"
  | "notion"
  | "linear"
  | "zapier"
  | "webhook";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  connectedAt?: string;
  expiresAt?: string;
  config?: Record<string, unknown>;
  scopes?: string[];
  lastSyncAt?: string;
  syncStatus?: "idle" | "syncing" | "error";
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SlackConfig {
  channelId: string;
  channelName: string;
  notifyOn: ("mentions" | "audits" | "recommendations" | "alerts")[];
  messageFormat?: "compact" | "detailed";
}

export interface JiraConfig {
  projectKey: string;
  projectName: string;
  issueType: string;
  defaultAssignee?: string;
  labelPrefix?: string;
  priorityMapping?: Record<string, string>;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchIntegrations(orgId: string): Promise<Integration[]> {
  const response = await fetch(`/api/integrations?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch integrations");
  }
  const data = await response.json();
  return data.integrations || data;
}

async function fetchIntegration(type: IntegrationType): Promise<Integration> {
  const response = await fetch(`/api/integrations/${type}`);
  if (!response.ok) {
    throw new Error("Failed to fetch integration");
  }
  return response.json();
}

// =============================================================================
// Integration List Hooks
// =============================================================================

/**
 * Hook to fetch all integrations
 */
export function useIntegrations(
  options?: Omit<UseQueryOptions<Integration[]>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: queryKeys.settings.integrations(orgId || ""),
    queryFn: () => fetchIntegrations(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch specific integration
 */
export function useIntegration(
  type: IntegrationType,
  options?: Omit<UseQueryOptions<Integration>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["integrations", type],
    queryFn: () => fetchIntegration(type),
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

// =============================================================================
// OAuth Connection Hooks (F171)
// =============================================================================

/**
 * Hook to initiate OAuth connection
 */
export function useConnectIntegration() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      type,
      redirectUrl,
    }: {
      type: IntegrationType;
      redirectUrl?: string;
    }) => {
      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, redirectUrl, orgId }),
      });
      if (!response.ok) {
        throw new Error("Failed to initiate connection");
      }
      const data = await response.json();

      // Redirect to OAuth URL if provided
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

/**
 * Hook to complete OAuth callback
 */
export function useCompleteOAuthCallback() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      type,
      code,
      state,
    }: {
      type: IntegrationType;
      code: string;
      state?: string;
    }) => {
      const response = await fetch("/api/integrations/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, code, state, orgId }),
      });
      if (!response.ok) {
        throw new Error("Failed to complete OAuth");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

/**
 * Hook to disconnect integration
 */
export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (type: IntegrationType) => {
      const response = await fetch(`/api/integrations/${type}/disconnect`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to disconnect integration");
      }
      return response.json();
    },
    onMutate: async (type) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });

      const previousIntegrations = queryClient.getQueryData<Integration[]>(
        queryKeys.settings.integrations(orgId!)
      );

      queryClient.setQueryData<Integration[]>(
        queryKeys.settings.integrations(orgId!),
        (old) =>
          old?.map((i) =>
            i.type === type
              ? { ...i, status: "disconnected" as IntegrationStatus }
              : i
          )
      );

      return { previousIntegrations };
    },
    onError: (_err, _type, context) => {
      if (context?.previousIntegrations) {
        queryClient.setQueryData(
          queryKeys.settings.integrations(orgId!),
          context.previousIntegrations
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

/**
 * Hook to update integration config
 */
export function useUpdateIntegrationConfig() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      type,
      config,
    }: {
      type: IntegrationType;
      config: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/integrations/${type}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error("Failed to update integration config");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

/**
 * Hook to test integration connection
 */
export function useTestIntegration() {
  return useMutation({
    mutationFn: async (type: IntegrationType) => {
      const response = await fetch(`/api/integrations/${type}/test`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Integration test failed");
      }
      return response.json();
    },
  });
}

/**
 * Hook to refresh integration token
 */
export function useRefreshIntegrationToken() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (type: IntegrationType) => {
      const response = await fetch(`/api/integrations/${type}/refresh`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

// =============================================================================
// Jira Export Hooks (F172)
// =============================================================================

/**
 * Hook to fetch Jira projects
 */
export function useJiraProjects() {
  return useQuery({
    queryKey: ["jira", "projects"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/jira/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch Jira projects");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to export recommendation to Jira
 */
export function useExportToJira() {
  return useMutation({
    mutationFn: async ({
      recommendationId,
      config,
    }: {
      recommendationId: string;
      config?: Partial<JiraConfig>;
    }) => {
      const response = await fetch("/api/integrations/jira/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, ...config }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to export to Jira");
      }
      return response.json();
    },
  });
}

/**
 * Hook to bulk export recommendations to Jira
 */
export function useBulkExportToJira() {
  return useMutation({
    mutationFn: async ({
      recommendationIds,
      config,
    }: {
      recommendationIds: string[];
      config?: Partial<JiraConfig>;
    }) => {
      const response = await fetch("/api/integrations/jira/bulk-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationIds, ...config }),
      });
      if (!response.ok) {
        throw new Error("Failed to bulk export to Jira");
      }
      return response.json();
    },
  });
}

/**
 * Hook to sync Jira issue status
 */
export function useSyncJiraStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendationId: string) => {
      const response = await fetch(
        `/api/integrations/jira/sync/${recommendationId}`,
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error("Failed to sync Jira status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.lists() });
    },
  });
}

// =============================================================================
// Slack Notification Hooks (F173)
// =============================================================================

/**
 * Hook to fetch Slack channels
 */
export function useSlackChannels() {
  return useQuery({
    queryKey: ["slack", "channels"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/slack/channels");
      if (!response.ok) {
        throw new Error("Failed to fetch Slack channels");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to send message to Slack
 */
export function useSendToSlack() {
  return useMutation({
    mutationFn: async ({
      channelId,
      message,
      blocks,
      attachments,
    }: {
      channelId: string;
      message?: string;
      blocks?: unknown[];
      attachments?: unknown[];
    }) => {
      const response = await fetch("/api/integrations/slack/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, message, blocks, attachments }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send to Slack");
      }
      return response.json();
    },
  });
}

/**
 * Hook to send recommendation to Slack
 */
export function useSendRecommendationToSlack() {
  return useMutation({
    mutationFn: async ({
      recommendationId,
      channelId,
    }: {
      recommendationId: string;
      channelId: string;
    }) => {
      const response = await fetch("/api/integrations/slack/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, channelId }),
      });
      if (!response.ok) {
        throw new Error("Failed to send recommendation to Slack");
      }
      return response.json();
    },
  });
}

/**
 * Hook to send audit summary to Slack
 */
export function useSendAuditToSlack() {
  return useMutation({
    mutationFn: async ({
      auditId,
      channelId,
    }: {
      auditId: string;
      channelId: string;
    }) => {
      const response = await fetch("/api/integrations/slack/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, channelId }),
      });
      if (!response.ok) {
        throw new Error("Failed to send audit to Slack");
      }
      return response.json();
    },
  });
}

/**
 * Hook to send mention alert to Slack
 */
export function useSendMentionToSlack() {
  return useMutation({
    mutationFn: async ({
      mentionId,
      channelId,
    }: {
      mentionId: string;
      channelId: string;
    }) => {
      const response = await fetch("/api/integrations/slack/mention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentionId, channelId }),
      });
      if (!response.ok) {
        throw new Error("Failed to send mention to Slack");
      }
      return response.json();
    },
  });
}

/**
 * Hook to update Slack notification preferences
 */
export function useUpdateSlackConfig() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (config: Partial<SlackConfig>) => {
      const response = await fetch("/api/integrations/slack/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error("Failed to update Slack config");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

// =============================================================================
// Webhook Hooks
// =============================================================================

/**
 * Hook to create webhook
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (config: WebhookConfig) => {
      const response = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error("Failed to create webhook");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

/**
 * Hook to test webhook
 */
export function useTestWebhook() {
  return useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}/test`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Webhook test failed");
      }
      return response.json();
    },
  });
}

/**
 * Hook to delete webhook
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete webhook");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.integrations(orgId!),
      });
    },
  });
}

// =============================================================================
// Admin Page SWR Hooks (For API Integration Pattern)
// =============================================================================

import useSWR, { type SWRConfiguration } from "swr";
import {
  getIntegrationSummary,
  getIntegrationHealth,
  getWebhooks,
  getCredentials,
  getIntegrationConfigs,
  type IntegrationSummary,
  type IntegrationHealth as AdminIntegrationHealth,
  type WebhooksList,
  type CredentialsList,
  type IntegrationConfigList,
} from "@/lib/api/integrations";

/**
 * Hook to fetch integration summary (SWR-based for admin pages)
 */
export function useIntegrationSummary(config?: SWRConfiguration<IntegrationSummary>) {
  const { data, error, isLoading, mutate } = useSWR<IntegrationSummary>(
    "/api/admin/integrations/summary",
    getIntegrationSummary,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    summary: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch integration health status (SWR-based for admin pages)
 */
export function useIntegrationHealthAdmin(config?: SWRConfiguration<AdminIntegrationHealth>) {
  const { data, error, isLoading, mutate } = useSWR<AdminIntegrationHealth>(
    "/api/admin/integrations/health",
    getIntegrationHealth,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds for health monitoring
      ...config,
    }
  );

  return {
    health: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch webhooks list (SWR-based for admin pages)
 */
export function useWebhooksAdmin(config?: SWRConfiguration<WebhooksList>) {
  const { data, error, isLoading, mutate } = useSWR<WebhooksList>(
    "/api/admin/integrations/webhooks",
    getWebhooks,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    webhooks: data?.webhooks ?? [],
    totalWebhooks: data?.totalWebhooks ?? 0,
    activeWebhooks: data?.activeWebhooks ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch credentials list (SWR-based for admin pages)
 */
export function useCredentialsAdmin(config?: SWRConfiguration<CredentialsList>) {
  const { data, error, isLoading, mutate } = useSWR<CredentialsList>(
    "/api/admin/integrations/credentials",
    getCredentials,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    credentials: data?.credentials ?? [],
    totalCredentials: data?.totalCredentials ?? 0,
    expiringCredentials: data?.expiringCredentials ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch integration configurations (SWR-based for admin pages)
 */
export function useIntegrationConfigsAdmin(config?: SWRConfiguration<IntegrationConfigList>) {
  const { data, error, isLoading, mutate } = useSWR<IntegrationConfigList>(
    "/api/admin/integrations/configs",
    getIntegrationConfigs,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    integrations: data?.integrations ?? [],
    totalIntegrations: data?.totalIntegrations ?? 0,
    configuredIntegrations: data?.configuredIntegrations ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
