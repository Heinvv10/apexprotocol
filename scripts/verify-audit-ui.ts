/**
 * Headless verify: load the Capitec audit results page and recommendations
 * dashboard using the same Playwright storage state e2e uses, dump any
 * visible "NaN" strings, and screenshot. No assertions — this is a
 * manual verification aid.
 */
import { chromium } from "playwright";
import * as fs from "fs";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3011";
const STORAGE_STATE = "e2e/.auth/storage-state.json";
const AUDIT_ID = "cclvalb2orst7m8qhmf8z8s8";
const OUT = "docs/audit/screenshots/real-brands";

async function main() {
  if (!fs.existsSync(STORAGE_STATE)) {
    console.error("storage-state.json missing — run: npx playwright test --list to trigger globalSetup, or run e2e/.auth/auth.setup.ts manually.");
    process.exit(1);
  }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  // 1. Audit results — AI Readiness section
  await page.goto(`${BASE_URL}/dashboard/audit/results?id=${AUDIT_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(5000);
  const html1 = await page.content();
  const nanCount1 = (html1.match(/\bNaN\b/g) || []).length;
  console.log(`[audit-results] NaN occurrences in DOM: ${nanCount1}`);
  await page.screenshot({ path: `${OUT}/09-capitec-after-nan-fix.jpeg`, type: "jpeg", fullPage: true });

  // 2. Recommendations page
  await page.goto(`${BASE_URL}/dashboard/recommendations`, { waitUntil: "load" });
  await page.waitForTimeout(5000);
  const html2 = await page.content();
  const nanCount2 = (html2.match(/\bNaN\b/g) || []).length;
  console.log(`[recommendations] NaN occurrences in DOM: ${nanCount2}`);
  await page.screenshot({ path: `${OUT}/10-recommendations-persisted.jpeg`, type: "jpeg", fullPage: true });

  await browser.close();
  console.log("done");
}
main().catch(e => { console.error(e); process.exit(1); });
