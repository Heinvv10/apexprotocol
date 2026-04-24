/**
 * Create the CrankMart LinkedIn Company Page under Jarvis Specter's personal
 * LinkedIn admin.
 *
 * Usage:
 *   bun run scripts/create-crankmart-linkedin-page.ts            # preview only
 *   CONFIRM_SUBMIT=1 bun run scripts/create-crankmart-linkedin-page.ts  # submits
 *
 * Session source: ~/Workspace/linkedin-bot/.linkedin-cookies.json (Jarvis, li_at valid until 2027-06).
 * Writes: /tmp/crankmart-li/pre-submit.png, /tmp/crankmart-li/post-submit.png.
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const COOKIE_JAR = path.join(os.homedir(), "Workspace/linkedin-bot/.linkedin-cookies.json");
const ASSETS = "/tmp/crankmart-assets";
const OUT_DIR = "/tmp/crankmart-li";
const LOGO = path.join(ASSETS, "icon-512.png");
// Banner is uploaded after Page creation via the Page edit flow — LinkedIn's
// setup form doesn't include a cover-image slot.
const _BANNER = path.join(ASSETS, "cover-banner.jpg");
void _BANNER;
const SETUP_URL = "https://www.linkedin.com/company/setup/new/";

const FIELDS = {
  name: "CrankMart",
  slug: "crankmart-sa",
  website: "https://crankmart.com",
  industry: "Internet Marketplace Platforms",
  industryFallback: "Retail",
  size: "2-10 employees",
  type: "Privately held",
  tagline: "South Africa's Cycling Marketplace",
  about:
    "CrankMart is South Africa's first dedicated cycling marketplace connecting cyclists to buy and sell bikes, gear, and parts. The platform serves as a comprehensive hub for the SA cycling community, featuring route discovery, event listings, bike shop directories, and community safety features like a stolen bike registry.",
};

const CONFIRM_SUBMIT = process.env.CONFIRM_SUBMIT === "1";

async function loadContext(): Promise<{ context: BrowserContext; page: Page }> {
  if (!fs.existsSync(COOKIE_JAR)) throw new Error(`Cookie jar not found: ${COOKIE_JAR}`);
  const rawCookies = JSON.parse(fs.readFileSync(COOKIE_JAR, "utf8")) as Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite?: string;
  }>;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies(
    rawCookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires > 0 ? c.expires : undefined,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: (c.sameSite === "None" ? "None" : c.sameSite === "Lax" ? "Lax" : c.sameSite === "Strict" ? "Strict" : "Lax") as "Strict" | "Lax" | "None",
    })),
  );
  const page = await context.newPage();
  return { context, page };
}

async function verifyLoggedIn(page: Page): Promise<void> {
  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30000 });
  const url = page.url();
  if (url.includes("/login") || url.includes("/checkpoint") || url.includes("/uas/login")) {
    throw new Error(`Not logged in — redirected to ${url}. The cookie jar may have expired.`);
  }
  console.log(`✓ Session live. Feed URL: ${url}`);
}

async function dumpFormStructure(page: Page, label: string): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const safe = label.replace(/[^a-z0-9]/gi, "_");
  await page.screenshot({ path: path.join(OUT_DIR, `dump-${safe}.png`), fullPage: true });
  fs.writeFileSync(path.join(OUT_DIR, `dump-${safe}.html`), await page.content());
  const inputs = await page.locator("input, textarea, select, [role='combobox'], [role='button']").all();
  const lines: string[] = [];
  for (const el of inputs.slice(0, 60)) {
    const tag = await el.evaluate((n) => n.tagName.toLowerCase()).catch(() => "?");
    const name = (await el.getAttribute("name").catch(() => null)) ?? "";
    const id = (await el.getAttribute("id").catch(() => null)) ?? "";
    const aria = (await el.getAttribute("aria-label").catch(() => null)) ?? "";
    const ph = (await el.getAttribute("placeholder").catch(() => null)) ?? "";
    const type = (await el.getAttribute("type").catch(() => null)) ?? "";
    const text = ((await el.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").slice(0, 60);
    lines.push(`  <${tag}> type=${type} name="${name}" id="${id}" aria="${aria}" ph="${ph}" text="${text}"`);
  }
  console.log(`—— form structure @ ${label} (${lines.length} elements) ——`);
  console.log(lines.join("\n"));
}

async function fillSetupForm(page: Page): Promise<void> {
  console.log(`→ Navigating to ${SETUP_URL}`);
  await page.goto(SETUP_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(4000);
  const landing = page.url();
  console.log(`  Landed on: ${landing}`);

  if (landing.includes("/authwall") || landing.includes("/uas/login") || landing.includes("/checkpoint")) {
    await dumpFormStructure(page, "authwall");
    throw new Error(`Setup page bounced to ${landing}. Cookie scope insufficient for company creation.`);
  }

  // Dump whatever we landed on so we can calibrate
  await dumpFormStructure(page, "setup-landing");

  const curUrl = page.url();
  console.log(`  Current URL: ${curUrl}`);

  // Fill name
  console.log("→ Filling Page name");
  const nameInput = page.locator('input[name="name"], input[id*="name"], input[aria-label*="name" i]').first();
  await nameInput.waitFor({ state: "visible", timeout: 15000 });
  await nameInput.fill(FIELDS.name);

  // Fill URL slug
  console.log("→ Filling LinkedIn public URL slug");
  const slugInput = page.locator('input[name="vanityName"], input[id*="url" i], input[aria-label*="url" i]').first();
  if (await slugInput.isVisible().catch(() => false)) {
    await slugInput.fill(FIELDS.slug);
  }

  // Website
  console.log("→ Filling website");
  const websiteInput = page.locator('input[name="website"], input[id*="website" i], input[aria-label*="website" i]').first();
  if (await websiteInput.isVisible().catch(() => false)) {
    await websiteInput.fill(FIELDS.website);
  }

  // Industry (typeahead combobox)
  console.log("→ Selecting industry");
  const industryInput = page
    .locator('input[id*="industry" i], input[aria-label*="industry" i], input[placeholder*="industry" i]')
    .first();
  if (await industryInput.isVisible().catch(() => false)) {
    await industryInput.click();
    await industryInput.fill(FIELDS.industry);
    await page.waitForTimeout(1200);
    const match = page.locator(`[role="option"]`).filter({ hasText: new RegExp(FIELDS.industry, "i") }).first();
    if (await match.isVisible().catch(() => false)) {
      await match.click();
      console.log(`  ✓ Picked "${FIELDS.industry}"`);
    } else {
      console.log(`  ! "${FIELDS.industry}" not in dropdown — trying fallback "${FIELDS.industryFallback}"`);
      await industryInput.fill("");
      await industryInput.fill(FIELDS.industryFallback);
      await page.waitForTimeout(1200);
      const fallbackMatch = page.locator(`[role="option"]`).filter({ hasText: new RegExp(FIELDS.industryFallback, "i") }).first();
      if (await fallbackMatch.isVisible().catch(() => false)) {
        await fallbackMatch.click();
        console.log(`  ✓ Picked fallback "${FIELDS.industryFallback}"`);
      } else {
        console.log(`  !! Neither industry match — leaving field empty for manual pick`);
      }
    }
  }

  // Company size (select)
  console.log("→ Selecting company size");
  const sizeSelect = page.locator('select[id*="size" i], select[name*="size" i]').first();
  if (await sizeSelect.isVisible().catch(() => false)) {
    await sizeSelect.selectOption({ label: FIELDS.size }).catch(async () => {
      await sizeSelect.selectOption({ value: "B" }).catch(() => {}); // B = 2-10 on LinkedIn
    });
  } else {
    // Some LI variants use a custom button-based dropdown
    const sizeBtn = page.locator('button[aria-label*="size" i], [id*="size" i][role="combobox"]').first();
    if (await sizeBtn.isVisible().catch(() => false)) {
      await sizeBtn.click();
      await page.waitForTimeout(800);
      await page.locator(`[role="option"]`).filter({ hasText: /2-10/ }).first().click().catch(() => {});
    }
  }

  // Company type
  console.log("→ Selecting company type");
  const typeSelect = page.locator('select[id*="type" i], select[name*="type" i], select[id*="organization" i]').first();
  if (await typeSelect.isVisible().catch(() => false)) {
    await typeSelect.selectOption({ label: FIELDS.type }).catch(() => {});
  } else {
    const typeBtn = page.locator('button[aria-label*="type" i], [role="combobox"][id*="type" i]').first();
    if (await typeBtn.isVisible().catch(() => false)) {
      await typeBtn.click();
      await page.waitForTimeout(800);
      await page.locator(`[role="option"]`).filter({ hasText: /privately held/i }).first().click().catch(() => {});
    }
  }

  // Tagline (optional — filled if field present on the setup page; otherwise will be added post-creation)
  const taglineInput = page
    .locator('input[name="tagline"], input[id*="tagline" i], textarea[id*="tagline" i], input[aria-label*="tagline" i]')
    .first();
  if (await taglineInput.isVisible().catch(() => false)) {
    console.log("→ Filling tagline");
    await taglineInput.fill(FIELDS.tagline);
  } else {
    console.log("  (tagline field not on setup form — will add in Page edit after creation)");
  }

  // Logo upload
  const fileInputs = page.locator('input[type="file"]');
  const fileCount = await fileInputs.count();
  if (fileCount > 0) {
    console.log(`→ Uploading logo (${fileCount} file input(s) found)`);
    await fileInputs.first().setInputFiles(LOGO).catch((e) => console.log(`  !! logo upload failed: ${e.message}`));
    await page.waitForTimeout(2500);
  }

  // Verification checkbox ("I am the authorised representative…")
  console.log("→ Ticking verification checkbox");
  const verifyCheckbox = page
    .locator('input[type="checkbox"][id*="verify" i], input[type="checkbox"][name*="verify" i], input[type="checkbox"]')
    .last();
  if (await verifyCheckbox.isVisible().catch(() => false)) {
    await verifyCheckbox.check({ force: true }).catch(() => {});
  }
}

async function preSubmitScreenshot(page: Page): Promise<string> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const p = path.join(OUT_DIR, "pre-submit.png");
  await page.screenshot({ path: p, fullPage: true });
  console.log(`📸 Pre-submit screenshot: ${p}`);
  return p;
}

async function submit(page: Page): Promise<{ url: string; companyId: string | null }> {
  const submitBtn = page
    .locator('button[type="submit"], button')
    .filter({ hasText: /create page|create|submit/i })
    .first();
  console.log("→ Clicking Create Page");
  await submitBtn.click();
  await page.waitForURL(/\/company\/.+/, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(4000);
  const finalUrl = page.url();
  const match = finalUrl.match(/\/company\/(\d+|[\w-]+)/);
  const companyId = match?.[1] ?? null;
  console.log(`✓ Redirected to: ${finalUrl}`);
  console.log(`  companyId candidate: ${companyId}`);

  await page.screenshot({ path: path.join(OUT_DIR, "post-submit.png"), fullPage: true });
  return { url: finalUrl, companyId };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`CONFIRM_SUBMIT=${CONFIRM_SUBMIT ? "1 (WILL SUBMIT)" : "0 (preview only)"}`);

  const { context, page } = await loadContext();
  try {
    await verifyLoggedIn(page);
    await fillSetupForm(page);
    await preSubmitScreenshot(page);

    if (!CONFIRM_SUBMIT) {
      console.log("\n⏸  STOPPED before Create click. Review /tmp/crankmart-li/pre-submit.png.");
      console.log("   Re-run with CONFIRM_SUBMIT=1 to submit.");
      return;
    }

    const result = await submit(page);
    fs.writeFileSync(path.join(OUT_DIR, "result.json"), JSON.stringify(result, null, 2));
    console.log("\n✅ Done.");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
    await context.browser()?.close();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
