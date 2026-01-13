/**
 * GEO Alerts Hook
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Fetches and manages GEO alerts for the user's organization.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GeoAlert } from "@/lib/db/schema/geo-knowledge-base";
import type { GeoAlertType } from "@/lib/geo/alert-generator";

interface AlertsSummary {
  unreadCount: number;
  criticalCount: number;
  byType: Record<GeoAlertType, number>;
}

interface AlertsResponse {
  alerts: GeoAlert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: AlertsSummary;
}

interface AlertsQueryParams {
  brandId?: string;
  type?: GeoAlertType | "all";
  severity?: "info" | "warning" | "critical" | "all";
  unreadOnly?: boolean;
  includeExpired?: boolean;
  includeDismissed?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchAlerts(params: AlertsQueryParams = {}): Promise<AlertsResponse> {
  const searchParams = new URLSearchParams();

  if (params.brandId) searchParams.set("brandId", params.brandId);
  if (params.type) searchParams.set("type", params.type);
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.unreadOnly !== undefined) searchParams.set("unreadOnly", String(params.unreadOnly));
  if (params.includeExpired !== undefined) searchParams.set("includeExpired", String(params.includeExpired));
  if (params.includeDismissed !== undefined) searchParams.set("includeDismissed", String(params.includeDismissed));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));

  const response = await fetch(`/api/geo/alerts?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch GEO alerts");
  }

  return response.json();
}

async function updateAlert(alertId: string, action: "read" | "dismiss"): Promise<GeoAlert> {
  const response = await fetch("/api/geo/alerts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId, action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} alert`);
  }

  const data = await response.json();
  return data.alert;
}

/**
 * Hook to fetch GEO alerts
 */
export function useGeoAlerts(params: AlertsQueryParams = {}) {
  return useQuery({
    queryKey: ["geo-alerts", params],
    queryFn: () => fetchAlerts(params),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

/**
 * Hook to mark an alert as read
 */
export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => updateAlert(alertId, "read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-alerts"] });
    },
  });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => updateAlert(alertId, "dismiss"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-alerts"] });
    },
  });
}

/**
 * Hook for the alerts panel with all necessary actions
 */
export function useAlertsPanel(brandId?: string) {
  const queryClient = useQueryClient();

  const alertsQuery = useGeoAlerts({
    brandId,
    includeDismissed: false,
    includeExpired: false,
  });

  const markReadMutation = useMarkAlertRead();
  const dismissMutation = useDismissAlert();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["geo-alerts"] });
  };

  const markAsRead = (alertId: string) => {
    markReadMutation.mutate(alertId);
  };

  const dismiss = (alertId: string) => {
    dismissMutation.mutate(alertId);
  };

  const markAllRead = async () => {
    const unreadAlerts = alertsQuery.data?.alerts.filter(a => !a.readAt) || [];
    await Promise.all(unreadAlerts.map(a => updateAlert(a.id, "read")));
    queryClient.invalidateQueries({ queryKey: ["geo-alerts"] });
  };

  const dismissAll = async () => {
    const alerts = alertsQuery.data?.alerts || [];
    await Promise.all(alerts.map(a => updateAlert(a.id, "dismiss")));
    queryClient.invalidateQueries({ queryKey: ["geo-alerts"] });
  };

  return {
    alerts: alertsQuery.data?.alerts || [],
    summary: alertsQuery.data?.summary || {
      unreadCount: 0,
      criticalCount: 0,
      byType: {
        algorithm_change: 0,
        recommendation_updated: 0,
        strategy_deprecated: 0,
        new_opportunity: 0,
        competitor_move: 0,
        score_impact: 0,
      },
    },
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    refresh,
    markAsRead,
    dismiss,
    markAllRead,
    dismissAll,
  };
}

export default useGeoAlerts;
