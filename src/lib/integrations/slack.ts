/**
 * Slack Integration (F120-F121)
 * OAuth2 flow, channel selection, and message posting
 */

import { createId } from "@paralleldrive/cuid2";

// Slack types
export interface SlackConnection {
  id: string;
  brandId: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId: string;
  scope: string;
  selectedChannelId?: string;
  selectedChannelName?: string;
  status: "connected" | "disconnected" | "expired" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isArchived: boolean;
  isMember: boolean;
  topic?: string;
  purpose?: string;
  numMembers?: number;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  timestamp: string;
  text: string;
  blocks?: SlackBlock[];
  threadTs?: string;
  reactions?: SlackReaction[];
  postedAt: Date;
}

export interface SlackBlock {
  type: "section" | "divider" | "context" | "header" | "actions";
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: "plain_text" | "mrkdwn";
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text?: string | { type: string; text: string };
    url?: string;
    action_id?: string;
  }>;
  accessory?: unknown;
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SendMessageParams {
  text: string;
  blocks?: SlackBlock[];
  threadTs?: string;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
}

// Slack OAuth configuration
const SLACK_OAUTH_CONFIG = {
  authorizationUrl: "https://slack.com/oauth/v2/authorize",
  tokenUrl: "https://slack.com/api/oauth.v2.access",
  apiUrl: "https://slack.com/api",
  scopes: [
    "channels:read",
    "chat:write",
    "chat:write.public",
    "users:read",
    "reactions:read",
    "channels:history",
  ],
};

/**
 * Slack Integration Manager
 */
export class SlackManager {
  private connections: Map<string, SlackConnection> = new Map();
  private byBrand: Map<string, string> = new Map();
  private sentMessages: Map<string, SlackMessage> = new Map();

  constructor(
    private clientId: string = process.env.SLACK_CLIENT_ID || "",
    private clientSecret: string = process.env.SLACK_CLIENT_SECRET || "",
    private callbackUrl: string = process.env.SLACK_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: SLACK_OAUTH_CONFIG.scopes.join(","),
      redirect_uri: this.callbackUrl,
      state: `${brandId}:${state}`,
    });

    return `${SLACK_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    teamId: string;
    teamName: string;
    botUserId: string;
    scope: string;
  }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.callbackUrl,
    });

    const response = await fetch(SLACK_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Token exchange failed: ${data.error}`);
    }

    return {
      accessToken: data.access_token,
      teamId: data.team.id,
      teamName: data.team.name,
      botUserId: data.bot_user_id,
      scope: data.scope,
    };
  }

  /**
   * Create connection after OAuth flow
   */
  createConnection(
    brandId: string,
    accessToken: string,
    teamId: string,
    teamName: string,
    botUserId: string,
    scope: string
  ): SlackConnection {
    const connection: SlackConnection = {
      id: createId(),
      brandId,
      teamId,
      teamName,
      accessToken,
      botUserId,
      scope,
      status: "connected",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.connections.set(connection.id, connection);
    this.byBrand.set(brandId, connection.id);

    return connection;
  }

  /**
   * Get connection for brand
   */
  getConnection(brandId: string): SlackConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect Slack
   */
  disconnect(brandId: string): boolean {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return false;

    this.connections.delete(connectionId);
    this.byBrand.delete(brandId);
    return true;
  }

  /**
   * Get channels
   */
  async getChannels(brandId: string): Promise<SlackChannel[]> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No Slack connection found");
    }

    const response = await fetch(
      `${SLACK_OAUTH_CONFIG.apiUrl}/conversations.list?types=public_channel,private_channel&exclude_archived=true`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to get channels: ${data.error}`);
    }

    return data.channels.map((c: Record<string, unknown>) => ({
      id: c.id,
      name: c.name,
      isPrivate: c.is_private,
      isArchived: c.is_archived,
      isMember: c.is_member,
      topic: (c.topic as { value?: string } | undefined)?.value,
      purpose: (c.purpose as { value?: string } | undefined)?.value,
      numMembers: c.num_members,
    }));
  }

  /**
   * Select channel for notifications
   */
  selectChannel(brandId: string, channelId: string, channelName: string): SlackConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedChannelId = channelId;
    connection.selectedChannelName = channelName;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Send message to channel
   */
  async sendMessage(brandId: string, params: SendMessageParams): Promise<SlackMessage> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No Slack connection found");
    }

    if (!connection.selectedChannelId) {
      throw new Error("No channel selected");
    }

    const body: Record<string, unknown> = {
      channel: connection.selectedChannelId,
      text: params.text,
      unfurl_links: params.unfurlLinks ?? false,
      unfurl_media: params.unfurlMedia ?? true,
    };

    if (params.blocks) {
      body.blocks = params.blocks;
    }

    if (params.threadTs) {
      body.thread_ts = params.threadTs;
    }

    const response = await fetch(`${SLACK_OAUTH_CONFIG.apiUrl}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to send message: ${data.error}`);
    }

    const message: SlackMessage = {
      id: createId(),
      channelId: connection.selectedChannelId,
      timestamp: data.ts,
      text: params.text,
      blocks: params.blocks,
      threadTs: params.threadTs,
      postedAt: new Date(),
    };

    this.sentMessages.set(message.id, message);
    return message;
  }

  /**
   * Send recommendation notification
   */
  async sendRecommendationNotification(
    brandId: string,
    recommendation: {
      id: string;
      title: string;
      description: string;
      priority: string;
      category: string;
      url?: string;
    }
  ): Promise<SlackMessage> {
    const priorityEmoji: Record<string, string> = {
      critical: ":rotating_light:",
      high: ":warning:",
      medium: ":large_blue_diamond:",
      low: ":white_circle:",
    };

    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${priorityEmoji[recommendation.priority] || ":memo:"} New GEO Recommendation`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${recommendation.title}*\n${recommendation.description}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Priority:* ${recommendation.priority} | *Category:* ${recommendation.category}`,
          },
        ],
      },
      {
        type: "divider",
      },
    ];

    if (recommendation.url) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View in Apex",
            },
            url: recommendation.url,
            action_id: "view_recommendation",
          },
        ],
      });
    }

    return this.sendMessage(brandId, {
      text: `New GEO Recommendation: ${recommendation.title}`,
      blocks,
    });
  }

  /**
   * Send GEO score update
   */
  async sendScoreUpdate(
    brandId: string,
    update: {
      previousScore: number;
      currentScore: number;
      change: number;
      url?: string;
    }
  ): Promise<SlackMessage> {
    const changeEmoji = update.change > 0 ? ":chart_with_upwards_trend:" : ":chart_with_downwards_trend:";
    const changeText = update.change > 0 ? `+${update.change}` : `${update.change}`;

    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${changeEmoji} GEO Score Update`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Previous Score*\n${update.previousScore}`,
          },
          {
            type: "mrkdwn",
            text: `*Current Score*\n${update.currentScore}`,
          },
          {
            type: "mrkdwn",
            text: `*Change*\n${changeText}`,
          },
        ],
      },
    ];

    if (update.url) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Dashboard",
            },
            url: update.url,
            action_id: "view_dashboard",
          },
        ],
      });
    }

    return this.sendMessage(brandId, {
      text: `GEO Score: ${update.previousScore} → ${update.currentScore} (${changeText})`,
      blocks,
    });
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(
    brandId: string,
    summary: {
      geoScore: number;
      geoChange: number;
      completedRecommendations: number;
      pendingRecommendations: number;
      mentionsChange: number;
      topPlatform: string;
      url?: string;
    }
  ): Promise<SlackMessage> {
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":bar_chart: Weekly GEO Summary",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*GEO Score*\n${summary.geoScore} (${summary.geoChange > 0 ? "+" : ""}${summary.geoChange})`,
          },
          {
            type: "mrkdwn",
            text: `*AI Mentions*\n${summary.mentionsChange > 0 ? "+" : ""}${summary.mentionsChange}`,
          },
          {
            type: "mrkdwn",
            text: `*Completed Tasks*\n${summary.completedRecommendations}`,
          },
          {
            type: "mrkdwn",
            text: `*Pending Tasks*\n${summary.pendingRecommendations}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Top performing platform: *${summary.topPlatform}*`,
          },
        ],
      },
    ];

    if (summary.url) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Full Report",
            },
            url: summary.url,
            action_id: "view_report",
          },
        ],
      });
    }

    return this.sendMessage(brandId, {
      text: `Weekly GEO Summary: Score ${summary.geoScore}, ${summary.completedRecommendations} tasks completed`,
      blocks,
    });
  }

  /**
   * Get sent messages
   */
  getSentMessages(brandId: string): SlackMessage[] {
    const connection = this.getConnection(brandId);
    if (!connection) return [];

    return Array.from(this.sentMessages.values())
      .filter((m) => m.channelId === connection.selectedChannelId)
      .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
  }
}

// Singleton instance
export const slackManager = new SlackManager();

/**
 * Format connection for API response
 */
export function formatSlackConnectionResponse(connection: SlackConnection) {
  return {
    id: connection.id,
    teamName: connection.teamName,
    status: connection.status,
    selectedChannel: connection.selectedChannelId
      ? {
          id: connection.selectedChannelId,
          name: connection.selectedChannelName,
        }
      : null,
    connectedAt: connection.createdAt.toISOString(),
  };
}

/**
 * Format message for API response
 */
export function formatSlackMessageResponse(message: SlackMessage) {
  return {
    id: message.id,
    channelId: message.channelId,
    timestamp: message.timestamp,
    text: message.text,
    hasBlocks: !!message.blocks?.length,
    threadTs: message.threadTs || null,
    postedAt: message.postedAt.toISOString(),
  };
}
