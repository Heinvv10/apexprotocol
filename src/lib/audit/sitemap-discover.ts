/**
 * Sitemap discovery — given any URL, find the pages Apex should patch.
 *
 * Strategy in order:
 *   1. `/sitemap.xml` — XML sitemap or sitemap index
 *   2. `/robots.txt` → look for `Sitemap:` directives
 *   3. `/sitemap_index.xml` — common variant
 *   4. Fallback: crawl from root, pick internal links on same host
 *
 * Returns unique URLs on the same host, same-protocol, capped at maxUrls.
 * Non-HTML resources (pdf, zip, images) are filtered out.
 */

import * as cheerio from "cheerio";

const NON_HTML_EXT =
  /\.(pdf|zip|tar|gz|rar|doc|docx|xls|xlsx|ppt|pptx|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mp3|wav|woff2?|ttf|eot|css|js|json|xml)(\?|$)/i;

interface SitemapSource {
  kind: "sitemap" | "sitemap_index" | "robots" | "crawl";
  url: string;
}

export interface DiscoveryResult {
  rootUrl: string;
  source: SitemapSource;
  urls: string[];
  /** True when we capped at maxUrls — caller should inform the user. */
  truncated: boolean;
}

async function safeFetch(url: string, timeoutMs = 15000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ApexGEO-SitePatcher/1.0; +https://apexgeo.app)",
      },
    });
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

function filterAndDedupe(urls: string[], rootUrl: URL): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    try {
      const parsed = new URL(u, rootUrl);
      if (parsed.host !== rootUrl.host) continue;
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
      // Strip fragment
      parsed.hash = "";
      const normalized = parsed.toString();
      if (NON_HTML_EXT.test(normalized)) continue;
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(normalized);
    } catch {
      /* skip invalid URL */
    }
  }
  return out;
}

/**
 * Parse a sitemap XML string. Handles both urlset (leaf) and sitemapindex
 * (references to child sitemaps). Returns a list of URLs and any child
 * sitemap URLs the caller should recurse into.
 */
function parseSitemapXml(xml: string): {
  urls: string[];
  childSitemaps: string[];
} {
  const urls: string[] = [];
  const childSitemaps: string[] = [];

  // Use cheerio in XML mode — robust to namespaces + whitespace.
  const $ = cheerio.load(xml, { xml: true });

  $("sitemap > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) childSitemaps.push(loc);
  });
  $("url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) urls.push(loc);
  });

  return { urls, childSitemaps };
}

async function followSitemap(
  sitemapUrl: string,
  rootUrl: URL,
  maxUrls: number,
  visited: Set<string>,
): Promise<string[]> {
  if (visited.has(sitemapUrl) || visited.size > 20) return [];
  visited.add(sitemapUrl);

  const res = await safeFetch(sitemapUrl);
  if (!res || !res.ok) return [];
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  // Defensive: some servers return HTML for missing sitemaps.
  if (
    !text.trim().startsWith("<?xml") &&
    !text.includes("<urlset") &&
    !text.includes("<sitemapindex") &&
    !contentType.includes("xml")
  ) {
    return [];
  }

  const { urls, childSitemaps } = parseSitemapXml(text);
  const collected = [...filterAndDedupe(urls, rootUrl)];

  // Recurse into child sitemaps (index case) — bounded.
  for (const child of childSitemaps) {
    if (collected.length >= maxUrls) break;
    const more = await followSitemap(child, rootUrl, maxUrls, visited);
    for (const u of more) {
      if (collected.length >= maxUrls) break;
      if (!collected.includes(u)) collected.push(u);
    }
  }

  return collected;
}

async function fromRobots(rootUrl: URL): Promise<string[]> {
  const res = await safeFetch(new URL("/robots.txt", rootUrl).toString());
  if (!res || !res.ok) return [];
  const text = await res.text();
  const sitemaps: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*Sitemap:\s*(\S+)\s*$/i);
    if (m) sitemaps.push(m[1]);
  }
  return sitemaps;
}

async function crawlFallback(rootUrl: URL, maxUrls: number): Promise<string[]> {
  // Simple BFS to 2 levels from root. Safe default when no sitemap exists.
  const seen = new Set<string>([rootUrl.toString()]);
  const queue: string[] = [rootUrl.toString()];
  const out: string[] = [rootUrl.toString()];

  for (let depth = 0; depth < 2; depth++) {
    const batch = queue.splice(0, queue.length);
    for (const u of batch) {
      if (out.length >= maxUrls) break;
      const res = await safeFetch(u, 10000);
      if (!res || !res.ok) continue;
      const ctype = res.headers.get("content-type") ?? "";
      if (!ctype.includes("text/html")) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      const links: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (href) links.push(href);
      });
      for (const next of filterAndDedupe(links, rootUrl)) {
        if (out.length >= maxUrls) break;
        if (seen.has(next)) continue;
        seen.add(next);
        out.push(next);
        queue.push(next);
      }
    }
    if (out.length >= maxUrls) break;
  }

  return out;
}

export async function discoverPages(
  rootInput: string,
  opts: { maxUrls?: number } = {},
): Promise<DiscoveryResult> {
  const maxUrls = opts.maxUrls ?? 50;
  let rootUrl: URL;
  try {
    rootUrl = new URL(rootInput);
  } catch {
    throw new Error(`Invalid URL: ${rootInput}`);
  }

  // 1. Try the canonical /sitemap.xml first
  const visited = new Set<string>();
  const primarySitemap = new URL("/sitemap.xml", rootUrl).toString();
  let urls = await followSitemap(primarySitemap, rootUrl, maxUrls, visited);
  if (urls.length > 0) {
    return {
      rootUrl: rootUrl.toString(),
      source: { kind: "sitemap", url: primarySitemap },
      urls: urls.slice(0, maxUrls),
      truncated: urls.length > maxUrls,
    };
  }

  // 2. Try /robots.txt sitemaps
  const robotsSitemaps = await fromRobots(rootUrl);
  for (const sm of robotsSitemaps) {
    urls = await followSitemap(sm, rootUrl, maxUrls, visited);
    if (urls.length > 0) {
      return {
        rootUrl: rootUrl.toString(),
        source: { kind: "robots", url: sm },
        urls: urls.slice(0, maxUrls),
        truncated: urls.length > maxUrls,
      };
    }
  }

  // 3. /sitemap_index.xml fallback
  const indexUrl = new URL("/sitemap_index.xml", rootUrl).toString();
  urls = await followSitemap(indexUrl, rootUrl, maxUrls, visited);
  if (urls.length > 0) {
    return {
      rootUrl: rootUrl.toString(),
      source: { kind: "sitemap_index", url: indexUrl },
      urls: urls.slice(0, maxUrls),
      truncated: urls.length > maxUrls,
    };
  }

  // 4. Crawl fallback
  urls = await crawlFallback(rootUrl, maxUrls);
  return {
    rootUrl: rootUrl.toString(),
    source: { kind: "crawl", url: rootUrl.toString() },
    urls: urls.slice(0, maxUrls),
    truncated: urls.length > maxUrls,
  };
}
