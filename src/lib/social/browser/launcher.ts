/**
 * Stealth-configured Puppeteer launcher for social-browser automation.
 *
 * All platform skills (apex-x-twitter, apex-linkedin, etc.) MUST launch via
 * this helper instead of calling `puppeteer.launch()` directly — otherwise
 * anti-bot signals leak (navigator.webdriver, plugin list, chrome runtime,
 * etc.) and credentials get flagged.
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, LaunchOptions } from "puppeteer";

puppeteerExtra.use(StealthPlugin());

export interface LaunchSocialBrowserOptions extends LaunchOptions {
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export async function launchSocialBrowser(
  options: LaunchSocialBrowserOptions = {},
): Promise<Browser> {
  const { userAgent, viewport, ...rest } = options;

  const browser = (await puppeteerExtra.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      ...(userAgent ? [`--user-agent=${userAgent}`] : []),
      ...(rest.args ?? []),
    ],
    defaultViewport: viewport ?? rest.defaultViewport ?? null,
    ...rest,
  })) as unknown as Browser;

  return browser;
}
