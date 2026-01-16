/**
 * Admin Data Hooks
 * React hooks for fetching admin data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getAICosts,
  getAuditLogs,
  getAPIConfigs,
  getAPIKeys,
  type AICostsResponse,
  type AuditLogsResponse,
  type AuditLogFilters,
  type APIConfigsResponse,
  type APIKeysResponse,
} from "@/lib/api/admin";

/**
 * Hook to fetch AI costs data
 */
export function useAICosts(
  days: number = 30,
  config?: SWRConfiguration<AICostsResponse>
) {
  const { data, error, isLoading, mutate } = useSWR<AICostsResponse>(
    `/api/admin/dashboard/ai-costs?days=${days}`,
    () => getAICosts(days),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    costs: data ?? null,
    summary: data?.summary ?? null,
    byProvider: data?.byProvider ?? [],
    byOperation: data?.byOperation ?? [],
    byUser: data?.byUser ?? [],
    period: data?.period ?? `${days} days`,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch audit logs with filtering
 */
export function useAuditLogs(
  filters?: AuditLogFilters,
  config?: SWRConfiguration<AuditLogsResponse>
) {
  // Build cache key from filters
  const filterKey = filters
    ? JSON.stringify(filters)
    : "default";

  const { data, error, isLoading, mutate } = useSWR<AuditLogsResponse>(
    `/api/admin/audit-logs?${filterKey}`,
    () => getAuditLogs(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    logs: data?.logs ?? [],
    pagination: data?.pagination ?? {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 25,
    },
    availableFilters: data?.filters ?? {
      actions: [],
      targetTypes: [],
      statuses: [],
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch API configurations
 */
export function useAPIConfigs(
  config?: SWRConfiguration<APIConfigsResponse>
) {
  const { data, error, isLoading, mutate } = useSWR<APIConfigsResponse>(
    "/api/admin/api-config",
    () => getAPIConfigs(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    integrations: data?.integrations ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch API keys
 */
export function useAPIKeys(
  config?: SWRConfiguration<APIKeysResponse>
) {
  const { data, error, isLoading, mutate } = useSWR<APIKeysResponse>(
    "/api/admin/api-keys",
    () => getAPIKeys(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    keys: data?.keys ?? [],
    organizations: data?.organizations ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
