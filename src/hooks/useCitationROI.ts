/**
 * Citation ROI Hooks (Phase 15)
 * Hooks for managing citation conversions, tracking links, and ROI reports
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import { useSelectedBrand } from "@/stores";

// =============================================================================
// Types
// =============================================================================

export type TimePeriod = "7d" | "30d" | "90d" | "all";

export interface ConversionMetadata {
  userAgent?: string;
  deviceType?: string;
  country?: string;
  city?: string;
  queryText?: string;
  aiResponseContext?: string;
  customFields?: Record<string, unknown>;
}

export interface Conversion {
  id: string;
  brandId: string;
  mentionId: string | null;
  sourcePlatform: string;
  visitorSessionId: string | null;
  landingPage: string | null;
  referrerUrl: string | null;
  conversionType: string;
  conversionValue: number;
  currency: string;
  attributionConfidence: number;
  attributionModel: string;
  metadata: ConversionMetadata;
  convertedAt: string;
  createdAt: string;
}

export interface TrackingLink {
  id: string;
  brandId: string;
  originalUrl: string;
  trackingUrl: string;
  shortCode: string | null;
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  clicks: number;
  conversions: number;
  campaignName: string | null;
  targetPlatform: string | null;
  metadata: {
    description?: string;
    tags?: string[];
    customParams?: Record<string, string>;
  };
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformBreakdown {
  platform: string;
  conversions: number;
  revenue: number;
  percentage: number;
}

export interface ConversionTypeBreakdown {
  type: string;
  count: number;
  value: number;
}

export interface ROISummary {
  totalConversions: number;
  totalRevenue: number;
  totalCitations: number;
  totalTrackingLinks: number;
  averageConversionValue: number;
  conversionRate: number;
  roiPercentage: number | null;
  platformBreakdown: PlatformBreakdown[];
  conversionTypeBreakdown: ConversionTypeBreakdown[];
  recentConversions: {
    id: string;
    platform: string;
    type: string;
    value: number;
    convertedAt: string;
  }[];
  period: {
    start: string;
    end: string;
  };
}

export interface ROIReport {
  brandId: string;
  brandName: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalConversions: number;
    totalRevenue: number;
    totalCitations: number;
    estimatedTraffic: number;
    investmentAmount: number;
    netProfit: number;
    roiPercentage: number | null;
    costPerConversion: number | null;
    revenuePerCitation: number;
    conversionRate: number;
    averageAttributionConfidence: number;
  };
  platformBreakdown: {
    platform: string;
    conversions: number;
    revenue: number;
    citations: number;
    conversionRate: number;
  }[];
  conversionBreakdown: {
    type: string;
    count: number;
    totalValue: number;
    averageValue: number;
    percentage: number;
  }[];
  trends: {
    conversionsOverTime: { date: string; value: number }[];
    revenueOverTime: { date: string; value: number }[];
  };
  topPerformingCitations: {
    mentionId: string | null;
    platform: string;
    conversions: number;
    revenue: number;
  }[];
  recommendations: string[];
  generatedAt: string;
}

export interface ConversionFilters {
  platform?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "convertedAt" | "value";
  sortOrder?: "asc" | "desc";
}

export interface CreateConversionData {
  brandId: string;
  mentionId?: string;
  sourcePlatform: string;
  visitorSessionId?: string;
  landingPage?: string;
  referrerUrl?: string;
  conversionType:
    | "signup"
    | "purchase"
    | "contact"
    | "download"
    | "demo_request"
    | "newsletter"
    | "free_trial"
    | "custom";
  conversionValue?: number;
  currency?: string;
  attributionConfidence?: number;
  attributionModel?:
    | "first_touch"
    | "last_touch"
    | "linear"
    | "time_decay"
    | "position_based";
  metadata?: Record<string, unknown>;
}

export interface CreateTrackingLinkData {
  brandId: string;
  originalUrl: string;
  campaignName?: string;
  targetPlatform?: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  metadata?: {
    description?: string;
    tags?: string[];
    customParams?: Record<string, string>;
  };
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchROISummary(
  brandId: string,
  period: TimePeriod
): Promise<ROISummary> {
  const res = await fetch(
    `/api/citation-roi?brandId=${brandId}&period=${period}`
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ROI summary");
  }
  const data = await res.json();
  return data.data;
}

async function fetchConversions(
  brandId: string,
  filters: ConversionFilters
): Promise<{
  conversions: Conversion[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const params = new URLSearchParams({ brandId });
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.type) params.set("type", filters.type);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const res = await fetch(`/api/citation-roi/conversions?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch conversions");
  }
  const data = await res.json();
  return data.data;
}

async function createConversion(
  data: CreateConversionData
): Promise<Conversion> {
  const res = await fetch("/api/citation-roi/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create conversion");
  }
  const result = await res.json();
  return result.data;
}

async function fetchTrackingLinks(brandId: string): Promise<{
  links: TrackingLink[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const res = await fetch(`/api/citation-roi/tracking-links?brandId=${brandId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch tracking links");
  }
  const data = await res.json();
  return data.data;
}

async function createTrackingLink(
  data: CreateTrackingLinkData
): Promise<TrackingLink> {
  const res = await fetch("/api/citation-roi/tracking-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create tracking link");
  }
  const result = await res.json();
  return result.data;
}

async function deleteTrackingLink(linkId: string): Promise<void> {
  const res = await fetch(`/api/citation-roi/tracking-links?id=${linkId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete tracking link");
  }
}

async function fetchROIReport(
  brandId: string,
  startDate?: string,
  endDate?: string,
  investment?: number
): Promise<ROIReport> {
  const params = new URLSearchParams({ brandId });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (investment) params.set("investment", String(investment));

  const res = await fetch(`/api/citation-roi/report?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ROI report");
  }
  const data = await res.json();
  return data.data;
}

async function saveROIReport(data: {
  brandId: string;
  periodStart: string;
  periodEnd: string;
  investmentAmount?: number;
}): Promise<unknown> {
  const res = await fetch("/api/citation-roi/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save ROI report");
  }
  const result = await res.json();
  return result.data;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch ROI summary for the selected brand
 */
export function useROISummary(
  period: TimePeriod = "30d",
  options?: Omit<UseQueryOptions<ROISummary>, "queryKey" | "queryFn">
) {
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id;

  return useQuery({
    queryKey: queryKeys.citationRoi.summary(brandId || "", period),
    queryFn: () => fetchROISummary(brandId!, period),
    enabled: !!brandId,
    ...options,
  });
}

/**
 * Hook to fetch conversions for the selected brand
 */
export function useConversions(
  filters: ConversionFilters = {},
  options?: Omit<
    UseQueryOptions<{
      conversions: Conversion[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>,
    "queryKey" | "queryFn"
  >
) {
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id;

  return useQuery({
    queryKey: queryKeys.citationRoi.conversions(brandId || "", filters as Record<string, unknown>),
    queryFn: () => fetchConversions(brandId!, filters),
    enabled: !!brandId,
    ...options,
  });
}

/**
 * Hook to create a new conversion
 */
export function useCreateConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversion,
    onSuccess: () => {
      invalidateQueries.citationRoi(queryClient);
    },
  });
}

/**
 * Hook to fetch tracking links for the selected brand
 */
export function useTrackingLinks(
  options?: Omit<
    UseQueryOptions<{
      links: TrackingLink[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>,
    "queryKey" | "queryFn"
  >
) {
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id;

  return useQuery({
    queryKey: queryKeys.citationRoi.trackingLinks(brandId || ""),
    queryFn: () => fetchTrackingLinks(brandId!),
    enabled: !!brandId,
    ...options,
  });
}

/**
 * Hook to create a new tracking link
 */
export function useCreateTrackingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrackingLink,
    onSuccess: () => {
      invalidateQueries.citationRoi(queryClient);
    },
  });
}

/**
 * Hook to delete a tracking link
 */
export function useDeleteTrackingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrackingLink,
    onSuccess: () => {
      invalidateQueries.citationRoi(queryClient);
    },
  });
}

/**
 * Hook to fetch a full ROI report
 */
export function useROIReport(
  options?: {
    startDate?: string;
    endDate?: string;
    investment?: number;
  } & Omit<UseQueryOptions<ROIReport>, "queryKey" | "queryFn">
) {
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id;
  const { startDate, endDate, investment, ...queryOptions } = options || {};

  return useQuery({
    queryKey: queryKeys.citationRoi.report(
      brandId || "",
      startDate,
      endDate
    ),
    queryFn: () =>
      fetchROIReport(brandId!, startDate, endDate, investment),
    enabled: !!brandId,
    ...queryOptions,
  });
}

/**
 * Hook to save an ROI report snapshot
 */
export function useSaveROIReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveROIReport,
    onSuccess: () => {
      invalidateQueries.citationRoi(queryClient);
    },
  });
}

/**
 * Combined hook for common Citation ROI operations
 */
export function useCitationROI() {
  const summary = useROISummary();
  const conversions = useConversions();
  const trackingLinks = useTrackingLinks();
  const createConversionMutation = useCreateConversion();
  const createTrackingLinkMutation = useCreateTrackingLink();
  const deleteTrackingLinkMutation = useDeleteTrackingLink();

  return {
    // Summary data
    summary: summary.data,
    summaryLoading: summary.isLoading,
    summaryError: summary.error,
    refetchSummary: summary.refetch,

    // Conversions
    conversions: conversions.data?.conversions || [],
    conversionsPagination: conversions.data?.pagination,
    conversionsLoading: conversions.isLoading,
    conversionsError: conversions.error,
    refetchConversions: conversions.refetch,

    // Tracking links
    trackingLinks: trackingLinks.data?.links || [],
    trackingLinksLoading: trackingLinks.isLoading,
    trackingLinksError: trackingLinks.error,
    refetchTrackingLinks: trackingLinks.refetch,

    // Mutations
    createConversion: createConversionMutation.mutate,
    createConversionAsync: createConversionMutation.mutateAsync,
    isCreatingConversion: createConversionMutation.isPending,

    createTrackingLink: createTrackingLinkMutation.mutate,
    createTrackingLinkAsync: createTrackingLinkMutation.mutateAsync,
    isCreatingTrackingLink: createTrackingLinkMutation.isPending,

    deleteTrackingLink: deleteTrackingLinkMutation.mutate,
    deleteTrackingLinkAsync: deleteTrackingLinkMutation.mutateAsync,
    isDeletingTrackingLink: deleteTrackingLinkMutation.isPending,

    // Overall loading state
    isLoading:
      summary.isLoading ||
      conversions.isLoading ||
      trackingLinks.isLoading,
  };
}
