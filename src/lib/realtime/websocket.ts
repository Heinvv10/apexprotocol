/**
 * WebSocket Real-time Updates (F138)
 * Handles WebSocket connections for live updates of mentions, recommendations, and GEO scores
 */

import { v4 as uuidv4 } from "uuid";

// Event Types
export type RealtimeEventType =
  | "mention.created"
  | "mention.updated"
  | "recommendation.created"
  | "recommendation.updated"
  | "recommendation.completed"
  | "geo_score.updated"
  | "audit.started"
  | "audit.progress"
  | "audit.completed"
  | "crisis.detected"
  | "crisis.resolved"
  | "notification"
  | "connection.established"
  | "heartbeat"
  | "error";

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  channel: string;
  data: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface RealtimeSubscription {
  id: string;
  clientId: string;
  channel: string;
  eventTypes: RealtimeEventType[];
  filters?: Record<string, unknown>;
  createdAt: Date;
}

export interface RealtimeClient {
  id: string;
  userId: string;
  organizationId: string;
  subscriptions: Map<string, RealtimeSubscription>;
  lastHeartbeat: Date;
  connectedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface RealtimeMessage {
  type: "subscribe" | "unsubscribe" | "publish" | "ping" | "pong";
  channel?: string;
  eventTypes?: RealtimeEventType[];
  filters?: Record<string, unknown>;
  data?: unknown;
  requestId?: string;
}

export interface RealtimeResponse {
  type: "subscribed" | "unsubscribed" | "published" | "event" | "pong" | "error";
  channel?: string;
  subscriptionId?: string;
  event?: RealtimeEvent;
  error?: string;
  requestId?: string;
}

// Channel Patterns
export const CHANNEL_PATTERNS = {
  // Brand-specific channels
  brandMentions: (brandId: string) => `brand:${brandId}:mentions`,
  brandRecommendations: (brandId: string) => `brand:${brandId}:recommendations`,
  brandGeoScore: (brandId: string) => `brand:${brandId}:geo_score`,
  brandAudits: (brandId: string) => `brand:${brandId}:audits`,
  brandCrisis: (brandId: string) => `brand:${brandId}:crisis`,

  // Organization-wide channels
  orgNotifications: (orgId: string) => `org:${orgId}:notifications`,
  orgActivity: (orgId: string) => `org:${orgId}:activity`,

  // User-specific channels
  userNotifications: (userId: string) => `user:${userId}:notifications`,

  // Global channels
  systemStatus: "system:status",
  systemMaintenance: "system:maintenance",
};

/**
 * WebSocket Manager
 * Manages WebSocket connections and event distribution
 */
export class WebSocketManager {
  private clients: Map<string, RealtimeClient> = new Map();
  private channelSubscribers: Map<string, Set<string>> = new Map();
  private eventHistory: Map<string, RealtimeEvent[]> = new Map();
  private messageCallbacks: Map<string, (message: RealtimeResponse) => void> = new Map();
  private heartbeatInterval: number = 30000; // 30 seconds
  private maxHistoryPerChannel: number = 100;
  private connectionTimeout: number = 120000; // 2 minutes

  /**
   * Register a new client connection
   */
  registerClient(
    clientId: string,
    userId: string,
    organizationId: string,
    messageCallback: (message: RealtimeResponse) => void,
    metadata?: Record<string, unknown>
  ): RealtimeClient {
    const client: RealtimeClient = {
      id: clientId,
      userId,
      organizationId,
      subscriptions: new Map(),
      lastHeartbeat: new Date(),
      connectedAt: new Date(),
      metadata,
    };

    this.clients.set(clientId, client);
    this.messageCallbacks.set(clientId, messageCallback);

    // Send connection established event
    this.sendToClient(clientId, {
      type: "event",
      event: {
        id: uuidv4(),
        type: "connection.established",
        channel: "system",
        data: { clientId, connectedAt: client.connectedAt },
        timestamp: new Date(),
      },
    });

    return client;
  }

  /**
   * Unregister a client connection
   */
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove all subscriptions
    client.subscriptions.forEach((sub) => {
      const subscribers = this.channelSubscribers.get(sub.channel);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(sub.channel);
        }
      }
    });

    this.clients.delete(clientId);
    this.messageCallbacks.delete(clientId);
  }

  /**
   * Subscribe to a channel
   */
  subscribe(
    clientId: string,
    channel: string,
    eventTypes?: RealtimeEventType[],
    filters?: Record<string, unknown>
  ): RealtimeSubscription | null {
    const client = this.clients.get(clientId);
    if (!client) return null;

    const subscriptionId = `sub_${uuidv4()}`;
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      clientId,
      channel,
      eventTypes: eventTypes || [],
      filters,
      createdAt: new Date(),
    };

    client.subscriptions.set(subscriptionId, subscription);

    // Add to channel subscribers
    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(clientId);

    // Send confirmation
    this.sendToClient(clientId, {
      type: "subscribed",
      channel,
      subscriptionId,
    });

    // Send recent events from history
    const history = this.eventHistory.get(channel);
    if (history && history.length > 0) {
      const recentEvents = history.slice(-10);
      recentEvents.forEach((event) => {
        if (this.matchesSubscription(event, subscription)) {
          this.sendToClient(clientId, { type: "event", channel, event });
        }
      });
    }

    return subscription;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(clientId: string, subscriptionId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const subscription = client.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    const { channel } = subscription;

    client.subscriptions.delete(subscriptionId);

    // Check if client has other subscriptions to same channel
    const hasOtherSubs = Array.from(client.subscriptions.values()).some(
      (s) => s.channel === channel
    );

    if (!hasOtherSubs) {
      const subscribers = this.channelSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channel);
        }
      }
    }

    this.sendToClient(clientId, {
      type: "unsubscribed",
      channel,
      subscriptionId,
    });

    return true;
  }

  /**
   * Publish an event to a channel
   */
  publish(
    channel: string,
    eventType: RealtimeEventType,
    data: unknown,
    metadata?: Record<string, unknown>
  ): RealtimeEvent {
    const event: RealtimeEvent = {
      id: uuidv4(),
      type: eventType,
      channel,
      data,
      timestamp: new Date(),
      metadata,
    };

    // Store in history
    if (!this.eventHistory.has(channel)) {
      this.eventHistory.set(channel, []);
    }
    const history = this.eventHistory.get(channel)!;
    history.push(event);
    if (history.length > this.maxHistoryPerChannel) {
      history.shift();
    }

    // Broadcast to subscribers
    this.broadcastToChannel(channel, event);

    return event;
  }

  /**
   * Publish mention event
   */
  publishMention(
    brandId: string,
    eventType: "mention.created" | "mention.updated",
    mention: unknown
  ): void {
    this.publish(
      CHANNEL_PATTERNS.brandMentions(brandId),
      eventType,
      mention
    );
  }

  /**
   * Publish recommendation event
   */
  publishRecommendation(
    brandId: string,
    eventType: "recommendation.created" | "recommendation.updated" | "recommendation.completed",
    recommendation: unknown
  ): void {
    this.publish(
      CHANNEL_PATTERNS.brandRecommendations(brandId),
      eventType,
      recommendation
    );
  }

  /**
   * Publish GEO score update
   */
  publishGeoScoreUpdate(brandId: string, score: unknown): void {
    this.publish(
      CHANNEL_PATTERNS.brandGeoScore(brandId),
      "geo_score.updated",
      score
    );
  }

  /**
   * Publish audit progress
   */
  publishAuditProgress(
    brandId: string,
    auditId: string,
    progress: number,
    status: string,
    currentStep?: string
  ): void {
    this.publish(
      CHANNEL_PATTERNS.brandAudits(brandId),
      progress === 100 ? "audit.completed" : "audit.progress",
      { auditId, progress, status, currentStep }
    );
  }

  /**
   * Publish crisis event
   */
  publishCrisisEvent(
    brandId: string,
    eventType: "crisis.detected" | "crisis.resolved",
    crisis: unknown
  ): void {
    this.publish(
      CHANNEL_PATTERNS.brandCrisis(brandId),
      eventType,
      crisis
    );
  }

  /**
   * Publish notification to user
   */
  publishUserNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error";
      action?: { label: string; url: string };
    }
  ): void {
    this.publish(
      CHANNEL_PATTERNS.userNotifications(userId),
      "notification",
      notification
    );
  }

  /**
   * Publish organization notification
   */
  publishOrgNotification(
    orgId: string,
    notification: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error";
      action?: { label: string; url: string };
    }
  ): void {
    this.publish(
      CHANNEL_PATTERNS.orgNotifications(orgId),
      "notification",
      notification
    );
  }

  /**
   * Handle heartbeat from client
   */
  handleHeartbeat(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastHeartbeat = new Date();
      this.sendToClient(clientId, { type: "pong" });
    }
  }

  /**
   * Handle incoming message from client
   */
  handleMessage(clientId: string, message: RealtimeMessage): void {
    switch (message.type) {
      case "subscribe":
        if (message.channel) {
          this.subscribe(
            clientId,
            message.channel,
            message.eventTypes,
            message.filters
          );
        }
        break;

      case "unsubscribe":
        if (message.requestId) {
          this.unsubscribe(clientId, message.requestId);
        }
        break;

      case "ping":
        this.handleHeartbeat(clientId);
        break;

      case "publish":
        // Only allowed for authenticated clients with proper permissions
        // In production, validate permissions here
        break;
    }
  }

  /**
   * Get client info
   */
  getClient(clientId: string): RealtimeClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all subscriptions for a client
   */
  getClientSubscriptions(clientId: string): RealtimeSubscription[] {
    const client = this.clients.get(clientId);
    if (!client) return [];
    return Array.from(client.subscriptions.values());
  }

  /**
   * Get channel subscribers count
   */
  getChannelSubscriberCount(channel: string): number {
    return this.channelSubscribers.get(channel)?.size || 0;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get channel history
   */
  getChannelHistory(channel: string, limit: number = 50): RealtimeEvent[] {
    const history = this.eventHistory.get(channel) || [];
    return history.slice(-limit);
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(): number {
    const now = Date.now();
    let cleaned = 0;

    this.clients.forEach((client, clientId) => {
      if (now - client.lastHeartbeat.getTime() > this.connectionTimeout) {
        this.unregisterClient(clientId);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * Get server stats
   */
  getStats(): {
    connectedClients: number;
    activeChannels: number;
    totalSubscriptions: number;
    eventHistorySize: number;
  } {
    let totalSubscriptions = 0;
    this.clients.forEach((client) => {
      totalSubscriptions += client.subscriptions.size;
    });

    let eventHistorySize = 0;
    this.eventHistory.forEach((history) => {
      eventHistorySize += history.length;
    });

    return {
      connectedClients: this.clients.size,
      activeChannels: this.channelSubscribers.size,
      totalSubscriptions,
      eventHistorySize,
    };
  }

  // Private methods
  private sendToClient(clientId: string, message: RealtimeResponse): void {
    const callback = this.messageCallbacks.get(clientId);
    if (callback) {
      callback(message);
    }
  }

  private broadcastToChannel(channel: string, event: RealtimeEvent): void {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers) return;

    subscribers.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (!client) return;

      // Find matching subscriptions
      client.subscriptions.forEach((sub) => {
        if (sub.channel === channel && this.matchesSubscription(event, sub)) {
          this.sendToClient(clientId, { type: "event", channel, event });
        }
      });
    });
  }

  private matchesSubscription(
    event: RealtimeEvent,
    subscription: RealtimeSubscription
  ): boolean {
    // Check event type filter
    if (
      subscription.eventTypes.length > 0 &&
      !subscription.eventTypes.includes(event.type)
    ) {
      return false;
    }

    // Check custom filters
    if (subscription.filters) {
      const data = event.data as Record<string, unknown>;
      for (const [key, value] of Object.entries(subscription.filters)) {
        if (data[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();

// Response formatters
export function formatClientInfo(client: RealtimeClient) {
  return {
    id: client.id,
    userId: client.userId,
    organizationId: client.organizationId,
    subscriptionCount: client.subscriptions.size,
    lastHeartbeat: client.lastHeartbeat.toISOString(),
    connectedAt: client.connectedAt.toISOString(),
  };
}

export function formatSubscriptionInfo(subscription: RealtimeSubscription) {
  return {
    id: subscription.id,
    channel: subscription.channel,
    eventTypes: subscription.eventTypes,
    filters: subscription.filters,
    createdAt: subscription.createdAt.toISOString(),
  };
}

export function formatEventInfo(event: RealtimeEvent) {
  return {
    id: event.id,
    type: event.type,
    channel: event.channel,
    data: event.data,
    timestamp: event.timestamp.toISOString(),
  };
}
