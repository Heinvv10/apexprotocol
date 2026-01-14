/**
 * Webhook Retry Logic Tests (Phase M2)
 * Tests exponential backoff, retry attempts, and failure recovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Webhook Delivery Status
 */
type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

/**
 * Retry Configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFraction: number; // Random variation as fraction (0-1)
}

/**
 * Webhook Delivery Record
 */
interface WebhookDelivery {
  id: string;
  url: string;
  payload: any;
  status: DeliveryStatus;
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  errors: string[];
}

/**
 * Webhook Retry Engine
 * Implements exponential backoff with jitter
 */
class WebhookRetryEngine {
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private defaultConfig: RetryConfig = {
    maxAttempts: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    jitterFraction: 0.1, // 10% jitter
  };

  /**
   * Register webhook delivery attempt
   */
  registerDelivery(
    id: string,
    url: string,
    payload: any
  ): WebhookDelivery {
    const delivery: WebhookDelivery = {
      id,
      url,
      payload,
      status: 'pending',
      attempts: 0,
      errors: [],
    };

    this.deliveries.set(id, delivery);
    return delivery;
  }

  /**
   * Get webhook delivery by ID
   */
  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  /**
   * Record successful delivery
   */
  recordSuccess(id: string): void {
    const delivery = this.deliveries.get(id);
    if (!delivery) throw new Error(`Delivery ${id} not found`);

    delivery.status = 'delivered';
    delivery.lastAttemptAt = new Date();
  }

  /**
   * Record failed delivery attempt
   */
  recordFailure(id: string, error: string, config: RetryConfig = this.defaultConfig): boolean {
    const delivery = this.deliveries.get(id);
    if (!delivery) throw new Error(`Delivery ${id} not found`);

    delivery.attempts++;
    delivery.lastAttemptAt = new Date();
    delivery.errors.push(error);

    // Check if we should retry
    if (delivery.attempts >= config.maxAttempts) {
      delivery.status = 'failed';
      return false;
    }

    // Schedule next retry
    delivery.status = 'retrying';
    const nextDelay = this.calculateNextDelay(
      delivery.attempts,
      config
    );
    delivery.nextRetryAt = new Date(Date.now() + nextDelay);
    return true;
  }

  /**
   * Calculate next retry delay with exponential backoff and jitter
   */
  calculateNextDelay(attemptNumber: number, config: RetryConfig): number {
    // Exponential backoff: initialDelay * (backoffMultiplier ^ attemptNumber)
    const exponentialDelay = config.initialDelayMs *
      Math.pow(config.backoffMultiplier, attemptNumber - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    // Add jitter: random variation up to jitterFraction of the delay
    const jitter = Math.random() * cappedDelay * config.jitterFraction;
    const finalDelay = cappedDelay + jitter;

    return Math.floor(finalDelay);
  }

  /**
   * Check if delivery should be retried now
   */
  shouldRetryNow(id: string): boolean {
    const delivery = this.deliveries.get(id);
    if (!delivery) return false;

    if (delivery.status !== 'retrying') return false;
    if (!delivery.nextRetryAt) return false;

    return delivery.nextRetryAt.getTime() <= Date.now();
  }

  /**
   * Get all deliveries pending retry
   */
  getDeliveriesPendingRetry(): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.status === 'retrying' && this.shouldRetryNow(d.id));
  }

  /**
   * Get all failed deliveries (max retries exceeded)
   */
  getFailedDeliveries(): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.status === 'failed');
  }

  /**
   * Get all successfully delivered
   */
  getSuccessfulDeliveries(): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.status === 'delivered');
  }

  /**
   * Get all active deliveries (not yet terminal)
   */
  getActiveDeliveries(): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.status !== 'delivered' && d.status !== 'failed');
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(id: string): {
    attempts: number;
    errors: string[];
    lastAttemptAt?: Date;
  } | null {
    const delivery = this.deliveries.get(id);
    if (!delivery) return null;

    return {
      attempts: delivery.attempts,
      errors: delivery.errors,
      lastAttemptAt: delivery.lastAttemptAt,
    };
  }
}

/**
 * Webhook Retry Scheduler
 * Processes pending retries on schedule
 */
class WebhookRetryScheduler {
  constructor(private retryEngine: WebhookRetryEngine) {}

  /**
   * Process all deliveries pending retry
   */
  async processPendingRetries(
    onRetry: (delivery: WebhookDelivery) => Promise<boolean>
  ): Promise<{ retried: number; succeeded: number; failed: number }> {
    const pending = this.retryEngine.getDeliveriesPendingRetry();
    let retried = 0;
    let succeeded = 0;
    let failed = 0;

    for (const delivery of pending) {
      retried++;
      try {
        const success = await onRetry(delivery);
        if (success) {
          this.retryEngine.recordSuccess(delivery.id);
          succeeded++;
        } else {
          this.retryEngine.recordFailure(delivery.id, 'Retry attempt failed');
          failed++;
        }
      } catch (error) {
        this.retryEngine.recordFailure(
          delivery.id,
          `Retry error: ${error}`
        );
        failed++;
      }
    }

    return { retried, succeeded, failed };
  }
}

describe('Webhook Retry Logic', () => {
  let engine: WebhookRetryEngine;
  let scheduler: WebhookRetryScheduler;

  beforeEach(() => {
    engine = new WebhookRetryEngine();
    scheduler = new WebhookRetryScheduler(engine);
    vi.clearAllMocks();
  });

  describe('Exponential Backoff Calculation', () => {
    const config: RetryConfig = {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
      jitterFraction: 0,
    };

    it('should calculate 1st retry delay: 1 second', () => {
      const delay = engine.calculateNextDelay(1, config);
      expect(delay).toBe(1000);
    });

    it('should calculate 2nd retry delay: 2 seconds', () => {
      const delay = engine.calculateNextDelay(2, config);
      expect(delay).toBe(2000);
    });

    it('should calculate 3rd retry delay: 4 seconds', () => {
      const delay = engine.calculateNextDelay(3, config);
      expect(delay).toBe(4000);
    });

    it('should calculate 4th retry delay: 8 seconds', () => {
      const delay = engine.calculateNextDelay(4, config);
      expect(delay).toBe(8000);
    });

    it('should calculate 5th retry delay: 16 seconds', () => {
      const delay = engine.calculateNextDelay(5, config);
      expect(delay).toBe(16000);
    });

    it('should cap delay at maxDelayMs', () => {
      const delay = engine.calculateNextDelay(20, config);
      expect(delay).toBeLessThanOrEqual(config.maxDelayMs);
    });

    it('should follow exponential formula: initialDelay * (multiplier ^ (attempt - 1))', () => {
      const delay = engine.calculateNextDelay(4, config);
      const expected = 1000 * Math.pow(2, 3); // 1000 * 8
      expect(delay).toBe(expected);
    });
  });

  describe('Jitter Implementation', () => {
    const config: RetryConfig = {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
      jitterFraction: 0.1,
    };

    it('should add jitter to delay', () => {
      const delays = Array(10)
        .fill(null)
        .map(() => engine.calculateNextDelay(1, config));

      // Not all delays should be identical (jitter adds variation)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should keep jitter within fraction bounds', () => {
      const config2: RetryConfig = {
        ...config,
        jitterFraction: 0.2,
      };

      for (let i = 0; i < 100; i++) {
        const delay = engine.calculateNextDelay(1, config2);
        const maxWithJitter = 1000 * (1 + 0.2);
        expect(delay).toBeLessThanOrEqual(maxWithJitter);
        expect(delay).toBeGreaterThanOrEqual(1000);
      }
    });

    it('should produce zero jitter when jitterFraction is 0', () => {
      const config2: RetryConfig = {
        ...config,
        jitterFraction: 0,
      };

      const delay1 = engine.calculateNextDelay(1, config2);
      const delay2 = engine.calculateNextDelay(1, config2);

      expect(delay1).toBe(delay2);
    });
  });

  describe('Delivery Registration and Status', () => {
    it('should register delivery with pending status', () => {
      const delivery = engine.registerDelivery(
        'webhook-1',
        'https://example.com/webhook',
        { test: 'data' }
      );

      expect(delivery.status).toBe('pending');
      expect(delivery.attempts).toBe(0);
      expect(delivery.errors).toHaveLength(0);
    });

    it('should retrieve registered delivery', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      const delivery = engine.getDelivery('webhook-1');

      expect(delivery).toBeDefined();
      expect(delivery!.id).toBe('webhook-1');
    });

    it('should return undefined for non-existent delivery', () => {
      const delivery = engine.getDelivery('nonexistent');
      expect(delivery).toBeUndefined();
    });
  });

  describe('Success Recording', () => {
    it('should mark delivery as delivered', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordSuccess('webhook-1');

      const delivery = engine.getDelivery('webhook-1');

      expect(delivery!.status).toBe('delivered');
      expect(delivery!.lastAttemptAt).toBeDefined();
    });

    it('should update lastAttemptAt on success', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      const before = new Date();
      engine.recordSuccess('webhook-1');
      const after = new Date();

      const delivery = engine.getDelivery('webhook-1');
      expect(delivery!.lastAttemptAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(delivery!.lastAttemptAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error for non-existent delivery', () => {
      expect(() => engine.recordSuccess('nonexistent')).toThrow();
    });
  });

  describe('Failure Recording and Retry Scheduling', () => {
    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      backoffMultiplier: 2,
      jitterFraction: 0,
    };

    it('should increment attempt count on failure', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordFailure('webhook-1', 'Connection timeout', config);

      const delivery = engine.getDelivery('webhook-1');
      expect(delivery!.attempts).toBe(1);
    });

    it('should schedule retry after first failure', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      const shouldRetry = engine.recordFailure('webhook-1', 'Error 1', config);

      const delivery = engine.getDelivery('webhook-1');

      expect(shouldRetry).toBe(true);
      expect(delivery!.status).toBe('retrying');
      expect(delivery!.nextRetryAt).toBeDefined();
    });

    it('should not retry after max attempts', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      engine.recordFailure('webhook-1', 'Error 1', config);
      engine.recordFailure('webhook-1', 'Error 2', config);
      const shouldRetry = engine.recordFailure('webhook-1', 'Error 3', config);

      expect(shouldRetry).toBe(false);
      expect(engine.getDelivery('webhook-1')!.status).toBe('failed');
    });

    it('should record error messages', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      engine.recordFailure('webhook-1', 'Connection timeout', config);
      engine.recordFailure('webhook-1', 'Read timeout', config);

      const delivery = engine.getDelivery('webhook-1');
      expect(delivery!.errors).toEqual(['Connection timeout', 'Read timeout']);
    });

    it('should calculate increasing delays with each retry', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      engine.recordFailure('webhook-1', 'Error 1', config);
      const delay1 = engine.getDelivery('webhook-1')!.nextRetryAt!.getTime() - Date.now();

      engine.recordFailure('webhook-1', 'Error 2', config);
      const delay2 = engine.getDelivery('webhook-1')!.nextRetryAt!.getTime() - Date.now();

      // Second delay should be roughly 2x first delay
      expect(delay2).toBeGreaterThan(delay1);
    });
  });

  describe('Retry Eligibility', () => {
    it('should identify delivery ready for retry', async () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 0, // No delay for testing
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.recordFailure('webhook-1', 'Error', config);

      expect(engine.shouldRetryNow('webhook-1')).toBe(true);
    });

    it('should not retry if next retry time not reached', async () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 60000, // Long delay
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.recordFailure('webhook-1', 'Error', config);

      expect(engine.shouldRetryNow('webhook-1')).toBe(false);
    });

    it('should not retry successful deliveries', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordSuccess('webhook-1');

      expect(engine.shouldRetryNow('webhook-1')).toBe(false);
    });

    it('should not retry failed deliveries', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});

      const config: RetryConfig = {
        maxAttempts: 1,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.recordFailure('webhook-1', 'Error', config);

      expect(engine.shouldRetryNow('webhook-1')).toBe(false);
    });
  });

  describe('Delivery Status Queries', () => {
    it('should get all pending retries', () => {
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-2', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-3', 'https://example.com/webhook', {});

      engine.recordFailure('webhook-1', 'Error', config);
      engine.recordFailure('webhook-2', 'Error', config);
      engine.recordSuccess('webhook-3');

      const pending = engine.getDeliveriesPendingRetry();

      expect(pending).toHaveLength(2);
      expect(pending.map(d => d.id)).toEqual(['webhook-1', 'webhook-2']);
    });

    it('should get all failed deliveries', () => {
      const config: RetryConfig = {
        maxAttempts: 1,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-2', 'https://example.com/webhook', {});

      engine.recordFailure('webhook-1', 'Error', config);
      engine.recordFailure('webhook-2', 'Error', config);

      const failed = engine.getFailedDeliveries();

      expect(failed).toHaveLength(2);
    });

    it('should get all successful deliveries', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-2', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-3', 'https://example.com/webhook', {});

      engine.recordSuccess('webhook-1');
      engine.recordSuccess('webhook-2');

      const successful = engine.getSuccessfulDeliveries();

      expect(successful).toHaveLength(2);
    });

    it('should get all active deliveries', () => {
      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-2', 'https://example.com/webhook', {});

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.recordFailure('webhook-1', 'Error', config);
      engine.recordSuccess('webhook-2');

      const active = engine.getActiveDeliveries();

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('webhook-1');
    });
  });

  describe('Retry Scheduler', () => {
    it('should process pending retries', async () => {
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordFailure('webhook-1', 'Error', config);

      const onRetry = vi.fn().mockResolvedValue(true);

      const result = await scheduler.processPendingRetries(onRetry);

      expect(result.retried).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(onRetry).toHaveBeenCalled();
    });

    it('should handle successful retry recovery', async () => {
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordFailure('webhook-1', 'Error', config);

      const onRetry = vi.fn().mockResolvedValue(true);
      await scheduler.processPendingRetries(onRetry);

      const delivery = engine.getDelivery('webhook-1');
      expect(delivery!.status).toBe('delivered');
    });

    it('should handle failed retries', async () => {
      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelayMs: 0,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordFailure('webhook-1', 'Error 1', config);

      const onRetry = vi.fn().mockResolvedValue(false);

      const result = await scheduler.processPendingRetries(onRetry);

      expect(result.failed).toBe(1);
    });

    it('should process multiple deliveries', async () => {
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-2', 'https://example.com/webhook', {});
      engine.registerDelivery('webhook-3', 'https://example.com/webhook', {});

      engine.recordFailure('webhook-1', 'Error', config);
      engine.recordFailure('webhook-2', 'Error', config);
      engine.recordFailure('webhook-3', 'Error', config);

      const onRetry = vi.fn().mockResolvedValue(true);

      const result = await scheduler.processPendingRetries(onRetry);

      expect(result.retried).toBe(3);
      expect(result.succeeded).toBe(3);
    });
  });

  describe('Delivery History', () => {
    it('should retrieve delivery attempt history', () => {
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterFraction: 0,
      };

      engine.registerDelivery('webhook-1', 'https://example.com/webhook', {});
      engine.recordFailure('webhook-1', 'Attempt 1 failed', config);
      engine.recordFailure('webhook-1', 'Attempt 2 failed', config);

      const history = engine.getDeliveryHistory('webhook-1');

      expect(history).toBeDefined();
      expect(history!.attempts).toBe(2);
      expect(history!.errors).toEqual(['Attempt 1 failed', 'Attempt 2 failed']);
      expect(history!.lastAttemptAt).toBeDefined();
    });

    it('should return null for non-existent delivery', () => {
      const history = engine.getDeliveryHistory('nonexistent');
      expect(history).toBeNull();
    });
  });
});
