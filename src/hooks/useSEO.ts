/**
 * SEO/Audit Data Hooks
 * React hooks for fetching SEO and Audit data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getAudits,
  getAudit,
  getSEOSummary,
  getSEOPages,
  getKeywords,
  getSEOPlatforms,
  type AuditListResponse,
  type Audit,
  type SEOSummary,
  type SEOPage,
  type Keyword,
  type SEOPlatform,
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

/**
 * Hook to fetch SEO summary/overview
 */
export function useSEOSummary(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<SEOSummary>(
    '/api/seo/summary',
    getSEOSummary,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
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
 * Hook to fetch all SEO pages
 */
export function useSEOPages(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<SEOPage[]>(
    '/api/seo/pages',
    getSEOPages,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    pages: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch tracked keywords
 */
export function useKeywords(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<Keyword[]>(
    '/api/seo/keywords',
    getKeywords,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    keywords: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch SEO platform monitoring data
 */
export function useSEOPlatforms(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<SEOPlatform[]>(
    '/api/seo/platforms',
    getSEOPlatforms,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    platforms: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
