/**
 * Social Media Correlation Sub-Agent
 *
 * A comprehensive sub-agent for monitoring, analyzing, and correlating
 * brand mentions across social media and AI platforms.
 *
 * Services:
 * - MentionTrackingService: Track and collect brand mentions
 * - SentimentAnalysisService: Analyze sentiment of mentions
 * - CorrelationEngineService: Link mentions across platforms
 * - NarrativeDetectionService: Detect emerging narratives and trends
 * - ReputationIntelligenceService: Calculate reputation scores
 * - InfluencerAnalysisService: Identify and track influencers
 *
 * Main Orchestrator:
 * - SocialMediaCorrelationSubAgent: Coordinates all services
 */

// Main orchestrator
export {
  SocialMediaCorrelationSubAgent,
  createSocialMediaCorrelationSubAgent,
  type SocialMediaCorrelationConfig,
  type AnalysisResult,
  type Alert,
  type SubAgentStatus,
} from './social-media-correlation-sub-agent';

// Mention Tracking Service
export {
  MentionTrackingService,
  createMentionTrackingService,
  type MentionTrackingConfig,
  type Mention,
  type MentionFilter,
  type BrandConfig,
  type TrackingStatus,
  type PlatformStatus,
} from './services/mention-tracking-service';

// Sentiment Analysis Service
export {
  SentimentAnalysisService,
  createSentimentAnalysisService,
  type SentimentConfig,
  type SentimentResult,
  type SentimentTrend,
  type EmotionResult,
} from './services/sentiment-analysis-service';

// Correlation Engine Service
export {
  CorrelationEngineService,
  createCorrelationEngineService,
  type CorrelationEngineConfig,
  type CorrelatedMentionPair,
  type CorrelationCluster,
  type CorrelationStats,
} from './services/correlation-engine-service';

// Narrative Detection Service
export {
  NarrativeDetectionService,
  createNarrativeDetectionService,
  type NarrativeDetectionConfig,
  type Narrative,
  type NarrativeStats,
} from './services/narrative-detection-service';

// Reputation Intelligence Service
export {
  ReputationIntelligenceService,
  createReputationIntelligenceService,
  type ReputationIntelligenceConfig,
  type ReputationScore,
  type ReputationAlert,
  type ReputationStats,
} from './services/reputation-intelligence-service';

// Influencer Analysis Service
export {
  InfluencerAnalysisService,
  createInfluencerAnalysisService,
  type InfluencerAnalysisConfig,
  type Influencer,
  type InfluencerMention,
  type InfluencerRelationship,
  type InfluencerComparison,
  type InfluencerStats,
} from './services/influencer-analysis-service';
