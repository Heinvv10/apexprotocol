import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContentTypeHandlerService,
  createContentTypeHandlerService,
  ContentTypeConfig,
  ContentTypeConfigSchema,
  ContentTypeInput,
  ContentTypeInputSchema,
  ContentTypeOutput,
  BlogPostConfig,
  SocialMediaConfig,
  MarketingCopyConfig,
  TechnicalDocsConfig,
  PressReleaseConfig,
  ContentType
} from '../src/services/content-type-handler-service';

describe('ContentTypeHandlerService', () => {
  let service: ContentTypeHandlerService;

  beforeEach(() => {
    service = createContentTypeHandlerService();
  });

  describe('Initialization', () => {
    it('should create service with default configuration', () => {
      expect(service).toBeInstanceOf(ContentTypeHandlerService);
    });

    it('should create service with custom configuration', () => {
      const customService = createContentTypeHandlerService({
        enableStructuredOutput: false,
        maxRetries: 5
      });
      expect(customService).toBeInstanceOf(ContentTypeHandlerService);
    });

    it('should inherit from EventEmitter', () => {
      expect(typeof service.on).toBe('function');
      expect(typeof service.emit).toBe('function');
    });

    it('should emit events during content generation', async () => {
      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      service.on('generation:start', startHandler);
      service.on('generation:complete', completeHandler);

      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Test topic',
        brandVoice: {
          tone: ['professional'],
          style: ['concise'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      await service.generate(input);

      expect(startHandler).toHaveBeenCalled();
      expect(completeHandler).toHaveBeenCalled();
    });
  });

  describe('Zod Schema Validation', () => {
    describe('ContentTypeConfigSchema', () => {
      it('should validate valid configuration', () => {
        const validConfig = {
          enableStructuredOutput: true,
          defaultLength: 'medium' as const,
          maxRetries: 3
        };
        expect(() => ContentTypeConfigSchema.parse(validConfig)).not.toThrow();
      });

      it('should apply default values', () => {
        const minConfig = {};
        const result = ContentTypeConfigSchema.parse(minConfig);
        expect(result.enableStructuredOutput).toBe(true);
        expect(result.defaultLength).toBe('medium');
        expect(result.maxRetries).toBe(3);
      });

      it('should reject invalid length values', () => {
        const invalidConfig = {
          defaultLength: 'invalid'
        };
        expect(() => ContentTypeConfigSchema.parse(invalidConfig)).toThrow();
      });
    });

    describe('ContentTypeInputSchema', () => {
      it('should validate valid input', () => {
        const validInput = {
          type: 'blog_post',
          topic: 'AI in Healthcare',
          brandVoice: {
            tone: ['professional', 'informative'],
            style: ['detailed'],
            vocabulary: { preferred: ['innovation'], avoided: ['disruption'] }
          }
        };
        expect(() => ContentTypeInputSchema.parse(validInput)).not.toThrow();
      });

      it('should require topic', () => {
        const invalidInput = {
          type: 'blog_post',
          brandVoice: {
            tone: ['professional'],
            style: ['detailed'],
            vocabulary: { preferred: [], avoided: [] }
          }
        };
        expect(() => ContentTypeInputSchema.parse(invalidInput)).toThrow();
      });

      it('should require content type', () => {
        const invalidInput = {
          topic: 'Test topic',
          brandVoice: {
            tone: ['professional'],
            style: ['detailed'],
            vocabulary: { preferred: [], avoided: [] }
          }
        };
        expect(() => ContentTypeInputSchema.parse(invalidInput)).toThrow();
      });

      it('should validate all content types', () => {
        const types: ContentType[] = ['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release'];
        types.forEach(type => {
          const input = {
            type,
            topic: 'Test',
            brandVoice: {
              tone: ['professional'],
              style: ['detailed'],
              vocabulary: { preferred: [], avoided: [] }
            }
          };
          expect(() => ContentTypeInputSchema.parse(input)).not.toThrow();
        });
      });

      it('should reject invalid content type', () => {
        const invalidInput = {
          type: 'invalid_type',
          topic: 'Test',
          brandVoice: {
            tone: ['professional'],
            style: ['detailed'],
            vocabulary: { preferred: [], avoided: [] }
          }
        };
        expect(() => ContentTypeInputSchema.parse(invalidInput)).toThrow();
      });
    });
  });

  describe('Content Type Configurations', () => {
    it('should return blog post configuration', () => {
      const config = service.getContentTypeConfig('blog_post');
      expect(config).toBeDefined();
      expect(config.contentType).toBe('blog_post');
      expect(config.structure).toBeDefined();
      expect(config.requirements).toBeDefined();
    });

    it('should return social media configuration', () => {
      const config = service.getContentTypeConfig('social_media');
      expect(config).toBeDefined();
      expect(config.contentType).toBe('social_media');
      expect((config.requirements as { maxLength: Record<string, number> }).maxLength).toBeDefined();
    });

    it('should return marketing copy configuration', () => {
      const config = service.getContentTypeConfig('marketing_copy');
      expect(config).toBeDefined();
      expect(config.contentType).toBe('marketing_copy');
    });

    it('should return technical docs configuration', () => {
      const config = service.getContentTypeConfig('technical_docs');
      expect(config).toBeDefined();
      expect(config.contentType).toBe('technical_docs');
    });

    it('should return press release configuration', () => {
      const config = service.getContentTypeConfig('press_release');
      expect(config).toBeDefined();
      expect(config.contentType).toBe('press_release');
    });

    it('should get all available content type configs', () => {
      const configs = service.getAllContentTypeConfigs();
      expect(configs.size).toBe(5);
      expect(configs.has('blog_post')).toBe(true);
      expect(configs.has('social_media')).toBe(true);
      expect(configs.has('marketing_copy')).toBe(true);
      expect(configs.has('technical_docs')).toBe(true);
      expect(configs.has('press_release')).toBe(true);
    });
  });

  describe('Blog Post Generation', () => {
    it('should generate blog post content', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'The Future of AI in Marketing',
        brandVoice: {
          tone: ['professional', 'thought-leadership'],
          style: ['informative', 'engaging'],
          vocabulary: { preferred: ['innovation', 'transform'], avoided: ['disrupt'] }
        },
        keywords: ['AI', 'marketing', 'automation'],
        length: 'long'
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.type).toBe('blog_post');
      expect(result.output?.structure).toBeDefined();
      expect(result.output?.structure.title).toBeDefined();
      expect(result.output?.structure.introduction).toBeDefined();
      expect(result.output?.structure.sections).toBeDefined();
      expect(result.output?.structure.conclusion).toBeDefined();
    });

    it('should include meta information for blog posts', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'SEO Best Practices',
        brandVoice: {
          tone: ['professional'],
          style: ['educational'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.meta).toBeDefined();
      expect(result.output?.meta?.wordCount).toBeGreaterThan(0);
      expect(result.output?.meta?.readingTime).toBeGreaterThan(0);
      expect(typeof result.output?.meta?.seoScore).toBe('number');
    });

    it('should generate SEO-friendly elements for blog posts', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Content Marketing Strategies',
        brandVoice: {
          tone: ['professional'],
          style: ['detailed'],
          vocabulary: { preferred: [], avoided: [] }
        },
        keywords: ['content', 'marketing', 'strategy']
      };

      const result = await service.generate(input);

      expect(result.output?.seoElements).toBeDefined();
      expect(result.output?.seoElements?.metaTitle).toBeDefined();
      expect(result.output?.seoElements?.metaDescription).toBeDefined();
      expect(result.output?.seoElements?.slug).toBeDefined();
    });
  });

  describe('Social Media Generation', () => {
    it('should generate social media content', async () => {
      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Product Launch Announcement',
        brandVoice: {
          tone: ['exciting', 'conversational'],
          style: ['punchy', 'engaging'],
          vocabulary: { preferred: ['amazing', 'incredible'], avoided: [] }
        },
        platform: 'twitter'
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.output?.type).toBe('social_media');
      expect(result.output?.content).toBeDefined();
    });

    it('should respect platform character limits', async () => {
      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Quick tip for developers',
        brandVoice: {
          tone: ['casual'],
          style: ['brief'],
          vocabulary: { preferred: [], avoided: [] }
        },
        platform: 'twitter'
      };

      const result = await service.generate(input);

      // Twitter limit is 280 characters
      expect(result.output?.content.length).toBeLessThanOrEqual(280);
    });

    it('should suggest hashtags for social media', async () => {
      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Tech industry news',
        brandVoice: {
          tone: ['professional'],
          style: ['informative'],
          vocabulary: { preferred: [], avoided: [] }
        },
        keywords: ['tech', 'startup', 'innovation']
      };

      const result = await service.generate(input);

      expect(result.output?.hashtags).toBeDefined();
      expect(Array.isArray(result.output?.hashtags)).toBe(true);
    });

    it('should generate thread format for longer social content', async () => {
      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Comprehensive guide to AI tools',
        brandVoice: {
          tone: ['educational'],
          style: ['detailed'],
          vocabulary: { preferred: [], avoided: [] }
        },
        platform: 'twitter',
        length: 'long'
      };

      const result = await service.generate(input);

      expect(result.output?.isThread).toBe(true);
      expect(result.output?.threadParts).toBeDefined();
      expect(Array.isArray(result.output?.threadParts)).toBe(true);
    });
  });

  describe('Marketing Copy Generation', () => {
    it('should generate marketing copy', async () => {
      const input: ContentTypeInput = {
        type: 'marketing_copy',
        topic: 'SaaS Product Landing Page',
        brandVoice: {
          tone: ['persuasive', 'confident'],
          style: ['action-oriented'],
          vocabulary: { preferred: ['boost', 'transform', 'achieve'], avoided: ['maybe', 'try'] }
        }
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.output?.type).toBe('marketing_copy');
    });

    it('should include persuasion elements', async () => {
      const input: ContentTypeInput = {
        type: 'marketing_copy',
        topic: 'Email Campaign for New Feature',
        brandVoice: {
          tone: ['persuasive'],
          style: ['engaging'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.persuasionElements).toBeDefined();
      expect(result.output?.persuasionElements?.headline).toBeDefined();
      expect(result.output?.persuasionElements?.valueProposition).toBeDefined();
      expect(result.output?.persuasionElements?.callToAction).toBeDefined();
    });

    it('should generate multiple CTA variations', async () => {
      const input: ContentTypeInput = {
        type: 'marketing_copy',
        topic: 'Newsletter Signup',
        brandVoice: {
          tone: ['friendly'],
          style: ['conversational'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.ctaVariations).toBeDefined();
      expect(Array.isArray(result.output?.ctaVariations)).toBe(true);
      expect(result.output?.ctaVariations?.length).toBeGreaterThan(0);
    });

    it('should target specific audience segments', async () => {
      const input: ContentTypeInput = {
        type: 'marketing_copy',
        topic: 'Enterprise Software Demo',
        brandVoice: {
          tone: ['professional'],
          style: ['authoritative'],
          vocabulary: { preferred: ['enterprise', 'scalable'], avoided: [] }
        },
        targetAudience: 'CTOs and IT Directors'
      };

      const result = await service.generate(input);

      expect(result.output?.audienceTargeting).toBeDefined();
      expect(result.output?.audienceTargeting?.segment).toBe('CTOs and IT Directors');
    });
  });

  describe('Technical Documentation Generation', () => {
    it('should generate technical documentation', async () => {
      const input: ContentTypeInput = {
        type: 'technical_docs',
        topic: 'API Authentication Guide',
        brandVoice: {
          tone: ['technical', 'precise'],
          style: ['step-by-step', 'clear'],
          vocabulary: { preferred: ['implement', 'configure'], avoided: ['easy', 'simple'] }
        }
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.output?.type).toBe('technical_docs');
    });

    it('should include code examples', async () => {
      const input: ContentTypeInput = {
        type: 'technical_docs',
        topic: 'SDK Installation Guide',
        brandVoice: {
          tone: ['technical'],
          style: ['instructional'],
          vocabulary: { preferred: [], avoided: [] }
        },
        includeCodeExamples: true
      };

      const result = await service.generate(input);

      expect(result.output?.codeExamples).toBeDefined();
      expect(Array.isArray(result.output?.codeExamples)).toBe(true);
    });

    it('should generate structured sections', async () => {
      const input: ContentTypeInput = {
        type: 'technical_docs',
        topic: 'Database Migration Guide',
        brandVoice: {
          tone: ['technical'],
          style: ['organized'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.structure).toBeDefined();
      expect(result.output?.structure?.overview).toBeDefined();
      expect(result.output?.structure?.prerequisites).toBeDefined();
      expect(result.output?.structure?.steps).toBeDefined();
    });

    it('should include troubleshooting section', async () => {
      const input: ContentTypeInput = {
        type: 'technical_docs',
        topic: 'Deployment Troubleshooting',
        brandVoice: {
          tone: ['helpful'],
          style: ['problem-solving'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.troubleshooting).toBeDefined();
      expect(Array.isArray(result.output?.troubleshooting)).toBe(true);
    });
  });

  describe('Press Release Generation', () => {
    it('should generate press release', async () => {
      const input: ContentTypeInput = {
        type: 'press_release',
        topic: 'Company Acquisition Announcement',
        brandVoice: {
          tone: ['formal', 'newsworthy'],
          style: ['journalistic'],
          vocabulary: { preferred: ['strategic', 'partnership'], avoided: ['casual'] }
        }
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.output?.type).toBe('press_release');
    });

    it('should follow AP style guidelines', async () => {
      const input: ContentTypeInput = {
        type: 'press_release',
        topic: 'New Product Launch',
        brandVoice: {
          tone: ['formal'],
          style: ['professional'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.apStyleCompliant).toBe(true);
    });

    it('should include standard press release sections', async () => {
      const input: ContentTypeInput = {
        type: 'press_release',
        topic: 'Funding Round Announcement',
        brandVoice: {
          tone: ['professional'],
          style: ['newsworthy'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.structure).toBeDefined();
      expect(result.output?.structure?.headline).toBeDefined();
      expect(result.output?.structure?.dateline).toBeDefined();
      expect(result.output?.structure?.leadParagraph).toBeDefined();
      expect(result.output?.structure?.body).toBeDefined();
      expect(result.output?.structure?.boilerplate).toBeDefined();
    });

    it('should include quote placeholders', async () => {
      const input: ContentTypeInput = {
        type: 'press_release',
        topic: 'Partnership Announcement',
        brandVoice: {
          tone: ['formal'],
          style: ['professional'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.quotePlaceholders).toBeDefined();
      expect(Array.isArray(result.output?.quotePlaceholders)).toBe(true);
    });

    it('should include media contact section', async () => {
      const input: ContentTypeInput = {
        type: 'press_release',
        topic: 'Award Recognition',
        brandVoice: {
          tone: ['proud', 'professional'],
          style: ['formal'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.mediaContactTemplate).toBeDefined();
    });
  });

  describe('Length Variations', () => {
    it('should respect short length constraint', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Quick Tips',
        brandVoice: {
          tone: ['casual'],
          style: ['brief'],
          vocabulary: { preferred: [], avoided: [] }
        },
        length: 'short'
      };

      const result = await service.generate(input);

      expect(result.output?.meta?.wordCount).toBeLessThan(500);
    });

    it('should respect medium length constraint', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Industry Analysis',
        brandVoice: {
          tone: ['analytical'],
          style: ['thorough'],
          vocabulary: { preferred: [], avoided: [] }
        },
        length: 'medium'
      };

      const result = await service.generate(input);

      // Medium content should be longer than short
      expect(result.output?.meta?.wordCount).toBeGreaterThan(100);
      expect(result.output?.meta?.wordCount).toBeDefined();
    });

    it('should respect long length constraint', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Comprehensive Guide',
        brandVoice: {
          tone: ['educational'],
          style: ['detailed'],
          vocabulary: { preferred: [], avoided: [] }
        },
        length: 'long'
      };

      const result = await service.generate(input);

      // Long content should have significant word count
      expect(result.output?.meta?.wordCount).toBeGreaterThan(200);
    });

    it('should use default length when not specified', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Default Length Test',
        brandVoice: {
          tone: ['neutral'],
          style: ['balanced'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      // Default is medium - should produce content
      expect(result.output?.meta?.wordCount).toBeGreaterThan(100);
      expect(result.output?.meta?.wordCount).toBeDefined();
    });
  });

  describe('Brand Voice Integration', () => {
    it('should apply tone from brand voice', async () => {
      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Company Update',
        brandVoice: {
          tone: ['playful', 'witty'],
          style: ['casual'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.appliedBrandVoice?.tone).toContain('playful');
    });

    it('should use preferred vocabulary', async () => {
      const input: ContentTypeInput = {
        type: 'marketing_copy',
        topic: 'Feature Highlight',
        brandVoice: {
          tone: ['enthusiastic'],
          style: ['dynamic'],
          vocabulary: {
            preferred: ['revolutionary', 'cutting-edge', 'empower'],
            avoided: ['basic', 'simple']
          }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.vocabularyUsed?.preferred).toBeDefined();
    });

    it('should avoid specified vocabulary', async () => {
      const input: ContentTypeInput = {
        type: 'technical_docs',
        topic: 'Integration Guide',
        brandVoice: {
          tone: ['professional'],
          style: ['precise'],
          vocabulary: {
            preferred: [],
            avoided: ['easy', 'simple', 'just']
          }
        }
      };

      const result = await service.generate(input);

      // Check that avoided words are not in content
      const avoidedWords = ['easy', 'simple', 'just'];
      const contentLower = result.output?.content?.toLowerCase() || '';

      avoidedWords.forEach(word => {
        expect(contentLower).not.toContain(word);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing topic gracefully', async () => {
      const input = {
        type: 'blog_post' as ContentType,
        brandVoice: {
          tone: ['professional'],
          style: ['formal'],
          vocabulary: { preferred: [], avoided: [] }
        }
      } as unknown as ContentTypeInput;

      const result = await service.generate(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid content type', async () => {
      const input = {
        type: 'invalid_type' as ContentType,
        topic: 'Test',
        brandVoice: {
          tone: ['professional'],
          style: ['formal'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should emit error events', async () => {
      const errorHandler = vi.fn();
      service.on('generation:error', errorHandler);

      const input = {
        type: 'blog_post' as ContentType,
        brandVoice: {
          tone: ['professional'],
          style: ['formal'],
          vocabulary: { preferred: [], avoided: [] }
        }
      } as unknown as ContentTypeInput;

      await service.generate(input);

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should include processing time even on error', async () => {
      const input = {
        type: 'invalid_type' as ContentType,
        topic: 'Test',
        brandVoice: {
          tone: ['professional'],
          style: ['formal'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Generation', () => {
    it('should generate content for multiple types', async () => {
      const inputs: ContentTypeInput[] = [
        {
          type: 'blog_post',
          topic: 'Company News',
          brandVoice: {
            tone: ['professional'],
            style: ['informative'],
            vocabulary: { preferred: [], avoided: [] }
          }
        },
        {
          type: 'social_media',
          topic: 'Company News',
          brandVoice: {
            tone: ['casual'],
            style: ['brief'],
            vocabulary: { preferred: [], avoided: [] }
          }
        }
      ];

      const results = await service.generateBatch(inputs);

      expect(results.length).toBe(2);
      expect(results[0].output?.type).toBe('blog_post');
      expect(results[1].output?.type).toBe('social_media');
    });

    it('should handle partial failures in batch', async () => {
      const inputs: ContentTypeInput[] = [
        {
          type: 'blog_post',
          topic: 'Valid Topic',
          brandVoice: {
            tone: ['professional'],
            style: ['informative'],
            vocabulary: { preferred: [], avoided: [] }
          }
        },
        {
          type: 'invalid_type' as ContentType,
          topic: 'Invalid Type',
          brandVoice: {
            tone: ['professional'],
            style: ['informative'],
            vocabulary: { preferred: [], avoided: [] }
          }
        }
      ];

      const results = await service.generateBatch(inputs);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Template System', () => {
    it('should get template for blog post', () => {
      const template = service.getTemplate('blog_post');

      expect(template).toBeDefined();
      expect(template.sections).toBeDefined();
      expect(template.placeholders).toBeDefined();
    });

    it('should get template for press release', () => {
      const template = service.getTemplate('press_release');

      expect(template).toBeDefined();
      expect(template.sections).toContain('headline');
      expect(template.sections).toContain('dateline');
      expect(template.sections).toContain('boilerplate');
    });

    it('should allow custom templates', () => {
      const customTemplate = {
        name: 'custom_blog',
        sections: ['hook', 'story', 'lesson', 'cta'],
        placeholders: {
          hook: 'Opening hook to grab attention',
          story: 'Main narrative',
          lesson: 'Key takeaway',
          cta: 'Call to action'
        }
      };

      service.registerTemplate('blog_post', customTemplate);
      const template = service.getTemplate('blog_post');

      expect(template.sections).toContain('hook');
    });
  });

  describe('Processing Metrics', () => {
    it('should track generation time', async () => {
      const input: ContentTypeInput = {
        type: 'social_media',
        topic: 'Quick Update',
        brandVoice: {
          tone: ['casual'],
          style: ['brief'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include content metrics in output', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Test Article',
        brandVoice: {
          tone: ['professional'],
          style: ['informative'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.output?.meta).toBeDefined();
      expect(typeof result.output?.meta?.wordCount).toBe('number');
      expect(typeof result.output?.meta?.readingTime).toBe('number');
    });
  });

  describe('Content Validation', () => {
    it('should validate generated content meets requirements', async () => {
      const input: ContentTypeInput = {
        type: 'blog_post',
        topic: 'Validated Content',
        brandVoice: {
          tone: ['professional'],
          style: ['thorough'],
          vocabulary: { preferred: [], avoided: [] }
        }
      };

      const result = await service.generate(input);

      expect(result.validation).toBeDefined();
      expect(result.validation?.passesRequirements).toBe(true);
    });

    it('should flag content that does not meet requirements', async () => {
      // This tests internal validation
      const validation = service.validateContent('Too short', 'blog_post');

      expect(validation.passesRequirements).toBe(false);
      expect(validation.issues).toContain('Content too short for blog_post');
    });

    it('should validate hashtag count for social media', () => {
      const validation = service.validateContent(
        'Test content #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10',
        'social_media',
        { platform: 'twitter' }
      );

      expect(validation.warnings).toBeDefined();
      // Twitter recommends 1-2 hashtags
      expect(validation.warnings.some(w => w.includes('hashtag'))).toBe(true);
    });
  });
});
