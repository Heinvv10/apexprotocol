import {
  Section,
  Row,
  Column,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

export interface NotificationItemProps {
  type: "mention" | "score_change" | "recommendation" | "important";
  title: string;
  message: string;
  metadata?: {
    brandName?: string;
    platform?: string;
    query?: string;
    sentiment?: string;
    position?: number;
    oldScore?: number;
    newScore?: number;
    scoreChange?: number;
    linkUrl?: string;
    linkText?: string;
    [key: string]: any;
  };
  createdAt: string;
}

/**
 * Get notification type badge color and label
 */
function getNotificationTypeBadge(type: NotificationItemProps["type"]): {
  color: string;
  bgColor: string;
  label: string;
} {
  switch (type) {
    case "mention":
      return {
        color: "#4926FA",
        bgColor: "rgba(73, 38, 250, 0.1)",
        label: "New Mention",
      };
    case "score_change":
      return {
        color: "#FFB020",
        bgColor: "rgba(255, 176, 32, 0.1)",
        label: "Score Change",
      };
    case "recommendation":
      return {
        color: "#17CA29",
        bgColor: "rgba(23, 202, 41, 0.1)",
        label: "Recommendation",
      };
    case "important":
      return {
        color: "#D4292A",
        bgColor: "rgba(212, 41, 42, 0.1)",
        label: "Important",
      };
  }
}

/**
 * Format timestamp to readable date
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * NotificationItem Component
 * Displays a single notification with type badge, title, message, and metadata
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  type,
  title,
  message,
  metadata = {},
  createdAt,
}) => {
  const badge = getNotificationTypeBadge(type);

  return (
    <Section
      style={{
        borderLeft: `3px solid ${badge.color}`,
        borderRadius: "0 8px 8px 0",
        backgroundColor: "#f8f9fa",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      {/* Type Badge and Timestamp */}
      <Row>
        <Column>
          <Text
            style={{
              margin: "0 0 8px 0",
              fontSize: "12px",
              fontWeight: "600",
              color: badge.color,
              backgroundColor: badge.bgColor,
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {badge.label}
          </Text>
        </Column>
        <Column align="right">
          <Text
            style={{
              margin: "0 0 8px 0",
              fontSize: "11px",
              color: "#666",
            }}
          >
            {formatDate(createdAt)}
          </Text>
        </Column>
      </Row>

      {/* Title */}
      <Text
        style={{
          margin: "0 0 8px 0",
          fontSize: "16px",
          fontWeight: "600",
          color: "#0E1558",
          lineHeight: "1.4",
        }}
      >
        {title}
      </Text>

      {/* Message */}
      <Text
        style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          color: "#333",
          lineHeight: "1.5",
        }}
      >
        {message}
      </Text>

      {/* Metadata - Mention */}
      {type === "mention" && (
        <>
          {metadata.platform && (
            <Text
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              <strong>Platform:</strong> {metadata.platform}
            </Text>
          )}
          {metadata.query && (
            <Text
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              <strong>Query:</strong> {metadata.query}
            </Text>
          )}
          {metadata.sentiment && (
            <Text
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              <strong>Sentiment:</strong>{" "}
              <span
                style={{
                  color:
                    metadata.sentiment === "positive"
                      ? "#17CA29"
                      : metadata.sentiment === "negative"
                        ? "#D4292A"
                        : "#FFB020",
                  fontWeight: "600",
                }}
              >
                {metadata.sentiment}
              </span>
            </Text>
          )}
          {metadata.position && (
            <Text
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              <strong>Position:</strong> #{metadata.position}
            </Text>
          )}
        </>
      )}

      {/* Metadata - Score Change */}
      {type === "score_change" && (
        <>
          {metadata.oldScore !== undefined && metadata.newScore !== undefined && (
            <Text
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              <strong>Score Change:</strong>{" "}
              <span style={{ color: "#666" }}>{metadata.oldScore}</span>
              {" â†’ "}
              <span
                style={{
                  color:
                    metadata.scoreChange && metadata.scoreChange > 0
                      ? "#17CA29"
                      : "#D4292A",
                  fontWeight: "600",
                }}
              >
                {metadata.newScore}
              </span>
              {metadata.scoreChange && (
                <span
                  style={{
                    marginLeft: "8px",
                    color:
                      metadata.scoreChange > 0 ? "#17CA29" : "#D4292A",
                    fontWeight: "600",
                  }}
                >
                  ({metadata.scoreChange > 0 ? "+" : ""}
                  {metadata.scoreChange})
                </span>
              )}
            </Text>
          )}
          {metadata.metric && (
            <Text
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              <strong>Metric:</strong> {metadata.metric}
            </Text>
          )}
        </>
      )}

      {/* Action Link */}
      {metadata.linkUrl && (
        <Link
          href={metadata.linkUrl}
          style={{
            display: "inline-block",
            marginTop: "8px",
            fontSize: "13px",
            color: "#4926FA",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          {metadata.linkText || "View Details"} â†’
        </Link>
      )}
    </Section>
  );
};
