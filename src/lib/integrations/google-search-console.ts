/**
 * Google Search Console Integration (F123)
 * OAuth2 flow to connect GSC property and fetch search data
 */

import { createId } from "@paralleldrive/cuid2";

// GSC types
export interface GSCConnection {
  id: string;
  brandId: string;
  siteUrl: string;
  permissionLevel: "siteOwner" | "siteFullUser" | "siteRestrictedUser" | "siteUnverifiedUser";
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  status: "connected" | "disconnected" | "expired" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GSCSearchAnalytics {
  rows: GSCSearchRow[];
  responseAggregationType: string;
}

export interface GSCSearchRow {
  keys: string[]; // dimension values
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCQueryPerformance {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPagePerformance {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCCountryPerformance {
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCDevicePerformance {
  device: "DESKTOP" | "MOBILE" | "TABLET";
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCIndexingStatus {
  url: string;
  coverageState: "SUBMITTED_AND_INDEXED" | "DUPLICATE" | "EXCLUDED" | "NOT_SUBMITTED";
  lastCrawlTime?: string;
  indexingState: "INDEXING_STATE_UNSPECIFIED" | "INDEXED" | "NOT_INDEXED";
  referringUrls?: string[];
}

// GSC OAuth configuration
const GSC_OAUTH_CONFIG = {
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  apiUrl: "https://searchconsole.googleapis.com/webmasters/v3",
  scopes: [
    "https://www.googleapis.com/auth/webmasters.readonly",
  ],
};

/**
 * Google Search Console Manager
 */
export class GoogleSearchConsoleManager {
  private connections: Map<string, GSCConnection> = new Map();
  private byBrand: Map<string, string> = new Map();

  constructor(
    private clientId: string = process.env.GOOGLE_CLIENT_ID || "",
    private clientSecret: string = process.env.GOOGLE_CLIENT_SECRET || "",
    private callbackUrl: string = process.env.GOOGLE_SEARCH_CONSOLE_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: "code",
      scope: GSC_OAUTH_CONFIG.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state: `${brandId}:${state}`,
    });

    return `${GSC_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(GSC_OAUTH_CONFIG.tokenUrl, {
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
    const response = await fetch(GSC_OAUTH_CONFIG.tokenUrl, {
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
   * Get verified sites
   */
  async getSites(accessToken: string): Promise<GSCSite[]> {
    const response = await fetch(`${GSC_OAUTH_CONFIG.apiUrl}/sites`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Failed to get sites: ${data.error.message}`);
    }

    return (data.siteEntry || []).map((s: Record<string, unknown>) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
    }));
  }

  /**
   * Create connection after OAuth flow
   */
  createConnection(
    brandId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    siteUrl: string,
    permissionLevel: GSCConnection["permissionLevel"]
  ): GSCConnection {
    const connection: GSCConnection = {
      id: createId(),
      brandId,
      siteUrl,
      permissionLevel,
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
  getConnection(brandId: string): GSCConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect GSC
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
  private async getValidConnection(brandId: string): Promise<GSCConnection> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No GSC connection found");
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
   * Run search analytics query
   */
  async searchAnalytics(
    brandId: string,
    options: {
      startDate: string;
      endDate: string;
      dimensions?: ("query" | "page" | "country" | "device" | "date")[];
      dimensionFilterGroups?: Record<string, unknown>[];
      rowLimit?: number;
      startRow?: number;
      aggregationType?: "auto" | "byPage" | "byProperty";
    }
  ): Promise<GSCSearchAnalytics> {
    const connection = await this.getValidConnection(brandId);

    const body: Record<string, unknown> = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions || [],
      rowLimit: options.rowLimit || 1000,
      startRow: options.startRow || 0,
    };

    if (options.dimensionFilterGroups) {
      body.dimensionFilterGroups = options.dimensionFilterGroups;
    }

    if (options.aggregationType) {
      body.aggregationType = options.aggregationType;
    }

    const encodedSiteUrl = encodeURIComponent(connection.siteUrl);
    const response = await fetch(
      `${GSC_OAUTH_CONFIG.apiUrl}/sites/${encodedSiteUrl}/searchAnalytics/query`,
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
      throw new Error(`Search analytics failed: ${data.error.message}`);
    }

    return {
      rows: (data.rows || []).map((row: Record<string, unknown>) => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })),
      responseAggregationType: data.responseAggregationType || "auto",
    };
  }

  /**
   * Get top queries
   */
  async getTopQueries(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 20
  ): Promise<GSCQueryPerformance[]> {
    // Convert relative dates to actual dates if needed
    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    const data = await this.searchAnalytics(brandId, {
      startDate: start,
      endDate: end,
      dimensions: ["query"],
      rowLimit: limit,
    });

    return data.rows.map((row) => ({
      query: row.keys[0] || "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get top pages
   */
  async getTopPages(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 20
  ): Promise<GSCPagePerformance[]> {
    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    const data = await this.searchAnalytics(brandId, {
      startDate: start,
      endDate: end,
      dimensions: ["page"],
      rowLimit: limit,
    });

    return data.rows.map((row) => ({
      page: row.keys[0] || "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get performance by country
   */
  async getCountryPerformance(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 10
  ): Promise<GSCCountryPerformance[]> {
    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    const data = await this.searchAnalytics(brandId, {
      startDate: start,
      endDate: end,
      dimensions: ["country"],
      rowLimit: limit,
    });

    return data.rows.map((row) => ({
      country: row.keys[0] || "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get performance by device
   */
  async getDevicePerformance(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today"
  ): Promise<GSCDevicePerformance[]> {
    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    const data = await this.searchAnalytics(brandId, {
      startDate: start,
      endDate: end,
      dimensions: ["device"],
    });

    return data.rows.map((row) => ({
      device: row.keys[0] as GSCDevicePerformance["device"],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get brand queries (queries containing brand name)
   */
  async getBrandQueries(
    brandId: string,
    brandName: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 50
  ): Promise<GSCQueryPerformance[]> {
    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    const data = await this.searchAnalytics(brandId, {
      startDate: start,
      endDate: end,
      dimensions: ["query"],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "query",
              operator: "contains",
              expression: brandName.toLowerCase(),
            },
          ],
        },
      ],
      rowLimit: limit,
    });

    return data.rows.map((row) => ({
      query: row.keys[0] || "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get AI-related queries (queries mentioning AI assistants)
   */
  async getAIRelatedQueries(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today",
    limit: number = 50
  ): Promise<GSCQueryPerformance[]> {
    const aiTerms = ["chatgpt", "claude", "gemini", "perplexity", "ai", "gpt", "copilot"];
    const allQueries: GSCQueryPerformance[] = [];

    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    for (const term of aiTerms) {
      try {
        const data = await this.searchAnalytics(brandId, {
          startDate: start,
          endDate: end,
          dimensions: ["query"],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: "query",
                  operator: "contains",
                  expression: term,
                },
              ],
            },
          ],
          rowLimit: 10,
        });

        const queries = data.rows.map((row) => ({
          query: row.keys[0] || "",
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }));

        allQueries.push(...queries);
      } catch {
        // Continue if one query fails
      }
    }

    // Dedupe and sort by impressions
    const uniqueQueries = Array.from(
      new Map(allQueries.map((q) => [q.query, q])).values()
    );

    return uniqueQueries
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limit);
  }

  /**
   * Get daily performance trend
   */
  async getDailyTrend(
    brandId: string,
    startDate: string = "30daysAgo",
    endDate: string = "today"
  ): Promise<
    Array<{
      date: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>
  > {
    const start = this.resolveDate(startDate);
    const end = this.resolveDate(endDate);

    const data = await this.searchAnalytics(brandId, {
      startDate: start,
      endDate: end,
      dimensions: ["date"],
    });

    return data.rows
      .map((row) => ({
        date: row.keys[0] || "",
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Resolve relative date to YYYY-MM-DD format
   */
  private resolveDate(dateStr: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    const now = new Date();

    if (dateStr === "today") {
      return now.toISOString().split("T")[0];
    }

    const match = dateStr.match(/^(\d+)daysAgo$/);
    if (match) {
      const daysAgo = parseInt(match[1]);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    }

    return dateStr;
  }
}

// Singleton instance
export const gscManager = new GoogleSearchConsoleManager();

/**
 * Format connection for API response
 */
export function formatGSCConnectionResponse(connection: GSCConnection) {
  return {
    id: connection.id,
    siteUrl: connection.siteUrl,
    permissionLevel: connection.permissionLevel,
    status: connection.status,
    connectedAt: connection.createdAt.toISOString(),
  };
}
