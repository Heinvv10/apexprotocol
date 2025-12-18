/**
 * Feedback Hook - Knowledge Graph Corrections
 * Fetches hallucinations, deployed fixes, and verified corrections
 */

import { useQuery } from "@tanstack/react-query";

// Response types matching component expectations
// Uses types from @/components/feedback but redefines for API response
export interface HallucinationData {
  id: string;
  platform: string;
  title: string;
  description: string;
  predictedPickup?: string;
  progress?: number;
}

export interface FixDeployedData {
  id: string;
  platform: string;
  title: string;
  correction: string;
  channels: string[];
  deployedAt: string;
}

export interface VerifiedData {
  id: string;
  platform: string;
  title: string;
  verifiedStatement: string;
  verifiedAt: string;
  source: string;
}

interface FeedbackResponse {
  success: boolean;
  hallucinations: HallucinationData[];
  fixesDeployed: FixDeployedData[];
  verified: VerifiedData[];
  meta?: {
    totalNegativeMentions: number;
  };
}

/**
 * Hook to fetch feedback/hallucination data
 */
export function useFeedback(brandId?: string, limit = 20) {
  return useQuery<FeedbackResponse>({
    queryKey: ["feedback", brandId || "all", limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (brandId) params.set("brandId", brandId);
      params.set("limit", String(limit));

      const response = await fetch(`/api/feedback?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback data");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
