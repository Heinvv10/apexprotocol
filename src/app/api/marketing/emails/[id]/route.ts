/**
 * Marketing Email List Detail API Route
 * GET  /api/marketing/emails/[id] - Get single email list details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';

// Mock email lists data (same as parent route for consistency)
const mockEmailLists = [
  {
    id: 'list_001',
    name: 'Newsletter Subscribers',
    description: 'Main newsletter list with product updates and tips',
    subscribers: 12450,
    subscriberCount: 12450,
    unsubscribeCount: 234,
    bounceCount: 89,
    growthRate: 8.5,
    openRate: 32.5,
    clickRate: 8.2,
    status: 'active',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: 'lm_001',
      automation: true,
    },
  },
  {
    id: 'list_002',
    name: 'Product Updates',
    description: 'Users who opted in for product release announcements',
    subscribers: 8920,
    subscriberCount: 8920,
    unsubscribeCount: 145,
    bounceCount: 42,
    growthRate: 12.3,
    openRate: 45.2,
    clickRate: 12.8,
    status: 'active',
    createdAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: 'lm_002',
      automation: false,
    },
  },
  {
    id: 'list_003',
    name: 'Enterprise Leads',
    description: 'High-value enterprise prospects and decision makers',
    subscribers: 2340,
    subscriberCount: 2340,
    unsubscribeCount: 67,
    bounceCount: 23,
    growthRate: 15.8,
    openRate: 52.1,
    clickRate: 18.5,
    status: 'active',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: 'lm_003',
      automation: true,
    },
  },
  {
    id: 'list_004',
    name: 'Webinar Attendees',
    description: 'People who registered for webinars',
    subscribers: 4680,
    subscriberCount: 4680,
    unsubscribeCount: 34,
    bounceCount: 18,
    growthRate: 6.2,
    openRate: 38.7,
    clickRate: 15.2,
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: 'lm_004',
      automation: false,
    },
  },
  {
    id: 'list_005',
    name: 'Trial Users',
    description: 'Free trial signups for conversion campaigns',
    subscribers: 6820,
    subscriberCount: 6820,
    unsubscribeCount: 89,
    bounceCount: 34,
    growthRate: 9.7,
    openRate: 41.3,
    clickRate: 14.6,
    status: 'active',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: 'lm_005',
      automation: true,
    },
  },
  {
    id: 'list_006',
    name: 'Churned Users',
    description: 'Former customers for win-back campaigns',
    subscribers: 1420,
    subscriberCount: 1420,
    unsubscribeCount: 12,
    bounceCount: 5,
    growthRate: 0,
    openRate: 22.8,
    clickRate: 5.4,
    status: 'inactive',
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: 'lm_006',
      automation: false,
    },
  },
];

/**
 * ListMonk API Client
 */
class ListMonkClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = process.env.LISTMONK_URL || 'http://localhost:9000';
    this.username = process.env.LISTMONK_USERNAME || 'admin';
    this.password = process.env.LISTMONK_PASSWORD || 'password';
  }

  /**
   * Get Basic Auth header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.username}:${this.password}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Get single list by ID
   */
  async getList(id: string) {
    const response = await fetch(`${this.baseUrl}/api/lists/${id}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch list: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * GET /api/marketing/emails/[id]
 * Get a single email list by ID (with mock data fallback)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try ListMonk first, fallback to mock data
    try {
      const listmonk = new ListMonkClient();
      const result = await listmonk.getList(id);

      // Transform ListMonk response to Apex format
      const transformed = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description,
        subscribers: result.data.subscriber_count || 0,
        subscriberCount: result.data.subscriber_count || 0,
        openRate: result.data.open_rate || 0,
        clickRate: result.data.click_rate || 0,
        status: result.data.status || 'active',
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at,
        metadata: {
          listmonkId: result.data.id,
          automation: result.data.type === 'private',
        },
      };

      return NextResponse.json({
        data: transformed,
        meta: {
          success: true,
          source: 'listmonk',
        },
      });
    } catch (listmonkError) {
      // ListMonk not available, return mock data
      console.log('ListMonk unavailable, using mock data:', listmonkError);

      // Find the list by ID in mock data
      const list = mockEmailLists.find((l) => l.id === id);

      if (!list) {
        return NextResponse.json(
          { error: 'Email list not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: list,
        meta: {
          success: true,
          source: 'mock',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching email list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email list' },
      { status: 500 }
    );
  }
}
