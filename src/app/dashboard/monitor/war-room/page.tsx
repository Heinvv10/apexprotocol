"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectedBrand } from "@/stores";

type CrisisSeverity = "warning" | "critical" | "emergency";
type CrisisStatus = "active" | "acknowledged" | "resolved" | "false_positive";
type CrisisType =
  | "sentiment_drop"
  | "mention_spike"
  | "score_drop"
  | "negative_surge"
  | "keyword_alert";

interface CrisisMetrics {
  previousValue: number;
  currentValue: number;
  changePercent: number;
  mentionCount?: number;
  negativeMentions?: number;
}

interface TimelineEntry {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor?: string;
}

interface SuggestedAction {
  id: string;
  priority: "immediate" | "high" | "medium" | "low";
  title: string;
  description: string;
  category: string;
  completed: boolean;
}

interface Crisis {
  id: string;
  type: CrisisType;
  severity: CrisisSeverity;
  status: CrisisStatus;
  title: string;
  description: string;
  triggeredAt: string;
  resolvedAt?: string;
  metrics: CrisisMetrics;
  affectedPlatforms: string[];
  timeline: TimelineEntry[];
  suggestedActions: SuggestedAction[];
  alertCount: number;
  alertsSent: number;
}

interface DashboardStats {
  activeCount: number;
  resolvedLast7Days: number;
  avgResolutionTimeHours: number;
  crisesByType: Record<CrisisType, number>;
  crisesBySeverity: Record<CrisisSeverity, number>;
}

interface DashboardResponse {
  success: boolean;
  dashboard: {
    activeCrises: Crisis[];
    stats: DashboardStats;
  };
}

const severityStyles: Record<CrisisSeverity, { bg: string; text: string; border: string; label: string }> = {
  emergency: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/40",
    label: "EMERGENCY",
  },
  critical: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/40",
    label: "CRITICAL",
  },
  warning: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    label: "WARNING",
  },
};

const priorityOrder: Record<SuggestedAction["priority"], number> = {
  immediate: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WarRoomPage() {
  const brand = useSelectedBrand();
  const [crises, setCrises] = React.useState<Crisis[]>([]);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [actionPending, setActionPending] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    if (!brand?.id) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/notifications/crisis?brandId=${encodeURIComponent(brand.id)}&action=dashboard`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as DashboardResponse;
      setCrises(data.dashboard.activeCrises);
      setStats(data.dashboard.stats);
      if (data.dashboard.activeCrises.length > 0 && !selectedId) {
        setSelectedId(data.dashboard.activeCrises[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load war room");
    } finally {
      setLoading(false);
    }
  }, [brand?.id, selectedId]);

  React.useEffect(() => {
    void loadDashboard();
    const id = setInterval(loadDashboard, 30_000);
    return () => clearInterval(id);
  }, [loadDashboard]);

  const selected = React.useMemo(
    () => crises.find((c) => c.id === selectedId) ?? crises[0],
    [crises, selectedId]
  );

  async function postAction(action: string, body: Record<string, unknown>) {
    setActionPending(action);
    try {
      const res = await fetch("/api/notifications/crisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionPending(null);
    }
  }

  if (!brand?.id) {
    return (
      <div className="min-h-screen bg-background">
        <BrandHeader pageName="War Room" />
        <main className="container mx-auto py-10">
          <div className="card-primary p-8 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Select a brand</h2>
            <p className="text-muted-foreground">Choose a brand to open its war room.</p>
          </div>
        </main>
      </div>
    );
  }

  const highestSeverity = crises.reduce<CrisisSeverity | null>((acc, c) => {
    if (!acc) return c.severity;
    const rank = { warning: 0, critical: 1, emergency: 2 };
    return rank[c.severity] > rank[acc] ? c.severity : acc;
  }, null);

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader pageName="War Room" />
      <main className="container mx-auto py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard/monitor"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Monitor
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flame className={highestSeverity ? severityStyles[highestSeverity].text : "text-primary"} />
              War Room
              {highestSeverity && (
                <Badge
                  className={`${severityStyles[highestSeverity].bg} ${severityStyles[highestSeverity].text} ${severityStyles[highestSeverity].border}`}
                >
                  {severityStyles[highestSeverity].label}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time crisis response for {brand.name}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadDashboard()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="card-secondary border-red-500/40 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<AlertOctagon className="w-5 h-5" />}
            label="Active Crises"
            value={stats?.activeCount ?? 0}
            tone={stats && stats.activeCount > 0 ? "danger" : "neutral"}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Resolved (7d)"
            value={stats?.resolvedLast7Days ?? 0}
            tone="success"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Resolution"
            value={stats ? `${stats.avgResolutionTimeHours.toFixed(1)}h` : "—"}
            tone="neutral"
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5" />}
            label="Emergencies"
            value={stats?.crisesBySeverity.emergency ?? 0}
            tone={stats && stats.crisesBySeverity.emergency > 0 ? "danger" : "neutral"}
          />
        </div>

        {loading && crises.length === 0 ? (
          <div className="card-primary p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : crises.length === 0 ? (
          <div className="card-primary p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">All clear</h2>
            <p className="text-muted-foreground">
              No active crises for {brand.name}. Thresholds are monitoring continuously.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,320px)_1fr] gap-6">
            <div className="card-secondary p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 text-sm font-medium">
                Active ({crises.length})
              </div>
              <ScrollArea className="max-h-[70vh]">
                <ul className="divide-y divide-border/30">
                  {crises.map((c) => {
                    const style = severityStyles[c.severity];
                    const isSelected = c.id === selected?.id;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => setSelectedId(c.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-white/5 transition ${
                            isSelected ? "bg-white/[0.03]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={`${style.bg} ${style.text} ${style.border} text-[10px] font-semibold`}
                            >
                              {style.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(c.triggeredAt)}
                            </span>
                          </div>
                          <div className="font-medium text-sm line-clamp-2">{c.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {c.type.replace(/_/g, " ")} · {c.affectedPlatforms.length} platforms
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </div>

            {selected && (
              <CrisisDetail
                crisis={selected}
                actionPending={actionPending}
                onAcknowledge={() => postAction("acknowledge", { eventId: selected.id })}
                onResolve={(resolution) =>
                  postAction("resolve", { eventId: selected.id, resolution })
                }
                onCompleteAction={(actionId) =>
                  postAction("completeAction", { eventId: selected.id, actionId })
                }
                onMarkFalsePositive={() =>
                  postAction("markFalsePositive", { eventId: selected.id })
                }
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "danger" | "success" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-400"
      : tone === "success"
      ? "text-green-400"
      : "text-foreground";
  return (
    <div className="card-secondary p-4">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2`}>
        <span className={toneClass}>{icon}</span>
        {label}
      </div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function CrisisDetail({
  crisis,
  actionPending,
  onAcknowledge,
  onResolve,
  onCompleteAction,
  onMarkFalsePositive,
}: {
  crisis: Crisis;
  actionPending: string | null;
  onAcknowledge: () => void;
  onResolve: (resolution?: string) => void;
  onCompleteAction: (actionId: string) => void;
  onMarkFalsePositive: () => void;
}) {
  const style = severityStyles[crisis.severity];
  const sortedActions = [...crisis.suggestedActions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="card-primary p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`${style.bg} ${style.text} ${style.border}`}>{style.label}</Badge>
          <Badge variant="outline" className="text-xs">
            {crisis.type.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {crisis.status}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatRelativeTime(crisis.triggeredAt)}
          </span>
        </div>
        <h2 className="text-xl font-semibold mb-1">{crisis.title}</h2>
        <p className="text-sm text-muted-foreground">{crisis.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-tertiary p-3">
          <div className="text-xs text-muted-foreground mb-1">Previous</div>
          <div className="text-lg font-semibold">{crisis.metrics.previousValue.toFixed(1)}</div>
        </div>
        <div className="card-tertiary p-3">
          <div className="text-xs text-muted-foreground mb-1">Current</div>
          <div className="text-lg font-semibold">{crisis.metrics.currentValue.toFixed(1)}</div>
        </div>
        <div className="card-tertiary p-3">
          <div className="text-xs text-muted-foreground mb-1">Change</div>
          <div className={`text-lg font-semibold ${style.text}`}>
            {crisis.metrics.changePercent > 0 ? "+" : ""}
            {crisis.metrics.changePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {crisis.affectedPlatforms.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Affected Platforms
          </div>
          <div className="flex flex-wrap gap-2">
            {crisis.affectedPlatforms.map((p) => (
              <Badge key={p} variant="outline" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {crisis.status === "active" && (
          <Button
            size="sm"
            onClick={onAcknowledge}
            disabled={actionPending === "acknowledge"}
          >
            {actionPending === "acknowledge" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserCircle2 className="w-4 h-4 mr-2" />
            )}
            Acknowledge
          </Button>
        )}
        {(crisis.status === "active" || crisis.status === "acknowledged") && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onResolve()}
              disabled={actionPending === "resolve"}
            >
              {actionPending === "resolve" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Mark Resolved
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkFalsePositive}
              disabled={actionPending === "markFalsePositive"}
            >
              <XCircle className="w-4 h-4 mr-2" />
              False Positive
            </Button>
          </>
        )}
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Suggested Actions ({sortedActions.filter((a) => !a.completed).length} open)
        </h3>
        <ul className="space-y-2">
          {sortedActions.map((action) => (
            <li
              key={action.id}
              className={`card-tertiary p-3 flex items-start gap-3 ${
                action.completed ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => !action.completed && onCompleteAction(action.id)}
                disabled={action.completed || actionPending === "completeAction"}
                className="mt-0.5 flex-shrink-0"
                aria-label={action.completed ? "Completed" : "Mark complete"}
              >
                <CheckCircle2
                  className={`w-5 h-5 ${
                    action.completed ? "text-green-500" : "text-muted-foreground hover:text-foreground"
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      action.priority === "immediate"
                        ? "border-red-500/40 text-red-400"
                        : action.priority === "high"
                        ? "border-orange-500/40 text-orange-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {action.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{action.category}</span>
                </div>
                <div className={`font-medium text-sm ${action.completed ? "line-through" : ""}`}>
                  {action.title}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline
        </h3>
        <ol className="relative border-l border-border/40 ml-2 space-y-3">
          {crisis.timeline.map((entry) => (
            <li key={entry.id} className="pl-4 relative">
              <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(entry.timestamp)}
                {entry.actor && ` · ${entry.actor}`}
              </div>
              <div className="text-sm">{entry.description}</div>
            </li>
          ))}
        </ol>
      </section>

      <div className="text-xs text-muted-foreground border-t border-border/30 pt-3">
        {crisis.alertsSent}/{crisis.alertCount} alerts sent
      </div>
    </div>
  );
}
