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

/**
 * GET /api/marketing/sequences
 * Fetch all sequences from Mautic
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mautic = new MauticSequencesClient();
    const sequences = await mautic.getSequences();

    // Transform Mautic response to Apex format
    const transformed = sequences.campaigns
      ? Object.values(sequences.campaigns).map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description || '',
          status: campaign.isPublished ? 'active' : 'draft',
          emails: campaign.events?.length || 0,
          subscribers: campaign.leads || 0,
          conversionRate: 0, // Would need to calculate from campaign stats
          createdAt: campaign.dateAdded,
          updatedAt: campaign.dateModified,
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
