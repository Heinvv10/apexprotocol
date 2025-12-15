/**
 * WhatsApp Notifications API (F131)
 * GET /api/notifications/whatsapp - Get status, recipients, messages
 * POST /api/notifications/whatsapp - Configure, add recipients, send messages
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  whatsappManager,
  formatRecipientResponse,
  formatMessageResponse,
  type WhatsAppProvider,
  type WhatsAppNotificationType,
} from "@/lib/notifications/whatsapp";

const VALID_PROVIDERS: WhatsAppProvider[] = ["meta", "twilio", "messagebird"];

const VALID_NOTIFICATION_TYPES: WhatsAppNotificationType[] = [
  "crisis_alert",
  "weekly_report",
  "daily_summary",
  "score_alert",
  "mention_alert",
];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";
    const brandId = searchParams.get("brandId");

    switch (action) {
      case "status":
        return handleGetStatus();

      case "recipients": {
        if (!brandId) {
          return NextResponse.json(
            { error: "brandId is required" },
            { status: 400 }
          );
        }
        return handleGetRecipients(brandId);
      }

      case "messages": {
        const recipientId = searchParams.get("recipientId");
        const limit = parseInt(searchParams.get("limit") || "50");
        return handleGetMessages(recipientId || undefined, limit);
      }

      case "notificationTypes":
        return handleGetNotificationTypes();

      case "providers":
        return handleGetProviders();

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, recipients, messages, notificationTypes, providers" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process WhatsApp request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "configure":
        return handleConfigure(body);

      case "addRecipient":
        return handleAddRecipient(body);

      case "updateRecipient":
        return handleUpdateRecipient(body);

      case "deleteRecipient":
        return handleDeleteRecipient(body);

      case "optIn":
        return handleOptIn(body);

      case "optOut":
        return handleOptOut(body);

      case "sendTest":
        return handleSendTest(body);

      case "sendCrisisAlert":
        return handleSendCrisisAlert(body);

      case "sendWeeklyReport":
        return handleSendWeeklyReport(body);

      case "sendScoreAlert":
        return handleSendScoreAlert(body);

      case "webhookStatus":
        return handleWebhookStatus(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: configure, addRecipient, updateRecipient, deleteRecipient, optIn, optOut, sendTest, sendCrisisAlert, sendWeeklyReport, sendScoreAlert, webhookStatus" },
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
        error: "WhatsApp operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus() {
  const status = whatsappManager.getStatus();

  return NextResponse.json({
    success: true,
    status,
  });
}

function handleGetRecipients(brandId: string) {
  const recipients = whatsappManager.getRecipients(brandId);

  return NextResponse.json({
    success: true,
    recipients: recipients.map(formatRecipientResponse),
    count: recipients.length,
    optedInCount: recipients.filter((r) => r.optedIn).length,
  });
}

function handleGetMessages(recipientId: string | undefined, limit: number) {
  const messages = whatsappManager.getMessageHistory(recipientId, limit);

  const stats = {
    total: messages.length,
    sent: messages.filter((m) => m.status === "sent").length,
    delivered: messages.filter((m) => m.status === "delivered").length,
    read: messages.filter((m) => m.status === "read").length,
    failed: messages.filter((m) => m.status === "failed").length,
  };

  return NextResponse.json({
    success: true,
    messages: messages.map(formatMessageResponse),
    stats,
  });
}

function handleGetNotificationTypes() {
  const types = [
    {
      type: "crisis_alert",
      name: "Crisis Alert",
      description: "Immediate alerts for detected crises",
      priority: "high",
    },
    {
      type: "weekly_report",
      name: "Weekly Report",
      description: "Weekly performance summary",
      priority: "low",
    },
    {
      type: "daily_summary",
      name: "Daily Summary",
      description: "Daily metrics summary",
      priority: "low",
    },
    {
      type: "score_alert",
      name: "Score Alert",
      description: "Alert when GEO score changes significantly",
      priority: "medium",
    },
    {
      type: "mention_alert",
      name: "Mention Alert",
      description: "Alert for important mentions",
      priority: "medium",
    },
  ];

  return NextResponse.json({
    success: true,
    notificationTypes: types,
  });
}

function handleGetProviders() {
  const providers = [
    {
      provider: "meta",
      name: "Meta WhatsApp Business API",
      description: "Official Meta Cloud API for WhatsApp",
      setupUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    },
    {
      provider: "twilio",
      name: "Twilio WhatsApp",
      description: "Twilio's WhatsApp Business API",
      setupUrl: "https://www.twilio.com/whatsapp",
    },
    {
      provider: "messagebird",
      name: "MessageBird",
      description: "MessageBird WhatsApp integration",
      setupUrl: "https://messagebird.com/whatsapp",
    },
  ];

  return NextResponse.json({
    success: true,
    providers,
  });
}

// POST handlers
function handleConfigure(body: unknown) {
  const schema = z.object({
    provider: z.enum(VALID_PROVIDERS as [string, ...string[]]),
    apiKey: z.string().min(1),
    phoneNumberId: z.string().min(1),
    businessAccountId: z.string().min(1),
    webhookVerifyToken: z.string().optional(),
  });

  const data = schema.parse(body);

  whatsappManager.configure({
    provider: data.provider as WhatsAppProvider,
    apiKey: data.apiKey,
    phoneNumberId: data.phoneNumberId,
    businessAccountId: data.businessAccountId,
    webhookVerifyToken: data.webhookVerifyToken,
  });

  return NextResponse.json({
    success: true,
    message: `WhatsApp configured with ${data.provider}`,
    status: whatsappManager.getStatus(),
  });
}

function handleAddRecipient(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    name: z.string().min(1).max(100),
    phoneNumber: z.string().min(10).max(20),
    notificationTypes: z.array(z.enum(VALID_NOTIFICATION_TYPES as [string, ...string[]])).optional(),
  });

  const data = schema.parse(body);

  const recipient = whatsappManager.addRecipient(data.brandId, {
    name: data.name,
    phoneNumber: data.phoneNumber,
    notificationTypes: data.notificationTypes as WhatsAppNotificationType[],
  });

  return NextResponse.json({
    success: true,
    message: "Recipient added successfully",
    recipient: formatRecipientResponse(recipient),
  });
}

function handleUpdateRecipient(body: unknown) {
  const schema = z.object({
    recipientId: z.string().min(1),
    name: z.string().min(1).max(100).optional(),
    notificationTypes: z.array(z.enum(VALID_NOTIFICATION_TYPES as [string, ...string[]])).optional(),
  });

  const { recipientId, ...updates } = schema.parse(body);

  const recipient = whatsappManager.updateRecipient(recipientId, updates as any);

  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Recipient updated",
    recipient: formatRecipientResponse(recipient),
  });
}

function handleDeleteRecipient(body: unknown) {
  const schema = z.object({
    recipientId: z.string().min(1),
  });

  const { recipientId } = schema.parse(body);

  const deleted = whatsappManager.deleteRecipient(recipientId);

  if (!deleted) {
    return NextResponse.json(
      { error: "Recipient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Recipient deleted",
  });
}

function handleOptIn(body: unknown) {
  const schema = z.object({
    recipientId: z.string().min(1),
  });

  const { recipientId } = schema.parse(body);

  const recipient = whatsappManager.recordOptIn(recipientId);

  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Recipient opted in",
    recipient: formatRecipientResponse(recipient),
  });
}

function handleOptOut(body: unknown) {
  const schema = z.object({
    recipientId: z.string().min(1),
  });

  const { recipientId } = schema.parse(body);

  const recipient = whatsappManager.recordOptOut(recipientId);

  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Recipient opted out",
    recipient: formatRecipientResponse(recipient),
  });
}

async function handleSendTest(body: unknown) {
  const schema = z.object({
    recipientId: z.string().min(1),
  });

  const { recipientId } = schema.parse(body);

  try {
    const message = await whatsappManager.sendTestMessage(recipientId);

    return NextResponse.json({
      success: message.status !== "failed",
      message: message.status !== "failed"
        ? "Test message sent"
        : "Failed to send test message",
      details: formatMessageResponse(message),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send test message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

async function handleSendCrisisAlert(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    brandName: z.string().min(1),
    alertType: z.string().min(1),
    severity: z.string().min(1),
    description: z.string().min(1),
    dashboardUrl: z.string().url().optional(),
  });

  const data = schema.parse(body);

  const messages = await whatsappManager.sendCrisisAlert(data.brandId, {
    brandName: data.brandName,
    alertType: data.alertType,
    severity: data.severity,
    description: data.description,
    dashboardUrl: data.dashboardUrl,
  });

  return NextResponse.json({
    success: true,
    message: `Crisis alert sent to ${messages.length} recipients`,
    sentCount: messages.filter((m) => m.status !== "failed").length,
    failedCount: messages.filter((m) => m.status === "failed").length,
  });
}

async function handleSendWeeklyReport(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    brandName: z.string().min(1),
    period: z.string().min(1),
    score: z.number().min(0).max(100),
    scoreChange: z.string(),
    totalMentions: z.number().min(0),
    sentiment: z.number().min(0).max(100),
    highlights: z.array(z.string()),
    reportUrl: z.string().url().optional(),
  });

  const data = schema.parse(body);

  const messages = await whatsappManager.sendWeeklyReport(data.brandId, data);

  return NextResponse.json({
    success: true,
    message: `Weekly report sent to ${messages.length} recipients`,
    sentCount: messages.filter((m) => m.status !== "failed").length,
    failedCount: messages.filter((m) => m.status === "failed").length,
  });
}

async function handleSendScoreAlert(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    brandName: z.string().min(1),
    previousScore: z.number().min(0).max(100),
    currentScore: z.number().min(0).max(100),
    description: z.string().min(1),
    dashboardUrl: z.string().url().optional(),
  });

  const data = schema.parse(body);

  const messages = await whatsappManager.sendScoreAlert(data.brandId, data);

  return NextResponse.json({
    success: true,
    message: `Score alert sent to ${messages.length} recipients`,
    sentCount: messages.filter((m) => m.status !== "failed").length,
    failedCount: messages.filter((m) => m.status === "failed").length,
  });
}

function handleWebhookStatus(body: unknown) {
  const schema = z.object({
    externalId: z.string().min(1),
    status: z.enum(["delivered", "read", "failed"]),
    error: z.string().optional(),
  });

  const data = schema.parse(body);

  const message = whatsappManager.updateMessageStatus(
    data.externalId,
    data.status,
    data.error
  );

  if (!message) {
    return NextResponse.json(
      { error: "Message not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Status updated",
    details: formatMessageResponse(message),
  });
}
