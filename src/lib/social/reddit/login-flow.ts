/**
 * Reddit login flow.
 *
 * Reddit has been iterating on its login page — old.reddit.com and
 * www.reddit.com have different markup. We target the `www.` new-UI flow
 * because that's what agents land on by default.
 *
 * States on arrival:
 *   1. Already logged in → return early
 *   2. Username/password challenge → fill, submit
 *   3. 2FA (TOTP 6-digit code) → compute, submit
 *
 * Detection signals (CAPTCHA, suspicious-activity, account-suspended) abort
 * and flag the credential.
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
  home: "https://www.reddit.com/",
  login: "https://www.reddit.com/login/",
} as const;

const SELECTORS = {
  // New reddit UI (shadow-DOM-free fields)
  usernameInput: 'input[name="username"], #loginUsername, input[autocomplete="username"]',
  passwordInput: 'input[name="password"], #loginPassword, input[type="password"]',
  submitButton: 'button[type="submit"], button[data-step="login"]',
  totpInput: 'input[name="otp"], input[autocomplete="one-time-code"]',
  // Presence of the header user menu / "Create post" button means logged in
  loggedInSignal:
    'button[aria-label*="Expand user menu"], a[href="/submit"], button[id*="expand-user-drawer"]',
  // Detection signals
  captchaIframe: 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="arkose"]',
  suspiciousActivity: 'h1:has-text("Suspicious activity"), [data-redditstyle-suspended]',
  accountSuspended: 'h1:has-text("Account suspended"), h3:has-text("suspended")',
} as const;

const SESSION_TTL_MS = 20 * 24 * 60 * 60 * 1000; // 20 days

export class RedditDetectionAbort extends Error {
  constructor(
    message: string,
    public readonly signal:
      | "captcha"
      | "suspicious_activity"
      | "account_suspended"
      | "unknown",
  ) {
    super(message);
    this.name = "RedditDetectionAbort";
  }
}

export interface LoginResult {
  alreadyLoggedIn: boolean;
  sessionStateJson: string;
}

export async function loginToReddit(
  browser: Browser,
  page: Page,
  credential: DecryptedCredential,
): Promise<LoginResult> {
  await page.setViewport({
    width: credential.viewportWidth,
    height: credential.viewportHeight,
  });

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
  await dwell(1500, 2500);
  await abortIfDetected(page, credential.id);

  const totpField = await page.$(SELECTORS.totpInput);
  if (totpField) {
    if (!credential.hasTotp) {
      throw new Error(
        `Reddit is requesting 2FA but credential ${credential.id} has no TOTP secret stored`,
      );
    }
    const code = await getOneTimeCode(credential.id);
    await humanType(page, SELECTORS.totpInput, code);
    await Promise.all([
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
        .catch(() => undefined),
      humanKey(page, "Enter"),
    ]);
    await dwell(1000, 2000);
    await abortIfDetected(page, credential.id);
  }

  await page.waitForSelector(SELECTORS.loggedInSignal, { timeout: 20000 });
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
  return Boolean(await page.$(SELECTORS.loggedInSignal));
}

async function abortIfDetected(page: Page, credentialId: string): Promise<void> {
  if (await page.$(SELECTORS.captchaIframe)) {
    await markFlagged(credentialId, "Reddit showed a CAPTCHA challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "CAPTCHA detected",
    });
    throw new RedditDetectionAbort("Reddit showed a CAPTCHA challenge", "captcha");
  }
  if (await page.$(SELECTORS.suspiciousActivity)) {
    await markFlagged(credentialId, "Reddit flagged suspicious activity");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Suspicious activity",
    });
    throw new RedditDetectionAbort(
      "Reddit flagged suspicious activity",
      "suspicious_activity",
    );
  }
  if (await page.$(SELECTORS.accountSuspended)) {
    await markFlagged(credentialId, "Reddit account suspended");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Account suspended",
    });
    throw new RedditDetectionAbort(
      "Reddit account is suspended",
      "account_suspended",
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
    // ignore
  }
  return JSON.stringify({ cookies, localStorage });
}
