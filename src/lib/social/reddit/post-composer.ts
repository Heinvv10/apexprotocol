/**
 * Reddit post + comment composer.
 *
 * Reddit rewards comments more than posts for most agency use cases. Both
 * surfaces are exposed:
 *   - composePost: submit a link or text post to a subreddit
 *   - composeComment: reply to an existing post or comment by URL
 *
 * After submission, Reddit navigates to the canonical URL of the new post
 * or keeps the user on the thread for comments — both cases yield a clean
 * post/comment URL we can capture.
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
  // Submit page
  titleInput: 'textarea[name="title"], input[name="title"]',
  bodyEditor: 'div[contenteditable="true"][name="bodytext"], div[role="textbox"]',
  linkUrlInput: 'input[name="link"], input[placeholder*="URL"]',
  postButton: 'button[data-testid="submit-post-button"], button:has-text("Post")',
  // Thread / comment
  commentBox: 'div[role="textbox"][aria-label*="Comment"], textarea[name="text"]',
  commentSubmitButton: 'button:has-text("Comment"):not([disabled])',
  commentedLink: 'a[data-click-id="timestamp"]',
} as const;

export interface TextPostContent {
  kind: "text";
  title: string;
  body: string;
}

export interface LinkPostContent {
  kind: "link";
  title: string;
  url: string;
}

export type PostContent = TextPostContent | LinkPostContent;

export interface PostResult {
  postUrl?: string;
  screenshotPath?: string;
}

/** Submit a post to a subreddit. `subreddit` is the short name, e.g. "SEO". */
export async function composePost(
  page: Page,
  credential: DecryptedCredential,
  subreddit: string,
  content: PostContent,
  screenshotDir?: string,
): Promise<PostResult> {
  await assertWriteQuota(credential.id, credential.platform);

  const submitUrl =
    content.kind === "link"
      ? `https://www.reddit.com/r/${subreddit}/submit?type=LINK`
      : `https://www.reddit.com/r/${subreddit}/submit?type=TEXT`;

  await page.goto(submitUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(SELECTORS.titleInput, { timeout: 20000 });
  await humanType(page, SELECTORS.titleInput, content.title);
  await dwell(400, 800);

  if (content.kind === "link") {
    await humanType(page, SELECTORS.linkUrlInput, content.url);
  } else {
    await page.waitForSelector(SELECTORS.bodyEditor, { timeout: 10000 });
    await page.evaluate(
      (selector, body) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (!el) throw new Error("Reddit body editor missing");
        el.focus();
        document.execCommand("insertText", false, body);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      },
      SELECTORS.bodyEditor,
      content.body,
    );
  }
  await dwell(1000, 2000);

  await humanClick(page, SELECTORS.postButton);
  const postUrl = await waitForPostUrl(page);

  const screenshotPath = screenshotDir
    ? await captureScreenshot(page, screenshotDir, "reddit-post")
    : undefined;

  await logAction({
    credentialId: credential.id,
    actionType: "post",
    status: "success",
    targetUrl: postUrl,
    screenshotRef: screenshotPath,
    metadata: { subreddit, kind: content.kind, titleLength: content.title.length },
  });

  return { postUrl, screenshotPath };
}

/** Reply to a post or comment. `threadUrl` must be the canonical reddit URL. */
export async function composeComment(
  page: Page,
  credential: DecryptedCredential,
  threadUrl: string,
  body: string,
  screenshotDir?: string,
): Promise<PostResult> {
  await assertWriteQuota(credential.id, credential.platform);

  await page.goto(threadUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(SELECTORS.commentBox, { timeout: 20000 });

  await humanClick(page, SELECTORS.commentBox);
  await page.evaluate(
    (selector, text) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) throw new Error("Reddit comment box missing");
      el.focus();
      if (el.tagName === "TEXTAREA") {
        (el as HTMLTextAreaElement).value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        document.execCommand("insertText", false, text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    SELECTORS.commentBox,
    body,
  );
  await dwell(1000, 1800);

  await humanClick(page, SELECTORS.commentSubmitButton);
  await dwell(2000, 3500);

  // After submit, a new comment appears in the thread — we log the thread
  // URL as the target. Extracting the exact permalink would require polling
  // the DOM for the newly-inserted node, which is brittle.
  const screenshotPath = screenshotDir
    ? await captureScreenshot(page, screenshotDir, "reddit-comment")
    : undefined;

  await logAction({
    credentialId: credential.id,
    actionType: "comment",
    status: "success",
    targetUrl: threadUrl,
    screenshotRef: screenshotPath,
    metadata: { bodyLength: body.length },
  });

  return { postUrl: threadUrl, screenshotPath };
}

async function waitForPostUrl(page: Page): Promise<string> {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (url.includes("/comments/")) return url;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Reddit did not navigate to /comments/ after submit");
}

async function captureScreenshot(
  page: Page,
  dir: string,
  label: string,
): Promise<string> {
  const path = `${dir}/${label}-${Date.now()}.png`;
  await page.screenshot({ path: path as `${string}.png`, fullPage: false });
  return path;
}
