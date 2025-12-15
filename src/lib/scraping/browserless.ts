/**
 * Browserless.io Integration (F093)
 * Headless browser service for scraping AI platforms
 */

// Browserless client configuration
let browserlessEndpoint: string | null = null;

/**
 * Initialize Browserless client
 */
export function getBrowserlessEndpoint(): string {
  if (!browserlessEndpoint) {
    const token = process.env.BROWSERLESS_API_KEY;
    const host = process.env.BROWSERLESS_HOST || "chrome.browserless.io";

    if (!token) {
      throw new Error(
        "Browserless not configured. Set BROWSERLESS_API_KEY environment variable."
      );
    }

    browserlessEndpoint = `wss://${host}?token=${token}`;
  }

  return browserlessEndpoint;
}

/**
 * Browserless REST API helpers
 */
export async function browserlessScreenshot(
  url: string,
  options: {
    fullPage?: boolean;
    type?: "png" | "jpeg" | "webp";
    quality?: number;
    viewport?: { width: number; height: number };
  } = {}
): Promise<Buffer> {
  const token = process.env.BROWSERLESS_API_KEY;
  const host = process.env.BROWSERLESS_HOST || "chrome.browserless.io";

  if (!token) {
    throw new Error("BROWSERLESS_API_KEY not set");
  }

  const response = await fetch(`https://${host}/screenshot?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      options: {
        fullPage: options.fullPage ?? false,
        type: options.type ?? "png",
        quality: options.quality ?? 80,
      },
      viewport: options.viewport ?? { width: 1920, height: 1080 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Screenshot failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Scrape page content using Browserless
 */
export async function browserlessScrape(
  url: string,
  options: {
    waitFor?: string | number;
    extractContent?: boolean;
    cookies?: Array<{ name: string; value: string; domain: string }>;
  } = {}
): Promise<{
  html: string;
  text: string;
  title: string;
  url: string;
}> {
  const token = process.env.BROWSERLESS_API_KEY;
  const host = process.env.BROWSERLESS_HOST || "chrome.browserless.io";

  if (!token) {
    throw new Error("BROWSERLESS_API_KEY not set");
  }

  const response = await fetch(`https://${host}/content?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      waitFor: options.waitFor,
      cookies: options.cookies,
    }),
  });

  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.statusText}`);
  }

  const html = await response.text();

  // Extract text content
  const textContent = extractTextFromHtml(html);
  const title = extractTitleFromHtml(html);

  return {
    html,
    text: textContent,
    title,
    url,
  };
}

/**
 * Execute JavaScript function on page using Browserless
 */
export async function browserlessFunction<T>(
  url: string,
  fn: () => T,
  options: {
    waitFor?: string | number;
    timeout?: number;
  } = {}
): Promise<T> {
  const token = process.env.BROWSERLESS_API_KEY;
  const host = process.env.BROWSERLESS_HOST || "chrome.browserless.io";

  if (!token) {
    throw new Error("BROWSERLESS_API_KEY not set");
  }

  const response = await fetch(`https://${host}/function?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: `
        module.exports = async ({ page }) => {
          await page.goto('${url}', { waitUntil: 'networkidle0', timeout: ${options.timeout || 30000} });
          ${options.waitFor ? `await page.waitForSelector('${options.waitFor}');` : ""}
          return await page.evaluate(${fn.toString()});
        };
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Function execution failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get PDF of a page
 */
export async function browserlessPdf(
  url: string,
  options: {
    format?: "A4" | "Letter" | "Legal";
    landscape?: boolean;
    printBackground?: boolean;
  } = {}
): Promise<Buffer> {
  const token = process.env.BROWSERLESS_API_KEY;
  const host = process.env.BROWSERLESS_HOST || "chrome.browserless.io";

  if (!token) {
    throw new Error("BROWSERLESS_API_KEY not set");
  }

  const response = await fetch(`https://${host}/pdf?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      options: {
        format: options.format ?? "A4",
        landscape: options.landscape ?? false,
        printBackground: options.printBackground ?? true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PDF generation failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Helper to extract text from HTML
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Helper to extract title from HTML
 */
function extractTitleFromHtml(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "";
}

/**
 * Scraper session manager for complex multi-step scraping
 */
export class BrowserlessSession {
  private sessionId: string | null = null;
  private token: string;
  private host: string;

  constructor() {
    this.token = process.env.BROWSERLESS_API_KEY || "";
    this.host = process.env.BROWSERLESS_HOST || "chrome.browserless.io";

    if (!this.token) {
      throw new Error("BROWSERLESS_API_KEY not set");
    }
  }

  async connect(): Promise<void> {
    // In a real implementation, this would establish a WebSocket connection
    // For now, we'll use REST endpoints
    this.sessionId = `session_${Date.now()}`;
  }

  async navigate(url: string): Promise<{ html: string; title: string }> {
    const result = await browserlessScrape(url);
    return { html: result.html, title: result.title };
  }

  async screenshot(): Promise<Buffer> {
    if (!this.sessionId) {
      throw new Error("Session not connected");
    }
    // Would use current page from session
    return Buffer.from([]);
  }

  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.sessionId) {
      throw new Error("Session not connected");
    }
    // Would evaluate on current page
    return undefined as T;
  }

  async close(): Promise<void> {
    this.sessionId = null;
  }
}

/**
 * Wrapper for AI platform-specific scraping with retry logic
 */
export async function scrapeAIPlatform(
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek",
  query: string,
  options: {
    maxRetries?: number;
    timeout?: number;
  } = {}
): Promise<{
  response: string;
  sources?: string[];
  platform: string;
  timestamp: Date;
}> {
  const maxRetries = options.maxRetries ?? 3;
  const timeout = options.timeout ?? 60000;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Platform-specific scraping URLs
      const platformUrls: Record<string, string> = {
        chatgpt: "https://chat.openai.com",
        claude: "https://claude.ai",
        gemini: "https://gemini.google.com",
        perplexity: "https://perplexity.ai",
        grok: "https://grok.x.ai",
        deepseek: "https://chat.deepseek.com",
      };

      const url = platformUrls[platform];
      if (!url) {
        throw new Error(`Unknown platform: ${platform}`);
      }

      // Note: Actual scraping would require authentication handling
      // This is a simplified implementation
      const result = await browserlessScrape(url, {
        waitFor: 5000,
      });

      return {
        response: result.text,
        sources: [],
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw lastError || new Error(`Failed to scrape ${platform} after ${maxRetries} attempts`);
}

export default {
  getBrowserlessEndpoint,
  browserlessScreenshot,
  browserlessScrape,
  browserlessFunction,
  browserlessPdf,
  scrapeAIPlatform,
  BrowserlessSession,
};
