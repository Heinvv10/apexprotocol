/**
 * Engagement dispatcher — picks drafts out of the queue and posts them
 * through the platform composer.
 *
 * Two entry points:
 *   - dispatchDraft(id): post a single draft by id (called by the approval
 *     UI when a human clicks "approve")
 *   - dispatchPending(brandId?): scan for drafts that are eligible to post
 *     without human approval (autonomy mode = 'autonomous') and post them.
 *     Intended to be run by a cron/worker.
 *
 * The dispatcher owns the state transitions:
 *   pending → (autonomous mode) → posted / failed
 *   pending → approved (by human) → posted / failed
 */

import { and, eq, inArray } from "drizzle-orm";
import type { Browser, Page } from "puppeteer";
import { getDb } from "@/lib/db";
import {
  socialEngagementDrafts,
  type SocialEngagementDraft,
} from "@/lib/db/schema/social-engagement";
import { getCredential, launchSocialBrowser } from "@/lib/social/browser";
import { getAutonomyMode } from "./settings";

export interface DispatchResult {
  draftId: string;
  status: "posted" | "failed" | "skipped";
  postUrl?: string;
  errorMessage?: string;
}

/** Post a single draft by id. */
export async function dispatchDraft(draftId: string): Promise<DispatchResult> {
  const db = getDb();
  const draft = await db.query.socialEngagementDrafts.findFirst({
    where: eq(socialEngagementDrafts.id, draftId),
  });
  if (!draft) {
    return { draftId, status: "skipped", errorMessage: "draft not found" };
  }
  if (draft.status === "posted" || draft.status === "rejected") {
    return { draftId, status: "skipped", errorMessage: `already ${draft.status}` };
  }

  return runOneDraft(draft);
}

/**
 * Scan for drafts that can go out without human intervention and post
 * them. Filters: status=pending AND brand's autonomyMode=autonomous.
 * Optionally scope to a single brand.
 */
export async function dispatchPending(
  brandId?: string,
): Promise<DispatchResult[]> {
  const db = getDb();
  const candidates = await db
    .select()
    .from(socialEngagementDrafts)
    .where(
      brandId
        ? and(
            eq(socialEngagementDrafts.status, "pending"),
            eq(socialEngagementDrafts.brandId, brandId),
          )
        : eq(socialEngagementDrafts.status, "pending"),
    );

  const results: DispatchResult[] = [];
  for (const draft of candidates) {
    const mode = await getAutonomyMode(draft.brandId, draft.platform);
    if (mode !== "autonomous") {
      results.push({
        draftId: draft.id,
        status: "skipped",
        errorMessage: `mode=${mode}, not autonomous`,
      });
      continue;
    }
    results.push(await runOneDraft(draft));
  }
  return results;
}

/** Pick up all approved drafts (human-gated approvals) and post them. */
export async function dispatchApproved(
  brandId?: string,
): Promise<DispatchResult[]> {
  const db = getDb();
  const candidates = await db
    .select()
    .from(socialEngagementDrafts)
    .where(
      brandId
        ? and(
            eq(socialEngagementDrafts.status, "approved"),
            eq(socialEngagementDrafts.brandId, brandId),
          )
        : eq(socialEngagementDrafts.status, "approved"),
    );

  const results: DispatchResult[] = [];
  for (const draft of candidates) {
    results.push(await runOneDraft(draft));
  }
  return results;
}

/**
 * Core — post one draft through the right platform composer and update
 * the draft row. Launches a fresh browser per draft (expensive but avoids
 * cross-credential state leaks). Future optimisation: batch per credential.
 */
async function runOneDraft(draft: SocialEngagementDraft): Promise<DispatchResult> {
  const db = getDb();
  const credential = await getCredential(draft.credentialId);
  if (!credential || credential.status !== "active") {
    await markFailed(
      draft.id,
      `credential ${draft.credentialId} is ${credential?.status ?? "missing"}`,
    );
    return {
      draftId: draft.id,
      status: "failed",
      errorMessage: `credential ${draft.credentialId} unusable`,
    };
  }

  let browser: Browser | null = null;
  try {
    browser = await launchSocialBrowser({
      headless: true,
      userAgent: credential.userAgent,
      viewport: {
        width: credential.viewportWidth,
        height: credential.viewportHeight,
      },
    });
    const [page] = await browser.pages();

    const { postUrl } = await routeToPlatform(page, browser, credential, draft);

    await db
      .update(socialEngagementDrafts)
      .set({
        status: "posted",
        postedAt: new Date(),
        postUrl,
        updatedAt: new Date(),
      })
      .where(eq(socialEngagementDrafts.id, draft.id));

    return { draftId: draft.id, status: "posted", postUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailed(draft.id, message);
    return { draftId: draft.id, status: "failed", errorMessage: message };
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

async function routeToPlatform(
  page: Page,
  browser: Browser,
  credential: Awaited<ReturnType<typeof getCredential>>,
  draft: SocialEngagementDraft,
): Promise<{ postUrl?: string }> {
  if (!credential) throw new Error("credential null in router");

  const screenshotDir = process.env.SOCIAL_SCREENSHOT_DIR;

  if (draft.platform === "twitter") {
    const { loginToX, composePost } = await import("@/lib/social/x");
    await loginToX(browser, page, credential);
    // X doesn't yet expose a native reply-by-URL composer. For v1 we post
    // a standalone tweet that @-mentions the target — the dispatcher is
    // wired for 'reply' semantics but we fall back to open-post until the
    // reply-by-URL flow is added in a follow-up.
    const result = await composePost(page, credential, draft.draftText, screenshotDir);
    return { postUrl: result.postUrl };
  }

  if (draft.platform === "linkedin") {
    const { loginToLinkedIn, composePost } = await import("@/lib/social/linkedin");
    await loginToLinkedIn(browser, page, credential);
    const result = await composePost(
      page,
      credential,
      { text: draft.draftText },
      screenshotDir,
    );
    return { postUrl: result.screenshotPath ? `file://${result.screenshotPath}` : undefined };
  }

  if (draft.platform === "reddit") {
    const { loginToReddit, composeComment } = await import("@/lib/social/reddit");
    await loginToReddit(browser, page, credential);
    const result = await composeComment(
      page,
      credential,
      draft.targetUrl,
      draft.draftText,
      screenshotDir,
    );
    return { postUrl: result.postUrl };
  }

  if (draft.platform === "quora") {
    const { loginToQuora, composeAnswer } = await import("@/lib/social/quora");
    await loginToQuora(browser, page, credential);
    const result = await composeAnswer(
      page,
      credential,
      draft.targetUrl,
      { body: draft.draftText },
      screenshotDir,
    );
    return { postUrl: result.answerUrl };
  }

  throw new Error(`Platform ${draft.platform} has no engagement dispatcher yet`);
}

async function markFailed(draftId: string, errorMessage: string): Promise<void> {
  const db = getDb();
  await db
    .update(socialEngagementDrafts)
    .set({
      status: "failed",
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(socialEngagementDrafts.id, draftId));
}

/**
 * Human approval path: mark a draft as approved. The dispatcher's next
 * sweep (or an immediate dispatchDraft call) picks it up.
 */
export async function approveDraft(
  draftId: string,
  approvedBy: string,
): Promise<SocialEngagementDraft> {
  const db = getDb();
  const [updated] = await db
    .update(socialEngagementDrafts)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(socialEngagementDrafts.id, draftId),
        inArray(socialEngagementDrafts.status, ["pending"]),
      ),
    )
    .returning();
  if (!updated) {
    throw new Error(`Draft ${draftId} not in pending state`);
  }
  return updated;
}

export async function rejectDraft(
  draftId: string,
  rejectedBy: string,
): Promise<SocialEngagementDraft> {
  const db = getDb();
  const [updated] = await db
    .update(socialEngagementDrafts)
    .set({
      status: "rejected",
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(socialEngagementDrafts.id, draftId),
        inArray(socialEngagementDrafts.status, ["pending", "approved"]),
      ),
    )
    .returning();
  if (!updated) {
    throw new Error(`Draft ${draftId} not rejectable`);
  }
  return updated;
}
