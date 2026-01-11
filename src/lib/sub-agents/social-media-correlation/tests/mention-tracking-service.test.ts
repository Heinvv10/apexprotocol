/**
 * MentionTrackingService Tests
 * TDD tests for multi-platform mention tracking across social media and AI platforms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MentionTrackingService,
  createMentionTrackingService,
  type MentionTrackingConfig,
  type Mention,
  type Platform,
  type MentionFilter,
  type TrackingResult,
} from '../src/services/mention-tracking-service';

describe('MentionTrackingService', () => {
  let service: MentionTrackingService;

  beforeEach(() => {
    service = createMentionTrackingService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();

      expect(config.enabledPlatforms).toBeDefined();
      expect(config.enabledPlatforms.length).toBeGreaterThan(0);
      expect(config.pollIntervalMs).toBeGreaterThan(0);
      expect(config.maxMentionsPerBatch).toBeGreaterThan(0);
    });

    it('should accept custom configuration', () => {
      const customService = createMentionTrackingService({
        pollIntervalMs: 60000,
        maxMentionsPerBatch: 500,
        enabledPlatforms: ['twitter', 'linkedin']
      });

      const config = customService.getConfig();

      expect(config.pollIntervalMs).toBe(60000);
      expect(config.maxMentionsPerBatch).toBe(500);
      expect(config.enabledPlatforms).toEqual(['twitter', 'linkedin']);

      customService.shutdown();
    });

    it('should validate configuration values', () => {
      expect(() => createMentionTrackingService({
        pollIntervalMs: -1
      })).toThrow();

      expect(() => createMentionTrackingService({
        maxMentionsPerBatch: 0
      })).toThrow();
    });
  });

  describe('Platform Support', () => {
    it('should support all social media platforms', () => {
      const platforms = service.getSupportedPlatforms();

      expect(platforms).toContain('twitter');
      expect(platforms).toContain('linkedin');
      expect(platforms).toContain('facebook');
      expect(platforms).toContain('instagram');
      expect(platforms).toContain('reddit');
      expect(platforms).toContain('youtube');
    });

    it('should support all AI platforms', () => {
      const platforms = service.getSupportedPlatforms();

      expect(platforms).toContain('chatgpt');
      expect(platforms).toContain('claude');
      expect(platforms).toContain('gemini');
      expect(platforms).toContain('perplexity');
      expect(platforms).toContain('grok');
      expect(platforms).toContain('deepseek');
    });

    it('should categorize platforms correctly', () => {
      const categories = service.getPlatformCategories();

      expect(categories.social).toContain('twitter');
      expect(categories.social).toContain('linkedin');
      expect(categories.ai).toContain('chatgpt');
      expect(categories.ai).toContain('claude');
    });

    it('should enable/disable platforms dynamically', () => {
      service.enablePlatform('twitter');
      expect(service.isPlatformEnabled('twitter')).toBe(true);

      service.disablePlatform('twitter');
      expect(service.isPlatformEnabled('twitter')).toBe(false);
    });

    it('should get platform status', () => {
      const status = service.getPlatformStatus('twitter');

      expect(status).toBeDefined();
      expect(status.platform).toBe('twitter');
      expect(status.enabled).toBeDefined();
      expect(status.lastChecked).toBeDefined();
      expect(status.mentionCount).toBeDefined();
    });
  });

  describe('Brand Tracking Configuration', () => {
    it('should add brand to track', () => {
      service.addBrand({
        id: 'brand-1',
        name: 'Acme Corp',
        keywords: ['acme', 'acme corp', '@acmecorp'],
        excludeKeywords: ['acme anvil', 'wile e coyote']
      });

      const brands = service.getTrackedBrands();
      expect(brands).toHaveLength(1);
      expect(brands[0].name).toBe('Acme Corp');
    });

    it('should remove brand from tracking', () => {
      service.addBrand({ id: 'brand-1', name: 'Brand 1', keywords: ['brand1'] });
      service.addBrand({ id: 'brand-2', name: 'Brand 2', keywords: ['brand2'] });

      service.removeBrand('brand-1');

      const brands = service.getTrackedBrands();
      expect(brands).toHaveLength(1);
      expect(brands[0].id).toBe('brand-2');
    });

    it('should update brand keywords', () => {
      service.addBrand({ id: 'brand-1', name: 'Brand 1', keywords: ['old'] });

      service.updateBrandKeywords('brand-1', ['new', 'updated']);

      const brand = service.getBrand('brand-1');
      expect(brand?.keywords).toEqual(['new', 'updated']);
    });

    it('should validate brand configuration', () => {
      expect(() => service.addBrand({
        id: '',
        name: 'Brand',
        keywords: ['test']
      })).toThrow('Brand ID is required');

      expect(() => service.addBrand({
        id: 'brand-1',
        name: '',
        keywords: ['test']
      })).toThrow('Brand name is required');

      expect(() => service.addBrand({
        id: 'brand-1',
        name: 'Brand',
        keywords: []
      })).toThrow('At least one keyword is required');
    });
  });

  describe('Mention Detection', () => {
    it('should detect mentions from text content', () => {
      service.addBrand({ id: 'brand-1', name: 'Acme Corp', keywords: ['acme', 'acme corp'] });

      const mentions = service.detectMentions(
        'I love using Acme Corp products! They are amazing.',
        { platform: 'twitter', source: 'user123' }
      );

      expect(mentions).toHaveLength(1);
      expect(mentions[0].brandId).toBe('brand-1');
      expect(mentions[0].matchedKeyword).toBe('acme corp');
    });

    it('should detect multiple brand mentions', () => {
      service.addBrand({ id: 'brand-1', name: 'Brand A', keywords: ['brand a'] });
      service.addBrand({ id: 'brand-2', name: 'Brand B', keywords: ['brand b'] });

      const mentions = service.detectMentions(
        'Brand A is better than Brand B in my opinion.',
        { platform: 'twitter', source: 'user123' }
      );

      expect(mentions).toHaveLength(2);
    });

    it('should exclude mentions based on exclude keywords', () => {
      service.addBrand({
        id: 'brand-1',
        name: 'Apple',
        keywords: ['apple'],
        excludeKeywords: ['apple pie', 'apple fruit']
      });

      const mentions = service.detectMentions(
        'I made an apple pie today!',
        { platform: 'twitter', source: 'user123' }
      );

      expect(mentions).toHaveLength(0);
    });

    it('should capture mention context', () => {
      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });

      const mentions = service.detectMentions(
        'This is some text before. Acme is amazing! And some text after.',
        { platform: 'twitter', source: 'user123' }
      );

      expect(mentions[0].context).toBeDefined();
      expect(mentions[0].context.before).toContain('before');
      expect(mentions[0].context.after).toContain('after');
    });

    it('should detect case-insensitive mentions', () => {
      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });

      const mentions = service.detectMentions(
        'ACME and Acme and acme are all the same!',
        { platform: 'twitter', source: 'user123' }
      );

      expect(mentions.length).toBeGreaterThan(0);
    });
  });

  describe('Mention Storage and Retrieval', () => {
    it('should store mentions', () => {
      const mention: Mention = {
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Test mention content',
        author: 'user123',
        timestamp: new Date(),
        url: 'https://twitter.com/user123/status/123',
        matchedKeyword: 'test',
        context: { before: '', after: '', full: 'Test mention content' }
      };

      service.storeMention(mention);
      const stored = service.getMention('mention-1');

      expect(stored).toBeDefined();
      expect(stored?.content).toBe('Test mention content');
    });

    it('should retrieve mentions by brand', () => {
      service.storeMention({
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Mention 1',
        author: 'user1',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      service.storeMention({
        id: 'mention-2',
        brandId: 'brand-2',
        platform: 'twitter',
        content: 'Mention 2',
        author: 'user2',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      const mentions = service.getMentionsByBrand('brand-1');
      expect(mentions).toHaveLength(1);
      expect(mentions[0].id).toBe('mention-1');
    });

    it('should retrieve mentions by platform', () => {
      service.storeMention({
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Twitter mention',
        author: 'user1',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      service.storeMention({
        id: 'mention-2',
        brandId: 'brand-1',
        platform: 'linkedin',
        content: 'LinkedIn mention',
        author: 'user2',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      const mentions = service.getMentionsByPlatform('twitter');
      expect(mentions).toHaveLength(1);
      expect(mentions[0].platform).toBe('twitter');
    });

    it('should retrieve mentions by date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const twoDaysAgo = new Date(now.getTime() - 172800000);

      service.storeMention({
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Old mention',
        author: 'user1',
        timestamp: twoDaysAgo,
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      service.storeMention({
        id: 'mention-2',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Recent mention',
        author: 'user2',
        timestamp: now,
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      const mentions = service.getMentionsByDateRange(yesterday, now);
      expect(mentions).toHaveLength(1);
      expect(mentions[0].id).toBe('mention-2');
    });

    it('should filter mentions with complex criteria', () => {
      service.storeMention({
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Test',
        author: 'user1',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      const filter: MentionFilter = {
        brandIds: ['brand-1'],
        platforms: ['twitter'],
        dateFrom: new Date(Date.now() - 86400000),
        dateTo: new Date()
      };

      const mentions = service.filterMentions(filter);
      expect(mentions).toHaveLength(1);
    });
  });

  describe('Real-time Tracking', () => {
    it('should start tracking for a brand', async () => {
      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });

      const trackingId = await service.startTracking('brand-1');

      expect(trackingId).toBeDefined();
      expect(service.isTracking('brand-1')).toBe(true);
    });

    it('should stop tracking for a brand', async () => {
      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });
      await service.startTracking('brand-1');

      await service.stopTracking('brand-1');

      expect(service.isTracking('brand-1')).toBe(false);
    });

    it('should emit events when mentions are found', async () => {
      const mentionHandler = vi.fn();
      service.on('mention:found', mentionHandler);

      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });

      // Simulate finding a mention
      service.processMentionData({
        platform: 'twitter',
        content: 'Acme is great!',
        author: 'user123',
        timestamp: new Date(),
        url: 'https://twitter.com/user123/status/123'
      });

      expect(mentionHandler).toHaveBeenCalled();
    });

    it('should provide tracking status', () => {
      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });

      const status = service.getTrackingStatus('brand-1');

      expect(status).toBeDefined();
      expect(status.brandId).toBe('brand-1');
      expect(status.isActive).toBeDefined();
      expect(status.lastCheck).toBeDefined();
      expect(status.mentionsFound).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process mentions in batches', async () => {
      const mentionData = Array.from({ length: 100 }, (_, i) => ({
        platform: 'twitter' as Platform,
        content: `Mention ${i} about Acme`,
        author: `user${i}`,
        timestamp: new Date(),
        url: `https://twitter.com/user${i}/status/${i}`
      }));

      service.addBrand({ id: 'brand-1', name: 'Acme', keywords: ['acme'] });

      const result = await service.processBatch(mentionData);

      expect(result.processed).toBe(100);
      expect(result.mentionsFound).toBeGreaterThan(0);
    });

    it('should handle batch processing errors gracefully', async () => {
      const invalidData = [
        { platform: 'twitter', content: null, author: 'user1' },
        { platform: 'twitter', content: 'Valid content', author: 'user2' }
      ] as any[];

      service.addBrand({ id: 'brand-1', name: 'Valid', keywords: ['valid'] });

      const result = await service.processBatch(invalidData);

      expect(result.errors).toBeGreaterThan(0);
      expect(result.processed).toBe(2);
    });

    it('should respect batch size limits', async () => {
      const customService = createMentionTrackingService({
        maxMentionsPerBatch: 10
      });

      const mentionData = Array.from({ length: 50 }, (_, i) => ({
        platform: 'twitter' as Platform,
        content: `Mention ${i}`,
        author: `user${i}`,
        timestamp: new Date()
      }));

      customService.addBrand({ id: 'brand-1', name: 'Test', keywords: ['mention'] });

      const result = await customService.processBatch(mentionData);

      expect(result.batches).toBe(5); // 50 items / 10 per batch

      customService.shutdown();
    });
  });

  describe('Platform-Specific Handling', () => {
    it('should parse Twitter mentions correctly', () => {
      const twitterData = {
        id: '1234567890',
        text: 'I love @acme products!',
        user: { screen_name: 'user123' },
        created_at: 'Wed Oct 10 20:19:24 +0000 2024'
      };

      const mention = service.parseTwitterMention(twitterData);

      expect(mention.platform).toBe('twitter');
      expect(mention.content).toBe('I love @acme products!');
      expect(mention.author).toBe('user123');
    });

    it('should parse LinkedIn mentions correctly', () => {
      const linkedInData = {
        id: 'urn:li:share:123',
        text: 'Great post about Acme Corp',
        author: 'John Doe',
        created: { time: 1696950000000 }
      };

      const mention = service.parseLinkedInMention(linkedInData);

      expect(mention.platform).toBe('linkedin');
      expect(mention.content).toBe('Great post about Acme Corp');
    });

    it('should parse Reddit mentions correctly', () => {
      const redditData = {
        id: 'abc123',
        body: 'Has anyone tried Acme products?',
        author: 'reddit_user',
        created_utc: 1696950000,
        subreddit: 'technology'
      };

      const mention = service.parseRedditMention(redditData);

      expect(mention.platform).toBe('reddit');
      expect(mention.author).toBe('reddit_user');
      expect(mention.metadata?.subreddit).toBe('technology');
    });

    it('should parse AI platform mentions correctly', () => {
      const aiMentionData = {
        query: 'What do you think about Acme Corp?',
        response: 'Acme Corp is known for...',
        platform: 'chatgpt' as const,
        timestamp: new Date()
      };

      const mention = service.parseAIPlatformMention(aiMentionData);

      expect(mention.platform).toBe('chatgpt');
      expect(mention.mentionType).toBe('ai-response');
    });
  });

  describe('Statistics and Analytics', () => {
    it('should calculate mention statistics', () => {
      // Add some test mentions
      for (let i = 0; i < 10; i++) {
        service.storeMention({
          id: `mention-${i}`,
          brandId: 'brand-1',
          platform: i % 2 === 0 ? 'twitter' : 'linkedin',
          content: `Test mention ${i}`,
          author: `user${i}`,
          timestamp: new Date(Date.now() - i * 3600000),
          matchedKeyword: 'test',
          context: { before: '', after: '', full: '' }
        });
      }

      const stats = service.getMentionStatistics('brand-1');

      expect(stats.totalMentions).toBe(10);
      expect(stats.byPlatform.twitter).toBe(5);
      expect(stats.byPlatform.linkedin).toBe(5);
    });

    it('should calculate mention velocity', () => {
      const now = new Date();

      // Add mentions over time
      for (let i = 0; i < 24; i++) {
        service.storeMention({
          id: `mention-${i}`,
          brandId: 'brand-1',
          platform: 'twitter',
          content: `Test mention ${i}`,
          author: `user${i}`,
          timestamp: new Date(now.getTime() - i * 3600000),
          matchedKeyword: 'test',
          context: { before: '', after: '', full: '' }
        });
      }

      const velocity = service.calculateMentionVelocity('brand-1', 24);

      expect(velocity.mentionsPerHour).toBe(1);
      expect(velocity.trend).toBeDefined();
    });

    it('should identify peak mention times', () => {
      // Add mentions at different times
      const hours = [9, 9, 10, 14, 14, 14, 18];
      hours.forEach((hour, i) => {
        const timestamp = new Date();
        timestamp.setHours(hour, 0, 0, 0);

        service.storeMention({
          id: `mention-${i}`,
          brandId: 'brand-1',
          platform: 'twitter',
          content: `Test mention ${i}`,
          author: `user${i}`,
          timestamp,
          matchedKeyword: 'test',
          context: { before: '', after: '', full: '' }
        });
      });

      const peakTimes = service.getPeakMentionTimes('brand-1');

      expect(peakTimes[0].hour).toBe(14); // Most mentions at 14:00
    });
  });

  describe('Event Handling', () => {
    it('should emit events for new mentions', () => {
      const handler = vi.fn();
      service.on('mention:new', handler);

      service.storeMention({
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Test',
        author: 'user1',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        id: 'mention-1'
      }));
    });

    it('should emit events for tracking start/stop', async () => {
      const startHandler = vi.fn();
      const stopHandler = vi.fn();

      service.on('tracking:started', startHandler);
      service.on('tracking:stopped', stopHandler);

      service.addBrand({ id: 'brand-1', name: 'Test', keywords: ['test'] });

      await service.startTracking('brand-1');
      expect(startHandler).toHaveBeenCalled();

      await service.stopTracking('brand-1');
      expect(stopHandler).toHaveBeenCalled();
    });

    it('should emit events for batch completion', async () => {
      const handler = vi.fn();
      service.on('batch:completed', handler);

      service.addBrand({ id: 'brand-1', name: 'Test', keywords: ['test'] });

      await service.processBatch([
        { platform: 'twitter', content: 'Test content', author: 'user1', timestamp: new Date() }
      ]);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup resources on shutdown', () => {
      service.addBrand({ id: 'brand-1', name: 'Test', keywords: ['test'] });
      service.storeMention({
        id: 'mention-1',
        brandId: 'brand-1',
        platform: 'twitter',
        content: 'Test',
        author: 'user1',
        timestamp: new Date(),
        matchedKeyword: 'test',
        context: { before: '', after: '', full: '' }
      });

      service.shutdown();

      expect(service.getTrackedBrands()).toHaveLength(0);
    });

    it('should stop all tracking on shutdown', async () => {
      service.addBrand({ id: 'brand-1', name: 'Test 1', keywords: ['test1'] });
      service.addBrand({ id: 'brand-2', name: 'Test 2', keywords: ['test2'] });

      await service.startTracking('brand-1');
      await service.startTracking('brand-2');

      service.shutdown();

      expect(service.isTracking('brand-1')).toBe(false);
      expect(service.isTracking('brand-2')).toBe(false);
    });
  });
});
