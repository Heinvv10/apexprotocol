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
  getSequences,
  getSequence,
  getEmailTemplates,
  getEmailTemplate,
  getContentCalendar,
  getMarketingOverview,
  type Campaign,
  type CampaignListResponse,
  type EmailList,
  type EmailListResponse,
  type MarketingAnalyticsResponse,
  type SocialMediaResponse,
  type Sequence,
  type SequenceListResponse,
  type EmailTemplate,
  type EmailTemplateListResponse,
  type ContentCalendarResponse,
  type MarketingOverviewResponse,
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

/**
 * Hook to fetch all email sequences
 */
export function useSequences(config?: SWRConfiguration<SequenceListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<SequenceListResponse>(
    "/api/marketing/sequences",
    getSequences,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    sequences: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single email sequence
 */
export function useSequence(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/marketing/sequences/${id}` : null,
    () => (id ? getSequence(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    sequence: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all email templates
 */
export function useEmailTemplates(config?: SWRConfiguration<EmailTemplateListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<EmailTemplateListResponse>(
    "/api/marketing/templates",
    getEmailTemplates,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    templates: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single email template
 */
export function useEmailTemplate(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/marketing/templates/${id}` : null,
    () => (id ? getEmailTemplate(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    template: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch content calendar
 */
export function useContentCalendar(
  params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  },
  config?: SWRConfiguration<ContentCalendarResponse>
) {
  const queryKey = params
    ? `/api/marketing/calendar?${new URLSearchParams({
        startDate: params.startDate || "",
        endDate: params.endDate || "",
        type: params.type || "",
      }).toString()}`
    : "/api/marketing/calendar";

  const { data, error, isLoading, mutate } = useSWR<ContentCalendarResponse>(
    queryKey,
    () => getContentCalendar(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    events: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch marketing overview
 */
export function useMarketingOverview(config?: SWRConfiguration<MarketingOverviewResponse>) {
  const { data, error, isLoading, mutate } = useSWR<MarketingOverviewResponse>(
    "/api/marketing/overview",
    getMarketingOverview,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    overview: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
