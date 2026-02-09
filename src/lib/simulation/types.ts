import type { AIPlatform, VisibilityScore } from "@/lib/ai/types";

export interface SimulationConfig {
  simulationId: string;
  brandId: string;
  organizationId: string;
  userId: string;
  query: string;
  contentTitle?: string;
  contentBody: string;
  contentType?: string;
  variantBTitle?: string;
  variantBBody?: string;
  platforms: AIPlatform[];
  brandContext: string;
}

export interface PlatformSimulationResult {
  platform: AIPlatform;
  status: "success" | "failed";
  baseline: {
    score: number;
    citations: number;
    response: string;
    breakdown: VisibilityBreakdownData;
  };
  enriched: {
    score: number;
    citations: number;
    response: string;
    breakdown: VisibilityBreakdownData;
  };
  variantB?: {
    score: number;
    citations: number;
    response: string;
    breakdown: VisibilityBreakdownData;
  };
  scoreDelta: number;
  citationDelta: number;
  variantBScoreDelta?: number;
  confidence: number;
  error?: string;
}

export interface VisibilityBreakdownData {
  mentionCount: number;
  citationQuality: number;
  prominence: number;
}

export interface SimulationSummary {
  id: string;
  status: string;
  progress: number;
  avgScoreDelta: number;
  avgConfidence: number;
  platformResults: PlatformSimulationResult[];
  bestPlatform?: string;
  worstPlatform?: string;
  abWinner?: "a" | "b" | "tie";
}
