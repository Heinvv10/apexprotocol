/**
 * Marketing Campaigns API Route
 * Wraps Mautic API for campaign management
 * GET  /api/marketing/campaigns - Get all campaigns
 * POST /api/marketing/campaigns - Create new campaign
 * GET  /api/marketing/campaigns/:id - Get campaign details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  listId: z.string().optional(),
});

type CreateCampaignRequest = z.infer<typeof createCampaignSchema>;

/**
 * Mautic API Client
 */
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

  /**
   * Authenticate with Mautic using password grant
   */
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
      this.accessToken = data.access_token as string;
      return this.accessToken;
    } catch (error) {
      console.error('Mautic authentication error:', error);
      throw error;
    }
  }

  /**
   * Get all campaigns
   */
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

  /**
   * Get single campaign
   */
  async getCampaign(id: string) {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/campaigns/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch campaign: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new campaign
   */
  async createCampaign(data: CreateCampaignRequest) {
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

  /**
   * Get campaign stats
   */
  async getCampaignStats(id: string) {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseUrl}/api/campaigns/${id}/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch campaign stats: ${response.statusText}`);
    }

    return response.json();
  }
}

// Mock campaigns data for demo/development
const mockCampaigns = [
  {
    id: 'camp_001',
    name: 'Spring Product Launch',
    description: 'Q1 product launch campaign targeting enterprise customers',
    type: 'email',
    status: 'active',
    budget: 15000,
    revenue: 45000,
    leads: 320,
    clicks: 2400,
    conversions: 86,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp_002',
    name: 'Webinar Series - AI Insights',
    description: 'Educational webinar series on AI implementation',
    type: 'webinar',
    status: 'active',
    budget: 8000,
    revenue: 28000,
    leads: 180,
    clicks: 1200,
    conversions: 45,
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp_003',
    name: 'Social Media Awareness',
    description: 'Brand awareness campaign across social platforms',
    type: 'social',
    status: 'active',
    budget: 12000,
    revenue: 22000,
    leads: 450,
    clicks: 8500,
    conversions: 120,
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp_004',
    name: 'Landing Page - Free Trial',
    description: 'Free trial signup landing page campaign',
    type: 'landing_page',
    status: 'active',
    budget: 5000,
    revenue: 18000,
    leads: 280,
    clicks: 3200,
    conversions: 95,
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: null,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp_005',
    name: 'Retargeting - Cart Abandonment',
    description: 'Retarget users who abandoned their shopping carts',
    type: 'retargeting',
    status: 'paused',
    budget: 6000,
    revenue: 15000,
    leads: 95,
    clicks: 1800,
    conversions: 42,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp_006',
    name: 'Holiday Sale Promotion',
    description: 'Annual holiday sale email blast',
    type: 'email',
    status: 'completed',
    budget: 10000,
    revenue: 52000,
    leads: 520,
    clicks: 4200,
    conversions: 180,
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/marketing/campaigns
 * Fetch all campaigns from Mautic (with mock data fallback)
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try Mautic first, fallback to mock data
    try {
      const mautic = new MauticClient();
      const campaigns = await mautic.getCampaigns();

      // Transform Mautic response to Apex format
      const transformed = campaigns.campaigns
        ? Object.values(campaigns.campaigns).map((campaign: any) => ({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description || '',
            status: campaign.isPublished ? 'active' : 'draft',
            type: 'email',
            emails: campaign.emails?.length || 0,
            leads: campaign.leads || 0,
            createdAt: campaign.dateAdded,
            updatedAt: campaign.dateModified,
          }))
        : [];

      return NextResponse.json({
        data: transformed,
        meta: {
          total: transformed.length,
          success: true,
          source: 'mautic',
        },
      });
    } catch (mauticError) {
      // Mautic not available, return mock data
      console.log('Mautic unavailable, using mock data:', mauticError);

      return NextResponse.json({
        data: mockCampaigns,
        meta: {
          total: mockCampaigns.length,
          success: true,
          source: 'mock',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/campaigns
 * Create a new campaign in Mautic
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createCampaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid campaign data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const mautic = new MauticClient();
    const result = await mautic.createCampaign(validation.data);

    return NextResponse.json(
      {
        data: {
          id: result.campaign.id,
          name: result.campaign.name,
          status: 'draft',
          createdAt: result.campaign.dateAdded,
        },
        meta: { success: true },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
