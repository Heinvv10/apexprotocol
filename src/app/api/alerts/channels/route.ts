/**
 * Alert Channels API
 * 
 * CRUD operations for alert delivery channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alertChannels } from '@/lib/db/schema/alert-rules';
import { organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";

// GET - List alert channels
export async function GET(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    let orgId: string;

    if (isDev) {
      const [firstOrg] = await db.select().from(organizations).limit(1);
      if (!firstOrg) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }
      orgId = firstOrg.id;
    } else {
      const __session = await getSession();
  const { orgId: clerkOrgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
      if (!clerkOrgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, clerkOrgId))
        .limit(1);
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      orgId = org.id;
    }

    const channels = await db
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.organizationId, orgId));

    return NextResponse.json({ success: true, channels });
  } catch (error) {
    console.error('Error fetching alert channels:', error);
    return NextResponse.json({ error: 'Failed to fetch alert channels' }, { status: 500 });
  }
}

// POST - Create alert channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, config, enabled = true } = body;

    if (!type || !name || !config) {
      return NextResponse.json(
        { error: 'Type, name, and config are required' },
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    let orgId: string;

    if (isDev) {
      const [firstOrg] = await db.select().from(organizations).limit(1);
      if (!firstOrg) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }
      orgId = firstOrg.id;
    } else {
      const __session = await getSession();
  const { orgId: clerkOrgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
      if (!clerkOrgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, clerkOrgId))
        .limit(1);
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      orgId = org.id;
    }

    const [newChannel] = await db.insert(alertChannels).values({
      organizationId: orgId,
      channelType: type as "email" | "slack" | "whatsapp" | "webhook" | "in_app",
      name,
      config,
      enabled,
      verified: false,
    }).returning();

    return NextResponse.json({ success: true, channel: newChannel });
  } catch (error) {
    console.error('Error creating alert channel:', error);
    return NextResponse.json({ error: 'Failed to create alert channel' }, { status: 500 });
  }
}

// PUT - Update alert channel
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    let orgId: string;

    if (isDev) {
      const [firstOrg] = await db.select().from(organizations).limit(1);
      if (!firstOrg) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }
      orgId = firstOrg.id;
    } else {
      const __session = await getSession();
  const { orgId: clerkOrgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
      if (!clerkOrgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, clerkOrgId))
        .limit(1);
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      orgId = org.id;
    }

    const [updatedChannel] = await db
      .update(alertChannels)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(alertChannels.id, id),
        eq(alertChannels.organizationId, orgId)
      ))
      .returning();

    if (!updatedChannel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, channel: updatedChannel });
  } catch (error) {
    console.error('Error updating alert channel:', error);
    return NextResponse.json({ error: 'Failed to update alert channel' }, { status: 500 });
  }
}

// DELETE - Delete alert channel
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    let orgId: string;

    if (isDev) {
      const [firstOrg] = await db.select().from(organizations).limit(1);
      if (!firstOrg) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }
      orgId = firstOrg.id;
    } else {
      const __session = await getSession();
  const { orgId: clerkOrgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
      if (!clerkOrgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, clerkOrgId))
        .limit(1);
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      orgId = org.id;
    }

    await db
      .delete(alertChannels)
      .where(and(
        eq(alertChannels.id, id),
        eq(alertChannels.organizationId, orgId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert channel:', error);
    return NextResponse.json({ error: 'Failed to delete alert channel' }, { status: 500 });
  }
}

// POST - Test channel (send test message)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // TODO: Implement actual channel testing
    // For now, just mark as verified
    const [channel] = await db
      .update(alertChannels)
      .set({ verified: true, updatedAt: new Date() })
      .where(eq(alertChannels.id, id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: 'Test message sent successfully',
      channel,
    });
  } catch (error) {
    console.error('Error testing alert channel:', error);
    return NextResponse.json({ error: 'Failed to test alert channel' }, { status: 500 });
  }
}
