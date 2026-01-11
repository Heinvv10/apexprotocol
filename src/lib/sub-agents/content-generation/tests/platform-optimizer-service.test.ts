import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PlatformOptimizerService,
  createPlatformOptimizerService,
  ContentToOptimizeSchema,
  PlatformOptimizerConfigSchema,
  type Platform,
  type ContentToOptimize,
  type PlatformOptimizerConfig
} from '../src/services/platform-optimizer-service';

describe('PlatformOptimizerService', () => {
  let service: PlatformOptimizerService;

  beforeEach(() => {
    service = new PlatformOptimizerService();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(service).toBeInstanceOf(PlatformOptimizerService);
    });

    it('should accept custom config', () => {
      const customService = new PlatformOptimizerService({
        enableAutoHashtags: false,
        maxHashtagsDefault: 10
      });
      expect(customService).toBeInstanceOf(PlatformOptimizerService);
    });
  });

  describe('Zod Schema Validation', () => {
    describe('ContentToOptimizeSchema', () => {
      it('should validate minimal content', () => {
        const content = { content: 'Test content' };
        expect(() => ContentToOptimizeSchema.parse(content)).not.toThrow();
      });

      it('should reject empty content', () => {
        const content = { content: '' };
        expect(() => ContentToOptimizeSchema.parse(content)).toThrow();
      });

      it('should accept full content object', () => {
        const content = {
          title: 'Test Title',
          content: 'Test content body',
          summary: 'A brief summary',
          keywords: ['keyword1', 'keyword2'],
          hashtags: ['#hash1', '#hash2'],
          callToAction: 'Learn more'
        };
        expect(() => ContentToOptimizeSchema.parse(content)).not.toThrow();
      });

      it('should accept links array', () => {
        const content = {
          content: 'Test',
          links: ['https://example.com']
        };
        // Links are validated as URL strings
        expect(() => ContentToOptimizeSchema.parse(content)).not.toThrow();
      });

      it('should accept valid URLs', () => {
        const content = {
          content: 'Test',
          links: ['https://example.com']
        };
        expect(() => ContentToOptimizeSchema.parse(content)).not.toThrow();
      });
    });

    describe('PlatformOptimizerConfigSchema', () => {
      it('should validate empty config', () => {
        expect(() => PlatformOptimizerConfigSchema.parse({})).not.toThrow();
      });

      it('should apply defaults', () => {
        const config = PlatformOptimizerConfigSchema.parse({});
        expect(config.enableAutoHashtags).toBe(true);
        expect(config.enableAutoMentions).toBe(false);
        expect(config.maxHashtagsDefault).toBe(5);
        expect(config.targetEngagement).toBe('engagement');
      });

      it('should validate target engagement options', () => {
        expect(() => PlatformOptimizerConfigSchema.parse({ targetEngagement: 'invalid' })).toThrow();
        expect(() => PlatformOptimizerConfigSchema.parse({ targetEngagement: 'awareness' })).not.toThrow();
        expect(() => PlatformOptimizerConfigSchema.parse({ targetEngagement: 'conversion' })).not.toThrow();
      });
    });
  });

  describe('Platform Constraints', () => {
    it('should return constraints for Twitter', () => {
      const constraints = service.getConstraints('twitter');
      expect(constraints.maxCharacters).toBe(280);
      expect(constraints.maxHashtags).toBe(3);
    });

    it('should return constraints for LinkedIn', () => {
      const constraints = service.getConstraints('linkedin');
      expect(constraints.maxCharacters).toBe(3000);
      expect(constraints.maxHashtags).toBe(5);
    });

    it('should return constraints for Instagram', () => {
      const constraints = service.getConstraints('instagram');
      expect(constraints.maxCharacters).toBe(2200);
      expect(constraints.maxHashtags).toBe(30);
      expect(constraints.imageRequired).toBe(true);
    });

    it('should return constraints for Facebook', () => {
      const constraints = service.getConstraints('facebook');
      expect(constraints.maxCharacters).toBe(63206);
      expect(constraints.maxHashtags).toBe(3);
    });

    it('should return constraints for Medium', () => {
      const constraints = service.getConstraints('medium');
      expect(constraints.supportsMarkdown).toBe(true);
      expect(constraints.supportsHTML).toBe(true);
    });

    it('should return constraints for YouTube', () => {
      const constraints = service.getConstraints('youtube');
      expect(constraints.maxCharacters).toBe(5000);
      expect(constraints.maxHashtags).toBe(15);
    });

    it('should return constraints for TikTok', () => {
      const constraints = service.getConstraints('tiktok');
      expect(constraints.maxCharacters).toBe(2200);
      expect(constraints.maxHashtags).toBe(5);
    });

    it('should return constraints for Threads', () => {
      const constraints = service.getConstraints('threads');
      expect(constraints.maxCharacters).toBe(500);
    });

    it('should return default constraints for unknown platform', () => {
      const constraints = service.getConstraints('website');
      expect(constraints).toBeDefined();
      expect(constraints.platform).toBe('website');
    });
  });

  describe('Best Practices', () => {
    it('should return best practices for Twitter', () => {
      const practices = service.getBestPractices('twitter');
      expect(practices).toBeDefined();
      expect(practices?.idealPostLength.min).toBe(71);
      expect(practices?.idealPostLength.max).toBe(100);
    });

    it('should return best practices for LinkedIn', () => {
      const practices = service.getBestPractices('linkedin');
      expect(practices).toBeDefined();
      expect(practices?.contentTips.length).toBeGreaterThan(0);
    });

    it('should return best practices for Instagram', () => {
      const practices = service.getBestPractices('instagram');
      expect(practices).toBeDefined();
      expect(practices?.hashtagStrategy).toContain('20-30');
    });

    it('should include engagement tactics', () => {
      const practices = service.getBestPractices('twitter');
      expect(practices?.engagementTactics.length).toBeGreaterThan(0);
    });

    it('should include avoid list', () => {
      const practices = service.getBestPractices('linkedin');
      expect(practices?.avoidList.length).toBeGreaterThan(0);
    });
  });

  describe('Supported Platforms', () => {
    it('should list all supported platforms', () => {
      const platforms = service.getSupportedPlatforms();
      expect(platforms).toContain('twitter');
      expect(platforms).toContain('linkedin');
      expect(platforms).toContain('instagram');
      expect(platforms).toContain('facebook');
      expect(platforms).toContain('medium');
      expect(platforms).toContain('substack');
    });

    it('should include newer platforms', () => {
      const platforms = service.getSupportedPlatforms();
      expect(platforms).toContain('threads');
      expect(platforms).toContain('tiktok');
    });
  });

  describe('Content Optimization', () => {
    describe('Twitter Optimization', () => {
      it('should optimize content for Twitter', async () => {
        const content: ContentToOptimize = {
          content: 'Check out our latest blog post about AI optimization techniques!'
        };
        const result = await service.optimize(content, 'twitter');
        expect(result.success).toBe(true);
        expect(result.optimizedContent).toBeDefined();
      });

      it('should truncate long Twitter content', async () => {
        const longContent = 'A'.repeat(300);
        const result = await service.optimize({ content: longContent }, 'twitter');
        expect(result.success).toBe(true);
        expect(result.optimizedContent?.content.length).toBeLessThanOrEqual(280);
        expect(result.optimizedContent?.metadata.truncated).toBe(true);
      });

      it('should limit Twitter hashtags to 3', async () => {
        const content: ContentToOptimize = {
          content: 'Test content',
          hashtags: ['#one', '#two', '#three', '#four', '#five']
        };
        const result = await service.optimize(content, 'twitter');
        expect(result.optimizedContent?.hashtags.length).toBeLessThanOrEqual(3);
      });

      it('should handle Twitter thread suggestions', async () => {
        const longContent = 'This is a very long piece of content that would benefit from being posted as a thread. '.repeat(3);
        const result = await service.optimize({ content: longContent }, 'twitter');
        expect(result.optimizedContent?.platformSpecific.threadSuggested).toBe(true);
      });
    });

    describe('LinkedIn Optimization', () => {
      it('should optimize content for LinkedIn', async () => {
        const content: ContentToOptimize = {
          content: 'Excited to share our latest insights on professional development and career growth.'
        };
        const result = await service.optimize(content, 'linkedin');
        expect(result.success).toBe(true);
      });

      it('should add line breaks for LinkedIn readability', async () => {
        const content: ContentToOptimize = {
          content: 'First sentence here. Second sentence follows. Third sentence completes the thought.'
        };
        const result = await service.optimize(content, 'linkedin');
        // LinkedIn optimization adds line breaks
        expect(result.optimizedContent?.content).toContain('\n');
      });

      it('should limit LinkedIn hashtags to 5', async () => {
        const content: ContentToOptimize = {
          content: 'Test content',
          hashtags: ['#one', '#two', '#three', '#four', '#five', '#six', '#seven']
        };
        const result = await service.optimize(content, 'linkedin');
        expect(result.optimizedContent?.hashtags.length).toBeLessThanOrEqual(5);
      });
    });

    describe('Instagram Optimization', () => {
      it('should optimize content for Instagram', async () => {
        const content: ContentToOptimize = {
          content: 'Beautiful sunset views from today\'s adventure!'
        };
        const result = await service.optimize(content, 'instagram');
        expect(result.success).toBe(true);
      });

      it('should allow up to 30 hashtags for Instagram', async () => {
        const hashtags = Array.from({ length: 30 }, (_, i) => `#tag${i}`);
        const content: ContentToOptimize = {
          content: 'Test content',
          hashtags
        };
        const result = await service.optimize(content, 'instagram');
        expect(result.optimizedContent?.hashtags.length).toBeLessThanOrEqual(30);
      });

      it('should indicate visual requirement', async () => {
        const result = await service.optimize({ content: 'Test' }, 'instagram');
        expect(result.optimizedContent?.platformSpecific.visualRequired).toBe(true);
      });
    });

    describe('Medium Optimization', () => {
      it('should preserve markdown for Medium', async () => {
        const content: ContentToOptimize = {
          content: '# Heading\n\n**Bold text** and *italic text*\n\n- Bullet point'
        };
        const result = await service.optimize(content, 'medium');
        expect(result.success).toBe(true);
        // Medium supports markdown, so it should be preserved
        expect(result.optimizedContent?.content).toContain('#');
      });

      it('should suggest article structure analysis', async () => {
        const content: ContentToOptimize = {
          content: '# Introduction\n\nThis is the intro.\n\n# Main Point\n\nHere is the main point.\n\n- Bullet 1\n- Bullet 2'
        };
        const result = await service.optimize(content, 'medium');
        expect(result.optimizedContent?.platformSpecific.articleStructure).toBeDefined();
      });
    });
  });

  describe('Hashtag Optimization', () => {
    it('should format hashtags correctly', async () => {
      const content: ContentToOptimize = {
        content: 'Test content',
        hashtags: ['nohash', '#withhash']
      };
      const result = await service.optimize(content, 'twitter');
      result.optimizedContent?.hashtags.forEach(hashtag => {
        expect(hashtag.startsWith('#')).toBe(true);
      });
    });

    it('should add keyword-based hashtags', async () => {
      const content: ContentToOptimize = {
        content: 'Test content',
        keywords: ['marketing', 'growth'],
        hashtags: []
      };
      const result = await service.optimize(content, 'instagram');
      expect(result.optimizedContent?.hashtags.length).toBeGreaterThan(0);
    });

    it('should remove duplicate hashtags', async () => {
      const content: ContentToOptimize = {
        content: 'Test content',
        hashtags: ['#marketing', '#Marketing', '#MARKETING']
      };
      const result = await service.optimize(content, 'twitter');
      expect(result.optimizedContent?.hashtags.length).toBe(1);
    });
  });

  describe('Link Optimization', () => {
    it('should limit links for Twitter', async () => {
      const content: ContentToOptimize = {
        content: 'Test content',
        links: ['https://example1.com', 'https://example2.com', 'https://example3.com']
      };
      const result = await service.optimize(content, 'twitter');
      expect(result.optimizedContent?.links.length).toBeLessThanOrEqual(1);
    });

    it('should handle Instagram link limitation', async () => {
      const content: ContentToOptimize = {
        content: 'Test content',
        links: ['https://example.com', 'https://example2.com']
      };
      const result = await service.optimize(content, 'instagram');
      // Instagram has very limited link support
      const constraints = service.getConstraints('instagram');
      if (constraints.maxLinks !== undefined) {
        expect(result.optimizedContent?.links.length).toBeLessThanOrEqual(constraints.maxLinks);
      }
    });
  });

  describe('Title Optimization', () => {
    it('should shorten long titles for Twitter', async () => {
      const content: ContentToOptimize = {
        title: 'A'.repeat(60),
        content: 'Test content'
      };
      const result = await service.optimize(content, 'twitter');
      expect(result.optimizedContent?.title?.length).toBeLessThanOrEqual(50);
    });

    it('should handle titles for Medium', async () => {
      const content: ContentToOptimize = {
        title: 'My Article',
        content: 'Test content body goes here with more details.'
      };
      const result = await service.optimize(content, 'medium');
      // Medium titles may be enhanced with subtitle
      expect(result.optimizedContent?.title).toBeDefined();
    });
  });

  describe('Content Validation', () => {
    it('should validate content for platform', () => {
      const validation = service.validateForPlatform('Short tweet', 'twitter');
      expect(validation.valid).toBe(true);
      expect(validation.score).toBeGreaterThan(0);
    });

    it('should identify length issues', () => {
      const longContent = 'A'.repeat(300);
      const validation = service.validateForPlatform(longContent, 'twitter');
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.includes('exceeds') || i.includes('maximum'))).toBe(true);
    });

    it('should identify hashtag issues', () => {
      const content = 'Test #one #two #three #four #five';
      const validation = service.validateForPlatform(content, 'twitter');
      expect(validation.issues.some(i => i.includes('hashtags'))).toBe(true);
    });

    it('should return score based on issues', () => {
      const perfectContent = 'Great content here!';
      const problematicContent = 'A'.repeat(300) + ' #1 #2 #3 #4 #5 #6';

      const perfectValidation = service.validateForPlatform(perfectContent, 'twitter');
      const problematicValidation = service.validateForPlatform(problematicContent, 'twitter');

      expect(perfectValidation.score).toBeGreaterThan(problematicValidation.score);
    });
  });

  describe('Batch Optimization', () => {
    it('should optimize for multiple platforms', async () => {
      const content: ContentToOptimize = {
        content: 'Great content to share across platforms!'
      };
      const platforms: Platform[] = ['twitter', 'linkedin', 'facebook'];

      const result = await service.optimizeForMultiplePlatforms(content, platforms);
      expect(result.results.size).toBe(3);
    });

    it('should track failures in batch', async () => {
      const content: ContentToOptimize = {
        content: 'Test content'
      };
      const platforms: Platform[] = ['twitter', 'linkedin'];

      const result = await service.optimizeForMultiplePlatforms(content, platforms);
      expect(result.success).toBe(true);
      expect(result.failures.size).toBe(0);
    });

    it('should include processing time', async () => {
      const content: ContentToOptimize = {
        content: 'Test content'
      };
      const result = await service.optimizeForMultiplePlatforms(content, ['twitter']);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Optimization Metadata', () => {
    it('should track original length', async () => {
      const content = 'Original content here';
      const result = await service.optimize({ content }, 'twitter');
      expect(result.optimizedContent?.metadata.originalLength).toBe(content.length);
    });

    it('should track optimized length', async () => {
      const result = await service.optimize({ content: 'Test' }, 'twitter');
      expect(result.optimizedContent?.metadata.optimizedLength).toBeDefined();
    });

    it('should track formatting changes', async () => {
      const result = await service.optimize(
        { content: '# Markdown Header\n\n**Bold**' },
        'twitter'
      );
      expect(result.optimizedContent?.metadata.formattingChanges.length).toBeGreaterThan(0);
    });

    it('should track hashtags added', async () => {
      const content: ContentToOptimize = {
        content: 'Test content',
        keywords: ['marketing', 'growth'],
        hashtags: []
      };
      const result = await service.optimize(content, 'instagram');
      expect(result.optimizedContent?.metadata.hashtagsAdded).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Optimization Score', () => {
    it('should calculate optimization score', async () => {
      const result = await service.optimize({ content: 'Great tweet!' }, 'twitter');
      expect(result.optimizedContent?.optimizationScore).toBeGreaterThan(0);
      expect(result.optimizedContent?.optimizationScore).toBeLessThanOrEqual(100);
    });

    it('should score well-optimized content higher', async () => {
      const wellOptimized: ContentToOptimize = {
        content: 'Exciting news! Check out our latest update. Click the link to learn more!',
        hashtags: ['#news', '#update'],
        callToAction: 'Learn more'
      };
      const poorContent: ContentToOptimize = {
        content: 'ok',
        hashtags: []
      };

      const goodResult = await service.optimize(wellOptimized, 'twitter');
      const poorResult = await service.optimize(poorContent, 'twitter');

      expect(goodResult.optimizedContent?.optimizationScore).toBeGreaterThan(
        poorResult.optimizedContent?.optimizationScore || 0
      );
    });
  });

  describe('Suggestions and Warnings', () => {
    it('should generate suggestions', async () => {
      const result = await service.optimize({ content: 'Short content.' }, 'twitter');
      expect(Array.isArray(result.optimizedContent?.suggestions)).toBe(true);
    });

    it('should generate warnings for issues', async () => {
      const longContent = 'A'.repeat(300);
      const result = await service.optimize({ content: longContent }, 'twitter');
      expect(result.optimizedContent?.warnings.length).toBeGreaterThan(0);
    });

    it('should suggest CTA when missing', async () => {
      const result = await service.optimize({ content: 'Just some text.' }, 'twitter');
      const ctaSuggestion = result.optimizedContent?.suggestions.find(s =>
        s.toLowerCase().includes('call-to-action')
      );
      expect(ctaSuggestion).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should emit optimization:start event', async () => {
      const spy = vi.fn();
      service.on('optimization:start', spy);
      await service.optimize({ content: 'Test' }, 'twitter');
      expect(spy).toHaveBeenCalled();
    });

    it('should emit optimization:complete event', async () => {
      const spy = vi.fn();
      service.on('optimization:complete', spy);
      await service.optimize({ content: 'Test' }, 'twitter');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        platform: 'twitter',
        score: expect.any(Number)
      }));
    });

    it('should emit batch:start and batch:complete events', async () => {
      const startSpy = vi.fn();
      const completeSpy = vi.fn();
      service.on('batch:start', startSpy);
      service.on('batch:complete', completeSpy);

      await service.optimizeForMultiplePlatforms({ content: 'Test' }, ['twitter', 'linkedin']);

      expect(startSpy).toHaveBeenCalledWith({ platforms: 2 });
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Factory Function', () => {
    it('should create service via factory', () => {
      const factoryService = createPlatformOptimizerService();
      expect(factoryService).toBeInstanceOf(PlatformOptimizerService);
    });

    it('should accept config via factory', () => {
      const factoryService = createPlatformOptimizerService({
        enableAutoHashtags: false
      });
      expect(factoryService).toBeInstanceOf(PlatformOptimizerService);
    });

    it('should create functional service via factory', async () => {
      const factoryService = createPlatformOptimizerService();
      const result = await factoryService.optimize({ content: 'Test' }, 'twitter');
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return error for invalid content', async () => {
      // We need to bypass TypeScript to test runtime validation
      const result = await service.optimize({ content: '' } as ContentToOptimize, 'twitter');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should emit optimization:error event on failure', async () => {
      const spy = vi.fn();
      service.on('optimization:error', spy);

      await service.optimize({ content: '' } as ContentToOptimize, 'twitter');
      expect(spy).toHaveBeenCalled();
    });

    it('should include processing time even on error', async () => {
      const result = await service.optimize({ content: '' } as ContentToOptimize, 'twitter');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});
