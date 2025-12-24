import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "mention",
  "score_change",
  "recommendation",
  "important",
]);

// Email digest frequency enum
export const emailDigestFrequencyEnum = pgEnum("email_digest_frequency", [
  "none",
  "daily",
  "weekly",
]);

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),

    // Notification content
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),

    // Additional data (JSON)
    metadata: jsonb("metadata").$type<NotificationMetadata>().default({}),

    // Read tracking
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    // Archive tracking
    isArchived: boolean("is_archived").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    organizationIdIdx: index("notifications_organization_id_idx").on(
      table.organizationId
    ),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    typeIdx: index("notifications_type_idx").on(table.type),
  })
);

// Notification metadata type
export interface NotificationMetadata {
  // Mention-specific
  brandId?: string;
  brandName?: string;
  mentionId?: string;
  platform?: string;
  query?: string;
  sentiment?: string;
  position?: number;

  // Score change-specific
  oldScore?: number;
  newScore?: number;
  scoreChange?: number;
  metric?: string;

  // Recommendation-specific
  recommendationId?: string;

  // Links
  linkUrl?: string;
  linkText?: string;

  // Additional context
  [key: string]: any;
}

// Notification preferences table
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull().unique(),
    organizationId: text("organization_id").notNull(),

    // Email preferences
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    emailDigestFrequency: emailDigestFrequencyEnum("email_digest_frequency")
      .default("none")
      .notNull(),
    emailAddress: text("email_address"), // Override default email if needed

    // Notification channel preferences
    inAppEnabled: boolean("in_app_enabled").default(true).notNull(),

    // Notification type preferences
    mentionNotifications: boolean("mention_notifications")
      .default(true)
      .notNull(),
    scoreChangeNotifications: boolean("score_change_notifications")
      .default(true)
      .notNull(),
    recommendationNotifications: boolean("recommendation_notifications")
      .default(true)
      .notNull(),
    importantNotifications: boolean("important_notifications")
      .default(true)
      .notNull(),

    // Timezone for digest scheduling
    timezone: text("timezone").default("UTC").notNull(),

    // Digest time (hour of day, 0-23)
    digestHour: integer("digest_hour").default(9).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("notification_preferences_user_id_idx").on(table.userId),
    organizationIdIdx: index(
      "notification_preferences_organization_id_idx"
    ).on(table.organizationId),
  })
);

// Notification reads table (audit trail for read tracking)
export const notificationReads = pgTable(
  "notification_reads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),

    // Timestamp
    readAt: timestamp("read_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    notificationIdIdx: index("notification_reads_notification_id_idx").on(
      table.notificationId
    ),
    userIdIdx: index("notification_reads_user_id_idx").on(table.userId),
  })
);

// Relations
export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  reads: many(notificationReads),
  preferences: one(notificationPreferences, {
    fields: [notifications.userId],
    references: [notificationPreferences.userId],
  }),
}));

export const notificationReadsRelations = relations(
  notificationReads,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationReads.notificationId],
      references: [notifications.id],
    }),
  })
);

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ many }) => ({
    notifications: many(notifications),
  })
);

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
export type NotificationRead = typeof notificationReads.$inferSelect;
export type NewNotificationRead = typeof notificationReads.$inferInsert;
