/**
 * Scoring Module (Phase 7.3)
 * Unified Digital Presence Score = SEO + GEO + AEO + SMO + PPO
 *
 * Components:
 * - SEO: Search Engine Optimization (Google/Bing rankings)
 * - GEO: Generative Engine Optimization (AI platform visibility)
 * - AEO: Answer Engine Optimization (featured snippets, zero-click)
 * - SMO: Social Media Optimization (social reach, engagement, sentiment)
 * - PPO: People Presence Optimization (leadership visibility, thought leadership)
 */

// SEO Score
export {
  calculateSEOScore,
  createDefaultSEOInput,
  type SEOScoreInput,
  type SEOScoreResult,
  type SEOIssue,
} from "./seo-score";

// AEO Score
export {
  calculateAEOScore,
  createDefaultAEOInput,
  type AEOScoreInput,
  type AEOScoreResult,
  type AEOOpportunity,
} from "./aeo-score";

// SMO Score (Social Media Optimization) - Phase 7.3
export {
  calculateSMOScore,
  getSMOScoreStatus,
  getRecommendedPostingFrequency,
  type SMOScoreInput,
  type SMOScoreResult,
} from "./social-score";

// PPO Score (People Presence Optimization) - Phase 7.3
export {
  calculatePPOScore,
  getPPOScoreStatus,
  calculatePersonContribution,
  getPersonRecommendations,
  type PPOScoreInput,
  type PPOScoreResult,
} from "./people-score";

// Unified Score (combines all 5 components)
export {
  calculateUnifiedScore,
  calculateGEOScore,
  getScoreColor,
  getGradeColor,
  formatScore,
  getScoreStatus,
  type GEOScoreInput,
  type GEOScoreResult,
  type UnifiedScoreInput,
  type UnifiedScoreResult,
} from "./unified-score";
