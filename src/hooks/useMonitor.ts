/**
 * Monitor Hooks (F156, F157, F158)
 * Wire Monitor UI to real APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  enabled: boolean;
  status: "active" | "inactive" | "error";
  lastSyncAt?: string;
  mentionCount?: number;
  config?: Record<string, unknown>;
}

export interface PlatformConfig {
  platformId: string;
  enabled: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
}

export interface BrandConfig {
  id?: string;
  name: string;
  domain?: string;
  description?: string;
  keywords: string[];
  competitors: string[];
  trackingEnabled: boolean;
  alertsEnabled: boolean;
  platforms: string[];
  settings?: Record<string, unknown>;
}

export interface Mention {
  id: string;
  brandId: string;
  platform: string;
  query: string;
  response: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  position?: number;
  citationUrl?: string;
  mentioned: boolean;
  status: "new" | "reviewed" | "actioned" | "archived";
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MentionFilters {
  brandId?: string;
  platform?: string;
  sentiment?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface MentionListResponse {
  mentions: Mention[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: MentionFilters;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchPlatforms(): Promise<Platform[]> {
  const response = await fetch("/api/monitor/platforms");
  if (!response.ok) {
    throw new Error("Failed to fetch platforms");
  }
  const data = await response.json();
  return data.platforms || data;
}

async function updatePlatformConfig(config: PlatformConfig): Promise<Platform> {
  const response = await fetch("/api/monitor/platforms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error("Failed to update platform config");
  }
  return response.json();
}

async function fetchBrandConfig(brandId: string): Promise<BrandConfig> {
  const response = await fetch(`/api/monitor/brands/${brandId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch brand config");
  }
  const result = await response.json();
  // API returns { success: true, data: brand }, extract the data field
  const brand = result.data || result;

  // Convert competitors from BrandCompetitor[] to string[]
  // API returns { name, url, reason } objects, interface expects strings
  const competitorNames = (brand.competitors || []).map(
    (c: { name: string } | string) => (typeof c === "string" ? c : c.name)
  );

  // Map API fields to BrandConfig interface
  return {
    id: brand.id,
    name: brand.name,
    domain: brand.domain,
    description: brand.description,
    keywords: brand.keywords || [],
    competitors: competitorNames,
    trackingEnabled: brand.monitoringEnabled ?? true,
    alertsEnabled: true, // Default value since API doesn't have this field
    platforms: brand.monitoringPlatforms || [],
    settings: brand.settings,
  };
}

async function saveBrandConfig(config: BrandConfig): Promise<BrandConfig> {
  const method = config.id ? "PUT" : "POST";
  const url = config.id ? `/api/monitor/brands/${config.id}` : "/api/monitor/brands";

  // Map BrandConfig fields to API fields
  // Handle competitors - convert string[] to BrandCompetitor[] if needed
  const competitors = Array.isArray(config.competitors)
    ? config.competitors.map((c) =>
        typeof c === "string"
          ? { name: c, url: "", reason: "Competitor" }
          : c
      )
    : [];

  const apiPayload = {
    name: config.name,
    domain: config.domain,
    description: config.description,
    keywords: config.keywords,
    competitors,
    monitoringEnabled: config.trackingEnabled,
    monitoringPlatforms: config.platforms,
  };

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });
  if (!response.ok) {
    throw new Error("Failed to save brand config");
  }
  const result = await response.json();
  // API returns { success: true, data: brand }, extract the data field
  const brand = result.data || result;

  // Map API response back to BrandConfig
  return {
    id: brand.id,
    name: brand.name,
    domain: brand.domain,
    description: brand.description,
    keywords: brand.keywords || [],
    competitors: brand.competitors || [],
    trackingEnabled: brand.monitoringEnabled ?? true,
    alertsEnabled: true,
    platforms: brand.monitoringPlatforms || [],
    settings: brand.settings,
  };
}

async function fetchMentions(filters: MentionFilters = {}): Promise<MentionListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/monitor/mentions?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch mentions");
  }

  const data = await response.json();

  // Map API response to expected format
  // API returns: { success, data, meta: { total, limit, offset } }
  // We need: { mentions, total, page, limit, totalPages, filters }
  const limit = data.meta?.limit ?? filters.limit ?? 50;
  const offset = data.meta?.offset ?? filters.offset ?? 0;
  const total = data.meta?.total ?? 0;
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    mentions: data.data || [],
    total,
    page,
    limit,
    totalPages,
    filters,
  };
}

async function fetchMention(id: string): Promise<Mention> {
  const response = await fetch(`/api/monitor/mentions/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch mention");
  }
  return response.json();
}

// =============================================================================
// Platform Hooks (F156)
// =============================================================================

/**
 * Hook to fetch available platforms
 */
export function usePlatforms(
  options?: Omit<UseQueryOptions<Platform[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["monitor", "platforms"],
    queryFn: fetchPlatforms,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to update platform configuration
 */
export function useUpdatePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlatformConfig,
    onMutate: async (config) => {
      await queryClient.cancelQueries({ queryKey: ["monitor", "platforms"] });

      const previousPlatforms = queryClient.getQueryData<Platform[]>(["monitor", "platforms"]);

      // Optimistic update
      queryClient.setQueryData<Platform[]>(["monitor", "platforms"], (old) =>
        old?.map((p) =>
          p.id === config.platformId ? { ...p, enabled: config.enabled } : p
        )
      );

      return { previousPlatforms };
    },
    onError: (_err, _config, context) => {
      if (context?.previousPlatforms) {
        queryClient.setQueryData(["monitor", "platforms"], context.previousPlatforms);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["monitor", "platforms"] });
    },
  });
}

/**
 * Hook to toggle platform enabled status
 */
export function useTogglePlatform() {
  const updatePlatform = useUpdatePlatform();

  return (platformId: string, enabled: boolean) => {
    return updatePlatform.mutateAsync({ platformId, enabled });
  };
}

// =============================================================================
// Brand Config Hooks (F157)
// =============================================================================

/**
 * Hook to fetch brand configuration
 */
export function useBrandConfig(
  brandId: string,
  options?: Omit<UseQueryOptions<BrandConfig>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.brands.settings(brandId),
    queryFn: () => fetchBrandConfig(brandId),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

/**
 * Hook to save brand configuration
 */
export function useSaveBrandConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveBrandConfig,
    onMutate: async (config) => {
      if (config.id) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.brands.settings(config.id),
        });

        const previousConfig = queryClient.getQueryData<BrandConfig>(
          queryKeys.brands.settings(config.id)
        );

        queryClient.setQueryData(queryKeys.brands.settings(config.id), config);

        return { previousConfig, brandId: config.id };
      }
      return {};
    },
    onError: (_err, _config, context) => {
      if (context?.previousConfig && context?.brandId) {
        queryClient.setQueryData(
          queryKeys.brands.settings(context.brandId),
          context.previousConfig
        );
      }
    },
    onSuccess: (data) => {
      if (data.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.brands.settings(data.id),
        });
      }
      invalidateQueries.brands(queryClient);
    },
  });
}

/**
 * Hook to update brand keywords
 */
export function useUpdateBrandKeywords(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keywords: string[]) => {
      const response = await fetch(`/api/monitor/brands/${brandId}/keywords`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      if (!response.ok) {
        throw new Error("Failed to update keywords");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.settings(brandId),
      });
    },
  });
}

/**
 * Hook to update brand competitors
 */
export function useUpdateBrandCompetitors(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitors: string[]) => {
      const response = await fetch(`/api/monitor/brands/${brandId}/competitors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors }),
      });
      if (!response.ok) {
        throw new Error("Failed to update competitors");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.settings(brandId),
      });
    },
  });
}

// =============================================================================
// Mentions Hooks (F158)
// =============================================================================

/**
 * Hook to fetch mentions with filters
 */
export function useMentions(
  filters: MentionFilters = {},
  options?: Omit<UseQueryOptions<MentionListResponse>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: queryKeys.mentions.list(filters as Record<string, unknown>),
    queryFn: () => fetchMentions(filters),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    enabled: !!orgId || !!filters.brandId,
    ...options,
  });
}

/**
 * Hook to fetch single mention
 */
export function useMention(
  id: string,
  options?: Omit<UseQueryOptions<Mention>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.mentions.detail(id),
    queryFn: () => fetchMention(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch mentions by brand
 */
export function useMentionsByBrand(
  brandId: string,
  filters: Omit<MentionFilters, "brandId"> = {}
) {
  return useMentions({ ...filters, brandId });
}

/**
 * Hook to update mention status
 */
export function useUpdateMentionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Mention["status"] }) => {
      const response = await fetch(`/api/monitor/mentions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update mention status");
      }
      return response.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mentions.detail(id) });

      const previousMention = queryClient.getQueryData<Mention>(
        queryKeys.mentions.detail(id)
      );

      queryClient.setQueryData<Mention>(queryKeys.mentions.detail(id), (old) =>
        old ? { ...old, status } : old
      );

      return { previousMention };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousMention) {
        queryClient.setQueryData(queryKeys.mentions.detail(id), context.previousMention);
      }
    },
    onSettled: () => {
      invalidateQueries.mentions(queryClient);
    },
  });
}

/**
 * Hook to bulk update mentions
 */
export function useBulkUpdateMentions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: Partial<Pick<Mention, "status" | "sentiment" | "tags">>;
    }) => {
      const response = await fetch("/api/monitor/mentions/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, ...updates }),
      });
      if (!response.ok) {
        throw new Error("Failed to bulk update mentions");
      }
      return response.json();
    },
    onSettled: () => {
      invalidateQueries.mentions(queryClient);
    },
  });
}

/**
 * Hook to trigger mention refresh/scrape
 */
export function useRefreshMentions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const response = await fetch(`/api/monitor/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      if (!response.ok) {
        throw new Error("Failed to trigger mention refresh");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate after a delay to allow scraping to complete
      setTimeout(() => {
        invalidateQueries.mentions(queryClient);
      }, 5000);
    },
  });
}

// Analytics response types
export interface AnalyticsDataPoint {
  date: string;
  displayDate: string;
  chatgpt: number;
  claude: number;
  perplexity: number;
  gemini: number;
  grok: number;
  deepseek: number;
  copilot: number;
  total: number;
}

export interface SentimentStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsDataPoint[];
  sentiment: SentimentStats;
  platforms: Record<string, number>;
  meta: {
    range: string;
    startDate: string;
    endDate: string;
    totalMentions: number;
  };
}

/**
 * Hook to fetch mention analytics
 */
export function useMentionAnalytics(
  brandId?: string,
  range: "7d" | "14d" | "30d" | "90d" = "30d"
) {
  const orgId = useOrganizationId();

  return useQuery<AnalyticsResponse>({
    queryKey: queryKeys.mentions.analytics(brandId || "all", range),
    queryFn: async () => {
      const params = new URLSearchParams({ range });
      if (brandId) {
        params.append("brandId", brandId);
      }
      const response = await fetch(`/api/monitor/mentions/analytics?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch mention analytics");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!orgId,
  });
}

// =============================================================================
// Prompts/Queries Hooks
// =============================================================================

export interface SearchPromptResponse {
  id: string;
  promptText: string;
  platforms: string[];
  frequency: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  lastSeen: string;
}

export interface PromptsResponse {
  success: boolean;
  prompts: SearchPromptResponse[];
  total: number;
  meta: {
    range: string;
    startDate: string;
    endDate: string;
  };
}

/**
 * Hook to fetch search prompts/queries
 */
export function usePrompts(
  brandId?: string,
  range: "7d" | "14d" | "30d" | "90d" = "30d",
  limit: number = 50
) {
  const orgId = useOrganizationId();

  return useQuery<PromptsResponse>({
    queryKey: ["monitor", "prompts", brandId || "all", range, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ range, limit: String(limit) });
      if (brandId) {
        params.append("brandId", brandId);
      }
      const response = await fetch(`/api/monitor/prompts?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!orgId,
  });
}

// =============================================================================
// Citations Hooks
// =============================================================================

export interface CitationData {
  id: string;
  url: string;
  title: string;
  citations: number;
  lastCited: string;
  platforms: Record<string, number>;
  context: string;
}

export interface CitationTrendPoint {
  date: string;
  citations: number;
}

export interface CitationsResponse {
  success: boolean;
  citations: CitationData[];
  trendData: CitationTrendPoint[];
  total: number;
  meta: {
    range: string;
    startDate: string;
    endDate: string;
    totalCitations: number;
  };
}

/**
 * Hook to fetch citations data
 */
export function useCitations(
  brandId?: string,
  range: "7d" | "14d" | "30d" | "90d" = "30d",
  limit: number = 20
) {
  const orgId = useOrganizationId();

  return useQuery<CitationsResponse>({
    queryKey: ["monitor", "citations", brandId || "all", range, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ range, limit: String(limit) });
      if (brandId) {
        params.append("brandId", brandId);
      }
      const response = await fetch(`/api/monitor/citations?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch citations");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!orgId,
  });
}
