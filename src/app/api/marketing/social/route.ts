/**
 * Social Media Management API Route
 * Wraps Postiz API for social media scheduling and analytics
 * GET  /api/marketing/social - Get all scheduled posts
 * POST /api/marketing/social - Schedule new post
 * GET  /api/marketing/social/analytics - Get engagement metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const schedulePostSchema = z.object({
  content: z.string().min(1, 'Post content is required'),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  scheduledAt: z.string().datetime().optional(),
  imageUrls: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
});

type SchedulePostRequest = z.infer<typeof schedulePostSchema>;

/**
 * Postiz API Client
 */
class PostizClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.POSTIZ_URL || 'http://localhost:3001';
    this.apiKey = process.env.POSTIZ_API_KEY || 'dev-api-key';
  }

  /**
   * Get all posts
   */
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

  /**
   * Schedule new post
   */
  async schedulePost(data: SchedulePostRequest) {
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

  /**
   * Get post analytics
   */
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

  /**
   * Get platform statistics
   */
  async getPlatformStats(platform: string) {
    const response = await fetch(
      `${this.baseUrl}/api/platforms/${platform}/stats`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch platform stats: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get connected platforms
   */
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

/**
 * GET /api/marketing/social
 * Get all scheduled social media posts
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const analytics = searchParams.get('analytics') === 'true';

    const postiz = new PostizClient();

    if (analytics) {
      // Return aggregated analytics
      const platforms = await postiz.getPlatforms();
      const stats = await Promise.all(
        platforms.data.map((p: any) => postiz.getPlatformStats(p.id))
      );

      return NextResponse.json({
        data: {
          platforms: platforms.data,
          stats: stats,
        },
        meta: { success: true },
      });
    }

    // Return list of posts
    const result = await postiz.getPosts();

    const transformed = result.data
      ? result.data.map((post: any) => ({
          id: post.id,
          content: post.content,
          platforms: post.platforms || [],
          scheduledAt: post.scheduledAt,
          publishedAt: post.publishedAt,
          status: post.status || 'scheduled',
          engagement: {
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            views: post.views || 0,
          },
          createdAt: post.createdAt,
        }))
      : [];

    return NextResponse.json({
      data: transformed,
      meta: {
        total: transformed.length,
        success: true,
      },
    });
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/social
 * Schedule new social media post
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = schedulePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid post data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const postiz = new PostizClient();
    const result = await postiz.schedulePost(validation.data);

    return NextResponse.json(
      {
        data: {
          id: result.data.id,
          content: result.data.content,
          platforms: result.data.platforms,
          scheduledAt: result.data.scheduledAt,
          status: 'scheduled',
        },
        meta: { success: true },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}
