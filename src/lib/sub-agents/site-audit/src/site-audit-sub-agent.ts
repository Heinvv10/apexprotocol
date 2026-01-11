/**
 * SiteAuditSubAgent - Main orchestrator for comprehensive site auditing
 * Coordinates CrawlerService, TechnicalAuditService, PerformanceService,
 * SemanticAnalysisService, AIVisibilityService, and MonitoringService
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Import all services
import { CrawlerService, createCrawlerService, type CrawlerConfig } from './services/crawler-service';
import { TechnicalAuditService, createTechnicalAuditService, type TechnicalAuditConfig } from './services/technical-audit-service';
import { PerformanceService, createPerformanceService, type PerformanceConfig } from './services/performance-service';
import { SemanticAnalysisService, createSemanticAnalysisService, type SemanticConfig } from './services/semantic-analysis-service';
import { AIVisibilityService, createAIVisibilityService, type AIVisibilityConfig } from './services/ai-visibility-service';
import { MonitoringService, createMonitoringService, type MonitoringConfig } from './services/monitoring-service';

// Configuration schema
const SiteAuditConfigSchema = z.object({
  enableCrawler: z.boolean().default(true),
  enableTechnicalAudit: z.boolean().default(true),
  enablePerformanceAudit: z.boolean().default(true),
  enableSemanticAnalysis: z.boolean().default(true),
  enableAIVisibility: z.boolean().default(true),
  enableMonitoring: z.boolean().default(true),
  maxPagesPerAudit: z.number().positive().default(1000),
  maxConcurrentAudits: z.number().positive().default(5),
  auditTimeout: z.number().positive().default(1800000), // 30 minutes
  crawler: z.object({}).passthrough().optional(),
  technicalAudit: z.object({}).passthrough().optional(),
  performance: z.object({}).passthrough().optional(),
  semanticAnalysis: z.object({}).passthrough().optional(),
  aiVisibility: z.object({}).passthrough().optional(),
  monitoring: z.object({}).passthrough().optional(),
});

export type SiteAuditConfig = z.infer<typeof SiteAuditConfigSchema>;

// Request types
export interface AuditRequest {
  url: string;
  depth?: number;
  maxPages?: number;
  scope?: 'full' | 'partial' | 'quick';
  includeSubdomains?: boolean;
  excludePatterns?: string[];
}

export interface AuditValidation {
  isValid: boolean;
  errors: string[];
}

// Audit types
export interface AuditPhase {
  name: string;
  weight: number;
  completed: boolean;
}

export interface AuditProgress {
  phase: string;
  phaseProgress: number;
  overallProgress: number;
  pagesProcessed?: number;
  totalPagesEstimate?: number;
}

export type AuditStatus = 'initialized' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';

export interface AuditState {
  auditId: string;
  url: string;
  domain: string;
  status: AuditStatus;
  currentPhase: string;
  progress: AuditProgress;
  startedAt: Date;
  errors: AuditError[];
}

export interface AuditError {
  phase: string;
  error: string;
  recoverable: boolean;
  timestamp: Date;
}

export interface AuditResult {
  auditId?: string;
  domain?: string;
  url?: string;
  overallScore: number;
  technicalScore?: number;
  performanceScore?: number;
  semanticScore?: number;
  aiVisibilityScore?: number;
  summary: string;
  recommendations: AuditRecommendation[];
  issues: IssueSummary;
  completedAt?: Date;
}

export interface AuditRecommendation {
  priority: number;
  issue: string;
  category: string;
  impact: string;
  action: string;
}

export interface IssueSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface AuditComparison {
  overallChange: number;
  technicalChange?: number;
  performanceChange?: number;
  improved: boolean;
}

// Services interface
export interface AuditServices {
  crawler: CrawlerService;
  technicalAudit: TechnicalAuditService;
  performance: PerformanceService;
  semanticAnalysis: SemanticAnalysisService;
  aiVisibility: AIVisibilityService;
  monitoring: MonitoringService;
}

// Scheduled audit types
export interface ScheduledAuditRequest {
  url: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  options?: Partial<AuditRequest>;
}

export interface ScheduledAudit {
  scheduleId: string;
  url: string;
  schedule: string;
  options: Partial<AuditRequest>;
  nextRun: Date;
  createdAt: Date;
}

// Audit phase definitions
const AUDIT_PHASES: AuditPhase[] = [
  { name: 'initialization', weight: 5, completed: false },
  { name: 'crawling', weight: 30, completed: false },
  { name: 'technical-audit', weight: 20, completed: false },
  { name: 'performance-audit', weight: 20, completed: false },
  { name: 'semantic-analysis', weight: 10, completed: false },
  { name: 'ai-visibility', weight: 10, completed: false },
  { name: 'report-generation', weight: 5, completed: false },
];

export class SiteAuditSubAgent extends EventEmitter {
  private config: SiteAuditConfig;
  private services: AuditServices;
  private activeAudits: Map<string, AuditState> = new Map();
  private auditResults: Map<string, AuditResult> = new Map();
  private scheduledAudits: Map<string, ScheduledAudit> = new Map();
  private auditIdCounter = 0;
  private isShutdownFlag = false;

  constructor(config: Partial<SiteAuditConfig> = {}) {
    super();
    this.config = SiteAuditConfigSchema.parse(config);

    // Initialize all services
    this.services = {
      crawler: createCrawlerService(this.config.crawler as Partial<CrawlerConfig>),
      technicalAudit: createTechnicalAuditService(this.config.technicalAudit as Partial<TechnicalAuditConfig>),
      performance: createPerformanceService(this.config.performance as Partial<PerformanceConfig>),
      semanticAnalysis: createSemanticAnalysisService(this.config.semanticAnalysis as Partial<SemanticConfig>),
      aiVisibility: createAIVisibilityService(this.config.aiVisibility as Partial<AIVisibilityConfig>),
      monitoring: createMonitoringService(this.config.monitoring as Partial<MonitoringConfig>),
    };
  }

  getConfig(): SiteAuditConfig {
    return { ...this.config };
  }

  getServices(): AuditServices {
    return this.services;
  }

  shutdown(): void {
    this.isShutdownFlag = true;
    this.removeAllListeners();

    // Shutdown all services
    this.services.crawler.shutdown();
    this.services.technicalAudit.shutdown();
    this.services.performance.shutdown();
    this.services.semanticAnalysis.shutdown();
    this.services.aiVisibility.shutdown();
    this.services.monitoring.shutdown();

    this.activeAudits.clear();
    this.scheduledAudits.clear();
  }

  isShutdown(): boolean {
    return this.isShutdownFlag;
  }

  private generateAuditId(): string {
    return `audit-${++this.auditIdCounter}-${Date.now()}`;
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return url;
    }
  }

  // Validation
  validateRequest(request: AuditRequest): AuditValidation {
    const errors: string[] = [];

    // Validate URL
    try {
      new URL(request.url);
    } catch {
      errors.push('Invalid URL format');
    }

    // Validate depth
    if (request.depth !== undefined && (request.depth < 1 || request.depth > 5)) {
      errors.push('Depth must be between 1 and 5');
    }

    // Validate maxPages
    if (request.maxPages !== undefined && request.maxPages <= 0) {
      errors.push('maxPages must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Audit Initialization
  async initializeAudit(request: AuditRequest): Promise<{
    success: boolean;
    auditId: string;
    status?: AuditStatus;
    error?: string;
  }> {
    if (this.isShutdownFlag) {
      return {
        success: false,
        auditId: '',
        error: 'Agent has been shutdown'
      };
    }

    // Check concurrent audit limit
    if (this.activeAudits.size >= this.config.maxConcurrentAudits) {
      return {
        success: false,
        auditId: '',
        error: 'Maximum concurrent audits reached'
      };
    }

    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        auditId: '',
        error: validation.errors.join(', ')
      };
    }

    const auditId = this.generateAuditId();
    const domain = this.extractDomain(request.url);

    const state: AuditState = {
      auditId,
      url: request.url,
      domain,
      status: 'initialized',
      currentPhase: 'initialization',
      progress: {
        phase: 'initialization',
        phaseProgress: 0,
        overallProgress: 0
      },
      startedAt: new Date(),
      errors: []
    };

    this.activeAudits.set(auditId, state);

    this.emit('audit:start', { auditId, url: request.url });

    return {
      success: true,
      auditId,
      status: 'initialized'
    };
  }

  getActiveAudits(): AuditState[] {
    return Array.from(this.activeAudits.values());
  }

  getAuditStatus(auditId: string): AuditState | null {
    return this.activeAudits.get(auditId) || null;
  }

  getAuditPhases(): string[] {
    return AUDIT_PHASES.map(p => p.name);
  }

  calculateProgress(phases: AuditPhase[]): number {
    return phases
      .filter(p => p.completed)
      .reduce((sum, p) => sum + p.weight, 0);
  }

  // Audit Execution Control
  updateProgress(auditId: string, progress: AuditProgress): void {
    const state = this.activeAudits.get(auditId);
    if (state) {
      state.progress = progress;
      state.currentPhase = progress.phase;
      this.emit('audit:progress', { auditId, progress });
    }
  }

  getProgress(auditId: string): AuditProgress | null {
    const state = this.activeAudits.get(auditId);
    return state?.progress || null;
  }

  async cancelAudit(auditId: string): Promise<{ success: boolean }> {
    const state = this.activeAudits.get(auditId);
    if (state) {
      state.status = 'cancelled';
      this.emit('audit:cancelled', { auditId });
      return { success: true };
    }
    return { success: false };
  }

  async pauseAudit(auditId: string): Promise<void> {
    const state = this.activeAudits.get(auditId);
    if (state) {
      state.status = 'paused';
      this.emit('audit:paused', { auditId });
    }
  }

  async resumeAudit(auditId: string): Promise<void> {
    const state = this.activeAudits.get(auditId);
    if (state && state.status === 'paused') {
      state.status = 'running';
      this.emit('audit:resumed', { auditId });
    }
  }

  // Error Handling
  recordError(auditId: string, errorData: {
    phase: string;
    error: string;
    recoverable: boolean;
  }): void {
    const state = this.activeAudits.get(auditId);
    if (state) {
      state.errors.push({
        ...errorData,
        timestamp: new Date()
      });

      if (!errorData.recoverable) {
        state.status = 'failed';
        this.emit('audit:error', { auditId, error: errorData });
      }
    }
  }

  getErrorSummary(auditId: string): {
    total: number;
    byPhase: Record<string, number>;
  } {
    const state = this.activeAudits.get(auditId);
    if (!state) {
      return { total: 0, byPhase: {} };
    }

    const byPhase: Record<string, number> = {};
    for (const error of state.errors) {
      byPhase[error.phase] = (byPhase[error.phase] || 0) + 1;
    }

    return {
      total: state.errors.length,
      byPhase
    };
  }

  // Result Generation
  generateAuditResult(auditData: {
    auditId: string;
    url: string;
    crawlData?: { pagesFound: number; pagesCrawled: number; errors: number };
    technicalAudit?: { score: number; issues: IssueSummary };
    performanceAudit?: { score: number; webVitals: Record<string, number> };
    semanticAnalysis?: { score: number; schemaOrg: { valid: boolean; types: string[] } };
    aiVisibility?: { score: number; contentRelevance: number; entityOptimization: number };
  }): AuditResult {
    const scores = {
      technical: auditData.technicalAudit?.score || 0,
      performance: auditData.performanceAudit?.score || 0,
      semantic: auditData.semanticAnalysis?.score || 0,
      aiVisibility: auditData.aiVisibility?.score || 0
    };

    const overallScore = this.calculateOverallScore(scores);

    const issues: IssueSummary = auditData.technicalAudit?.issues || {
      critical: 0, high: 0, medium: 0, low: 0
    };

    const summary = this.generateSummary(overallScore, issues);
    const recommendations = this.generateRecommendations([]);

    return {
      auditId: auditData.auditId,
      url: auditData.url,
      overallScore,
      technicalScore: scores.technical,
      performanceScore: scores.performance,
      semanticScore: scores.semantic,
      aiVisibilityScore: scores.aiVisibility,
      summary,
      recommendations,
      issues,
      completedAt: new Date()
    };
  }

  calculateOverallScore(scores: {
    technical: number;
    performance: number;
    semantic: number;
    aiVisibility: number;
  }): number {
    const weights = {
      technical: 0.3,
      performance: 0.25,
      semantic: 0.2,
      aiVisibility: 0.25
    };

    return Math.round(
      scores.technical * weights.technical +
      scores.performance * weights.performance +
      scores.semantic * weights.semantic +
      scores.aiVisibility * weights.aiVisibility
    );
  }

  private generateSummary(score: number, issues: IssueSummary): string {
    const parts: string[] = [];
    parts.push(`Overall score: ${score}/100.`);

    if (issues.critical > 0) {
      parts.push(`${issues.critical} critical issues require immediate attention.`);
    }
    if (issues.high > 0) {
      parts.push(`${issues.high} high priority issues found.`);
    }

    return parts.join(' ');
  }

  generateRecommendations(issues: { type: string; severity: string; impact?: string }[]): AuditRecommendation[] {
    const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };

    return issues
      .sort((a, b) => {
        const aOrder = severityOrder[a.severity as keyof typeof severityOrder] || 5;
        const bOrder = severityOrder[b.severity as keyof typeof severityOrder] || 5;
        return aOrder - bOrder;
      })
      .map((issue, index) => ({
        priority: index + 1,
        issue: issue.type,
        category: issue.impact || 'general',
        impact: issue.severity,
        action: `Fix ${issue.type} issue`
      }));
  }

  categorizeIssues(issues: { type: string; severity: string }[]): IssueSummary {
    const summary: IssueSummary = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const issue of issues) {
      const severity = issue.severity as keyof IssueSummary;
      if (severity in summary) {
        summary[severity]++;
      }
    }

    return summary;
  }

  // Audit History
  storeAuditResult(auditId: string, result: Partial<AuditResult>): void {
    const fullResult: AuditResult = {
      auditId,
      overallScore: result.overallScore || 0,
      summary: result.summary || '',
      recommendations: result.recommendations || [],
      issues: result.issues || { critical: 0, high: 0, medium: 0, low: 0 },
      ...result
    };

    this.auditResults.set(auditId, fullResult);
  }

  getAuditResult(auditId: string): AuditResult | null {
    return this.auditResults.get(auditId) || null;
  }

  getAuditHistory(domain: string): AuditResult[] {
    return Array.from(this.auditResults.values())
      .filter(r => r.domain === domain)
      .sort((a, b) => {
        const dateA = a.completedAt?.getTime() || 0;
        const dateB = b.completedAt?.getTime() || 0;
        return dateB - dateA;
      });
  }

  compareAudits(auditId1: string, auditId2: string): AuditComparison {
    const result1 = this.auditResults.get(auditId1);
    const result2 = this.auditResults.get(auditId2);

    if (!result1 || !result2) {
      return { overallChange: 0, improved: false };
    }

    const overallChange = result2.overallScore - result1.overallScore;
    const technicalChange = result2.technicalScore !== undefined && result1.technicalScore !== undefined
      ? result2.technicalScore - result1.technicalScore
      : undefined;
    const performanceChange = result2.performanceScore !== undefined && result1.performanceScore !== undefined
      ? result2.performanceScore - result1.performanceScore
      : undefined;

    return {
      overallChange,
      technicalChange,
      performanceChange,
      improved: overallChange > 0
    };
  }

  // Data Preparation for Services
  prepareTechnicalAuditInput(crawlResult: {
    pages?: { url: string; html: string; statusCode: number }[];
    robotsTxt?: unknown;
    sitemap?: unknown;
  }): { pages: unknown[] } {
    return {
      pages: crawlResult.pages || []
    };
  }

  preparePerformanceInput(crawlResult: {
    pages?: { url: string }[];
  }): { urls: string[] } {
    return {
      urls: (crawlResult.pages || []).map(p => p.url)
    };
  }

  prepareSemanticInput(crawlResult: {
    pages?: { html: string }[];
  }): { html: string[] } {
    return {
      html: (crawlResult.pages || []).map(p => p.html)
    };
  }

  prepareAIVisibilityInput(crawlResult: {
    pages?: { html: string }[];
  }): { content: string[] } {
    return {
      content: (crawlResult.pages || []).map(p => p.html)
    };
  }

  // Export Functionality
  exportResult(auditId: string, format: 'json' | 'pdf' | 'html'): string | object {
    const result = this.auditResults.get(auditId);
    if (!result) {
      return format === 'json' ? '{}' : '';
    }

    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);

      case 'pdf':
        // Return PDF generation data structure
        return {
          type: 'pdf',
          title: `Site Audit Report - ${result.domain}`,
          content: result,
          generatedAt: new Date().toISOString()
        };

      case 'html':
        return this.generateHTMLReport(result);

      default:
        return JSON.stringify(result);
    }
  }

  private generateHTMLReport(result: AuditResult): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Site Audit Report - ${result.domain}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    .score { font-size: 48px; font-weight: bold; color: ${result.overallScore >= 70 ? '#22c55e' : '#ef4444'}; }
    .section { margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Site Audit Report</h1>
  <p>Domain: ${result.domain || 'N/A'}</p>
  <p>Generated: ${result.completedAt?.toISOString() || new Date().toISOString()}</p>

  <div class="section">
    <h2>Overall Score</h2>
    <div class="score">${result.overallScore}</div>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <p>${result.summary}</p>
  </div>

  <div class="section">
    <h2>Issues</h2>
    <ul>
      <li>Critical: ${result.issues.critical}</li>
      <li>High: ${result.issues.high}</li>
      <li>Medium: ${result.issues.medium}</li>
      <li>Low: ${result.issues.low}</li>
    </ul>
  </div>
</body>
</html>`;
  }

  // Scheduled Audits
  async scheduleRecurringAudit(request: ScheduledAuditRequest): Promise<{
    success: boolean;
    scheduleId: string;
  }> {
    const scheduleId = `schedule-${++this.auditIdCounter}-${Date.now()}`;

    const scheduled: ScheduledAudit = {
      scheduleId,
      url: request.url,
      schedule: request.schedule,
      options: request.options || {},
      nextRun: this.calculateNextRun(request.schedule),
      createdAt: new Date()
    };

    this.scheduledAudits.set(scheduleId, scheduled);

    return {
      success: true,
      scheduleId
    };
  }

  private calculateNextRun(schedule: string): Date {
    const now = new Date();
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 86400000);
      case 'weekly':
        return new Date(now.getTime() + 604800000);
      case 'monthly':
        return new Date(now.getTime() + 2592000000);
      default:
        return new Date(now.getTime() + 86400000);
    }
  }

  getScheduledAudits(): ScheduledAudit[] {
    return Array.from(this.scheduledAudits.values());
  }

  cancelScheduledAudit(scheduleId: string): { success: boolean } {
    return { success: this.scheduledAudits.delete(scheduleId) };
  }
}

// Factory function
export function createSiteAuditSubAgent(config?: Partial<SiteAuditConfig>): SiteAuditSubAgent {
  return new SiteAuditSubAgent(config);
}
