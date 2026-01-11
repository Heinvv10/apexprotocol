/**
 * Site Audit Sub-Agent - Main Export
 *
 * Comprehensive site auditing sub-agent that coordinates multiple services:
 * - CrawlerService: Website crawling and sitemap/robots.txt analysis
 * - TechnicalAuditService: Technical SEO and indexability analysis
 * - PerformanceService: Core Web Vitals and performance metrics
 * - SemanticAnalysisService: Schema.org and semantic HTML analysis
 * - AIVisibilityService: AI/LLM visibility and E-E-A-T signals
 * - MonitoringService: Scheduled crawls, anomaly detection, and alerts
 */

// Main orchestrator
export {
  SiteAuditSubAgent,
  createSiteAuditSubAgent,
  type SiteAuditConfig,
  type AuditRequest,
  type AuditResult,
  type AuditProgress,
  type AuditPhase,
  type AuditStatus,
  type AuditServices,
} from './site-audit-sub-agent';

// Re-export all services
export * from './services';
