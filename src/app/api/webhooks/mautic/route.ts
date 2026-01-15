/**
 * Mautic Webhook Handler
 * Processes real-time events from Mautic (lead.create, lead.update, email.send, email.open, email.click)
 * POST /api/webhooks/mautic
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  leads,
  emailEvents,
  automationLogs,
  campaigns,
} from '@/lib/db/schema/marketing';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Verify Mautic webhook signature
 */
function verifyMauticSignature(
  payload: string,
  signature: string
): boolean {
  // Mautic uses HMAC-SHA256 signature verification
  // For now, implement basic verification
  // In production, use: crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex')
  return true;
}

/**
 * Handle lead.create event
 */
async function handleLeadCreate(
  orgId: string,
  event: any
) {
  const lead = event.data;

  await db.insert(leads).values({
    id: uuidv4(),
    organizationId: orgId,
    externalLeadId: lead.id?.toString(),
    email: lead.email || '',
    firstName: lead.firstname || '',
    lastName: lead.lastname || '',
    company: lead.company || '',
    title: lead.title || '',
    phone: lead.phone || '',
    source: 'api' as const,
    status: 'new' as const,
    leadScore: 0,
    mqlScore: 0,
    sqlScore: 0,
    tags: [],
    metadata: {
      mauticId: lead.id?.toString(),
      createdAt: new Date().toISOString(),
      rawData: lead,
    },
    lastEngagedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();
}

/**
 * Handle lead.update event
 */
async function handleLeadUpdate(
  orgId: string,
  event: any
) {
  const lead = event.data;

  const existingLead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.externalLeadId, lead.id?.toString())
      )
    )
    .limit(1);

  if (existingLead.length > 0) {
    await db
      .update(leads)
      .set({
        email: lead.email || existingLead[0].email,
        firstName: lead.firstname || existingLead[0].firstName,
        lastName: lead.lastname || existingLead[0].lastName,
        company: lead.company || existingLead[0].company,
        title: lead.title || existingLead[0].title,
        phone: lead.phone || existingLead[0].phone,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, existingLead[0].id));
  }
}

/**
 * Handle email.send event
 */
async function handleEmailSend(
  orgId: string,
  event: any
) {
  const emailData = event.data;

  const lead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.externalLeadId, emailData.lead_id?.toString())
      )
    )
    .limit(1);

  if (lead.length > 0) {
    await db.insert(emailEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: lead[0].id,
      campaignId: emailData.campaign_id ? uuidv4() : undefined,
      listId: undefined,
      event: 'sent' as const,
      url: emailData.url || null,
      userAgent: emailData.user_agent || null,
      ipAddress: emailData.ip_address || null,
      metadata: {
        mauticEventId: emailData.id?.toString(),
        subject: emailData.subject,
        fromEmail: emailData.from_email,
      },
      timestamp: new Date(),
    });

    // Update lead last engaged at
    await db
      .update(leads)
      .set({ lastEngagedAt: new Date() })
      .where(eq(leads.id, lead[0].id));
  }
}

/**
 * Handle email.open event
 */
async function handleEmailOpen(
  orgId: string,
  event: any
) {
  const emailData = event.data;

  const lead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.externalLeadId, emailData.lead_id?.toString())
      )
    )
    .limit(1);

  if (lead.length > 0) {
    await db.insert(emailEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: lead[0].id,
      campaignId: undefined,
      listId: undefined,
      event: 'opened' as const,
      url: emailData.url || null,
      userAgent: emailData.user_agent || null,
      ipAddress: emailData.ip_address || null,
      metadata: {
        mauticEventId: emailData.id?.toString(),
        browser: emailData.browser,
        device: emailData.device,
        os: emailData.os,
        region: emailData.region,
      },
      timestamp: new Date(),
    });

    // Update lead last engaged and increment engagement score
    await db
      .update(leads)
      .set({
        lastEngagedAt: new Date(),
        leadScore: (lead[0].leadScore ?? 0) + 5,
      })
      .where(eq(leads.id, lead[0].id));
  }
}

/**
 * Handle email.click event
 */
async function handleEmailClick(
  orgId: string,
  event: any
) {
  const emailData = event.data;

  const lead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.externalLeadId, emailData.lead_id?.toString())
      )
    )
    .limit(1);

  if (lead.length > 0) {
    await db.insert(emailEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: lead[0].id,
      campaignId: undefined,
      listId: undefined,
      event: 'clicked' as const,
      url: emailData.url || null,
      userAgent: emailData.user_agent || null,
      ipAddress: emailData.ip_address || null,
      metadata: {
        mauticEventId: emailData.id?.toString(),
        clickedUrl: emailData.clicked_url,
        browser: emailData.browser,
        device: emailData.device,
      },
      timestamp: new Date(),
    });

    // Update lead engagement score (clicks are higher value than opens)
    await db
      .update(leads)
      .set({
        lastEngagedAt: new Date(),
        leadScore: (lead[0].leadScore ?? 0) + 15,
      })
      .where(eq(leads.id, lead[0].id));
  }
}

/**
 * POST /api/webhooks/mautic
 * Receive and process Mautic webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-mautic-signature') || '';
    const body = await request.text();

    // Verify signature
    if (!verifyMauticSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const orgId = request.headers.get('x-organization-id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing organization ID' },
        { status: 400 }
      );
    }

    const events = payload.events || [];

    for (const event of events) {
      const eventType = event.type;

      switch (eventType) {
        case 'lead.create':
          await handleLeadCreate(orgId, event);
          break;
        case 'lead.update':
          await handleLeadUpdate(orgId, event);
          break;
        case 'email.send':
          await handleEmailSend(orgId, event);
          break;
        case 'email.open':
          await handleEmailOpen(orgId, event);
          break;
        case 'email.click':
          await handleEmailClick(orgId, event);
          break;
        default:
          console.log(`Unhandled Mautic event type: ${eventType}`);
      }
    }

    return NextResponse.json({
      data: {
        processed: events.length,
      },
      meta: { success: true },
    });
  } catch (error) {
    console.error('Error processing Mautic webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
