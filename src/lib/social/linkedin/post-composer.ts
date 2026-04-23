/**
 * LinkedIn post composer. Supports personal-feed posts and Company Page
 * posts via the admin "Share" flow. Both paths share the same media-upload
 * and text-entry mechanics.
 *
 * Per FINDINGS.md §3.2: the earlier Playwright bot's modal-close wait was
 * unreliable. We wait for a positive success signal — either the success
 * toast, the dialog actually hiding, OR a URL change back to the feed /
 * page-posts list — whichever comes first.
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
  feedStartPostButton:
    'button[aria-label^="Start a post"], button.share-box-feed-entry__trigger',
  composerDialog: 'div[role="dialog"]',
  addMediaButton: 'button[aria-label="Add media"], button[aria-label="Add a photo"]',
  fileInput: 'input[type="file"]',
  nextButton: 'button:has-text("Next"), button[aria-label="Next"]',
  textbox: 'div[role="textbox"]',
  postButton:
    'button.share-box_actions__primary-btn, button[data-test-share-form-submit], button.share-actions__primary-action',
  successToast:
    '[data-test-toast-type="SUCCESS"], .artdeco-toast-item--success, [role="alert"]:has-text("Post submitted")',
} as const;

export interface PostContent {
  text: string;
  imagePath?: string;
}

export interface PostResult {
  postUrl?: string;
  screenshotPath?: string;
  verifiedSubmitted: boolean;
}

/** Submit a post to the logged-in user's personal feed. */
export async function composePost(
  page: Page,
  credential: DecryptedCredential,
  content: PostContent,
  screenshotDir?: string,
): Promise<PostResult> {
  await assertWriteQuota(credential.id, credential.platform);

  await page.goto("https://www.linkedin.com/feed/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(SELECTORS.feedStartPostButton, { timeout: 20000 });
  await humanClick(page, SELECTORS.feedStartPostButton);

  return composeInDialog(page, credential, content, screenshotDir, {
    actionType: "post",
    returnUrl: "https://www.linkedin.com/feed/",
  });
}

/**
 * Submit a post to a Company Page the credentialed user admins.
 * `companyId` is the numeric LinkedIn Company ID (e.g. `34489687`).
 */
export async function composePagePost(
  page: Page,
  credential: DecryptedCredential,
  content: PostContent,
  companyId: string,
  screenshotDir?: string,
): Promise<PostResult> {
  await assertWriteQuota(credential.id, credential.platform);

  const adminShareUrl = `https://www.linkedin.com/company/${companyId}/admin/page-posts/published/?share=true`;
  await page.goto(adminShareUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForSelector(SELECTORS.composerDialog, { timeout: 20000 });

  return composeInDialog(page, credential, content, screenshotDir, {
    actionType: "post",
    returnUrl: adminShareUrl.replace("?share=true", ""),
    metadata: { companyId },
  });
}

interface ComposeOptions {
  actionType: "post";
  returnUrl: string;
  metadata?: Record<string, unknown>;
}

async function composeInDialog(
  page: Page,
  credential: DecryptedCredential,
  content: PostContent,
  screenshotDir: string | undefined,
  options: ComposeOptions,
): Promise<PostResult> {
  if (content.imagePath) {
    await humanClick(page, SELECTORS.addMediaButton);
    await page.waitForSelector(SELECTORS.fileInput, { timeout: 10000 });
    const fileInput = await page.$(SELECTORS.fileInput);
    if (!fileInput) throw new Error("LinkedIn file input not found after Add media");
    await fileInput.uploadFile(content.imagePath);
    await page.waitForSelector(SELECTORS.nextButton, { timeout: 30000 });
    await humanClick(page, SELECTORS.nextButton);
    await dwell(2000, 3000);
  }

  await page.waitForSelector(SELECTORS.textbox, { timeout: 15000 });
  // LinkedIn's contenteditable eats synthetic keystrokes. Use the same
  // execCommand('insertText') trick the Playwright bot used — it reliably
  // triggers the editor's input event and preserves newlines.
  await page.evaluate(
    (selector, text) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) throw new Error("LinkedIn textbox missing");
      el.focus();
      document.execCommand("insertText", false, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    SELECTORS.textbox,
    content.text,
  );
  await dwell(1500, 2500);

  await clickPostButton(page);

  const { verifiedSubmitted, screenshotPath } = await waitForPostSuccess(
    page,
    options.returnUrl,
    screenshotDir,
    options.actionType,
  );

  await logAction({
    credentialId: credential.id,
    actionType: options.actionType,
    status: verifiedSubmitted ? "success" : "failure",
    targetUrl: options.returnUrl,
    screenshotRef: screenshotPath,
    errorMessage: verifiedSubmitted ? undefined : "No success signal detected",
    metadata: {
      hasImage: Boolean(content.imagePath),
      textLength: content.text.length,
      ...(options.metadata ?? {}),
    },
  });

  if (!verifiedSubmitted) {
    throw new Error(
      "LinkedIn post did not confirm success within timeout — see screenshot",
    );
  }

  return { verifiedSubmitted, screenshotPath };
}

async function clickPostButton(page: Page): Promise<void> {
  const clicked = await page.evaluate((primarySelector) => {
    const primary = document.querySelector(primarySelector) as HTMLButtonElement | null;
    if (primary && !primary.disabled) {
      primary.click();
      return true;
    }
    const all = Array.from(document.querySelectorAll("button"));
    const fallback = all.find(
      (b) => b.textContent?.trim() === "Post" && !(b as HTMLButtonElement).disabled,
    );
    if (fallback) {
      (fallback as HTMLButtonElement).click();
      return true;
    }
    return false;
  }, SELECTORS.postButton);

  if (!clicked) {
    throw new Error("No enabled Post button was reachable in the dialog");
  }
}

interface SuccessCheck {
  verifiedSubmitted: boolean;
  screenshotPath?: string;
}

async function waitForPostSuccess(
  page: Page,
  returnUrl: string,
  screenshotDir: string | undefined,
  actionType: string,
): Promise<SuccessCheck> {
  // Race three positive signals — whichever wins confirms success.
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const toast = await page.$(SELECTORS.successToast);
    if (toast) {
      const screenshotPath = screenshotDir
        ? await captureScreenshot(page, screenshotDir, `${actionType}-success`)
        : undefined;
      return { verifiedSubmitted: true, screenshotPath };
    }
    const dialog = await page.$(SELECTORS.composerDialog);
    if (!dialog) {
      // Dialog truly gone AND we're not on an error page
      const url = page.url();
      if (url.includes("/feed/") || url.startsWith(returnUrl.split("?")[0])) {
        const screenshotPath = screenshotDir
          ? await captureScreenshot(page, screenshotDir, `${actionType}-success`)
          : undefined;
        return { verifiedSubmitted: true, screenshotPath };
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // Timed out — capture a debug screenshot
  const screenshotPath = screenshotDir
    ? await captureScreenshot(page, screenshotDir, `${actionType}-timeout`)
    : undefined;
  return { verifiedSubmitted: false, screenshotPath };
}

async function captureScreenshot(
  page: Page,
  dir: string,
  label: string,
): Promise<string> {
  const path = `${dir}/linkedin-${label}-${Date.now()}.png`;
  await page.screenshot({ path: path as `${string}.png`, fullPage: false });
  return path;
}
