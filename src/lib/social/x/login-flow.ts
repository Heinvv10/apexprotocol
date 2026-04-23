/**
 * X (Twitter) login flow.
 *
 * Three states the page can be in when we arrive:
 *   1. Already logged in (session restore worked) → return early
 *   2. Username/password challenge → fill, submit
 *   3. 2FA challenge → compute TOTP, submit
 *
 * Anything else (CAPTCHA, unusual-activity warning, account-locked redirect)
 * is a detection signal — we abort, mark the credential `flagged`, and let
 * the human investigate. No retry loops, no workaround attempts.
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
  home: "https://x.com/home",
  login: "https://x.com/i/flow/login",
} as const;

// Selectors. Twitter changes these constantly — keep them in one place so
// they're cheap to fix when they break.
const SELECTORS = {
  usernameInput: 'input[autocomplete="username"]',
  passwordInput: 'input[name="password"], input[type="password"]',
  totpInput: 'input[data-testid="ocfEnterTextTextInput"]',
  composeButton: 'a[data-testid="SideNav_NewTweet_Button"]',
  primaryButton: '[data-testid="LoginForm_Login_Button"], [data-testid="ocfEnterTextNextButton"]',
  // Detection signals — presence of any means abort
  captchaIframe: 'iframe[src*="recaptcha"], iframe[src*="arkose"]',
  unusualActivityHeading: '[data-testid="ocfChallengeHeading"]',
  accountLockedHeading: '[data-testid="ocfAccessHeading"]',
} as const;

const SESSION_TTL_MS = 25 * 24 * 60 * 60 * 1000; // 25 days — pad against X's ~30-day cookie expiry

export class XDetectionAbort extends Error {
  constructor(
    message: string,
    public readonly signal:
      | "captcha"
      | "unusual_activity"
      | "account_locked"
      | "unknown",
  ) {
    super(message);
    this.name = "XDetectionAbort";
  }
}

export interface LoginResult {
  alreadyLoggedIn: boolean;
  sessionStateJson: string;
}

/**
 * Run the login flow on `page` for `credential`. On success, the latest
 * session state is persisted back to the credential vault. On a detection
 * signal, the credential is marked flagged and an error is thrown.
 */
export async function loginToX(
  browser: Browser,
  page: Page,
  credential: DecryptedCredential,
): Promise<LoginResult> {
  await page.setViewport({
    width: credential.viewportWidth,
    height: credential.viewportHeight,
  });
  await page.setUserAgent(credential.userAgent);

  // 1. Try to restore an existing session before showing a login form
  if (credential.sessionState) {
    await restoreSession(page, credential.sessionState);
    await page.goto(URLS.home, { waitUntil: "domcontentloaded" });
    if (await isLoggedIn(page)) {
      await logAction({
        credentialId: credential.id,
        actionType: "session_restore",
        status: "success",
        targetUrl: URLS.home,
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
  await humanKey(page, "Enter");
  await dwell(800, 1500);
  await abortIfDetected(page, credential.id);

  await humanType(page, SELECTORS.passwordInput, credential.password);
  await humanKey(page, "Enter");
  await dwell(1500, 2500);
  await abortIfDetected(page, credential.id);

  // 3. Handle 2FA if X is asking for it
  const totpFieldVisible = await page.$(SELECTORS.totpInput);
  if (totpFieldVisible) {
    if (!credential.hasTotp) {
      throw new Error(
        `X is requesting 2FA but credential ${credential.id} has no TOTP secret stored`,
      );
    }
    const code = await getOneTimeCode(credential.id);
    await humanType(page, SELECTORS.totpInput, code);
    await humanKey(page, "Enter");
    await dwell(1500, 2500);
    await abortIfDetected(page, credential.id);
  }

  // 4. Confirm we landed on the home timeline
  await page.waitForSelector(SELECTORS.composeButton, { timeout: 15000 });
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
    targetUrl: URLS.home,
  });

  return { alreadyLoggedIn: false, sessionStateJson };
}

async function isLoggedIn(page: Page): Promise<boolean> {
  return Boolean(await page.$(SELECTORS.composeButton));
}

async function abortIfDetected(page: Page, credentialId: string): Promise<void> {
  if (await page.$(SELECTORS.captchaIframe)) {
    await markFlagged(credentialId, "X showed a CAPTCHA challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "CAPTCHA detected",
    });
    throw new XDetectionAbort("X showed a CAPTCHA challenge", "captcha");
  }
  if (await page.$(SELECTORS.unusualActivityHeading)) {
    await markFlagged(credentialId, "X flagged unusual activity");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Unusual activity warning",
    });
    throw new XDetectionAbort("X flagged unusual activity", "unusual_activity");
  }
  if (await page.$(SELECTORS.accountLockedHeading)) {
    await markFlagged(credentialId, "X account-access challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Account access challenge",
    });
    throw new XDetectionAbort("X showed account-access challenge", "account_locked");
  }
}

async function restoreSession(page: Page, sessionStateJson: string): Promise<void> {
  const state = JSON.parse(sessionStateJson) as {
    cookies?: Array<Record<string, unknown>>;
  };
  if (!state.cookies?.length) return;
  // Puppeteer's setCookie expects its own CookieParam shape — the saved
  // cookies were captured via browser.cookies() so the keys already match.
  await page.setCookie(
    ...(state.cookies as unknown as Parameters<Page["setCookie"]>),
  );
}

async function captureSessionState(browser: Browser, page: Page): Promise<string> {
  const cookies = await browser.cookies();
  // Persisting localStorage is best-effort — some sites disallow access
  // before navigation completes.
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
    // ignore — cookies alone are usually enough for X session restoration
  }
  return JSON.stringify({ cookies, localStorage });
}
