/**
 * Marketing Calendar API Route
 * Aggregates scheduled campaigns, emails, and social posts
 * GET /api/marketing/calendar - Get calendar items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';

/**
 * Mautic API Client for Calendar
 */
class MauticCalendarClient {
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
   * Get scheduled campaigns
   */
  async getScheduledCampaigns(startDate?: string, endDate?: string) {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseUrl}/api/campaigns?limit=100&where[0][col]=isPublished&where[0][expr]=eq&where[0][val]=1`,
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
   * Get scheduled emails
   */
  async getScheduledEmails(startDate?: string, endDate?: string) {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseUrl}/api/emails?limit=100&where[0][col]=publishUp&where[0][expr]=gt&where[0][val]=${startDate || new Date().toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * GET /api/marketing/calendar
 * Fetch calendar items (campaigns, emails, social posts)
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const mautic = new MauticCalendarClient();

    // Fetch campaigns and emails in parallel
    const [campaignsData, emailsData] = await Promise.all([
      mautic.getScheduledCampaigns(startDate, endDate),
      mautic.getScheduledEmails(startDate, endDate),
    ]);

    // Transform to calendar items
    interface CalendarItem {
      id: string;
      title: string;
      type: string;
      date: string;
      status: string;
      channel: string;
      audience: number;
      createdAt: string;
    }
    const calendarItems: CalendarItem[] = [];

    // Add campaigns
    if (campaignsData.campaigns) {
      Object.values(campaignsData.campaigns).forEach((campaign: any) => {
        if (campaign.publishUp || campaign.publishDown) {
          calendarItems.push({
            id: `campaign-${campaign.id}`,
            title: campaign.name,
            type: 'campaign',
            date: campaign.publishUp || campaign.dateAdded,
            status: campaign.isPublished ? 'published' : 'scheduled',
            channel: 'email',
            audience: campaign.leads || 0,
            createdAt: campaign.dateAdded,
          });
        }
      });
    }

    // Add emails
    if (emailsData.emails) {
      Object.values(emailsData.emails).forEach((email: any) => {
        if (email.publishUp) {
          calendarItems.push({
            id: `email-${email.id}`,
            title: email.name,
            type: 'email',
            date: email.publishUp,
            status: email.isPublished ? 'published' : 'scheduled',
            channel: 'email',
            audience: email.sentCount || 0,
            createdAt: email.dateAdded,
          });
        }
      });
    }

    // Sort by date
    calendarItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      data: calendarItems,
      meta: {
        total: calendarItems.length,
        success: true,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}
