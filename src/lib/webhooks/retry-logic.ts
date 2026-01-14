/**
 * Webhook Retry Logic
 * Implements exponential backoff with jitter for webhook delivery
 */

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFraction: number; // Random variation as fraction (0-1)
}

export interface WebhookDelivery {
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
export class WebhookRetryEngine {
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
export class WebhookRetryScheduler {
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

// Export singleton instance
export const webhookRetryEngine = new WebhookRetryEngine();
