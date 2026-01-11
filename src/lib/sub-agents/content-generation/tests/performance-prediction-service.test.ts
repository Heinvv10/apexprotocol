import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PerformancePredictionService,
  createPerformancePredictionService,
  PerformancePredictionConfig,
  PerformancePredictionConfigSchema,
  ContentAnalysisInput,
  ContentAnalysisInputSchema,
  PerformancePrediction,
  ABTestSuggestion,
  EngagementFactors,
  Platform
} from '../src/services/performance-prediction-service';

describe('PerformancePredictionService', () => {
  let service: PerformancePredictionService;

  beforeEach(() => {
    service = createPerformancePredictionService();
  });

  describe('Initialization', () => {
    it('should create service with default configuration', () => {
      expect(service).toBeInstanceOf(PerformancePredictionService);
    });

    it('should create service with custom configuration', () => {
      const customService = createPerformancePredictionService({
        enableABTestSuggestions: false,
        confidenceThreshold: 0.9
      });
      expect(customService).toBeInstanceOf(PerformancePredictionService);
    });

    it('should inherit from EventEmitter', () => {
      expect(typeof service.on).toBe('function');
      expect(typeof service.emit).toBe('function');
    });

    it('should emit events during prediction', async () => {
      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      service.on('prediction:start', startHandler);
      service.on('prediction:complete', completeHandler);

      const input: ContentAnalysisInput = {
        content: 'Test content for prediction',
        platform: 'twitter',
        contentType: 'social_media'
      };

      await service.predict(input);

      expect(startHandler).toHaveBeenCalled();
      expect(completeHandler).toHaveBeenCalled();
    });
  });

  describe('Zod Schema Validation', () => {
    describe('PerformancePredictionConfigSchema', () => {
      it('should validate valid configuration', () => {
        const validConfig = {
          enableABTestSuggestions: true,
          maxSuggestions: 5,
          confidenceThreshold: 0.7
        };
        expect(() => PerformancePredictionConfigSchema.parse(validConfig)).not.toThrow();
      });

      it('should apply default values', () => {
        const minConfig = {};
        const result = PerformancePredictionConfigSchema.parse(minConfig);
        expect(result.enableABTestSuggestions).toBe(true);
        expect(result.maxSuggestions).toBe(5);
        expect(result.confidenceThreshold).toBe(0.7);
      });

      it('should validate confidence threshold range', () => {
        const invalidConfig = {
          confidenceThreshold: 1.5
        };
        expect(() => PerformancePredictionConfigSchema.parse(invalidConfig)).toThrow();
      });
    });

    describe('ContentAnalysisInputSchema', () => {
      it('should validate valid input', () => {
        const validInput = {
          content: 'This is test content for analysis',
          platform: 'linkedin',
          contentType: 'blog_post',
          title: 'Test Title',
          hashtags: ['#test', '#content']
        };
        expect(() => ContentAnalysisInputSchema.parse(validInput)).not.toThrow();
      });

      it('should require content', () => {
        const invalidInput = {
          platform: 'twitter',
          contentType: 'social_media'
        };
        expect(() => ContentAnalysisInputSchema.parse(invalidInput)).toThrow();
      });

      it('should require platform', () => {
        const invalidInput = {
          content: 'Test content',
          contentType: 'social_media'
        };
        expect(() => ContentAnalysisInputSchema.parse(invalidInput)).toThrow();
      });

      it('should validate all platform types', () => {
        const platforms: Platform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack', 'website'];
        platforms.forEach(platform => {
          const input = {
            content: 'Test',
            platform,
            contentType: 'social_media'
          };
          expect(() => ContentAnalysisInputSchema.parse(input)).not.toThrow();
        });
      });
    });
  });

  describe('Performance Prediction', () => {
    it('should predict engagement probability', async () => {
      const input: ContentAnalysisInput = {
        content: 'Exciting news! We just launched a new feature that will transform your workflow.',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.success).toBe(true);
      expect(result.prediction).toBeDefined();
      expect(result.prediction?.engagementProbability).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.engagementProbability).toBeLessThanOrEqual(100);
    });

    it('should predict visibility score', async () => {
      const input: ContentAnalysisInput = {
        content: 'Comprehensive guide to SEO best practices for 2024',
        platform: 'medium',
        contentType: 'blog_post',
        keywords: ['SEO', 'best practices', '2024']
      };

      const result = await service.predict(input);

      expect(result.prediction?.visibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.visibilityScore).toBeLessThanOrEqual(100);
    });

    it('should predict viral potential', async () => {
      const input: ContentAnalysisInput = {
        content: 'You won\'t believe what happened next... This changed everything! 🚀',
        platform: 'twitter',
        contentType: 'social_media',
        hashtags: ['#viral', '#trending', '#mustread']
      };

      const result = await service.predict(input);

      expect(result.prediction?.viralPotential).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.viralPotential).toBeLessThanOrEqual(100);
    });

    it('should predict conversion likelihood', async () => {
      const input: ContentAnalysisInput = {
        content: 'Sign up now and get 50% off your first month! Limited time offer.',
        platform: 'facebook',
        contentType: 'marketing_copy',
        callToAction: 'Sign up now'
      };

      const result = await service.predict(input);

      expect(result.prediction?.conversionLikelihood).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.conversionLikelihood).toBeLessThanOrEqual(100);
    });

    it('should predict platform optimization score', async () => {
      const input: ContentAnalysisInput = {
        content: 'Short and punchy tweet with perfect length.',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.platformOptimizationScore).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.platformOptimizationScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Engagement Factors Analysis', () => {
    it('should analyze content length factor', async () => {
      const input: ContentAnalysisInput = {
        content: 'This is a test post with optimal length for the platform.',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.engagementFactors).toBeDefined();
      expect(result.prediction?.engagementFactors?.contentLength).toBeDefined();
    });

    it('should analyze hashtag effectiveness', async () => {
      const input: ContentAnalysisInput = {
        content: 'Great content here',
        platform: 'instagram',
        contentType: 'social_media',
        hashtags: ['#marketing', '#socialmedia', '#growth']
      };

      const result = await service.predict(input);

      expect(result.prediction?.engagementFactors?.hashtagEffectiveness).toBeDefined();
    });

    it('should analyze emotional appeal', async () => {
      const input: ContentAnalysisInput = {
        content: 'We are absolutely thrilled to announce this amazing news! 🎉',
        platform: 'linkedin',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.engagementFactors?.emotionalAppeal).toBeDefined();
      expect(result.prediction?.engagementFactors?.emotionalAppeal).toBeGreaterThanOrEqual(0);
    });

    it('should analyze CTA strength', async () => {
      const input: ContentAnalysisInput = {
        content: 'Click here to learn more about our services.',
        platform: 'facebook',
        contentType: 'marketing_copy',
        callToAction: 'Click here to learn more'
      };

      const result = await service.predict(input);

      expect(result.prediction?.engagementFactors?.ctaStrength).toBeDefined();
    });

    it('should analyze timing recommendations', async () => {
      const input: ContentAnalysisInput = {
        content: 'Professional insights for your business.',
        platform: 'linkedin',
        contentType: 'blog_post'
      };

      const result = await service.predict(input);

      expect(result.prediction?.timingRecommendations).toBeDefined();
      expect(Array.isArray(result.prediction?.timingRecommendations)).toBe(true);
    });
  });

  describe('A/B Test Suggestions', () => {
    it('should generate A/B test suggestions when enabled', async () => {
      const serviceWithAB = createPerformancePredictionService({
        enableABTestSuggestions: true
      });

      const input: ContentAnalysisInput = {
        content: 'Check out our new product launch!',
        platform: 'twitter',
        contentType: 'social_media',
        title: 'Product Launch',
        callToAction: 'Check out now'
      };

      const result = await serviceWithAB.predict(input);

      expect(result.prediction?.abTestSuggestions).toBeDefined();
      expect(Array.isArray(result.prediction?.abTestSuggestions)).toBe(true);
    });

    it('should skip A/B test suggestions when disabled', async () => {
      const serviceWithoutAB = createPerformancePredictionService({
        enableABTestSuggestions: false
      });

      const input: ContentAnalysisInput = {
        content: 'Test content',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await serviceWithoutAB.predict(input);

      expect(result.prediction?.abTestSuggestions).toBeUndefined();
    });

    it('should suggest title variations', async () => {
      const input: ContentAnalysisInput = {
        content: 'Article content here',
        platform: 'medium',
        contentType: 'blog_post',
        title: 'Original Title'
      };

      const result = await service.predict(input);

      const titleSuggestion = result.prediction?.abTestSuggestions?.find(
        s => s.element === 'title'
      );
      expect(titleSuggestion).toBeDefined();
      expect(titleSuggestion?.alternativeValue).toBeDefined();
    });

    it('should suggest CTA variations', async () => {
      const input: ContentAnalysisInput = {
        content: 'Marketing content',
        platform: 'facebook',
        contentType: 'marketing_copy',
        callToAction: 'Buy Now'
      };

      const result = await service.predict(input);

      const ctaSuggestion = result.prediction?.abTestSuggestions?.find(
        s => s.element === 'cta'
      );
      expect(ctaSuggestion).toBeDefined();
    });

    it('should suggest opening variations', async () => {
      const input: ContentAnalysisInput = {
        content: 'This is how we start our post...',
        platform: 'linkedin',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      const openingSuggestion = result.prediction?.abTestSuggestions?.find(
        s => s.element === 'opening'
      );
      expect(openingSuggestion).toBeDefined();
    });

    it('should include expected impact for each suggestion', async () => {
      const input: ContentAnalysisInput = {
        content: 'Test content with title',
        platform: 'twitter',
        contentType: 'social_media',
        title: 'Test Title'
      };

      const result = await service.predict(input);

      if (result.prediction?.abTestSuggestions && result.prediction.abTestSuggestions.length > 0) {
        expect(result.prediction.abTestSuggestions[0].expectedImpact).toBeGreaterThanOrEqual(-100);
        expect(result.prediction.abTestSuggestions[0].expectedImpact).toBeLessThanOrEqual(100);
      }
    });

    it('should include rationale for each suggestion', async () => {
      const input: ContentAnalysisInput = {
        content: 'Test content',
        platform: 'twitter',
        contentType: 'social_media',
        title: 'Test Title'
      };

      const result = await service.predict(input);

      if (result.prediction?.abTestSuggestions && result.prediction.abTestSuggestions.length > 0) {
        expect(result.prediction.abTestSuggestions[0].rationale).toBeDefined();
        expect(result.prediction.abTestSuggestions[0].rationale.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Platform-Specific Predictions', () => {
    it('should optimize predictions for Twitter', async () => {
      const input: ContentAnalysisInput = {
        content: 'Short, punchy content for Twitter with a hook 🔥',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.platformInsights).toBeDefined();
      expect(result.prediction?.platformInsights?.platform).toBe('twitter');
    });

    it('should optimize predictions for LinkedIn', async () => {
      const input: ContentAnalysisInput = {
        content: 'Professional insights and industry analysis for thought leadership.',
        platform: 'linkedin',
        contentType: 'blog_post'
      };

      const result = await service.predict(input);

      expect(result.prediction?.platformInsights?.platform).toBe('linkedin');
    });

    it('should include platform-specific best practices', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for platform analysis',
        platform: 'instagram',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.platformInsights?.bestPractices).toBeDefined();
      expect(Array.isArray(result.prediction?.platformInsights?.bestPractices)).toBe(true);
    });

    it('should include ideal posting times', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for timing analysis',
        platform: 'facebook',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.platformInsights?.idealPostingTimes).toBeDefined();
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate improvement recommendations', async () => {
      const input: ContentAnalysisInput = {
        content: 'Basic content that could be improved.',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.recommendations).toBeDefined();
      expect(Array.isArray(result.prediction?.recommendations)).toBe(true);
      expect(result.prediction?.recommendations.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations by impact', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content needing multiple improvements',
        platform: 'linkedin',
        contentType: 'blog_post'
      };

      const result = await service.predict(input);

      if (result.prediction?.recommendations && result.prediction.recommendations.length > 1) {
        expect(result.prediction.recommendations[0]).toHaveProperty('priority');
      }
    });

    it('should categorize recommendations', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for categorized recommendations',
        platform: 'medium',
        contentType: 'blog_post'
      };

      const result = await service.predict(input);

      if (result.prediction?.recommendations && result.prediction.recommendations.length > 0) {
        expect(result.prediction.recommendations[0]).toHaveProperty('category');
      }
    });
  });

  describe('Historical Comparison', () => {
    it('should compare to historical benchmarks', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for benchmark comparison',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.benchmarkComparison).toBeDefined();
    });

    it('should include industry average comparison', async () => {
      const input: ContentAnalysisInput = {
        content: 'Industry comparison content',
        platform: 'linkedin',
        contentType: 'blog_post',
        industry: 'technology'
      };

      const result = await service.predict(input);

      expect(result.prediction?.benchmarkComparison?.industryAverage).toBeDefined();
    });

    it('should include percentile ranking', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for percentile ranking',
        platform: 'facebook',
        contentType: 'marketing_copy'
      };

      const result = await service.predict(input);

      expect(result.prediction?.benchmarkComparison?.percentile).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.benchmarkComparison?.percentile).toBeLessThanOrEqual(100);
    });
  });

  describe('Confidence Scoring', () => {
    it('should include confidence score in prediction', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for confidence analysis',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.prediction?.confidence).toBeDefined();
      expect(result.prediction?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.prediction?.confidence).toBeLessThanOrEqual(100);
    });

    it('should flag low confidence predictions', async () => {
      const serviceWithHighThreshold = createPerformancePredictionService({
        confidenceThreshold: 0.95
      });

      const input: ContentAnalysisInput = {
        content: 'Short content',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await serviceWithHighThreshold.predict(input);

      expect(result.prediction?.lowConfidenceWarning).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', async () => {
      const input = {
        content: '',
        platform: 'twitter',
        contentType: 'social_media'
      } as ContentAnalysisInput;

      const result = await service.predict(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should emit error events', async () => {
      const errorHandler = vi.fn();
      service.on('prediction:error', errorHandler);

      const input = {
        content: '',
        platform: 'twitter',
        contentType: 'social_media'
      } as ContentAnalysisInput;

      await service.predict(input);

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should include processing time even on error', async () => {
      const input = {
        content: '',
        platform: 'twitter',
        contentType: 'social_media'
      } as ContentAnalysisInput;

      const result = await service.predict(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Predictions', () => {
    it('should handle batch predictions', async () => {
      const inputs: ContentAnalysisInput[] = [
        {
          content: 'First content piece',
          platform: 'twitter',
          contentType: 'social_media'
        },
        {
          content: 'Second content piece for LinkedIn',
          platform: 'linkedin',
          contentType: 'blog_post'
        }
      ];

      const results = await service.predictBatch(inputs);

      expect(results.length).toBe(2);
      expect(results[0].prediction?.platformInsights?.platform).toBe('twitter');
      expect(results[1].prediction?.platformInsights?.platform).toBe('linkedin');
    });

    it('should handle partial failures in batch', async () => {
      const inputs: ContentAnalysisInput[] = [
        {
          content: 'Valid content',
          platform: 'twitter',
          contentType: 'social_media'
        },
        {
          content: '',
          platform: 'twitter',
          contentType: 'social_media'
        } as ContentAnalysisInput
      ];

      const results = await service.predictBatch(inputs);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Processing Metrics', () => {
    it('should track processing time', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for metrics tracking',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include analysis metadata', async () => {
      const input: ContentAnalysisInput = {
        content: 'Content for metadata analysis',
        platform: 'twitter',
        contentType: 'social_media'
      };

      const result = await service.predict(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.analyzedAt).toBeDefined();
    });
  });
});
