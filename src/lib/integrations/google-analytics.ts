/**
 * Google Analytics Integration (F122)
 * OAuth2 flow to connect GA4 property and fetch metrics
 */

import { createId } from "@paralleldrive/cuid2";

// GA types
export interface GAConnection {
  id: string;
  brandId: string;
  accountId: string;
  accountName: string;
  propertyId: string;
  propertyName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  status: "connected" | "disconnected" | "expired" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface GAAccount {
  id: string;
  name: string;
  createTime: string;
  updateTime: string;
}

export interface GAProperty {
  id: string;
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
  industryCategory?: string;
  timeZone: string;
  currencyCode: string;
}

export interface GAMetrics {
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  engagementRate: number;
}

export interface GATrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  engagementRate: number;
}

export interface GAPagePerformance {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  entrances: number;
  exits: number;
}

// Internal type for GA report response
interface GAReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value: string }>;
    metricValues?: Array<{ value: string }>;
  }>;
  error?: { message: string };
}

// GA OAuth configuration
const GA_OAUTH_CONFIG = {
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  analyticsDataApiUrl: "https://analyticsdata.googleapis.com/v1beta",
  analyticsAdminApiUrl: "https://analyticsadmin.googleapis.com/v1beta",
  scopes: [
    "https://www.googleapis.com/auth/analytics.readonly",
  ],
};

/**
 * Google Analytics Manager
 */
export class GoogleAnalyticsManager {
  private connections: Map<string, GAConnection> = new Map();
  private byBrand: Map<string, string> = new Map();

  constructor(
    private clientId: string = process.env.GOOGLE_CLIENT_ID || "",
    private clientSecret: string = process.env.GOOGLE_CLIENT_SECRET || "",
    private callbackUrl: string = process.env.GOOGLE_ANALYTICS_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: "code",
      scope: GA_OAUTH_CONFIG.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state: `${brandId}:${state}`,
    });

    return `${GA_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(GA_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.callbackUrl,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Token exchange failed: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(GA_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get GA4 accounts
   */
  async getAccounts(accessToken: string): Promise<GAAccount[]> {
    const response = await fetch(
      `${GA_OAUTH_CONFIG.analyticsAdminApiUrl}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(`Failed to get accounts: ${data.error.message}`);
    }

    return (data.accounts || []).map((a: Record<string, unknown>) => ({
      id: (a.name as string).split("/").pop(),
      name: a.displayName as string,
      createTime: a.createTime as string,
      updateTime: a.updateTime as string,
    }));
  }

  /**
   * Get GA4 properties for account
   */
  async getProperties(accessToken: string, accountId: string): Promise<GAProperty[]> {
    const response = await fetch(
      `${GA_OAUTH_CONFIG.analyticsAdminApiUrl}/properties?filter=parent:accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(`Failed to get properties: ${data.error.message}`);
    }

    return (data.properties || []).map((p: Record<string, unknown>) => ({
      id: (p.name as string).split("/").pop(),
      name: p.name as string,
      displayName: p.displayName as string,
      createTime: p.createTime as string,
      updateTime: p.updateTime as string,
      industryCategory: p.industryCategory as string | undefined,
      timeZone: p.timeZone as string,
      currencyCode: p.currencyCode as string,
    }));
  }

  /**
   * Create connection after OAuth flow
   */
  async createConnection(
    brandId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    accountId: string,
    accountName: string,
    propertyId: string,
    propertyName: string
  ): Promise<GAConnection> {
    const connection: GAConnection = {
      id: createId(),
      brandId,
      accountId,
      accountName,
      propertyId,
      propertyName,
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
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
  getConnection(brandId: string): GAConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect GA
   */
  disconnect(brandId: string): boolean {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return false;

    this.connections.delete(connectionId);
    this.byBrand.delete(brandId);
    return true;
  }

  /**
   * Get valid connection (refresh if needed)
   */
  private async getValidConnection(brandId: string): Promise<GAConnection> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No GA connection found");
    }

    // Check if token needs refresh
    if (new Date() >= connection.tokenExpiresAt) {
      const tokens = await this.refreshAccessToken(connection.refreshToken);
      connection.accessToken = tokens.accessToken;
      connection.tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      connection.updatedAt = new Date();
      this.connections.set(connection.id, connection);
    }

    return connection;
  }

  /**
   * Run GA4 report
   */
  async runReport(
    brandId: string,
    options: {
      startDate: string;
      endDate: string;
      dimensions?: string[];
      metrics: string[];
      limit?: number;
    }
  ): Promise<GAReportResponse> {
    const connection = await this.getValidConnection(brandId);

    const body = {
      dateRanges: [{ startDate: options.startDate, endDate: options.endDate }],
      dimensions: (options.dimensions || []).map((d) => ({ name: d })),
      metrics: options.metrics.map((m) => ({ name: m })),
      limit: options.limit || 10000,
    };

    const response = await fetch(
      `${GA_OAUTH_CONFIG.analyticsDataApiUrl}/properties/${connection.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(`Report failed: ${data.error.message}`);
    }

    return data;
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today"
  ): Promise<GAMetrics> {
    const data = await this.runReport(brandId, {
      startDate,
      endDate,
      metrics: [
        "sessions",
        "totalUsers",
        "newUsers",
        "screenPageViews",
        "averageSessionDuration",
        "bounceRate",
        "engagementRate",
      ],
    });

    const row = data.rows?.[0]?.metricValues || [];
    return {
      sessions: parseInt(row[0]?.value || "0"),
      users: parseInt(row[1]?.value || "0"),
      newUsers: parseInt(row[2]?.value || "0"),
      pageViews: parseInt(row[3]?.value || "0"),
      avgSessionDuration: parseFloat(row[4]?.value || "0"),
      bounceRate: parseFloat(row[5]?.value || "0"),
      engagementRate: parseFloat(row[6]?.value || "0"),
    };
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 10
  ): Promise<GATrafficSource[]> {
    const data = await this.runReport(brandId, {
      startDate,
      endDate,
      dimensions: ["sessionSource", "sessionMedium"],
      metrics: ["sessions", "totalUsers", "newUsers", "engagementRate"],
      limit,
    });

    return (data.rows || []).map((row: Record<string, unknown>) => ({
      source: (row.dimensionValues as Record<string, unknown>[])?.[0]?.value as string || "(direct)",
      medium: (row.dimensionValues as Record<string, unknown>[])?.[1]?.value as string || "(none)",
      sessions: parseInt((row.metricValues as Record<string, unknown>[])?.[0]?.value as string || "0"),
      users: parseInt((row.metricValues as Record<string, unknown>[])?.[1]?.value as string || "0"),
      newUsers: parseInt((row.metricValues as Record<string, unknown>[])?.[2]?.value as string || "0"),
      engagementRate: parseFloat((row.metricValues as Record<string, unknown>[])?.[3]?.value as string || "0"),
    }));
  }

  /**
   * Get page performance
   */
  async getPagePerformance(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 20
  ): Promise<GAPagePerformance[]> {
    const data = await this.runReport(brandId, {
      startDate,
      endDate,
      dimensions: ["pagePath", "pageTitle"],
      metrics: [
        "screenPageViews",
        "averageSessionDuration",
        "bounceRate",
        "entrances",
        "exits",
      ],
      limit,
    });

    return (data.rows || []).map((row: Record<string, unknown>) => ({
      pagePath: (row.dimensionValues as Record<string, unknown>[])?.[0]?.value as string || "/",
      pageTitle: (row.dimensionValues as Record<string, unknown>[])?.[1]?.value as string || "",
      pageViews: parseInt((row.metricValues as Record<string, unknown>[])?.[0]?.value as string || "0"),
      avgTimeOnPage: parseFloat((row.metricValues as Record<string, unknown>[])?.[1]?.value as string || "0"),
      bounceRate: parseFloat((row.metricValues as Record<string, unknown>[])?.[2]?.value as string || "0"),
      entrances: parseInt((row.metricValues as Record<string, unknown>[])?.[3]?.value as string || "0"),
      exits: parseInt((row.metricValues as Record<string, unknown>[])?.[4]?.value as string || "0"),
    }));
  }

  /**
   * Get AI referral traffic (from AI platforms)
   */
  async getAIReferralTraffic(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today"
  ): Promise<GATrafficSource[]> {
    const data = await this.runReport(brandId, {
      startDate,
      endDate,
      dimensions: ["sessionSource", "sessionMedium"],
      metrics: ["sessions", "totalUsers", "newUsers", "engagementRate"],
    });

    // Filter for AI-related referrers
    const aiSources = [
      "chatgpt",
      "openai",
      "claude",
      "anthropic",
      "perplexity",
      "gemini",
      "google-ai",
      "bing-copilot",
      "copilot",
    ];

    return (data.rows || [])
      .filter((row: Record<string, unknown>) => {
        const dimValues = row.dimensionValues as Record<string, unknown>[];
        const source = ((dimValues?.[0]?.value as string) || "").toLowerCase();
        return aiSources.some((ai) => source.includes(ai));
      })
      .map((row: Record<string, unknown>) => ({
        source: (row.dimensionValues as Record<string, unknown>[])?.[0]?.value as string || "(direct)",
        medium: (row.dimensionValues as Record<string, unknown>[])?.[1]?.value as string || "(none)",
        sessions: parseInt((row.metricValues as Record<string, unknown>[])?.[0]?.value as string || "0"),
        users: parseInt((row.metricValues as Record<string, unknown>[])?.[1]?.value as string || "0"),
        newUsers: parseInt((row.metricValues as Record<string, unknown>[])?.[2]?.value as string || "0"),
        engagementRate: parseFloat((row.metricValues as Record<string, unknown>[])?.[3]?.value as string || "0"),
      }));
  }
}

// Singleton instance
export const gaManager = new GoogleAnalyticsManager();

/**
 * Format connection for API response
 */
export function formatGAConnectionResponse(connection: GAConnection) {
  return {
    id: connection.id,
    accountName: connection.accountName,
    propertyName: connection.propertyName,
    propertyId: connection.propertyId,
    status: connection.status,
    connectedAt: connection.createdAt.toISOString(),
  };
}
