/**
 * Jira Integration (F117-F119)
 * OAuth2 flow, issue creation, and bi-directional sync
 */

import { createId } from "@paralleldrive/cuid2";

// Jira types
export interface JiraConnection {
  id: string;
  brandId: string;
  cloudId: string;
  siteUrl: string;
  siteName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  scopes: string[];
  selectedProjectId?: string;
  selectedProjectKey?: string;
  status: "connected" | "disconnected" | "expired" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrl?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: JiraIssueStatus;
  priority: JiraPriority;
  issueType: string;
  projectId: string;
  projectKey: string;
  assignee?: JiraUser;
  reporter?: JiraUser;
  labels: string[];
  created: Date;
  updated: Date;
  resolutionDate?: Date;
}

export interface JiraIssueStatus {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string; // 'new' | 'indeterminate' | 'done'
    name: string;
  };
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
}

export interface JiraWebhook {
  id: string;
  brandId: string;
  connectionId: string;
  webhookId: string;
  events: string[];
  url: string;
  createdAt: Date;
}

export interface CreateIssueParams {
  projectId: string;
  summary: string;
  description: string;
  issueType?: string;
  priority?: string;
  labels?: string[];
  customFields?: Record<string, unknown>;
}

// Jira OAuth configuration
const JIRA_OAUTH_CONFIG = {
  authorizationUrl: "https://auth.atlassian.com/authorize",
  tokenUrl: "https://auth.atlassian.com/oauth/token",
  apiUrl: "https://api.atlassian.com",
  scopes: [
    "read:jira-work",
    "write:jira-work",
    "manage:jira-project",
    "read:jira-user",
    "offline_access",
  ],
};

/**
 * Jira Integration Manager
 */
export class JiraManager {
  private connections: Map<string, JiraConnection> = new Map();
  private byBrand: Map<string, string> = new Map();
  private webhooks: Map<string, JiraWebhook> = new Map();
  private linkedIssues: Map<string, string> = new Map(); // recommendationId -> issueKey

  constructor(
    private clientId: string = process.env.JIRA_CLIENT_ID || "",
    private clientSecret: string = process.env.JIRA_CLIENT_SECRET || "",
    private callbackUrl: string = process.env.JIRA_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: this.clientId,
      scope: JIRA_OAUTH_CONFIG.scopes.join(" "),
      redirect_uri: this.callbackUrl,
      state: `${brandId}:${state}`,
      response_type: "code",
      prompt: "consent",
    });

    return `${JIRA_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    scope: string;
  }> {
    const response = await fetch(JIRA_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(JIRA_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get accessible resources (Jira sites)
   */
  async getAccessibleResources(accessToken: string): Promise<
    Array<{
      id: string;
      url: string;
      name: string;
      scopes: string[];
      avatarUrl?: string;
    }>
  > {
    const response = await fetch(
      `${JIRA_OAUTH_CONFIG.apiUrl}/oauth/token/accessible-resources`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get accessible resources: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create connection after OAuth flow
   */
  async createConnection(
    brandId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    scopes: string[]
  ): Promise<JiraConnection> {
    // Get accessible sites
    const resources = await this.getAccessibleResources(accessToken);

    if (resources.length === 0) {
      throw new Error("No accessible Jira sites found");
    }

    // Use first site (or could allow user to select)
    const site = resources[0];

    const connection: JiraConnection = {
      id: createId(),
      brandId,
      cloudId: site.id,
      siteUrl: site.url,
      siteName: site.name,
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes,
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
  getConnection(brandId: string): JiraConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect Jira
   */
  disconnect(brandId: string): boolean {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return false;

    this.connections.delete(connectionId);
    this.byBrand.delete(brandId);

    // Remove webhooks
    for (const [id, webhook] of this.webhooks) {
      if (webhook.connectionId === connectionId) {
        this.webhooks.delete(id);
      }
    }

    return true;
  }

  /**
   * Get projects
   */
  async getProjects(brandId: string): Promise<JiraProject[]> {
    const connection = await this.getValidConnection(brandId);

    const response = await fetch(
      `${JIRA_OAUTH_CONFIG.apiUrl}/ex/jira/${connection.cloudId}/rest/api/3/project/search`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values.map((p: any) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      projectTypeKey: p.projectTypeKey,
      avatarUrl: p.avatarUrls?.["48x48"],
    }));
  }

  /**
   * Set selected project
   */
  selectProject(brandId: string, projectId: string, projectKey: string): JiraConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedProjectId = projectId;
    connection.selectedProjectKey = projectKey;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Create issue
   */
  async createIssue(brandId: string, params: CreateIssueParams): Promise<JiraIssue> {
    const connection = await this.getValidConnection(brandId);

    // Get issue types for project
    const issueType = params.issueType || "Task";

    const body = {
      fields: {
        project: { id: params.projectId },
        summary: params.summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: params.description }],
            },
          ],
        },
        issuetype: { name: issueType },
        ...(params.priority && { priority: { name: params.priority } }),
        ...(params.labels && { labels: params.labels }),
        ...params.customFields,
      },
    };

    const response = await fetch(
      `${JIRA_OAUTH_CONFIG.apiUrl}/ex/jira/${connection.cloudId}/rest/api/3/issue`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create issue: ${error}`);
    }

    const data = await response.json();
    return this.getIssue(brandId, data.key);
  }

  /**
   * Create issue from recommendation
   */
  async createIssueFromRecommendation(
    brandId: string,
    recommendation: {
      id: string;
      title: string;
      description: string;
      priority: string;
      category: string;
    }
  ): Promise<JiraIssue> {
    const connection = this.getConnection(brandId);
    if (!connection?.selectedProjectId) {
      throw new Error("No project selected");
    }

    // Map recommendation priority to Jira priority
    const priorityMap: Record<string, string> = {
      critical: "Highest",
      high: "High",
      medium: "Medium",
      low: "Low",
    };

    const issue = await this.createIssue(brandId, {
      projectId: connection.selectedProjectId,
      summary: `[GEO] ${recommendation.title}`,
      description: `${recommendation.description}\n\n---\nCreated from Apex GEO recommendation: ${recommendation.id}`,
      priority: priorityMap[recommendation.priority] || "Medium",
      labels: ["apex-geo", recommendation.category],
    });

    // Link recommendation to issue
    this.linkedIssues.set(recommendation.id, issue.key);

    return issue;
  }

  /**
   * Get issue
   */
  async getIssue(brandId: string, issueKey: string): Promise<JiraIssue> {
    const connection = await this.getValidConnection(brandId);

    const response = await fetch(
      `${JIRA_OAUTH_CONFIG.apiUrl}/ex/jira/${connection.cloudId}/rest/api/3/issue/${issueKey}`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get issue: ${response.statusText}`);
    }

    const data = await response.json();
    return this.mapIssueResponse(data);
  }

  /**
   * Register webhook for issue updates
   */
  async registerWebhook(brandId: string, webhookUrl: string): Promise<JiraWebhook> {
    const connection = await this.getValidConnection(brandId);

    const body = {
      name: "Apex GEO Sync",
      url: webhookUrl,
      events: [
        "jira:issue_created",
        "jira:issue_updated",
        "jira:issue_deleted",
      ],
      filters: {
        "issue-related-events-section": `project = ${connection.selectedProjectKey}`,
      },
      excludeBody: false,
    };

    const response = await fetch(
      `${JIRA_OAUTH_CONFIG.apiUrl}/ex/jira/${connection.cloudId}/rest/api/3/webhook`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to register webhook: ${response.statusText}`);
    }

    const data = await response.json();

    const webhook: JiraWebhook = {
      id: createId(),
      brandId,
      connectionId: connection.id,
      webhookId: data.id,
      events: body.events,
      url: webhookUrl,
      createdAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  /**
   * Process webhook event
   */
  processWebhookEvent(event: {
    webhookEvent: string;
    issue: any;
    changelog?: any;
  }): {
    type: "created" | "updated" | "deleted" | "status_changed";
    issueKey: string;
    recommendationId?: string;
    newStatus?: string;
    isCompleted?: boolean;
  } | null {
    const issueKey = event.issue?.key;
    if (!issueKey) return null;

    // Find linked recommendation
    let recommendationId: string | undefined;
    for (const [recId, key] of this.linkedIssues) {
      if (key === issueKey) {
        recommendationId = recId;
        break;
      }
    }

    switch (event.webhookEvent) {
      case "jira:issue_created":
        return { type: "created", issueKey, recommendationId };

      case "jira:issue_updated":
        // Check if status changed
        const statusChange = event.changelog?.items?.find(
          (item: any) => item.field === "status"
        );

        if (statusChange) {
          const newStatus = statusChange.toString;
          const statusCategory = event.issue.fields?.status?.statusCategory?.key;
          const isCompleted = statusCategory === "done";

          return {
            type: "status_changed",
            issueKey,
            recommendationId,
            newStatus,
            isCompleted,
          };
        }

        return { type: "updated", issueKey, recommendationId };

      case "jira:issue_deleted":
        // Unlink recommendation
        if (recommendationId) {
          this.linkedIssues.delete(recommendationId);
        }
        return { type: "deleted", issueKey, recommendationId };

      default:
        return null;
    }
  }

  /**
   * Get linked issue key for recommendation
   */
  getLinkedIssue(recommendationId: string): string | undefined {
    return this.linkedIssues.get(recommendationId);
  }

  /**
   * Get valid connection (refresh if needed)
   */
  private async getValidConnection(brandId: string): Promise<JiraConnection> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No Jira connection found");
    }

    // Check if token needs refresh
    if (new Date() >= connection.tokenExpiresAt) {
      const tokens = await this.refreshAccessToken(connection.refreshToken);
      connection.accessToken = tokens.accessToken;
      connection.refreshToken = tokens.refreshToken;
      connection.tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      connection.updatedAt = new Date();
      this.connections.set(connection.id, connection);
    }

    return connection;
  }

  /**
   * Map Jira API response to our type
   */
  private mapIssueResponse(data: any): JiraIssue {
    return {
      id: data.id,
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description?.content?.[0]?.content?.[0]?.text || "",
      status: {
        id: data.fields.status.id,
        name: data.fields.status.name,
        statusCategory: data.fields.status.statusCategory,
      },
      priority: {
        id: data.fields.priority?.id,
        name: data.fields.priority?.name || "Medium",
        iconUrl: data.fields.priority?.iconUrl,
      },
      issueType: data.fields.issuetype.name,
      projectId: data.fields.project.id,
      projectKey: data.fields.project.key,
      assignee: data.fields.assignee
        ? {
            accountId: data.fields.assignee.accountId,
            displayName: data.fields.assignee.displayName,
            emailAddress: data.fields.assignee.emailAddress,
            avatarUrl: data.fields.assignee.avatarUrls?.["48x48"],
          }
        : undefined,
      reporter: data.fields.reporter
        ? {
            accountId: data.fields.reporter.accountId,
            displayName: data.fields.reporter.displayName,
            emailAddress: data.fields.reporter.emailAddress,
            avatarUrl: data.fields.reporter.avatarUrls?.["48x48"],
          }
        : undefined,
      labels: data.fields.labels || [],
      created: new Date(data.fields.created),
      updated: new Date(data.fields.updated),
      resolutionDate: data.fields.resolutiondate
        ? new Date(data.fields.resolutiondate)
        : undefined,
    };
  }
}

// Singleton instance
export const jiraManager = new JiraManager();

/**
 * Format connection for API response
 */
export function formatJiraConnectionResponse(connection: JiraConnection) {
  return {
    id: connection.id,
    siteName: connection.siteName,
    siteUrl: connection.siteUrl,
    status: connection.status,
    selectedProject: connection.selectedProjectKey
      ? {
          id: connection.selectedProjectId,
          key: connection.selectedProjectKey,
        }
      : null,
    connectedAt: connection.createdAt.toISOString(),
  };
}
