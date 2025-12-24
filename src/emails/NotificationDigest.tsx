import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { NotificationItem, NotificationItemProps } from "./components/NotificationItem";

export interface NotificationDigestProps {
  userName?: string;
  frequency: "daily" | "weekly";
  notifications: NotificationItemProps[];
  periodStart: string;
  periodEnd: string;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Format date range for digest header
 */
function formatPeriod(start: string, end: string): string {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startFormatted = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const endFormatted = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  } catch {
    return `${start} - ${end}`;
  }
}

/**
 * Get notification counts by type
 */
function getNotificationStats(notifications: NotificationItemProps[]): {
  total: number;
  byType: Record<string, number>;
} {
  const stats = {
    total: notifications.length,
    byType: {
      mention: 0,
      score_change: 0,
      recommendation: 0,
      important: 0,
    },
  };

  notifications.forEach((notification) => {
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
  });

  return stats;
}

/**
 * NotificationDigest Email Template
 * Daily/Weekly digest of notifications with grouped display
 */
export const NotificationDigest: React.FC<NotificationDigestProps> = ({
  userName,
  frequency,
  notifications,
  periodStart,
  periodEnd,
  dashboardUrl = "https://apex.com/dashboard",
  unsubscribeUrl,
}) => {
  const stats = getNotificationStats(notifications);
  const period = formatPeriod(periodStart, periodEnd);
  const title = frequency === "daily" ? "Daily Digest" : "Weekly Digest";

  // Group notifications by type
  const groupedNotifications = {
    important: notifications.filter((n) => n.type === "important"),
    mention: notifications.filter((n) => n.type === "mention"),
    score_change: notifications.filter((n) => n.type === "score_change"),
    recommendation: notifications.filter((n) => n.type === "recommendation"),
  };

  return (
    <Html>
      <Head />
      <Preview>
        {title} - {stats.total} new notification{stats.total !== 1 ? "s" : ""} from Apex GEO
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{title}</Heading>
            <Text style={headerSubtitle}>
              {userName ? `Hi ${userName}, ` : ""}Your notification summary for {period}
            </Text>
          </Section>

          {/* Stats Overview */}
          <Section style={content}>
            <Text style={sectionTitle}>Summary</Text>
            <Row>
              <Column style={statCard}>
                <Text style={statValue}>{stats.total}</Text>
                <Text style={statLabel}>Total</Text>
              </Column>
              <Column style={statCard}>
                <Text style={{ ...statValue, color: "#D4292A" }}>
                  {stats.byType.important || 0}
                </Text>
                <Text style={statLabel}>Important</Text>
              </Column>
              <Column style={statCard}>
                <Text style={{ ...statValue, color: "#4926FA" }}>
                  {stats.byType.mention || 0}
                </Text>
                <Text style={statLabel}>Mentions</Text>
              </Column>
              <Column style={statCard}>
                <Text style={{ ...statValue, color: "#FFB020" }}>
                  {stats.byType.score_change || 0}
                </Text>
                <Text style={statLabel}>Score Changes</Text>
              </Column>
            </Row>
          </Section>

          {/* Notifications by Type */}
          <Section style={content}>
            {/* Important Notifications */}
            {groupedNotifications.important.length > 0 && (
              <>
                <Text style={sectionTitle}>
                  ðŸš¨ Important Notifications ({groupedNotifications.important.length})
                </Text>
                {groupedNotifications.important.map((notification, index) => (
                  <NotificationItem key={`important-${index}`} {...notification} />
                ))}
                <Section style={spacer} />
              </>
            )}

            {/* Mention Notifications */}
            {groupedNotifications.mention.length > 0 && (
              <>
                <Text style={sectionTitle}>
                  ðŸ’¬ New Mentions ({groupedNotifications.mention.length})
                </Text>
                {groupedNotifications.mention.map((notification, index) => (
                  <NotificationItem key={`mention-${index}`} {...notification} />
                ))}
                <Section style={spacer} />
              </>
            )}

            {/* Score Change Notifications */}
            {groupedNotifications.score_change.length > 0 && (
              <>
                <Text style={sectionTitle}>
                  ðŸ“Š Score Changes ({groupedNotifications.score_change.length})
                </Text>
                {groupedNotifications.score_change.map((notification, index) => (
                  <NotificationItem key={`score-${index}`} {...notification} />
                ))}
                <Section style={spacer} />
              </>
            )}

            {/* Recommendation Notifications */}
            {groupedNotifications.recommendation.length > 0 && (
              <>
                <Text style={sectionTitle}>
                  ðŸ’¡ Recommendations ({groupedNotifications.recommendation.length})
                </Text>
                {groupedNotifications.recommendation.map((notification, index) => (
                  <NotificationItem key={`recommendation-${index}`} {...notification} />
                ))}
              </>
            )}

            {/* Empty State */}
            {notifications.length === 0 && (
              <Section style={emptyState}>
                <Text style={emptyStateText}>
                  ðŸŽ‰ No new notifications during this period!
                </Text>
                <Text style={emptyStateSubtext}>
                  You're all caught up. Check back later for updates.
                </Text>
              </Section>
            )}

            {/* CTA Button */}
            {notifications.length > 0 && (
              <Section style={ctaSection}>
                <Link href={dashboardUrl} style={ctaButton}>
                  View All Notifications
                </Link>
              </Section>
            )}
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              Apex GEO Platform | Powered by AI
            </Text>
            <Text style={footerText}>
              You're receiving this {frequency} digest because you subscribed to notification emails.
            </Text>
            {unsubscribeUrl && (
              <Link href={unsubscribeUrl} style={footerLink}>
                Update email preferences
              </Link>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f5f5f5",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  padding: "20px",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden" as const,
};

const header = {
  background: "linear-gradient(135deg, #4926FA 0%, #D82F71 100%)",
  color: "#ffffff",
  padding: "32px",
  textAlign: "center" as const,
};

const headerTitle = {
  margin: "0",
  fontSize: "24px",
  fontWeight: "700",
  color: "#ffffff",
};

const headerSubtitle = {
  margin: "8px 0 0",
  fontSize: "14px",
  opacity: 0.9,
  color: "#ffffff",
};

const content = {
  padding: "32px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "16px",
  color: "#0E1558",
};

const statCard = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "0 4px",
};

const statValue = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0E1558",
  margin: "0 0 4px 0",
};

const statLabel = {
  fontSize: "12px",
  color: "#666",
  margin: "0",
};

const spacer = {
  height: "24px",
};

const emptyState = {
  textAlign: "center" as const,
  padding: "32px 16px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};

const emptyStateText = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0E1558",
  margin: "0 0 8px 0",
};

const emptyStateSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const ctaButton = {
  display: "inline-block",
  backgroundColor: "#4926FA",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
};

const divider = {
  borderColor: "#eee",
  margin: "0",
};

const footer = {
  textAlign: "center" as const,
  padding: "24px",
};

const footerText = {
  fontSize: "12px",
  color: "#666",
  margin: "4px 0",
};

const footerLink = {
  fontSize: "12px",
  color: "#4926FA",
  textDecoration: "none",
};

export default NotificationDigest;
