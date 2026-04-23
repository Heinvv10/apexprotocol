/**
 * LinkedIn login flow.
 *
 * Three states the page can be in when we arrive:
 *   1. Already logged in (session restore worked) → return early
 *   2. Username/password challenge → fill, submit
 *   3. 2FA challenge (6-digit code) → compute TOTP, submit
 *
 * Anything else (CAPTCHA, "verify it's really you" interstitial, account
 * restriction) is a detection signal — we abort, mark the credential
 * `flagged`, and let the human investigate. No retry loops.
 */

import type { Browser, Page } from "puppeteer";
import {
  type DecryptedCredential,
  dwell,
  getOneTimeCode,
  humanKey,
  humanType,
  logAction,
  markFlagged,
  updateSessionState,
} from "@/lib/social/browser";

const URLS = {
  feed: "https://www.linkedin.com/feed/",
  login: "https://www.linkedin.com/login",
} as const;

const SELECTORS = {
  usernameInput: "#username",
  passwordInput: "#password",
  submitButton: 'button[type="submit"]',
  // 2FA: LinkedIn uses id="input__email_verification_pin" for email code
  // and id="input__phone_verification_pin" for SMS, but both accept the
  // authenticator-app TOTP when the account has one set up.
  totpInput:
    '#input__email_verification_pin, #input__phone_verification_pin, input[name="pin"]',
  // Logged-in signals — feed nav OR the global top nav
  feedNav: 'a[data-test-global-nav-link="feed"], nav[aria-label="Primary Navigation"]',
  // Detection signals
  captchaIframe: 'iframe[src*="captcha"], iframe[src*="arkoselabs"], iframe[src*="funcaptcha"]',
  verifyChallenge: 'h1:has-text("Let\'s do a quick security check"), [data-test-challenge]',
  accountRestricted: 'h1:has-text("Your account has been restricted")',
} as const;

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days — LinkedIn invalidates aggressively

export class LinkedInDetectionAbort extends Error {
  constructor(
    message: string,
    public readonly signal:
      | "captcha"
      | "verify_challenge"
      | "account_restricted"
      | "unknown",
  ) {
    super(message);
    this.name = "LinkedInDetectionAbort";
  }
}

export interface LoginResult {
  alreadyLoggedIn: boolean;
  sessionStateJson: string;
}

export async function loginToLinkedIn(
  browser: Browser,
  page: Page,
  credential: DecryptedCredential,
): Promise<LoginResult> {
  await page.setViewport({
    width: credential.viewportWidth,
    height: credential.viewportHeight,
  });

  // 1. Try session restore before showing a login form
  if (credential.sessionState) {
    await restoreSession(page, credential.sessionState);
    await page.goto(URLS.feed, { waitUntil: "domcontentloaded" });
    if (await isLoggedIn(page)) {
      await logAction({
        credentialId: credential.id,
        actionType: "session_restore",
        status: "success",
        targetUrl: URLS.feed,
      });
      return {
        alreadyLoggedIn: true,
        sessionStateJson: await captureSessionState(browser, page),
      };
    }
  }

  // 2. Full login from scratch
  await page.goto(URLS.login, { waitUntil: "domcontentloaded" });
  await abortIfDetected(page, credential.id);

  await humanType(page, SELECTORS.usernameInput, credential.username);
  await dwell(300, 700);
  await humanType(page, SELECTORS.passwordInput, credential.password);
  await dwell(300, 700);

  await Promise.all([
    page
      .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
      .catch(() => undefined),
    humanKey(page, "Enter"),
  ]);
  await dwell(1000, 2000);
  await abortIfDetected(page, credential.id);

  // 3. Handle 2FA if LinkedIn asks for it
  const totpField = await page.$(SELECTORS.totpInput);
  if (totpField) {
    if (!credential.hasTotp) {
      throw new Error(
        `LinkedIn is requesting 2FA but credential ${credential.id} has no TOTP secret stored`,
      );
    }
    const code = await getOneTimeCode(credential.id);
    await humanType(page, SELECTORS.totpInput, code);
    await dwell(300, 700);
    await Promise.all([
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
        .catch(() => undefined),
      humanKey(page, "Enter"),
    ]);
    await dwell(1000, 2000);
    await abortIfDetected(page, credential.id);
  }

  // 4. Confirm feed loaded
  await page.waitForSelector(SELECTORS.feedNav, { timeout: 20000 });
  const sessionStateJson = await captureSessionState(browser, page);
  await updateSessionState(
    credential.id,
    sessionStateJson,
    new Date(Date.now() + SESSION_TTL_MS),
  );

  await logAction({
    credentialId: credential.id,
    actionType: "login",
    status: "success",
    targetUrl: URLS.feed,
  });

  return { alreadyLoggedIn: false, sessionStateJson };
}

async function isLoggedIn(page: Page): Promise<boolean> {
  return Boolean(await page.$(SELECTORS.feedNav));
}

async function abortIfDetected(page: Page, credentialId: string): Promise<void> {
  if (await page.$(SELECTORS.captchaIframe)) {
    await markFlagged(credentialId, "LinkedIn showed a CAPTCHA challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "CAPTCHA detected",
    });
    throw new LinkedInDetectionAbort(
      "LinkedIn showed a CAPTCHA challenge",
      "captcha",
    );
  }
  if (await page.$(SELECTORS.verifyChallenge)) {
    await markFlagged(credentialId, "LinkedIn verify-it's-you challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Verify challenge",
    });
    throw new LinkedInDetectionAbort(
      "LinkedIn showed a verify-it's-you challenge",
      "verify_challenge",
    );
  }
  if (await page.$(SELECTORS.accountRestricted)) {
    await markFlagged(credentialId, "LinkedIn account restricted");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Account restricted",
    });
    throw new LinkedInDetectionAbort(
      "LinkedIn account is restricted",
      "account_restricted",
    );
  }
}

async function restoreSession(page: Page, sessionStateJson: string): Promise<void> {
  const state = JSON.parse(sessionStateJson) as {
    cookies?: Array<Record<string, unknown>>;
  };
  if (!state.cookies?.length) return;
  await page.setCookie(
    ...(state.cookies as unknown as Parameters<Page["setCookie"]>),
  );
}

async function captureSessionState(browser: Browser, page: Page): Promise<string> {
  const cookies = await browser.cookies();
  let localStorage: Record<string, string> = {};
  try {
    localStorage = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key !== null) {
          out[key] = window.localStorage.getItem(key) ?? "";
        }
      }
      return out;
    });
  } catch {
    // LinkedIn sometimes restricts localStorage pre-navigation
  }
  return JSON.stringify({ cookies, localStorage });
}
