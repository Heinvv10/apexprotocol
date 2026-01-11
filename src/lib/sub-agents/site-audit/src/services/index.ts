/**
 * Site Audit Sub-Agent Services - Barrel Export
 */

export {
  CrawlerService,
  createCrawlerService,
  type CrawlerConfig,
  type RobotsTxtData,
  type SitemapData,
  type PageMetadata,
  type CrawlQueueItem,
  type CrawlProgress,
} from './crawler-service';

export {
  TechnicalAuditService,
  createTechnicalAuditService,
  type TechnicalAuditConfig,
  type IndexabilityResult,
  type CrawlabilityResult,
  type SecurityHeadersResult,
  type RedirectAnalysis,
  type TechnicalIssue,
} from './technical-audit-service';

export {
  PerformanceService,
  createPerformanceService,
  type PerformanceConfig,
  type CoreWebVitals,
  type WebVitalResult,
  type LighthouseMetrics,
  type ResourceAnalysis,
  type ImageAnalysis,
  type PerformanceIssue,
} from './performance-service';

export {
  SemanticAnalysisService,
  createSemanticAnalysisService,
  type SemanticConfig,
  type SchemaOrgData,
  type SemanticMarkup,
  type EntityAnalysis,
  type ContentStructure,
  type SemanticIssue,
} from './semantic-analysis-service';

export {
  AIVisibilityService,
  createAIVisibilityService,
  type AIVisibilityConfig,
  type AIVisibilityResult,
  type ContentRelevanceScore,
  type EntityOptimization,
  type AIReadabilityAnalysis,
  type StructuredDataOptimization,
  type AIVisibilityIssue,
} from './ai-visibility-service';

export {
  MonitoringService,
  createMonitoringService,
  type MonitoringConfig,
  type ScheduledCrawl,
  type CrawlSchedule,
  type AnomalyDetection,
  type TrendAnalysis,
  type AlertConfig,
  type Alert,
  type MonitoringReport,
} from './monitoring-service';
