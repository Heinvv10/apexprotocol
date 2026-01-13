/**
 * MentionExtractionService Tests
 * TDD tests for semantic mention extraction with context awareness
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MentionExtractionService,
  createMentionExtractionService,
  type MentionExtractionConfig,
  type RawContent,
  type ExtractedMention,
  type MentionContext,
  type ExtractionResult,
  type EntityReference,
  type ContentSource,
} from '../src/services/mention-extraction-service';

describe('MentionExtractionService', () => {
  let service: MentionExtractionService;

  const defaultConfig: Partial<MentionExtractionConfig> = {
    brandName: 'Apex',
    brandAliases: ['Apex Platform', 'Apex AI', 'ApexGEO'],
    minConfidence: 0.7,
    includePartialMatches: true,
  };

  beforeEach(() => {
    service = createMentionExtractionService(defaultConfig);
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createMentionExtractionService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getConfig()).toBeDefined();
    });

    it('should create service with custom config', () => {
      expect(service.getConfig().brandName).toBe('Apex');
      expect(service.getConfig().brandAliases).toHaveLength(3);
    });

    it('should emit initialized event', async () => {
      const handler = vi.fn();
      service.on('initialized', handler);
      await service.initialize();
      expect(handler).toHaveBeenCalled();
    });

    it('should validate brand name is provided', () => {
      expect(() => createMentionExtractionService({ brandName: '' })).toThrow();
    });
  });

  describe('Brand Mention Detection', () => {
    it('should detect exact brand name mention', async () => {
      const content: RawContent = {
        id: 'content-1',
        text: 'I really love using Apex for my brand monitoring needs.',
        source: { platform: 'twitter', url: 'https://twitter.com/user/123' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].matchedTerm).toBe('Apex');
    });

    it('should detect brand aliases', async () => {
      const content: RawContent = {
        id: 'content-2',
        text: 'Apex AI is revolutionizing how we track brand visibility.',
        source: { platform: 'linkedin', url: 'https://linkedin.com/post/456' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].matchedTerm).toBe('Apex AI');
    });

    it('should detect multiple mentions in same content', async () => {
      const content: RawContent = {
        id: 'content-3',
        text: 'Apex Platform offers great features. I recommend Apex to everyone.',
        source: { platform: 'reddit', url: 'https://reddit.com/r/marketing/123' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle case-insensitive matching', async () => {
      const content: RawContent = {
        id: 'content-4',
        text: 'APEX is amazing! apex really delivers on its promises.',
        source: { platform: 'twitter', url: 'https://twitter.com/user/789' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect minimum confidence threshold', async () => {
      const content: RawContent = {
        id: 'content-5',
        text: 'The apex of the mountain was beautiful.',
        source: { platform: 'blog', url: 'https://blog.example.com/hiking' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      // This should have low confidence as it's not about the brand
      const highConfidenceMentions = result.mentions.filter(m => m.confidence >= 0.7);
      expect(highConfidenceMentions).toHaveLength(0);
    });
  });

  describe('Context Extraction', () => {
    it('should extract surrounding context', async () => {
      const content: RawContent = {
        id: 'ctx-1',
        text: 'After testing many tools, I found that Apex provides the best analytics for GEO optimization.',
        source: { platform: 'blog', url: 'https://blog.example.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions[0].context).toBeDefined();
      expect(result.mentions[0].context?.before).toContain('testing many tools');
      expect(result.mentions[0].context?.after).toContain('analytics');
    });

    it('should identify mention position (start, middle, end)', async () => {
      const contentStart: RawContent = {
        id: 'pos-1',
        text: 'Apex is the best tool for brand monitoring.',
        source: { platform: 'twitter', url: 'https://twitter.com/1' },
        timestamp: new Date(),
      };

      const contentEnd: RawContent = {
        id: 'pos-2',
        text: 'The best tool for brand monitoring is Apex.',
        source: { platform: 'twitter', url: 'https://twitter.com/2' },
        timestamp: new Date(),
      };

      const resultStart = await service.extractMentions(contentStart);
      const resultEnd = await service.extractMentions(contentEnd);

      expect(resultStart.mentions[0].position).toBe('start');
      expect(resultEnd.mentions[0].position).toBe('end');
    });

    it('should extract topic context', async () => {
      const content: RawContent = {
        id: 'topic-1',
        text: 'In the SEO industry, Apex has become a leading solution for AI-powered optimization.',
        source: { platform: 'article', url: 'https://example.com/article' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions[0].context?.topics).toContain('SEO');
    });

    it('should extract keyword context', async () => {
      const content: RawContent = {
        id: 'keyword-1',
        text: 'For enterprise-level brand monitoring and competitor analysis, Apex delivers exceptional value.',
        source: { platform: 'review', url: 'https://g2.com/review' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions[0].context?.keywords).toEqual(
        expect.arrayContaining(['enterprise', 'brand monitoring', 'competitor analysis'])
      );
    });
  });

  describe('Entity Recognition', () => {
    it('should identify competitor mentions', async () => {
      const content: RawContent = {
        id: 'comp-1',
        text: 'Compared to Semrush and Ahrefs, Apex offers unique AI capabilities.',
        source: { platform: 'blog', url: 'https://blog.example.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.entities).toBeDefined();
      expect(result.entities?.competitors).toContain('Semrush');
      expect(result.entities?.competitors).toContain('Ahrefs');
    });

    it('should identify person mentions', async () => {
      const content: RawContent = {
        id: 'person-1',
        text: 'CEO John Smith announced that Apex is expanding to new markets.',
        source: { platform: 'news', url: 'https://news.example.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.entities?.people).toContain('John Smith');
    });

    it('should identify organization mentions', async () => {
      const content: RawContent = {
        id: 'org-1',
        text: 'Microsoft and Google are exploring partnerships with Apex for AI integration.',
        source: { platform: 'news', url: 'https://tech.example.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.entities?.organizations).toContain('Microsoft');
      expect(result.entities?.organizations).toContain('Google');
    });

    it('should identify product mentions', async () => {
      const content: RawContent = {
        id: 'product-1',
        text: 'Apex Dashboard and Apex Analytics are now available for enterprise customers.',
        source: { platform: 'press', url: 'https://press.example.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.entities?.products).toContain('Apex Dashboard');
      expect(result.entities?.products).toContain('Apex Analytics');
    });
  });

  describe('Mention Quality Scoring', () => {
    it('should assign confidence scores to mentions', async () => {
      const content: RawContent = {
        id: 'score-1',
        text: 'Apex Platform is definitely the best GEO tool I have used.',
        source: { platform: 'review', url: 'https://review.example.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions[0].confidence).toBeGreaterThan(0);
      expect(result.mentions[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should score exact matches higher than partial', async () => {
      const exactContent: RawContent = {
        id: 'exact-1',
        text: 'I use Apex for all my brand monitoring.',
        source: { platform: 'twitter', url: 'https://twitter.com/1' },
        timestamp: new Date(),
      };

      const partialContent: RawContent = {
        id: 'partial-1',
        text: 'Apex-like tools are becoming popular.',
        source: { platform: 'twitter', url: 'https://twitter.com/2' },
        timestamp: new Date(),
      };

      const exactResult = await service.extractMentions(exactContent);
      const partialResult = await service.extractMentions(partialContent);

      if (exactResult.mentions.length > 0 && partialResult.mentions.length > 0) {
        expect(exactResult.mentions[0].confidence).toBeGreaterThan(partialResult.mentions[0].confidence);
      }
    });

    it('should calculate relevance score', async () => {
      const content: RawContent = {
        id: 'relevance-1',
        text: 'Apex has transformed our SEO and GEO strategy completely.',
        source: { platform: 'testimonial', url: 'https://example.com/testimonial' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions[0].relevanceScore).toBeDefined();
      expect(result.mentions[0].relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple content items', async () => {
      const contents: RawContent[] = [
        { id: 'batch-1', text: 'Apex is great', source: { platform: 'twitter', url: 'https://t.co/1' }, timestamp: new Date() },
        { id: 'batch-2', text: 'I recommend Apex', source: { platform: 'twitter', url: 'https://t.co/2' }, timestamp: new Date() },
        { id: 'batch-3', text: 'Apex Platform rocks', source: { platform: 'twitter', url: 'https://t.co/3' }, timestamp: new Date() },
      ];

      const results = await service.extractMentionsBatch(contents);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.mentions.length > 0)).toBe(true);
    });

    it('should handle large batches efficiently', async () => {
      const contents: RawContent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `large-batch-${i}`,
        text: `Content ${i}: Apex is mentioned here.`,
        source: { platform: 'twitter', url: `https://t.co/${i}` },
        timestamp: new Date(),
      }));

      const startTime = Date.now();
      const results = await service.extractMentionsBatch(contents);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should emit progress events during batch processing', async () => {
      const progressHandler = vi.fn();
      service.on('batchProgress', progressHandler);

      const contents: RawContent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `progress-${i}`,
        text: `Apex mention ${i}`,
        source: { platform: 'twitter', url: `https://t.co/${i}` },
        timestamp: new Date(),
      }));

      await service.extractMentionsBatch(contents);
      expect(progressHandler).toHaveBeenCalled();
    });
  });

  describe('Deduplication', () => {
    it('should identify duplicate mentions', async () => {
      const content1: RawContent = {
        id: 'dup-1',
        text: 'Apex is the best for SEO!',
        source: { platform: 'twitter', url: 'https://t.co/1' },
        timestamp: new Date(),
      };

      const content2: RawContent = {
        id: 'dup-2',
        text: 'Apex is the best for SEO!', // Same text
        source: { platform: 'twitter', url: 'https://t.co/2' }, // Different URL (retweet)
        timestamp: new Date(),
      };

      const results = await service.extractMentionsBatch([content1, content2]);
      const allMentions = results.flatMap(r => r.mentions);
      const duplicateGroups = await service.findDuplicates(allMentions);

      expect(duplicateGroups.length).toBeGreaterThan(0);
    });

    it('should calculate content similarity', async () => {
      const text1 = 'Apex is great for SEO optimization';
      const text2 = 'Apex is excellent for SEO optimization';
      const text3 = 'Something completely different';

      const similarity12 = service.calculateSimilarity(text1, text2);
      const similarity13 = service.calculateSimilarity(text1, text3);

      expect(similarity12).toBeGreaterThan(0.7);
      expect(similarity13).toBeLessThan(0.3);
    });
  });

  describe('Source Validation', () => {
    it('should validate content source', async () => {
      const validContent: RawContent = {
        id: 'valid-1',
        text: 'Apex is great',
        source: { platform: 'twitter', url: 'https://twitter.com/user/123' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(validContent);
      expect(result.sourceValidated).toBe(true);
    });

    it('should flag suspicious sources', async () => {
      const suspiciousContent: RawContent = {
        id: 'sus-1',
        text: 'Apex is great',
        source: { platform: 'unknown', url: 'https://fake-site.example.com/spam' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(suspiciousContent);
      expect(result.sourceFlags).toContain('unverified_source');
    });

    it('should identify bot-like content patterns', async () => {
      const botContent: RawContent = {
        id: 'bot-1',
        text: 'BUY NOW!!! Apex Apex Apex BEST PRICE!!!',
        source: { platform: 'twitter', url: 'https://twitter.com/bot123' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(botContent);
      expect(result.sourceFlags).toContain('potential_bot');
    });
  });

  describe('Language Support', () => {
    it('should detect content language', async () => {
      const englishContent: RawContent = {
        id: 'lang-en',
        text: 'Apex is a great platform for brand monitoring.',
        source: { platform: 'blog', url: 'https://blog.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(englishContent);
      expect(result.detectedLanguage).toBe('en');
    });

    it('should handle non-English content', async () => {
      const germanContent: RawContent = {
        id: 'lang-de',
        text: 'Apex ist eine großartige Plattform für Markenüberwachung.',
        source: { platform: 'blog', url: 'https://blog.de' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(germanContent);
      expect(result.mentions).toHaveLength(1);
      expect(result.detectedLanguage).toBe('de');
    });
  });

  describe('Configuration Updates', () => {
    it('should update brand aliases dynamically', async () => {
      service.updateConfig({ brandAliases: ['Apex', 'Apex Pro', 'Apex Enterprise'] });

      const content: RawContent = {
        id: 'alias-1',
        text: 'Apex Enterprise is perfect for large companies.',
        source: { platform: 'blog', url: 'https://blog.com' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(content);
      expect(result.mentions[0].matchedTerm).toBe('Apex Enterprise');
    });

    it('should update confidence threshold', async () => {
      service.updateConfig({ minConfidence: 0.9 });
      expect(service.getConfig().minConfidence).toBe(0.9);
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      service.on('configUpdated', handler);
      service.updateConfig({ minConfidence: 0.8 });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', async () => {
      const emptyContent: RawContent = {
        id: 'empty-1',
        text: '',
        source: { platform: 'twitter', url: 'https://t.co/1' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(emptyContent);
      expect(result.mentions).toHaveLength(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle null text gracefully', async () => {
      const nullContent: RawContent = {
        id: 'null-1',
        text: null as unknown as string,
        source: { platform: 'twitter', url: 'https://t.co/1' },
        timestamp: new Date(),
      };

      const result = await service.extractMentions(nullContent);
      expect(result.error).toBeDefined();
    });

    it('should emit error event on extraction failure', async () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      const invalidContent = { invalid: true } as unknown as RawContent;
      await service.extractMentions(invalidContent);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track extraction statistics', async () => {
      const contents: RawContent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `stats-${i}`,
        text: `Content ${i} mentions Apex.`,
        source: { platform: 'twitter', url: `https://t.co/${i}` },
        timestamp: new Date(),
      }));

      for (const content of contents) {
        await service.extractMentions(content);
      }

      const stats = service.getStats();
      expect(stats.totalProcessed).toBe(5);
      expect(stats.totalMentionsFound).toBeGreaterThanOrEqual(5);
    });

    it('should calculate average confidence', async () => {
      const contents: RawContent[] = [
        { id: 's1', text: 'Apex is great', source: { platform: 'twitter', url: 'https://t.co/1' }, timestamp: new Date() },
        { id: 's2', text: 'Apex Platform delivers', source: { platform: 'twitter', url: 'https://t.co/2' }, timestamp: new Date() },
      ];

      for (const content of contents) {
        await service.extractMentions(content);
      }

      const stats = service.getStats();
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('should reset statistics', async () => {
      const content: RawContent = {
        id: 'reset-1',
        text: 'Apex mention',
        source: { platform: 'twitter', url: 'https://t.co/1' },
        timestamp: new Date(),
      };

      await service.extractMentions(content);
      service.resetStats();

      const stats = service.getStats();
      expect(stats.totalProcessed).toBe(0);
    });
  });

  describe('Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      const shutdownHandler = vi.fn();
      service.on('shutdown', shutdownHandler);

      await service.shutdown();
      expect(shutdownHandler).toHaveBeenCalled();
    });
  });
});
