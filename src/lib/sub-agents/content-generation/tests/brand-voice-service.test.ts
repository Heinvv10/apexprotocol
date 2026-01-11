import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BrandVoiceService,
  createBrandVoiceService,
  BrandVoiceTrainingDataSchema,
  BrandVoiceConfigSchema,
  type BrandVoiceTrainingData,
  type BrandVoiceConfig,
  type BrandVoiceAnalysis
} from '../src/services/brand-voice-service';

describe('BrandVoiceService', () => {
  let service: BrandVoiceService;
  const defaultConfig: Partial<BrandVoiceConfig> = {
    brandId: 'test-brand-123',
    brandName: 'Test Brand'
  };

  beforeEach(() => {
    service = new BrandVoiceService(defaultConfig);
  });

  describe('Constructor and Initialization', () => {
    it('should create instance with valid config', () => {
      expect(service).toBeInstanceOf(BrandVoiceService);
    });

    it('should throw error for invalid config', () => {
      expect(() => new BrandVoiceService({})).toThrow();
    });

    it('should not be initialized before calling initialize()', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should be initialized after calling initialize()', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should emit initializing event', async () => {
      const spy = vi.fn();
      service.on('initializing', spy);
      await service.initialize();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit initialized event', async () => {
      const spy = vi.fn();
      service.on('initialized', spy);
      await service.initialize();
      expect(spy).toHaveBeenCalled();
    });

    it('should not re-initialize if already initialized', async () => {
      const spy = vi.fn();
      service.on('initializing', spy);
      await service.initialize();
      await service.initialize();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should apply default config values', () => {
      const config = service.getConfig();
      expect(config.minExamplesForAnalysis).toBe(3);
      expect(config.maxExamplesStored).toBe(100);
      expect(config.confidenceThreshold).toBe(0.6);
      expect(config.enableSentimentAnalysis).toBe(true);
      expect(config.enableStyleAnalysis).toBe(true);
      expect(config.enableVocabularyExtraction).toBe(true);
      expect(config.updateOnNewExamples).toBe(true);
    });
  });

  describe('Zod Schema Validation', () => {
    describe('BrandVoiceTrainingDataSchema', () => {
      it('should validate valid training data', () => {
        const data = {
          id: 'data-1',
          brandId: 'brand-123',
          content: 'This is sample content for training.',
          type: 'blog_post'
        };
        expect(() => BrandVoiceTrainingDataSchema.parse(data)).not.toThrow();
      });

      it('should reject empty content', () => {
        const data = {
          id: 'data-1',
          brandId: 'brand-123',
          content: '',
          type: 'blog_post'
        };
        expect(() => BrandVoiceTrainingDataSchema.parse(data)).toThrow();
      });

      it('should reject invalid type', () => {
        const data = {
          id: 'data-1',
          brandId: 'brand-123',
          content: 'Test content',
          type: 'invalid_type'
        };
        expect(() => BrandVoiceTrainingDataSchema.parse(data)).toThrow();
      });

      it('should accept all valid content types', () => {
        const types = ['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release', 'general'];
        for (const type of types) {
          const data = { id: '1', brandId: 'brand', content: 'Test', type };
          expect(() => BrandVoiceTrainingDataSchema.parse(data)).not.toThrow();
        }
      });

      it('should accept optional metadata', () => {
        const data = {
          id: 'data-1',
          brandId: 'brand-123',
          content: 'Test content',
          type: 'blog_post',
          metadata: {
            title: 'Test Title',
            engagementScore: 0.8
          }
        };
        expect(() => BrandVoiceTrainingDataSchema.parse(data)).not.toThrow();
      });

      it('should validate engagement score range', () => {
        const data = {
          id: 'data-1',
          brandId: 'brand-123',
          content: 'Test content',
          type: 'blog_post',
          metadata: {
            engagementScore: 1.5 // Invalid: > 1
          }
        };
        expect(() => BrandVoiceTrainingDataSchema.parse(data)).toThrow();
      });
    });

    describe('BrandVoiceConfigSchema', () => {
      it('should validate minimal config', () => {
        const config = {
          brandId: 'test',
          brandName: 'Test Brand'
        };
        expect(() => BrandVoiceConfigSchema.parse(config)).not.toThrow();
      });

      it('should apply defaults', () => {
        const config = BrandVoiceConfigSchema.parse({
          brandId: 'test',
          brandName: 'Test'
        });
        expect(config.minExamplesForAnalysis).toBe(3);
        expect(config.maxExamplesStored).toBe(100);
      });

      it('should enforce minExamplesForAnalysis minimum', () => {
        const config = {
          brandId: 'test',
          brandName: 'Test',
          minExamplesForAnalysis: 0
        };
        expect(() => BrandVoiceConfigSchema.parse(config)).toThrow();
      });
    });
  });

  describe('Training Data Management', () => {
    const sampleTrainingData: BrandVoiceTrainingData[] = [
      {
        id: 'ex1',
        brandId: 'test-brand-123',
        content: 'Our innovative solutions empower businesses to achieve excellence and drive sustainable growth.',
        type: 'marketing_copy'
      },
      {
        id: 'ex2',
        brandId: 'test-brand-123',
        content: 'At Test Brand, we believe in transforming industries through cutting-edge technology.',
        type: 'blog_post'
      },
      {
        id: 'ex3',
        brandId: 'test-brand-123',
        content: 'Join us on this exciting journey of innovation and discovery.',
        type: 'social_media'
      }
    ];

    it('should add training examples', async () => {
      await service.addTrainingExamples(sampleTrainingData);
      const summary = service.getTrainingDataSummary();
      expect(summary.total).toBe(3);
    });

    it('should auto-initialize when adding examples', async () => {
      expect(service.isInitialized()).toBe(false);
      await service.addTrainingExamples(sampleTrainingData);
      expect(service.isInitialized()).toBe(true);
    });

    it('should emit trainingData:added event', async () => {
      const spy = vi.fn();
      service.on('trainingData:added', spy);
      await service.addTrainingExamples(sampleTrainingData);
      expect(spy).toHaveBeenCalledWith({ count: 3 });
    });

    it('should track examples by type', async () => {
      await service.addTrainingExamples(sampleTrainingData);
      const summary = service.getTrainingDataSummary();
      expect(summary.byType['marketing_copy']).toBe(1);
      expect(summary.byType['blog_post']).toBe(1);
      expect(summary.byType['social_media']).toBe(1);
    });

    it('should track examples by platform', async () => {
      const dataWithPlatform: BrandVoiceTrainingData[] = [
        { id: '1', brandId: 'brand', content: 'Test 1', type: 'social_media', platform: 'twitter' },
        { id: '2', brandId: 'brand', content: 'Test 2', type: 'social_media', platform: 'linkedin' }
      ];
      await service.addTrainingExamples(dataWithPlatform);
      const summary = service.getTrainingDataSummary();
      expect(summary.byPlatform['twitter']).toBe(1);
      expect(summary.byPlatform['linkedin']).toBe(1);
    });

    it('should enforce max examples limit', async () => {
      const serviceWithLimit = new BrandVoiceService({
        ...defaultConfig,
        maxExamplesStored: 10 // Minimum allowed is 10
      });

      const manyExamples: BrandVoiceTrainingData[] = Array.from({ length: 15 }, (_, i) => ({
        id: `ex${i}`,
        brandId: 'brand',
        content: `Test content ${i}`,
        type: 'general' as const
      }));

      await serviceWithLimit.addTrainingExamples(manyExamples);
      const summary = serviceWithLimit.getTrainingDataSummary();
      expect(summary.total).toBe(10);
    });

    it('should auto-analyze when threshold met', async () => {
      const spy = vi.fn();
      service.on('analysis:complete', spy);
      await service.addTrainingExamples(sampleTrainingData);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Voice Analysis', () => {
    const richTrainingData: BrandVoiceTrainingData[] = [
      {
        id: 'ex1',
        brandId: 'test-brand-123',
        content: 'Our innovative solutions empower businesses to achieve excellence. We provide cutting-edge technology that transforms industries. Our strategic approach ensures sustainable growth and lasting success.',
        type: 'marketing_copy'
      },
      {
        id: 'ex2',
        brandId: 'test-brand-123',
        content: 'At Test Brand, we believe in the power of innovation. Our team of experts works tirelessly to deliver exceptional results. Together, we can unlock your full potential.',
        type: 'blog_post'
      },
      {
        id: 'ex3',
        brandId: 'test-brand-123',
        content: 'Discover the future of business with Test Brand. Our proven methodologies have helped countless organizations achieve their goals. Join us on this exciting journey!',
        type: 'social_media'
      }
    ];

    beforeEach(async () => {
      await service.addTrainingExamples(richTrainingData);
    });

    it('should produce analysis after sufficient examples', async () => {
      const analysis = service.getAnalysis();
      expect(analysis).toBeDefined();
      expect(analysis?.examplesAnalyzed).toBe(3);
    });

    it('should identify tone', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.tone.primary.length).toBeGreaterThan(0);
      expect(analysis?.tone.scores).toBeDefined();
    });

    it('should analyze style', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.style.formality).toBeGreaterThanOrEqual(0);
      expect(analysis?.style.formality).toBeLessThanOrEqual(1);
      expect(analysis?.style.complexity).toBeGreaterThanOrEqual(0);
      expect(analysis?.style.complexity).toBeLessThanOrEqual(1);
    });

    it('should extract vocabulary', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.vocabulary.frequentWords.length).toBeGreaterThan(0);
      expect(analysis?.vocabulary.averageSentenceLength).toBeGreaterThan(0);
    });

    it('should identify messaging patterns', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.messaging).toBeDefined();
    });

    it('should build personality profile', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.personality.traits.length).toBeGreaterThan(0);
      expect(analysis?.personality.archetypes.length).toBeGreaterThan(0);
    });

    it('should generate guidelines', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.guidelines.length).toBeGreaterThan(0);
    });

    it('should calculate confidence', async () => {
      const analysis = service.getAnalysis();
      expect(analysis?.confidence).toBeGreaterThan(0);
      expect(analysis?.confidence).toBeLessThanOrEqual(1);
    });

    it('should increment version on re-analysis', async () => {
      const initialAnalysis = service.getAnalysis();
      const initialVersion = initialAnalysis?.version || 0;

      await service.analyzeVoice();
      const newAnalysis = service.getAnalysis();

      expect(newAnalysis?.version).toBe(initialVersion + 1);
    });

    it('should emit analysis:start event', async () => {
      const spy = vi.fn();
      service.on('analysis:start', spy);
      await service.analyzeVoice();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit analysis:complete event', async () => {
      const spy = vi.fn();
      service.on('analysis:complete', spy);
      await service.analyzeVoice();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle insufficient data gracefully', async () => {
      const newService = new BrandVoiceService({
        ...defaultConfig,
        minExamplesForAnalysis: 10
      });
      await newService.initialize();

      const spy = vi.fn();
      newService.on('analysis:insufficient_data', spy);

      await newService.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Test', type: 'general' }
      ]);

      // Should emit insufficient data event
      await newService.analyzeVoice();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Content Analysis', () => {
    const trainingData: BrandVoiceTrainingData[] = [
      {
        id: 'ex1',
        brandId: 'test-brand-123',
        content: 'Our innovative solutions empower businesses to achieve excellence.',
        type: 'marketing_copy'
      },
      {
        id: 'ex2',
        brandId: 'test-brand-123',
        content: 'Innovation and excellence drive everything we do at our company.',
        type: 'blog_post'
      },
      {
        id: 'ex3',
        brandId: 'test-brand-123',
        content: 'Empower your team with our cutting-edge solutions for success.',
        type: 'social_media'
      }
    ];

    beforeEach(async () => {
      await service.addTrainingExamples(trainingData);
    });

    it('should analyze content against brand voice', async () => {
      const result = service.analyzeContent('Our innovative approach helps businesses achieve excellence.');
      expect(result.brandVoiceScore).toBeGreaterThanOrEqual(0);
      expect(result.brandVoiceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate tone match', async () => {
      const result = service.analyzeContent('Test content for analysis.');
      expect(result.toneMatch).toBeGreaterThanOrEqual(0);
      expect(result.toneMatch).toBeLessThanOrEqual(1);
    });

    it('should calculate style match', async () => {
      const result = service.analyzeContent('Test content for analysis.');
      expect(result.styleMatch).toBeGreaterThanOrEqual(0);
      expect(result.styleMatch).toBeLessThanOrEqual(1);
    });

    it('should calculate vocabulary match', async () => {
      const result = service.analyzeContent('Our innovative solutions empower businesses.');
      expect(result.vocabularyMatch).toBeGreaterThanOrEqual(0);
      expect(result.vocabularyMatch).toBeLessThanOrEqual(1);
    });

    it('should generate recommendations', async () => {
      const result = service.analyzeContent('Random unrelated content.');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should identify highlights', async () => {
      const result = service.analyzeContent('Our innovative solutions.');
      expect(Array.isArray(result.highlights)).toBe(true);
    });

    it('should return baseline scores when no analysis exists', async () => {
      const newService = new BrandVoiceService(defaultConfig);
      const result = newService.analyzeContent('Test content');
      expect(result.brandVoiceScore).toBe(0.5);
    });

    it('should score matching content higher', async () => {
      const matchingResult = service.analyzeContent('Our innovative solutions empower businesses to achieve excellence.');
      const nonMatchingResult = service.analyzeContent('Random text about unrelated topics.');

      // Content with brand terms should score higher for vocabulary
      expect(matchingResult.vocabularyMatch).toBeGreaterThanOrEqual(nonMatchingResult.vocabularyMatch);
    });
  });

  describe('Tone Analysis Details', () => {
    it('should detect professional tone', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Our expertise and best practices drive industry-leading solutions. Strategic implementation ensures optimal results.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'Professional services tailored to enterprise requirements. Industry standards and compliance.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'Strategic planning and expertise delivery. Best practices for optimal outcomes.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      expect(analysis?.tone.scores['professional']).toBeGreaterThan(0);
    });

    it('should detect friendly tone', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: "We're here to help you succeed! Together, we can achieve great things.", type: 'general' },
        { id: '2', brandId: 'brand', content: "You're not alone in this journey. Our support team is always here for you.", type: 'general' },
        { id: '3', brandId: 'brand', content: 'Let us help you reach your goals together. We support your journey.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      expect(analysis?.tone.scores['friendly']).toBeGreaterThan(0);
    });

    it('should detect innovative tone', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Cutting-edge technology powers our breakthrough solutions. Pioneering the future.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'Revolutionary approach to modern challenges. Future-focused innovation.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'Pioneering new pathways with cutting-edge solutions. A breakthrough in technology.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      expect(analysis?.tone.scores['innovative']).toBeGreaterThan(0);
    });
  });

  describe('Style Analysis Details', () => {
    it('should detect formal style', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'The organization shall implement comprehensive policies. Management will ensure compliance.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'It is recommended that stakeholders review the documentation. Formal procedures apply.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'The committee has determined that formal protocols are necessary.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      expect(analysis?.style.formality).toBeGreaterThan(0.4);
    });

    it('should detect casual style', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: "Hey! We're excited to share some awesome news. You're gonna love this!", type: 'general' },
        { id: '2', brandId: 'brand', content: "Can't wait to show you what we've been working on. It's pretty cool stuff!", type: 'general' },
        { id: '3', brandId: 'brand', content: "We're thrilled! Don't miss out on what's coming.", type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      expect(analysis?.style.formality).toBeLessThan(0.7);
    });

    it('should calculate average sentence length', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Short sentence. Another short one. Keep it brief.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'More short content. Brief and to the point.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'Concise messaging. Simple and clear.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      expect(analysis?.vocabulary.averageSentenceLength).toBeLessThan(10);
    });
  });

  describe('Profile Export/Import', () => {
    beforeEach(async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Innovation drives our success.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'Excellence in everything we do.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'Empowering businesses worldwide.', type: 'general' }
      ]);
    });

    it('should export profile as JSON', () => {
      const exported = service.exportProfile();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.config).toBeDefined();
      expect(parsed.analysis).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should include training data summary in export', () => {
      const exported = service.exportProfile();
      const parsed = JSON.parse(exported);
      expect(parsed.trainingDataSummary).toBeDefined();
      expect(parsed.trainingDataSummary.total).toBe(3);
    });

    it('should import profile from JSON', async () => {
      const exported = service.exportProfile();

      const newService = new BrandVoiceService(defaultConfig);
      await newService.initialize();
      await newService.importProfile(exported);

      const importedAnalysis = newService.getAnalysis();
      expect(importedAnalysis).toBeDefined();
    });

    it('should emit profile:imported event', async () => {
      const exported = service.exportProfile();

      const newService = new BrandVoiceService(defaultConfig);
      await newService.initialize();

      const spy = vi.fn();
      newService.on('profile:imported', spy);

      await newService.importProfile(exported);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Vocabulary Extraction', () => {
    it('should extract frequent words', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Innovation is key. Innovation drives success. Innovation matters.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'Innovation in every product. Innovation for the future.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'Our innovation leads the industry.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      const innovationWord = analysis?.vocabulary.frequentWords.find(fw => fw.word === 'innovation');
      expect(innovationWord).toBeDefined();
      expect(innovationWord?.frequency).toBeGreaterThan(1);
    });

    it('should find word contexts', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'Our excellence shines through in every project we deliver.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'Excellence is not just a goal but a standard.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'We strive for excellence every day.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      const excellenceWord = analysis?.vocabulary.frequentWords.find(fw => fw.word === 'excellence');

      if (excellenceWord) {
        expect(excellenceWord.contexts.length).toBeGreaterThan(0);
      }
    });

    it('should filter stop words', async () => {
      await service.addTrainingExamples([
        { id: '1', brandId: 'brand', content: 'The quick brown fox jumps over the lazy dog.', type: 'general' },
        { id: '2', brandId: 'brand', content: 'A quick example with many the and a words.', type: 'general' },
        { id: '3', brandId: 'brand', content: 'Another example text with common words.', type: 'general' }
      ]);

      const analysis = service.getAnalysis();
      const theWord = analysis?.vocabulary.frequentWords.find(fw => fw.word === 'the');
      expect(theWord).toBeUndefined();
    });
  });

  describe('Factory Function', () => {
    it('should create service via factory function', () => {
      const factoryService = createBrandVoiceService({
        brandId: 'factory-test',
        brandName: 'Factory Brand'
      });
      expect(factoryService).toBeInstanceOf(BrandVoiceService);
    });

    it('should create functional service', async () => {
      const factoryService = createBrandVoiceService({
        brandId: 'factory-test',
        brandName: 'Factory Brand'
      });

      await factoryService.addTrainingExamples([
        { id: '1', brandId: 'factory-test', content: 'Test content for factory service.', type: 'general' },
        { id: '2', brandId: 'factory-test', content: 'More test content here.', type: 'general' },
        { id: '3', brandId: 'factory-test', content: 'Additional content for testing.', type: 'general' }
      ]);

      const analysis = factoryService.getAnalysis();
      expect(analysis).toBeDefined();
    });
  });
});
