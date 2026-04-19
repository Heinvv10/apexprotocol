import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Slack Integration API (F120-F121)
 * GET /api/integrations/slack - Get connection status, channels
 * POST /api/integrations/slack - OAuth flow, send messages
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  slackManager,
  formatSlackConnectionResponse,
  formatSlackMessageResponse,
  type SlackBlock,
} from "@/lib/integrations/slack";

// Request schemas
const sendMessageSchema = z.object({
  text: z.string().min(1),
  blocks: z.array(z.record(z.string(), z.unknown())).optional(),
  threadTs: z.string().optional(),
  unfurlLinks: z.boolean().optional(),
  unfurlMedia: z.boolean().optional(),
});

const recommendationNotificationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: z.string(),
  category: z.string(),
  url: z.string().url().optional(),
});

const scoreUpdateSchema = z.object({
  previousScore: z.number().min(0).max(100),
  currentScore: z.number().min(0).max(100),
  change: z.number(),
  url: z.string().url().optional(),
});

const weeklySummarySchema = z.object({
  geoScore: z.number(),
  geoChange: z.number(),
  completedRecommendations: z.number(),
  pendingRecommendations: z.number(),
  mentionsChange: z.number(),
  topPlatform: z.string(),
  url: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const action = searchParams.get("action") || "status";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "status":
        return handleGetStatus(brandId);

      case "channels":
        return handleGetChannels(brandId);

      case "messages":
        return handleGetMessages(brandId);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, channels, messages, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process Slack request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "callback":
        return handleOAuthCallback(body);

      case "selectChannel":
        return handleSelectChannel(body);

      case "sendMessage":
        return handleSendMessage(body);

      case "sendRecommendation":
        return handleSendRecommendation(body);

      case "sendScoreUpdate":
        return handleSendScoreUpdate(body);

      case "sendWeeklySummary":
        return handleSendWeeklySummary(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, selectChannel, sendMessage, sendRecommendation, sendScoreUpdate, sendWeeklySummary, disconnect" },
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
        error: "Slack operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = slackManager.getConnection(brandId);

  if (!connection) {
    return NextResponse.json({
      success: true,
      connected: false,
      connection: null,
    });
  }

  return NextResponse.json({
    success: true,
    connected: true,
    connection: formatSlackConnectionResponse(connection),
  });
}

async function handleGetChannels(brandId: string) {
  const channels = await slackManager.getChannels(brandId);

  return NextResponse.json({
    success: true,
    channels: channels.map((c) => ({
      id: c.id,
      name: c.name,
      isPrivate: c.isPrivate,
      isMember: c.isMember,
      numMembers: c.numMembers,
    })),
  });
}

function handleGetMessages(brandId: string) {
  const messages = slackManager.getSentMessages(brandId);

  return NextResponse.json({
    success: true,
    count: messages.length,
    messages: messages.slice(0, 50).map(formatSlackMessageResponse),
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = slackManager.getAuthorizationUrl(brandId, state);

  return NextResponse.json({
    success: true,
    authUrl,
    state,
  });
}

// POST handlers
async function handleOAuthCallback(body: unknown) {
  const schema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
  });

  const { code, state } = schema.parse(body);
  const [brandId] = state.split(":");

  if (!brandId) {
    return NextResponse.json(
      { error: "Invalid state parameter" },
      { status: 400 }
    );
  }

  // Exchange code for token
  const tokenData = await slackManager.exchangeCodeForToken(code);

  // Create connection
  const connection = slackManager.createConnection(
    brandId,
    tokenData.accessToken,
    tokenData.teamId,
    tokenData.teamName,
    tokenData.botUserId,
    tokenData.scope
  );

  return NextResponse.json({
    success: true,
    message: "Slack connected successfully",
    connection: formatSlackConnectionResponse(connection),
  });
}

async function handleSelectChannel(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    channelId: z.string().min(1),
    channelName: z.string().min(1),
  });

  const { brandId, channelId, channelName } = schema.parse(body);

  const connection = slackManager.selectChannel(brandId, channelId, channelName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Slack connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Channel selected",
    connection: formatSlackConnectionResponse(connection),
  });
}

async function handleSendMessage(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    message: sendMessageSchema,
  });

  const { brandId, message } = schema.parse(body);

  const sent = await slackManager.sendMessage(brandId, {
    text: message.text,
    blocks: message.blocks as SlackBlock[] | undefined,
    threadTs: message.threadTs,
    unfurlLinks: message.unfurlLinks,
    unfurlMedia: message.unfurlMedia,
  });

  return NextResponse.json({
    success: true,
    message: "Message sent",
    sent: formatSlackMessageResponse(sent),
  });
}

async function handleSendRecommendation(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    recommendation: recommendationNotificationSchema,
  });

  const { brandId, recommendation } = schema.parse(body);

  const sent = await slackManager.sendRecommendationNotification(brandId, recommendation);

  return NextResponse.json({
    success: true,
    message: "Recommendation notification sent",
    sent: formatSlackMessageResponse(sent),
  });
}

async function handleSendScoreUpdate(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    update: scoreUpdateSchema,
  });

  const { brandId, update } = schema.parse(body);

  const sent = await slackManager.sendScoreUpdate(brandId, update);

  return NextResponse.json({
    success: true,
    message: "Score update sent",
    sent: formatSlackMessageResponse(sent),
  });
}

async function handleSendWeeklySummary(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    summary: weeklySummarySchema,
  });

  const { brandId, summary } = schema.parse(body);

  const sent = await slackManager.sendWeeklySummary(brandId, summary);

  return NextResponse.json({
    success: true,
    message: "Weekly summary sent",
    sent: formatSlackMessageResponse(sent),
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = slackManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No Slack connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Slack disconnected",
  });
}
