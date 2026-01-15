/**
 * Postiz Webhook Handler
 * Processes real-time events from Postiz (post.published, post.failed, engagement events)
 * POST /api/webhooks/postiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  socialPosts,
  analyticsEvents,
} from '@/lib/db/schema/marketing';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle post.published event
 */
async function handlePostPublished(
  orgId: string,
  event: any
) {
  const postData = event.data;

  // Find post by external ID
  const post = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.externalPostId, postData.id?.toString()))
    .limit(1);

  if (post.length > 0) {
    // Update post status to published
    await db
      .update(socialPosts)
      .set({
        status: 'published' as const,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post[0].id));
  }
}

/**
 * Handle post.failed event
 */
async function handlePostFailed(
  orgId: string,
  event: any
) {
  const postData = event.data;

  // Find post by external ID
  const post = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.externalPostId, postData.id?.toString()))
    .limit(1);

  if (post.length > 0) {
    // Update post status to failed
    await db
      .update(socialPosts)
      .set({
        status: 'failed' as const,
        updatedAt: new Date(),
        metadata: {
          ...post[0].metadata,
          failureReason: event.reason,
        },
      })
      .where(eq(socialPosts.id, post[0].id));
  }
}

/**
 * Handle post.engagement event (likes, comments, shares, views)
 */
async function handlePostEngagement(
  orgId: string,
  event: any
) {
  const postData = event.data;

  // Find post by external ID
  const post = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.externalPostId, postData.id?.toString()))
    .limit(1);

  if (post.length > 0) {
    // Calculate engagement rate
    const totalEngagement =
      (postData.likes || 0) +
      (postData.comments || 0) +
      (postData.shares || 0);
    const engagementRate =
      postData.views && postData.views > 0
        ? ((totalEngagement / postData.views) * 100).toFixed(2)
        : '0';

    // Update post engagement metrics
    await db
      .update(socialPosts)
      .set({
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        shares: postData.shares || 0,
        views: postData.views || 0,
        engagementRate: engagementRate,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post[0].id));

    // Record engagement event in analytics
    await db.insert(analyticsEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: undefined,
      campaignId: post[0].campaignId || undefined,
      eventType: 'social_engagement',
      sessionId: null,
      userId: null,
      pageUrl: postData.url || null,
      referrer: null,
      utmSource: 'social',
      utmMedium: postData.platform || 'social',
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      userAgent: null,
      ipAddress: null,
      properties: {
        platform: postData.platform,
        postId: postData.id,
        likes: postData.likes,
        comments: postData.comments,
        shares: postData.shares,
        views: postData.views,
      },
      timestamp: new Date(),
    });
  }
}

/**
 * Handle comment event
 */
async function handleCommentReceived(
  orgId: string,
  event: any
) {
  const commentData = event.data;

  // Find post by external ID
  const post = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.externalPostId, commentData.post_id?.toString()))
    .limit(1);

  if (post.length > 0) {
    // Increment comment count
    const newCommentCount = (post[0].comments || 0) + 1;
    await db
      .update(socialPosts)
      .set({
        comments: newCommentCount,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post[0].id));

    // Record comment event
    await db.insert(analyticsEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: undefined,
      campaignId: post[0].campaignId || undefined,
      eventType: 'social_comment',
      sessionId: null,
      userId: commentData.commenter_id?.toString() || null,
      pageUrl: commentData.post_url || null,
      referrer: null,
      utmSource: 'social',
      utmMedium: commentData.platform || 'social',
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      userAgent: null,
      ipAddress: null,
      properties: {
        platform: commentData.platform,
        postId: commentData.post_id,
        commenterId: commentData.commenter_id,
        commentText: commentData.comment_text,
      },
      timestamp: new Date(),
    });
  }
}

/**
 * Handle share event
 */
async function handleShareReceived(
  orgId: string,
  event: any
) {
  const shareData = event.data;

  // Find post by external ID
  const post = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.externalPostId, shareData.post_id?.toString()))
    .limit(1);

  if (post.length > 0) {
    // Increment share count
    const newShareCount = (post[0].shares || 0) + 1;
    await db
      .update(socialPosts)
      .set({
        shares: newShareCount,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post[0].id));

    // Record share event
    await db.insert(analyticsEvents).values({
      id: uuidv4(),
      organizationId: orgId,
      leadId: undefined,
      campaignId: post[0].campaignId || undefined,
      eventType: 'social_share',
      sessionId: null,
      userId: shareData.sharer_id?.toString() || null,
      pageUrl: shareData.post_url || null,
      referrer: null,
      utmSource: 'social',
      utmMedium: shareData.platform || 'social',
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      userAgent: null,
      ipAddress: null,
      properties: {
        platform: shareData.platform,
        postId: shareData.post_id,
        sharerId: shareData.sharer_id,
      },
      timestamp: new Date(),
    });
  }
}

/**
 * POST /api/webhooks/postiz
 * Receive and process Postiz webhook events
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
      case 'post.published':
        await handlePostPublished(orgId, body);
        break;
      case 'post.failed':
        await handlePostFailed(orgId, body);
        break;
      case 'post.engagement':
        await handlePostEngagement(orgId, body);
        break;
      case 'comment.received':
        await handleCommentReceived(orgId, body);
        break;
      case 'share.received':
        await handleShareReceived(orgId, body);
        break;
      default:
        console.log(`Unhandled Postiz event type: ${eventType}`);
    }

    return NextResponse.json({
      data: {
        processed: true,
        eventType,
      },
      meta: { success: true },
    });
  } catch (error) {
    console.error('Error processing Postiz webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
