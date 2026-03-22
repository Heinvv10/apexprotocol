// smart-engine.ts — compatibility shim
// These types/functions live in engine.ts and types.ts

export type { RecommendationCategory } from "./engine";
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
