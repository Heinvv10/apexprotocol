/**
 * Linear Integration (F125)
 * OAuth flow and issue creation for Linear
 */

import { createId } from "@paralleldrive/cuid2";

// Linear types
export interface LinearConnection {
  id: string;
  brandId: string;
  accessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
  selectedTeamId?: string;
  selectedTeamName?: string;
  selectedProjectId?: string;
  selectedProjectName?: string;
  status: "connected" | "disconnected" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  state: string;
  progress: number;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url: string;
  priority: number;
  priorityLabel: string;
  state: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  labels: LinearLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearWorkflowState {
  id: string;
  name: string;
  color: string;
  type: "backlog" | "unstarted" | "started" | "completed" | "canceled";
}

export interface CreateIssueParams {
  title: string;
  description?: string;
  priority?: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  stateId?: string;
  labelIds?: string[];
  projectId?: string;
  assigneeId?: string;
  dueDate?: string;
}

// Linear OAuth configuration
const LINEAR_CONFIG = {
  authUrl: "https://linear.app/oauth/authorize",
  tokenUrl: "https://api.linear.app/oauth/token",
  apiUrl: "https://api.linear.app/graphql",
};

/**
 * Linear Integration Manager
 */
export class LinearManager {
  private connections: Map<string, LinearConnection> = new Map();
  private byBrand: Map<string, string> = new Map();
  private linkedIssues: Map<string, string> = new Map(); // recommendationId -> issueId

  constructor(
    private clientId: string = process.env.LINEAR_CLIENT_ID || "",
    private clientSecret: string = process.env.LINEAR_CLIENT_SECRET || "",
    private callbackUrl: string = process.env.LINEAR_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: "code",
      scope: "read,write,issues:create",
      state: `${brandId}:${state}`,
      prompt: "consent",
    });

    return `${LINEAR_CONFIG.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn?: number;
    scope: string;
  }> {
    const response = await fetch(LINEAR_CONFIG.tokenUrl, {
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
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Execute GraphQL query
   */
  private async graphql<T>(accessToken: string, query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(LINEAR_CONFIG.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  /**
   * Get viewer info (current user)
   */
  async getViewer(accessToken: string): Promise<{
    id: string;
    name: string;
    email: string;
    organization: { id: string; name: string };
  }> {
    const query = `
      query {
        viewer {
          id
          name
          email
          organization {
            id
            name
          }
        }
      }
    `;

    const data = await this.graphql<{ viewer: { id: string; name: string; email: string; organization: { id: string; name: string } } }>(accessToken, query);
    return data.viewer;
  }

  /**
   * Create connection after OAuth
   */
  async createConnection(brandId: string, accessToken: string): Promise<LinearConnection> {
    const viewer = await this.getViewer(accessToken);

    const connection: LinearConnection = {
      id: createId(),
      brandId,
      accessToken,
      userId: viewer.id,
      userName: viewer.name,
      userEmail: viewer.email,
      organizationId: viewer.organization.id,
      organizationName: viewer.organization.name,
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
  getConnection(brandId: string): LinearConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect Linear
   */
  disconnect(brandId: string): boolean {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return false;

    this.connections.delete(connectionId);
    this.byBrand.delete(brandId);
    return true;
  }

  /**
   * Get teams
   */
  async getTeams(brandId: string): Promise<LinearTeam[]> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No Linear connection found");
    }

    const query = `
      query {
        teams {
          nodes {
            id
            name
            key
            description
            icon
            color
          }
        }
      }
    `;

    const data = await this.graphql<{ teams: { nodes: Array<{ id: string; name: string; key: string; description?: string; icon?: string; color?: string }> } }>(connection.accessToken, query);
    return data.teams.nodes.map((t) => ({
      id: t.id,
      name: t.name,
      key: t.key,
      description: t.description,
      icon: t.icon,
      color: t.color,
    }));
  }

  /**
   * Select team
   */
  selectTeam(brandId: string, teamId: string, teamName: string): LinearConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedTeamId = teamId;
    connection.selectedTeamName = teamName;
    connection.selectedProjectId = undefined;
    connection.selectedProjectName = undefined;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Get projects for team
   */
  async getProjects(brandId: string): Promise<LinearProject[]> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedTeamId) {
      throw new Error("No team selected");
    }

    const query = `
      query($teamId: String!) {
        team(id: $teamId) {
          projects {
            nodes {
              id
              name
              description
              icon
              color
              state
              progress
            }
          }
        }
      }
    `;

    const data = await this.graphql<{ team: { projects: { nodes: Array<{ id: string; name: string; description?: string; icon?: string; color?: string; state: string; progress: number }> } } }>(
      connection.accessToken,
      query,
      { teamId: connection.selectedTeamId }
    );

    return data.team.projects.nodes.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      color: p.color,
      state: p.state,
      progress: p.progress,
    }));
  }

  /**
   * Select project
   */
  selectProject(brandId: string, projectId: string, projectName: string): LinearConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedProjectId = projectId;
    connection.selectedProjectName = projectName;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Get workflow states for team
   */
  async getWorkflowStates(brandId: string): Promise<LinearWorkflowState[]> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedTeamId) {
      throw new Error("No team selected");
    }

    const query = `
      query($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              color
              type
            }
          }
        }
      }
    `;

    const data = await this.graphql<{ team: { states: { nodes: Array<{ id: string; name: string; color: string; type: "backlog" | "unstarted" | "started" | "completed" | "canceled" }> } } }>(
      connection.accessToken,
      query,
      { teamId: connection.selectedTeamId }
    );

    return data.team.states.nodes.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      type: s.type,
    }));
  }

  /**
   * Get labels for team
   */
  async getLabels(brandId: string): Promise<LinearLabel[]> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedTeamId) {
      throw new Error("No team selected");
    }

    const query = `
      query($teamId: String!) {
        team(id: $teamId) {
          labels {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    `;

    const data = await this.graphql<{ team: { labels: { nodes: Array<{ id: string; name: string; color: string }> } } }>(
      connection.accessToken,
      query,
      { teamId: connection.selectedTeamId }
    );

    return data.team.labels.nodes.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
    }));
  }

  /**
   * Create issue
   */
  async createIssue(brandId: string, params: CreateIssueParams): Promise<LinearIssue> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedTeamId) {
      throw new Error("No team selected");
    }

    const mutation = `
      mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            url
            priority
            priorityLabel
            state {
              id
              name
              color
              type
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const input: Record<string, unknown> = {
      teamId: connection.selectedTeamId,
      title: params.title,
      description: params.description || "",
    };

    if (params.priority !== undefined) input.priority = params.priority;
    if (params.stateId) input.stateId = params.stateId;
    if (params.labelIds?.length) input.labelIds = params.labelIds;
    if (params.projectId || connection.selectedProjectId) {
      input.projectId = params.projectId || connection.selectedProjectId;
    }
    if (params.assigneeId) input.assigneeId = params.assigneeId;
    if (params.dueDate) input.dueDate = params.dueDate;

    interface IssueCreateResponse {
      issueCreate: {
        success: boolean;
        issue: {
          id: string;
          identifier: string;
          title: string;
          description?: string;
          url: string;
          priority: number;
          priorityLabel: string;
          state: { id: string; name: string; color: string; type: string };
          labels: { nodes: Array<{ id: string; name: string; color: string }> };
          createdAt: string;
          updatedAt: string;
        };
      };
    }

    const data = await this.graphql<IssueCreateResponse>(
      connection.accessToken,
      mutation,
      { input }
    );

    if (!data.issueCreate.success) {
      throw new Error("Failed to create issue");
    }

    const issue = data.issueCreate.issue;
    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      url: issue.url,
      priority: issue.priority,
      priorityLabel: issue.priorityLabel,
      state: {
        id: issue.state.id,
        name: issue.state.name,
        color: issue.state.color,
        type: issue.state.type,
      },
      labels: (issue.labels?.nodes || []).map((l) => ({
        id: l.id,
        name: l.name,
        color: l.color,
      })),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
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
  ): Promise<LinearIssue> {
    // Map recommendation priority to Linear priority
    const priorityMap: Record<string, number> = {
      critical: 1, // Urgent
      high: 2,
      medium: 3,
      low: 4,
    };

    const linearPriority = priorityMap[recommendation.priority.toLowerCase()] || 3;

    const description = `**Priority:** ${recommendation.priority}
**Category:** ${recommendation.category}

${recommendation.description}

---
Created from Apex GEO recommendation: ${recommendation.id}`;

    const issue = await this.createIssue(brandId, {
      title: `[GEO] ${recommendation.title}`,
      description,
      priority: linearPriority,
    });

    // Link recommendation to issue
    this.linkedIssues.set(recommendation.id, issue.id);

    return issue;
  }

  /**
   * Get linked issue for recommendation
   */
  getLinkedIssue(recommendationId: string): string | undefined {
    return this.linkedIssues.get(recommendationId);
  }
}

// Singleton instance
export const linearManager = new LinearManager();

/**
 * Format connection for API response
 */
export function formatLinearConnectionResponse(connection: LinearConnection) {
  return {
    id: connection.id,
    user: {
      id: connection.userId,
      name: connection.userName,
      email: connection.userEmail,
    },
    organization: {
      id: connection.organizationId,
      name: connection.organizationName,
    },
    status: connection.status,
    selectedTeam: connection.selectedTeamId
      ? {
          id: connection.selectedTeamId,
          name: connection.selectedTeamName,
        }
      : null,
    selectedProject: connection.selectedProjectId
      ? {
          id: connection.selectedProjectId,
          name: connection.selectedProjectName,
        }
      : null,
    connectedAt: connection.createdAt.toISOString(),
  };
}
