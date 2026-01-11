/**
 * SentimentAnalysisService Tests
 * TDD tests for multi-dimensional sentiment scoring and emotion classification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SentimentAnalysisService,
  createSentimentAnalysisService,
  type SentimentConfig,
  type SentimentResult,
  type EmotionResult,
  type SentimentTrend,
} from '../src/services/sentiment-analysis-service';

describe('SentimentAnalysisService', () => {
  let service: SentimentAnalysisService;

  beforeEach(() => {
    service = createSentimentAnalysisService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();

      expect(config.enableEmotionDetection).toBe(true);
      expect(config.enableIntensityScoring).toBe(true);
      expect(config.confidenceThreshold).toBeGreaterThan(0);
    });

    it('should accept custom configuration', () => {
      const customService = createSentimentAnalysisService({
        confidenceThreshold: 0.8,
        enableEmotionDetection: false,
        maxTextLength: 5000
      });

      const config = customService.getConfig();

      expect(config.confidenceThreshold).toBe(0.8);
      expect(config.enableEmotionDetection).toBe(false);
      expect(config.maxTextLength).toBe(5000);

      customService.shutdown();
    });

    it('should validate configuration values', () => {
      expect(() => createSentimentAnalysisService({
        confidenceThreshold: 1.5
      })).toThrow();

      expect(() => createSentimentAnalysisService({
        confidenceThreshold: -0.1
      })).toThrow();
    });
  });

  describe('Basic Sentiment Analysis', () => {
    it('should detect positive sentiment', () => {
      const result = service.analyzeSentiment('I absolutely love this product! It\'s amazing!');

      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const result = service.analyzeSentiment('This is terrible! I hate it and want a refund.');

      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(-0.3);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect neutral sentiment', () => {
      const result = service.analyzeSentiment('The product arrived today. It is a product.');

      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBeGreaterThanOrEqual(-0.3);
      expect(result.score).toBeLessThanOrEqual(0.3);
    });

    it('should detect mixed sentiment', () => {
      const result = service.analyzeSentiment('I love the design but hate the price.');

      expect(result.sentiment).toBe('mixed');
      expect(result.aspects).toBeDefined();
    });

    it('should return confidence score', () => {
      const result = service.analyzeSentiment('I really love this!');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Sentiment Scoring', () => {
    it('should provide numeric sentiment score', () => {
      const result = service.analyzeSentiment('Great product!');

      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should score intensifiers correctly', () => {
      const mild = service.analyzeSentiment('I like it.');
      const strong = service.analyzeSentiment('I absolutely LOVE it!');

      expect(strong.score).toBeGreaterThan(mild.score);
    });

    it('should handle negations', () => {
      const positive = service.analyzeSentiment('This is good.');
      const negated = service.analyzeSentiment('This is not good.');

      expect(negated.score).toBeLessThan(positive.score);
    });

    it('should normalize scores across languages', () => {
      const english = service.analyzeSentiment('I love this!');

      expect(english.score).toBeGreaterThanOrEqual(-1);
      expect(english.score).toBeLessThanOrEqual(1);
    });
  });

  describe('Emotion Detection', () => {
    it('should detect joy emotion', () => {
      const result = service.analyzeEmotions('I\'m so happy and excited about this!');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'joy' })
      );
    });

    it('should detect anger emotion', () => {
      const result = service.analyzeEmotions('I\'m furious about this terrible service!');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'anger' })
      );
    });

    it('should detect sadness emotion', () => {
      const result = service.analyzeEmotions('I\'m so disappointed and sad about this.');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'sadness' })
      );
    });

    it('should detect fear emotion', () => {
      const result = service.analyzeEmotions('I\'m worried and scared about using this.');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'fear' })
      );
    });

    it('should detect surprise emotion', () => {
      const result = service.analyzeEmotions('Wow! I can\'t believe how amazing this is!');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'surprise' })
      );
    });

    it('should detect disgust emotion', () => {
      const result = service.analyzeEmotions('This is disgusting and revolting.');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'disgust' })
      );
    });

    it('should detect trust emotion', () => {
      const result = service.analyzeEmotions('I completely trust this brand. They are reliable.');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'trust' })
      );
    });

    it('should detect anticipation emotion', () => {
      const result = service.analyzeEmotions('I can\'t wait for the new release! So excited!');

      expect(result.emotions).toContainEqual(
        expect.objectContaining({ type: 'anticipation' })
      );
    });

    it('should provide emotion intensity scores', () => {
      const result = service.analyzeEmotions('I\'m absolutely FURIOUS!');

      const angerEmotion = result.emotions.find(e => e.type === 'anger');
      expect(angerEmotion?.intensity).toBeGreaterThan(0.5);
    });

    it('should detect multiple emotions', () => {
      const result = service.analyzeEmotions('I\'m so happy but also a bit worried about the price.');

      expect(result.emotions.length).toBeGreaterThan(1);
    });
  });

  describe('Aspect-Based Sentiment', () => {
    it('should extract aspect-level sentiments', () => {
      const result = service.analyzeAspectSentiment(
        'The product quality is excellent, but the shipping was terrible.'
      );

      expect(result.aspects).toHaveLength(2);

      const qualityAspect = result.aspects.find(a => a.aspect.includes('quality'));
      const shippingAspect = result.aspects.find(a => a.aspect.includes('shipping'));

      expect(qualityAspect?.sentiment).toBe('positive');
      expect(shippingAspect?.sentiment).toBe('negative');
    });

    it('should identify common aspects', () => {
      const result = service.analyzeAspectSentiment(
        'Great customer service but slow delivery and high prices.'
      );

      const aspects = result.aspects.map(a => a.aspect);
      expect(aspects.some(a => a.includes('service') || a.includes('customer'))).toBe(true);
    });

    it('should score aspect sentiments', () => {
      const result = service.analyzeAspectSentiment(
        'The design is beautiful but the durability is poor.'
      );

      result.aspects.forEach(aspect => {
        expect(aspect.score).toBeGreaterThanOrEqual(-1);
        expect(aspect.score).toBeLessThanOrEqual(1);
      });
    });

    it('should identify aspect categories', () => {
      const result = service.analyzeAspectSentiment(
        'Love the product features, hate the price point.'
      );

      expect(result.aspects.some(a => a.category === 'product')).toBe(true);
      expect(result.aspects.some(a => a.category === 'price')).toBe(true);
    });
  });

  describe('Sentiment Intensity', () => {
    it('should measure sentiment intensity', () => {
      const mild = service.measureIntensity('I like it.');
      const moderate = service.measureIntensity('I really like it!');
      const strong = service.measureIntensity('I absolutely LOVE it!!!');

      expect(strong.intensity).toBeGreaterThan(moderate.intensity);
      expect(moderate.intensity).toBeGreaterThan(mild.intensity);
    });

    it('should classify intensity levels', () => {
      const strong = service.measureIntensity('I absolutely HATE this terrible product!');

      expect(['low', 'medium', 'high', 'extreme']).toContain(strong.level);
    });

    it('should detect intensifier words', () => {
      const result = service.measureIntensity('This is extremely amazing and absolutely wonderful!');

      expect(result.intensifiers).toContain('extremely');
      expect(result.intensifiers).toContain('absolutely');
    });
  });

  describe('Contextual Sentiment', () => {
    it('should adjust for sarcasm indicators', () => {
      const result = service.analyzeContextualSentiment(
        'Oh great, another delay. Just what I needed.',
        { detectSarcasm: true }
      );

      expect(result.sarcasmDetected).toBe(true);
      expect(result.adjustedSentiment).toBe('negative');
    });

    it('should consider domain context', () => {
      const result = service.analyzeContextualSentiment(
        'This product is sick!',
        { domain: 'social-media' }
      );

      // 'sick' in social media context is often positive slang
      expect(result.sentiment).toBe('positive');
    });

    it('should handle emojis', () => {
      const positive = service.analyzeContextualSentiment('Great product! 😍🎉', {});
      const negative = service.analyzeContextualSentiment('Terrible experience 😡😤', {});

      expect(positive.sentiment).toBe('positive');
      expect(negative.sentiment).toBe('negative');
    });

    it('should consider platform context', () => {
      const twitterResult = service.analyzeContextualSentiment(
        'This is fire 🔥',
        { platform: 'twitter' }
      );

      expect(twitterResult.sentiment).toBe('positive');
    });
  });

  describe('Batch Sentiment Analysis', () => {
    it('should analyze multiple texts', async () => {
      const texts = [
        'I love this!',
        'This is terrible.',
        'It\'s okay I guess.'
      ];

      const results = await service.analyzeBatch(texts);

      expect(results).toHaveLength(3);
      expect(results[0].sentiment).toBe('positive');
      expect(results[1].sentiment).toBe('negative');
      expect(results[2].sentiment).toBe('neutral');
    });

    it('should handle batch errors gracefully', async () => {
      const texts = ['Valid text', '', 'Another valid text'];

      const results = await service.analyzeBatch(texts);

      expect(results).toHaveLength(3);
      expect(results[1].error).toBeDefined();
    });

    it('should provide aggregate statistics', async () => {
      const texts = [
        'Amazing!', 'Great!', 'Love it!',
        'Terrible', 'Awful',
        'It\'s okay'
      ];

      const results = await service.analyzeBatchWithStats(texts);

      expect(results.stats.positiveCount).toBe(3);
      expect(results.stats.negativeCount).toBe(2);
      expect(results.stats.neutralCount).toBe(1);
      expect(results.stats.averageScore).toBeDefined();
    });
  });

  describe('Sentiment Trends', () => {
    it('should calculate sentiment trend over time', () => {
      const dataPoints = [
        { text: 'Terrible product', timestamp: new Date(Date.now() - 7 * 86400000) },
        { text: 'Not great', timestamp: new Date(Date.now() - 5 * 86400000) },
        { text: 'Improving a bit', timestamp: new Date(Date.now() - 3 * 86400000) },
        { text: 'Actually quite good now!', timestamp: new Date(Date.now() - 86400000) },
        { text: 'Excellent service!', timestamp: new Date() }
      ];

      const trend = service.calculateSentimentTrend(dataPoints);

      expect(trend.direction).toBe('improving');
      expect(trend.changeRate).toBeGreaterThan(0);
    });

    it('should detect sentiment shifts', () => {
      const dataPoints = [
        { text: 'Great!', timestamp: new Date(Date.now() - 4 * 86400000) },
        { text: 'Love it!', timestamp: new Date(Date.now() - 3 * 86400000) },
        { text: 'Terrible now', timestamp: new Date(Date.now() - 2 * 86400000) },
        { text: 'Awful', timestamp: new Date(Date.now() - 86400000) }
      ];

      const trend = service.calculateSentimentTrend(dataPoints);

      expect(trend.shiftDetected).toBe(true);
      expect(trend.shiftPoint).toBeDefined();
    });

    it('should identify stable sentiment', () => {
      const dataPoints = [
        { text: 'Good product', timestamp: new Date(Date.now() - 3 * 86400000) },
        { text: 'Pretty good', timestamp: new Date(Date.now() - 2 * 86400000) },
        { text: 'I like it', timestamp: new Date(Date.now() - 86400000) },
        { text: 'Quite nice', timestamp: new Date() }
      ];

      const trend = service.calculateSentimentTrend(dataPoints);

      expect(trend.direction).toBe('stable');
      expect(trend.volatility).toBeLessThan(0.3);
    });

    it('should calculate volatility', () => {
      const volatileData = [
        { text: 'Amazing!', timestamp: new Date(Date.now() - 4 * 86400000) },
        { text: 'Terrible!', timestamp: new Date(Date.now() - 3 * 86400000) },
        { text: 'Fantastic!', timestamp: new Date(Date.now() - 2 * 86400000) },
        { text: 'Awful!', timestamp: new Date(Date.now() - 86400000) }
      ];

      const trend = service.calculateSentimentTrend(volatileData);

      expect(trend.volatility).toBeGreaterThan(0.5);
    });
  });

  describe('Comparative Analysis', () => {
    it('should compare sentiment between brands', () => {
      const brandATexts = ['Love Brand A!', 'Brand A is great!'];
      const brandBTexts = ['Brand B is okay', 'Meh about Brand B'];

      const comparison = service.compareSentiment(brandATexts, brandBTexts);

      expect(comparison.brandA.averageScore).toBeGreaterThan(comparison.brandB.averageScore);
    });

    it('should identify sentiment leaders', () => {
      const brandsData = {
        'Brand A': ['Excellent!', 'Amazing!', 'Love it!'],
        'Brand B': ['Good', 'Nice', 'Okay'],
        'Brand C': ['Terrible', 'Awful', 'Hate it']
      };

      const ranking = service.rankBySentiment(brandsData);

      expect(ranking[0].brand).toBe('Brand A');
      expect(ranking[2].brand).toBe('Brand C');
    });
  });

  describe('Event Handling', () => {
    it('should emit events for sentiment analysis', () => {
      const handler = vi.fn();
      service.on('sentiment:analyzed', handler);

      service.analyzeSentiment('Great product!');

      expect(handler).toHaveBeenCalled();
    });

    it('should emit events for negative sentiment alerts', () => {
      const handler = vi.fn();
      service.on('sentiment:negative-alert', handler);

      service.analyzeSentiment('This is absolutely terrible! I want a refund now!');

      expect(handler).toHaveBeenCalled();
    });

    it('should emit events for sentiment shifts', () => {
      const handler = vi.fn();
      service.on('sentiment:shift', handler);

      const dataPoints = [
        { text: 'Great!', timestamp: new Date(Date.now() - 2 * 86400000) },
        { text: 'Love it!', timestamp: new Date(Date.now() - 86400000) },
        { text: 'Absolutely terrible now!', timestamp: new Date() }
      ];

      service.calculateSentimentTrend(dataPoints);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Caching and Performance', () => {
    it('should cache repeated analysis', () => {
      const text = 'I love this product!';

      const first = service.analyzeSentiment(text);
      const second = service.analyzeSentiment(text);

      expect(first.score).toBe(second.score);
      expect(second.cached).toBe(true);
    });

    it('should respect cache TTL', async () => {
      const customService = createSentimentAnalysisService({
        cacheTTLMs: 100
      });

      const text = 'Test text';
      customService.analyzeSentiment(text);

      await new Promise(resolve => setTimeout(resolve, 150));

      const result = customService.analyzeSentiment(text);
      expect(result.cached).toBe(false);

      customService.shutdown();
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup resources on shutdown', () => {
      service.analyzeSentiment('Test');
      service.shutdown();

      // Should not throw
      expect(() => service.getConfig()).not.toThrow();
    });

    it('should clear cache on shutdown', () => {
      service.analyzeSentiment('Cached text');
      service.shutdown();

      const newService = createSentimentAnalysisService();
      const result = newService.analyzeSentiment('Cached text');

      expect(result.cached).toBe(false);

      newService.shutdown();
    });
  });
});
