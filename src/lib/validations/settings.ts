import { z } from "zod";

// Profile settings schema
export const profileSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email"),
  avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  jobTitle: z.string().max(100).optional(),
  timezone: z.string().default("UTC"),
  language: z.enum(["en", "zu", "xh", "af", "sw", "yo"]).default("en"),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

// Notification settings schema
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  auditComplete: z.boolean(),
  mentionAlerts: z.boolean(),
  recommendationAlerts: z.boolean(),
  systemUpdates: z.boolean(),
  marketingEmails: z.boolean(),
});

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// Organization settings schema
export const organizationSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
});

export type OrganizationSettingsFormData = z.infer<typeof organizationSettingsSchema>;

// Billing settings schema
export const billingSettingsSchema = z.object({
  billingEmail: z.string().email("Please enter a valid email"),
  companyName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  address: z
    .object({
      line1: z.string().max(200),
      line2: z.string().max(200).optional(),
      city: z.string().max(100),
      state: z.string().max(100).optional(),
      postalCode: z.string().max(20),
      country: z.string().length(2, "Use 2-letter country code"),
    })
    .optional(),
});

export type BillingSettingsFormData = z.infer<typeof billingSettingsSchema>;

// API key settings schema
export const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, "API key name is required")
    .max(100, "Name must be less than 100 characters"),
  scopes: z
    .array(z.enum(["read", "write", "delete", "admin"]))
    .min(1, "Select at least one scope"),
  expiresAt: z.date().optional(),
  rateLimit: z.number().min(100).max(100000).optional(),
});

export type ApiKeyFormData = z.infer<typeof apiKeySchema>;

// Webhook settings schema
export const webhookSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  events: z
    .array(z.enum([
      "audit.completed",
      "mention.detected",
      "content.generated",
      "recommendation.created",
      "alert.triggered",
    ]))
    .min(1, "Select at least one event"),
  secret: z.string().min(16, "Secret must be at least 16 characters").optional(),
  isActive: z.boolean().default(true),
});

export type WebhookFormData = z.infer<typeof webhookSchema>;
