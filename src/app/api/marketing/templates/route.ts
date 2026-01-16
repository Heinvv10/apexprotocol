/**
 * Marketing Templates API Route
 * Wraps Mautic API for email template management
 * GET  /api/marketing/templates - Get all templates
 * POST /api/marketing/templates - Create new template
 * GET  /api/marketing/templates/:id - Get template details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().optional(),
  content: z.string().optional(),
});

type CreateTemplateRequest = z.infer<typeof createTemplateSchema>;

/**
 * Mautic API Client for Templates
 */
class MauticTemplatesClient {
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
   * Get all email templates
   */
  async getTemplates(limit = 100, page = 1) {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseUrl}/api/emails?limit=${limit}&page=${page}&where[0][col]=emailType&where[0][expr]=eq&where[0][val]=template`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get single template
   */
  async getTemplate(id: string) {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/emails/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new template
   */
  async createTemplate(data: CreateTemplateRequest) {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        subject: data.subject || '',
        customHtml: data.content || '',
        emailType: 'template',
        isPublished: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * GET /api/marketing/templates
 * Fetch all templates from Mautic
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mautic = new MauticTemplatesClient();
    const templates = await mautic.getTemplates();

    // Transform Mautic response to Apex format
    const transformed = templates.emails
      ? Object.values(templates.emails).map((email: any) => ({
          id: email.id,
          name: email.name,
          subject: email.subject || '',
          type: email.template || 'custom',
          usage: 0, // Would need to query campaigns using this template
          lastUsed: email.dateModified,
          createdAt: email.dateAdded,
          updatedAt: email.dateModified,
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
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/templates
 * Create a new template in Mautic
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid template data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const mautic = new MauticTemplatesClient();
    const result = await mautic.createTemplate(validation.data);

    return NextResponse.json(
      {
        data: {
          id: result.email.id,
          name: result.email.name,
          subject: result.email.subject,
          createdAt: result.email.dateAdded,
        },
        meta: { success: true },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
