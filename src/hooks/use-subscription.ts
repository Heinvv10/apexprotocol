"use client";

import { useQuery } from "@tanstack/react-query";
import type { Plan } from "@/lib/permissions/feature-gates";

interface SubscriptionData {
  currentPlan: Plan;
  limits: {
    brandLimit: number;
    userLimit: number;
    features: string[];
    price: number;
    name: string;
  };
}

interface SubscriptionResponse {
  success: boolean;
  data?: SubscriptionData;
  error?: string;
}

/**
 * Hook to fetch and cache the current subscription plan
 */
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async (): Promise<SubscriptionData> => {
      const res = await fetch("/api/settings/subscription");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription");
      }
      const json: SubscriptionResponse = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Failed to fetch subscription");
      }
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to get just the current plan
 * Returns 'starter' as fallback during loading/error
 */
export function useCurrentPlan(): Plan {
  const { data } = useSubscription();
  return data?.currentPlan ?? "starter";
}

/**
 * Hook to check if the current plan has a specific feature
 */
export function usePlanFeature(feature: string): boolean {
  const { data } = useSubscription();
  return data?.limits.features.includes(feature) ?? false;
}
