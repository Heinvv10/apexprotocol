/**
 * Asana Integration (F126)
 * OAuth flow and task creation for Asana
 */

import { createId } from "@paralleldrive/cuid2";

// Asana types
export interface AsanaConnection {
  id: string;
  brandId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  userId: string;
  userName: string;
  userEmail: string;
  selectedWorkspaceId?: string;
  selectedWorkspaceName?: string;
  selectedProjectId?: string;
  selectedProjectName?: string;
  selectedSectionId?: string;
  selectedSectionName?: string;
  status: "connected" | "disconnected" | "expired" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  isOrganization: boolean;
}

export interface AsanaProject {
  gid: string;
  name: string;
  color?: string;
  archived: boolean;
  public: boolean;
}

export interface AsanaSection {
  gid: string;
  name: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  htmlNotes?: string;
  completed: boolean;
  dueOn?: string;
  dueAt?: string;
  startOn?: string;
  assignee?: {
    gid: string;
    name: string;
  };
  projects: Array<{ gid: string; name: string }>;
  memberships: Array<{
    project: { gid: string; name: string };
    section?: { gid: string; name: string };
  }>;
  tags: AsanaTag[];
  permalink_url: string;
  createdAt: string;
  modifiedAt: string;
}

export interface AsanaTag {
  gid: string;
  name: string;
  color?: string;
}

export interface AsanaUser {
  gid: string;
  name: string;
  email: string;
}

export interface CreateTaskParams {
  name: string;
  notes?: string;
  htmlNotes?: string;
  dueOn?: string;
  dueAt?: string;
  startOn?: string;
  assignee?: string;
  tags?: string[];
}

// Internal type for Asana API task response
interface AsanaTaskApiResponse {
  gid: string;
  name: string;
  notes?: string;
  html_notes?: string;
  completed: boolean;
  due_on?: string;
  due_at?: string;
  start_on?: string;
  assignee?: { gid: string; name: string };
  projects?: Array<{ gid: string; name: string }>;
  memberships?: Array<{
    project?: { gid: string; name: string };
    section?: { gid: string; name: string };
  }>;
  tags?: Array<{ gid: string; name: string; color?: string }>;
  permalink_url: string;
  created_at: string;
  modified_at: string;
}

// Asana OAuth configuration
const ASANA_CONFIG = {
  authUrl: "https://app.asana.com/-/oauth_authorize",
  tokenUrl: "https://app.asana.com/-/oauth_token",
  apiUrl: "https://app.asana.com/api/1.0",
};

/**
 * Asana Integration Manager
 */
export class AsanaManager {
  private connections: Map<string, AsanaConnection> = new Map();
  private byBrand: Map<string, string> = new Map();
  private linkedTasks: Map<string, string> = new Map(); // recommendationId -> taskId

  constructor(
    private clientId: string = process.env.ASANA_CLIENT_ID || "",
    private clientSecret: string = process.env.ASANA_CLIENT_SECRET || "",
    private callbackUrl: string = process.env.ASANA_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: "code",
      state: `${brandId}:${state}`,
    });

    return `${ASANA_CONFIG.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    userId: string;
    userName: string;
    userEmail: string;
  }> {
    const response = await fetch(ASANA_CONFIG.tokenUrl, {
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
      tokenType: data.token_type,
      userId: data.data.gid,
      userName: data.data.name,
      userEmail: data.data.email,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(ASANA_CONFIG.tokenUrl, {
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
   * Create connection after OAuth
   */
  createConnection(
    brandId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    userId: string,
    userName: string,
    userEmail: string
  ): AsanaConnection {
    const connection: AsanaConnection = {
      id: createId(),
      brandId,
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      userId,
      userName,
      userEmail,
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
  getConnection(brandId: string): AsanaConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect Asana
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
  private async getValidConnection(brandId: string): Promise<AsanaConnection> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No Asana connection found");
    }

    // Check if token needs refresh (5 min buffer)
    if (new Date(Date.now() + 5 * 60 * 1000) >= connection.tokenExpiresAt) {
      const tokens = await this.refreshAccessToken(connection.refreshToken);
      connection.accessToken = tokens.accessToken;
      connection.tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      connection.updatedAt = new Date();
      this.connections.set(connection.id, connection);
    }

    return connection;
  }

  /**
   * Make API request
   */
  private async apiRequest<T>(
    accessToken: string,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${ASANA_CONFIG.apiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify({ data: body });
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (data.errors) {
      throw new Error(`Asana API error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  /**
   * Get workspaces
   */
  async getWorkspaces(brandId: string): Promise<AsanaWorkspace[]> {
    const connection = await this.getValidConnection(brandId);

    const workspaces = await this.apiRequest<Array<{ gid: string; name: string; is_organization: boolean }>>(
      connection.accessToken,
      "/workspaces"
    );

    return workspaces.map((w) => ({
      gid: w.gid,
      name: w.name,
      isOrganization: w.is_organization,
    }));
  }

  /**
   * Select workspace
   */
  selectWorkspace(brandId: string, workspaceId: string, workspaceName: string): AsanaConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedWorkspaceId = workspaceId;
    connection.selectedWorkspaceName = workspaceName;
    connection.selectedProjectId = undefined;
    connection.selectedProjectName = undefined;
    connection.selectedSectionId = undefined;
    connection.selectedSectionName = undefined;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Get projects in workspace
   */
  async getProjects(brandId: string): Promise<AsanaProject[]> {
    const connection = await this.getValidConnection(brandId);
    if (!connection.selectedWorkspaceId) {
      throw new Error("No workspace selected");
    }

    const projects = await this.apiRequest<Array<{ gid: string; name: string; color?: string; archived: boolean; public: boolean }>>(
      connection.accessToken,
      `/workspaces/${connection.selectedWorkspaceId}/projects?opt_fields=name,color,archived,public`
    );

    return projects.map((p) => ({
      gid: p.gid,
      name: p.name,
      color: p.color,
      archived: p.archived,
      public: p.public,
    }));
  }

  /**
   * Select project
   */
  selectProject(brandId: string, projectId: string, projectName: string): AsanaConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedProjectId = projectId;
    connection.selectedProjectName = projectName;
    connection.selectedSectionId = undefined;
    connection.selectedSectionName = undefined;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Get sections in project
   */
  async getSections(brandId: string): Promise<AsanaSection[]> {
    const connection = await this.getValidConnection(brandId);
    if (!connection.selectedProjectId) {
      throw new Error("No project selected");
    }

    const sections = await this.apiRequest<Array<{ gid: string; name: string }>>(
      connection.accessToken,
      `/projects/${connection.selectedProjectId}/sections`
    );

    return sections.map((s) => ({
      gid: s.gid,
      name: s.name,
    }));
  }

  /**
   * Select section
   */
  selectSection(brandId: string, sectionId: string, sectionName: string): AsanaConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedSectionId = sectionId;
    connection.selectedSectionName = sectionName;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Get users in workspace
   */
  async getUsers(brandId: string): Promise<AsanaUser[]> {
    const connection = await this.getValidConnection(brandId);
    if (!connection.selectedWorkspaceId) {
      throw new Error("No workspace selected");
    }

    const users = await this.apiRequest<Array<{ gid: string; name: string; email: string }>>(
      connection.accessToken,
      `/workspaces/${connection.selectedWorkspaceId}/users?opt_fields=name,email`
    );

    return users.map((u) => ({
      gid: u.gid,
      name: u.name,
      email: u.email,
    }));
  }

  /**
   * Get tags in workspace
   */
  async getTags(brandId: string): Promise<AsanaTag[]> {
    const connection = await this.getValidConnection(brandId);
    if (!connection.selectedWorkspaceId) {
      throw new Error("No workspace selected");
    }

    const tags = await this.apiRequest<Array<{ gid: string; name: string; color?: string }>>(
      connection.accessToken,
      `/workspaces/${connection.selectedWorkspaceId}/tags?opt_fields=name,color`
    );

    return tags.map((t) => ({
      gid: t.gid,
      name: t.name,
      color: t.color,
    }));
  }

  /**
   * Create task
   */
  async createTask(brandId: string, params: CreateTaskParams): Promise<AsanaTask> {
    const connection = await this.getValidConnection(brandId);
    if (!connection.selectedProjectId) {
      throw new Error("No project selected");
    }

    const taskData: Record<string, unknown> = {
      name: params.name,
      projects: [connection.selectedProjectId],
    };

    if (params.notes) taskData.notes = params.notes;
    if (params.htmlNotes) taskData.html_notes = params.htmlNotes;
    if (params.dueOn) taskData.due_on = params.dueOn;
    if (params.dueAt) taskData.due_at = params.dueAt;
    if (params.startOn) taskData.start_on = params.startOn;
    if (params.assignee) taskData.assignee = params.assignee;
    if (params.tags?.length) taskData.tags = params.tags;

    // Add to section if selected
    if (connection.selectedSectionId) {
      taskData.memberships = [
        {
          project: connection.selectedProjectId,
          section: connection.selectedSectionId,
        },
      ];
    }

    const task = await this.apiRequest<AsanaTaskApiResponse>(
      connection.accessToken,
      `/tasks?opt_fields=gid,name,notes,html_notes,completed,due_on,due_at,start_on,assignee.name,projects.name,memberships.project.name,memberships.section.name,tags.name,tags.color,permalink_url,created_at,modified_at`,
      "POST",
      taskData
    );

    return this.formatTask(task);
  }

  /**
   * Format task response
   */
  private formatTask(task: AsanaTaskApiResponse): AsanaTask {
    return {
      gid: task.gid,
      name: task.name,
      notes: task.notes,
      htmlNotes: task.html_notes,
      completed: task.completed,
      dueOn: task.due_on,
      dueAt: task.due_at,
      startOn: task.start_on,
      assignee: task.assignee
        ? { gid: task.assignee.gid, name: task.assignee.name }
        : undefined,
      projects: (task.projects || []).map((p) => ({
        gid: p.gid,
        name: p.name,
      })),
      memberships: (task.memberships || []).map((m) => ({
        project: { gid: m.project?.gid || "", name: m.project?.name || "" },
        section: m.section
          ? { gid: m.section.gid, name: m.section.name }
          : undefined,
      })),
      tags: (task.tags || []).map((t) => ({
        gid: t.gid,
        name: t.name,
        color: t.color,
      })),
      permalink_url: task.permalink_url,
      createdAt: task.created_at,
      modifiedAt: task.modified_at,
    };
  }

  /**
   * Create task from recommendation
   */
  async createTaskFromRecommendation(
    brandId: string,
    recommendation: {
      id: string;
      title: string;
      description: string;
      priority: string;
      category: string;
    }
  ): Promise<AsanaTask> {
    const notes = `Priority: ${recommendation.priority}
Category: ${recommendation.category}

${recommendation.description}

---
Created from Apex GEO recommendation: ${recommendation.id}`;

    const task = await this.createTask(brandId, {
      name: `[GEO] ${recommendation.title}`,
      notes,
    });

    // Link recommendation to task
    this.linkedTasks.set(recommendation.id, task.gid);

    return task;
  }

  /**
   * Get linked task for recommendation
   */
  getLinkedTask(recommendationId: string): string | undefined {
    return this.linkedTasks.get(recommendationId);
  }
}

// Singleton instance
export const asanaManager = new AsanaManager();

/**
 * Format connection for API response
 */
export function formatAsanaConnectionResponse(connection: AsanaConnection) {
  return {
    id: connection.id,
    user: {
      id: connection.userId,
      name: connection.userName,
      email: connection.userEmail,
    },
    status: connection.status,
    selectedWorkspace: connection.selectedWorkspaceId
      ? {
          id: connection.selectedWorkspaceId,
          name: connection.selectedWorkspaceName,
        }
      : null,
    selectedProject: connection.selectedProjectId
      ? {
          id: connection.selectedProjectId,
          name: connection.selectedProjectName,
        }
      : null,
    selectedSection: connection.selectedSectionId
      ? {
          id: connection.selectedSectionId,
          name: connection.selectedSectionName,
        }
      : null,
    connectedAt: connection.createdAt.toISOString(),
  };
}
