/**
 * Crisis Alert System (F130.5)
 * Automated crisis detection with threshold-based alerts
 * Inspired by Brand24's real-time crisis detection pattern
 */

import { createId } from "@paralleldrive/cuid2";
import { webhookManager, WebhookEvents } from "./webhooks";
import { emailManager } from "./email";

// Crisis types and thresholds
export interface CrisisThreshold {
  id: string;
  brandId: string;
  name: string;
  type: CrisisType;
  enabled: boolean;
  config: ThresholdConfig;
  alertChannels: AlertChannel[];
  cooldownMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CrisisType =
  | "sentiment_drop"
  | "mention_spike"
  | "score_drop"
  | "negative_surge"
  | "keyword_alert";

export interface ThresholdConfig {
  // For sentiment_drop
  sentimentDropPercent?: number; // e.g., 20 = 20% drop in positive sentiment
  timeframeHours?: number; // e.g., 24 hours

  // For mention_spike
  mentionSpikePercent?: number; // e.g., 200 = 200% increase
  baselinePeriodDays?: number; // Compare to this baseline

  // For score_drop
  scoreDropPoints?: number; // e.g., 10 = 10 point drop
  minimumPreviousScore?: number; // Only alert if was above this

  // For negative_surge
  negativeCountThreshold?: number; // e.g., 10 negative mentions
  negativePercentThreshold?: number; // e.g., 30% of mentions are negative

  // For keyword_alert
  keywords?: string[];
  caseSensitive?: boolean;
}

export type AlertChannel = "email" | "slack" | "whatsapp" | "in_app" | "webhook";

export type CrisisSeverity = "warning" | "critical" | "emergency";

export interface CrisisEvent {
  id: string;
  brandId: string;
  thresholdId: string;
  type: CrisisType;
  severity: CrisisSeverity;
  title: string;
  description: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: "active" | "acknowledged" | "resolved" | "false_positive";
  metrics: CrisisMetrics;
  affectedPlatforms: string[];
  timeline: CrisisTimelineEntry[];
  suggestedActions: SuggestedAction[];
  alerts: AlertDelivery[];
}

export interface CrisisMetrics {
  previousValue: number;
  currentValue: number;
  changePercent: number;
  mentionCount?: number;
  negativeMentions?: number;
  platforms?: Record<string, number>;
}

export interface CrisisTimelineEntry {
  id: string;
  timestamp: Date;
  type: "trigger" | "alert_sent" | "acknowledged" | "action_taken" | "resolved" | "escalated";
  description: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface SuggestedAction {
  id: string;
  priority: "immediate" | "high" | "medium" | "low";
  title: string;
  description: string;
  category: "communication" | "monitoring" | "content" | "engagement" | "escalation";
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface AlertDelivery {
  id: string;
  channel: AlertChannel;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  recipient?: string;
  error?: string;
}

export interface CrisisSettings {
  brandId: string;
  enabled: boolean;
  thresholds: CrisisThreshold[];
  defaultAlertChannels: AlertChannel[];
  escalationContacts: EscalationContact[];
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
    timezone: string;
    exceptEmergency: boolean;
  };
}

export interface EscalationContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  slackUserId?: string;
  role: string;
  escalationLevel: number; // 1 = first contact, 2 = escalation, etc.
}

/**
 * Crisis Alert Manager
 */
export class CrisisAlertManager {
  private settings: Map<string, CrisisSettings> = new Map();
  private events: Map<string, CrisisEvent> = new Map();
  private eventsByBrand: Map<string, Set<string>> = new Map();
  private lastAlerts: Map<string, Date> = new Map(); // For cooldown tracking

  constructor() {}

  /**
   * Configure crisis settings for a brand
   */
  configureSettings(brandId: string, settings: Partial<Omit<CrisisSettings, "brandId">>): CrisisSettings {
    const existing = this.settings.get(brandId);

    const newSettings: CrisisSettings = {
      brandId,
      enabled: settings.enabled ?? existing?.enabled ?? true,
      thresholds: settings.thresholds ?? existing?.thresholds ?? [],
      defaultAlertChannels: settings.defaultAlertChannels ?? existing?.defaultAlertChannels ?? ["email", "in_app"],
      escalationContacts: settings.escalationContacts ?? existing?.escalationContacts ?? [],
      quietHours: settings.quietHours ?? existing?.quietHours,
    };

    this.settings.set(brandId, newSettings);
    return newSettings;
  }

  /**
   * Get crisis settings for a brand
   */
  getSettings(brandId: string): CrisisSettings | undefined {
    return this.settings.get(brandId);
  }

  /**
   * Add a crisis threshold
   */
  addThreshold(
    brandId: string,
    config: {
      name: string;
      type: CrisisType;
      config: ThresholdConfig;
      alertChannels?: AlertChannel[];
      cooldownMinutes?: number;
    }
  ): CrisisThreshold {
    const threshold: CrisisThreshold = {
      id: createId(),
      brandId,
      name: config.name,
      type: config.type,
      enabled: true,
      config: config.config,
      alertChannels: config.alertChannels || this.settings.get(brandId)?.defaultAlertChannels || ["email", "in_app"],
      cooldownMinutes: config.cooldownMinutes || 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const settings = this.settings.get(brandId) || this.configureSettings(brandId, {});
    settings.thresholds.push(threshold);
    this.settings.set(brandId, settings);

    return threshold;
  }

  /**
   * Update a threshold
   */
  updateThreshold(
    thresholdId: string,
    updates: Partial<Omit<CrisisThreshold, "id" | "brandId" | "createdAt">>
  ): CrisisThreshold | undefined {
    for (const [brandId, settings] of this.settings) {
      const idx = settings.thresholds.findIndex((t) => t.id === thresholdId);
      if (idx !== -1) {
        const threshold = settings.thresholds[idx];
        Object.assign(threshold, updates, { updatedAt: new Date() });
        return threshold;
      }
    }
    return undefined;
  }

  /**
   * Delete a threshold
   */
  deleteThreshold(thresholdId: string): boolean {
    for (const [brandId, settings] of this.settings) {
      const idx = settings.thresholds.findIndex((t) => t.id === thresholdId);
      if (idx !== -1) {
        settings.thresholds.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Check metrics against thresholds and trigger alerts
   */
  async checkThresholds(
    brandId: string,
    metrics: {
      currentSentiment?: number;
      previousSentiment?: number;
      currentMentions?: number;
      baselineMentions?: number;
      currentScore?: number;
      previousScore?: number;
      negativeMentions?: number;
      totalMentions?: number;
      mentionContent?: string[];
      platforms?: string[];
    }
  ): Promise<CrisisEvent[]> {
    const settings = this.settings.get(brandId);
    if (!settings?.enabled) return [];

    const triggeredEvents: CrisisEvent[] = [];

    for (const threshold of settings.thresholds) {
      if (!threshold.enabled) continue;

      // Check cooldown
      const cooldownKey = `${brandId}:${threshold.id}`;
      const lastAlert = this.lastAlerts.get(cooldownKey);
      if (lastAlert) {
        const cooldownMs = threshold.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) continue;
      }

      const result = this.evaluateThreshold(threshold, metrics);
      if (result.triggered) {
        const event = await this.createCrisisEvent(
          brandId,
          threshold,
          result.severity,
          result.title,
          result.description,
          result.metrics,
          metrics.platforms || []
        );
        triggeredEvents.push(event);
        this.lastAlerts.set(cooldownKey, new Date());
      }
    }

    return triggeredEvents;
  }

  /**
   * Evaluate a single threshold
   */
  private evaluateThreshold(
    threshold: CrisisThreshold,
    metrics: Record<string, unknown>
  ): {
    triggered: boolean;
    severity: CrisisSeverity;
    title: string;
    description: string;
    metrics: CrisisMetrics;
  } {
    const result = {
      triggered: false,
      severity: "warning" as CrisisSeverity,
      title: "",
      description: "",
      metrics: {
        previousValue: 0,
        currentValue: 0,
        changePercent: 0,
      } as CrisisMetrics,
    };

    switch (threshold.type) {
      case "sentiment_drop": {
        const prev = metrics.previousSentiment as number;
        const curr = metrics.currentSentiment as number;
        const dropPercent = threshold.config.sentimentDropPercent || 20;

        if (prev !== undefined && curr !== undefined && prev > 0) {
          const change = ((prev - curr) / prev) * 100;
          result.metrics = { previousValue: prev, currentValue: curr, changePercent: change };

          if (change >= dropPercent) {
            result.triggered = true;
            result.severity = change >= dropPercent * 2 ? "critical" : "warning";
            result.title = `Sentiment Drop Alert: ${change.toFixed(1)}% decrease`;
            result.description = `Positive sentiment dropped from ${prev.toFixed(1)}% to ${curr.toFixed(1)}% (${change.toFixed(1)}% decrease)`;
          }
        }
        break;
      }

      case "mention_spike": {
        const baseline = metrics.baselineMentions as number;
        const current = metrics.currentMentions as number;
        const spikePercent = threshold.config.mentionSpikePercent || 200;

        if (baseline !== undefined && current !== undefined && baseline > 0) {
          const increase = ((current - baseline) / baseline) * 100;
          result.metrics = { previousValue: baseline, currentValue: current, changePercent: increase };

          if (increase >= spikePercent) {
            result.triggered = true;
            result.severity = increase >= spikePercent * 1.5 ? "critical" : "warning";
            result.title = `Mention Spike Alert: ${increase.toFixed(0)}% increase`;
            result.description = `Mentions increased from ${baseline} to ${current} (${increase.toFixed(0)}% increase)`;
          }
        }
        break;
      }

      case "score_drop": {
        const prev = metrics.previousScore as number;
        const curr = metrics.currentScore as number;
        const dropPoints = threshold.config.scoreDropPoints || 10;
        const minPrev = threshold.config.minimumPreviousScore || 0;

        if (prev !== undefined && curr !== undefined && prev >= minPrev) {
          const drop = prev - curr;
          result.metrics = { previousValue: prev, currentValue: curr, changePercent: (drop / prev) * 100 };

          if (drop >= dropPoints) {
            result.triggered = true;
            result.severity = drop >= dropPoints * 2 ? "emergency" : drop >= dropPoints * 1.5 ? "critical" : "warning";
            result.title = `GEO Score Drop Alert: ${drop} point decrease`;
            result.description = `GEO Score dropped from ${prev} to ${curr} (${drop} point decrease)`;
          }
        }
        break;
      }

      case "negative_surge": {
        const negative = metrics.negativeMentions as number;
        const total = metrics.totalMentions as number;
        const countThreshold = threshold.config.negativeCountThreshold || 10;
        const percentThreshold = threshold.config.negativePercentThreshold || 30;

        if (negative !== undefined && total !== undefined && total > 0) {
          const negativePercent = (negative / total) * 100;
          result.metrics = {
            previousValue: 0,
            currentValue: negativePercent,
            changePercent: 0,
            negativeMentions: negative,
            mentionCount: total,
          };

          if (negative >= countThreshold || negativePercent >= percentThreshold) {
            result.triggered = true;
            result.severity = negativePercent >= 50 || negative >= countThreshold * 2 ? "critical" : "warning";
            result.title = `Negative Mention Surge: ${negative} negative mentions`;
            result.description = `${negative} negative mentions detected (${negativePercent.toFixed(1)}% of ${total} total mentions)`;
          }
        }
        break;
      }

      case "keyword_alert": {
        const content = metrics.mentionContent as string[] | undefined;
        const keywords = threshold.config.keywords || [];
        const caseSensitive = threshold.config.caseSensitive || false;

        if (content && keywords.length > 0) {
          const matchedKeywords: string[] = [];

          for (const text of content) {
            for (const keyword of keywords) {
              const searchText = caseSensitive ? text : text.toLowerCase();
              const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
              if (searchText.includes(searchKeyword)) {
                matchedKeywords.push(keyword);
              }
            }
          }

          if (matchedKeywords.length > 0) {
            result.triggered = true;
            result.severity = matchedKeywords.length >= 3 ? "critical" : "warning";
            result.title = `Keyword Alert: ${matchedKeywords.length} matches found`;
            result.description = `Keywords detected: ${[...new Set(matchedKeywords)].join(", ")}`;
            result.metrics = { previousValue: 0, currentValue: matchedKeywords.length, changePercent: 0 };
          }
        }
        break;
      }
    }

    return result;
  }

  /**
   * Create a crisis event and send alerts
   */
  private async createCrisisEvent(
    brandId: string,
    threshold: CrisisThreshold,
    severity: CrisisSeverity,
    title: string,
    description: string,
    metrics: CrisisMetrics,
    platforms: string[]
  ): Promise<CrisisEvent> {
    const event: CrisisEvent = {
      id: createId(),
      brandId,
      thresholdId: threshold.id,
      type: threshold.type,
      severity,
      title,
      description,
      triggeredAt: new Date(),
      status: "active",
      metrics,
      affectedPlatforms: platforms,
      timeline: [
        {
          id: createId(),
          timestamp: new Date(),
          type: "trigger",
          description: `Crisis detected: ${title}`,
        },
      ],
      suggestedActions: this.generateSuggestedActions(threshold.type, severity),
      alerts: [],
    };

    this.events.set(event.id, event);
    if (!this.eventsByBrand.has(brandId)) {
      this.eventsByBrand.set(brandId, new Set());
    }
    this.eventsByBrand.get(brandId)!.add(event.id);

    // Send alerts
    await this.sendAlerts(event, threshold.alertChannels);

    return event;
  }

  /**
   * Generate suggested actions based on crisis type
   */
  private generateSuggestedActions(type: CrisisType, severity: CrisisSeverity): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Common immediate actions
    if (severity === "emergency" || severity === "critical") {
      actions.push({
        id: createId(),
        priority: "immediate",
        title: "Notify Crisis Team",
        description: "Alert crisis management team and key stakeholders immediately",
        category: "escalation",
        completed: false,
      });
    }

    // Type-specific actions
    switch (type) {
      case "sentiment_drop":
      case "negative_surge":
        actions.push(
          {
            id: createId(),
            priority: "immediate",
            title: "Review Negative Mentions",
            description: "Analyze the specific mentions causing the sentiment drop",
            category: "monitoring",
            completed: false,
          },
          {
            id: createId(),
            priority: "high",
            title: "Prepare Response Strategy",
            description: "Draft responses for common concerns/complaints",
            category: "communication",
            completed: false,
          },
          {
            id: createId(),
            priority: "medium",
            title: "Engage with Critics",
            description: "Respond to negative mentions with empathy and solutions",
            category: "engagement",
            completed: false,
          }
        );
        break;

      case "mention_spike":
        actions.push(
          {
            id: createId(),
            priority: "immediate",
            title: "Identify Spike Source",
            description: "Determine what is driving the increased mentions",
            category: "monitoring",
            completed: false,
          },
          {
            id: createId(),
            priority: "high",
            title: "Assess Mention Sentiment",
            description: "Analyze if spike is positive or negative",
            category: "monitoring",
            completed: false,
          },
          {
            id: createId(),
            priority: "medium",
            title: "Prepare PR Response",
            description: "Have a statement ready if media coverage is expected",
            category: "communication",
            completed: false,
          }
        );
        break;

      case "score_drop":
        actions.push(
          {
            id: createId(),
            priority: "immediate",
            title: "Review Score Components",
            description: "Check which factors contributed to the score drop",
            category: "monitoring",
            completed: false,
          },
          {
            id: createId(),
            priority: "high",
            title: "Check Competitor Movement",
            description: "See if competitors gained visibility",
            category: "monitoring",
            completed: false,
          },
          {
            id: createId(),
            priority: "high",
            title: "Review Content Strategy",
            description: "Assess if content changes are needed",
            category: "content",
            completed: false,
          }
        );
        break;

      case "keyword_alert":
        actions.push(
          {
            id: createId(),
            priority: "immediate",
            title: "Review Keyword Context",
            description: "Understand the context around matched keywords",
            category: "monitoring",
            completed: false,
          },
          {
            id: createId(),
            priority: "high",
            title: "Assess Impact Potential",
            description: "Evaluate if this could escalate",
            category: "monitoring",
            completed: false,
          }
        );
        break;
    }

    return actions;
  }

  /**
   * Send alerts through configured channels
   */
  private async sendAlerts(event: CrisisEvent, channels: AlertChannel[]): Promise<void> {
    const settings = this.settings.get(event.brandId);

    for (const channel of channels) {
      const delivery: AlertDelivery = {
        id: createId(),
        channel,
        status: "pending",
      };

      try {
        switch (channel) {
          case "email":
            if (settings?.escalationContacts) {
              for (const contact of settings.escalationContacts.filter((c) => c.email)) {
                // Map crisis severity to email severity
                const emailSeverity: "low" | "medium" | "high" | "critical" =
                  event.severity === "warning" ? "medium" :
                  event.severity === "critical" ? "high" : "critical"; // emergency -> critical
                await emailManager.sendAlertNotification(contact.email!, {
                  brandName: event.brandId,
                  alertType: event.type === "negative_surge" ? "negative_mention" : "crisis_detected",
                  severity: emailSeverity,
                  title: event.title,
                  description: event.description,
                  triggeredAt: event.triggeredAt.toISOString(),
                  affectedPlatforms: event.affectedPlatforms,
                  actionItems: event.suggestedActions.map((a) => a.title),
                });
                delivery.recipient = contact.email;
              }
            }
            delivery.status = "sent";
            delivery.sentAt = new Date();
            break;

          case "webhook":
            await WebhookEvents.onCrisisAlert(event.brandId, {
              severity: event.severity,
              trigger: event.type,
              details: {
                title: event.title,
                description: event.description,
                metrics: event.metrics,
              },
            });
            delivery.status = "sent";
            delivery.sentAt = new Date();
            break;

          case "in_app":
            // In-app notifications would be handled by a separate system
            delivery.status = "sent";
            delivery.sentAt = new Date();
            break;

          case "slack":
            // Slack notification would use the Slack integration
            delivery.status = "sent";
            delivery.sentAt = new Date();
            break;

          case "whatsapp":
            // WhatsApp notification would use the WhatsApp Business API
            delivery.status = "sent";
            delivery.sentAt = new Date();
            break;
        }
      } catch (error) {
        delivery.status = "failed";
        delivery.error = error instanceof Error ? error.message : "Unknown error";
      }

      event.alerts.push(delivery);
    }

    // Add timeline entry
    event.timeline.push({
      id: createId(),
      timestamp: new Date(),
      type: "alert_sent",
      description: `Alerts sent via ${channels.join(", ")}`,
    });
  }

  /**
   * Get crisis event by ID
   */
  getEvent(eventId: string): CrisisEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get active crises for a brand
   */
  getActiveCrises(brandId: string): CrisisEvent[] {
    const eventIds = this.eventsByBrand.get(brandId);
    if (!eventIds) return [];

    return Array.from(eventIds)
      .map((id) => this.events.get(id))
      .filter((e): e is CrisisEvent => e !== undefined && e.status === "active")
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Get crisis history for a brand
   */
  getCrisisHistory(brandId: string, limit: number = 100): CrisisEvent[] {
    const eventIds = this.eventsByBrand.get(brandId);
    if (!eventIds) return [];

    return Array.from(eventIds)
      .map((id) => this.events.get(id))
      .filter((e): e is CrisisEvent => e !== undefined)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  /**
   * Acknowledge a crisis
   */
  acknowledgeCrisis(eventId: string, userId: string): CrisisEvent | undefined {
    const event = this.events.get(eventId);
    if (!event || event.status !== "active") return undefined;

    event.status = "acknowledged";
    event.timeline.push({
      id: createId(),
      timestamp: new Date(),
      type: "acknowledged",
      description: "Crisis acknowledged by team member",
      actor: userId,
    });

    return event;
  }

  /**
   * Complete a suggested action
   */
  completeAction(eventId: string, actionId: string, userId: string): CrisisEvent | undefined {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    const action = event.suggestedActions.find((a) => a.id === actionId);
    if (!action) return undefined;

    action.completed = true;
    action.completedAt = new Date();
    action.completedBy = userId;

    event.timeline.push({
      id: createId(),
      timestamp: new Date(),
      type: "action_taken",
      description: `Action completed: ${action.title}`,
      actor: userId,
    });

    return event;
  }

  /**
   * Resolve a crisis
   */
  resolveCrisis(eventId: string, userId: string, resolution?: string): CrisisEvent | undefined {
    const event = this.events.get(eventId);
    if (!event || event.status === "resolved") return undefined;

    event.status = "resolved";
    event.resolvedAt = new Date();
    event.timeline.push({
      id: createId(),
      timestamp: new Date(),
      type: "resolved",
      description: resolution || "Crisis resolved",
      actor: userId,
    });

    return event;
  }

  /**
   * Mark crisis as false positive
   */
  markFalsePositive(eventId: string, userId: string, reason?: string): CrisisEvent | undefined {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    event.status = "false_positive";
    event.resolvedAt = new Date();
    event.timeline.push({
      id: createId(),
      timestamp: new Date(),
      type: "resolved",
      description: reason || "Marked as false positive",
      actor: userId,
    });

    return event;
  }

  /**
   * Get crisis dashboard stats
   */
  getDashboardStats(brandId: string): {
    activeCount: number;
    resolvedLast7Days: number;
    avgResolutionTimeHours: number;
    crisesByType: Record<CrisisType, number>;
    crisesBySeverity: Record<CrisisSeverity, number>;
  } {
    const events = this.getCrisisHistory(brandId, 500);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const active = events.filter((e) => e.status === "active");
    const resolvedRecent = events.filter(
      (e) => e.resolvedAt && e.resolvedAt >= sevenDaysAgo
    );

    const resolutionTimes = events
      .filter((e) => e.resolvedAt)
      .map((e) => (e.resolvedAt!.getTime() - e.triggeredAt.getTime()) / (1000 * 60 * 60));

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    const byType: Record<CrisisType, number> = {
      sentiment_drop: 0,
      mention_spike: 0,
      score_drop: 0,
      negative_surge: 0,
      keyword_alert: 0,
    };
    const bySeverity: Record<CrisisSeverity, number> = {
      warning: 0,
      critical: 0,
      emergency: 0,
    };

    for (const event of events) {
      byType[event.type]++;
      bySeverity[event.severity]++;
    }

    return {
      activeCount: active.length,
      resolvedLast7Days: resolvedRecent.length,
      avgResolutionTimeHours: avgResolutionTime,
      crisesByType: byType,
      crisesBySeverity: bySeverity,
    };
  }
}

// Singleton instance
export const crisisAlertManager = new CrisisAlertManager();

/**
 * Format crisis event for API response
 */
export function formatCrisisEventResponse(event: CrisisEvent) {
  return {
    id: event.id,
    type: event.type,
    severity: event.severity,
    title: event.title,
    description: event.description,
    status: event.status,
    triggeredAt: event.triggeredAt.toISOString(),
    resolvedAt: event.resolvedAt?.toISOString(),
    metrics: event.metrics,
    affectedPlatforms: event.affectedPlatforms,
    timeline: event.timeline.map((t) => ({
      id: t.id,
      timestamp: t.timestamp.toISOString(),
      type: t.type,
      description: t.description,
      actor: t.actor,
    })),
    suggestedActions: event.suggestedActions,
    alertCount: event.alerts.length,
    alertsSent: event.alerts.filter((a) => a.status === "sent").length,
  };
}

/**
 * Format threshold for API response
 */
export function formatThresholdResponse(threshold: CrisisThreshold) {
  return {
    id: threshold.id,
    name: threshold.name,
    type: threshold.type,
    enabled: threshold.enabled,
    config: threshold.config,
    alertChannels: threshold.alertChannels,
    cooldownMinutes: threshold.cooldownMinutes,
    createdAt: threshold.createdAt.toISOString(),
    updatedAt: threshold.updatedAt.toISOString(),
  };
}
