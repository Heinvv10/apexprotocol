/**
 * Quora answer + post composer.
 *
 * Quora's agency value is almost entirely answers (reply to existing
 * questions). We also expose composePost for Space posts, but answers are
 * the primary surface.
 */

import type { Page } from "puppeteer";
import {
  type DecryptedCredential,
  assertWriteQuota,
  dwell,
  humanClick,
  logAction,
} from "@/lib/social/browser";

const SELECTORS = {
  answerButton:
    'button:has-text("Answer"), div[role="button"]:has-text("Answer")',
  answerEditor: 'div[role="textbox"][contenteditable="true"]',
  submitAnswerButton: 'button:has-text("Post"), button:has-text("Submit"):not([disabled])',
  postTextEditor: 'div[role="textbox"][contenteditable="true"]',
  createPostButton:
    'button:has-text("Post"), div[role="button"]:has-text("Create Post")',
} as const;

export interface AnswerContent {
  body: string;
}

export interface PostResult {
  answerUrl?: string;
  screenshotPath?: string;
}

/** Reply to an existing Quora question. `questionUrl` must be the canonical URL. */
export async function composeAnswer(
  page: Page,
  credential: DecryptedCredential,
  questionUrl: string,
  content: AnswerContent,
  screenshotDir?: string,
): Promise<PostResult> {
  await assertWriteQuota(credential.id, credential.platform);

  await page.goto(questionUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(SELECTORS.answerButton, { timeout: 20000 });
  await humanClick(page, SELECTORS.answerButton);

  await page.waitForSelector(SELECTORS.answerEditor, { timeout: 15000 });
  await page.evaluate(
    (selector, text) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) throw new Error("Quora answer editor missing");
      el.focus();
      document.execCommand("insertText", false, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    SELECTORS.answerEditor,
    content.body,
  );
  await dwell(1500, 2500);

  await humanClick(page, SELECTORS.submitAnswerButton);
  await dwell(3000, 5000);

  const answerUrl = page.url();
  const screenshotPath = screenshotDir
    ? await captureScreenshot(page, screenshotDir, "quora-answer")
    : undefined;

  await logAction({
    credentialId: credential.id,
    actionType: "reply",
    status: "success",
    targetUrl: answerUrl,
    screenshotRef: screenshotPath,
    metadata: { questionUrl, bodyLength: content.body.length },
  });

  return { answerUrl, screenshotPath };
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
