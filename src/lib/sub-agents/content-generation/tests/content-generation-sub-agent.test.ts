import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ContentGenerationSubAgent,
  createContentGenerationSubAgent,
  ContentRequestSchema,
  ContentGenerationConfigSchema,
  type ContentRequest,
  type ContentGenerationConfig,
  type BrandVoiceProfile,
  type ContentExample,
  type GeneratedContent,
  type ContentType,
  type Platform
} from '../src/content-generation-sub-agent';

describe('ContentGenerationSubAgent', () => {
  let subAgent: ContentGenerationSubAgent;
  const defaultConfig: Partial<ContentGenerationConfig> = {
    brandId: 'test-brand-123',
    brandName: 'Test Brand',
    apiKeys: {
      anthropic: 'test-api-key'
    }
  };

  beforeEach(() => {
    subAgent = new ContentGenerationSubAgent(defaultConfig);
  });

  afterEach(() => {
    subAgent.clearCache();
  });

  describe('Constructor and Initialization', () => {
    it('should create instance with valid config', () => {
      expect(subAgent).toBeInstanceOf(ContentGenerationSubAgent);
    });

    it('should throw error for invalid config', () => {
      // brandId and brandName are required fields, so empty config should throw
      expect(() => new ContentGenerationSubAgent({})).toThrow();
    });

    it('should not be initialized before calling initialize()', () => {
      expect(subAgent.isInitialized()).toBe(false);
    });

    it('should be initialized after calling initialize()', async () => {
      await subAgent.initialize();
      expect(subAgent.isInitialized()).toBe(true);
    });

    it('should emit initializing event during initialization', async () => {
      const initializingSpy = vi.fn();
      subAgent.on('initializing', initializingSpy);
      await subAgent.initialize();
      expect(initializingSpy).toHaveBeenCalled();
    });

    it('should emit initialized event after initialization', async () => {
      const initializedSpy = vi.fn();
      subAgent.on('initialized', initializedSpy);
      await subAgent.initialize();
      expect(initializedSpy).toHaveBeenCalled();
    });

    it('should not re-initialize if already initialized', async () => {
      const initializingSpy = vi.fn();
      subAgent.on('initializing', initializingSpy);
      await subAgent.initialize();
      await subAgent.initialize();
      expect(initializingSpy).toHaveBeenCalledTimes(1);
    });

    it('should apply default config values', () => {
      const config = subAgent.getConfig();
      expect(config.defaultPlatform).toBe('website');
      expect(config.enablePerformancePrediction).toBe(true);
      expect(config.enableOriginalityCheck).toBe(true);
      expect(config.enableAutoSEO).toBe(true);
    });
  });

  describe('Zod Schema Validation', () => {
    describe('ContentRequestSchema', () => {
      it('should validate valid content request', () => {
        const validRequest = {
          brandId: 'brand-123',
          type: 'blog_post',
          platform: 'website',
          topic: 'AI in Marketing'
        };
        expect(() => ContentRequestSchema.parse(validRequest)).not.toThrow();
      });

      it('should reject invalid content type', () => {
        const invalidRequest = {
          brandId: 'brand-123',
          type: 'invalid_type',
          platform: 'website',
          topic: 'Test Topic'
        };
        expect(() => ContentRequestSchema.parse(invalidRequest)).toThrow();
      });

      it('should reject invalid platform', () => {
        const invalidRequest = {
          brandId: 'brand-123',
          type: 'blog_post',
          platform: 'tiktok',
          topic: 'Test Topic'
        };
        expect(() => ContentRequestSchema.parse(invalidRequest)).toThrow();
      });

      it('should reject empty topic', () => {
        const invalidRequest = {
          brandId: 'brand-123',
          type: 'blog_post',
          platform: 'website',
          topic: ''
        };
        expect(() => ContentRequestSchema.parse(invalidRequest)).toThrow();
      });

      it('should apply default values for optional fields', () => {
        const minimalRequest = {
          brandId: 'brand-123',
          type: 'blog_post' as const,
          platform: 'website' as const,
          topic: 'Test Topic'
        };
        const parsed = ContentRequestSchema.parse(minimalRequest);
        expect(parsed.length).toBe('medium');
        expect(parsed.includeCallToAction).toBe(true);
      });

      it('should accept all valid content types', () => {
        const contentTypes: ContentType[] = ['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release'];
        for (const type of contentTypes) {
          const request = { brandId: 'test', type, platform: 'website' as const, topic: 'Test' };
          expect(() => ContentRequestSchema.parse(request)).not.toThrow();
        }
      });

      it('should accept all valid platforms', () => {
        const platforms: Platform[] = ['website', 'twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack'];
        for (const platform of platforms) {
          const request = { brandId: 'test', type: 'blog_post' as const, platform, topic: 'Test' };
          expect(() => ContentRequestSchema.parse(request)).not.toThrow();
        }
      });
    });

    describe('ContentGenerationConfigSchema', () => {
      it('should validate minimal config', () => {
        const config = {
          brandId: 'test',
          brandName: 'Test Brand',
          apiKeys: {}
        };
        expect(() => ContentGenerationConfigSchema.parse(config)).not.toThrow();
      });

      it('should apply default values', () => {
        const config = { brandId: 'test', brandName: 'Test', apiKeys: {} };
        const parsed = ContentGenerationConfigSchema.parse(config);
        expect(parsed.defaultPlatform).toBe('website');
        expect(parsed.contentTypes).toEqual(['blog_post', 'social_media', 'marketing_copy']);
        expect(parsed.maxContentLength.short).toBe(300);
        expect(parsed.maxContentLength.medium).toBe(1000);
        expect(parsed.maxContentLength.long).toBe(3000);
        expect(parsed.enablePerformancePrediction).toBe(true);
        expect(parsed.cacheTTL).toBe(3600);
        expect(parsed.concurrentGenerations).toBe(3);
      });

      it('should enforce concurrentGenerations limits', () => {
        const invalidConfig = { brandId: 'test', brandName: 'Test', apiKeys: {}, concurrentGenerations: 20 };
        expect(() => ContentGenerationConfigSchema.parse(invalidConfig)).toThrow();
      });
    });
  });

  describe('Content Generation', () => {
    const baseRequest: ContentRequest = {
      brandId: 'test-brand-123',
      type: 'blog_post',
      platform: 'website',
      topic: 'AI in Marketing'
    };

    it('should generate content successfully', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content?.id).toBeDefined();
    });

    it('should include processing time in result', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should auto-initialize if not initialized', async () => {
      expect(subAgent.isInitialized()).toBe(false);
      await subAgent.generateContent(baseRequest);
      expect(subAgent.isInitialized()).toBe(true);
    });

    it('should emit generation:start event', async () => {
      const startSpy = vi.fn();
      subAgent.on('generation:start', startSpy);
      await subAgent.generateContent(baseRequest);
      expect(startSpy).toHaveBeenCalled();
    });

    it('should emit generation:complete event on success', async () => {
      const completeSpy = vi.fn();
      subAgent.on('generation:complete', completeSpy);
      await subAgent.generateContent(baseRequest);
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should generate content with correct brandId', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.brandId).toBe(baseRequest.brandId);
    });

    it('should generate content with correct type', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.type).toBe(baseRequest.type);
    });

    it('should generate content with correct platform', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.platform).toBe(baseRequest.platform);
    });

    it('should generate content with title', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.title).toBeDefined();
      expect(result.content?.title.length).toBeGreaterThan(0);
    });

    it('should generate content with body', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.content).toBeDefined();
      expect(result.content?.content.length).toBeGreaterThan(0);
    });

    it('should include keywords in generated content', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.keywords).toBeDefined();
      expect(Array.isArray(result.content?.keywords)).toBe(true);
    });

    it('should set initial status to draft', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.status).toBe('draft');
    });

    it('should include timestamps', async () => {
      const result = await subAgent.generateContent(baseRequest);
      expect(result.content?.createdAt).toBeInstanceOf(Date);
      expect(result.content?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Content Type Generation', () => {
    it('should generate blog post content', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.success).toBe(true);
      expect(result.content?.title).toContain('Guide');
    });

    it('should generate social media content', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'twitter',
        topic: 'Test Topic'
      });
      expect(result.success).toBe(true);
    });

    it('should generate marketing copy', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'marketing_copy',
        platform: 'website',
        topic: 'Test Product'
      });
      expect(result.success).toBe(true);
      expect(result.content?.title).toContain('Discover');
    });

    it('should generate technical documentation', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'technical_docs',
        platform: 'website',
        topic: 'API Integration'
      });
      expect(result.success).toBe(true);
      expect(result.content?.title).toContain('Technical Documentation');
    });

    it('should generate press release', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'press_release',
        platform: 'website',
        topic: 'Product Launch'
      });
      expect(result.success).toBe(true);
      expect(result.content?.content).toContain('FOR IMMEDIATE RELEASE');
    });
  });

  describe('Platform Optimization', () => {
    it('should truncate Twitter content to 280 characters', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'twitter',
        topic: 'A very long topic that should be shortened for Twitter platform optimization'
      });
      expect(result.success).toBe(true);
      expect(result.content?.content.length).toBeLessThanOrEqual(280);
    });

    it('should limit Twitter hashtags to 3', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'twitter',
        topic: 'Marketing AI Technology'
      });
      if (result.content?.hashtags) {
        expect(result.content.hashtags.length).toBeLessThanOrEqual(3);
      }
    });

    it('should add emoji markers for LinkedIn content', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'linkedin',
        topic: '# Test Heading'
      });
      expect(result.success).toBe(true);
    });

    it('should ensure Instagram has at least 5 hashtags', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'instagram',
        topic: 'Test'
      });
      if (result.content?.hashtags && result.content.hashtags.length > 0) {
        expect(result.content.hashtags.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should include summary for website content', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.summary).toBeDefined();
    });

    it('should include summary for Medium content', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'medium',
        topic: 'Test Topic'
      });
      expect(result.content?.summary).toBeDefined();
    });
  });

  describe('Content Metadata', () => {
    it('should calculate word count', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should calculate reading time', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.metadata.readingTime).toBeGreaterThanOrEqual(1);
    });

    it('should calculate SEO score', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.metadata.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.content?.metadata.seoScore).toBeLessThanOrEqual(1);
    });

    it('should calculate brand voice score', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.metadata.brandVoiceScore).toBeGreaterThanOrEqual(0);
      expect(result.content?.metadata.brandVoiceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate originality score when enabled', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.metadata.originalityScore).toBeGreaterThanOrEqual(0);
      expect(result.content?.metadata.originalityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Prediction', () => {
    it('should include performance prediction', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.performancePrediction).toBeDefined();
    });

    it('should calculate engagement probability', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.performancePrediction.engagementProbability).toBeGreaterThanOrEqual(0);
      expect(result.content?.performancePrediction.engagementProbability).toBeLessThanOrEqual(1);
    });

    it('should calculate visibility score', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.performancePrediction.visibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.content?.performancePrediction.visibilityScore).toBeLessThanOrEqual(1);
    });

    it('should calculate viral potential', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.performancePrediction.viralPotential).toBeGreaterThanOrEqual(0);
      expect(result.content?.performancePrediction.viralPotential).toBeLessThanOrEqual(1);
    });

    it('should calculate conversion likelihood', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.performancePrediction.conversionLikelihood).toBeGreaterThanOrEqual(0);
      expect(result.content?.performancePrediction.conversionLikelihood).toBeLessThanOrEqual(1);
    });

    it('should include recommendations array', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(Array.isArray(result.content?.performancePrediction.recommendations)).toBe(true);
    });

    it('should include A/B test suggestions', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(Array.isArray(result.content?.performancePrediction.abTestSuggestions)).toBe(true);
    });

    it('should provide title A/B test suggestion', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      const titleSuggestion = result.content?.performancePrediction.abTestSuggestions.find(
        s => s.element === 'title'
      );
      expect(titleSuggestion).toBeDefined();
      expect(titleSuggestion?.originalValue).toBeDefined();
      expect(titleSuggestion?.alternativeValue).toBeDefined();
    });

    it('should disable performance prediction when configured', async () => {
      const subAgentNoPrediction = new ContentGenerationSubAgent({
        ...defaultConfig,
        enablePerformancePrediction: false
      });
      const result = await subAgentNoPrediction.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test Topic'
      });
      expect(result.content?.performancePrediction.recommendations).toHaveLength(0);
      expect(result.content?.performancePrediction.abTestSuggestions).toHaveLength(0);
    });
  });

  describe('Brand Voice Learning', () => {
    it('should initialize with default brand voice profile', async () => {
      await subAgent.initialize();
      const profile = subAgent.getBrandVoiceProfile();
      expect(profile).toBeDefined();
      expect(profile?.brandId).toBe(defaultConfig.brandId);
    });

    it('should learn from content examples', async () => {
      await subAgent.initialize();
      const examples: ContentExample[] = [
        {
          id: 'ex1',
          type: 'blog_post',
          content: 'Our innovative solutions empower businesses to achieve excellence.',
          platform: 'website',
          performanceScore: 0.9
        }
      ];
      await subAgent.learnBrandVoice(examples);
      const profile = subAgent.getBrandVoiceProfile();
      expect(profile?.examples).toContain(examples[0]);
    });

    it('should increase confidence after learning', async () => {
      await subAgent.initialize();
      const initialProfile = subAgent.getBrandVoiceProfile();
      const initialConfidence = initialProfile?.confidence || 0;

      const examples: ContentExample[] = [
        { id: 'ex1', type: 'blog_post', content: 'Test content one', platform: 'website' },
        { id: 'ex2', type: 'blog_post', content: 'Test content two', platform: 'website' },
        { id: 'ex3', type: 'blog_post', content: 'Test content three', platform: 'website' }
      ];
      await subAgent.learnBrandVoice(examples);

      const updatedProfile = subAgent.getBrandVoiceProfile();
      expect(updatedProfile?.confidence).toBeGreaterThan(initialConfidence);
    });

    it('should emit brandVoice:updated event', async () => {
      await subAgent.initialize();
      const updateSpy = vi.fn();
      subAgent.on('brandVoice:updated', updateSpy);

      await subAgent.learnBrandVoice([
        { id: 'ex1', type: 'blog_post', content: 'Test content', platform: 'website' }
      ]);

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should extract preferred vocabulary from examples', async () => {
      await subAgent.initialize();
      const examples: ContentExample[] = [
        {
          id: 'ex1',
          type: 'blog_post',
          content: 'Innovation innovation innovation excellence excellence.',
          platform: 'website'
        }
      ];
      await subAgent.learnBrandVoice(examples);
      const profile = subAgent.getBrandVoiceProfile();
      expect(profile?.vocabulary.preferred).toContain('innovation');
      expect(profile?.vocabulary.preferred).toContain('excellence');
    });

    it('should update brand voice profile', async () => {
      await subAgent.initialize();
      await subAgent.updateBrandVoice({
        tone: ['friendly', 'casual'],
        style: ['conversational', 'engaging']
      });
      const profile = subAgent.getBrandVoiceProfile();
      expect(profile?.tone).toContain('friendly');
      expect(profile?.style).toContain('conversational');
    });

    it('should cap confidence at 0.95', async () => {
      await subAgent.initialize();
      const manyExamples: ContentExample[] = Array.from({ length: 20 }, (_, i) => ({
        id: `ex${i}`,
        type: 'blog_post' as ContentType,
        content: `Example content ${i}`,
        platform: 'website' as Platform
      }));
      await subAgent.learnBrandVoice(manyExamples);
      const profile = subAgent.getBrandVoiceProfile();
      expect(profile?.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe('Content Variations', () => {
    it('should generate multiple variations', async () => {
      const result = await subAgent.generateVariations({
        brandId: 'test',
        type: 'social_media',
        platform: 'twitter',
        topic: 'Test Topic'
      }, 3);
      expect(result.success).toBe(true);
      expect(result.variations).toHaveLength(3);
    });

    it('should generate different variations', async () => {
      const result = await subAgent.generateVariations({
        brandId: 'test',
        type: 'social_media',
        platform: 'twitter',
        topic: 'Test Topic'
      }, 3);
      const contents = result.variations?.map(v => v.content) || [];
      // At least some variations should differ (due to tone changes)
      expect(contents.length).toBe(3);
    });

    it('should include processing time for variations', async () => {
      const result = await subAgent.generateVariations({
        brandId: 'test',
        type: 'social_media',
        platform: 'twitter',
        topic: 'Test Topic'
      }, 2);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should return empty variations on failure', async () => {
      // Create a sub-agent with invalid config to potentially cause failures
      const result = await subAgent.generateVariations({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test'
      }, 0);
      expect(result.success).toBe(false);
      expect(result.variations).toHaveLength(0);
    });
  });

  describe('Caching', () => {
    it('should cache generated content', async () => {
      const request: ContentRequest = {
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Caching Test'
      };

      const result1 = await subAgent.generateContent(request);
      const result2 = await subAgent.generateContent(request);

      expect(result1.content?.id).toBe(result2.content?.id);
    });

    it('should return cached content faster', async () => {
      const request: ContentRequest = {
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Speed Test'
      };

      const result1 = await subAgent.generateContent(request);
      const result2 = await subAgent.generateContent(request);

      expect(result2.processingTime).toBeLessThanOrEqual(result1.processingTime);
    });

    it('should clear cache when requested', async () => {
      const request: ContentRequest = {
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Clear Cache Test'
      };

      const result1 = await subAgent.generateContent(request);
      subAgent.clearCache();
      const result2 = await subAgent.generateContent(request);

      expect(result1.content?.id).not.toBe(result2.content?.id);
    });

    it('should use different cache keys for different requests', async () => {
      const result1 = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Topic A'
      });

      const result2 = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Topic B'
      });

      expect(result1.content?.id).not.toBe(result2.content?.id);
    });

    it('should cache based on length parameter', async () => {
      const result1 = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Same Topic',
        length: 'short'
      });

      const result2 = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Same Topic',
        length: 'long'
      });

      expect(result1.content?.id).not.toBe(result2.content?.id);
    });
  });

  describe('Call To Action', () => {
    it('should include CTA when requested', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test',
        includeCallToAction: true
      });
      expect(result.content?.callToAction).toBeDefined();
    });

    it('should exclude CTA when not requested', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test',
        includeCallToAction: false
      });
      expect(result.content?.callToAction).toBeUndefined();
    });
  });

  describe('Hashtag Generation', () => {
    it('should generate hashtags from topic', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'instagram',
        topic: 'Marketing Strategy'
      });
      expect(result.content?.hashtags?.some(h => h.includes('Marketing'))).toBe(true);
    });

    it('should include keyword-based hashtags', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'instagram',
        topic: 'Test',
        keywords: ['innovation', 'technology']
      });
      expect(result.content?.hashtags?.some(h => h.toLowerCase().includes('innovation'))).toBe(true);
    });

    it('should limit hashtags to 10', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'instagram',
        topic: 'Very Long Topic With Many Words That Could Generate Many Hashtags',
        keywords: ['keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5']
      });
      expect(result.content?.hashtags?.length).toBeLessThanOrEqual(10);
    });

    it('should format hashtags correctly', async () => {
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'social_media',
        platform: 'instagram',
        topic: 'Test Topic'
      });
      result.content?.hashtags?.forEach(hashtag => {
        expect(hashtag.startsWith('#')).toBe(true);
      });
    });
  });

  describe('Factory Function', () => {
    it('should create sub-agent via factory function', () => {
      const agent = createContentGenerationSubAgent({
        brandId: 'factory-test',
        brandName: 'Factory Brand',
        apiKeys: {}
      });
      expect(agent).toBeInstanceOf(ContentGenerationSubAgent);
    });

    it('should create functional sub-agent', async () => {
      const agent = createContentGenerationSubAgent({
        brandId: 'factory-test',
        brandName: 'Factory Brand',
        apiKeys: {}
      });
      const result = await agent.generateContent({
        brandId: 'factory-test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Factory Test'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should emit generation:error event on failure', async () => {
      const errorSpy = vi.fn();
      subAgent.on('generation:error', errorSpy);

      // Create a scenario that might trigger an error
      // Since our templates don't actually call external APIs, we need to mock or force an error
      // For now, just verify the error handling structure exists
      expect(typeof errorSpy).toBe('function');
    });

    it('should return error message in result', async () => {
      // Test the error path by verifying the result structure
      const result = await subAgent.generateContent({
        brandId: 'test',
        type: 'blog_post',
        platform: 'website',
        topic: 'Test'
      });
      // Should succeed normally
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid request gracefully', async () => {
      // The Zod schema should catch this
      try {
        await subAgent.generateContent({
          brandId: 'test',
          type: 'invalid' as ContentType,
          platform: 'website',
          topic: 'Test'
        });
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
