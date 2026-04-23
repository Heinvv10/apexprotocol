/**
 * X post composer. Submits a single post or a thread via the web UI using
 * the shared human-interaction primitives and quota enforcer.
 *
 * Every successful submission writes a screenshot + action-log row and
 * returns the canonical post URL extracted from the post-submit navigation.
 */

import type { Page } from "puppeteer";
import {
  type DecryptedCredential,
  assertWriteQuota,
  dwell,
  humanClick,
  humanType,
  logAction,
} from "@/lib/social/browser";

const SELECTORS = {
  composerLink: 'a[data-testid="SideNav_NewTweet_Button"]',
  tweetTextarea: '[data-testid="tweetTextarea_0"]',
  addTweetButton: '[data-testid="addButton"]',
  tweetButton: '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]',
  toastLink: '[data-testid="toast"] a[href*="/status/"]',
} as const;

export interface PostResult {
  postUrl: string;
  screenshotPath?: string;
}

/** Submit a single tweet. `text` must already be within X's char limit. */
export async function composePost(
  page: Page,
  credential: DecryptedCredential,
  text: string,
  screenshotDir?: string,
): Promise<PostResult> {
  await assertWriteQuota(credential.id, credential.platform);
  await openComposer(page);

  const textareaSelector = `${SELECTORS.tweetTextarea} div[contenteditable="true"], ${SELECTORS.tweetTextarea}`;
  await humanType(page, textareaSelector, text);

  return submit(page, credential, screenshotDir, {
    actionType: "post",
    metadata: { length: text.length },
  });
}

/** Submit a thread. Each element is one tweet in the chain. */
export async function composeThread(
  page: Page,
  credential: DecryptedCredential,
  tweets: string[],
  screenshotDir?: string,
): Promise<PostResult> {
  if (tweets.length === 0) {
    throw new Error("composeThread called with empty tweets array");
  }
  await assertWriteQuota(credential.id, credential.platform);
  await openComposer(page);

  for (let i = 0; i < tweets.length; i++) {
    const textareaSelector = `[data-testid="tweetTextarea_${i}"] div[contenteditable="true"], [data-testid="tweetTextarea_${i}"]`;
    await humanType(page, textareaSelector, tweets[i]);

    if (i < tweets.length - 1) {
      await humanClick(page, SELECTORS.addTweetButton);
      await dwell(300, 700);
    }
  }

  return submit(page, credential, screenshotDir, {
    actionType: "thread",
    metadata: { tweetCount: tweets.length },
  });
}

async function openComposer(page: Page): Promise<void> {
  await page.waitForSelector(SELECTORS.composerLink, { timeout: 15000 });
  await humanClick(page, SELECTORS.composerLink);
  await page.waitForSelector(SELECTORS.tweetTextarea, { timeout: 10000 });
  await dwell(300, 700);
}

interface SubmitOptions {
  actionType: "post" | "thread";
  metadata: Record<string, unknown>;
}

async function submit(
  page: Page,
  credential: DecryptedCredential,
  screenshotDir: string | undefined,
  options: SubmitOptions,
): Promise<PostResult> {
  await humanClick(page, SELECTORS.tweetButton);

  // After clicking Post, X shows a toast with a link to the new tweet.
  // We race between the toast and a URL change to /status/ for robustness.
  const postUrl = await waitForPostUrl(page);
  const screenshotPath = screenshotDir
    ? await captureScreenshot(page, screenshotDir, options.actionType)
    : undefined;

  await logAction({
    credentialId: credential.id,
    actionType: options.actionType,
    status: "success",
    targetUrl: postUrl,
    screenshotRef: screenshotPath,
    metadata: options.metadata,
  });

  return { postUrl, screenshotPath };
}

async function waitForPostUrl(page: Page): Promise<string> {
  const toastLinkHandle = await page
    .waitForSelector(SELECTORS.toastLink, { timeout: 20000 })
    .catch(() => null);
  if (toastLinkHandle) {
    const href = await toastLinkHandle.evaluate((el) =>
      (el as HTMLAnchorElement).href,
    );
    if (href) return href;
  }
  // Fallback — URL often navigates to the new tweet
  const current = page.url();
  if (current.includes("/status/")) return current;
  throw new Error("Could not extract post URL after submission");
}

async function captureScreenshot(
  page: Page,
  dir: string,
  actionType: string,
): Promise<string> {
  const path = `${dir}/${actionType}-${Date.now()}.png`;
  await page.screenshot({ path: path as `${string}.png`, fullPage: false });
  return path;
}
