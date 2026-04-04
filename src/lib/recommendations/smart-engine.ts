// smart-engine.ts — compatibility shim
// These types/functions live in engine.ts and types.ts

import type { RecommendationCategory } from "./types";
export type { RecommendationCategory };
export type ImpactLevel = "high" | "medium" | "low";
export type EffortLevel = "high" | "medium" | "low";

export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: number;
}

export { generateRecommendations as generateSmartRecommendations } from "./engine";

export async function completeRecommendation(
  id: string,
  feedback?: { rating?: number; notes?: string },
): Promise<void> {
  // No-op stub - completion tracking not yet implemented
  void id;
  void feedback;
}

export async function getRecommendationEffectiveness(
  id: string,
): Promise<{ completed: boolean; impact?: number }> {
  void id;
  return { completed: false };
}
