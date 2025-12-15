/**
 * Notifications Module
 * Outgoing webhooks, email notifications, and crisis alerts for GEO/AEO platform
 *
 * F127: Outgoing Webhooks
 * F128: Email Notifications Setup
 * F129: Weekly Report Emails
 * F130: Alert Notifications
 * F130.5: Crisis Alert System
 * F131: WhatsApp Notifications
 */

// F127: Outgoing Webhooks
export {
  WebhookManager,
  webhookManager,
  WebhookEvents,
  formatWebhookResponse,
  formatDeliveryResponse,
  type WebhookConfig,
  type WebhookEventType,
  type WebhookPayload,
  type WebhookDelivery,
  type WebhookDeliveryResult,
} from "./webhooks";

// F128-F130: Email Notifications
export {
  EmailManager,
  emailManager,
  type EmailTemplate,
  formatEmailDeliveryResponse,
  type EmailConfig,
  type EmailProvider,
  type EmailMessage,
  type EmailDelivery,
  type WeeklyReportData,
  type AlertNotificationData,
  type AlertType,
} from "./email";

// F130.5: Crisis Alert System
export {
  CrisisAlertManager,
  crisisAlertManager,
  formatCrisisEventResponse,
  formatThresholdResponse,
  type CrisisThreshold,
  type CrisisType,
  type CrisisEvent,
  type CrisisSeverity,
  type CrisisMetrics,
  type CrisisTimelineEntry,
  type SuggestedAction,
  type AlertChannel,
  type CrisisSettings,
  type EscalationContact,
} from "./crisis";

// F131: WhatsApp Notifications
export {
  WhatsAppManager,
  whatsappManager,
  formatRecipientResponse,
  formatMessageResponse,
  type WhatsAppConfig,
  type WhatsAppProvider,
  type WhatsAppRecipient,
  type WhatsAppNotificationType,
  type WhatsAppMessage,
  type WhatsAppTemplate,
} from "./whatsapp";
