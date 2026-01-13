/**
 * PlatformAdapterService Tests
 * TDD tests for multi-platform adapter management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PlatformAdapterService,
  createPlatformAdapterService,
  type PlatformAdapterConfig,
  type PlatformAdapter,
  type PlatformType,
  type PlatformCredentials,
  type PlatformResponse,
  type AdapterStats,
} from '../src/services/platform-adapter-service';

describe('PlatformAdapterService', () => {
  let service: PlatformAdapterService;

  beforeEach(() => {
    service = createPlatformAdapterService();
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      expect(service).toBeDefined();
      expect(service.getConfig()).toBeDefined();
    });

    it('should create service with custom config', () => {
      const config: Partial<PlatformAdapterConfig> = {
        maxConcurrentRequests: 5,
        requestTimeoutMs: 10000,
        retryAttempts: 5,
      };
      const customService = createPlatformAdapterService(config);
      expect(customService.getConfig().maxConcurrentRequests).toBe(5);
      expect(customService.getConfig().requestTimeoutMs).toBe(10000);
    });

    it('should initialize with empty adapters map', () => {
      const adapters = service.getRegisteredAdapters();
      expect(adapters).toHaveLength(0);
    });

    it('should emit initialized event', async () => {
      const initHandler = vi.fn();
      service.on('initialized', initHandler);
      await service.initialize();
      expect(initHandler).toHaveBeenCalled();
    });
  });

  describe('Platform Registration', () => {
    it('should register a new platform adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'chatgpt-adapter',
        name: 'ChatGPT',
        type: 'ai_search',
        baseUrl: 'https://api.openai.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      const registered = service.getAdapter('chatgpt-adapter');
      expect(registered).toBeDefined();
      expect(registered?.name).toBe('ChatGPT');
    });

    it('should register multiple adapters', async () => {
      const adapters: PlatformAdapter[] = [
        { id: 'chatgpt', name: 'ChatGPT', type: 'ai_search', baseUrl: 'https://api.openai.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'claude', name: 'Claude', type: 'ai_search', baseUrl: 'https://api.anthropic.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'twitter', name: 'Twitter/X', type: 'social_media', baseUrl: 'https://api.twitter.com', enabled: true, rateLimit: { requestsPerMinute: 300, requestsPerHour: 15000 }, priority: 5 },
      ];

      for (const adapter of adapters) {
        await service.registerAdapter(adapter);
      }

      expect(service.getRegisteredAdapters()).toHaveLength(3);
    });

    it('should emit adapterRegistered event', async () => {
      const handler = vi.fn();
      service.on('adapterRegistered', handler);

      const adapter: PlatformAdapter = {
        id: 'gemini',
        name: 'Gemini',
        type: 'ai_search',
        baseUrl: 'https://generativelanguage.googleapis.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'gemini' }));
    });

    it('should update existing adapter when registering with same id', async () => {
      const adapter1: PlatformAdapter = {
        id: 'chatgpt',
        name: 'ChatGPT',
        type: 'ai_search',
        baseUrl: 'https://api.openai.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      const adapter2: PlatformAdapter = {
        id: 'chatgpt',
        name: 'ChatGPT Updated',
        type: 'ai_search',
        baseUrl: 'https://api.openai.com/v2',
        enabled: true,
        rateLimit: { requestsPerMinute: 120, requestsPerHour: 2000 },
        priority: 5,
      };

      await service.registerAdapter(adapter1);
      await service.registerAdapter(adapter2);

      const registered = service.getAdapter('chatgpt');
      expect(registered?.name).toBe('ChatGPT Updated');
      expect(service.getRegisteredAdapters()).toHaveLength(1);
    });

    it('should unregister an adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'test-adapter',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      expect(service.getAdapter('test-adapter')).toBeDefined();

      await service.unregisterAdapter('test-adapter');
      expect(service.getAdapter('test-adapter')).toBeUndefined();
    });
  });

  describe('Platform Types', () => {
    beforeEach(async () => {
      const adapters: PlatformAdapter[] = [
        { id: 'chatgpt', name: 'ChatGPT', type: 'ai_search', baseUrl: 'https://api.openai.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'claude', name: 'Claude', type: 'ai_search', baseUrl: 'https://api.anthropic.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'twitter', name: 'Twitter', type: 'social_media', baseUrl: 'https://api.twitter.com', enabled: true, rateLimit: { requestsPerMinute: 300, requestsPerHour: 15000 }, priority: 5 },
        { id: 'linkedin', name: 'LinkedIn', type: 'social_media', baseUrl: 'https://api.linkedin.com', enabled: true, rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 }, priority: 5 },
        { id: 'reuters', name: 'Reuters', type: 'news', baseUrl: 'https://api.reuters.com', enabled: true, rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 }, priority: 5 },
      ];

      for (const adapter of adapters) {
        await service.registerAdapter(adapter);
      }
    });

    it('should get adapters by type', () => {
      const aiAdapters = service.getAdaptersByType('ai_search');
      expect(aiAdapters).toHaveLength(2);
      expect(aiAdapters.every(a => a.type === 'ai_search')).toBe(true);
    });

    it('should get social media adapters', () => {
      const socialAdapters = service.getAdaptersByType('social_media');
      expect(socialAdapters).toHaveLength(2);
    });

    it('should get news adapters', () => {
      const newsAdapters = service.getAdaptersByType('news');
      expect(newsAdapters).toHaveLength(1);
    });

    it('should return empty array for unknown type', () => {
      const unknownAdapters = service.getAdaptersByType('unknown' as PlatformType);
      expect(unknownAdapters).toHaveLength(0);
    });
  });

  describe('Credentials Management', () => {
    it('should set credentials for an adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'twitter',
        name: 'Twitter',
        type: 'social_media',
        baseUrl: 'https://api.twitter.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 300, requestsPerHour: 15000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);

      const credentials: PlatformCredentials = {
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
        accessToken: 'test-access-token',
      };

      await service.setCredentials('twitter', credentials);
      expect(service.hasCredentials('twitter')).toBe(true);
    });

    it('should validate credentials before setting', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);

      const invalidCredentials = {} as PlatformCredentials;
      await expect(service.setCredentials('test', invalidCredentials)).rejects.toThrow();
    });

    it('should clear credentials for an adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('test', { apiKey: 'key' });
      expect(service.hasCredentials('test')).toBe(true);

      await service.clearCredentials('test');
      expect(service.hasCredentials('test')).toBe(false);
    });
  });

  describe('Enable/Disable Adapters', () => {
    it('should enable an adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: false,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      expect(service.getAdapter('test')?.enabled).toBe(false);

      await service.enableAdapter('test');
      expect(service.getAdapter('test')?.enabled).toBe(true);
    });

    it('should disable an adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.disableAdapter('test');
      expect(service.getAdapter('test')?.enabled).toBe(false);
    });

    it('should get only enabled adapters', async () => {
      const adapters: PlatformAdapter[] = [
        { id: 'enabled1', name: 'Enabled 1', type: 'ai_search', baseUrl: 'https://e1.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'disabled1', name: 'Disabled 1', type: 'ai_search', baseUrl: 'https://d1.com', enabled: false, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'enabled2', name: 'Enabled 2', type: 'social_media', baseUrl: 'https://e2.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
      ];

      for (const adapter of adapters) {
        await service.registerAdapter(adapter);
      }

      const enabledAdapters = service.getEnabledAdapters();
      expect(enabledAdapters).toHaveLength(2);
      expect(enabledAdapters.every(a => a.enabled)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should track request counts per adapter', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 10, requestsPerHour: 100 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('test', { apiKey: 'key' });

      // Simulate requests
      for (let i = 0; i < 5; i++) {
        await service.recordRequest('test');
      }

      const stats = service.getAdapterStats('test');
      expect(stats?.requestsLastMinute).toBe(5);
    });

    it('should check if adapter is rate limited', async () => {
      const adapter: PlatformAdapter = {
        id: 'limited',
        name: 'Limited',
        type: 'social_media',
        baseUrl: 'https://limited.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 2, requestsPerHour: 100 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('limited', { apiKey: 'key' });

      // Should not be limited initially
      expect(service.isRateLimited('limited')).toBe(false);

      // Exceed rate limit
      for (let i = 0; i < 3; i++) {
        await service.recordRequest('limited');
      }

      expect(service.isRateLimited('limited')).toBe(true);
    });

    it('should get time until rate limit resets', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 1, requestsPerHour: 100 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('test', { apiKey: 'key' });
      await service.recordRequest('test');
      await service.recordRequest('test');

      const resetTime = service.getRateLimitResetTime('test');
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60000); // Max 1 minute
    });
  });

  describe('Health Checks', () => {
    it('should check adapter health', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('test', { apiKey: 'key' });

      const health = await service.checkAdapterHealth('test');
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('latencyMs');
      expect(health).toHaveProperty('lastChecked');
    });

    it('should check all adapters health', async () => {
      const adapters: PlatformAdapter[] = [
        { id: 'a1', name: 'A1', type: 'ai_search', baseUrl: 'https://a1.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'a2', name: 'A2', type: 'social_media', baseUrl: 'https://a2.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
      ];

      for (const adapter of adapters) {
        await service.registerAdapter(adapter);
        await service.setCredentials(adapter.id, { apiKey: 'key' });
      }

      const healthReport = await service.checkAllAdaptersHealth();
      expect(Object.keys(healthReport)).toHaveLength(2);
    });

    it('should emit healthCheckComplete event', async () => {
      const handler = vi.fn();
      service.on('healthCheckComplete', handler);

      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('test', { apiKey: 'key' });
      await service.checkAdapterHealth('test');

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Priority Management', () => {
    it('should set adapter priority', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setAdapterPriority('test', 10);

      const updated = service.getAdapter('test');
      expect(updated?.priority).toBe(10);
    });

    it('should get adapters sorted by priority', async () => {
      const adapters: PlatformAdapter[] = [
        { id: 'low', name: 'Low Priority', type: 'ai_search', baseUrl: 'https://low.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 1 },
        { id: 'high', name: 'High Priority', type: 'ai_search', baseUrl: 'https://high.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 10 },
        { id: 'medium', name: 'Medium Priority', type: 'ai_search', baseUrl: 'https://med.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
      ];

      for (const adapter of adapters) {
        await service.registerAdapter(adapter);
      }

      const sorted = service.getAdaptersByPriority();
      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('medium');
      expect(sorted[2].id).toBe('low');
    });
  });

  describe('Statistics', () => {
    it('should get adapter statistics', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.setCredentials('test', { apiKey: 'key' });

      // Simulate activity
      for (let i = 0; i < 10; i++) {
        await service.recordRequest('test');
      }
      await service.recordSuccess('test');
      await service.recordSuccess('test');
      await service.recordError('test', 'Test error');

      const stats = service.getAdapterStats('test');
      expect(stats).toBeDefined();
      expect(stats?.totalRequests).toBe(10);
      expect(stats?.successCount).toBe(2);
      expect(stats?.errorCount).toBe(1);
    });

    it('should calculate success rate', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);

      for (let i = 0; i < 8; i++) {
        await service.recordSuccess('test');
      }
      for (let i = 0; i < 2; i++) {
        await service.recordError('test', 'Error');
      }

      const stats = service.getAdapterStats('test');
      expect(stats?.successRate).toBe(0.8);
    });

    it('should get aggregated statistics', async () => {
      const adapters: PlatformAdapter[] = [
        { id: 'a1', name: 'A1', type: 'ai_search', baseUrl: 'https://a1.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
        { id: 'a2', name: 'A2', type: 'social_media', baseUrl: 'https://a2.com', enabled: true, rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }, priority: 5 },
      ];

      for (const adapter of adapters) {
        await service.registerAdapter(adapter);
        await service.recordRequest(adapter.id);
        await service.recordSuccess(adapter.id);
      }

      const aggregated = service.getAggregatedStats();
      expect(aggregated.totalAdapters).toBe(2);
      expect(aggregated.totalRequests).toBe(2);
      expect(aggregated.totalSuccess).toBe(2);
    });
  });

  describe('Configuration Updates', () => {
    it('should update config', () => {
      service.updateConfig({ maxConcurrentRequests: 20 });
      expect(service.getConfig().maxConcurrentRequests).toBe(20);
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      service.on('configUpdated', handler);

      service.updateConfig({ retryAttempts: 10 });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      const adapter: PlatformAdapter = {
        id: 'test',
        name: 'Test',
        type: 'social_media',
        baseUrl: 'https://test.com',
        enabled: true,
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
        priority: 5,
      };

      await service.registerAdapter(adapter);
      await service.shutdown();

      expect(service.getRegisteredAdapters()).toHaveLength(0);
    });

    it('should emit shutdown event', async () => {
      const handler = vi.fn();
      service.on('shutdown', handler);

      await service.shutdown();
      expect(handler).toHaveBeenCalled();
    });
  });
});
