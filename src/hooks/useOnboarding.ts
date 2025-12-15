/**
 * Onboarding Hooks
 * Manage onboarding progress tracking for organizations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/client";
import { OnboardingStatus } from "@/lib/db/schema";

// =============================================================================
// Types
// =============================================================================

export interface OnboardingStatusResponse {
  status: OnboardingStatus;
  organizationId: string;
}

export interface UpdateOnboardingStatusParams {
  brandAdded?: boolean;
  monitoringConfigured?: boolean;
  auditRun?: boolean;
  recommendationsReviewed?: boolean;
  dismissedAt?: string | null;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchOnboardingStatus(): Promise<OnboardingStatusResponse> {
  const response = await fetch("/api/onboarding/status", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch onboarding status");
  }

  return response.json();
}

async function updateOnboardingStatus(
  params: UpdateOnboardingStatusParams
): Promise<OnboardingStatusResponse> {
  const response = await fetch("/api/onboarding/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to update onboarding status");
  }

  return response.json();
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Get onboarding status for current organization
 */
export function useOnboardingStatus(
  options?: Omit<UseQueryOptions<OnboardingStatusResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: fetchOnboardingStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Update onboarding status
 */
export function useUpdateOnboardingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOnboardingStatus,
    onSuccess: (data) => {
      // Update cache with new status
      queryClient.setQueryData(queryKeys.onboarding.status(), data);
    },
    onError: (error: Error) => {
      console.error("Failed to update onboarding status:", error.message);
    },
  });
}

/**
 * Mark brand as added
 */
export function useMarkBrandAdded() {
  const { mutate, ...rest } = useUpdateOnboardingStatus();

  const markBrandAdded = () => {
    mutate({ brandAdded: true });
  };

  return { markBrandAdded, ...rest };
}

/**
 * Mark monitoring as configured
 */
export function useMarkMonitoringConfigured() {
  const { mutate, ...rest } = useUpdateOnboardingStatus();

  const markMonitoringConfigured = () => {
    mutate({ monitoringConfigured: true });
  };

  return { markMonitoringConfigured, ...rest };
}

/**
 * Mark audit as run
 */
export function useMarkAuditRun() {
  const { mutate, ...rest } = useUpdateOnboardingStatus();

  const markAuditRun = () => {
    mutate({ auditRun: true });
  };

  return { markAuditRun, ...rest };
}

/**
 * Mark recommendations as reviewed
 */
export function useMarkRecommendationsReviewed() {
  const { mutate, ...rest } = useUpdateOnboardingStatus();

  const markRecommendationsReviewed = () => {
    mutate({ recommendationsReviewed: true });
  };

  return { markRecommendationsReviewed, ...rest };
}

/**
 * Dismiss onboarding checklist
 */
export function useDismissOnboarding() {
  const { mutate, ...rest } = useUpdateOnboardingStatus();

  const dismissOnboarding = () => {
    mutate({ dismissedAt: new Date().toISOString() });
  };

  return { dismissOnboarding, ...rest };
}

/**
 * Calculate onboarding progress percentage
 */
export function useOnboardingProgress() {
  const { data } = useOnboardingStatus();

  if (!data) {
    return {
      progress: 0,
      completedSteps: 0,
      totalSteps: 4,
      isComplete: false,
    };
  }

  const steps = [
    data.status.brandAdded,
    data.status.monitoringConfigured,
    data.status.auditRun,
    data.status.recommendationsReviewed,
  ];

  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const isComplete = completedSteps === totalSteps;

  return {
    progress,
    completedSteps,
    totalSteps,
    isComplete,
    status: data.status,
  };
}
