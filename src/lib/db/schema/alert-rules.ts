import {
  pgTable, pgEnum, text, timestamp, boolean, jsonb, integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const alertTriggerEnum = pgEnum("alert_trigger", [
  "threshold", "anomaly", "mention", "competitor", "crisis", "schedule",
]);

export const alertChannelEnum = pgEnum("alert_channel", [
  "email", "slack", "whatsapp", "webhook", "in_app",
]);

export const alertFrequencyEnum = pgEnum("alert_frequency", [
  "immediate", "hourly", "daily", "weekly",
]);

export const alertPriorityEnum = pgEnum("alert_priority", [
  "low", "medium", "high", "critical",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const alertRules = pgTable("alert_rules", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  brandId: text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  trigger: alertTriggerEnum("trigger"),
  priority: alertPriorityEnum("priority").default("medium"),
  conditions: jsonb("conditions"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alertChannels = pgTable("alert_channels", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  brandId: text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  channelType: alertChannelEnum("channel_type").notNull(),
  frequency: alertFrequencyEnum("frequency").default("immediate"),
  config: jsonb("config").$type<ChannelConfig>(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alertHistory = pgTable("alert_history", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  alertRuleId: text("alert_rule_id").references(() => alertRules.id, { onDelete: "set null" }),
  alertChannelId: text("alert_channel_id").references(() => alertChannels.id, { onDelete: "set null" }),
  brandId: text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  trigger: alertTriggerEnum("trigger"),
  priority: alertPriorityEnum("priority").default("medium"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").$type<AlertData>(),
  channelType: alertChannelEnum("channel_type"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  brand: one(brands, {
    fields: [alertRules.brandId],
    references: [brands.id],
  }),
  history: many(alertHistory),
}));

export const alertChannelsRelations = relations(alertChannels, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [alertChannels.organizationId],
    references: [organizations.id],
  }),
  brand: one(brands, {
    fields: [alertChannels.brandId],
    references: [brands.id],
  }),
  history: many(alertHistory),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  alertRule: one(alertRules, {
    fields: [alertHistory.alertRuleId],
    references: [alertRules.id],
  }),
  alertChannel: one(alertChannels, {
    fields: [alertHistory.alertChannelId],
    references: [alertChannels.id],
  }),
  brand: one(brands, {
    fields: [alertHistory.brandId],
    references: [brands.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type AlertChannel = typeof alertChannels.$inferSelect;
export type NewAlertChannel = typeof alertChannels.$inferInsert;
export type AlertHistoryRecord = typeof alertHistory.$inferSelect;
export type NewAlertHistoryRecord = typeof alertHistory.$inferInsert;

export interface AlertConditions {
  metric?: string;
  operator?: "gt" | "lt" | "gte" | "lte" | "eq" | "contains";
  threshold?: number;
  keywords?: string[];
  competitors?: string[];
  timeWindow?: number;
}

export interface ChannelConfig {
  email?: { to: string[]; subject?: string };
  slack?: { webhookUrl: string; channel?: string };
  whatsapp?: { phoneNumbers: string[] };
  webhook?: { url: string; headers?: Record<string, string>; secret?: string };
  in_app?: { userId?: string };
}

export interface AlertData {
  metric?: string;
  value?: number;
  threshold?: number;
  change?: number;
  trend?: "up" | "down" | "stable";
  brandId?: string;
  locationId?: string;
  competitorId?: string;
  url?: string;
  details?: Record<string, unknown>;
}
