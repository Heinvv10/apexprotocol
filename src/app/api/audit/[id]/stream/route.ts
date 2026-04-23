/**
 * GET /api/audit/[id]/stream — Server-Sent Events endpoint that pushes
 * live progress for a running audit to the dashboard.
 *
 * Why SSE and not Upstash Realtime:
 *   The audit worker writes progress into the `audits.metadata.progress`
 *   JSONB at each phase boundary. Pub/sub would let us avoid polling but
 *   would require wiring Upstash Realtime publish calls into the worker
 *   and into every failure path. Server-side DB polling every 750ms is
 *   simpler, has one owner (this file), and is cheap because the
 *   progress query reads a single indexed row by primary key.
 *
 * Contract:
 *   The stream emits one JSON event per observed change, and a final
 *   `terminal` event when the audit reaches completed/failed/cancelled.
 *   The client is expected to close the EventSource on `terminal`.
 */

import { NextRequest } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { AuditMetadata, AuditStage } from "@/lib/db/schema/audits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ProgressEvent {
  auditId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  stage: AuditStage;
  percent: number;
  message?: string;
  pagesCrawled?: number;
  totalPages?: number;
  currentUrl?: string;
  overallScore?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

const POLL_INTERVAL_MS = 750;
const MAX_STREAM_DURATION_MS = 10 * 60 * 1000; // audit timeout is 5min; double for safety

function stageFromStatus(
  status: "pending" | "in_progress" | "completed" | "failed",
  stored: AuditStage | undefined,
): AuditStage {
  if (stored) return stored;
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "in_progress") return "crawling";
  return "queued";
}

function percentFor(
  status: "pending" | "in_progress" | "completed" | "failed",
  stored: number | undefined,
): number {
  if (typeof stored === "number") return stored;
  if (status === "completed") return 100;
  if (status === "failed") return 100;
  if (status === "pending") return 5;
  return 15;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = await getUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const orgId = await getOrganizationId();
  const { id } = await params;

  // Verify access once up-front. If the caller can't see this audit we
  // close immediately rather than silently hanging.
  const initial = await db.query.audits.findFirst({
    where: eq(audits.id, id),
    with: { brand: true },
  });
  if (!initial) {
    return new Response("Audit not found", { status: 404 });
  }
  if (orgId && initial.brand.organizationId !== orgId) {
    return new Response("Access denied", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const startTime = Date.now();
      let lastSignature = "";
      let timer: ReturnType<typeof setTimeout> | null = null;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearTimeout(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", close);

      type AuditRow = Pick<
        typeof initial,
        | "id"
        | "status"
        | "metadata"
        | "overallScore"
        | "startedAt"
        | "completedAt"
        | "errorMessage"
      >;

      const buildEvent = (row: AuditRow): ProgressEvent => {
        const metadata = (row.metadata ?? {}) as AuditMetadata;
        const progress = metadata.progress;
        return {
          auditId: row.id,
          status: row.status,
          stage: stageFromStatus(row.status, progress?.stage),
          percent: percentFor(row.status, progress?.percent),
          message: progress?.message,
          pagesCrawled: progress?.pagesCrawled,
          totalPages: progress?.totalPages,
          currentUrl: progress?.currentUrl,
          overallScore: row.overallScore,
          startedAt: row.startedAt?.toISOString() ?? null,
          completedAt: row.completedAt?.toISOString() ?? null,
          errorMessage: row.errorMessage,
        };
      };

      const emitIfChanged = (row: AuditRow) => {
        const payload = buildEvent(row);
        const sig = `${payload.status}|${payload.stage}|${payload.percent}|${payload.message ?? ""}|${payload.pagesCrawled ?? ""}`;
        if (sig === lastSignature) return payload;
        lastSignature = sig;
        send("progress", payload);
        return payload;
      };

      // Prime the stream so the client sees current state immediately.
      const first = emitIfChanged(initial);
      if (first.status === "completed" || first.status === "failed") {
        send("terminal", first);
        close();
        return;
      }

      const tick = async () => {
        if (closed) return;
        if (Date.now() - startTime > MAX_STREAM_DURATION_MS) {
          send("timeout", { auditId: id });
          close();
          return;
        }
        try {
          const row = await db.query.audits.findFirst({
            where: eq(audits.id, id),
          });
          if (!row) {
            send("error", { message: "Audit disappeared" });
            close();
            return;
          }
          const payload = emitIfChanged(row);
          if (payload.status === "completed" || payload.status === "failed") {
            send("terminal", payload);
            close();
            return;
          }
        } catch (err) {
          // A transient DB error shouldn't kill the stream; the next tick
          // will retry. If the connection is already dead the abort
          // handler will close us.
          send("warning", {
            message: err instanceof Error ? err.message : String(err),
          });
        }
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      };

      timer = setTimeout(tick, POLL_INTERVAL_MS);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable nginx buffering so events flush immediately in prod.
      "X-Accel-Buffering": "no",
    },
  });
}
