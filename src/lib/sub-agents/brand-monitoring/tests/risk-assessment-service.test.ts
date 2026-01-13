/**
 * RiskAssessmentService Tests
 * TDD tests for reputation risk detection and threat assessment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RiskAssessmentService,
  createRiskAssessmentService,
  type RiskAssessmentConfig,
  type RiskInput,
  type RiskAssessment,
  type ThreatLevel,
  type RiskCategory,
  type RiskMitigation,
  type RiskAlert,
} from '../src/services/risk-assessment-service';

describe('RiskAssessmentService', () => {
  let service: RiskAssessmentService;

  const defaultConfig: Partial<RiskAssessmentConfig> = {
    brandName: 'Apex',
    sensitivityLevel: 'medium',
    alertThreshold: 0.6,
    enableRealTimeAlerts: true,
  };

  beforeEach(() => {
    service = createRiskAssessmentService(defaultConfig);
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createRiskAssessmentService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getConfig()).toBeDefined();
    });

    it('should create service with custom config', () => {
      expect(service.getConfig().brandName).toBe('Apex');
      expect(service.getConfig().sensitivityLevel).toBe('medium');
    });

    it('should emit initialized event', async () => {
      const handler = vi.fn();
      service.on('initialized', handler);
      await service.initialize();
      expect(handler).toHaveBeenCalled();
    });

    it('should validate brand name is required', () => {
      expect(() => createRiskAssessmentService({ brandName: '' })).toThrow();
    });
  });

  describe('Risk Level Assessment', () => {
    it('should assess critical risk level', async () => {
      const input: RiskInput = {
        id: 'risk-1',
        text: 'BREAKING: Major data breach at Apex exposes millions of user records',
        source: 'news',
        sentiment: -0.9,
        reach: 1000000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.riskLevel).toBe('critical');
      expect(assessment.score).toBeGreaterThan(0.8);
    });

    it('should assess high risk level', async () => {
      const input: RiskInput = {
        id: 'risk-2',
        text: 'Apex faces class action lawsuit over privacy violations',
        source: 'news',
        sentiment: -0.7,
        reach: 100000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.riskLevel).toBe('high');
      expect(assessment.score).toBeGreaterThan(0.6);
    });

    it('should assess medium risk level', async () => {
      const input: RiskInput = {
        id: 'risk-3',
        text: 'Users complaining about Apex downtime on Twitter',
        source: 'twitter',
        sentiment: -0.5,
        reach: 10000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.riskLevel).toBe('medium');
    });

    it('should assess low risk level', async () => {
      const input: RiskInput = {
        id: 'risk-4',
        text: 'Minor UI bug reported in Apex dashboard',
        source: 'support',
        sentiment: -0.2,
        reach: 100,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.riskLevel).toBe('low');
    });

    it('should assess minimal risk level for positive content', async () => {
      const input: RiskInput = {
        id: 'risk-5',
        text: 'Apex wins best GEO platform award',
        source: 'news',
        sentiment: 0.8,
        reach: 50000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.riskLevel).toBe('minimal');
    });
  });

  describe('Risk Categories', () => {
    it('should identify reputational risk', async () => {
      const input: RiskInput = {
        id: 'cat-1',
        text: 'Apex CEO accused of unethical business practices',
        source: 'news',
        sentiment: -0.8,
        reach: 200000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.categories).toContain('reputational');
    });

    it('should identify security risk', async () => {
      const input: RiskInput = {
        id: 'cat-2',
        text: 'Security vulnerability discovered in Apex API',
        source: 'tech_blog',
        sentiment: -0.6,
        reach: 50000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.categories).toContain('security');
    });

    it('should identify legal risk', async () => {
      const input: RiskInput = {
        id: 'cat-3',
        text: 'Apex sued for patent infringement by competitor',
        source: 'news',
        sentiment: -0.7,
        reach: 80000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.categories).toContain('legal');
    });

    it('should identify operational risk', async () => {
      const input: RiskInput = {
        id: 'cat-4',
        text: 'Apex experiencing widespread service outage',
        source: 'status_page',
        sentiment: -0.6,
        reach: 100000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.categories).toContain('operational');
    });

    it('should identify financial risk', async () => {
      const input: RiskInput = {
        id: 'cat-5',
        text: 'Apex stock plummets after disappointing earnings report',
        source: 'financial_news',
        sentiment: -0.8,
        reach: 300000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.categories).toContain('financial');
    });

    it('should identify competitive risk', async () => {
      const input: RiskInput = {
        id: 'cat-6',
        text: 'Major client switches from Apex to competitor Semrush',
        source: 'industry_news',
        sentiment: -0.5,
        reach: 20000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.categories).toContain('competitive');
    });
  });

  describe('Threat Detection', () => {
    it('should detect misinformation threat', async () => {
      const input: RiskInput = {
        id: 'threat-1',
        text: 'FALSE: Apex secretly selling user data to advertisers (debunked claim spreading)',
        source: 'social_media',
        sentiment: -0.7,
        reach: 50000,
        timestamp: new Date(),
        metadata: { isVerified: false },
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.threats).toContain('misinformation');
    });

    it('should detect coordinated attack threat', async () => {
      const inputs: RiskInput[] = Array.from({ length: 20 }, (_, i) => ({
        id: `coord-${i}`,
        text: 'Boycott Apex! They are terrible!',
        source: 'twitter',
        sentiment: -0.8,
        reach: 1000,
        timestamp: new Date(Date.now() - i * 60000), // 1 minute apart
        metadata: { accountAge: 30 }, // New accounts
      }));

      const assessment = await service.assessBatchRisk(inputs);
      expect(assessment.threats).toContain('coordinated_attack');
    });

    it('should detect viral negative content threat', async () => {
      const input: RiskInput = {
        id: 'viral-1',
        text: 'My horrible experience with Apex support - THREAD',
        source: 'twitter',
        sentiment: -0.8,
        reach: 500000,
        timestamp: new Date(),
        metadata: { engagementRate: 0.15, shareCount: 50000 },
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.threats).toContain('viral_negative');
    });

    it('should detect influencer criticism threat', async () => {
      const input: RiskInput = {
        id: 'influencer-1',
        text: 'I can no longer recommend Apex to my followers',
        source: 'youtube',
        sentiment: -0.6,
        reach: 2000000,
        timestamp: new Date(),
        metadata: { influencerTier: 'mega', followerCount: 2000000 },
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.threats).toContain('influencer_criticism');
    });

    it('should detect media coverage threat', async () => {
      const input: RiskInput = {
        id: 'media-1',
        text: 'Investigation: How Apex fell behind competitors in innovation',
        source: 'major_publication',
        sentiment: -0.5,
        reach: 5000000,
        timestamp: new Date(),
        metadata: { publicationTier: 'tier1', isEditorial: true },
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.threats).toContain('negative_media_coverage');
    });
  });

  describe('Impact Analysis', () => {
    it('should calculate potential reach impact', async () => {
      const input: RiskInput = {
        id: 'impact-1',
        text: 'Apex caught lying about feature capabilities',
        source: 'twitter',
        sentiment: -0.8,
        reach: 100000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.impact.potentialReach).toBeGreaterThan(100000);
    });

    it('should estimate revenue impact', async () => {
      const input: RiskInput = {
        id: 'revenue-1',
        text: 'Major enterprise customer cancels Apex contract worth $500K',
        source: 'internal',
        sentiment: -0.7,
        reach: 0,
        timestamp: new Date(),
        metadata: { contractValue: 500000 },
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.impact.estimatedRevenueImpact).toBeGreaterThan(0);
    });

    it('should calculate brand perception impact', async () => {
      const input: RiskInput = {
        id: 'brand-1',
        text: 'Apex ranked worst in customer satisfaction survey',
        source: 'industry_report',
        sentiment: -0.6,
        reach: 150000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.impact.brandPerceptionImpact).toBeGreaterThan(0);
      expect(assessment.impact.brandPerceptionImpact).toBeLessThanOrEqual(1);
    });

    it('should estimate recovery time', async () => {
      const input: RiskInput = {
        id: 'recovery-1',
        text: 'Data breach affects 1 million Apex users',
        source: 'news',
        sentiment: -0.9,
        reach: 5000000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.impact.estimatedRecoveryDays).toBeGreaterThan(0);
    });
  });

  describe('Mitigation Recommendations', () => {
    it('should provide mitigation strategies', async () => {
      const input: RiskInput = {
        id: 'mit-1',
        text: 'Apex service outage frustrating thousands of users',
        source: 'twitter',
        sentiment: -0.7,
        reach: 50000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.mitigations).toBeDefined();
      expect(assessment.mitigations.length).toBeGreaterThan(0);
    });

    it('should prioritize mitigations by urgency', async () => {
      const input: RiskInput = {
        id: 'urgent-1',
        text: 'BREAKING: Apex database leaked on dark web',
        source: 'security_feed',
        sentiment: -0.95,
        reach: 1000000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.mitigations[0].urgency).toBe('immediate');
    });

    it('should include responsible team for mitigation', async () => {
      const input: RiskInput = {
        id: 'team-1',
        text: 'Customer complaining about billing issues on social media',
        source: 'twitter',
        sentiment: -0.5,
        reach: 5000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.mitigations[0].responsibleTeam).toBeDefined();
    });

    it('should estimate mitigation effectiveness', async () => {
      const input: RiskInput = {
        id: 'effect-1',
        text: 'Negative review gaining traction on G2 Crowd',
        source: 'review_site',
        sentiment: -0.6,
        reach: 20000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.mitigations[0].estimatedEffectiveness).toBeGreaterThan(0);
      expect(assessment.mitigations[0].estimatedEffectiveness).toBeLessThanOrEqual(1);
    });
  });

  describe('Alert Generation', () => {
    it('should generate alert for critical risk', async () => {
      const alertHandler = vi.fn();
      service.on('alert', alertHandler);

      const input: RiskInput = {
        id: 'alert-1',
        text: 'Security incident at Apex requires immediate attention',
        source: 'internal',
        sentiment: -0.9,
        reach: 0,
        timestamp: new Date(),
      };

      await service.assessRisk(input);
      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'critical' })
      );
    });

    it('should include escalation path in alert', async () => {
      const alertHandler = vi.fn();
      service.on('alert', alertHandler);

      const input: RiskInput = {
        id: 'escalate-1',
        text: 'Major client publicly criticizing Apex',
        source: 'linkedin',
        sentiment: -0.8,
        reach: 50000,
        timestamp: new Date(),
      };

      await service.assessRisk(input);
      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({ escalationPath: expect.any(Array) })
      );
    });

    it('should not alert for low risk content', async () => {
      const alertHandler = vi.fn();
      service.on('alert', alertHandler);

      const input: RiskInput = {
        id: 'low-1',
        text: 'Small typo noticed in Apex documentation',
        source: 'support',
        sentiment: -0.1,
        reach: 50,
        timestamp: new Date(),
      };

      await service.assessRisk(input);
      expect(alertHandler).not.toHaveBeenCalled();
    });

    it('should batch alerts for similar risks', async () => {
      const alertHandler = vi.fn();
      service.on('batchAlert', alertHandler);

      const inputs: RiskInput[] = Array.from({ length: 10 }, (_, i) => ({
        id: `batch-alert-${i}`,
        text: 'Apex is too expensive',
        source: 'twitter',
        sentiment: -0.4,
        reach: 1000,
        timestamp: new Date(),
      }));

      await service.assessBatchRisk(inputs);
      expect(alertHandler).toHaveBeenCalled();
    });
  });

  describe('Risk Trend Analysis', () => {
    it('should track risk trend over time', async () => {
      const inputs: RiskInput[] = [
        { id: 't1', text: 'Minor issue with Apex', source: 'twitter', sentiment: -0.3, reach: 1000, timestamp: new Date('2024-01-01') },
        { id: 't2', text: 'More problems with Apex', source: 'twitter', sentiment: -0.5, reach: 5000, timestamp: new Date('2024-01-02') },
        { id: 't3', text: 'Apex issues getting worse', source: 'twitter', sentiment: -0.7, reach: 20000, timestamp: new Date('2024-01-03') },
      ];

      for (const input of inputs) {
        await service.assessRisk(input);
      }

      const trend = service.getRiskTrend();
      expect(trend.direction).toBe('increasing');
    });

    it('should calculate risk velocity', async () => {
      const inputs: RiskInput[] = [
        { id: 'v1', text: 'Issue 1', source: 'twitter', sentiment: -0.5, reach: 1000, timestamp: new Date('2024-01-01') },
        { id: 'v2', text: 'Issue 2', source: 'twitter', sentiment: -0.6, reach: 5000, timestamp: new Date('2024-01-01') },
        { id: 'v3', text: 'Issue 3', source: 'twitter', sentiment: -0.7, reach: 10000, timestamp: new Date('2024-01-01') },
      ];

      for (const input of inputs) {
        await service.assessRisk(input);
      }

      const trend = service.getRiskTrend();
      expect(trend.velocity).toBeGreaterThan(0);
    });
  });

  describe('Batch Risk Assessment', () => {
    it('should assess multiple risks at once', async () => {
      const inputs: RiskInput[] = [
        { id: 'b1', text: 'Apex is terrible', source: 'twitter', sentiment: -0.8, reach: 5000, timestamp: new Date() },
        { id: 'b2', text: 'Apex is great', source: 'twitter', sentiment: 0.8, reach: 3000, timestamp: new Date() },
        { id: 'b3', text: 'Apex update released', source: 'news', sentiment: 0.1, reach: 10000, timestamp: new Date() },
      ];

      const result = await service.assessBatchRisk(inputs);
      expect(result.assessments).toHaveLength(3);
      expect(result.aggregateRiskLevel).toBeDefined();
    });

    it('should calculate aggregate risk score', async () => {
      const inputs: RiskInput[] = [
        { id: 'agg1', text: 'Bad experience', source: 'twitter', sentiment: -0.6, reach: 5000, timestamp: new Date() },
        { id: 'agg2', text: 'Terrible service', source: 'twitter', sentiment: -0.8, reach: 10000, timestamp: new Date() },
      ];

      const result = await service.assessBatchRisk(inputs);
      expect(result.aggregateRiskScore).toBeGreaterThan(0);
    });

    it('should identify correlated risks', async () => {
      const inputs: RiskInput[] = [
        { id: 'corr1', text: 'Apex pricing is too high', source: 'twitter', sentiment: -0.5, reach: 3000, timestamp: new Date() },
        { id: 'corr2', text: 'Can not afford Apex anymore', source: 'reddit', sentiment: -0.6, reach: 2000, timestamp: new Date() },
        { id: 'corr3', text: 'Apex too expensive for startups', source: 'linkedin', sentiment: -0.4, reach: 1500, timestamp: new Date() },
      ];

      const result = await service.assessBatchRisk(inputs);
      expect(result.correlatedRisks).toBeDefined();
      expect(result.correlatedRisks?.length).toBeGreaterThan(0);
    });
  });

  describe('Historical Risk Analysis', () => {
    it('should compare with historical risk levels', async () => {
      const input: RiskInput = {
        id: 'hist-1',
        text: 'Apex service degradation reported',
        source: 'status_page',
        sentiment: -0.6,
        reach: 50000,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(input);
      expect(assessment.historicalComparison).toBeDefined();
    });

    it('should identify risk patterns from history', async () => {
      const patterns = await service.analyzeHistoricalPatterns({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(patterns).toBeDefined();
      expect(patterns.mostCommonCategories).toBeDefined();
      expect(patterns.peakRiskPeriods).toBeDefined();
    });
  });

  describe('Configuration Updates', () => {
    it('should update sensitivity level', () => {
      service.updateConfig({ sensitivityLevel: 'high' });
      expect(service.getConfig().sensitivityLevel).toBe('high');
    });

    it('should update alert threshold', () => {
      service.updateConfig({ alertThreshold: 0.8 });
      expect(service.getConfig().alertThreshold).toBe(0.8);
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      service.on('configUpdated', handler);
      service.updateConfig({ enableRealTimeAlerts: false });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input', async () => {
      const emptyInput: RiskInput = {
        id: 'empty-1',
        text: '',
        source: 'twitter',
        sentiment: 0,
        reach: 0,
        timestamp: new Date(),
      };

      const assessment = await service.assessRisk(emptyInput);
      expect(assessment.riskLevel).toBe('minimal');
    });

    it('should handle invalid input gracefully', async () => {
      const invalidInput = null as unknown as RiskInput;
      const assessment = await service.assessRisk(invalidInput);
      expect(assessment.error).toBeDefined();
    });

    it('should emit error event on failure', async () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      await service.assessRisk(null as unknown as RiskInput);
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track assessment statistics', async () => {
      const inputs: RiskInput[] = [
        { id: 's1', text: 'Issue 1', source: 'twitter', sentiment: -0.5, reach: 1000, timestamp: new Date() },
        { id: 's2', text: 'Issue 2', source: 'twitter', sentiment: -0.7, reach: 2000, timestamp: new Date() },
      ];

      for (const input of inputs) {
        await service.assessRisk(input);
      }

      const stats = service.getStats();
      expect(stats.totalAssessments).toBe(2);
    });

    it('should track alerts generated', async () => {
      const highRiskInput: RiskInput = {
        id: 'high-stat',
        text: 'Critical security breach at Apex',
        source: 'news',
        sentiment: -0.9,
        reach: 1000000,
        timestamp: new Date(),
      };

      await service.assessRisk(highRiskInput);
      const stats = service.getStats();
      expect(stats.alertsGenerated).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const input: RiskInput = {
        id: 'reset-1',
        text: 'Test input',
        source: 'twitter',
        sentiment: -0.5,
        reach: 1000,
        timestamp: new Date(),
      };

      await service.assessRisk(input);
      service.resetStats();
      expect(service.getStats().totalAssessments).toBe(0);
    });
  });

  describe('Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      const handler = vi.fn();
      service.on('shutdown', handler);
      await service.shutdown();
      expect(handler).toHaveBeenCalled();
    });
  });
});
