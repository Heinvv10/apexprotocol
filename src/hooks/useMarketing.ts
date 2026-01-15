/**
 * Marketing Data Hooks
 * React hooks for fetching marketing data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getCampaigns,
  getCampaign,
  getEmailLists,
  getEmailList,
  getMarketingAnalytics,
  getSocialPosts,
  type Campaign,
  type CampaignListResponse,
  type EmailList,
  type EmailListResponse,
  type MarketingAnalyticsResponse,
  type SocialMediaResponse,
} from "@/lib/api/marketing";

/**
 * Hook to fetch all campaigns
 */
export function useCampaigns(config?: SWRConfiguration<CampaignListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<CampaignListResponse>(
    "/api/marketing/campaigns",
    getCampaigns,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    campaigns: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single campaign
 */
export function useCampaign(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/marketing/campaigns/${id}` : null,
    () => (id ? getCampaign(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    campaign: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all email lists
 */
export function useEmailLists(config?: SWRConfiguration<EmailListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<EmailListResponse>(
    "/api/marketing/emails",
    getEmailLists,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    emailLists: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single email list
 */
export function useEmailList(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/marketing/emails/${id}` : null,
    () => (id ? getEmailList(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    emailList: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch marketing analytics
 */
export function useMarketingAnalytics(
  params?: {
    startDate?: string;
    endDate?: string;
    campaignIds?: string[];
  },
  config?: SWRConfiguration<MarketingAnalyticsResponse>
) {
  const queryKey = params
    ? `/api/marketing/analytics?${new URLSearchParams({
        startDate: params.startDate || "",
        endDate: params.endDate || "",
        campaignIds: params.campaignIds?.join(",") || "",
      }).toString()}`
    : "/api/marketing/analytics";

  const { data, error, isLoading, mutate } = useSWR<MarketingAnalyticsResponse>(
    queryKey,
    () => getMarketingAnalytics(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    analytics: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch social media posts
 */
export function useSocialPosts(
  params?: {
    platform?: string;
    status?: string;
  },
  config?: SWRConfiguration<SocialMediaResponse>
) {
  const queryKey = params
    ? `/api/marketing/social?${new URLSearchParams({
        platform: params.platform || "",
        status: params.status || "",
      }).toString()}`
    : "/api/marketing/social";

  const { data, error, isLoading, mutate } = useSWR<SocialMediaResponse>(
    queryKey,
    () => getSocialPosts(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    posts: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
