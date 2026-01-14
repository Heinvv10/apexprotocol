/**
 * Marketing Email API Route
 * Wraps ListMonk API for email list and campaign management
 * GET  /api/marketing/emails - Get all email lists
 * POST /api/marketing/emails - Create new email list
 * POST /api/marketing/emails/send - Send email campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createListSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
});

const sendCampaignSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  fromEmail: z.string().email('Valid email required'),
  fromName: z.string().optional(),
});

type CreateListRequest = z.infer<typeof createListSchema>;
type SendCampaignRequest = z.infer<typeof sendCampaignSchema>;

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
   * Get all email lists
   */
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

  /**
   * Get single list with subscribers
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

  /**
   * Create new email list
   */
  async createList(data: CreateListRequest) {
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

  /**
   * Get list subscribers
   */
  async getListSubscribers(listId: string, page = 1, limit = 100) {
    const response = await fetch(
      `${this.baseUrl}/api/lists/${listId}/subscribers?page=${page}&per_page=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch subscribers: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send campaign to list
   */
  async sendCampaign(data: SendCampaignRequest) {
    // First create the campaign
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
      throw new Error(
        `Failed to create campaign: ${campaignResponse.statusText}`
      );
    }

    const campaign = await campaignResponse.json();

    // Then send it
    const sendResponse = await fetch(
      `${this.baseUrl}/api/campaigns/${campaign.data.id}/test`,
      {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!sendResponse.ok) {
      throw new Error(`Failed to send campaign: ${sendResponse.statusText}`);
    }

    return campaign;
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(campaignId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/campaigns/${campaignId}`,
      {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch campaign: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * GET /api/marketing/emails
 * Get all email lists
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listmonk = new ListMonkClient();
    const result = await listmonk.getLists();

    // Transform ListMonk response to Apex format
    const transformed = result.data
      ? result.data.map((list: any) => ({
          id: list.id,
          name: list.name,
          description: list.description,
          subscribers: list.subscriber_count || 0,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
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
    console.error('Error fetching email lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email lists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/emails
 * Create new email list
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is a send campaign request
    if (body.type === 'send-campaign') {
      const validation = sendCampaignSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid campaign data',
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const listmonk = new ListMonkClient();
      const result = await listmonk.sendCampaign(validation.data);

      return NextResponse.json(
        {
          data: {
            campaignId: result.data.id,
            subject: result.data.subject,
            status: 'scheduled',
          },
          meta: { success: true },
        },
        { status: 201 }
      );
    }

    // Otherwise, create a new list
    const validation = createListSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid list data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const listmonk = new ListMonkClient();
    const result = await listmonk.createList(validation.data);

    return NextResponse.json(
      {
        data: {
          id: result.data.id,
          name: result.data.name,
          subscribers: 0,
          createdAt: result.data.created_at,
        },
        meta: { success: true },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing email request:', error);
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    );
  }
}
