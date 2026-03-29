/**
 * Audit Hooks (F162, F163)
 * Wire Audit UI to real APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";

// =============================================================================
// Types
// =============================================================================

// Status values match DB enum: pending, in_progress, completed, failed
export type AuditStatus = "pending" | "in_progress" | "completed" | "failed";

export interface Audit {
  id: string;
  brandId: string;
  url: string;
  status: AuditStatus;
  progress?: number;
  overallScore?: number;
  technicalScore?: number;
  contentScore?: number;
  authorityScore?: number;
  aiReadinessScore?: number;
  pagesScanned: number;
  issuesFound: number;
  criticalIssues: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  // Issues embedded in audit response
  issues?: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    severity: "critical" | "high" | "medium" | "low";
    impact?: string;
    affectedPages?: string[];
    recommendation?: string;
    url?: string;
  }>;
  categoryScores?: Array<{
    category: string;
    score: number;
    maxScore: number;
    issues: number;
  }>;
}

export interface AuditIssue {
  id: string;
  auditId: string;
  category: "technical" | "content" | "authority" | "ai_readiness";
  severity: "critical" | "high" | "medium" | "low" | "info";
  type: string;
  title: string;
  description: string;
  url?: string;
  recommendation: string;
  impact: string;
  effort: "low" | "medium" | "high";
  status: "open" | "fixed" | "ignored";
  metadata?: Record<string, unknown>;
}

export interface AuditFilters {
  brandId?: string;
  status?: AuditStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface StartAuditInput {
  brandId: string;
  url: string;
  options?: {
    depth?: number;
    maxPages?: number;
    includeSubdomains?: boolean;
    checkMobile?: boolean;
    checkAccessibility?: boolean;
  };
}

export interface AuditListResponse {
  audits: Audit[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchAudits(filters: AuditFilters = {}): Promise<AuditListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/audit?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch audits");
  }
  return response.json();
}

async function fetchAudit(id: string): Promise<Audit> {
  const response = await fetch(`/api/audit/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch audit");
  }
  const data = await response.json();
  // API returns { success: true, audit: {...} }
  return data.audit || data;
}

async function fetchAuditIssues(auditId: string): Promise<AuditIssue[]> {
  const response = await fetch(`/api/audit/${auditId}/issues`);
  if (!response.ok) {
    throw new Error("Failed to fetch audit issues");
  }
  const data = await response.json();
  return data.issues || data;
}

async function startAudit(input: StartAuditInput): Promise<Audit> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to start audit");
  }
  return response.json();
}

// =============================================================================
// Audit List Hooks
// =============================================================================

/**
 * Hook to fetch audits with filters
 */
export function useAudits(
  filters: AuditFilters = {},
  options?: Omit<UseQueryOptions<AuditListResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.audits.list(filters as Record<string, unknown>),
    queryFn: () => fetchAudits(filters),
    staleTime: 1000 * 30, // 30 seconds (audits change frequently)
    refetchInterval: (query) => {
      // Refetch more frequently if there are pending/in-progress audits
      const data = query.state.data;
      const hasPending = data?.audits?.some(
        (a) => a.status === "pending" || a.status === "in_progress"
      );
      return hasPending ? 5000 : 60000; // 5s if pending, 1min otherwise
    },
    ...options,
  });
}

/**
 * Hook to fetch audits by brand
 */
export function useAuditsByBrand(brandId: string, filters: Omit<AuditFilters, "brandId"> = {}) {
  return useAudits({ ...filters, brandId });
}

/**
 * Hook to fetch single audit
 */
export function useAudit(
  id: string,
  options?: Omit<UseQueryOptions<Audit>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.audits.detail(id),
    queryFn: () => fetchAudit(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Refetch frequently while audit is in progress
      if (status === "in_progress" || status === "pending") {
        return 3000; // 3 seconds
      }
      return false;
    },
    ...options,
  });
}

/**
 * Hook to fetch audit issues
 */
export function useAuditIssues(
  auditId: string,
  options?: Omit<UseQueryOptions<AuditIssue[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.audits.issues(auditId),
    queryFn: () => fetchAuditIssues(auditId),
    enabled: !!auditId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

// =============================================================================
// Audit Mutation Hooks
// =============================================================================

/**
 * Hook to start a new audit (F162)
 */
export function useStartAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startAudit,
    onSuccess: (data) => {
      // Add to brand audits list
      queryClient.invalidateQueries({
        queryKey: queryKeys.audits.byBrand(data.brandId),
      });
      // Update gamification (audit started)
      invalidateQueries.gamification(queryClient);
    },
  });
}

/**
 * Hook to cancel an audit
 */
export function useCancelAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auditId: string) => {
      const response = await fetch(`/api/audit/${auditId}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel audit");
      }
      return response.json();
    },
    onMutate: async (auditId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.audits.detail(auditId) });
      const previousAudit = queryClient.getQueryData<Audit>(
        queryKeys.audits.detail(auditId)
      );
      queryClient.setQueryData<Audit>(queryKeys.audits.detail(auditId), (old) =>
        old ? { ...old, status: "failed" as AuditStatus } : old
      );
      return { previousAudit };
    },
    onError: (_err, auditId, context) => {
      if (context?.previousAudit) {
        queryClient.setQueryData(queryKeys.audits.detail(auditId), context.previousAudit);
      }
    },
    onSettled: () => {
      invalidateQueries.audits(queryClient);
    },
  });
}

/**
 * Hook to retry a failed audit
 */
export function useRetryAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auditId: string) => {
      const response = await fetch(`/api/audit/${auditId}/retry`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to retry audit");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateQueries.audits(queryClient);
    },
  });
}

/**
 * Hook to update issue status
 */
export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auditId,
      issueId,
      status,
    }: {
      auditId: string;
      issueId: string;
      status: AuditIssue["status"];
    }) => {
      const response = await fetch(`/api/audit/${auditId}/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update issue status");
      }
      return response.json();
    },
    onMutate: async ({ auditId, issueId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.audits.issues(auditId) });
      const previousIssues = queryClient.getQueryData<AuditIssue[]>(
        queryKeys.audits.issues(auditId)
      );
      queryClient.setQueryData<AuditIssue[]>(
        queryKeys.audits.issues(auditId),
        (old) => old?.map((i) => (i.id === issueId ? { ...i, status } : i))
      );
      return { previousIssues };
    },
    onError: (_err, { auditId }, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(queryKeys.audits.issues(auditId), context.previousIssues);
      }
    },
    onSettled: (_, __, { auditId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audits.issues(auditId) });
    },
  });
}

/**
 * Hook to delete an audit
 */
export function useDeleteAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auditId: string) => {
      const response = await fetch(`/api/audit/${auditId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete audit");
      }
    },
    onSettled: () => {
      invalidateQueries.audits(queryClient);
    },
  });
}

/**
 * Hook to export audit report
 */
export function useExportAuditReport() {
  return useMutation({
    mutationFn: async ({
      auditId,
      format,
    }: {
      auditId: string;
      format: "pdf" | "csv" | "json";
    }) => {
      const response = await fetch(`/api/audit/${auditId}/export?format=${format}`);
      if (!response.ok) {
        throw new Error("Failed to export audit report");
      }
      return response.blob();
    },
  });
}
