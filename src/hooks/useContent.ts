/**
 * Content Hooks (F159)
 * Wire Content List to Content CRUD API
 */

import * as React from "react";
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type ContentType = "blog" | "social" | "faq" | "product" | "landing" | "email";
export type ContentStatus = "draft" | "reviewing" | "approved" | "published" | "archived";

export interface Content {
  id: string;
  brandId: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  content: string;
  excerpt?: string;
  keywords?: string[];
  targetPlatform?: string;
  targetAudience?: string;
  tone?: string;
  wordCount?: number;
  seoScore?: number;
  aiGenerated: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ContentFilters {
  brandId?: string;
  type?: ContentType;
  status?: ContentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  aiGenerated?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ContentListResponse {
  content: Content[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: ContentType;
  description: string;
  prompt: string;
  variables: string[];
  examples?: string[];
}

export interface GenerateContentInput {
  brandId: string;
  type: ContentType;
  title?: string;
  prompt?: string;
  keywords?: string[];
  targetPlatform?: string;
  targetAudience?: string;
  tone?: "professional" | "casual" | "friendly" | "formal" | "persuasive";
  length?: "short" | "medium" | "long";
  templateId?: string;
  variables?: Record<string, string>;
}

export interface ContentCreateInput {
  brandId: string;
  title: string;
  type: ContentType;
  content: string;
  keywords?: string[];
  targetPlatform?: string;
  status?: ContentStatus;
  metadata?: Record<string, unknown>;
}

export interface ContentUpdateInput {
  title?: string;
  content?: string;
  status?: ContentStatus;
  keywords?: string[];
  targetPlatform?: string;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchContent(filters: ContentFilters = {}): Promise<ContentListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/content?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch content");
  }
  return response.json();
}

async function fetchContentById(id: string): Promise<Content> {
  const response = await fetch(`/api/content/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch content");
  }
  return response.json();
}

async function createContent(input: ContentCreateInput): Promise<Content> {
  const response = await fetch("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create content");
  }
  return response.json();
}

async function updateContent(id: string, input: ContentUpdateInput): Promise<Content> {
  const response = await fetch(`/api/content/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to update content");
  }
  return response.json();
}

async function deleteContent(id: string): Promise<void> {
  const response = await fetch(`/api/content/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete content");
  }
}

async function generateContent(input: GenerateContentInput): Promise<Content> {
  const response = await fetch("/api/content/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to generate content");
  }
  return response.json();
}

async function fetchTemplates(): Promise<ContentTemplate[]> {
  const response = await fetch("/api/content/templates");
  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }
  const data = await response.json();
  return data.templates || data;
}

// =============================================================================
// Content List Hooks
// =============================================================================

/**
 * Hook to fetch content with filters
 */
export function useContentList(
  filters: ContentFilters = {},
  options?: Omit<UseQueryOptions<ContentListResponse>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: queryKeys.content.list(filters as Record<string, unknown>),
    queryFn: () => fetchContent(filters),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!orgId || !!filters.brandId,
    ...options,
  });
}

/**
 * Hook to fetch content by brand
 */
export function useContentByBrand(
  brandId: string,
  filters: Omit<ContentFilters, "brandId"> = {}
) {
  return useContentList({ ...filters, brandId });
}

/**
 * Hook to fetch single content item
 */
export function useContent(
  id: string,
  options?: Omit<UseQueryOptions<Content>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.content.detail(id),
    queryFn: () => fetchContentById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch content templates
 */
export function useContentTemplates(
  options?: Omit<UseQueryOptions<ContentTemplate[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.content.templates(),
    queryFn: fetchTemplates,
    staleTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

// =============================================================================
// Content Mutation Hooks
// =============================================================================

/**
 * Hook to create content
 */
export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.byBrand(data.brandId),
      });
      invalidateQueries.content(queryClient);
      invalidateQueries.gamification(queryClient);
    },
  });
}

/**
 * Hook to update content
 */
export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContentUpdateInput }) =>
      updateContent(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.detail(id) });

      const previousContent = queryClient.getQueryData<Content>(
        queryKeys.content.detail(id)
      );

      queryClient.setQueryData<Content>(queryKeys.content.detail(id), (old) =>
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old
      );

      return { previousContent };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(queryKeys.content.detail(id), context.previousContent);
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.content.detail(data.id),
        });
      }
      invalidateQueries.content(queryClient);
    },
  });
}

/**
 * Hook to delete content
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContent,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.lists() });

      const previousList = queryClient.getQueryData<ContentListResponse>(
        queryKeys.content.lists()
      );

      // Optimistically remove from list
      queryClient.setQueryData<ContentListResponse>(
        queryKeys.content.lists(),
        (old) =>
          old
            ? {
                ...old,
                content: old.content.filter((c) => c.id !== id),
                total: old.total - 1,
              }
            : old
      );

      return { previousList };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.content.lists(), context.previousList);
      }
    },
    onSettled: () => {
      invalidateQueries.content(queryClient);
    },
  });
}

/**
 * Hook to generate AI content
 */
export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateContent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.byBrand(data.brandId),
      });
      invalidateQueries.content(queryClient);
      invalidateQueries.gamification(queryClient);
    },
  });
}

/**
 * Hook to publish content
 */
export function usePublishContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/${id}/publish`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to publish content");
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.detail(id) });

      const previousContent = queryClient.getQueryData<Content>(
        queryKeys.content.detail(id)
      );

      queryClient.setQueryData<Content>(queryKeys.content.detail(id), (old) =>
        old
          ? {
              ...old,
              status: "published" as ContentStatus,
              publishedAt: new Date().toISOString(),
            }
          : old
      );

      return { previousContent };
    },
    onError: (_err, id, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(queryKeys.content.detail(id), context.previousContent);
      }
    },
    onSettled: () => {
      invalidateQueries.content(queryClient);
    },
  });
}

/**
 * Hook to schedule content
 */
export function useScheduleContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const response = await fetch(`/api/content/${id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (!response.ok) {
        throw new Error("Failed to schedule content");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.detail(data.id),
      });
      invalidateQueries.content(queryClient);
    },
  });
}

/**
 * Hook to duplicate content
 */
export function useDuplicateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/${id}/duplicate`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to duplicate content");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.byBrand(data.brandId),
      });
      invalidateQueries.content(queryClient);
    },
  });
}

/**
 * Hook to analyze content SEO
 */
export function useAnalyzeContentSEO() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/${id}/analyze`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to analyze content");
      }
      return response.json();
    },
  });
}

// =============================================================================
// AI Suggestions Hooks
// =============================================================================

export interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "structure" | "seo";
  title: string;
  preview: string;
  fullContent: string;
  confidence: number;
}

export interface GenerateSuggestionsInput {
  contentId?: string;
  content?: string;
  type?: ContentType;
  brandId?: string;
  context?: string;
}

async function generateSuggestions(input: GenerateSuggestionsInput): Promise<AISuggestion[]> {
  const response = await fetch("/api/content/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    // Return empty array on error instead of throwing
    return [];
  }
  const data = await response.json();

  // Transform API response format to AISuggestion format
  const rawSuggestions = data.suggestions || [];
  return rawSuggestions.map((s: { type?: string; suggested?: string; explanation?: string; impact?: string }, index: number) => {
    // Map API types to frontend types
    const typeMap: Record<string, AISuggestion["type"]> = {
      seo: "seo",
      readability: "improvement",
      tone: "improvement",
      structure: "structure",
      keywords: "seo",
      engagement: "addition",
      general: "improvement",
    };

    // Map impact to confidence
    const confidenceMap: Record<string, number> = {
      high: 90,
      medium: 70,
      low: 50,
    };

    return {
      id: `suggestion-${Date.now()}-${index}`,
      type: typeMap[s.type || "general"] || "improvement",
      title: s.type ? `${s.type.charAt(0).toUpperCase()}${s.type.slice(1)} Improvement` : "Suggestion",
      preview: s.explanation || "Improve your content",
      fullContent: s.suggested || "",
      confidence: confidenceMap[s.impact || "medium"] || 70,
    };
  });
}

/**
 * Hook to generate AI suggestions for content
 */
export function useGenerateSuggestions() {
  return useMutation({
    mutationFn: generateSuggestions,
  });
}

/**
 * Hook to manage AI suggestions state with refresh capability
 */
export function useAISuggestions(initialInput?: GenerateSuggestionsInput) {
  const generateMutation = useGenerateSuggestions();
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([]);
  const [acceptedIds, setAcceptedIds] = React.useState<Set<string>>(new Set());

  const refresh = React.useCallback(async (input?: GenerateSuggestionsInput) => {
    const result = await generateMutation.mutateAsync(input || initialInput || {});
    setSuggestions(result);
    setAcceptedIds(new Set());
    return result;
  }, [generateMutation, initialInput]);

  const accept = React.useCallback((id: string) => {
    setAcceptedIds((prev) => new Set([...prev, id]));
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clear = React.useCallback(() => {
    setSuggestions([]);
    setAcceptedIds(new Set());
  }, []);

  return {
    suggestions,
    acceptedIds,
    isLoading: generateMutation.isPending,
    error: generateMutation.error,
    refresh,
    accept,
    dismiss,
    clear,
    pendingCount: suggestions.filter((s) => !acceptedIds.has(s.id)).length,
  };
}

// =============================================================================
// Content Stats Hooks
// =============================================================================

/**
 * Hook to fetch content statistics
 */
export function useContentStats(brandId?: string) {
  return useQuery({
    queryKey: ["content", "stats", brandId],
    queryFn: async () => {
      const url = brandId
        ? `/api/content/stats?brandId=${brandId}`
        : "/api/content/stats";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch content stats");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
