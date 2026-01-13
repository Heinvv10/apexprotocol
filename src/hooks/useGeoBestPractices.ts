/**
 * GEO Best Practices Hooks
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * React Query hooks for fetching and managing GEO best practices.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GeoBestPractice, GeoPlatform, BestPracticeCategory } from "@/lib/db/schema";

interface BestPracticesSummary {
  totalActive: number;
  byPlatform: Record<string, number>;
  byCategory: Record<string, number>;
  avgImpactScore: number;
}

interface BestPracticesResponse {
  practices: GeoBestPractice[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: BestPracticesSummary;
}

interface BestPracticesQueryParams {
  platform?: GeoPlatform | "all";
  category?: BestPracticeCategory | "all";
  includeDeprecated?: boolean;
  minImpactScore?: number;
  limit?: number;
  offset?: number;
}

interface CreateBestPracticeInput {
  platform: GeoPlatform;
  category: BestPracticeCategory;
  practiceTitle: string;
  practiceDescription: string;
  implementationSteps?: Array<{
    stepNumber: number;
    instruction: string;
    codeSnippet?: string;
    platformNotes?: Record<string, string>;
  }>;
  impactScore: number;
  effortScore: number;
  effectiveSince?: string;
}

interface UpdateBestPracticeInput {
  id: string;
  practiceTitle?: string;
  practiceDescription?: string;
  implementationSteps?: Array<{
    stepNumber: number;
    instruction: string;
    codeSnippet?: string;
    platformNotes?: Record<string, string>;
  }>;
  impactScore?: number;
  effortScore?: number;
  deprecatedAt?: string;
  deprecationReason?: string;
}

async function fetchBestPractices(params: BestPracticesQueryParams = {}): Promise<BestPracticesResponse> {
  const searchParams = new URLSearchParams();

  if (params.platform) searchParams.set("platform", params.platform);
  if (params.category) searchParams.set("category", params.category);
  if (params.includeDeprecated !== undefined) searchParams.set("includeDeprecated", String(params.includeDeprecated));
  if (params.minImpactScore !== undefined) searchParams.set("minImpactScore", String(params.minImpactScore));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));

  const response = await fetch(`/api/geo/best-practices?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch best practices");
  }

  return response.json();
}

async function createBestPractice(input: CreateBestPracticeInput): Promise<GeoBestPractice> {
  const response = await fetch("/api/geo/best-practices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create best practice");
  }

  const data = await response.json();
  return data.practice;
}

async function updateBestPractice(input: UpdateBestPracticeInput): Promise<GeoBestPractice> {
  const response = await fetch("/api/geo/best-practices", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to update best practice");
  }

  const data = await response.json();
  return data.practice;
}

async function deprecateBestPractice(id: string, reason?: string): Promise<GeoBestPractice> {
  const params = new URLSearchParams({ id });
  if (reason) params.set("reason", reason);

  const response = await fetch(`/api/geo/best-practices?${params.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to deprecate best practice");
  }

  const data = await response.json();
  return data.practice;
}

/**
 * Hook to fetch best practices with filtering
 */
export function useGeoBestPractices(params: BestPracticesQueryParams = {}) {
  return useQuery({
    queryKey: ["geo-best-practices", params],
    queryFn: () => fetchBestPractices(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch best practices for a specific platform
 */
export function usePlatformBestPractices(platform: GeoPlatform) {
  return useGeoBestPractices({ platform, includeDeprecated: false });
}

/**
 * Hook to fetch high-impact best practices
 */
export function useHighImpactPractices(minScore: number = 7) {
  return useGeoBestPractices({ minImpactScore: minScore, includeDeprecated: false });
}

/**
 * Hook to create a new best practice
 */
export function useCreateBestPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBestPractice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-best-practices"] });
    },
  });
}

/**
 * Hook to update an existing best practice
 */
export function useUpdateBestPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBestPractice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-best-practices"] });
    },
  });
}

/**
 * Hook to deprecate a best practice
 */
export function useDeprecateBestPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => deprecateBestPractice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-best-practices"] });
    },
  });
}

export default useGeoBestPractices;
