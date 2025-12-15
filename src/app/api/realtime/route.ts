/**
 * Real-time WebSocket API (F138)
 * GET /api/realtime - Get connection info and stats
 * POST /api/realtime - Handle messages, simulate events for testing
 *
 * Note: Actual WebSocket connections handled via Socket.IO or similar
 * This endpoint provides REST API for WebSocket management
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  webSocketManager,
  formatClientInfo,
  formatSubscriptionInfo,
  formatEventInfo,
  CHANNEL_PATTERNS,
  type RealtimeEventType,
} from "@/lib/realtime/websocket";
import { v4 as uuidv4 } from "uuid";

const VALID_EVENT_TYPES: RealtimeEventType[] = [
  "mention.created",
  "mention.updated",
  "recommendation.created",
  "recommendation.updated",
  "recommendation.completed",
  "geo_score.updated",
  "audit.started",
  "audit.progress",
  "audit.completed",
  "crisis.detected",
  "crisis.resolved",
  "notification",
];

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "stats";

    switch (action) {
      case "stats":
        return handleGetStats();

      case "client": {
        const clientId = searchParams.get("clientId");
        if (!clientId) {
          return NextResponse.json(
            { error: "clientId is required" },
            { status: 400 }
          );
        }
        return handleGetClient(clientId);
      }

      case "subscriptions": {
        const clientId = searchParams.get("clientId");
        if (!clientId) {
          return NextResponse.json(
            { error: "clientId is required" },
            { status: 400 }
          );
        }
        return handleGetSubscriptions(clientId);
      }

      case "history": {
        const channel = searchParams.get("channel");
        const limit = parseInt(searchParams.get("limit") || "50");
        if (!channel) {
          return NextResponse.json(
            { error: "channel is required" },
            { status: 400 }
          );
        }
        return handleGetHistory(channel, limit);
      }

      case "channels":
        return handleGetChannels();

      case "connectionInfo":
        return handleGetConnectionInfo(userId, orgId || userId);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: stats, client, subscriptions, history, channels, connectionInfo" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process realtime request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizationId = orgId || userId;
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "connect":
        return handleConnect(userId, organizationId, body);

      case "disconnect":
        return handleDisconnect(body);

      case "subscribe":
        return handleSubscribe(body);

      case "unsubscribe":
        return handleUnsubscribe(body);

      case "publish":
        return handlePublish(body);

      case "publishMention":
        return handlePublishMention(body);

      case "publishRecommendation":
        return handlePublishRecommendation(body);

      case "publishGeoScore":
        return handlePublishGeoScore(body);

      case "publishNotification":
        return handlePublishNotification(body);

      case "cleanup":
        return handleCleanup();

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: connect, disconnect, subscribe, unsubscribe, publish, publishMention, publishRecommendation, publishGeoScore, publishNotification, cleanup" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Realtime operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStats() {
  const stats = webSocketManager.getStats();

  return NextResponse.json({
    success: true,
    stats,
    timestamp: new Date().toISOString(),
  });
}

function handleGetClient(clientId: string) {
  const client = webSocketManager.getClient(clientId);

  if (!client) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    client: formatClientInfo(client),
  });
}

function handleGetSubscriptions(clientId: string) {
  const subscriptions = webSocketManager.getClientSubscriptions(clientId);

  return NextResponse.json({
    success: true,
    subscriptions: subscriptions.map(formatSubscriptionInfo),
    count: subscriptions.length,
  });
}

function handleGetHistory(channel: string, limit: number) {
  const history = webSocketManager.getChannelHistory(channel, limit);

  return NextResponse.json({
    success: true,
    channel,
    events: history.map(formatEventInfo),
    count: history.length,
  });
}

function handleGetChannels() {
  const channelPatterns = {
    brandMentions: "brand:{brandId}:mentions",
    brandRecommendations: "brand:{brandId}:recommendations",
    brandGeoScore: "brand:{brandId}:geo_score",
    brandAudits: "brand:{brandId}:audits",
    brandCrisis: "brand:{brandId}:crisis",
    orgNotifications: "org:{orgId}:notifications",
    orgActivity: "org:{orgId}:activity",
    userNotifications: "user:{userId}:notifications",
    systemStatus: "system:status",
    systemMaintenance: "system:maintenance",
  };

  return NextResponse.json({
    success: true,
    channelPatterns,
    eventTypes: VALID_EVENT_TYPES,
  });
}

function handleGetConnectionInfo(userId: string, organizationId: string) {
  // In production, this would return WebSocket connection details
  const connectionInfo = {
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || "wss://api.apex.dev/ws",
    protocols: ["graphql-ws", "subscriptions-transport-ws"],
    reconnectInterval: 5000,
    heartbeatInterval: 30000,
    suggestedChannels: [
      CHANNEL_PATTERNS.orgNotifications(organizationId),
      CHANNEL_PATTERNS.userNotifications(userId),
    ],
  };

  return NextResponse.json({
    success: true,
    connectionInfo,
    userId,
    organizationId,
  });
}

// POST handlers
function handleConnect(userId: string, organizationId: string, body: unknown) {
  const schema = z.object({
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const data = schema.parse(body);
  const clientId = `client_${uuidv4()}`;

  // For REST API, we simulate the connection
  // In production, this would be handled by actual WebSocket server
  const messages: unknown[] = [];
  const messageCallback = (message: unknown) => messages.push(message);

  const client = webSocketManager.registerClient(
    clientId,
    userId,
    organizationId,
    messageCallback,
    data.metadata
  );

  return NextResponse.json({
    success: true,
    clientId: client.id,
    connectedAt: client.connectedAt.toISOString(),
    message: "Client registered. Use WebSocket for real-time updates.",
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || "wss://api.apex.dev/ws",
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    clientId: z.string().min(1),
  });

  const { clientId } = schema.parse(body);

  webSocketManager.unregisterClient(clientId);

  return NextResponse.json({
    success: true,
    message: "Client disconnected",
  });
}

function handleSubscribe(body: unknown) {
  const schema = z.object({
    clientId: z.string().min(1),
    channel: z.string().min(1),
    eventTypes: z.array(z.enum(VALID_EVENT_TYPES as [string, ...string[]])).optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
  });

  const data = schema.parse(body);

  const subscription = webSocketManager.subscribe(
    data.clientId,
    data.channel,
    data.eventTypes as RealtimeEventType[] | undefined,
    data.filters
  );

  if (!subscription) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    subscription: formatSubscriptionInfo(subscription),
  });
}

function handleUnsubscribe(body: unknown) {
  const schema = z.object({
    clientId: z.string().min(1),
    subscriptionId: z.string().min(1),
  });

  const data = schema.parse(body);

  const success = webSocketManager.unsubscribe(data.clientId, data.subscriptionId);

  if (!success) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Unsubscribed",
  });
}

function handlePublish(body: unknown) {
  const schema = z.object({
    channel: z.string().min(1),
    eventType: z.enum(VALID_EVENT_TYPES as [string, ...string[]]),
    data: z.unknown(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const data = schema.parse(body);

  const event = webSocketManager.publish(
    data.channel,
    data.eventType as RealtimeEventType,
    data.data,
    data.metadata
  );

  return NextResponse.json({
    success: true,
    event: formatEventInfo(event),
    subscriberCount: webSocketManager.getChannelSubscriberCount(data.channel),
  });
}

function handlePublishMention(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    eventType: z.enum(["mention.created", "mention.updated"]),
    mention: z.object({
      id: z.string(),
      platform: z.string(),
      query: z.string(),
      response: z.string(),
      sentiment: z.string(),
      sentimentScore: z.number(),
    }),
  });

  const data = schema.parse(body);

  webSocketManager.publishMention(
    data.brandId,
    data.eventType,
    data.mention
  );

  return NextResponse.json({
    success: true,
    message: `Mention event published to brand ${data.brandId}`,
    channel: CHANNEL_PATTERNS.brandMentions(data.brandId),
  });
}

function handlePublishRecommendation(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    eventType: z.enum(["recommendation.created", "recommendation.updated", "recommendation.completed"]),
    recommendation: z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      priority: z.string(),
      status: z.string(),
    }),
  });

  const data = schema.parse(body);

  webSocketManager.publishRecommendation(
    data.brandId,
    data.eventType,
    data.recommendation
  );

  return NextResponse.json({
    success: true,
    message: `Recommendation event published to brand ${data.brandId}`,
    channel: CHANNEL_PATTERNS.brandRecommendations(data.brandId),
  });
}

function handlePublishGeoScore(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    score: z.object({
      overallScore: z.number(),
      visibilityScore: z.number(),
      sentimentScore: z.number(),
      recommendationScore: z.number(),
      previousScore: z.number().optional(),
      trend: z.number(),
    }),
  });

  const data = schema.parse(body);

  webSocketManager.publishGeoScoreUpdate(data.brandId, data.score);

  return NextResponse.json({
    success: true,
    message: `GEO score update published to brand ${data.brandId}`,
    channel: CHANNEL_PATTERNS.brandGeoScore(data.brandId),
  });
}

function handlePublishNotification(body: unknown) {
  const schema = z.object({
    target: z.enum(["user", "org"]),
    targetId: z.string().min(1),
    notification: z.object({
      title: z.string().min(1),
      message: z.string().min(1),
      type: z.enum(["info", "success", "warning", "error"]),
      action: z.object({
        label: z.string(),
        url: z.string(),
      }).optional(),
    }),
  });

  const data = schema.parse(body);

  if (data.target === "user") {
    webSocketManager.publishUserNotification(data.targetId, data.notification);
  } else {
    webSocketManager.publishOrgNotification(data.targetId, data.notification);
  }

  return NextResponse.json({
    success: true,
    message: `Notification published to ${data.target} ${data.targetId}`,
    channel:
      data.target === "user"
        ? CHANNEL_PATTERNS.userNotifications(data.targetId)
        : CHANNEL_PATTERNS.orgNotifications(data.targetId),
  });
}

function handleCleanup() {
  const cleanedCount = webSocketManager.cleanupStaleConnections();

  return NextResponse.json({
    success: true,
    cleanedConnections: cleanedCount,
    stats: webSocketManager.getStats(),
  });
}
