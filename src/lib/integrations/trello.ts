/**
 * Trello Integration (F124)
 * OAuth flow and card creation for Trello
 */

import { createId } from "@paralleldrive/cuid2";

// Trello types
export interface TrelloConnection {
  id: string;
  brandId: string;
  memberId: string;
  memberUsername: string;
  accessToken: string;
  selectedBoardId?: string;
  selectedBoardName?: string;
  selectedListId?: string;
  selectedListName?: string;
  status: "connected" | "disconnected" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
  prefs: {
    backgroundColor?: string;
  };
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  url: string;
  shortUrl: string;
  idBoard: string;
  idList: string;
  labels: TrelloLabel[];
  due?: string;
  dueComplete: boolean;
  closed: boolean;
  pos: number;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface CreateCardParams {
  name: string;
  desc?: string;
  pos?: "top" | "bottom" | number;
  due?: string;
  idLabels?: string[];
  urlSource?: string;
}

// Trello API configuration
const TRELLO_CONFIG = {
  authUrl: "https://trello.com/1/authorize",
  apiUrl: "https://api.trello.com/1",
};

/**
 * Trello Integration Manager
 */
export class TrelloManager {
  private connections: Map<string, TrelloConnection> = new Map();
  private byBrand: Map<string, string> = new Map();
  private linkedCards: Map<string, string> = new Map(); // recommendationId -> cardId

  constructor(
    private apiKey: string = process.env.TRELLO_API_KEY || "",
    private callbackUrl: string = process.env.TRELLO_CALLBACK_URL || ""
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state: string): string {
    const params = new URLSearchParams({
      expiration: "never",
      name: "Apex GEO Platform",
      scope: "read,write",
      response_type: "token",
      key: this.apiKey,
      callback_method: "fragment",
      return_url: `${this.callbackUrl}?state=${brandId}:${state}`,
    });

    return `${TRELLO_CONFIG.authUrl}?${params.toString()}`;
  }

  /**
   * Create connection with access token
   */
  async createConnection(
    brandId: string,
    accessToken: string
  ): Promise<TrelloConnection> {
    // Get member info
    const member = await this.getMember(accessToken);

    const connection: TrelloConnection = {
      id: createId(),
      brandId,
      memberId: member.id,
      memberUsername: member.username,
      accessToken,
      status: "connected",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.connections.set(connection.id, connection);
    this.byBrand.set(brandId, connection.id);

    return connection;
  }

  /**
   * Get member info
   */
  async getMember(accessToken: string): Promise<{ id: string; username: string; fullName: string }> {
    const response = await fetch(
      `${TRELLO_CONFIG.apiUrl}/members/me?key=${this.apiKey}&token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get member: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get connection for brand
   */
  getConnection(brandId: string): TrelloConnection | undefined {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return undefined;
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect Trello
   */
  disconnect(brandId: string): boolean {
    const connectionId = this.byBrand.get(brandId);
    if (!connectionId) return false;

    this.connections.delete(connectionId);
    this.byBrand.delete(brandId);
    return true;
  }

  /**
   * Get boards
   */
  async getBoards(brandId: string): Promise<TrelloBoard[]> {
    const connection = this.getConnection(brandId);
    if (!connection) {
      throw new Error("No Trello connection found");
    }

    const response = await fetch(
      `${TRELLO_CONFIG.apiUrl}/members/me/boards?key=${this.apiKey}&token=${connection.accessToken}&filter=open`
    );

    if (!response.ok) {
      throw new Error(`Failed to get boards: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((b: Record<string, unknown>) => ({
      id: b.id,
      name: b.name,
      desc: b.desc,
      closed: b.closed,
      url: b.url,
      prefs: {
        backgroundColor: (b.prefs as { backgroundColor?: string } | undefined)?.backgroundColor,
      },
    }));
  }

  /**
   * Select board
   */
  selectBoard(brandId: string, boardId: string, boardName: string): TrelloConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedBoardId = boardId;
    connection.selectedBoardName = boardName;
    connection.selectedListId = undefined;
    connection.selectedListName = undefined;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Get lists for board
   */
  async getLists(brandId: string): Promise<TrelloList[]> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedBoardId) {
      throw new Error("No board selected");
    }

    const response = await fetch(
      `${TRELLO_CONFIG.apiUrl}/boards/${connection.selectedBoardId}/lists?key=${this.apiKey}&token=${connection.accessToken}&filter=open`
    );

    if (!response.ok) {
      throw new Error(`Failed to get lists: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((l: Record<string, unknown>) => ({
      id: l.id,
      name: l.name,
      closed: l.closed,
      pos: l.pos,
    }));
  }

  /**
   * Select list
   */
  selectList(brandId: string, listId: string, listName: string): TrelloConnection | undefined {
    const connection = this.getConnection(brandId);
    if (!connection) return undefined;

    connection.selectedListId = listId;
    connection.selectedListName = listName;
    connection.updatedAt = new Date();
    this.connections.set(connection.id, connection);

    return connection;
  }

  /**
   * Create card
   */
  async createCard(brandId: string, params: CreateCardParams): Promise<TrelloCard> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedListId) {
      throw new Error("No list selected");
    }

    const body: Record<string, unknown> = {
      idList: connection.selectedListId,
      name: params.name,
      desc: params.desc || "",
      pos: params.pos || "bottom",
    };

    if (params.due) body.due = params.due;
    if (params.idLabels?.length) body.idLabels = params.idLabels.join(",");
    if (params.urlSource) body.urlSource = params.urlSource;

    const response = await fetch(
      `${TRELLO_CONFIG.apiUrl}/cards?key=${this.apiKey}&token=${connection.accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create card: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      desc: data.desc,
      url: data.url,
      shortUrl: data.shortUrl,
      idBoard: data.idBoard,
      idList: data.idList,
      labels: data.labels || [],
      due: data.due,
      dueComplete: data.dueComplete,
      closed: data.closed,
      pos: data.pos,
    };
  }

  /**
   * Create card from recommendation
   */
  async createCardFromRecommendation(
    brandId: string,
    recommendation: {
      id: string;
      title: string;
      description: string;
      priority: string;
      category: string;
      url?: string;
    }
  ): Promise<TrelloCard> {
    const desc = `**Priority:** ${recommendation.priority}\n**Category:** ${recommendation.category}\n\n${recommendation.description}\n\n---\nCreated from Apex GEO recommendation: ${recommendation.id}`;

    const card = await this.createCard(brandId, {
      name: `[GEO] ${recommendation.title}`,
      desc,
      urlSource: recommendation.url,
    });

    // Link recommendation to card
    this.linkedCards.set(recommendation.id, card.id);

    return card;
  }

  /**
   * Get labels for board
   */
  async getLabels(brandId: string): Promise<TrelloLabel[]> {
    const connection = this.getConnection(brandId);
    if (!connection || !connection.selectedBoardId) {
      throw new Error("No board selected");
    }

    const response = await fetch(
      `${TRELLO_CONFIG.apiUrl}/boards/${connection.selectedBoardId}/labels?key=${this.apiKey}&token=${connection.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get labels: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get linked card for recommendation
   */
  getLinkedCard(recommendationId: string): string | undefined {
    return this.linkedCards.get(recommendationId);
  }
}

// Singleton instance
export const trelloManager = new TrelloManager();

/**
 * Format connection for API response
 */
export function formatTrelloConnectionResponse(connection: TrelloConnection) {
  return {
    id: connection.id,
    username: connection.memberUsername,
    status: connection.status,
    selectedBoard: connection.selectedBoardId
      ? {
          id: connection.selectedBoardId,
          name: connection.selectedBoardName,
        }
      : null,
    selectedList: connection.selectedListId
      ? {
          id: connection.selectedListId,
          name: connection.selectedListName,
        }
      : null,
    connectedAt: connection.createdAt.toISOString(),
  };
}
