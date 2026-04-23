"use client";

/**
 * LiveAuditProgress — prominent progress card rendered above the audit
 * form on /dashboard/audit while an audit is in flight.
 *
 * Drives entirely off useAuditStream (SSE). The card auto-mounts when
 * an in-progress audit is detected for the selected brand and hides
 * itself a few seconds after the audit reaches a terminal state so the
 * user has time to read the completion message before it collapses.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Globe,
  Loader2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useAuditStream,
  useCancelAudit,
  type AuditProgressSnapshot,
} from "@/hooks/useAudit";
import type { AuditStage } from "@/lib/db/schema/audits";

interface LiveAuditProgressProps {
  auditId: string;
  url: string;
  startedAt?: string;
  onDismiss?: () => void;
}

interface StageDef {
  stage: AuditStage;
  label: string;
  description: string;
}

// Ordered list the stepper renders. `queued` is collapsed into "Crawling"
// for the user because the queue wait is usually sub-second and rendering
// a step they'll never see looks confusing.
const STAGE_ORDER: StageDef[] = [
  { stage: "crawling", label: "Crawling", description: "Fetching pages" },
  { stage: "analyzing", label: "Analyzing", description: "Extracting signals" },
  { stage: "checks", label: "Checks", description: "AI readiness" },
  { stage: "scoring", label: "Scoring", description: "GEO score" },
  { stage: "persisting", label: "Persisting", description: "Saving results" },
  { stage: "finalizing", label: "Finalizing", description: "Recommendations" },
];

function stageIndex(stage: AuditStage): number {
  if (stage === "queued") return 0;
  const idx = STAGE_ORDER.findIndex((s) => s.stage === stage);
  if (idx >= 0) return idx;
  if (stage === "completed" || stage === "failed" || stage === "cancelled") {
    return STAGE_ORDER.length;
  }
  return 0;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

/**
 * Derive a friendly headline from the snapshot. Falls back to generic
 * copy so the card always has something to render.
 */
function headline(snapshot: AuditProgressSnapshot | null, url: string): string {
  if (!snapshot) return `Queueing audit for ${url}…`;
  if (snapshot.status === "completed") return "Audit complete";
  if (snapshot.status === "failed") return "Audit failed";
  return snapshot.message || "Running audit…";
}

export function LiveAuditProgress({
  auditId,
  url,
  startedAt,
  onDismiss,
}: LiveAuditProgressProps) {
  const router = useRouter();
  const { snapshot, connected, error } = useAuditStream(auditId);
  const cancelMutation = useCancelAudit();

  // Tick every second so the elapsed timer is live even between SSE
  // events. We don't trigger a re-render from the SSE stream alone
  // because the worker only writes at phase boundaries.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  // Capture the mount time once so we have a stable fallback for
  // `startedAt` that survives re-renders — calling Date.now() directly
  // inside useMemo would violate React's purity rule (eslint
  // react-hooks/purity).
  const [mountedAtMs] = React.useState(() => Date.now());
  const startMs = React.useMemo(() => {
    const iso = snapshot?.startedAt || startedAt;
    return iso ? new Date(iso).getTime() : mountedAtMs;
  }, [snapshot?.startedAt, startedAt, mountedAtMs]);

  const elapsedMs = Math.max(0, now - startMs);

  const status = snapshot?.status ?? "pending";
  const stage = snapshot?.stage ?? "queued";
  const percent = snapshot?.percent ?? 5;
  const isDone = status === "completed" || status === "failed";

  // Fire a single success/failure toast when we hit a terminal state.
  const toastFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (!snapshot || toastFiredRef.current) return;
    if (snapshot.status === "completed") {
      toastFiredRef.current = true;
      toast.success("Audit complete", {
        description:
          typeof snapshot.overallScore === "number"
            ? `Overall GEO score: ${snapshot.overallScore}/100`
            : snapshot.message || "Results are ready to view.",
        action: {
          label: "View",
          onClick: () =>
            router.push(`/dashboard/audit/results?id=${snapshot.auditId}`),
        },
      });
    } else if (snapshot.status === "failed") {
      toastFiredRef.current = true;
      toast.error("Audit failed", {
        description:
          snapshot.errorMessage || snapshot.message || "Unknown error.",
      });
    }
  }, [snapshot, router]);

  // Auto-dismiss 8s after completion so the user has time to read the
  // result card. Failures stick around until the user dismisses.
  React.useEffect(() => {
    if (!onDismiss) return;
    if (status !== "completed") return;
    const t = setTimeout(() => onDismiss(), 8000);
    return () => clearTimeout(t);
  }, [status, onDismiss]);

  const currentStepIdx = stageIndex(stage);

  return (
    <div className="card-primary p-6 relative overflow-hidden">
      {/* Ambient glow pulse while running — decorative only */}
      {!isDone && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px circle at 10% 0%, rgba(0,229,204,0.15), transparent 50%)",
          }}
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
              status === "completed"
                ? "bg-success/15 text-success"
                : status === "failed"
                  ? "bg-error/15 text-error"
                  : "bg-primary/15 text-primary"
            }`}
          >
            {status === "completed" ? (
              <Check className="h-5 w-5" />
            ) : status === "failed" ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span className="truncate">{url}</span>
              {connected && !isDone && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  live
                </span>
              )}
            </div>
            <div className="font-semibold text-base mt-1 truncate">
              {headline(snapshot, url)}
            </div>
            {snapshot?.pagesCrawled !== undefined &&
              snapshot.totalPages !== undefined &&
              snapshot.totalPages > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {snapshot.pagesCrawled} / {snapshot.totalPages} pages
                </div>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {Math.round(percent)}%
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatElapsed(elapsedMs)}
            </div>
          </div>

          {isDone ? (
            <div className="flex gap-2">
              {status === "completed" && (
                <Button size="sm" asChild>
                  <Link href={`/dashboard/audit/results?id=${auditId}`}>
                    View results
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                cancelMutation.mutate(auditId, {
                  onSuccess: () => {
                    toast.info("Audit cancelled");
                    onDismiss?.();
                  },
                  onError: (err) => {
                    toast.error("Couldn't cancel audit", {
                      description:
                        err instanceof Error ? err.message : String(err),
                    });
                  },
                });
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling…" : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      <div className="relative mt-5">
        <Progress
          value={percent}
          className={status === "failed" ? "opacity-60" : ""}
        />
      </div>

      {/* Stage stepper */}
      <div className="relative mt-5 grid grid-cols-6 gap-2">
        {STAGE_ORDER.map((def, idx) => {
          const reached = idx < currentStepIdx || isDone;
          const active = idx === currentStepIdx && !isDone;
          return (
            <div
              key={def.stage}
              className="flex flex-col items-center text-center"
            >
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                  reached
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {reached ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  idx + 1
                )}
              </div>
              <div
                className={`text-[11px] mt-1.5 font-medium ${
                  reached || active
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {def.label}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {def.description}
              </div>
            </div>
          );
        })}
      </div>

      {error && !isDone && (
        <div className="mt-4 text-xs text-warning">
          Connection issue: {error}. Retrying…
        </div>
      )}
    </div>
  );
}
