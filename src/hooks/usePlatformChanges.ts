/**
 * Platform Changes Hooks
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * React Query hooks for fetching and managing platform behavior changes.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlatformChange, GeoPlatform, PlatformChangeType } from "@/lib/db/schema";

interface PlatformChangesSummary {
  totalChanges: number;
  byPlatform: Record<string, number>;
  byChangeType: Record<string, number>;
  recentHighImpact: PlatformChange[];
  avgConfidence: number;
}

interface PlatformChangesResponse {
  changes: PlatformChange[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: PlatformChangesSummary;
}

interface PlatformChangesQueryParams {
  platform?: GeoPlatform | "all";
  changeType?: PlatformChangeType | "all";
  minConfidence?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

interface CreatePlatformChangeInput {
  platform: GeoPlatform;
  changeType: PlatformChangeType;
  description: string;
  impactAssessment: string;
  recommendedResponse: string;
  confidenceScore: number;
  source: string;
  affectedCategories?: string[];
  detectionMethod?: "automated" | "manual" | "community" | "research";
}

interface UpdatePlatformChangeInput {
  id: string;
  confidenceScore?: number;
  impactAssessment?: string;
  recommendedResponse?: string;
  verified?: boolean;
}

async function fetchPlatformChanges(params: PlatformChangesQueryParams = {}): Promise<PlatformChangesResponse> {
  const searchParams = new URLSearchParams();

  if (params.platform) searchParams.set("platform", params.platform);
  if (params.changeType) searchParams.set("changeType", params.changeType);
  if (params.minConfidence !== undefined) searchParams.set("minConfidence", String(params.minConfidence));
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));

  const response = await fetch(`/api/geo/platform-changes?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch platform changes");
  }

  return response.json();
}

async function createPlatformChange(input: CreatePlatformChangeInput): Promise<PlatformChange> {
  const response = await fetch("/api/geo/platform-changes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create platform change");
  }

  const data = await response.json();
  return data.change;
}

async function updatePlatformChange(input: UpdatePlatformChangeInput): Promise<PlatformChange> {
  const response = await fetch("/api/geo/platform-changes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to update platform change");
  }

  const data = await response.json();
  return data.change;
}

/**
 * Hook to fetch platform changes with filtering
 */
export function usePlatformChanges(params: PlatformChangesQueryParams = {}) {
  return useQuery({
    queryKey: ["platform-changes", params],
    queryFn: () => fetchPlatformChanges(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch recent platform changes (last 30 days)
 */
export function useRecentPlatformChanges(platform?: GeoPlatform) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return usePlatformChanges({
    platform: platform || "all",
    dateFrom: thirtyDaysAgo.toISOString(),
    minConfidence: 50, // Only show changes with reasonable confidence
  });
}

/**
 * Hook to fetch high-confidence platform changes
 */
export function useHighConfidenceChanges(minConfidence: number = 70) {
  return usePlatformChanges({ minConfidence });
}

/**
 * Hook to fetch platform changes by type
 */
export function usePlatformChangesByType(changeType: PlatformChangeType) {
  return usePlatformChanges({ changeType });
}

/**
 * Hook to create a new platform change record
 */
export function useCreatePlatformChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlatformChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-changes"] });
      // Also invalidate alerts since new changes may generate alerts
      queryClient.invalidateQueries({ queryKey: ["geo-alerts"] });
    },
  });
}

/**
 * Hook to update an existing platform change
 */
export function useUpdatePlatformChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlatformChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-changes"] });
    },
  });
}

/**
 * Combined hook for platform changes dashboard panel
 */
export function usePlatformChangesPanel() {
  const queryClient = useQueryClient();

  const changesQuery = usePlatformChanges({
    limit: 20,
    minConfidence: 50,
  });

  const createMutation = useCreatePlatformChange();
  const updateMutation = useUpdatePlatformChange();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["platform-changes"] });
  };

  return {
    changes: changesQuery.data?.changes || [],
    summary: changesQuery.data?.summary || {
      totalChanges: 0,
      byPlatform: {},
      byChangeType: {},
      recentHighImpact: [],
      avgConfidence: 0,
    },
    pagination: changesQuery.data?.pagination,
    isLoading: changesQuery.isLoading,
    error: changesQuery.error,
    refresh,
    createChange: createMutation.mutate,
    updateChange: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export default usePlatformChanges;
