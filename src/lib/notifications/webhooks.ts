/**
 * Outgoing Webhook System (F127)
 * Send webhooks on events (new mention, audit complete, score change, etc.)
 */

import { createId } from "@paralleldrive/cuid2";
import crypto from "crypto";

// Webhook types
export interface WebhookConfig {
  id: string;
  brandId: string;
  name: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  enabled: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEventType =
  | "mention.new"
  | "mention.sentiment_change"
  | "audit.started"
  | "audit.completed"
  | "audit.failed"
  | "score.updated"
  | "score.threshold_reached"
  | "recommendation.created"
  | "recommendation.completed"
  | "alert.crisis"
  | "alert.negative_spike"
  | "report.weekly_ready"
  | "content.published"
  | "competitor.change";

export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  brandId: string;
  data: Record<string, unknown>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: WebhookPayload;
  status: "pending" | "success" | "failed" | "retrying";
  attempts: number;
  lastAttemptAt?: Date;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  durationMs: number;
}

/**
 * Webhook Manager - handles outgoing webhooks
 */
export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private byBrand: Map<string, Set<string>> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private deliveryQueue: WebhookDelivery[] = [];

  constructor(
    private defaultRetryPolicy = {
      maxRetries: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
    }
  ) {}

  /**
   * Register a webhook
   */
  registerWebhook(
    brandId: string,
    config: {
      name: string;
      url: string;
      secret?: string;
      events: WebhookEventType[];
      headers?: Record<string, string>;
      retryPolicy?: Partial<WebhookConfig["retryPolicy"]>;
    }
  ): WebhookConfig {
    const webhook: WebhookConfig = {
      id: createId(),
      brandId,
      name: config.name,
      url: config.url,
      secret: config.secret,
      events: config.events,
      headers: config.headers,
      enabled: true,
      retryPolicy: {
        ...this.defaultRetryPolicy,
        ...config.retryPolicy,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);

    // Track by brand
    if (!this.byBrand.has(brandId)) {
      this.byBrand.set(brandId, new Set());
    }
    this.byBrand.get(brandId)!.add(webhook.id);

    return webhook;
  }

  /**
   * Update webhook configuration
   */
  updateWebhook(
    webhookId: string,
    updates: Partial<Omit<WebhookConfig, "id" | "brandId" | "createdAt">>
  ): WebhookConfig | undefined {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return undefined;

    Object.assign(webhook, updates, { updatedAt: new Date() });
    this.webhooks.set(webhookId, webhook);

    return webhook;
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    this.webhooks.delete(webhookId);
    this.byBrand.get(webhook.brandId)?.delete(webhookId);

    return true;
  }

  /**
   * Get webhooks for brand
   */
  getWebhooksForBrand(brandId: string): WebhookConfig[] {
    const webhookIds = this.byBrand.get(brandId);
    if (!webhookIds) return [];

    return Array.from(webhookIds)
      .map((id) => this.webhooks.get(id))
      .filter((w): w is WebhookConfig => w !== undefined);
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * Enable/disable webhook
   */
  setWebhookEnabled(webhookId: string, enabled: boolean): WebhookConfig | undefined {
    return this.updateWebhook(webhookId, { enabled });
  }

  /**
   * Fire webhook event
   */
  async fireEvent(
    brandId: string,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<WebhookDelivery[]> {
    const webhooks = this.getWebhooksForBrand(brandId).filter(
      (w) => w.enabled && w.events.includes(event)
    );

    const deliveries: WebhookDelivery[] = [];

    for (const webhook of webhooks) {
      const delivery = await this.deliverWebhook(webhook, event, data);
      deliveries.push(delivery);
    }

    return deliveries;
  }

  /**
   * Deliver webhook with retries
   */
  private async deliverWebhook(
    webhook: WebhookConfig,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<WebhookDelivery> {
    const payload: WebhookPayload = {
      id: createId(),
      event,
      timestamp: new Date().toISOString(),
      brandId: webhook.brandId,
      data,
    };

    const delivery: WebhookDelivery = {
      id: createId(),
      webhookId: webhook.id,
      eventType: event,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);

    // Attempt delivery with retries
    let lastResult: WebhookDeliveryResult | undefined;

    for (let attempt = 0; attempt <= webhook.retryPolicy.maxRetries; attempt++) {
      if (attempt > 0) {
        // Wait before retry
        const delay = webhook.retryPolicy.exponentialBackoff
          ? webhook.retryPolicy.retryDelayMs * Math.pow(2, attempt - 1)
          : webhook.retryPolicy.retryDelayMs;

        await new Promise((resolve) => setTimeout(resolve, delay));
        delivery.status = "retrying";
      }

      delivery.attempts++;
      delivery.lastAttemptAt = new Date();

      lastResult = await this.sendWebhookRequest(webhook, payload);

      if (lastResult.success) {
        delivery.status = "success";
        delivery.responseStatus = lastResult.statusCode;
        delivery.responseBody = lastResult.responseBody;
        this.deliveries.set(delivery.id, delivery);
        return delivery;
      }
    }

    // All attempts failed
    delivery.status = "failed";
    delivery.responseStatus = lastResult?.statusCode;
    delivery.responseBody = lastResult?.responseBody;
    delivery.error = lastResult?.error;
    this.deliveries.set(delivery.id, delivery);

    return delivery;
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhookRequest(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Apex-GEO-Webhooks/1.0",
        "X-Webhook-ID": webhook.id,
        "X-Event-Type": payload.event,
        "X-Delivery-ID": payload.id,
        ...webhook.headers,
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = this.generateSignature(body, webhook.secret);
        headers["X-Webhook-Signature"] = signature;
        headers["X-Webhook-Signature-256"] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      const responseBody = await response.text();
      const durationMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          responseBody: responseBody.slice(0, 1000), // Truncate
          durationMs,
        };
      }

      return {
        success: false,
        statusCode: response.status,
        responseBody: responseBody.slice(0, 1000),
        error: `HTTP ${response.status}: ${response.statusText}`,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs,
      };
    }
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Get delivery history for webhook
   */
  getDeliveryHistory(webhookId: string, limit: number = 100): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter((d) => d.webhookId === webhookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get delivery by ID
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<WebhookDelivery | undefined> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery || delivery.status !== "failed") return undefined;

    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook) return undefined;

    // Reset and redeliver
    delivery.status = "pending";
    delivery.attempts = 0;
    delivery.error = undefined;
    this.deliveries.set(delivery.id, delivery);

    return this.deliverWebhook(webhook, delivery.eventType, delivery.payload.data);
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return {
        success: false,
        error: "Webhook not found",
        durationMs: 0,
      };
    }

    const testPayload: WebhookPayload = {
      id: createId(),
      event: "mention.new",
      timestamp: new Date().toISOString(),
      brandId: webhook.brandId,
      data: {
        test: true,
        message: "This is a test webhook delivery from Apex GEO",
      },
    };

    return this.sendWebhookRequest(webhook, testPayload);
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// Singleton instance
export const webhookManager = new WebhookManager();

/**
 * Event helper functions
 */
export const WebhookEvents = {
  // Mention events
  async onNewMention(
    brandId: string,
    mention: { id: string; platform: string; content: string; sentiment: string; url?: string }
  ) {
    return webhookManager.fireEvent(brandId, "mention.new", { mention });
  },

  async onSentimentChange(
    brandId: string,
    data: { mentionId: string; oldSentiment: string; newSentiment: string }
  ) {
    return webhookManager.fireEvent(brandId, "mention.sentiment_change", data);
  },

  // Audit events
  async onAuditStarted(brandId: string, audit: { id: string; url: string }) {
    return webhookManager.fireEvent(brandId, "audit.started", { audit });
  },

  async onAuditCompleted(
    brandId: string,
    audit: { id: string; url: string; score: number; issues: number }
  ) {
    return webhookManager.fireEvent(brandId, "audit.completed", { audit });
  },

  async onAuditFailed(brandId: string, audit: { id: string; url: string; error: string }) {
    return webhookManager.fireEvent(brandId, "audit.failed", { audit });
  },

  // Score events
  async onScoreUpdated(
    brandId: string,
    data: { oldScore: number; newScore: number; change: number; platform?: string }
  ) {
    return webhookManager.fireEvent(brandId, "score.updated", data);
  },

  async onScoreThresholdReached(
    brandId: string,
    data: { score: number; threshold: number; direction: "above" | "below" }
  ) {
    return webhookManager.fireEvent(brandId, "score.threshold_reached", data);
  },

  // Recommendation events
  async onRecommendationCreated(
    brandId: string,
    recommendation: { id: string; title: string; priority: string; category: string }
  ) {
    return webhookManager.fireEvent(brandId, "recommendation.created", { recommendation });
  },

  async onRecommendationCompleted(
    brandId: string,
    recommendation: { id: string; title: string; completedBy: string }
  ) {
    return webhookManager.fireEvent(brandId, "recommendation.completed", { recommendation });
  },

  // Alert events
  async onCrisisAlert(
    brandId: string,
    alert: { severity: string; trigger: string; details: Record<string, unknown> }
  ) {
    return webhookManager.fireEvent(brandId, "alert.crisis", { alert });
  },

  async onNegativeSpike(
    brandId: string,
    data: { percentage: number; count: number; timeframe: string }
  ) {
    return webhookManager.fireEvent(brandId, "alert.negative_spike", data);
  },

  // Report events
  async onWeeklyReportReady(
    brandId: string,
    report: { id: string; periodStart: string; periodEnd: string; downloadUrl?: string }
  ) {
    return webhookManager.fireEvent(brandId, "report.weekly_ready", { report });
  },

  // Content events
  async onContentPublished(
    brandId: string,
    content: { id: string; title: string; type: string; url?: string }
  ) {
    return webhookManager.fireEvent(brandId, "content.published", { content });
  },

  // Competitor events
  async onCompetitorChange(
    brandId: string,
    data: { competitorId: string; competitorName: string; changeType: string; details: Record<string, unknown> }
  ) {
    return webhookManager.fireEvent(brandId, "competitor.change", data);
  },
};

/**
 * Format webhook for API response
 */
export function formatWebhookResponse(webhook: WebhookConfig) {
  return {
    id: webhook.id,
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    enabled: webhook.enabled,
    hasSecret: !!webhook.secret,
    retryPolicy: webhook.retryPolicy,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  };
}

/**
 * Format delivery for API response
 */
export function formatDeliveryResponse(delivery: WebhookDelivery) {
  return {
    id: delivery.id,
    webhookId: delivery.webhookId,
    eventType: delivery.eventType,
    status: delivery.status,
    attempts: delivery.attempts,
    lastAttemptAt: delivery.lastAttemptAt?.toISOString(),
    responseStatus: delivery.responseStatus,
    error: delivery.error,
    createdAt: delivery.createdAt.toISOString(),
  };
}
