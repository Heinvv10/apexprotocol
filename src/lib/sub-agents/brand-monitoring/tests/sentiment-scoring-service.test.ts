/**
 * SentimentScoringService Tests
 * TDD tests for advanced sentiment analysis with multi-dimensional scoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SentimentScoringService,
  createSentimentScoringService,
  type SentimentScoringConfig,
  type SentimentInput,
  type SentimentScore,
  type SentimentDimension,
  type EmotionBreakdown,
  type SentimentTrend,
  type AspectSentiment,
} from '../src/services/sentiment-scoring-service';

describe('SentimentScoringService', () => {
  let service: SentimentScoringService;

  const defaultConfig: Partial<SentimentScoringConfig> = {
    modelType: 'advanced',
    includeDimensions: true,
    includeEmotions: true,
    languageSupport: ['en', 'es', 'de', 'fr'],
  };

  beforeEach(() => {
    service = createSentimentScoringService(defaultConfig);
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createSentimentScoringService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getConfig()).toBeDefined();
    });

    it('should create service with custom config', () => {
      expect(service.getConfig().modelType).toBe('advanced');
      expect(service.getConfig().includeDimensions).toBe(true);
    });

    it('should emit initialized event', async () => {
      const handler = vi.fn();
      service.on('initialized', handler);
      await service.initialize();
      expect(handler).toHaveBeenCalled();
    });

    it('should load sentiment models', async () => {
      await service.initialize();
      expect(service.isModelLoaded()).toBe(true);
    });
  });

  describe('Basic Sentiment Analysis', () => {
    it('should detect positive sentiment', async () => {
      const input: SentimentInput = {
        id: 'pos-1',
        text: 'Apex is absolutely amazing! Best tool I have ever used.',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should detect negative sentiment', async () => {
      const input: SentimentInput = {
        id: 'neg-1',
        text: 'Terrible experience with Apex. Constant bugs and poor support.',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('negative');
      expect(result.score).toBeLessThan(-0.3);
    });

    it('should detect neutral sentiment', async () => {
      const input: SentimentInput = {
        id: 'neu-1',
        text: 'Apex released a new update today. It includes several features.',
        metadata: { source: 'news' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('neutral');
      expect(result.score).toBeGreaterThanOrEqual(-0.3);
      expect(result.score).toBeLessThanOrEqual(0.3);
    });

    it('should handle mixed sentiment', async () => {
      const input: SentimentInput = {
        id: 'mix-1',
        text: 'Apex has great features but the pricing is too expensive for small teams.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.isMixed).toBe(true);
      expect(result.mixedAspects).toBeDefined();
    });

    it('should return confidence score', async () => {
      const input: SentimentInput = {
        id: 'conf-1',
        text: 'I love using Apex every day!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Multi-Dimensional Sentiment', () => {
    it('should provide dimensional breakdown', async () => {
      const input: SentimentInput = {
        id: 'dim-1',
        text: 'Apex is innovative and reliable, but customer service could improve.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.dimensions).toBeDefined();
      expect(result.dimensions?.innovation).toBeDefined();
      expect(result.dimensions?.reliability).toBeDefined();
      expect(result.dimensions?.service).toBeDefined();
    });

    it('should score brand perception dimension', async () => {
      const input: SentimentInput = {
        id: 'brand-1',
        text: 'Apex has established itself as a trusted leader in the GEO space.',
        metadata: { source: 'article' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.dimensions?.brandPerception).toBeGreaterThan(0.5);
    });

    it('should score product quality dimension', async () => {
      const input: SentimentInput = {
        id: 'quality-1',
        text: 'The product quality of Apex is exceptional. Never had any issues.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.dimensions?.productQuality).toBeGreaterThan(0.5);
    });

    it('should score value for money dimension', async () => {
      const input: SentimentInput = {
        id: 'value-1',
        text: 'Apex offers excellent value for the features you get.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.dimensions?.valueForMoney).toBeGreaterThan(0.5);
    });
  });

  describe('Emotion Detection', () => {
    it('should detect joy emotion', async () => {
      const input: SentimentInput = {
        id: 'joy-1',
        text: 'So excited about Apex! This is exactly what we needed!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.emotions?.joy).toBeGreaterThan(0.5);
    });

    it('should detect frustration emotion', async () => {
      const input: SentimentInput = {
        id: 'frust-1',
        text: 'Ugh, Apex keeps crashing. So frustrating!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.emotions?.frustration).toBeGreaterThan(0.5);
    });

    it('should detect trust emotion', async () => {
      const input: SentimentInput = {
        id: 'trust-1',
        text: 'I trust Apex completely with our brand monitoring needs.',
        metadata: { source: 'testimonial' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.emotions?.trust).toBeGreaterThan(0.5);
    });

    it('should detect anticipation emotion', async () => {
      const input: SentimentInput = {
        id: 'antic-1',
        text: 'Can not wait for the new Apex features coming next month!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.emotions?.anticipation).toBeGreaterThan(0.5);
    });

    it('should provide complete emotion breakdown', async () => {
      const input: SentimentInput = {
        id: 'emotions-1',
        text: 'Apex is wonderful but I am worried about the price increase.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.emotions).toHaveProperty('joy');
      expect(result.emotions).toHaveProperty('fear');
      expect(result.emotions).toHaveProperty('trust');
      expect(result.emotions).toHaveProperty('surprise');
      expect(result.emotions).toHaveProperty('anticipation');
    });
  });

  describe('Aspect-Based Sentiment', () => {
    it('should analyze sentiment by aspect', async () => {
      const input: SentimentInput = {
        id: 'aspect-1',
        text: 'Apex has excellent analytics but the UI could be more intuitive.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeAspectSentiment(input);
      expect(result.aspects).toBeDefined();
      expect(result.aspects?.find(a => a.aspect === 'analytics')?.sentiment).toBe('positive');
      expect(result.aspects?.find(a => a.aspect === 'UI')?.sentiment).toBe('negative');
    });

    it('should identify sentiment for pricing aspect', async () => {
      const input: SentimentInput = {
        id: 'price-1',
        text: 'Love everything about Apex except the pricing which is a bit steep.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeAspectSentiment(input);
      const pricingAspect = result.aspects?.find(a => a.aspect === 'pricing');
      expect(pricingAspect?.sentiment).toBe('negative');
    });

    it('should identify sentiment for support aspect', async () => {
      const input: SentimentInput = {
        id: 'support-1',
        text: 'Apex support team is incredibly responsive and helpful.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeAspectSentiment(input);
      const supportAspect = result.aspects?.find(a => a.aspect === 'support');
      expect(supportAspect?.sentiment).toBe('positive');
    });

    it('should provide aspect confidence scores', async () => {
      const input: SentimentInput = {
        id: 'aspect-conf-1',
        text: 'The reporting features in Apex are outstanding.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeAspectSentiment(input);
      const aspects = result.aspects || [];
      expect(aspects.every(a => a.confidence !== undefined)).toBe(true);
      expect(aspects.every(a => a.confidence >= 0 && a.confidence <= 1)).toBe(true);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple inputs', async () => {
      const inputs: SentimentInput[] = [
        { id: 'batch-1', text: 'Apex is great!', metadata: { source: 'twitter' } },
        { id: 'batch-2', text: 'Not happy with Apex', metadata: { source: 'twitter' } },
        { id: 'batch-3', text: 'Apex released an update', metadata: { source: 'news' } },
      ];

      const results = await service.analyzeSentimentBatch(inputs);
      expect(results).toHaveLength(3);
      expect(results[0].overallSentiment).toBe('positive');
      expect(results[1].overallSentiment).toBe('negative');
      expect(results[2].overallSentiment).toBe('neutral');
    });

    it('should handle large batches efficiently', async () => {
      const inputs: SentimentInput[] = Array.from({ length: 100 }, (_, i) => ({
        id: `large-${i}`,
        text: `This is content number ${i} about Apex.`,
        metadata: { source: 'twitter' },
      }));

      const startTime = Date.now();
      const results = await service.analyzeSentimentBatch(inputs);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should emit progress events', async () => {
      const progressHandler = vi.fn();
      service.on('batchProgress', progressHandler);

      const inputs: SentimentInput[] = Array.from({ length: 10 }, (_, i) => ({
        id: `prog-${i}`,
        text: `Content ${i} about Apex`,
        metadata: { source: 'twitter' },
      }));

      await service.analyzeSentimentBatch(inputs);
      expect(progressHandler).toHaveBeenCalled();
    });
  });

  describe('Sentiment Aggregation', () => {
    it('should aggregate sentiment scores', async () => {
      const scores: SentimentScore[] = [
        { id: 'agg-1', score: 0.8, overallSentiment: 'positive', confidence: 0.9 },
        { id: 'agg-2', score: 0.6, overallSentiment: 'positive', confidence: 0.85 },
        { id: 'agg-3', score: -0.3, overallSentiment: 'negative', confidence: 0.7 },
      ];

      const aggregated = service.aggregateSentiment(scores);
      expect(aggregated.averageScore).toBeCloseTo(0.367, 1);
      expect(aggregated.positiveCount).toBe(2);
      expect(aggregated.negativeCount).toBe(1);
    });

    it('should calculate weighted average by confidence', async () => {
      const scores: SentimentScore[] = [
        { id: 'w-1', score: 0.9, overallSentiment: 'positive', confidence: 0.95 },
        { id: 'w-2', score: 0.2, overallSentiment: 'neutral', confidence: 0.5 },
      ];

      const aggregated = service.aggregateSentiment(scores, { weightByConfidence: true });
      expect(aggregated.weightedAverageScore).toBeGreaterThan(0.5);
    });

    it('should provide sentiment distribution', async () => {
      const scores: SentimentScore[] = [
        { id: 'd-1', score: 0.8, overallSentiment: 'positive', confidence: 0.9 },
        { id: 'd-2', score: 0.7, overallSentiment: 'positive', confidence: 0.85 },
        { id: 'd-3', score: 0.1, overallSentiment: 'neutral', confidence: 0.8 },
        { id: 'd-4', score: -0.5, overallSentiment: 'negative', confidence: 0.75 },
      ];

      const aggregated = service.aggregateSentiment(scores);
      expect(aggregated.distribution.positive).toBe(0.5);
      expect(aggregated.distribution.neutral).toBe(0.25);
      expect(aggregated.distribution.negative).toBe(0.25);
    });
  });

  describe('Sentiment Trends', () => {
    it('should calculate sentiment trend over time', async () => {
      const scores: Array<SentimentScore & { timestamp: Date }> = [
        { id: 't-1', score: 0.3, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-01') },
        { id: 't-2', score: 0.4, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-02') },
        { id: 't-3', score: 0.6, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-03') },
        { id: 't-4', score: 0.7, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-04') },
      ];

      const trend = service.calculateTrend(scores);
      expect(trend.direction).toBe('improving');
      expect(trend.slope).toBeGreaterThan(0);
    });

    it('should detect declining sentiment', async () => {
      const scores: Array<SentimentScore & { timestamp: Date }> = [
        { id: 'dec-1', score: 0.8, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-01') },
        { id: 'dec-2', score: 0.5, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-02') },
        { id: 'dec-3', score: 0.1, overallSentiment: 'neutral', confidence: 0.8, timestamp: new Date('2024-01-03') },
        { id: 'dec-4', score: -0.3, overallSentiment: 'negative', confidence: 0.8, timestamp: new Date('2024-01-04') },
      ];

      const trend = service.calculateTrend(scores);
      expect(trend.direction).toBe('declining');
      expect(trend.slope).toBeLessThan(0);
    });

    it('should detect stable sentiment', async () => {
      const scores: Array<SentimentScore & { timestamp: Date }> = [
        { id: 'stab-1', score: 0.5, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-01') },
        { id: 'stab-2', score: 0.52, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-02') },
        { id: 'stab-3', score: 0.48, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-03') },
        { id: 'stab-4', score: 0.51, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-04') },
      ];

      const trend = service.calculateTrend(scores);
      expect(trend.direction).toBe('stable');
    });

    it('should provide trend confidence', async () => {
      const scores: Array<SentimentScore & { timestamp: Date }> = [
        { id: 'tc-1', score: 0.3, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-01') },
        { id: 'tc-2', score: 0.6, overallSentiment: 'positive', confidence: 0.8, timestamp: new Date('2024-01-02') },
      ];

      const trend = service.calculateTrend(scores);
      expect(trend.confidence).toBeDefined();
      expect(trend.confidence).toBeGreaterThan(0);
      expect(trend.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Comparative Sentiment', () => {
    it('should compare sentiment against competitors', async () => {
      const input: SentimentInput = {
        id: 'comp-1',
        text: 'Apex is much better than Semrush for our needs.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeComparativeSentiment(input);
      expect(result.comparisons).toBeDefined();
      expect(result.comparisons?.find(c => c.entity === 'Apex')?.sentiment).toBe('positive');
      expect(result.comparisons?.find(c => c.entity === 'Semrush')?.relativePosition).toBe('inferior');
    });

    it('should detect comparative language', async () => {
      const input: SentimentInput = {
        id: 'comp-lang-1',
        text: 'Unlike other tools, Apex actually delivers on its promises.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeComparativeSentiment(input);
      expect(result.hasComparison).toBe(true);
    });
  });

  describe('Language Support', () => {
    it('should analyze Spanish sentiment', async () => {
      const input: SentimentInput = {
        id: 'es-1',
        text: 'Apex es excelente para el monitoreo de marca.',
        metadata: { source: 'twitter', language: 'es' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('positive');
      expect(result.detectedLanguage).toBe('es');
    });

    it('should analyze German sentiment', async () => {
      const input: SentimentInput = {
        id: 'de-1',
        text: 'Apex ist ein schreckliches Produkt.',
        metadata: { source: 'review', language: 'de' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('negative');
      expect(result.detectedLanguage).toBe('de');
    });

    it('should auto-detect language', async () => {
      const input: SentimentInput = {
        id: 'auto-1',
        text: 'Apex est vraiment formidable!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.detectedLanguage).toBe('fr');
    });
  });

  describe('Sarcasm Detection', () => {
    it('should detect sarcastic positive statements', async () => {
      const input: SentimentInput = {
        id: 'sarc-1',
        text: 'Oh great, Apex crashed again. What a surprise.',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.sarcasmDetected).toBe(true);
      expect(result.overallSentiment).toBe('negative');
    });

    it('should provide sarcasm confidence', async () => {
      const input: SentimentInput = {
        id: 'sarc-conf-1',
        text: 'Wow, paying $500/month for bugs. Best investment ever!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.sarcasmConfidence).toBeGreaterThan(0.5);
    });
  });

  describe('Intensity Analysis', () => {
    it('should detect high intensity sentiment', async () => {
      const input: SentimentInput = {
        id: 'intense-1',
        text: 'ABSOLUTELY LOVE APEX!!! BEST THING EVER!!!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.intensity).toBe('high');
    });

    it('should detect low intensity sentiment', async () => {
      const input: SentimentInput = {
        id: 'low-1',
        text: 'Apex is okay, I guess.',
        metadata: { source: 'review' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.intensity).toBe('low');
    });

    it('should provide intensity score', async () => {
      const input: SentimentInput = {
        id: 'int-score-1',
        text: 'Apex is really really great!',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.intensityScore).toBeDefined();
      expect(result.intensityScore).toBeGreaterThan(0);
    });
  });

  describe('Configuration Updates', () => {
    it('should update model type', () => {
      service.updateConfig({ modelType: 'basic' });
      expect(service.getConfig().modelType).toBe('basic');
    });

    it('should update language support', () => {
      service.updateConfig({ languageSupport: ['en', 'ja', 'zh'] });
      expect(service.getConfig().languageSupport).toContain('ja');
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      service.on('configUpdated', handler);
      service.updateConfig({ includeDimensions: false });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty text', async () => {
      const input: SentimentInput = {
        id: 'empty-1',
        text: '',
        metadata: { source: 'twitter' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('neutral');
      expect(result.score).toBe(0);
    });

    it('should handle very long text', async () => {
      const input: SentimentInput = {
        id: 'long-1',
        text: 'Apex is great. '.repeat(1000),
        metadata: { source: 'article' },
      };

      const result = await service.analyzeSentiment(input);
      expect(result.overallSentiment).toBe('positive');
    });

    it('should emit error event on failure', async () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      const invalidInput = null as unknown as SentimentInput;
      await service.analyzeSentiment(invalidInput);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track analysis statistics', async () => {
      const inputs: SentimentInput[] = [
        { id: 'stat-1', text: 'Great!', metadata: { source: 'twitter' } },
        { id: 'stat-2', text: 'Bad!', metadata: { source: 'twitter' } },
      ];

      for (const input of inputs) {
        await service.analyzeSentiment(input);
      }

      const stats = service.getStats();
      expect(stats.totalAnalyzed).toBe(2);
    });

    it('should track average processing time', async () => {
      const input: SentimentInput = {
        id: 'time-1',
        text: 'Apex is fantastic!',
        metadata: { source: 'twitter' },
      };

      await service.analyzeSentiment(input);
      const stats = service.getStats();
      expect(stats.averageProcessingTimeMs).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const input: SentimentInput = {
        id: 'reset-1',
        text: 'Test',
        metadata: { source: 'twitter' },
      };

      await service.analyzeSentiment(input);
      service.resetStats();
      expect(service.getStats().totalAnalyzed).toBe(0);
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
