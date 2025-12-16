/**
 * Competitive Intelligence Module
 * Phase 5: Complete competitive analysis toolkit
 *
 * Exports:
 * - CompetitiveTracker: Main class for competitive intelligence
 * - Share of Voice calculations
 * - Gap analysis functions
 */

// Main tracker
export {
  CompetitiveTracker,
  createCompetitiveTracker,
  getQuickSOV,
  type CompetitorAnalysis,
  type PlatformBreakdown,
  type ShareOfVoiceResult,
  type GapAnalysisResult,
  type CompetitiveGapItem,
  type CompetitiveIntelligence,
  type CompetitiveAlertItem,
} from "./tracker";

// Share of Voice
export {
  calculateSOV,
  storeDailySOV,
  getSOVTrend,
  compareWithCompetitor,
  type SOVPeriod,
  type PlatformSOV,
  type SOVSnapshot,
  type SOVTrend,
} from "./share-of-voice";

// Gap Analysis
export {
  analyzeGaps,
  storeGaps,
  getExistingGaps,
  resolveGap,
  getCompetitorCoverage,
  getGapTrends,
  GAP_TYPES,
  type GapType,
  type GapOpportunity,
  type GapAnalysisReport,
  type CompetitorCoverage,
} from "./gap-analyzer";
