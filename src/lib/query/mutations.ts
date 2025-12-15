/**
 * TanStack Query Mutations (F153)
 * Optimistic updates for create/update/delete operations
 */

import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface MutationContext<T> {
  previousData: T;
  optimisticData?: T;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Generic fetch wrapper
async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

// =============================================================================
// Brand Mutations
// =============================================================================

export interface BrandInput {
  name: string;
  domain?: string;
  description?: string;
  keywords?: string[];
  competitors?: string[];
  settings?: Record<string, unknown>;
}

export function useCreateBrand(
  options?: UseMutationOptions<unknown, Error, BrandInput, MutationContext<unknown>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BrandInput) =>
      apiFetch("/api/brands", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateQueries.brands(queryClient);
    },
    ...options,
  });
}

export function useUpdateBrand(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; data: Partial<BrandInput> },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      apiFetch(`/api/brands/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.brands.detail(id) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKeys.brands.detail(id));

      // Optimistically update
      queryClient.setQueryData(queryKeys.brands.detail(id), (old: unknown) =>
        old ? { ...old, ...data } : old
      );

      return { previousData };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.brands.detail(id), context.previousData);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
    },
    ...options,
  });
}

export function useDeleteBrand(
  options?: UseMutationOptions<unknown, Error, string, MutationContext<unknown[]>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/brands/${id}`, {
        method: "DELETE",
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.brands.lists() });
      const previousData = queryClient.getQueryData<unknown[]>(queryKeys.brands.lists()) || [];

      // Optimistically remove from list
      queryClient.setQueryData(queryKeys.brands.lists(), (old: unknown[] | undefined) =>
        old ? old.filter((b) => (b as { id?: string }).id !== id) : []
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.brands.lists(), context.previousData);
      }
    },
    onSettled: () => {
      invalidateQueries.brands(queryClient);
    },
    ...options,
  });
}

// =============================================================================
// Mention Mutations
// =============================================================================

export interface MentionUpdateInput {
  sentiment?: "positive" | "negative" | "neutral";
  status?: "new" | "reviewed" | "actioned" | "archived";
  notes?: string;
  tags?: string[];
}

export function useUpdateMention(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; data: MentionUpdateInput },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      apiFetch(`/api/monitor/mentions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mentions.detail(id) });
      const previousData = queryClient.getQueryData(queryKeys.mentions.detail(id));

      queryClient.setQueryData(queryKeys.mentions.detail(id), (old: unknown) =>
        old ? { ...old, ...data } : old
      );

      return { previousData };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.mentions.detail(id), context.previousData);
      }
    },
    onSettled: () => {
      invalidateQueries.mentions(queryClient);
    },
    ...options,
  });
}

export function useBulkUpdateMentions(
  options?: UseMutationOptions<
    unknown,
    Error,
    { ids: string[]; data: MentionUpdateInput },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }) =>
      apiFetch("/api/monitor/mentions/bulk", {
        method: "PATCH",
        body: JSON.stringify({ ids, ...data }),
      }),
    onSettled: () => {
      invalidateQueries.mentions(queryClient);
    },
    ...options,
  });
}

// =============================================================================
// Audit Mutations
// =============================================================================

export interface AuditInput {
  brandId: string;
  url: string;
  options?: {
    depth?: number;
    maxPages?: number;
    includeSubdomains?: boolean;
  };
}

export function useStartAudit(
  options?: UseMutationOptions<unknown, Error, AuditInput, MutationContext<unknown>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AuditInput) =>
      apiFetch("/api/audit", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audits.byBrand(brandId) });
    },
    ...options,
  });
}

export function useCancelAudit(
  options?: UseMutationOptions<unknown, Error, string, MutationContext<unknown>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auditId: string) =>
      apiFetch(`/api/audit/${auditId}/cancel`, {
        method: "POST",
      }),
    onSettled: () => {
      invalidateQueries.audits(queryClient);
    },
    ...options,
  });
}

// =============================================================================
// Recommendation Mutations
// =============================================================================

export interface RecommendationUpdateInput {
  status?: "pending" | "in_progress" | "completed" | "dismissed";
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
}

export function useUpdateRecommendation(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; data: RecommendationUpdateInput },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      apiFetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recommendations.detail(id) });
      const previousData = queryClient.getQueryData(queryKeys.recommendations.detail(id));

      queryClient.setQueryData(queryKeys.recommendations.detail(id), (old: unknown) =>
        old ? { ...old, ...data } : old
      );

      return { previousData };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.recommendations.detail(id), context.previousData);
      }
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
      invalidateQueries.gamification(queryClient); // Completing recommendations gives XP
    },
    ...options,
  });
}

export function useCompleteRecommendation(
  options?: UseMutationOptions<unknown, Error, string, MutationContext<unknown>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/recommendations/${id}/complete`, {
        method: "POST",
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recommendations.detail(id) });
      const previousData = queryClient.getQueryData(queryKeys.recommendations.detail(id));

      queryClient.setQueryData(queryKeys.recommendations.detail(id), (old: { status?: string }) =>
        old ? { ...old, status: "completed" } : old
      );

      return { previousData };
    },
    onError: (_err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.recommendations.detail(id), context.previousData);
      }
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
      invalidateQueries.gamification(queryClient);
    },
    ...options,
  });
}

export function useDismissRecommendation(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; reason?: string },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) =>
      apiFetch(`/api/recommendations/${id}/dismiss`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onMutate: async ({ id }) => {
      const previousData = queryClient.getQueryData(queryKeys.recommendations.detail(id));

      queryClient.setQueryData(queryKeys.recommendations.detail(id), (old: { status?: string }) =>
        old ? { ...old, status: "dismissed" } : old
      );

      return { previousData };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.recommendations.detail(id), context.previousData);
      }
    },
    onSettled: () => {
      invalidateQueries.recommendations(queryClient);
    },
    ...options,
  });
}

// =============================================================================
// Content Mutations
// =============================================================================

export interface ContentInput {
  brandId: string;
  title: string;
  type: "blog" | "social" | "faq" | "product" | "landing" | "email";
  content?: string;
  keywords?: string[];
  targetPlatform?: string;
}

export function useCreateContent(
  options?: UseMutationOptions<unknown, Error, ContentInput, MutationContext<unknown>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContentInput) =>
      apiFetch("/api/content", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.byBrand(brandId) });
      invalidateQueries.gamification(queryClient);
    },
    ...options,
  });
}

export function useUpdateContent(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; data: Partial<ContentInput> },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      apiFetch(`/api/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.detail(id) });
      const previousData = queryClient.getQueryData(queryKeys.content.detail(id));

      queryClient.setQueryData(queryKeys.content.detail(id), (old: unknown) =>
        old ? { ...old, ...data } : old
      );

      return { previousData };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.content.detail(id), context.previousData);
      }
    },
    onSettled: () => {
      invalidateQueries.content(queryClient);
    },
    ...options,
  });
}

export function useDeleteContent(
  options?: UseMutationOptions<unknown, Error, string, MutationContext<unknown[]>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/content/${id}`, {
        method: "DELETE",
      }),
    onSettled: () => {
      invalidateQueries.content(queryClient);
    },
    ...options,
  });
}

export function useGenerateContent(
  options?: UseMutationOptions<
    unknown,
    Error,
    { brandId: string; prompt: string; type: string },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) =>
      apiFetch("/api/content/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.byBrand(brandId) });
      invalidateQueries.gamification(queryClient);
    },
    ...options,
  });
}

// =============================================================================
// Settings Mutations
// =============================================================================

export function useUpdateOrganizationSettings(
  options?: UseMutationOptions<
    unknown,
    Error,
    { orgId: string; data: Record<string, unknown> },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) =>
      apiFetch(`/api/settings/organization/${orgId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.organization(orgId) });
    },
    ...options,
  });
}

export function useUpdateUserSettings(
  options?: UseMutationOptions<
    unknown,
    Error,
    Record<string, unknown>,
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiFetch("/api/settings/user", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
    },
    ...options,
  });
}

// =============================================================================
// Gamification Mutations
// =============================================================================

export function useRecordAction(
  options?: UseMutationOptions<
    unknown,
    Error,
    { actionType: string; metadata?: Record<string, unknown> },
    MutationContext<unknown>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) =>
      apiFetch("/api/gamification", {
        method: "POST",
        body: JSON.stringify({ action: "record", ...input }),
      }),
    onSuccess: () => {
      invalidateQueries.gamification(queryClient);
    },
    ...options,
  });
}

export function useRecordLogin(
  options?: UseMutationOptions<unknown, Error, void, MutationContext<unknown>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch("/api/gamification", {
        method: "POST",
        body: JSON.stringify({ action: "login" }),
      }),
    onSuccess: () => {
      invalidateQueries.gamification(queryClient);
    },
    ...options,
  });
}
