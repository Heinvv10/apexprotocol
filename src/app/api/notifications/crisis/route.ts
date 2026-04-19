import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Crisis Alert System API (F130.5)
 * GET /api/notifications/crisis - Get crises, settings, dashboard
 * POST /api/notifications/crisis - Configure, acknowledge, resolve
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  crisisAlertManager,
  formatCrisisEventResponse,
  formatThresholdResponse,
  type CrisisType,
  type AlertChannel,
  type CrisisSeverity,
  type CrisisThreshold,
} from "@/lib/notifications/crisis";

const VALID_CRISIS_TYPES: CrisisType[] = [
  "sentiment_drop",
  "mention_spike",
  "score_drop",
  "negative_surge",
  "keyword_alert",
];

const VALID_ALERT_CHANNELS: AlertChannel[] = [
  "email",
  "slack",
  "whatsapp",
  "in_app",
  "webhook",
];

const VALID_SEVERITIES: CrisisSeverity[] = ["warning", "critical", "emergency"];

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
    const action = searchParams.get("action") || "active";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "active":
        return handleGetActiveCrises(brandId);

      case "history": {
        const limit = parseInt(searchParams.get("limit") || "50");
        return handleGetCrisisHistory(brandId, limit);
      }

      case "get": {
        const eventId = searchParams.get("eventId");
        if (!eventId) {
          return NextResponse.json(
            { error: "eventId is required" },
            { status: 400 }
          );
        }
        return handleGetCrisisEvent(eventId);
      }

      case "settings":
        return handleGetSettings(brandId);

      case "thresholds":
        return handleGetThresholds(brandId);

      case "dashboard":
        return handleGetDashboard(brandId);

      case "types":
        return handleGetCrisisTypes();

      case "channels":
        return handleGetAlertChannels();

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: active, history, get, settings, thresholds, dashboard, types, channels" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process crisis request",
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
      case "configureSettings":
        return handleConfigureSettings(body);

      case "addThreshold":
        return handleAddThreshold(body);

      case "updateThreshold":
        return handleUpdateThreshold(body);

      case "deleteThreshold":
        return handleDeleteThreshold(body);

      case "checkThresholds":
        return handleCheckThresholds(body);

      case "acknowledge":
        return handleAcknowledge(body, userId);

      case "completeAction":
        return handleCompleteAction(body, userId);

      case "resolve":
        return handleResolve(body, userId);

      case "markFalsePositive":
        return handleMarkFalsePositive(body, userId);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: configureSettings, addThreshold, updateThreshold, deleteThreshold, checkThresholds, acknowledge, completeAction, resolve, markFalsePositive" },
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
        error: "Crisis operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetActiveCrises(brandId: string) {
  const crises = crisisAlertManager.getActiveCrises(brandId);

  return NextResponse.json({
    success: true,
    crises: crises.map(formatCrisisEventResponse),
    count: crises.length,
  });
}

function handleGetCrisisHistory(brandId: string, limit: number) {
  const crises = crisisAlertManager.getCrisisHistory(brandId, limit);

  const stats = {
    total: crises.length,
    active: crises.filter((c) => c.status === "active").length,
    acknowledged: crises.filter((c) => c.status === "acknowledged").length,
    resolved: crises.filter((c) => c.status === "resolved").length,
    falsePositive: crises.filter((c) => c.status === "false_positive").length,
  };

  return NextResponse.json({
    success: true,
    crises: crises.map(formatCrisisEventResponse),
    stats,
  });
}

function handleGetCrisisEvent(eventId: string) {
  const event = crisisAlertManager.getEvent(eventId);

  if (!event) {
    return NextResponse.json(
      { error: "Crisis event not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    crisis: formatCrisisEventResponse(event),
  });
}

function handleGetSettings(brandId: string) {
  const settings = crisisAlertManager.getSettings(brandId);

  if (!settings) {
    return NextResponse.json({
      success: true,
      settings: null,
      message: "No crisis settings configured for this brand",
    });
  }

  return NextResponse.json({
    success: true,
    settings: {
      enabled: settings.enabled,
      thresholdCount: settings.thresholds.length,
      defaultAlertChannels: settings.defaultAlertChannels,
      escalationContactCount: settings.escalationContacts.length,
      quietHours: settings.quietHours,
    },
  });
}

function handleGetThresholds(brandId: string) {
  const settings = crisisAlertManager.getSettings(brandId);

  return NextResponse.json({
    success: true,
    thresholds: settings?.thresholds.map(formatThresholdResponse) || [],
    count: settings?.thresholds.length || 0,
  });
}

function handleGetDashboard(brandId: string) {
  const stats = crisisAlertManager.getDashboardStats(brandId);
  const activeCrises = crisisAlertManager.getActiveCrises(brandId);

  return NextResponse.json({
    success: true,
    dashboard: {
      activeCrises: activeCrises.map(formatCrisisEventResponse),
      stats,
    },
  });
}

function handleGetCrisisTypes() {
  const crisisTypes = [
    {
      type: "sentiment_drop",
      name: "Sentiment Drop",
      description: "Alert when positive sentiment drops by a configured percentage",
      configOptions: ["sentimentDropPercent", "timeframeHours"],
    },
    {
      type: "mention_spike",
      name: "Mention Spike",
      description: "Alert when mention volume increases significantly",
      configOptions: ["mentionSpikePercent", "baselinePeriodDays"],
    },
    {
      type: "score_drop",
      name: "Score Drop",
      description: "Alert when GEO score drops by configured points",
      configOptions: ["scoreDropPoints", "minimumPreviousScore"],
    },
    {
      type: "negative_surge",
      name: "Negative Surge",
      description: "Alert when negative mentions exceed threshold",
      configOptions: ["negativeCountThreshold", "negativePercentThreshold"],
    },
    {
      type: "keyword_alert",
      name: "Keyword Alert",
      description: "Alert when specific keywords are detected in mentions",
      configOptions: ["keywords", "caseSensitive"],
    },
  ];

  return NextResponse.json({
    success: true,
    crisisTypes,
  });
}

function handleGetAlertChannels() {
  const channels = [
    {
      channel: "email",
      name: "Email",
      description: "Send alert via email to escalation contacts",
      requiresConfig: false,
    },
    {
      channel: "slack",
      name: "Slack",
      description: "Send alert to configured Slack channel",
      requiresConfig: true,
    },
    {
      channel: "whatsapp",
      name: "WhatsApp",
      description: "Send alert via WhatsApp Business API",
      requiresConfig: true,
    },
    {
      channel: "in_app",
      name: "In-App",
      description: "Show notification in application dashboard",
      requiresConfig: false,
    },
    {
      channel: "webhook",
      name: "Webhook",
      description: "Send alert to configured webhook URLs",
      requiresConfig: true,
    },
  ];

  return NextResponse.json({
    success: true,
    channels,
  });
}

// POST handlers
function handleConfigureSettings(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    enabled: z.boolean().optional(),
    defaultAlertChannels: z.array(z.enum(VALID_ALERT_CHANNELS as [string, ...string[]])).optional(),
    escalationContacts: z.array(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      slackUserId: z.string().optional(),
      role: z.string().min(1),
      escalationLevel: z.number().min(1).max(5),
    })).optional(),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      timezone: z.string(),
      exceptEmergency: z.boolean(),
    }).optional(),
  });

  const data = schema.parse(body);

  const settings = crisisAlertManager.configureSettings(data.brandId, {
    enabled: data.enabled,
    defaultAlertChannels: data.defaultAlertChannels as AlertChannel[],
    escalationContacts: data.escalationContacts?.map((c, idx) => ({
      id: `contact-${idx}`,
      ...c,
    })),
    quietHours: data.quietHours,
  });

  return NextResponse.json({
    success: true,
    message: "Crisis settings configured",
    settings: {
      enabled: settings.enabled,
      defaultAlertChannels: settings.defaultAlertChannels,
      escalationContactCount: settings.escalationContacts.length,
      quietHours: settings.quietHours,
    },
  });
}

function handleAddThreshold(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    name: z.string().min(1).max(100),
    type: z.enum(VALID_CRISIS_TYPES as [string, ...string[]]),
    config: z.object({
      sentimentDropPercent: z.number().min(1).max(100).optional(),
      timeframeHours: z.number().min(1).max(168).optional(),
      mentionSpikePercent: z.number().min(50).max(1000).optional(),
      baselinePeriodDays: z.number().min(1).max(30).optional(),
      scoreDropPoints: z.number().min(1).max(50).optional(),
      minimumPreviousScore: z.number().min(0).max(100).optional(),
      negativeCountThreshold: z.number().min(1).max(100).optional(),
      negativePercentThreshold: z.number().min(1).max(100).optional(),
      keywords: z.array(z.string()).optional(),
      caseSensitive: z.boolean().optional(),
    }),
    alertChannels: z.array(z.enum(VALID_ALERT_CHANNELS as [string, ...string[]])).optional(),
    cooldownMinutes: z.number().min(5).max(1440).optional(),
  });

  const data = schema.parse(body);

  const threshold = crisisAlertManager.addThreshold(data.brandId, {
    name: data.name,
    type: data.type as CrisisType,
    config: data.config,
    alertChannels: data.alertChannels as AlertChannel[],
    cooldownMinutes: data.cooldownMinutes,
  });

  return NextResponse.json({
    success: true,
    message: "Threshold added successfully",
    threshold: formatThresholdResponse(threshold),
  });
}

function handleUpdateThreshold(body: unknown) {
  const schema = z.object({
    thresholdId: z.string().min(1),
    name: z.string().min(1).max(100).optional(),
    enabled: z.boolean().optional(),
    config: z.object({
      sentimentDropPercent: z.number().min(1).max(100).optional(),
      timeframeHours: z.number().min(1).max(168).optional(),
      mentionSpikePercent: z.number().min(50).max(1000).optional(),
      baselinePeriodDays: z.number().min(1).max(30).optional(),
      scoreDropPoints: z.number().min(1).max(50).optional(),
      minimumPreviousScore: z.number().min(0).max(100).optional(),
      negativeCountThreshold: z.number().min(1).max(100).optional(),
      negativePercentThreshold: z.number().min(1).max(100).optional(),
      keywords: z.array(z.string()).optional(),
      caseSensitive: z.boolean().optional(),
    }).optional(),
    alertChannels: z.array(z.enum(VALID_ALERT_CHANNELS as [string, ...string[]])).optional(),
    cooldownMinutes: z.number().min(5).max(1440).optional(),
  });

  const { thresholdId, ...updates } = schema.parse(body);

  const threshold = crisisAlertManager.updateThreshold(
    thresholdId,
    updates as Partial<Omit<CrisisThreshold, "id" | "brandId" | "createdAt">>
  );

  if (!threshold) {
    return NextResponse.json(
      { error: "Threshold not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Threshold updated successfully",
    threshold: formatThresholdResponse(threshold),
  });
}

function handleDeleteThreshold(body: unknown) {
  const schema = z.object({
    thresholdId: z.string().min(1),
  });

  const { thresholdId } = schema.parse(body);

  const deleted = crisisAlertManager.deleteThreshold(thresholdId);

  if (!deleted) {
    return NextResponse.json(
      { error: "Threshold not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Threshold deleted",
  });
}

async function handleCheckThresholds(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    metrics: z.object({
      currentSentiment: z.number().optional(),
      previousSentiment: z.number().optional(),
      currentMentions: z.number().optional(),
      baselineMentions: z.number().optional(),
      currentScore: z.number().optional(),
      previousScore: z.number().optional(),
      negativeMentions: z.number().optional(),
      totalMentions: z.number().optional(),
      mentionContent: z.array(z.string()).optional(),
      platforms: z.array(z.string()).optional(),
    }),
  });

  const data = schema.parse(body);

  const events = await crisisAlertManager.checkThresholds(data.brandId, data.metrics);

  return NextResponse.json({
    success: true,
    triggered: events.length > 0,
    crises: events.map(formatCrisisEventResponse),
  });
}

function handleAcknowledge(body: unknown, userId: string) {
  const schema = z.object({
    eventId: z.string().min(1),
  });

  const { eventId } = schema.parse(body);

  const event = crisisAlertManager.acknowledgeCrisis(eventId, userId);

  if (!event) {
    return NextResponse.json(
      { error: "Crisis not found or already acknowledged" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Crisis acknowledged",
    crisis: formatCrisisEventResponse(event),
  });
}

function handleCompleteAction(body: unknown, userId: string) {
  const schema = z.object({
    eventId: z.string().min(1),
    actionId: z.string().min(1),
  });

  const { eventId, actionId } = schema.parse(body);

  const event = crisisAlertManager.completeAction(eventId, actionId, userId);

  if (!event) {
    return NextResponse.json(
      { error: "Crisis or action not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Action marked as completed",
    crisis: formatCrisisEventResponse(event),
  });
}

function handleResolve(body: unknown, userId: string) {
  const schema = z.object({
    eventId: z.string().min(1),
    resolution: z.string().optional(),
  });

  const { eventId, resolution } = schema.parse(body);

  const event = crisisAlertManager.resolveCrisis(eventId, userId, resolution);

  if (!event) {
    return NextResponse.json(
      { error: "Crisis not found or already resolved" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Crisis resolved",
    crisis: formatCrisisEventResponse(event),
  });
}

function handleMarkFalsePositive(body: unknown, userId: string) {
  const schema = z.object({
    eventId: z.string().min(1),
    reason: z.string().optional(),
  });

  const { eventId, reason } = schema.parse(body);

  const event = crisisAlertManager.markFalsePositive(eventId, userId, reason);

  if (!event) {
    return NextResponse.json(
      { error: "Crisis not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Crisis marked as false positive",
    crisis: formatCrisisEventResponse(event),
  });
}
