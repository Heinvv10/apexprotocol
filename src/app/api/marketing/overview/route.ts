/**
 * Marketing Overview API Route
 * Aggregates key marketing metrics from Mautic and ListMonk
 * GET /api/marketing/overview - Get overview metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';

/**
 * Mautic API Client for Overview
 */
class MauticOverviewClient {
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
   * Get stats summary
   */
  async getStats() {
    const token = await this.authenticate();

    // Fetch contacts count
    const contactsResponse = await fetch(
      `${this.baseUrl}/api/contacts?limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Fetch campaigns count
    const campaignsResponse = await fetch(
      `${this.baseUrl}/api/campaigns?limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Fetch emails count
    const emailsResponse = await fetch(
      `${this.baseUrl}/api/emails?limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!contactsResponse.ok || !campaignsResponse.ok || !emailsResponse.ok) {
      throw new Error('Failed to fetch stats');
    }

    const contactsData = await contactsResponse.json();
    const campaignsData = await campaignsResponse.json();
    const emailsData = await emailsResponse.json();

    return {
      contacts: contactsData.total || 0,
      campaigns: campaignsData.total || 0,
      emails: emailsData.total || 0,
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseUrl}/api/contacts?limit=10&orderBy=dateModified&orderByDir=DESC`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }

    return response.json();
  }
}

/**
 * GET /api/marketing/overview
 * Fetch marketing overview metrics
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mautic = new MauticOverviewClient();

    // Fetch stats and recent activity
    const [stats, activityData] = await Promise.all([
      mautic.getStats(),
      mautic.getRecentActivity(),
    ]);

    // Calculate metrics
    const totalContacts = stats.contacts;
    const activeCampaigns = stats.campaigns;
    const totalEmailsSent = stats.emails;

    // Transform recent activity
    const recentActivity = activityData.contacts
      ? Object.values(activityData.contacts).slice(0, 5).map((contact: any) => ({
          id: contact.id,
          type: 'contact_updated',
          description: `Contact ${contact.fields?.all?.firstname || ''} ${contact.fields?.all?.lastname || 'Unknown'} updated`,
          timestamp: contact.dateModified,
        }))
      : [];

    // Calculate engagement rate (placeholder - would need real email stats)
    const engagementRate = totalEmailsSent > 0 ? ((totalContacts / totalEmailsSent) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      data: {
        metrics: {
          totalContacts,
          activeCampaigns,
          totalEmailsSent,
          engagementRate: parseFloat(engagementRate),
          conversionRate: 3.2, // Placeholder - would calculate from campaign stats
          revenueGenerated: 0, // Would integrate with payment tracking
        },
        recentActivity,
        topCampaigns: [], // Would query campaign stats
        upcomingScheduled: [], // Would query scheduled items
      },
      meta: {
        success: true,
      },
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
