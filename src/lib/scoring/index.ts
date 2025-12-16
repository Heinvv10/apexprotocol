/**
 * Scoring Module
 * Unified Digital Presence Score = SEO + GEO + AEO
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

// Unified Score
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
