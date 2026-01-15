/**
 * SEO/Audit Data Hooks
 * React hooks for fetching SEO and Audit data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getAudits,
  getAudit,
  type AuditListResponse,
  type Audit,
} from "@/lib/api/seo";

/**
 * Hook to fetch all audits
 */
export function useAudits(config?: SWRConfiguration<AuditListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<AuditListResponse>(
    "/api/audit",
    getAudits,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    audits: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single audit
 */
export function useAudit(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/audit/${id}` : null,
    () => (id ? getAudit(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    audit: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
