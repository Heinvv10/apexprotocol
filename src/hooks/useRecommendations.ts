/**
 * Recommendations Hooks (F164, F165, F166)
 * Wire Recommendations UI to real APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type RecommendationStatus = "pending" | "in_progress" | "completed" | "dismissed";
export type RecommendationCategory = "technical" | "content" | "authority" | "ai_readiness";

export interface Recommendation {
  id: string;
  brandId: string;
  auditId?: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  impact: number; // 1-10 score
  effort: "low" | "medium" | "high";
  estimatedTime?: string;
  actionUrl?: string;
  tags?: string[];
  order?: number;
  assigneeId?: string;
  dueDate?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationFilters {
  brandId?: string;
  auditId?: string;
  category?: RecommendationCategory;
  priority?: RecommendationPriority;
  status?: RecommendationStatus;
  assigneeId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface RecommendationListResponse {
  recommendations: Recommendation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: {
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface KanbanColumn {
  id: RecommendationStatus;
  title: string;
  items: Recommendation[];
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchRecommendations(
  filters: RecommendationFilters = {}
): Promise<RecommendationListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/recommendations?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  const json = await response.json();

  // Transform API response format to expected format
  const recommendations = json.data || json.recommendations || [];
  const total = json.meta?.total ?? json.total ?? recommendations.length;
  const limit = json.meta?.limit ?? json.limit ?? filters.limit ?? 50;
  const offset = json.meta?.offset ?? 0;
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    recommendations,
    total,
    page,
    limit,
    totalPages,
    stats: json.stats,
  };
}

async function fetchRecommendation(id: string): Promise<Recommendation> {
  const response = await fetch(`/api/recommendations/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recommendation");
  }
  return response.json();
}

async function updateRecommendation(
  id: string,
  data: Partial<Recommendation>
): Promise<Recommendation> {
  const response = await fetch(`/api/recommendations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update recommendation");
  }
  return response.json();
}

// =============================================================================
// Recommendation List Hooks (F164)
// =============================================================================

/**
 * Hook to fetch recommendations with filters
 */
export function useRecommendations(
  filters: RecommendationFilters = {},
  options?: Omit<UseQueryOptions<RecommendationListResponse>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: queryKeys.recommendations.list(filters as Record<string, unknown>),
    queryFn: () => fetchRecommendations(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!orgId || !!filters.brandId,
    ...options,
  });
}

/**
 * Hook to fetch recommendations by brand
 */
export function useRecommendationsByBrand(
  brandId: string,
  filters: Omit<RecommendationFilters, "brandId"> = {}
) {
  return useRecommendations({ ...filters, brandId });
}

/**
 * Hook to fetch recommendations by audit
 */
export function useRecommendationsByAudit(
  auditId: string,
  filters: Omit<RecommendationFilters, "auditId"> = {}
) {
  return useRecommendations({ ...filters, auditId });
}

/**
 * Hook to fetch single recommendation
 */
export function useRecommendation(
  id: string,
  options?: Omit<UseQueryOptions<Recommendation>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.recommendations.detail(id),
    queryFn: () => fetchRecommendation(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch recommendations as Kanban board
 */
export function useRecommendationsKanban(brandId: string) {
  const { data, ...rest } = useRecommendations({ brandId, limit: 100 });

  const columns: KanbanColumn[] = [
    { id: "pending", title: "To Do", items: [] },
    { id: "in_progress", title: "In Progress", items: [] },
    { id: "completed", title: "Done", items: [] },
    { id: "dismissed", title: "Dismissed", items: [] },
  ];

  if (data?.recommendations) {
    data.recommendations.forEach((rec) => {
      const column = columns.find((c) => c.id === rec.status);
      if (column) {
        column.items.push(rec);
      }
    });

    // Sort items by order within each column
    columns.forEach((column) => {
      column.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
  }

  return {
    ...rest,
    data: { columns, total: data?.total ?? 0, stats: data?.stats },
  };
}

// =============================================================================
// Recommendation Mutation Hooks (F165)
// =============================================================================

/**
 * Hook to update recommendation status
 */
export function useUpdateRecommendationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: RecommendationStatus;
    }) => {
      const response = await fetch(`/api/recommendations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      return response.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.recommendations.detail(id),
      });

      const previousRecommendation = queryClient.getQueryData<Recommendation>(
        queryKeys.recommendations.detail(id)
      );

      queryClient.setQueryData<Recommendation>(
        queryKeys.recommendations.detail(id),
        (old) =>
          old
            ? {
                ...old,
                status,
                completedAt: status === "completed" ? new Date().toISOString() : undefined,
              }
            : old
      );

      return { previousRecommendation };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousRecommendation) {
        queryClient.setQueryData(
          queryKeys.recommendations.detail(id),
          context.previousRecommendation
        );
      }
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
      invalidateQueries.gamification(queryClient);
    },
  });
}

/**
 * Hook to update recommendation
 */
export function useUpdateRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Recommendation> }) =>
      updateRecommendation(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.recommendations.detail(id),
      });

      const previousRecommendation = queryClient.getQueryData<Recommendation>(
        queryKeys.recommendations.detail(id)
      );

      queryClient.setQueryData<Recommendation>(
        queryKeys.recommendations.detail(id),
        (old) =>
          old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old
      );

      return { previousRecommendation };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousRecommendation) {
        queryClient.setQueryData(
          queryKeys.recommendations.detail(id),
          context.previousRecommendation
        );
      }
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

/**
 * Hook to complete recommendation
 */
export function useCompleteRecommendation() {
  const updateStatus = useUpdateRecommendationStatus();

  return (id: string) => updateStatus.mutateAsync({ id, status: "completed" });
}

/**
 * Hook to dismiss recommendation
 */
export function useDismissRecommendation() {
  const updateStatus = useUpdateRecommendationStatus();

  return (id: string) => updateStatus.mutateAsync({ id, status: "dismissed" });
}

/**
 * Hook to assign recommendation to user
 */
export function useAssignRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      assigneeId,
    }: {
      id: string;
      assigneeId: string | null;
    }) => {
      const response = await fetch(`/api/recommendations/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!response.ok) {
        throw new Error("Failed to assign recommendation");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

/**
 * Hook to set recommendation due date
 */
export function useSetRecommendationDueDate() {
  const updateRecommendation = useUpdateRecommendation();

  return (id: string, dueDate: string | null) =>
    updateRecommendation.mutateAsync({ id, data: { dueDate: dueDate ?? undefined } });
}

// =============================================================================
// Kanban Drag & Drop Hooks (F166)
// =============================================================================

/**
 * Hook to handle Kanban card move
 */
export function useMoveRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      order,
    }: {
      id: string;
      status: RecommendationStatus;
      order: number;
    }) => {
      const response = await fetch(`/api/recommendations/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, order }),
      });
      if (!response.ok) {
        throw new Error("Failed to move recommendation");
      }
      return response.json();
    },
    onMutate: async ({ id, status, order }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.recommendations.lists() });

      // Snapshot the previous value
      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.recommendations.lists(),
      });

      // Optimistically update the recommendation
      queryClient.setQueriesData<RecommendationListResponse>(
        { queryKey: queryKeys.recommendations.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            recommendations: old.recommendations.map((rec) =>
              rec.id === id ? { ...rec, status, order } : rec
            ),
          };
        }
      );

      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      // Restore previous state on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

/**
 * Hook to reorder recommendations within a column
 */
export function useReorderRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      status,
      orderedIds,
    }: {
      status: RecommendationStatus;
      orderedIds: string[];
    }) => {
      const response = await fetch("/api/recommendations/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, orderedIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to reorder recommendations");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

/**
 * Hook to bulk update recommendations
 */
export function useBulkUpdateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: Partial<Pick<Recommendation, "status" | "priority" | "assigneeId">>;
    }) => {
      const response = await fetch("/api/recommendations/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, ...updates }),
      });
      if (!response.ok) {
        throw new Error("Failed to bulk update recommendations");
      }
      return response.json();
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

// =============================================================================
// Recommendation Stats Hooks
// =============================================================================

/**
 * Hook to fetch recommendation statistics
 */
export function useRecommendationStats(brandId?: string) {
  return useQuery({
    queryKey: ["recommendations", "stats", brandId],
    queryFn: async () => {
      const url = brandId
        ? `/api/recommendations/stats?brandId=${brandId}`
        : "/api/recommendations/stats";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch recommendation stats");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch recommendation progress
 */
export function useRecommendationProgress(brandId: string) {
  const { data } = useRecommendations({ brandId });

  const total = data?.total ?? 0;
  const completed = data?.recommendations?.filter(
    (r) => r.status === "completed"
  ).length ?? 0;
  const inProgress = data?.recommendations?.filter(
    (r) => r.status === "in_progress"
  ).length ?? 0;
  const pending = data?.recommendations?.filter(
    (r) => r.status === "pending"
  ).length ?? 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
