/**
 * Action audit log writer for social-browser automation.
 *
 * Every write (post, reply, comment, login) and notable navigation gets a
 * row in social_browser_actions with a screenshot reference where relevant.
 * Retention: 90 days, see apex-social-browser PRD §4.5.
 */

import { getDb } from "@/lib/db";
import {
  socialBrowserActions,
  type NewSocialBrowserAction,
  type SocialBrowserAction,
} from "@/lib/db/schema/social-browser-auth";

export interface LogActionInput {
  credentialId: string;
  actionType: SocialBrowserAction["actionType"];
  status: SocialBrowserAction["status"];
  targetUrl?: string;
  errorMessage?: string;
  screenshotRef?: string;
  metadata?: Record<string, unknown>;
}

export async function logAction(
  input: LogActionInput,
): Promise<SocialBrowserAction> {
  const db = getDb();
  const row: NewSocialBrowserAction = {
    credentialId: input.credentialId,
    actionType: input.actionType,
    status: input.status,
    targetUrl: input.targetUrl,
    errorMessage: input.errorMessage,
    screenshotRef: input.screenshotRef,
    metadata: input.metadata ?? {},
  };
  const [inserted] = await db
    .insert(socialBrowserActions)
    .values(row)
    .returning();
  return inserted;
}
