/**
 * POST /api/tools/site-patch         — discover + queue a site patch job
 * GET  /api/tools/site-patch?jobId=X — poll job status
 * GET  /api/tools/site-patch?jobId=X&download=1 — stream the zip
 *
 * Crawls a site (sitemap.xml → robots.txt → /sitemap_index.xml → BFS
 * fallback), patches each HTML page via src/lib/audit/html-codemods.ts,
 * and zips the result. User downloads one file with everything ready
 * to drop into their CMS / S3 / repo.
 *
 * State lives in Redis so completed zips survive dev-server restarts
 * (same rationale as the Phase B audit-worker fix). In-flight work does
 * not resume — a restart mid-job forces the user to re-run, which is
 * fine since crawl+patch is idempotent and under 3 min for 50 pages.
 */

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { getUserId } from "@/lib/auth/supabase-server";
import { discoverPages } from "@/lib/audit/sitemap-discover";
import { applyCodemods } from "@/lib/audit/html-codemods";
import { getRedisClient } from "@/lib/redis";

const MAX_URLS = 50;
const JOB_TTL_SECONDS = 30 * 60;
const FETCH_TIMEOUT_MS = 20000;
const INTER_REQUEST_DELAY_MS = 150;

const jobKey = (id: string) => `site-patch:job:${id}`;
const zipKey = (id: string) => `site-patch:zip:${id}`;

interface PageResult {
  url: string;
  status: "patched" | "skipped" | "fetch_failed" | "not_html";
  changeCount?: number;
  sourceBytes?: number;
  patchedBytes?: number;
  error?: string;
}

// Persisted state (no binary — zip stored under a separate key).
type JobState =
  | {
      status: "discovering";
      startedAt: number;
      rootUrl: string;
    }
  | {
      status: "patching";
      startedAt: number;
      rootUrl: string;
      total: number;
      done: number;
      pages: PageResult[];
    }
  | {
      status: "completed";
      startedAt: number;
      completedAt: number;
      rootUrl: string;
      sitemapSource: { kind: string; url: string };
      total: number;
      pages: PageResult[];
      totalChanges: number;
      zipBytes: number;
    }
  | { status: "failed"; startedAt: number; error: string };

async function setJob(id: string, state: JobState): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(jobKey(id), JOB_TTL_SECONDS, JSON.stringify(state));
}

async function getJob(id: string): Promise<JobState | null> {
  const redis = getRedisClient();
  const raw = await redis.get(jobKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JobState;
  } catch {
    return null;
  }
}

async function setZip(id: string, buf: Uint8Array): Promise<void> {
  const redis = getRedisClient();
  // Store as base64 — avoids binary-handling edge cases across in-memory
  // fallback and ioredis, and the string path is already TTL-safe.
  const encoded = Buffer.from(buf).toString("base64");
  await redis.setex(zipKey(id), JOB_TTL_SECONDS, encoded);
}

async function getZip(id: string): Promise<Uint8Array | null> {
  const redis = getRedisClient();
  const encoded = await redis.get(zipKey(id));
  if (!encoded) return null;
  return new Uint8Array(Buffer.from(encoded, "base64"));
}

function safeFilename(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname;
    if (path === "/" || path === "") path = "/index";
    if (path.endsWith("/")) path = path + "index";
    if (!/\.[a-z0-9]+$/i.test(path)) path = path + ".html";
    if (!/\.html?$/i.test(path)) path = path.replace(/\.[^.]+$/, ".html");
    return path.replace(/^\/+/, "");
  } catch {
    return "unnamed.html";
  }
}

async function fetchHtml(url: string): Promise<{ html: string; contentType: string } | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ApexGEO-SitePatcher/1.0; +https://apexgeo.app)",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    const html = await res.text();
    return { html, contentType };
  } catch {
    return null;
  }
}

async function runSitePatchJob(jobId: string, rootUrl: string) {
  const startedAt = Date.now();

  try {
    await setJob(jobId, { status: "discovering", startedAt, rootUrl });
    const discovery = await discoverPages(rootUrl, { maxUrls: MAX_URLS });

    if (discovery.urls.length === 0) {
      await setJob(jobId, {
        status: "failed",
        startedAt,
        error:
          "No pages discovered. The site may block crawlers, or /sitemap.xml and /robots.txt don't expose URLs.",
      });
      return;
    }

    await setJob(jobId, {
      status: "patching",
      startedAt,
      rootUrl,
      total: discovery.urls.length,
      done: 0,
      pages: [],
    });

    const zip = new JSZip();
    const pages: PageResult[] = [];
    let totalChanges = 0;

    const csvRows = [
      ["url", "status", "changes", "source_bytes", "patched_bytes", "error"].join(","),
    ];

    for (const url of discovery.urls) {
      const fetched = await fetchHtml(url);
      if (!fetched) {
        const entry: PageResult = { url, status: "fetch_failed" };
        pages.push(entry);
        csvRows.push([url, "fetch_failed", "", "", "", "(network)"].map(csvEscape).join(","));
      } else if (!fetched.contentType.toLowerCase().includes("text/html")) {
        const entry: PageResult = { url, status: "not_html" };
        pages.push(entry);
        csvRows.push([url, "not_html", "", String(fetched.html.length), "", "non-html content"].map(csvEscape).join(","));
      } else {
        const patch = applyCodemods(fetched.html);
        if (patch.changes.length === 0) {
          const entry: PageResult = {
            url,
            status: "skipped",
            changeCount: 0,
            sourceBytes: fetched.html.length,
            patchedBytes: patch.patched.length,
          };
          pages.push(entry);
          csvRows.push([url, "already_optimized", "0", String(fetched.html.length), String(patch.patched.length), ""].map(csvEscape).join(","));
        } else {
          zip.file(safeFilename(url), patch.patched);
          totalChanges += patch.changes.length;
          const entry: PageResult = {
            url,
            status: "patched",
            changeCount: patch.changes.length,
            sourceBytes: fetched.html.length,
            patchedBytes: patch.patched.length,
          };
          pages.push(entry);
          csvRows.push([url, "patched", String(patch.changes.length), String(fetched.html.length), String(patch.patched.length), ""].map(csvEscape).join(","));
        }
      }

      await setJob(jobId, {
        status: "patching",
        startedAt,
        rootUrl,
        total: discovery.urls.length,
        done: pages.length,
        pages: [...pages],
      });

      await new Promise((r) => setTimeout(r, INTER_REQUEST_DELAY_MS));
    }

    zip.file("_summary.csv", csvRows.join("\n"));
    zip.file(
      "_README.txt",
      [
        `Apex Site Patch — ${new Date().toISOString()}`,
        `Root: ${rootUrl}`,
        `Discovery: ${discovery.source.kind} (${discovery.source.url})`,
        `Pages discovered: ${discovery.urls.length}`,
        `Pages patched: ${pages.filter((p) => p.status === "patched").length}`,
        `Pages already optimized: ${pages.filter((p) => p.status === "skipped").length}`,
        `Pages skipped (non-HTML): ${pages.filter((p) => p.status === "not_html").length}`,
        `Pages failed to fetch: ${pages.filter((p) => p.status === "fetch_failed").length}`,
        `Total HTML changes applied: ${totalChanges}`,
        ``,
        `Each patched page is at its own relative path matching the original.`,
        `Deploy by overwriting your existing HTML at each path. Always back up first.`,
        `See _summary.csv for the per-URL detail.`,
      ].join("\n"),
    );

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    await setZip(jobId, zipBuffer);
    await setJob(jobId, {
      status: "completed",
      startedAt,
      completedAt: Date.now(),
      rootUrl,
      sitemapSource: discovery.source,
      total: discovery.urls.length,
      pages,
      totalChanges,
      zipBytes: zipBuffer.byteLength,
    });
  } catch (e) {
    await setJob(jobId, {
      status: "failed",
      startedAt,
      error: e instanceof Error ? e.message : "Unknown error during site patch",
    });
  }
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url } = body as { url?: string };
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "url is not a valid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "url must be http or https" }, { status: 400 });
  }

  const jobId = randomUUID();

  runSitePatchJob(jobId, parsed.toString()).catch((e) => {
    console.error("[site-patch] unhandled error:", e);
  });

  return NextResponse.json({ jobId, status: "discovering" }, { status: 202 });
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "job not found or expired" }, { status: 404 });
  }

  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";
  if (wantsDownload) {
    if (job.status !== "completed") {
      return NextResponse.json(
        { error: `Job is ${job.status} — not downloadable yet` },
        { status: 409 },
      );
    }
    const zip = await getZip(jobId);
    if (!zip) {
      return NextResponse.json({ error: "zip expired" }, { status: 410 });
    }
    const hostname = (() => {
      try {
        return new URL(job.rootUrl).hostname;
      } catch {
        return "site";
      }
    })();
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="apex-patched-${hostname}-${new Date().toISOString().slice(0, 10)}.zip"`,
        "Content-Length": String(job.zipBytes),
      },
    });
  }

  return NextResponse.json(job);
}
