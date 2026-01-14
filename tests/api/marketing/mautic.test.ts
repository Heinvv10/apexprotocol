/**
 * Mautic API Wrapper Tests
 * Tests authentication, campaign retrieval, and response transformation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the MauticClient class
class MauticClient {
  private baseUrl: string;
  private credentials: {
    username: string;
    password: string;
  };
  private accessToken?: string;

  constructor() {
    this.baseUrl = process.env.MAUTIC_URL || 'http://localhost:8000';
    this.credentials = {
      username: process.env.MAUTIC_USERNAME || 'admin',
      password: process.env.MAUTIC_PASSWORD || 'password',
    };
  }

  async authenticate(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: process.env.MAUTIC_CLIENT_ID || 'client-id',
          client_secret: process.env.MAUTIC_CLIENT_SECRET || 'client-secret',
          username: this.credentials.username,
          password: this.credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mautic auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      throw error;
    }
  }

  async getCampaigns(limit = 100, page = 1) {
    const token = await this.authenticate();
    const response = await fetch(
      `${this.baseUrl}/api/campaigns?limit=${limit}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
    }

    return response.json();
  }

  async createCampaign(data: any) {
    const token = await this.authenticate();
    const response = await fetch(`${this.baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        isPublished: true,
        lists: data.listId ? [{ id: data.listId }] : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create campaign: ${response.statusText}`);
    }

    return response.json();
  }
}

describe('MauticClient', () => {
  let client: MauticClient;

  beforeEach(() => {
    client = new MauticClient();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate with OAuth2 password grant', async () => {
      const mockToken = 'test_access_token_12345';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockToken }),
      });

      const token = await client.authenticate();
      expect(token).toBe(mockToken);
    });

    it('should throw error on authentication failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(client.authenticate()).rejects.toThrow(
        'Mautic auth failed'
      );
    });

    it('should cache access token on subsequent calls', async () => {
      const mockToken = 'cached_token_12345';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockToken }),
      });

      const token1 = await client.authenticate();
      const token2 = await client.authenticate();

      expect(token1).toBe(token2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCampaigns', () => {
    it('should fetch campaigns and return data', async () => {
      const mockCampaigns = {
        campaigns: {
          123: {
            id: 123,
            name: 'Test Campaign',
            description: 'Test description',
            isPublished: true,
            emails: [{ id: 1 }, { id: 2 }],
            leads: 100,
            dateAdded: '2026-01-14T00:00:00',
            dateModified: '2026-01-14T10:00:00',
          },
        },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCampaigns,
        });

      const result = await client.getCampaigns();
      expect(result.campaigns).toBeDefined();
      expect(result.campaigns[123].name).toBe('Test Campaign');
    });

    it('should throw error on fetch failure', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        });

      await expect(client.getCampaigns()).rejects.toThrow(
        'Failed to fetch campaigns'
      );
    });

    it('should pass pagination parameters', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaigns: {} }),
        });

      await client.getCampaigns(50, 2);

      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[0]).toContain('limit=50');
      expect(secondCall[0]).toContain('page=2');
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with required fields', async () => {
      const newCampaign = {
        name: 'New Campaign',
        description: 'New campaign description',
      };

      const mockResponse = {
        campaign: {
          id: 456,
          name: newCampaign.name,
          dateAdded: '2026-01-14T00:00:00',
        },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await client.createCampaign(newCampaign);
      expect(result.campaign.name).toBe(newCampaign.name);
    });

    it('should throw error on creation failure', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        });

      await expect(
        client.createCampaign({ name: 'Test Campaign' })
      ).rejects.toThrow('Failed to create campaign');
    });
  });
});
