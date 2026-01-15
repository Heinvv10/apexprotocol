/**
 * ListMonk Webhook Handler
 * Processes real-time events from ListMonk (subscriber_confirmed, campaign_started, link_clicked, etc.)
 * POST /api/webhooks/listmonk
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  leads,
  emailEvents,
  emailLists,
} from '@/lib/db/schema/marketing';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle subscriber_confirmed event
 */
async function handleSubscriberConfirmed(
  orgId: string,
  event: any
) {
  const { subscriber, list } = event;

  // Check if lead already exists
  const existingLead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.email, subscriber.email)
      )
    )
    .limit(1);

  if (existingLead.length === 0) {
    // Create new lead
    await db.insert(leads).values({
      id: uuidv4(),
      organizationId: orgId,
      externalLeadId: subscriber.id?.toString(),
      email: subscriber.email,
      firstName: subscriber.name?.split(' ')[0] || '',
      lastName: subscriber.name?.split(' ').slice(1).join(' ') || '',
      company: '',
      title: '',
      phone: '',
      source: 'email' as const,
      status: 'contacted' as const,
      leadScore: 5, // Confirmed subscribers start with some score
      mqlScore: 0,
      sqlScore: 0,
      tags: [list.name],
      metadata: {
        listmonkId: subscriber.id?.toString(),
        listId: list.id?.toString(),
        attributes: subscriber.attribs,
      },
      lastEngagedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Handle campaign_started event
 */
async function handleCampaignStarted(
  orgId: string,
  event: any
) {
  // Log campaign start - could update campaign status in campaigns table
  console.log(`Campaign started: ${event.campaign.name} for list: ${event.list.name}`);
}

/**
 * Handle link_clicked event
 */
async function handleLinkClicked(
  orgId: string,
  event: any
) {
  const { subscriber, campaign, link } = event;

  // Find lead by email
  const lead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.email, subscriber.email)
      )
    )
    .limit(1);

  if (lead.length > 0) {
    // Record email click event
    await db.insert(emailEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: lead[0].id,
      campaignId: undefined,
      listId: undefined,
      event: 'clicked' as const,
      url: link.url,
      userAgent: null,
      ipAddress: null,
      metadata: {
        listmonkId: subscriber.id?.toString(),
        campaignId: campaign.id?.toString(),
        linkId: link.id?.toString(),
        clickCount: event.click_count,
      },
      timestamp: new Date(),
    });

    // Update lead engagement score
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
 * Handle campaign_unsubscribe event
 */
async function handleCampaignUnsubscribe(
  orgId: string,
  event: any
) {
  const { subscriber } = event;

  // Find lead by email
  const lead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.email, subscriber.email)
      )
    )
    .limit(1);

  if (lead.length > 0) {
    // Record unsubscribe event
    await db.insert(emailEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: lead[0].id,
      campaignId: undefined,
      listId: undefined,
      event: 'unsubscribed' as const,
      url: null,
      userAgent: null,
      ipAddress: null,
      metadata: {
        listmonkId: subscriber.id?.toString(),
        reason: event.reason || 'unsubscribed',
      },
      timestamp: new Date(),
    });

    // Update lead status
    await db
      .update(leads)
      .set({
        status: 'lost' as const,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead[0].id));
  }
}

/**
 * Handle message_bounced event
 */
async function handleMessageBounced(
  orgId: string,
  event: any
) {
  const { subscriber } = event;

  // Find lead by email
  const lead = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, orgId),
        eq(leads.email, subscriber.email)
      )
    )
    .limit(1);

  if (lead.length > 0) {
    // Record bounce event
    await db.insert(emailEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: lead[0].id,
      campaignId: undefined,
      listId: undefined,
      event: 'bounced' as const,
      url: null,
      userAgent: null,
      ipAddress: null,
      metadata: {
        listmonkId: subscriber.id?.toString(),
        bounceType: event.bounce_type,
      },
      timestamp: new Date(),
    });
  }
}

/**
 * POST /api/webhooks/listmonk
 * Receive and process ListMonk webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgId = request.headers.get('x-organization-id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing organization ID' },
        { status: 400 }
      );
    }

    const eventType = body.type;

    switch (eventType) {
      case 'subscriber_confirmed':
        await handleSubscriberConfirmed(orgId, body.data);
        break;
      case 'campaign_started':
        await handleCampaignStarted(orgId, body.data);
        break;
      case 'link_clicked':
        await handleLinkClicked(orgId, body.data);
        break;
      case 'campaign_unsubscribe':
        await handleCampaignUnsubscribe(orgId, body.data);
        break;
      case 'message_bounced':
        await handleMessageBounced(orgId, body.data);
        break;
      default:
        console.log(`Unhandled ListMonk event type: ${eventType}`);
    }

    return NextResponse.json({
      data: {
        processed: true,
        eventType,
      },
      meta: { success: true },
    });
  } catch (error) {
    console.error('Error processing ListMonk webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
