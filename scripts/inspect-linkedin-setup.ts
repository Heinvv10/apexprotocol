/**
 * Diagnostic — loads Jarvis cookies, visits LinkedIn's company setup flow,
 * and dumps the rendered page so we can calibrate selectors.
 */
import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const COOKIE_JAR = path.join(os.homedir(), "Workspace/linkedin-bot/.linkedin-cookies.json");
const OUT = "/tmp/crankmart-li";
fs.mkdirSync(OUT, { recursive: true });

async function main(): Promise<void> {
  const raw = JSON.parse(fs.readFileSync(COOKIE_JAR, "utf8"));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies(
    raw.map((c: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite?: string }) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires > 0 ? c.expires : undefined,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: (c.sameSite === "None" ? "None" : c.sameSite === "Strict" ? "Strict" : "Lax") as "Strict" | "Lax" | "None",
    })),
  );
  const page = await context.newPage();

  console.log("→ /company/setup/new/");
  await page.goto("https://www.linkedin.com/company/setup/new/", { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log(`  url: ${page.url()}`);
  await page.screenshot({ path: path.join(OUT, "diag-01.png"), fullPage: true });
  fs.writeFileSync(path.join(OUT, "diag-01.html"), await page.content());

  // Try clicking a "small business" / "company" tile
  const tiles = await page.locator('a, button, [role="button"]').all();
  console.log(`  ${tiles.length} clickable elements`);
  for (const t of tiles.slice(0, 50)) {
    const text = (await t.innerText().catch(() => "")).trim().replace(/\s+/g, " ").slice(0, 80);
    const href = await t.getAttribute("href").catch(() => null);
    if (text && /small business|company|page|create/i.test(text)) {
      console.log(`    • "${text}" href=${href}`);
    }
  }

  // Try the small-business path directly
  console.log("\n→ trying /company/setup/new/ variants");
  for (const url of [
    "https://www.linkedin.com/company/setup/new/small-business/",
    "https://www.linkedin.com/company/setup/new/?companyType=company",
  ]) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2500);
      console.log(`  ${url} → ${page.url()}`);
      const fname = url.replace(/[^a-z0-9]/gi, "_").slice(0, 60);
      await page.screenshot({ path: path.join(OUT, `diag-${fname}.png`), fullPage: true });

      const inputs = await page.locator("input, textarea, select").all();
      console.log(`    inputs: ${inputs.length}`);
      for (const inp of inputs.slice(0, 25)) {
        const name = await inp.getAttribute("name").catch(() => null);
        const id = await inp.getAttribute("id").catch(() => null);
        const aria = await inp.getAttribute("aria-label").catch(() => null);
        const type = await inp.getAttribute("type").catch(() => null);
        const placeholder = await inp.getAttribute("placeholder").catch(() => null);
        console.log(`      type=${type} name=${name} id=${id} aria="${aria}" placeholder="${placeholder}"`);
      }
    } catch (e: unknown) {
      console.log(`  ${url} failed: ${(e as Error).message}`);
    }
  }

  await context.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
