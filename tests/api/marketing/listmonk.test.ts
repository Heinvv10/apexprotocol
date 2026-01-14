/**
 * ListMonk API Wrapper Tests
 * Tests Basic authentication, list management, and campaign sending
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

class ListMonkClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = process.env.LISTMONK_URL || 'http://localhost:9000';
    this.username = process.env.LISTMONK_USERNAME || 'admin';
    this.password = process.env.LISTMONK_PASSWORD || 'password';
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString(
      'base64'
    );
    return `Basic ${credentials}`;
  }

  async getLists() {
    const response = await fetch(`${this.baseUrl}/api/lists`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lists: ${response.statusText}`);
    }

    return response.json();
  }

  async createList(data: any) {
    const response = await fetch(`${this.baseUrl}/api/lists`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        type: 'public',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create list: ${response.statusText}`);
    }

    return response.json();
  }

  async sendCampaign(data: any) {
    const campaignResponse = await fetch(`${this.baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.subject,
        subject: data.subject,
        lists: [parseInt(data.listId)],
        type: 'regular',
        fromEmail: data.fromEmail,
        fromName: data.fromName || 'Apex Marketing',
        body: data.body,
        contentType: 'html',
      }),
    });

    if (!campaignResponse.ok) {
      throw new Error(`Failed to create campaign: ${campaignResponse.statusText}`);
    }

    return campaignResponse.json();
  }
}

describe('ListMonkClient', () => {
  let client: ListMonkClient;

  beforeEach(() => {
    client = new ListMonkClient();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should generate valid Basic auth header', () => {
      const authHeader = (client as any).getAuthHeader();
      expect(authHeader).toMatch(/^Basic\s+[A-Za-z0-9+/=]+$/);

      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decoded).toContain(':');
    });

    it('should include credentials in auth header', () => {
      process.env.LISTMONK_USERNAME = 'testuser';
      process.env.LISTMONK_PASSWORD = 'testpass';

      const newClient = new ListMonkClient();
      const authHeader = (newClient as any).getAuthHeader();
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();

      expect(decoded).toBe('testuser:testpass');
    });
  });

  describe('getLists', () => {
    it('should fetch all email lists', async () => {
      const mockLists = {
        data: [
          {
            id: 1,
            name: 'Newsletter',
            description: 'Main newsletter list',
            subscriber_count: 150,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-14T00:00:00Z',
          },
          {
            id: 2,
            name: 'Marketing',
            description: 'Marketing list',
            subscriber_count: 250,
            created_at: '2026-01-02T00:00:00Z',
            updated_at: '2026-01-14T00:00:00Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockLists,
      });

      const result = await client.getLists();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Newsletter');
      expect(result.data[1].subscriber_count).toBe(250);
    });

    it('should throw error on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(client.getLists()).rejects.toThrow('Failed to fetch lists');
    });

    it('should send correct headers', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getLists();

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].headers).toHaveProperty('Authorization');
      expect(call[1].headers.Authorization).toMatch(/^Basic\s+/);
    });
  });

  describe('createList', () => {
    it('should create new email list', async () => {
      const newList = {
        name: 'New Subscribers',
        description: 'New subscriber list',
      };

      const mockResponse = {
        data: {
          id: 3,
          name: newList.name,
          created_at: '2026-01-14T00:00:00Z',
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createList(newList);
      expect(result.data.name).toBe(newList.name);
    });

    it('should include list name in request', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      });

      await client.createList({ name: 'Test List' });

      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.name).toBe('Test List');
      expect(body.type).toBe('public');
    });

    it('should throw error on creation failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(
        client.createList({ name: 'Test List' })
      ).rejects.toThrow('Failed to create list');
    });
  });

  describe('sendCampaign', () => {
    it('should send email campaign to list', async () => {
      const campaign = {
        listId: '1',
        subject: 'Welcome to our newsletter',
        body: '<h1>Welcome</h1>',
        fromEmail: 'sender@example.com',
        fromName: 'Apex Marketing',
      };

      const mockResponse = {
        data: {
          id: 101,
          name: campaign.subject,
          subject: campaign.subject,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.sendCampaign(campaign);
      expect(result.data.name).toBe(campaign.subject);
    });

    it('should include list and content in request', async () => {
      const campaign = {
        listId: '1',
        subject: 'Test Campaign',
        body: '<p>Test</p>',
        fromEmail: 'sender@example.com',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      });

      await client.sendCampaign(campaign);

      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.lists).toContain(1);
      expect(body.body).toBe(campaign.body);
      expect(body.fromEmail).toBe(campaign.fromEmail);
    });

    it('should throw error on send failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        client.sendCampaign({
          listId: '1',
          subject: 'Test',
          body: '<p>Test</p>',
          fromEmail: 'test@example.com',
        })
      ).rejects.toThrow('Failed to create campaign');
    });
  });
});
