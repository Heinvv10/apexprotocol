/**
 * Marketing Sequences (Automation) API Route
 * Wraps Mautic API for email sequence/automation management
 * GET  /api/marketing/sequences - Get all sequences
 * POST /api/marketing/sequences - Create new sequence
 * GET  /api/marketing/sequences/:id - Get sequence details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createSequenceSchema = z.object({
  name: z.string().min(1, 'Sequence name is required'),
  description: z.string().optional(),
});

type CreateSequenceRequest = z.infer<typeof createSequenceSchema>;

/**
 * Mautic API Client for Sequences
 */
class MauticSequencesClient {
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
   * Get all sequences (campaigns with automation)
   */
  async getSequences(limit = 100, page = 1) {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseUrl}/api/campaigns?limit=${limit}&page=${page}&where[0][col]=isPublished&where[0][expr]=eq&where[0][val]=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sequences: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get single sequence
   */
  async getSequence(id: string) {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/campaigns/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sequence: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new sequence
   */
  async createSequence(data: CreateSequenceRequest) {
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
        isPublished: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create sequence: ${response.statusText}`);
    }

    return response.json();
  }
}

// Mock sequences data for demo/development
const mockSequences = [
  {
    id: 'seq_001',
    name: 'Welcome Series',
    description: '5-email welcome sequence for new subscribers',
    trigger: 'immediate',
    status: 'active',
    emails: [
      { id: 'e1', subject: 'Welcome to Apex!', delay: 0 },
      { id: 'e2', subject: 'Getting Started Guide', delay: 86400000 },
      { id: 'e3', subject: 'Top Features to Explore', delay: 259200000 },
      { id: 'e4', subject: 'Success Stories', delay: 432000000 },
      { id: 'e5', subject: 'Ready to Upgrade?', delay: 604800000 },
    ],
    stats: {
      subscribers: 850,
      conversions: 127,
      conversionRate: 14.9,
    },
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seq_002',
    name: 'Product Onboarding',
    description: 'Help new users get started with the platform',
    trigger: 'delayed',
    status: 'active',
    emails: [
      { id: 'e6', subject: 'Your First Steps', delay: 86400000 },
      { id: 'e7', subject: 'Advanced Tips', delay: 259200000 },
      { id: 'e8', subject: 'Best Practices', delay: 432000000 },
    ],
    stats: {
      subscribers: 420,
      conversions: 95,
      conversionRate: 22.6,
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seq_003',
    name: 'Re-engagement Campaign',
    description: 'Win back inactive subscribers',
    trigger: 'behavior',
    status: 'active',
    emails: [
      { id: 'e9', subject: 'We miss you!', delay: 0 },
      { id: 'e10', subject: 'What\'s new at Apex', delay: 172800000 },
      { id: 'e11', subject: 'Special offer inside', delay: 432000000 },
      { id: 'e12', subject: 'Last chance', delay: 604800000 },
    ],
    stats: {
      subscribers: 320,
      conversions: 28,
      conversionRate: 8.8,
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seq_004',
    name: 'Lead Nurture',
    description: 'Educate leads about product features',
    trigger: 'event',
    status: 'active',
    emails: [
      { id: 'e13', subject: 'Understanding GEO', delay: 0 },
      { id: 'e14', subject: 'Platform Monitoring', delay: 172800000 },
      { id: 'e15', subject: 'Content Creation', delay: 345600000 },
      { id: 'e16', subject: 'Analytics Deep Dive', delay: 518400000 },
      { id: 'e17', subject: 'Book a Demo', delay: 691200000 },
    ],
    stats: {
      subscribers: 650,
      conversions: 118,
      conversionRate: 18.2,
    },
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seq_005',
    name: 'Upgrade Promotion',
    description: 'Encourage free users to upgrade to paid plans',
    trigger: 'delayed',
    status: 'inactive',
    emails: [
      { id: 'e18', subject: 'Unlock Premium Features', delay: 604800000 },
      { id: 'e19', subject: 'Compare Plans', delay: 1209600000 },
      { id: 'e20', subject: 'Limited Time Offer', delay: 1814400000 },
    ],
    stats: {
      subscribers: 280,
      conversions: 42,
      conversionRate: 15.0,
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seq_006',
    name: 'Trial Expiration',
    description: 'Remind users before their trial expires',
    trigger: 'event',
    status: 'active',
    emails: [
      { id: 'e21', subject: '7 days left in your trial', delay: 0 },
      { id: 'e22', subject: '3 days left', delay: 345600000 },
      { id: 'e23', subject: 'Last day!', delay: 518400000 },
    ],
    stats: {
      subscribers: 190,
      conversions: 45,
      conversionRate: 23.7,
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/marketing/sequences
 * Fetch all sequences from Mautic (with mock data fallback)
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try Mautic first, fallback to mock data
    try {
      const mautic = new MauticSequencesClient();
      const sequences = await mautic.getSequences();

      // Transform Mautic response to Apex format
      const transformed = sequences.campaigns
        ? Object.values(sequences.campaigns).map((campaign: any) => ({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description || '',
            status: campaign.isPublished ? 'active' : 'draft',
            trigger: 'immediate',
            emails: campaign.events?.length || 0,
            stats: {
              subscribers: campaign.leads || 0,
              conversions: 0,
              conversionRate: 0,
            },
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
        data: mockSequences,
        meta: {
          total: mockSequences.length,
          success: true,
          source: 'mock',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/sequences
 * Create a new sequence in Mautic
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSequenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid sequence data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const mautic = new MauticSequencesClient();
    const result = await mautic.createSequence(validation.data);

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
    console.error('Error creating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    );
  }
}
