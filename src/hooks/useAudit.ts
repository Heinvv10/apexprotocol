/**
 * Audit Hooks (F162, F163)
 * Wire Audit UI to real APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import type { AuditStage } from "@/lib/db/schema/audits";

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

export interface StartAuditResponse {
  success: true;
  auditId: string;
  brandId: string;
  jobId: string;
  url: string;
  status: AuditStatus;
  startedAt: string;
  message: string;
}

async function startAudit(input: StartAuditInput): Promise<StartAuditResponse> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || "Failed to start audit");
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
 * Hook to start a new audit (F162).
 *
 * Optimistic UX: we splice the new audit into the byBrand query cache
 * immediately so the "Recent Audits" list and the LiveAuditProgress
 * card show the run before the 5s polling cycle would pick it up.
 * The SSE stream then takes over as the source of truth.
 */
export function useStartAudit() {
  const queryClient = useQueryClient();

  return useMutation<StartAuditResponse, Error, StartAuditInput>({
    mutationFn: startAudit,
    onSuccess: (data) => {
      const optimistic: Audit = {
        id: data.auditId,
        brandId: data.brandId,
        url: data.url,
        status: "pending",
        progress: 5,
        pagesScanned: 0,
        issuesFound: 0,
        criticalIssues: 0,
        startedAt: data.startedAt,
        metadata: {
          progress: {
            stage: "queued" as AuditStage,
            percent: 5,
            message: "Queued…",
            updatedAt: data.startedAt,
          },
        },
      };

      // Prepend into every cached brand-scoped list so the new row shows
      // up regardless of which filter the UI is currently using.
      queryClient.setQueriesData<AuditListResponse>(
        { queryKey: queryKeys.audits.all },
        (prev) => {
          if (!prev || !Array.isArray(prev.audits)) return prev;
          if (prev.audits.some((a) => a.id === optimistic.id)) return prev;
          return {
            ...prev,
            audits: [optimistic, ...prev.audits],
            total: (prev.total ?? prev.audits.length) + 1,
          };
        },
      );

      queryClient.setQueryData<Audit>(
        queryKeys.audits.detail(optimistic.id),
        optimistic,
      );

      toast.success("Audit queued", {
        description: `Analyzing ${data.url}. This usually takes 1–3 minutes.`,
      });

      // Still fire the invalidation so the server reconciles after.
      queryClient.invalidateQueries({
        queryKey: queryKeys.audits.byBrand(data.brandId),
      });
      invalidateQueries.gamification(queryClient);
    },
    onError: (err) => {
      toast.error("Couldn't start audit", {
        description: err.message,
      });
    },
  });
}

// =============================================================================
// Live progress stream (SSE)
// =============================================================================

export interface AuditProgressSnapshot {
  auditId: string;
  status: AuditStatus;
  stage: AuditStage;
  percent: number;
  message?: string;
  pagesCrawled?: number;
  totalPages?: number;
  currentUrl?: string;
  overallScore?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

interface UseAuditStreamResult {
  snapshot: AuditProgressSnapshot | null;
  connected: boolean;
  error: string | null;
}

/**
 * Subscribe to the live progress stream for a single audit. Drives the
 * LiveAuditProgress card. Auto-disconnects on terminal state and also
 * writes the final status into the TanStack cache so other listeners
 * (the Recent Audits list) update without waiting for a refetch.
 */
export function useAuditStream(auditId: string | null): UseAuditStreamResult {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState<AuditProgressSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!auditId) {
      setSnapshot(null);
      setConnected(false);
      setError(null);
      return;
    }

    // Guard against SSR — EventSource is browser-only.
    if (typeof window === "undefined") return;

    const source = new EventSource(`/api/audit/${auditId}/stream`);
    sourceRef.current = source;
    setError(null);

    const applySnapshot = (data: AuditProgressSnapshot) => {
      setSnapshot(data);

      // Reconcile the byBrand list + the detail query so other
      // components don't render a stale status.
      queryClient.setQueriesData<AuditListResponse>(
        { queryKey: queryKeys.audits.all },
        (prev) => {
          if (!prev || !Array.isArray(prev.audits)) return prev;
          let touched = false;
          const audits = prev.audits.map((a) => {
            if (a.id !== data.auditId) return a;
            touched = true;
            return {
              ...a,
              status: data.status,
              progress: data.percent,
              completedAt: data.completedAt ?? a.completedAt,
              overallScore: data.overallScore ?? a.overallScore,
            };
          });
          if (!touched) return prev;
          return { ...prev, audits };
        },
      );

      queryClient.setQueryData<Audit | undefined>(
        queryKeys.audits.detail(data.auditId),
        (prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                progress: data.percent,
                completedAt: data.completedAt ?? prev.completedAt,
                overallScore: data.overallScore ?? prev.overallScore,
              }
            : prev,
      );
    };

    source.addEventListener("open", () => setConnected(true));

    source.addEventListener("progress", (ev) => {
      try {
        applySnapshot(JSON.parse((ev as MessageEvent).data) as AuditProgressSnapshot);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

    source.addEventListener("terminal", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as AuditProgressSnapshot;
        applySnapshot(data);
        // Invalidate so the list/detail get an authoritative refetch
        // once the worker commits the final row.
        queryClient.invalidateQueries({ queryKey: queryKeys.audits.all });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        source.close();
        setConnected(false);
      }
    });

    source.addEventListener("warning", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { message: string };
        // Non-fatal — surface for debugging but don't block the UI.
        setError(data.message);
      } catch {
        /* ignore */
      }
    });

    source.addEventListener("timeout", () => {
      setError("Stream timed out — refresh to reconnect");
      source.close();
      setConnected(false);
    });

    source.onerror = () => {
      // EventSource reconnects by default; only flag an error if the
      // browser has given up (readyState CLOSED).
      if (source.readyState === EventSource.CLOSED) {
        setConnected(false);
      }
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setConnected(false);
    };
  }, [auditId, queryClient]);

  return { snapshot, connected, error };
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
