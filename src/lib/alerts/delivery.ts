/**
 * Alert Delivery Service
 * 
 * Handles sending notifications to various channels:
 * - In-app notifications
 * - Email
 * - Slack
 * - Webhooks
 * - WhatsApp (future)
 * - SMS (future)
 */

import { db } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";
import { AlertData, ChannelConfig, alertChannels } from "@/lib/db/schema/alert-rules";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Notification priority colors
const PRIORITY_COLORS = {
  low: "#6b7280",      // gray
  medium: "#3b82f6",   // blue
  high: "#f59e0b",     // amber
  critical: "#ef4444", // red
};

const PRIORITY_EMOJI = {
  low: "ℹ️",
  medium: "⚡",
  high: "⚠️",
  critical: "🚨",
};

export interface SendAlertParams {
  historyId: string;
  channelType:
    | "email"
    | "slack"
    | "teams"
    | "whatsapp"
    | "webhook"
    | "in_app"
    | "sms";
  channelConfig?: ChannelConfig;
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  data: AlertData;
  organizationId: string;
}

/**
 * Route notification to appropriate channel handler
 */
export async function sendAlertNotification(params: SendAlertParams): Promise<void> {
  const { channelType } = params;

  switch (channelType) {
    case "in_app":
      await sendInAppNotification(params);
      break;
    case "email":
      await sendEmailNotification(params);
      break;
    case "slack":
      await sendSlackNotification(params);
      break;
    case "teams":
      await sendTeamsNotification(params);
      break;
    case "webhook":
      await sendWebhookNotification(params);
      break;
    case "whatsapp":
      await sendWhatsAppNotification(params);
      break;
    case "sms":
      await sendSMSNotification(params);
      break;
    default:
      console.warn(`[AlertDelivery] Unknown channel type: ${channelType}`);
  }

  // Update channel stats - scope to specific channel, not all org channels
  if (params.channelConfig && params.historyId) {
    // Find the channel by its config to update the specific one
    const channelId = (params.channelConfig as { id?: string }).id;
    if (channelId) {
      await db
        .update(alertChannels)
        .set({
          messagesSent: sql`${alertChannels.messagesSent} + 1`,
          lastUsedAt: new Date(),
          lastError: null,
        })
        .where(eq(alertChannels.id, channelId));
    }
  }
}

/**
 * Send in-app notification (stored in database)
 */
async function sendInAppNotification(params: SendAlertParams): Promise<void> {
  const { title, message, priority, data, organizationId } = params;

  // Insert into notifications table
  await db.execute(sql`
    INSERT INTO notifications (id, organization_id, type, title, message, data, action_url, is_read, created_at)
    VALUES (
      ${createId()},
      ${organizationId},
      ${'alert'},
      ${title},
      ${message},
      ${JSON.stringify(data)}::jsonb,
      ${data.brandId ? `/dashboard/brands/${data.brandId}` : '/dashboard'},
      FALSE,
      NOW()
    )
  `);

  logger.info(`[AlertDelivery] In-app notification created for org ${organizationId}`);
}

/**
 * Send email notification
 */
async function sendEmailNotification(params: SendAlertParams): Promise<void> {
  const { title, message, priority, data, channelConfig } = params;

  if (!channelConfig?.email) {
    throw new Error("Email address not configured");
  }

  // Use Resend or SendGrid (configure based on env)
  const emailProvider = process.env.EMAIL_PROVIDER || "resend";

  if (emailProvider === "resend" && process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Apex Alerts <alerts@apexgeo.ai>",
        to: channelConfig.email,
        subject: `${PRIORITY_EMOJI[priority]} ${title}`,
        html: generateEmailHTML(title, message, priority, data),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Email send failed: ${error}`);
    }

    logger.info(`[AlertDelivery] Email sent to ${channelConfig.email}`);
  } else {
    console.warn("[AlertDelivery] Email provider not configured, skipping email");
  }
}

/**
 * Send Microsoft Teams notification (Adaptive Card via incoming webhook).
 */
async function sendTeamsNotification(params: SendAlertParams): Promise<void> {
  const { title, message, priority, data, channelConfig } = params;

  if (!channelConfig?.teams?.webhookUrl) {
    throw new Error("Teams webhook URL not configured");
  }

  const color = PRIORITY_COLORS[priority];

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            {
              type: "Container",
              style: priority === "critical" ? "attention" : undefined,
              items: [
                {
                  type: "TextBlock",
                  size: "large",
                  weight: "bolder",
                  text: `${PRIORITY_EMOJI[priority]} ${title}`,
                  color:
                    priority === "critical"
                      ? "attention"
                      : priority === "high"
                        ? "warning"
                        : "default",
                },
              ],
            },
            {
              type: "TextBlock",
              wrap: true,
              text: message,
            },
            {
              type: "FactSet",
              facts: [
                { title: "Platform", value: data.platform ?? "N/A" },
                { title: "Brand", value: data.brandName ?? "N/A" },
                { title: "Priority", value: priority.toUpperCase() },
              ],
            },
          ],
          msteams: { width: "Full" },
        },
      },
    ],
    themeColor: color.replace("#", ""),
  };

  const response = await fetch(channelConfig.teams.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!response.ok) {
    throw new Error(
      `Teams webhook failed: ${response.status} ${response.statusText}`,
    );
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(params: SendAlertParams): Promise<void> {
  const { title, message, priority, data, channelConfig } = params;

  if (!channelConfig?.slack?.webhookUrl) {
    throw new Error("Slack webhook URL not configured");
  }

  const color = PRIORITY_COLORS[priority];

  const payload = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${PRIORITY_EMOJI[priority]} ${title}`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: message,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Platform:* ${data.platform || "N/A"} | *Brand:* ${data.brandName || "N/A"} | *Priority:* ${priority.toUpperCase()}`,
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(channelConfig.slack.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }

  logger.info(`[AlertDelivery] Slack notification sent`);
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(params: SendAlertParams): Promise<void> {
  const { title, message, priority, data, channelConfig, historyId } = params;

  if (!channelConfig?.webhook?.url) {
    throw new Error("Webhook URL not configured");
  }

  const payload = {
    id: historyId,
    timestamp: new Date().toISOString(),
    type: "alert",
    priority,
    title,
    message,
    data,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Apex-Alerts/1.0",
    ...(channelConfig.webhook.headers ?? {}),
  };

  // Add signature if secret configured
  if (channelConfig.webhook.secret) {
    const crypto = await import("crypto");
    const signature = crypto
      .createHmac("sha256", channelConfig.webhook.secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    headers["X-Apex-Signature"] = signature;
  }

  const response = await fetch(channelConfig.webhook.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }

  logger.info(`[AlertDelivery] Webhook sent to ${channelConfig.webhook.url}`);
}

// Fail loud: do not let dispatched WhatsApp/SMS alerts silently no-op. The channel
// creation API rejects these types; this throw is a defence in depth for any records
// that may already exist in older organizations.
async function sendWhatsAppNotification(_params: SendAlertParams): Promise<void> {
  throw new Error(
    "WhatsApp delivery is not implemented. Route this alert through email, Slack, webhook, or in-app."
  );
}

async function sendSMSNotification(_params: SendAlertParams): Promise<void> {
  throw new Error(
    "SMS delivery is not implemented. Route this alert through email, Slack, webhook, or in-app."
  );
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(
  title: string,
  message: string,
  priority: "low" | "medium" | "high" | "critical",
  data: AlertData
): string {
  const color = PRIORITY_COLORS[priority];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 8px 8px 0 0; padding: 24px;">
          <tr>
            <td style="color: white; font-size: 24px; font-weight: bold;">
              APEX
            </td>
          </tr>
        </table>
        
        <!-- Priority Banner -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${color}; padding: 12px 24px;">
          <tr>
            <td style="color: white; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              ${PRIORITY_EMOJI[priority]} ${priority} Priority Alert
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: white; padding: 24px; border-radius: 0 0 8px 8px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                ${title}
              </h1>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${data.platform ? `<tr><td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Platform:</td><td style="color: #111827; font-size: 14px; font-weight: 500; padding: 4px 0;">${data.platform}</td></tr>` : ''}
                      ${data.brandName ? `<tr><td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Brand:</td><td style="color: #111827; font-size: 14px; font-weight: 500; padding: 4px 0;">${data.brandName}</td></tr>` : ''}
                      ${data.position !== undefined ? `<tr><td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Position:</td><td style="color: #111827; font-size: 14px; font-weight: 500; padding: 4px 0;">#${data.position}</td></tr>` : ''}
                      ${data.visibilityScore !== undefined ? `<tr><td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Visibility Score:</td><td style="color: #111827; font-size: 14px; font-weight: 500; padding: 4px 0;">${data.visibilityScore}</td></tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.apexgeo.ai'}/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
          <tr>
            <td style="color: #9ca3af; font-size: 12px; text-align: center;">
              This alert was sent by Apex AI Visibility Platform.<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.apexgeo.ai'}/settings/alerts" style="color: #6b7280;">Manage alert preferences</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
