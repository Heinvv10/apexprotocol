/**
 * POST /api/tools/llms-txt         — discover + queue an llms.txt build job
 * GET  /api/tools/llms-txt?jobId=X — poll job status (returns llmsTxt when ready)
 *
 * Crawls a site with the same sitemap → robots → crawl-fallback pipeline as
 * site-patch, collects title/description per page, and renders an llms.txt
 * file per the llmstxt.org structure. State lives in Redis so jobs survive
 * app restarts.
 */

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getUserId } from "@/lib/auth/supabase-server";
import { discoverPages } from "@/lib/audit/sitemap-discover";
import {
  collectPageMeta,
  renderLlmsTxt,
  type PageMeta,
} from "@/lib/audit/llms-txt-builder";
import { getRedisClient } from "@/lib/redis";

const MAX_URLS = 50;
const JOB_TTL_SECONDS = 30 * 60;

const jobKey = (id: string) => `llms-txt:job:${id}`;

type JobState =
  | { status: "discovering"; startedAt: number; rootUrl: string }
  | {
      status: "fetching";
      startedAt: number;
      rootUrl: string;
      total: number;
      done: number;
    }
  | {
      status: "completed";
      startedAt: number;
      completedAt: number;
      rootUrl: string;
      sitemapSource: { kind: string; url: string };
      total: number;
      pageCount: number;
      llmsTxt: string;
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

async function runJob(jobId: string, rootUrl: string) {
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
      status: "fetching",
      startedAt,
      rootUrl,
      total: discovery.urls.length,
      done: 0,
    });

    const pages: PageMeta[] = await collectPageMeta(discovery.urls, {
      concurrency: 4,
      onProgress: (done, total) => {
        // Fire-and-forget progress write — no need to await every tick,
        // but JSON.stringify is cheap and Redis is local.
        void setJob(jobId, {
          status: "fetching",
          startedAt,
          rootUrl,
          total,
          done,
        });
      },
    });

    const root = new URL(rootUrl);
    const homepage = pages.find((p) => {
      try {
        const u = new URL(p.url);
        return u.pathname === "/" || u.pathname === "";
      } catch {
        return false;
      }
    });
    const siteTitle = homepage?.title ?? root.hostname;
    const siteDescription = homepage?.description ?? "";

    const llmsTxt = renderLlmsTxt({
      siteTitle,
      siteDescription,
      pages,
      rootUrl: root,
    });

    await setJob(jobId, {
      status: "completed",
      startedAt,
      completedAt: Date.now(),
      rootUrl,
      sitemapSource: discovery.source,
      total: discovery.urls.length,
      pageCount: pages.length,
      llmsTxt,
    });
  } catch (e) {
    await setJob(jobId, {
      status: "failed",
      startedAt,
      error: e instanceof Error ? e.message : "Unknown error during llms.txt build",
    });
  }
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
  runJob(jobId, parsed.toString()).catch((e) => {
    console.error("[llms-txt] unhandled error:", e);
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
    const hostname = (() => {
      try {
        return new URL(job.rootUrl).hostname;
      } catch {
        return "site";
      }
    })();
    return new NextResponse(job.llmsTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="llms-${hostname}.txt"`,
      },
    });
  }

  return NextResponse.json(job);
}
