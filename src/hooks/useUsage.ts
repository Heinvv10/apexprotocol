/**
 * Usage Dashboard Hooks (F176)
 * Wire Usage Dashboard to usage metering API
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type UsageMetricType =
  | "ai_tokens"
  | "api_calls"
  | "scans"
  | "audits"
  | "content_generations"
  | "mentions_tracked"
  | "storage_mb"
  | "team_members";

export type UsagePeriod = "current" | "previous" | "custom";

export interface UsageMetric {
  type: UsageMetricType;
  label: string;
  current: number;
  limit: number;
  unit: string;
  percentage: number;
  trend: number;
  history: Array<{
    date: string;
    value: number;
  }>;
}

export interface UsageSummary {
  period: {
    start: string;
    end: string;
  };
  metrics: UsageMetric[];
  totalCost?: number;
  projectedCost?: number;
  alerts: UsageAlert[];
}

export interface UsageAlert {
  id: string;
  type: "warning" | "critical" | "info";
  metric: UsageMetricType;
  message: string;
  threshold: number;
  currentValue: number;
  acknowledgedAt?: string;
}

export interface UsageBreakdown {
  byBrand: Array<{
    brandId: string;
    brandName: string;
    metrics: Record<UsageMetricType, number>;
  }>;
  byUser: Array<{
    userId: string;
    userName: string;
    metrics: Record<UsageMetricType, number>;
  }>;
  byFeature: Array<{
    feature: string;
    metrics: Record<UsageMetricType, number>;
  }>;
}

export interface UsageHistory {
  period: string;
  data: Array<{
    date: string;
    metrics: Record<UsageMetricType, number>;
  }>;
}

export interface UsageQuota {
  metric: UsageMetricType;
  limit: number;
  resetDate: string;
  canPurchaseMore: boolean;
  additionalUnitPrice?: number;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchUsageSummary(
  orgId: string,
  period?: UsagePeriod
): Promise<UsageSummary> {
  const params = new URLSearchParams({ orgId });
  if (period) params.append("period", period);

  const response = await fetch(`/api/usage/summary?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch usage summary");
  }
  return response.json();
}

async function fetchUsageBreakdown(orgId: string): Promise<UsageBreakdown> {
  const response = await fetch(`/api/usage/breakdown?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch usage breakdown");
  }
  return response.json();
}

async function fetchUsageHistory(
  orgId: string,
  period: string = "30d"
): Promise<UsageHistory> {
  const response = await fetch(`/api/usage/history?orgId=${orgId}&period=${period}`);
  if (!response.ok) {
    throw new Error("Failed to fetch usage history");
  }
  return response.json();
}

async function fetchUsageQuotas(orgId: string): Promise<UsageQuota[]> {
  const response = await fetch(`/api/usage/quotas?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch usage quotas");
  }
  const data = await response.json();
  return data.quotas || data;
}

// =============================================================================
// Usage Summary Hooks
// =============================================================================

/**
 * Hook to fetch usage summary for organization
 */
export function useUsageSummary(
  period: UsagePeriod = "current",
  options?: Omit<UseQueryOptions<UsageSummary>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: queryKeys.usage.summary(orgId || "", period),
    queryFn: () => fetchUsageSummary(orgId!, period),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch specific usage metric
 */
export function useUsageMetric(
  metricType: UsageMetricType,
  options?: Omit<UseQueryOptions<UsageMetric>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["usage", "metric", orgId, metricType],
    queryFn: async () => {
      const response = await fetch(
        `/api/usage/metric?orgId=${orgId}&type=${metricType}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch usage metric");
      }
      return response.json();
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

/**
 * Hook to fetch usage breakdown by brand/user/feature
 */
export function useUsageBreakdown(
  options?: Omit<UseQueryOptions<UsageBreakdown>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["usage", "breakdown", orgId],
    queryFn: () => fetchUsageBreakdown(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to fetch usage history for charts
 */
export function useUsageHistory(
  period: string = "30d",
  options?: Omit<UseQueryOptions<UsageHistory>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["usage", "history", orgId, period],
    queryFn: () => fetchUsageHistory(orgId!, period),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to fetch usage quotas
 */
export function useUsageQuotas(
  options?: Omit<UseQueryOptions<UsageQuota[]>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["usage", "quotas", orgId],
    queryFn: () => fetchUsageQuotas(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// =============================================================================
// Usage Alert Hooks
// =============================================================================

/**
 * Hook to fetch usage alerts
 */
export function useUsageAlerts() {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["usage", "alerts", orgId],
    queryFn: async () => {
      const response = await fetch(`/api/usage/alerts?orgId=${orgId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch usage alerts");
      }
      const data = await response.json();
      return data.alerts as UsageAlert[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60, // Check every minute
  });
}

/**
 * Hook to acknowledge usage alert
 */
export function useAcknowledgeUsageAlert() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/usage/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }
      return response.json();
    },
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({
        queryKey: ["usage", "alerts", orgId],
      });

      const previousAlerts = queryClient.getQueryData<UsageAlert[]>([
        "usage",
        "alerts",
        orgId,
      ]);

      queryClient.setQueryData<UsageAlert[]>(
        ["usage", "alerts", orgId],
        (old) =>
          old?.map((alert) =>
            alert.id === alertId
              ? { ...alert, acknowledgedAt: new Date().toISOString() }
              : alert
          )
      );

      return { previousAlerts };
    },
    onError: (_err, _alertId, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(
          ["usage", "alerts", orgId],
          context.previousAlerts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usage", "alerts", orgId] });
    },
  });
}

/**
 * Hook to set usage alert threshold
 */
export function useSetUsageAlertThreshold() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      metric,
      threshold,
      enabled,
    }: {
      metric: UsageMetricType;
      threshold: number;
      enabled: boolean;
    }) => {
      const response = await fetch("/api/usage/alerts/threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, threshold, enabled }),
      });
      if (!response.ok) {
        throw new Error("Failed to set alert threshold");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usage", "alerts", orgId] });
    },
  });
}

// =============================================================================
// Usage Limit Hooks
// =============================================================================

/**
 * Hook to check if usage limit is reached
 */
export function useUsageLimitCheck(metric: UsageMetricType) {
  const { data: summary } = useUsageSummary();

  if (!summary) {
    return {
      isAtLimit: false,
      isNearLimit: false,
      percentage: 0,
      remaining: 0,
    };
  }

  const metricData = summary.metrics.find((m) => m.type === metric);
  if (!metricData) {
    return {
      isAtLimit: false,
      isNearLimit: false,
      percentage: 0,
      remaining: 0,
    };
  }

  const percentage = metricData.percentage;
  const remaining = metricData.limit - metricData.current;

  return {
    isAtLimit: percentage >= 100,
    isNearLimit: percentage >= 80 && percentage < 100,
    percentage,
    remaining: Math.max(0, remaining),
    current: metricData.current,
    limit: metricData.limit,
  };
}

/**
 * Hook to purchase additional usage
 */
export function usePurchaseAdditionalUsage() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      metric,
      quantity,
    }: {
      metric: UsageMetricType;
      quantity: number;
    }) => {
      const response = await fetch("/api/usage/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, quantity }),
      });
      if (!response.ok) {
        throw new Error("Failed to purchase additional usage");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.usage.summary(orgId || "", "current"),
      });
    },
  });
}

// =============================================================================
// Usage Tracking Hooks
// =============================================================================

/**
 * Hook to track usage event (called by features)
 */
export function useTrackUsage() {
  return useMutation({
    mutationFn: async ({
      metric,
      amount = 1,
      metadata,
    }: {
      metric: UsageMetricType;
      amount?: number;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await fetch("/api/usage/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, amount, metadata }),
      });
      if (!response.ok) {
        throw new Error("Failed to track usage");
      }
      return response.json();
    },
  });
}

/**
 * Hook to get real-time usage stats
 */
export function useRealtimeUsage() {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["usage", "realtime", orgId],
    queryFn: async () => {
      const response = await fetch(`/api/usage/realtime?orgId=${orgId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch realtime usage");
      }
      return response.json();
    },
    enabled: !!orgId,
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 30, // Refresh every 30 seconds
  });
}

// =============================================================================
// Dashboard Aggregation Hook
// =============================================================================

/**
 * Combined hook for usage dashboard page
 */
export function useUsageDashboard(period: string = "30d") {
  const summary = useUsageSummary();
  const breakdown = useUsageBreakdown();
  const history = useUsageHistory(period);
  const quotas = useUsageQuotas();
  const alerts = useUsageAlerts();

  const isLoading =
    summary.isLoading ||
    breakdown.isLoading ||
    history.isLoading ||
    quotas.isLoading ||
    alerts.isLoading;

  const error =
    summary.error ||
    breakdown.error ||
    history.error ||
    quotas.error ||
    alerts.error;

  return {
    summary: summary.data,
    breakdown: breakdown.data,
    history: history.data,
    quotas: quotas.data,
    alerts: alerts.data,
    isLoading,
    error,
    refetch: () => {
      summary.refetch();
      breakdown.refetch();
      history.refetch();
      quotas.refetch();
      alerts.refetch();
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format usage value with appropriate unit
 */
export function formatUsageValue(value: number, unit: string): string {
  switch (unit) {
    case "tokens":
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    case "mb":
      if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`;
      return `${value} MB`;
    case "count":
    default:
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
  }
}

/**
 * Get usage status color based on percentage
 */
export function getUsageStatusColor(percentage: number): string {
  if (percentage >= 100) return "text-error";
  if (percentage >= 80) return "text-warning";
  if (percentage >= 50) return "text-muted-foreground";
  return "text-success";
}
