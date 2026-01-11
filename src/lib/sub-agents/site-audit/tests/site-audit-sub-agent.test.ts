import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SiteAuditSubAgent,
  createSiteAuditSubAgent,
  type SiteAuditConfig,
  type AuditRequest,
  type AuditResult,
  type AuditProgress,
  type AuditPhase,
  type AuditStatus
} from '../src/site-audit-sub-agent';

describe('SiteAuditSubAgent', () => {
  let agent: SiteAuditSubAgent;

  beforeEach(() => {
    agent = createSiteAuditSubAgent();
  });

  afterEach(() => {
    agent.shutdown();
  });

  describe('Configuration', () => {
    it('should create agent with default configuration', () => {
      const config = agent.getConfig();
      expect(config.enableCrawler).toBe(true);
      expect(config.enableTechnicalAudit).toBe(true);
      expect(config.enablePerformanceAudit).toBe(true);
      expect(config.enableSemanticAnalysis).toBe(true);
      expect(config.enableAIVisibility).toBe(true);
      expect(config.enableMonitoring).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customAgent = createSiteAuditSubAgent({
        enablePerformanceAudit: false,
        maxPagesPerAudit: 500,
        auditTimeout: 600000
      });
      const config = customAgent.getConfig();
      expect(config.enablePerformanceAudit).toBe(false);
      expect(config.maxPagesPerAudit).toBe(500);
      expect(config.auditTimeout).toBe(600000);
      customAgent.shutdown();
    });

    it('should validate configuration values', () => {
      expect(() => createSiteAuditSubAgent({ maxPagesPerAudit: 0 })).toThrow();
      expect(() => createSiteAuditSubAgent({ auditTimeout: -1 })).toThrow();
    });
  });

  describe('Audit Request Validation', () => {
    it('should validate audit request with URL', () => {
      const request: AuditRequest = {
        url: 'https://example.com',
        depth: 3
      };

      const validation = agent.validateRequest(request);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid URLs', () => {
      const request: AuditRequest = {
        url: 'not-a-valid-url'
      };

      const validation = agent.validateRequest(request);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('URL'))).toBe(true);
    });

    it('should validate audit options', () => {
      const request: AuditRequest = {
        url: 'https://example.com',
        depth: 10, // Too deep
        maxPages: 0 // Invalid
      };

      const validation = agent.validateRequest(request);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should accept audit scope options', () => {
      const request: AuditRequest = {
        url: 'https://example.com',
        scope: 'full',
        includeSubdomains: true,
        excludePatterns: ['/admin/*', '/api/*']
      };

      const validation = agent.validateRequest(request);

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Audit Initialization', () => {
    it('should initialize an audit job', async () => {
      const request: AuditRequest = {
        url: 'https://example.com'
      };

      const result = await agent.initializeAudit(request);

      expect(result.success).toBe(true);
      expect(result.auditId).toBeDefined();
      expect(result.status).toBe('initialized');
    });

    it('should generate unique audit IDs', async () => {
      const request: AuditRequest = { url: 'https://example.com' };

      const result1 = await agent.initializeAudit(request);
      const result2 = await agent.initializeAudit(request);

      expect(result1.auditId).not.toBe(result2.auditId);
    });

    it('should track multiple concurrent audits', async () => {
      await agent.initializeAudit({ url: 'https://example1.com' });
      await agent.initializeAudit({ url: 'https://example2.com' });
      await agent.initializeAudit({ url: 'https://example3.com' });

      const activeAudits = agent.getActiveAudits();

      expect(activeAudits.length).toBe(3);
    });

    it('should limit concurrent audits', async () => {
      const customAgent = createSiteAuditSubAgent({ maxConcurrentAudits: 2 });

      await customAgent.initializeAudit({ url: 'https://example1.com' });
      await customAgent.initializeAudit({ url: 'https://example2.com' });
      const result = await customAgent.initializeAudit({ url: 'https://example3.com' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('concurrent');

      customAgent.shutdown();
    });
  });

  describe('Audit Phases', () => {
    it('should define correct audit phases', () => {
      const phases = agent.getAuditPhases();

      expect(phases).toContain('initialization');
      expect(phases).toContain('crawling');
      expect(phases).toContain('technical-audit');
      expect(phases).toContain('performance-audit');
      expect(phases).toContain('semantic-analysis');
      expect(phases).toContain('ai-visibility');
      expect(phases).toContain('report-generation');
    });

    it('should track current phase during audit', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      const status = agent.getAuditStatus(auditId);

      expect(status?.currentPhase).toBe('initialization');
    });

    it('should calculate phase completion percentages', () => {
      const phases: AuditPhase[] = [
        { name: 'crawling', weight: 30, completed: true },
        { name: 'technical-audit', weight: 25, completed: true },
        { name: 'performance-audit', weight: 20, completed: false },
        { name: 'semantic-analysis', weight: 15, completed: false },
        { name: 'ai-visibility', weight: 10, completed: false }
      ];

      const progress = agent.calculateProgress(phases);

      expect(progress).toBe(55); // 30 + 25
    });
  });

  describe('Audit Execution', () => {
    it('should emit events during audit execution', async () => {
      const events: string[] = [];

      agent.on('audit:start', () => events.push('start'));
      agent.on('audit:phase', () => events.push('phase'));
      agent.on('audit:progress', () => events.push('progress'));
      agent.on('audit:complete', () => events.push('complete'));
      agent.on('audit:error', () => events.push('error'));

      // Simulate audit events
      agent.emit('audit:start', { auditId: 'test-123' });
      agent.emit('audit:phase', { phase: 'crawling' });
      agent.emit('audit:progress', { progress: 50 });
      agent.emit('audit:complete', { auditId: 'test-123' });

      expect(events).toContain('start');
      expect(events).toContain('phase');
      expect(events).toContain('progress');
      expect(events).toContain('complete');
    });

    it('should provide progress updates', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      // Simulate progress
      agent.updateProgress(auditId, {
        phase: 'crawling',
        phaseProgress: 50,
        overallProgress: 15,
        pagesProcessed: 25,
        totalPagesEstimate: 100
      });

      const progress = agent.getProgress(auditId);

      expect(progress?.phase).toBe('crawling');
      expect(progress?.phaseProgress).toBe(50);
      expect(progress?.overallProgress).toBe(15);
    });

    it('should handle audit cancellation', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      const cancelResult = await agent.cancelAudit(auditId);

      expect(cancelResult.success).toBe(true);
      expect(agent.getAuditStatus(auditId)?.status).toBe('cancelled');
    });

    it('should handle audit pause and resume', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      await agent.pauseAudit(auditId);
      expect(agent.getAuditStatus(auditId)?.status).toBe('paused');

      await agent.resumeAudit(auditId);
      expect(agent.getAuditStatus(auditId)?.status).toBe('running');
    });
  });

  describe('Result Generation', () => {
    it('should generate comprehensive audit result', () => {
      const auditData = {
        auditId: 'test-123',
        url: 'https://example.com',
        crawlData: {
          pagesFound: 150,
          pagesCrawled: 150,
          errors: 2
        },
        technicalAudit: {
          score: 85,
          issues: { critical: 0, high: 3, medium: 10, low: 20 }
        },
        performanceAudit: {
          score: 78,
          webVitals: { lcp: 2100, fid: 80, cls: 0.1 }
        },
        semanticAnalysis: {
          score: 82,
          schemaOrg: { valid: true, types: ['Organization', 'WebSite'] }
        },
        aiVisibility: {
          score: 75,
          contentRelevance: 80,
          entityOptimization: 70
        }
      };

      const result = agent.generateAuditResult(auditData);

      expect(result.overallScore).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should calculate overall audit score', () => {
      const scores = {
        technical: 85,
        performance: 78,
        semantic: 82,
        aiVisibility: 75
      };

      const overall = agent.calculateOverallScore(scores);

      expect(overall).toBeGreaterThan(70);
      expect(overall).toBeLessThanOrEqual(100);
    });

    it('should generate prioritized recommendations', () => {
      const issues = [
        { type: 'missing_schema', severity: 'high', impact: 'ai_visibility' },
        { type: 'slow_lcp', severity: 'critical', impact: 'performance' },
        { type: 'broken_link', severity: 'medium', impact: 'technical' },
        { type: 'missing_alt', severity: 'low', impact: 'semantic' }
      ];

      const recommendations = agent.generateRecommendations(issues);

      expect(recommendations[0].priority).toBe(1);
      expect(recommendations[0].issue).toBe('slow_lcp');
    });

    it('should categorize issues by severity', () => {
      const issues = [
        { type: 'a', severity: 'critical' },
        { type: 'b', severity: 'high' },
        { type: 'c', severity: 'high' },
        { type: 'd', severity: 'medium' },
        { type: 'e', severity: 'low' }
      ];

      const categorized = agent.categorizeIssues(issues);

      expect(categorized.critical).toBe(1);
      expect(categorized.high).toBe(2);
      expect(categorized.medium).toBe(1);
      expect(categorized.low).toBe(1);
    });
  });

  describe('Audit History', () => {
    it('should store audit results', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      agent.storeAuditResult(auditId, {
        overallScore: 80,
        completedAt: new Date(),
        summary: 'Audit completed successfully'
      });

      const storedResult = agent.getAuditResult(auditId);

      expect(storedResult?.overallScore).toBe(80);
    });

    it('should retrieve audit history for a domain', () => {
      agent.storeAuditResult('audit-1', {
        domain: 'example.com',
        overallScore: 75,
        completedAt: new Date(Date.now() - 86400000)
      });

      agent.storeAuditResult('audit-2', {
        domain: 'example.com',
        overallScore: 80,
        completedAt: new Date()
      });

      const history = agent.getAuditHistory('example.com');

      expect(history).toHaveLength(2);
      expect(history[0].overallScore).toBe(80); // Most recent first
    });

    it('should compare audit results over time', () => {
      agent.storeAuditResult('audit-old', {
        domain: 'example.com',
        overallScore: 70,
        technicalScore: 65,
        performanceScore: 72,
        completedAt: new Date(Date.now() - 86400000)
      });

      agent.storeAuditResult('audit-new', {
        domain: 'example.com',
        overallScore: 80,
        technicalScore: 82,
        performanceScore: 78,
        completedAt: new Date()
      });

      const comparison = agent.compareAudits('audit-old', 'audit-new');

      expect(comparison.overallChange).toBe(10);
      expect(comparison.improved).toBe(true);
      expect(comparison.technicalChange).toBe(17);
    });
  });

  describe('Service Integration', () => {
    it('should have all required services', () => {
      const services = agent.getServices();

      expect(services.crawler).toBeDefined();
      expect(services.technicalAudit).toBeDefined();
      expect(services.performance).toBeDefined();
      expect(services.semanticAnalysis).toBeDefined();
      expect(services.aiVisibility).toBeDefined();
      expect(services.monitoring).toBeDefined();
    });

    it('should configure services based on agent config', () => {
      const customAgent = createSiteAuditSubAgent({
        crawler: { maxConcurrentPages: 10 },
        performance: { enableLighthouse: false }
      });

      const services = customAgent.getServices();

      expect(services.crawler.getConfig().maxConcurrentPages).toBe(10);
      expect(services.performance.getConfig().enableLighthouse).toBe(false);

      customAgent.shutdown();
    });

    it('should pass data between services correctly', () => {
      // Test data flow: crawler -> technical -> performance -> semantic -> ai-visibility
      const crawlResult = {
        pages: [
          { url: 'https://example.com/', html: '<html></html>', statusCode: 200 }
        ],
        robotsTxt: { exists: true },
        sitemap: { urls: [] }
      };

      const technicalInput = agent.prepareTechnicalAuditInput(crawlResult);
      expect(technicalInput.pages).toBeDefined();

      const performanceInput = agent.preparePerformanceInput(crawlResult);
      expect(performanceInput.urls).toBeDefined();

      const semanticInput = agent.prepareSemanticInput(crawlResult);
      expect(semanticInput.html).toBeDefined();

      const aiVisibilityInput = agent.prepareAIVisibilityInput(crawlResult);
      expect(aiVisibilityInput.content).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      // Simulate error
      agent.recordError(auditId, {
        phase: 'crawling',
        error: 'Connection timeout',
        recoverable: true
      });

      const status = agent.getAuditStatus(auditId);

      expect(status?.errors.length).toBe(1);
      expect(status?.status).not.toBe('failed'); // Recoverable error
    });

    it('should fail audit on critical errors', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      agent.recordError(auditId, {
        phase: 'initialization',
        error: 'Invalid URL - site does not exist',
        recoverable: false
      });

      const status = agent.getAuditStatus(auditId);

      expect(status?.status).toBe('failed');
    });

    it('should provide error summary', async () => {
      const result = await agent.initializeAudit({ url: 'https://example.com' });
      const auditId = result.auditId;

      agent.recordError(auditId, { phase: 'crawling', error: 'Error 1', recoverable: true });
      agent.recordError(auditId, { phase: 'crawling', error: 'Error 2', recoverable: true });
      agent.recordError(auditId, { phase: 'performance', error: 'Error 3', recoverable: true });

      const summary = agent.getErrorSummary(auditId);

      expect(summary.total).toBe(3);
      expect(summary.byPhase.crawling).toBe(2);
      expect(summary.byPhase.performance).toBe(1);
    });
  });

  describe('Export Functionality', () => {
    it('should export audit result as JSON', () => {
      agent.storeAuditResult('test-123', {
        domain: 'example.com',
        overallScore: 80,
        technicalScore: 85,
        recommendations: []
      });

      const json = agent.exportResult('test-123', 'json');

      expect(JSON.parse(json).overallScore).toBe(80);
    });

    it('should export audit result as PDF data', () => {
      agent.storeAuditResult('test-123', {
        domain: 'example.com',
        overallScore: 80
      });

      const pdfData = agent.exportResult('test-123', 'pdf');

      expect(pdfData).toBeDefined();
      expect(typeof pdfData).toBe('object'); // PDF generation data
    });

    it('should export audit result as HTML', () => {
      agent.storeAuditResult('test-123', {
        domain: 'example.com',
        overallScore: 80
      });

      const html = agent.exportResult('test-123', 'html');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('example.com');
    });
  });

  describe('Scheduled Audits', () => {
    it('should schedule recurring audits', async () => {
      const result = await agent.scheduleRecurringAudit({
        url: 'https://example.com',
        schedule: 'weekly',
        options: { depth: 3 }
      });

      expect(result.success).toBe(true);
      expect(result.scheduleId).toBeDefined();
    });

    it('should list scheduled audits', async () => {
      await agent.scheduleRecurringAudit({ url: 'https://example1.com', schedule: 'daily' });
      await agent.scheduleRecurringAudit({ url: 'https://example2.com', schedule: 'weekly' });

      const scheduled = agent.getScheduledAudits();

      expect(scheduled.length).toBe(2);
    });

    it('should cancel scheduled audit', async () => {
      const result = await agent.scheduleRecurringAudit({ url: 'https://example.com', schedule: 'daily' });
      const scheduleId = result.scheduleId;

      const cancelResult = agent.cancelScheduledAudit(scheduleId);

      expect(cancelResult.success).toBe(true);
      expect(agent.getScheduledAudits()).toHaveLength(0);
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup resources on shutdown', () => {
      const customAgent = createSiteAuditSubAgent();

      customAgent.shutdown();

      expect(customAgent.isShutdown()).toBe(true);
    });

    it('should reject new audits after shutdown', async () => {
      agent.shutdown();

      const result = await agent.initializeAudit({ url: 'https://example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('shutdown');
    });
  });
});
