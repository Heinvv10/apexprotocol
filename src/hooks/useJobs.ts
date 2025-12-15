/**
 * Jobs Hooks (F180)
 * Wire job dashboard to BullMQ status API
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// =============================================================================
// Types
// =============================================================================

export type JobStatus = "queued" | "running" | "completed" | "failed" | "paused";
export type JobType = "scan" | "audit" | "content" | "export" | "sync";
export type JobPriority = "low" | "normal" | "high" | "critical";

export interface Job {
  id: string;
  name: string;
  type: JobType;
  status: JobStatus;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  priority: JobPriority;
  createdBy: string;
  queueName?: string;
  metadata?: Record<string, string>;
}

export interface JobStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  paused: number;
}

export interface QueueStats {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface JobsResponse {
  jobs: Job[];
  stats: JobStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  queues: QueueStats[];
}

export interface JobsFilter {
  status?: JobStatus | "all";
  queue?: string | "all";
  limit?: number;
  offset?: number;
}

export type JobAction = "retry" | "pause" | "resume" | "cancel";

// =============================================================================
// API Functions
// =============================================================================

async function fetchJobs(filter: JobsFilter = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (filter.status && filter.status !== "all") {
    params.set("status", filter.status);
  }
  if (filter.queue && filter.queue !== "all") {
    params.set("queue", filter.queue);
  }
  if (filter.limit) {
    params.set("limit", filter.limit.toString());
  }
  if (filter.offset) {
    params.set("offset", filter.offset.toString());
  }

  const url = `/api/jobs${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch jobs");
  }

  return response.json();
}

async function performJobAction(
  jobId: string,
  action: JobAction,
  queueName?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, jobId, queue: queueName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to ${action} job`);
  }

  return response.json();
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch jobs with optional filtering
 */
export function useJobs(filter: JobsFilter = {}) {
  return useQuery({
    queryKey: ["jobs", filter],
    queryFn: () => fetchJobs(filter),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    staleTime: 2000,
  });
}

/**
 * Hook to fetch job statistics only
 */
export function useJobStats() {
  return useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: async () => {
      const response = await fetchJobs({ limit: 1 });
      return response.stats;
    },
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

/**
 * Hook to retry a failed job
 */
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, queueName }: { jobId: string; queueName?: string }) =>
      performJobAction(jobId, "retry", queueName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to pause a running job
 */
export function usePauseJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, queueName }: { jobId: string; queueName?: string }) =>
      performJobAction(jobId, "pause", queueName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to resume a paused job
 */
export function useResumeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, queueName }: { jobId: string; queueName?: string }) =>
      performJobAction(jobId, "resume", queueName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to cancel a job
 */
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, queueName }: { jobId: string; queueName?: string }) =>
      performJobAction(jobId, "cancel", queueName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook for queue-specific jobs
 */
export function useQueueJobs(queueName: string, filter: Omit<JobsFilter, "queue"> = {}) {
  return useJobs({ ...filter, queue: queueName });
}

/**
 * Hook to manually refresh jobs
 */
export function useRefreshJobs() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };
}
