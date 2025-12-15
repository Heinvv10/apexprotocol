/**
 * WhatsApp Notifications (F131)
 * WhatsApp Business API integration for alert notifications and weekly reports
 */

import { createId } from "@paralleldrive/cuid2";

// WhatsApp types
export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  apiKey: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken?: string;
}

export type WhatsAppProvider = "meta" | "twilio" | "messagebird";

export interface WhatsAppRecipient {
  id: string;
  brandId: string;
  name: string;
  phoneNumber: string; // E.164 format
  isVerified: boolean;
  optedIn: boolean;
  optedInAt?: Date;
  notificationTypes: WhatsAppNotificationType[];
  createdAt: Date;
  updatedAt: Date;
}

export type WhatsAppNotificationType =
  | "crisis_alert"
  | "weekly_report"
  | "daily_summary"
  | "score_alert"
  | "mention_alert";

export interface WhatsAppMessage {
  id: string;
  recipientId: string;
  phoneNumber: string;
  templateName: string;
  templateParameters: Record<string, string>;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  externalId?: string;
  createdAt: Date;
}

export interface WhatsAppTemplate {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone_number?: string;
}

/**
 * WhatsApp Manager - handles WhatsApp Business API integration
 */
export class WhatsAppManager {
  private config?: WhatsAppConfig;
  private recipients: Map<string, WhatsAppRecipient> = new Map();
  private recipientsByBrand: Map<string, Set<string>> = new Map();
  private messages: Map<string, WhatsAppMessage> = new Map();

  constructor() {}

  /**
   * Configure WhatsApp API
   */
  configure(config: WhatsAppConfig): void {
    this.config = config;
  }

  /**
   * Check if configured
   */
  isConfigured(): boolean {
    return !!this.config;
  }

  /**
   * Get configuration status
   */
  getStatus(): {
    configured: boolean;
    provider?: WhatsAppProvider;
    phoneNumberId?: string;
    recipientCount: number;
    messageCount: number;
  } {
    return {
      configured: this.isConfigured(),
      provider: this.config?.provider,
      phoneNumberId: this.config?.phoneNumberId,
      recipientCount: this.recipients.size,
      messageCount: this.messages.size,
    };
  }

  /**
   * Add a recipient
   */
  addRecipient(
    brandId: string,
    data: {
      name: string;
      phoneNumber: string;
      notificationTypes?: WhatsAppNotificationType[];
    }
  ): WhatsAppRecipient {
    const recipient: WhatsAppRecipient = {
      id: createId(),
      brandId,
      name: data.name,
      phoneNumber: this.normalizePhoneNumber(data.phoneNumber),
      isVerified: false,
      optedIn: false,
      notificationTypes: data.notificationTypes || ["crisis_alert"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.recipients.set(recipient.id, recipient);

    if (!this.recipientsByBrand.has(brandId)) {
      this.recipientsByBrand.set(brandId, new Set());
    }
    this.recipientsByBrand.get(brandId)!.add(recipient.id);

    return recipient;
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, "");

    // Ensure starts with +
    if (!normalized.startsWith("+")) {
      // Assume South African number if no country code
      if (normalized.startsWith("0")) {
        normalized = "+27" + normalized.slice(1);
      } else {
        normalized = "+" + normalized;
      }
    }

    return normalized;
  }

  /**
   * Update recipient
   */
  updateRecipient(
    recipientId: string,
    updates: Partial<Omit<WhatsAppRecipient, "id" | "brandId" | "createdAt">>
  ): WhatsAppRecipient | undefined {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return undefined;

    Object.assign(recipient, updates, { updatedAt: new Date() });
    return recipient;
  }

  /**
   * Delete recipient
   */
  deleteRecipient(recipientId: string): boolean {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return false;

    this.recipients.delete(recipientId);
    this.recipientsByBrand.get(recipient.brandId)?.delete(recipientId);

    return true;
  }

  /**
   * Get recipients for brand
   */
  getRecipients(brandId: string): WhatsAppRecipient[] {
    const ids = this.recipientsByBrand.get(brandId);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.recipients.get(id))
      .filter((r): r is WhatsAppRecipient => r !== undefined);
  }

  /**
   * Record opt-in
   */
  recordOptIn(recipientId: string): WhatsAppRecipient | undefined {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return undefined;

    recipient.optedIn = true;
    recipient.optedInAt = new Date();
    recipient.updatedAt = new Date();

    return recipient;
  }

  /**
   * Record opt-out
   */
  recordOptOut(recipientId: string): WhatsAppRecipient | undefined {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return undefined;

    recipient.optedIn = false;
    recipient.updatedAt = new Date();

    return recipient;
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    recipientId: string,
    templateName: string,
    parameters: Record<string, string>
  ): Promise<WhatsAppMessage> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    if (!recipient.optedIn) {
      throw new Error("Recipient has not opted in to WhatsApp messages");
    }

    const message: WhatsAppMessage = {
      id: createId(),
      recipientId,
      phoneNumber: recipient.phoneNumber,
      templateName,
      templateParameters: parameters,
      status: "pending",
      createdAt: new Date(),
    };

    this.messages.set(message.id, message);

    // Send via configured provider
    try {
      const result = await this.sendViaProvider(message);
      message.status = "sent";
      message.sentAt = new Date();
      message.externalId = result.externalId;
    } catch (error) {
      message.status = "failed";
      message.error = error instanceof Error ? error.message : "Unknown error";
    }

    return message;
  }

  /**
   * Send via configured provider
   */
  private async sendViaProvider(
    message: WhatsAppMessage
  ): Promise<{ externalId: string }> {
    if (!this.config) {
      throw new Error("WhatsApp not configured");
    }

    switch (this.config.provider) {
      case "meta":
        return this.sendViaMeta(message);
      case "twilio":
        return this.sendViaTwilio(message);
      case "messagebird":
        return this.sendViaMessageBird(message);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Send via Meta WhatsApp Business API
   */
  private async sendViaMeta(
    message: WhatsAppMessage
  ): Promise<{ externalId: string }> {
    const url = `https://graph.facebook.com/v18.0/${this.config!.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.phoneNumber,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: "en" },
          components: this.buildTemplateComponents(message.templateParameters),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta API error: ${error}`);
    }

    const data = await response.json();
    return { externalId: data.messages?.[0]?.id || createId() };
  }

  /**
   * Send via Twilio
   */
  private async sendViaTwilio(
    message: WhatsAppMessage
  ): Promise<{ externalId: string }> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config!.businessAccountId}/Messages.json`;

    // Build template body
    const body = this.buildTemplateBody(message.templateName, message.templateParameters);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.config!.businessAccountId}:${this.config!.apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${this.config!.phoneNumberId}`,
        To: `whatsapp:${message.phoneNumber}`,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    const data = await response.json();
    return { externalId: data.sid };
  }

  /**
   * Send via MessageBird
   */
  private async sendViaMessageBird(
    message: WhatsAppMessage
  ): Promise<{ externalId: string }> {
    const url = "https://conversations.messagebird.com/v1/send";

    const body = this.buildTemplateBody(message.templateName, message.templateParameters);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `AccessKey ${this.config!.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: message.phoneNumber,
        from: this.config!.phoneNumberId,
        type: "text",
        content: { text: body },
        channelId: this.config!.businessAccountId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MessageBird API error: ${error}`);
    }

    const data = await response.json();
    return { externalId: data.id };
  }

  /**
   * Build template components for Meta API
   */
  private buildTemplateComponents(
    parameters: Record<string, string>
  ): Array<{ type: string; parameters: Array<{ type: string; text: string }> }> {
    const components = [];

    // Header parameters
    if (parameters.header) {
      components.push({
        type: "header",
        parameters: [{ type: "text", text: parameters.header }],
      });
    }

    // Body parameters
    const bodyParams = Object.entries(parameters)
      .filter(([key]) => key.startsWith("body_") || (!key.startsWith("header") && key !== "header"))
      .map(([_, value]) => ({ type: "text", text: value }));

    if (bodyParams.length > 0) {
      components.push({
        type: "body",
        parameters: bodyParams,
      });
    }

    return components;
  }

  /**
   * Build template body text
   */
  private buildTemplateBody(
    templateName: string,
    parameters: Record<string, string>
  ): string {
    const templates: Record<string, string> = {
      crisis_alert: `🚨 *CRISIS ALERT*\n\n*Brand:* {{brand_name}}\n*Type:* {{alert_type}}\n*Severity:* {{severity}}\n\n{{description}}\n\n*Time:* {{timestamp}}\n\nView dashboard: {{dashboard_url}}`,

      weekly_report: `📊 *Weekly GEO Report*\n\n*Brand:* {{brand_name}}\n*Period:* {{period}}\n\n*GEO Score:* {{score}} ({{score_change}})\n*Mentions:* {{total_mentions}}\n*Sentiment:* {{sentiment}}%\n\n*Top Highlights:*\n{{highlights}}\n\nView full report: {{report_url}}`,

      daily_summary: `📈 *Daily Summary*\n\n*Brand:* {{brand_name}}\n*Date:* {{date}}\n\n*Score:* {{score}}\n*Mentions:* {{mention_count}}\n*Sentiment:* {{sentiment}}%\n\nView details: {{dashboard_url}}`,

      score_alert: `📉 *Score Alert*\n\n*Brand:* {{brand_name}}\n*Score:* {{previous_score}} → {{current_score}}\n*Change:* {{score_change}} points\n\n{{description}}\n\nView details: {{dashboard_url}}`,

      mention_alert: `💬 *New Mention Alert*\n\n*Brand:* {{brand_name}}\n*Platform:* {{platform}}\n*Sentiment:* {{sentiment}}\n\n"{{mention_snippet}}"\n\nView mention: {{mention_url}}`,
    };

    let body = templates[templateName] || `{{message}}`;

    // Replace placeholders
    for (const [key, value] of Object.entries(parameters)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return body;
  }

  /**
   * Send crisis alert
   */
  async sendCrisisAlert(
    brandId: string,
    data: {
      brandName: string;
      alertType: string;
      severity: string;
      description: string;
      dashboardUrl?: string;
    }
  ): Promise<WhatsAppMessage[]> {
    const recipients = this.getRecipients(brandId).filter(
      (r) => r.optedIn && r.notificationTypes.includes("crisis_alert")
    );

    const messages: WhatsAppMessage[] = [];

    for (const recipient of recipients) {
      try {
        const message = await this.sendTemplateMessage(recipient.id, "crisis_alert", {
          brand_name: data.brandName,
          alert_type: data.alertType,
          severity: data.severity,
          description: data.description,
          timestamp: new Date().toLocaleString(),
          dashboard_url: data.dashboardUrl || "https://app.apex-geo.com",
        });
        messages.push(message);
      } catch (error) {
        // Continue with other recipients
      }
    }

    return messages;
  }

  /**
   * Send weekly report
   */
  async sendWeeklyReport(
    brandId: string,
    data: {
      brandName: string;
      period: string;
      score: number;
      scoreChange: string;
      totalMentions: number;
      sentiment: number;
      highlights: string[];
      reportUrl?: string;
    }
  ): Promise<WhatsAppMessage[]> {
    const recipients = this.getRecipients(brandId).filter(
      (r) => r.optedIn && r.notificationTypes.includes("weekly_report")
    );

    const messages: WhatsAppMessage[] = [];

    for (const recipient of recipients) {
      try {
        const message = await this.sendTemplateMessage(recipient.id, "weekly_report", {
          brand_name: data.brandName,
          period: data.period,
          score: data.score.toString(),
          score_change: data.scoreChange,
          total_mentions: data.totalMentions.toString(),
          sentiment: data.sentiment.toFixed(1),
          highlights: data.highlights.map((h) => `• ${h}`).join("\n"),
          report_url: data.reportUrl || "https://app.apex-geo.com/reports",
        });
        messages.push(message);
      } catch (error) {
        // Continue with other recipients
      }
    }

    return messages;
  }

  /**
   * Send score alert
   */
  async sendScoreAlert(
    brandId: string,
    data: {
      brandName: string;
      previousScore: number;
      currentScore: number;
      description: string;
      dashboardUrl?: string;
    }
  ): Promise<WhatsAppMessage[]> {
    const recipients = this.getRecipients(brandId).filter(
      (r) => r.optedIn && r.notificationTypes.includes("score_alert")
    );

    const messages: WhatsAppMessage[] = [];
    const change = data.currentScore - data.previousScore;

    for (const recipient of recipients) {
      try {
        const message = await this.sendTemplateMessage(recipient.id, "score_alert", {
          brand_name: data.brandName,
          previous_score: data.previousScore.toString(),
          current_score: data.currentScore.toString(),
          score_change: `${change >= 0 ? "+" : ""}${change}`,
          description: data.description,
          dashboard_url: data.dashboardUrl || "https://app.apex-geo.com",
        });
        messages.push(message);
      } catch (error) {
        // Continue with other recipients
      }
    }

    return messages;
  }

  /**
   * Get message history
   */
  getMessageHistory(recipientId?: string, limit: number = 100): WhatsAppMessage[] {
    let messages = Array.from(this.messages.values());

    if (recipientId) {
      messages = messages.filter((m) => m.recipientId === recipientId);
    }

    return messages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Update message status (from webhook)
   */
  updateMessageStatus(
    externalId: string,
    status: "delivered" | "read" | "failed",
    error?: string
  ): WhatsAppMessage | undefined {
    const message = Array.from(this.messages.values()).find(
      (m) => m.externalId === externalId
    );

    if (!message) return undefined;

    message.status = status;
    if (status === "delivered") {
      message.deliveredAt = new Date();
    } else if (status === "read") {
      message.readAt = new Date();
    } else if (status === "failed") {
      message.error = error;
    }

    return message;
  }

  /**
   * Send test message
   */
  async sendTestMessage(recipientId: string): Promise<WhatsAppMessage> {
    return this.sendTemplateMessage(recipientId, "daily_summary", {
      brand_name: "Test Brand",
      date: new Date().toLocaleDateString(),
      score: "75",
      mention_count: "42",
      sentiment: "68.5",
      dashboard_url: "https://app.apex-geo.com",
    });
  }
}

// Singleton instance
export const whatsappManager = new WhatsAppManager();

/**
 * Format recipient for API response
 */
export function formatRecipientResponse(recipient: WhatsAppRecipient) {
  return {
    id: recipient.id,
    name: recipient.name,
    phoneNumber: recipient.phoneNumber.replace(/(\+\d{2})(\d{3})(\d+)/, "$1***$3"),
    isVerified: recipient.isVerified,
    optedIn: recipient.optedIn,
    optedInAt: recipient.optedInAt?.toISOString(),
    notificationTypes: recipient.notificationTypes,
    createdAt: recipient.createdAt.toISOString(),
  };
}

/**
 * Format message for API response
 */
export function formatMessageResponse(message: WhatsAppMessage) {
  return {
    id: message.id,
    templateName: message.templateName,
    status: message.status,
    sentAt: message.sentAt?.toISOString(),
    deliveredAt: message.deliveredAt?.toISOString(),
    readAt: message.readAt?.toISOString(),
    error: message.error,
    createdAt: message.createdAt.toISOString(),
  };
}
