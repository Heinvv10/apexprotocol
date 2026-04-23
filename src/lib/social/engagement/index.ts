/**
 * Public API for the hybrid-autonomy engagement surface.
 *
 * Usage:
 *   1. Scanner produces a mention
 *   2. generateReplyDraft(...) — Claude drafts a reply, rows into
 *      social_engagement_drafts with status='pending'
 *   3a. Autonomous mode: dispatchPending() picks it up and posts it
 *   3b. Drafted mode:   human calls approveDraft(id), then dispatchApproved() posts it
 *   4. Post status lands on the draft row — postUrl, postedAt, or failure reason
 */

export {
  getAutonomyMode,
  ensureSettings,
  type AutonomyMode,
  type EnsureSettingsInput,
} from "./settings";

export {
  generateReplyDraft,
  type GenerateDraftInput,
  type GenerateDraftResult,
  type MentionContext,
} from "./draft";

export {
  dispatchDraft,
  dispatchPending,
  dispatchApproved,
  approveDraft,
  rejectDraft,
  type DispatchResult,
} from "./dispatch";
