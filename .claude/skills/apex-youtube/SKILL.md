---
name: apex-youtube
description: |
  Upload videos and Shorts to YouTube on behalf of Apex GEO, BrightTech,
  Jarvis Specter / Brightsphere, and managed client brands. Uses the
  official YouTube Data API v3 with OAuth (NOT browser automation —
  YouTube's uploader is aggressively anti-automation and the API path is
  the stable option).

  Unlike the other platform skills, this skill does NOT share
  `apex-social-browser`'s credential vault; it reuses Apex's existing
  OAuth token store via `publishing-service.ts`.

  ⚠️ STATUS — Phase 2: The YouTube publisher function currently returns
  "YOUTUBE_NOT_IMPLEMENTED". Full resumable upload implementation is
  deferred (est. 2–3 days of work). This skill is declared so the trigger
  surface is in place, but invocations will fail fast until the publisher
  is finished.

  USE WHEN the user says 'upload to YouTube', 'publish YouTube short',
  'post a YouTube video', 'upload this video', or shares a local video
  path with an intent to publish to YouTube.
---

# apex-youtube — YouTube Publishing (OAuth)

## Status

**Not yet fully implemented.** This SKILL.md documents the target design.
The underlying `publishToYouTube` in `src/lib/social/publishing-service.ts`
currently returns `YOUTUBE_NOT_IMPLEMENTED`. Do not attempt real uploads
until Phase 2 lands.

## Purpose

YouTube is the only platform in the Apex social-skill roster that must use
official OAuth rather than browser automation:

- Browser automation on YouTube Studio is extremely fragile and frequently
  blocked (uploading multi-GB video via DOM is not viable)
- The official YouTube Data API v3 supports resumable uploads, metadata,
  thumbnails, scheduling, and private → public transitions natively
- OAuth credentials persist cleanly via the existing `oauth_tokens` table

## Depends On

- `src/lib/social/publishing-service.ts` — extend the `publishToYouTube` stub
- `src/lib/oauth/token-service.ts` — existing OAuth token store
- `src/lib/oauth/providers/google.ts` (to be added or extended) — auth flow
- Google Cloud project + YouTube Data API v3 enabled + OAuth consent screen
  configured with `youtube.upload` scope

## Trigger Phrases

- "upload this video to YouTube: <path>"
- "publish a YouTube Short"
- "post <title> to <brand>'s YouTube channel"
- "schedule a YouTube upload"

## Intended Workflow (once implemented)

1. **Identify brand + channel** — via `oauth_tokens` entry for platform=youtube
2. **Validate video** — size (max 256GB), duration, codec
3. **Prepare metadata** — title (≤100 chars), description (≤5000 chars),
   tags, category (default: 28 Science & Technology), privacy (default: private)
4. **Draft + preview** — title, description, thumbnail path, visibility
5. **Submit** — resumable upload via Google's API:
   ```typescript
   // Planned API shape
   import { publishToSocial } from '@/lib/social/publishing-service';

   const result = await publishToSocial({
     brandId,
     platform: 'youtube',
     content: {
       text: description,
       mediaUrls: [localVideoPath],
       mediaType: 'video',
       link: thumbnailUrl, // optional
     },
   });
   ```
6. **Record** — upload job ID + video ID in `oauth_tokens` usage log;
   returned `postUrl` = `https://www.youtube.com/watch?v=<videoId>`

## Hard Guardrails

- **No auto-publish** — every upload requires explicit approval
- **Default visibility: private or unlisted** — never public-on-first-upload
  unless explicitly approved
- **No fabricated stats or claims** in descriptions
- **Copyright sanity** — do not upload audio/video the brand doesn't own
- **Shorts compliance** — vertical 9:16, <60s, with `#Shorts` in description

## Implementation Plan (Phase 2)

1. Register the Apex GEO app in Google Cloud Console
2. Enable YouTube Data API v3 + configure OAuth consent screen with
   `youtube.upload` + `youtube.readonly` scopes
3. Extend `src/lib/oauth/providers/` with `google-youtube.ts` handling
   authorization URL + token exchange
4. Add resumable-upload implementation in `publishing-service.ts`:
   - POST to `/upload/youtube/v3/videos?uploadType=resumable`
   - Upload video bytes in chunks with Content-Range headers
   - Poll completion endpoint
   - Optionally POST thumbnail to `/upload/youtube/v3/thumbnails/set`
5. Wire into the social settings UI at `src/app/dashboard/settings/social/page.tsx`
6. Add credential-add support — different from `scripts/add-social-credential.ts`
   because YouTube uses OAuth, not username/password

## Why Not Browser Automation

YouTube Studio's upload flow is:
- A drag-and-drop zone that requires real file-drop events
- Multi-step progress UI that changes shape mid-upload
- Heavy anti-automation fingerprinting
- 2FA-aggressive for any "unusual" upload pattern

Even if we made it work, it would break monthly. The OAuth API is stable
and the right tool.

## Kill Conditions

- No OAuth token for the target brand
- Token scope doesn't include `youtube.upload`
- Video file missing, too large, or unsupported codec
- Upload quota exhausted (daily 10,000 units default)
