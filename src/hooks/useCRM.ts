/**
 * CRM Data Hooks
 * React hooks for fetching CRM data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getLeads,
  getLead,
  getAccounts,
  getAccount,
  getPipeline,
  type Lead,
  type LeadListResponse,
  type Account,
  type AccountListResponse,
  type PipelineResponse,
} from "@/lib/api/crm";

/**
 * Hook to fetch all leads
 */
export function useLeads(config?: SWRConfiguration<LeadListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<LeadListResponse>(
    "/api/crm/leads",
    getLeads,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    leads: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single lead
 */
export function useLead(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/crm/leads/${id}` : null,
    () => (id ? getLead(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    lead: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all accounts
 */
export function useAccounts(config?: SWRConfiguration<AccountListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<AccountListResponse>(
    "/api/crm/accounts",
    getAccounts,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    accounts: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single account
 */
export function useAccount(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/crm/accounts/${id}` : null,
    () => (id ? getAccount(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    account: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch pipeline deals
 */
export function usePipeline(config?: SWRConfiguration<PipelineResponse>) {
  const { data, error, isLoading, mutate } = useSWR<PipelineResponse>(
    "/api/crm/pipeline",
    getPipeline,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    deals: data?.data ?? [],
    total: data?.meta.total ?? 0,
    totalValue: data?.meta.totalValue ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
