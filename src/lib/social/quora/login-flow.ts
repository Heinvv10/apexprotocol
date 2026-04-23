/**
 * Quora login flow.
 *
 * Quora's home page is a login gate when logged out — email/password fields
 * are visible without navigating elsewhere. Detection signals include
 * CAPTCHA challenges and a "verify your account" interstitial that shows
 * when logging in from a new IP.
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
  home: "https://www.quora.com/",
  login: "https://www.quora.com/?entry_source=hamburger_login",
} as const;

const SELECTORS = {
  emailInput: 'input[name="email"], input[type="email"]',
  passwordInput: 'input[name="password"], input[type="password"]',
  submitButton: 'button[type="submit"], div[role="button"]:has-text("Login")',
  totpInput: 'input[name="otp"], input[autocomplete="one-time-code"]',
  loggedInSignal:
    'a[href="/answer"], a[href="/notifications"], div[role="button"]:has-text("Add question")',
  captchaIframe: 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"]',
  verifyChallenge: '[data-testid="verify-email-banner"], h1:has-text("Verify your identity")',
} as const;

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class QuoraDetectionAbort extends Error {
  constructor(
    message: string,
    public readonly signal: "captcha" | "verify_challenge" | "unknown",
  ) {
    super(message);
    this.name = "QuoraDetectionAbort";
  }
}

export interface LoginResult {
  alreadyLoggedIn: boolean;
  sessionStateJson: string;
}

export async function loginToQuora(
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

  await page.waitForSelector(SELECTORS.emailInput, { timeout: 15000 });
  await humanType(page, SELECTORS.emailInput, credential.username);
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
        `Quora is requesting 2FA but credential ${credential.id} has no TOTP secret stored`,
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
    await markFlagged(credentialId, "Quora showed a CAPTCHA challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "CAPTCHA detected",
    });
    throw new QuoraDetectionAbort("Quora showed a CAPTCHA challenge", "captcha");
  }
  if (await page.$(SELECTORS.verifyChallenge)) {
    await markFlagged(credentialId, "Quora verify-identity challenge");
    await logAction({
      credentialId,
      actionType: "login",
      status: "aborted",
      errorMessage: "Verify challenge",
    });
    throw new QuoraDetectionAbort(
      "Quora showed a verify-identity challenge",
      "verify_challenge",
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
