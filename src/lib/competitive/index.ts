/**
 * Competitive Intelligence Module
 * Phase 5: Complete competitive analysis toolkit
 * Phase 9.1: Auto-discovery and benchmarking
 *
 * Exports:
 * - CompetitiveTracker: Main class for competitive intelligence
 * - Share of Voice calculations
 * - Gap analysis functions
 * - Auto-discovery (Phase 9.1)
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

// Auto-Discovery (Phase 9.1)
export {
  discoverCompetitors,
  storeDiscoveredCompetitors,
  confirmDiscoveredCompetitor,
  rejectDiscoveredCompetitor,
  getDiscoveredCompetitors,
  runDiscoveryProcess,
  type DiscoverySignals,
  type DiscoveredCompetitorResult,
  type DiscoveryOptions,
} from "./discovery";

// Benchmarking (Phase 9.1)
export {
  calculateBenchmark,
  getQuickBenchmarkSummary,
  type BenchmarkMetric,
  type BenchmarkResult,
  type RadarChartData,
  type CompetitorBenchmarkData,
  type BenchmarkOptions,
} from "./benchmarking";

// Snapshot Service (Phase 9.1)
export {
  captureCompetitorSnapshots,
  captureAllBrandSnapshots,
  getCompetitorHistory,
  getLatestSnapshots,
  cleanupOldSnapshots,
  type SnapshotData,
  type SnapshotResult,
} from "./snapshot-service";

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

// Competitor Scoring (Enhanced Competitive Intelligence)
export {
  calculateBrandScores,
  calculateCompetitorScores,
  saveCompetitorScores,
  getCompetitorScores,
  refreshAllCompetitorScores,
  calculateGapAnalysis,
  type CompetitorScoreResult,
  type BrandScoreResult,
  type GapAnalysis,
} from "./competitor-scoring";

// Roadmap Generator (Enhanced Competitive Intelligence)
export {
  generateRoadmap,
  getActiveRoadmap,
  getRoadmapById,
  updateRoadmapStatus,
  updateMilestoneStatus,
  updateActionItemStatus,
  createProgressSnapshot,
  getProgressSnapshots,
  getBrandRoadmaps,
  type RoadmapGenerationOptions,
} from "./roadmap-generator";
