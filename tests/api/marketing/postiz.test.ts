/**
 * Postiz API Wrapper Tests
 * Tests Bearer token authentication, post scheduling, and analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

class PostizClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.POSTIZ_URL || 'http://localhost:3001';
    this.apiKey = process.env.POSTIZ_API_KEY || 'dev-api-key';
  }

  async getPosts(limit = 50, page = 1) {
    const response = await fetch(
      `${this.baseUrl}/api/posts?limit=${limit}&page=${page}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json();
  }

  async schedulePost(data: any) {
    const response = await fetch(`${this.baseUrl}/api/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: data.content,
        platforms: data.platforms,
        scheduledAt: data.scheduledAt || new Date().toISOString(),
        mediaUrls: data.imageUrls || [],
        tags: data.hashtags || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule post: ${response.statusText}`);
    }

    return response.json();
  }

  async getPostAnalytics(postId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/posts/${postId}/analytics`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  }

  async getPlatforms() {
    const response = await fetch(`${this.baseUrl}/api/platforms`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch platforms: ${response.statusText}`);
    }

    return response.json();
  }
}

describe('PostizClient', () => {
  let client: PostizClient;

  beforeEach(() => {
    client = new PostizClient();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should use Bearer token in Authorization header', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getPosts();

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].headers.Authorization).toMatch(/^Bearer\s+/);
    });

    it('should include API key in Bearer token', async () => {
      process.env.POSTIZ_API_KEY = 'test_api_key_12345';
      const newClient = new PostizClient();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await newClient.getPosts();

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].headers.Authorization).toBe('Bearer test_api_key_12345');
    });
  });

  describe('getPosts', () => {
    it('should fetch scheduled posts', async () => {
      const mockPosts = {
        data: [
          {
            id: 'post_1',
            content: 'Check out our latest blog post!',
            platforms: ['linkedin', 'twitter'],
            scheduledAt: '2026-01-15T10:00:00Z',
            status: 'scheduled',
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
          },
          {
            id: 'post_2',
            content: 'New product announcement',
            platforms: ['linkedin'],
            publishedAt: '2026-01-14T12:00:00Z',
            status: 'published',
            likes: 45,
            comments: 12,
            shares: 5,
            views: 340,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      const result = await client.getPosts();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].content).toContain('blog post');
      expect(result.data[1].status).toBe('published');
    });

    it('should pass pagination parameters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getPosts(25, 3);

      const call = (global.fetch as any).mock.calls[0];
      expect(call[0]).toContain('limit=25');
      expect(call[0]).toContain('page=3');
    });

    it('should throw error on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(client.getPosts()).rejects.toThrow('Failed to fetch posts');
    });
  });

  describe('schedulePost', () => {
    it('should schedule new social media post', async () => {
      const newPost = {
        content: 'Excited to announce our new product launch! 🚀',
        platforms: ['linkedin', 'twitter', 'facebook'],
        imageUrls: ['https://example.com/image.jpg'],
        hashtags: ['#ProductLaunch', '#Innovation'],
        scheduledAt: '2026-01-16T09:00:00Z',
      };

      const mockResponse = {
        data: {
          id: 'post_123',
          content: newPost.content,
          platforms: newPost.platforms,
          scheduledAt: newPost.scheduledAt,
          status: 'scheduled',
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.schedulePost(newPost);
      expect(result.data.status).toBe('scheduled');
      expect(result.data.platforms).toContain('linkedin');
    });

    it('should include content and platforms in request', async () => {
      const newPost = {
        content: 'Test post',
        platforms: ['twitter'],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      });

      await client.schedulePost(newPost);

      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.content).toBe(newPost.content);
      expect(body.platforms).toEqual(['twitter']);
    });

    it('should throw error on scheduling failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(
        client.schedulePost({
          content: 'Test',
          platforms: ['twitter'],
        })
      ).rejects.toThrow('Failed to schedule post');
    });
  });

  describe('getPostAnalytics', () => {
    it('should fetch post analytics and engagement metrics', async () => {
      const mockAnalytics = {
        data: {
          id: 'post_1',
          likes: 125,
          comments: 28,
          shares: 12,
          views: 2340,
          engagementRate: 6.2,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      });

      const result = await client.getPostAnalytics('post_1');
      expect(result.data.likes).toBe(125);
      expect(result.data.engagementRate).toBe(6.2);
    });

    it('should construct correct analytics URL', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await client.getPostAnalytics('post_abc123');

      const call = (global.fetch as any).mock.calls[0];
      expect(call[0]).toContain('/api/posts/post_abc123/analytics');
    });

    it('should throw error on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(client.getPostAnalytics('invalid_id')).rejects.toThrow(
        'Failed to fetch analytics'
      );
    });
  });

  describe('getPlatforms', () => {
    it('should fetch connected social platforms', async () => {
      const mockPlatforms = {
        data: [
          {
            id: 'platform_1',
            name: 'LinkedIn',
            connected: true,
            accountId: 'linkedin_account_123',
          },
          {
            id: 'platform_2',
            name: 'Twitter',
            connected: true,
            accountId: 'twitter_account_456',
          },
          {
            id: 'platform_3',
            name: 'Facebook',
            connected: false,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlatforms,
      });

      const result = await client.getPlatforms();
      expect(result.data).toHaveLength(3);
      expect(result.data[0].connected).toBe(true);
    });

    it('should throw error on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
      });

      await expect(client.getPlatforms()).rejects.toThrow(
        'Failed to fetch platforms'
      );
    });
  });
});
