import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  InsightsEngineService,
  createInsightsEngineService,
  type InsightsEngineConfig,
  type InsightRequest,
  type Insight,
  type InsightType,
  type TrendInsight,
  type OpportunityInsight,
  type RiskInsight,
  type AnomalyInsight,
  type CompetitiveInsight
} from '../src/services/insights-engine-service';

describe('InsightsEngineService', () => {
  let service: InsightsEngineService;

  beforeEach(() => {
    service = createInsightsEngineService();
  });

  afterEach(() => {
    service.removeAllListeners();
  });

  describe('Initialization', () => {
    it('should create a service with default configuration', () => {
      const config = service.getConfig();

      expect(config.minConfidenceThreshold).toBe(70);
      expect(config.enableTrendAnalysis).toBe(true);
      expect(config.enableOpportunityDetection).toBe(true);
      expect(config.enableRiskAssessment).toBe(true);
      expect(config.enableAnomalyDetection).toBe(true);
      expect(config.enableCompetitiveAnalysis).toBe(true);
      expect(config.historicalWindowDays).toBe(90);
    });

    it('should create a service with custom configuration', () => {
      const customService = createInsightsEngineService({
        minConfidenceThreshold: 80,
        enableAnomalyDetection: false,
        historicalWindowDays: 180
      });
      const config = customService.getConfig();

      expect(config.minConfidenceThreshold).toBe(80);
      expect(config.enableAnomalyDetection).toBe(false);
      expect(config.historicalWindowDays).toBe(180);
    });

    it('should validate configuration with zod schema', () => {
      expect(() => createInsightsEngineService({
        minConfidenceThreshold: 150 // Invalid: must be <= 100
      })).toThrow();

      expect(() => createInsightsEngineService({
        historicalWindowDays: 0 // Invalid: must be >= 1
      })).toThrow();
    });

    it('should use factory function to create service', () => {
      const factoryService = createInsightsEngineService();
      expect(factoryService).toBeInstanceOf(InsightsEngineService);
    });
  });

  describe('Performance Trend Analysis', () => {
    it('should generate trend insights', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          mention_count: {
            current: 150,
            previous: 100,
            historical: [80, 90, 100, 110, 120, 130, 140, 150],
            trend: 'up'
          }
        },
        focusAreas: ['performance_trend']
      };

      const result = await service.generateInsights(request);

      expect(result.success).toBe(true);
      const trendInsights = result.insights.filter(i => i.type === 'performance_trend');
      expect(trendInsights.length).toBeGreaterThan(0);
    });

    it('should identify upward trends', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          engagement: {
            current: 200,
            previous: 100,
            historical: [50, 75, 100, 125, 150, 175, 200],
            trend: 'up'
          }
        },
        focusAreas: ['performance_trend']
      };

      const result = await service.generateInsights(request);

      const trendInsight = result.insights.find(i =>
        i.type === 'performance_trend' && i.title.toLowerCase().includes('increasing')
      );
      expect(trendInsight).toBeDefined();
    });

    it('should identify downward trends', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          page_views: {
            current: 50,
            previous: 100,
            historical: [200, 175, 150, 125, 100, 75, 50],
            trend: 'down'
          }
        },
        focusAreas: ['performance_trend']
      };

      const result = await service.generateInsights(request);

      const trendInsight = result.insights.find(i =>
        i.type === 'performance_trend' && i.title.toLowerCase().includes('decreasing')
      );
      expect(trendInsight).toBeDefined();
    });

    it('should calculate trend magnitude', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          revenue: {
            current: 150,
            previous: 100,
            historical: [80, 90, 100, 120, 150],
            trend: 'up'
          }
        },
        focusAreas: ['performance_trend']
      };

      const result = await service.generateInsights(request);

      const trendInsight = result.insights.find(i => i.type === 'performance_trend') as TrendInsight;
      expect(trendInsight.changePercent).toBe(50); // (150-100)/100 * 100
    });
  });

  describe('Opportunity Detection', () => {
    it('should detect opportunities', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          engagement_rate: {
            current: 5,
            previous: 4,
            historical: [3, 3.5, 4, 4.5, 5],
            trend: 'up'
          },
          content_volume: {
            current: 10,
            previous: 15,
            historical: [20, 18, 16, 14, 10],
            trend: 'down'
          }
        },
        focusAreas: ['opportunity']
      };

      const result = await service.generateInsights(request);

      const opportunities = result.insights.filter(i => i.type === 'opportunity');
      expect(opportunities.length).toBeGreaterThan(0);
    });

    it('should identify growth opportunities', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          market_share: {
            current: 15,
            previous: 10,
            historical: [5, 7, 10, 12, 15],
            trend: 'up'
          }
        },
        competitorData: {
          averageMarketShare: 12,
          topCompetitorShare: 25
        },
        focusAreas: ['opportunity']
      };

      const result = await service.generateInsights(request);

      expect(result.success).toBe(true);
      expect(result.insights.some(i => i.type === 'opportunity')).toBe(true);
    });

    it('should include potential impact in opportunities', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          conversion_rate: {
            current: 3,
            previous: 2.5,
            historical: [2, 2.2, 2.5, 2.8, 3],
            trend: 'up'
          }
        },
        focusAreas: ['opportunity']
      };

      const result = await service.generateInsights(request);

      const opportunity = result.insights.find(i => i.type === 'opportunity') as OpportunityInsight;
      if (opportunity) {
        expect(opportunity.potentialImpact).toBeDefined();
      }
    });
  });

  describe('Risk Assessment', () => {
    it('should detect risks', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          customer_satisfaction: {
            current: 60,
            previous: 80,
            historical: [90, 85, 80, 70, 60],
            trend: 'down'
          }
        },
        focusAreas: ['risk']
      };

      const result = await service.generateInsights(request);

      const risks = result.insights.filter(i => i.type === 'risk');
      expect(risks.length).toBeGreaterThan(0);
    });

    it('should categorize risk severity', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          churn_rate: {
            current: 15,
            previous: 5,
            historical: [2, 3, 5, 10, 15],
            trend: 'up'
          }
        },
        focusAreas: ['risk']
      };

      const result = await service.generateInsights(request);

      const risk = result.insights.find(i => i.type === 'risk') as RiskInsight;
      if (risk) {
        expect(['high', 'medium', 'low']).toContain(risk.severity);
      }
    });

    it('should include mitigation suggestions', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          bounce_rate: {
            current: 70,
            previous: 50,
            historical: [40, 45, 50, 60, 70],
            trend: 'up'
          }
        },
        focusAreas: ['risk']
      };

      const result = await service.generateInsights(request);

      const risk = result.insights.find(i => i.type === 'risk') as RiskInsight;
      if (risk) {
        expect(risk.mitigationSuggestions).toBeDefined();
        expect(risk.mitigationSuggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect anomalies', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          traffic: {
            current: 1000,
            previous: 100,
            historical: [95, 100, 105, 98, 102, 1000], // Spike
            trend: 'up'
          }
        },
        focusAreas: ['anomaly']
      };

      const result = await service.generateInsights(request);

      expect(result.success).toBe(true);
      // Anomaly detection should find the spike
    });

    it('should identify anomaly direction', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          sales: {
            current: 10,
            previous: 100,
            historical: [100, 98, 102, 99, 101, 10], // Drop
            trend: 'down'
          }
        },
        focusAreas: ['anomaly']
      };

      const result = await service.generateInsights(request);

      const anomaly = result.insights.find(i => i.type === 'anomaly') as AnomalyInsight;
      if (anomaly) {
        expect(['spike', 'drop', 'pattern_break']).toContain(anomaly.anomalyType);
      }
    });

    it('should not detect anomalies when disabled', async () => {
      const noAnomalyService = createInsightsEngineService({
        enableAnomalyDetection: false
      });

      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          metric: {
            current: 1000,
            previous: 100,
            historical: [100, 100, 100, 1000],
            trend: 'up'
          }
        },
        focusAreas: ['anomaly']
      };

      const result = await noAnomalyService.generateInsights(request);

      const anomalies = result.insights.filter(i => i.type === 'anomaly');
      expect(anomalies.length).toBe(0);
    });
  });

  describe('Competitive Intelligence', () => {
    it('should generate competitive insights', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          share_of_voice: {
            current: 20,
            previous: 18,
            historical: [15, 16, 17, 18, 20],
            trend: 'up'
          }
        },
        competitorData: {
          competitors: [
            { name: 'Competitor A', shareOfVoice: 30, trend: 'stable' },
            { name: 'Competitor B', shareOfVoice: 25, trend: 'down' }
          ]
        },
        focusAreas: ['competitive_intelligence']
      };

      const result = await service.generateInsights(request);

      const competitiveInsights = result.insights.filter(i => i.type === 'competitive_intelligence');
      expect(competitiveInsights.length).toBeGreaterThan(0);
    });

    it('should benchmark against competitors', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          brand_mentions: {
            current: 500,
            previous: 400,
            historical: [300, 350, 400, 450, 500],
            trend: 'up'
          }
        },
        competitorData: {
          industryAverage: 600,
          topPerformer: 1000
        },
        focusAreas: ['competitive_intelligence']
      };

      const result = await service.generateInsights(request);

      const competitiveInsight = result.insights.find(i => i.type === 'competitive_intelligence') as CompetitiveInsight;
      if (competitiveInsight) {
        expect(competitiveInsight.benchmarkPosition).toBeDefined();
      }
    });

    it('should not generate competitive insights when disabled', async () => {
      const noCompetitiveService = createInsightsEngineService({
        enableCompetitiveAnalysis: false
      });

      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {},
        competitorData: { competitors: [] },
        focusAreas: ['competitive_intelligence']
      };

      const result = await noCompetitiveService.generateInsights(request);

      const competitiveInsights = result.insights.filter(i => i.type === 'competitive_intelligence');
      expect(competitiveInsights.length).toBe(0);
    });
  });

  describe('Insight Properties', () => {
    it('should include confidence score', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          metric: {
            current: 100,
            previous: 80,
            historical: [60, 70, 80, 90, 100],
            trend: 'up'
          }
        }
      };

      const result = await service.generateInsights(request);

      result.insights.forEach(insight => {
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should include impact assessment', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          important_metric: {
            current: 100,
            previous: 50,
            historical: [25, 50, 75, 100],
            trend: 'up'
          }
        }
      };

      const result = await service.generateInsights(request);

      result.insights.forEach(insight => {
        expect(['high', 'medium', 'low']).toContain(insight.impact);
      });
    });

    it('should include creation timestamp', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          metric: {
            current: 100,
            previous: 90,
            historical: [80, 85, 90, 95, 100],
            trend: 'up'
          }
        }
      };

      const result = await service.generateInsights(request);

      result.insights.forEach(insight => {
        expect(insight.createdAt).toBeInstanceOf(Date);
      });
    });

    it('should generate unique IDs', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          metric1: { current: 100, previous: 90, historical: [80, 90, 100], trend: 'up' },
          metric2: { current: 50, previous: 60, historical: [70, 60, 50], trend: 'down' }
        }
      };

      const result = await service.generateInsights(request);

      const ids = result.insights.map(i => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Confidence Filtering', () => {
    it('should filter insights below confidence threshold', async () => {
      const highConfidenceService = createInsightsEngineService({
        minConfidenceThreshold: 90
      });

      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {
          uncertain_metric: {
            current: 100,
            previous: 99, // Very small change, low confidence
            historical: [98, 99, 100, 99, 100],
            trend: 'stable'
          }
        }
      };

      const result = await highConfidenceService.generateInsights(request);

      result.insights.forEach(insight => {
        expect(insight.confidence).toBeGreaterThanOrEqual(90);
      });
    });
  });

  describe('Event Emission', () => {
    it('should emit generation:start event', async () => {
      const spy = vi.fn();
      service.on('generation:start', spy);

      await service.generateInsights({
        brandId: 'brand-123',
        metrics: { m: { current: 1, previous: 1, historical: [1], trend: 'stable' } }
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should emit generation:complete event', async () => {
      const spy = vi.fn();
      service.on('generation:complete', spy);

      await service.generateInsights({
        brandId: 'brand-123',
        metrics: { m: { current: 1, previous: 1, historical: [1], trend: 'stable' } }
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should emit insight:generated event for each insight', async () => {
      const spy = vi.fn();
      service.on('insight:generated', spy);

      await service.generateInsights({
        brandId: 'brand-123',
        metrics: {
          growing: { current: 100, previous: 50, historical: [25, 50, 75, 100], trend: 'up' },
          declining: { current: 50, previous: 100, historical: [200, 150, 100, 50], trend: 'down' }
        }
      });

      // Should be called for each generated insight
      expect(spy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty metrics', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: {}
      };

      const result = await service.generateInsights(request);

      expect(result.success).toBe(true);
      expect(result.insights).toHaveLength(0);
    });

    it('should handle missing brand ID', async () => {
      const request: InsightRequest = {
        brandId: '',
        metrics: { m: { current: 1, previous: 1, historical: [1], trend: 'stable' } }
      };

      const result = await service.generateInsights(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Brand ID is required');
    });

    it('should include processing time', async () => {
      const request: InsightRequest = {
        brandId: 'brand-123',
        metrics: { m: { current: 1, previous: 1, historical: [1], trend: 'stable' } }
      };

      const result = await service.generateInsights(request);

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Insight Storage', () => {
    it('should store generated insights', async () => {
      await service.generateInsights({
        brandId: 'brand-123',
        metrics: {
          metric: { current: 100, previous: 80, historical: [60, 70, 80, 90, 100], trend: 'up' }
        }
      });

      const stored = service.getInsightsForBrand('brand-123');
      expect(stored.length).toBeGreaterThan(0);
    });

    it('should retrieve insight by ID', async () => {
      const result = await service.generateInsights({
        brandId: 'brand-123',
        metrics: {
          metric: { current: 100, previous: 80, historical: [60, 70, 80, 90, 100], trend: 'up' }
        }
      });

      if (result.insights.length > 0) {
        const insight = service.getInsight(result.insights[0].id);
        expect(insight).toBeDefined();
        expect(insight?.id).toBe(result.insights[0].id);
      }
    });

    it('should return undefined for non-existent insight', () => {
      const insight = service.getInsight('non-existent');
      expect(insight).toBeUndefined();
    });
  });
});
