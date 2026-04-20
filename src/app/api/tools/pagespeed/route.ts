/**
 * POST /api/tools/pagespeed  — kick off a PSI scan, return a jobId immediately
 * GET  /api/tools/pagespeed?jobId=... — poll job status
 *
 * PSI calls take 20–45 seconds which exceeds Cloudflare Tunnel's origin
 * timeout window (~30s). Synchronous return would 502 on most real sites.
 * Instead, store the job result in-process keyed by jobId and poll from
 * the UI every 3s. In-process is fine because:
 *   - jobs are ephemeral (5-minute TTL)
 *   - worst case on restart: user re-submits, costs nothing
 *   - no Redis / DB overhead for a disposable tool
 */

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getUserId } from "@/lib/auth/supabase-server";
import { checkPageSpeedFull } from "@/lib/audit/checks/pagespeed-full";

type JobState =
  | { status: "running"; startedAt: number }
  | {
      status: "completed";
      startedAt: number;
      completedAt: number;
      result: NonNullable<Awaited<ReturnType<typeof checkPageSpeedFull>>>;
    }
  | { status: "failed"; startedAt: number; error: string };

const JOB_TTL_MS = 5 * 60 * 1000; // 5 min

// In-process store. Single Next.js instance — that's our deployment.
const JOBS = new Map<string, JobState>();

function pruneStaleJobs() {
  const now = Date.now();
  for (const [id, job] of JOBS) {
    const started = job.status === "running" ? job.startedAt : job.startedAt;
    if (now - started > JOB_TTL_MS) JOBS.delete(id);
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url, strategy } = body as { url?: string; strategy?: "mobile" | "desktop" };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "url is not a valid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "url must be http or https" }, { status: 400 });
  }

  pruneStaleJobs();

  const jobId = randomUUID();
  const startedAt = Date.now();
  JOBS.set(jobId, { status: "running", startedAt });

  const effectiveStrategy: "mobile" | "desktop" =
    strategy === "desktop" ? "desktop" : "mobile";

  // Kick off the PSI scan and let it settle into the job store. We
  // don't await — Cloudflare has already closed the request socket
  // by the time PSI returns.
  checkPageSpeedFull(parsed.toString(), { strategy: effectiveStrategy })
    .then((result) => {
      if (!result) {
        JOBS.set(jobId, {
          status: "failed",
          startedAt,
          error:
            "PSI didn't return data. Page may be unreachable, blocked by bot protection, or PSI is rate-limited.",
        });
        return;
      }
      JOBS.set(jobId, {
        status: "completed",
        startedAt,
        completedAt: Date.now(),
        result,
      });
    })
    .catch((e) => {
      JOBS.set(jobId, {
        status: "failed",
        startedAt,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    });

  return NextResponse.json({ jobId, status: "running" }, { status: 202 });
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
  pruneStaleJobs();
  const job = JOBS.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "job not found or expired" }, { status: 404 });
  }
  return NextResponse.json(job);
}
