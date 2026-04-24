"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Sparkles, Activity, DollarSign, Zap, BarChart3 } from "lucide-react";

type Period = "7d" | "30d" | "90d";

interface Metric {
  type: string;
  label: string;
  current: number;
  limit: number;
  unit: string;
  percentage: number;
  trend: number;
}

interface Summary {
  period: { start: string; end: string };
  metrics: Metric[];
  totalCost?: number;
  projectedCost?: number;
}

interface HistoryPoint {
  date: string;
  metrics: Record<string, number>;
}

interface Breakdown {
  byBrand: Array<{ brandId: string; brandName: string; metrics: Record<string, number> }>;
  byUser: Array<{ userId: string; userName: string; metrics: Record<string, number> }>;
  byFeature: Array<{ feature: string; metrics: Record<string, number> }>;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number | undefined): string {
  if (!n) return "$0.00";
  return `$${n.toFixed(2)}`;
}

export default function UsagePage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void Promise.all([
      fetch(`/api/usage/summary?period=${period}`).then((r) => r.json()),
      fetch(`/api/usage/history?period=${period}`).then((r) => r.json()),
      fetch(`/api/usage/breakdown?period=${period}`).then((r) => r.json()),
    ])
      .then(([s, h, b]) => {
        setSummary(s);
        setHistory(h?.data || []);
        setBreakdown(b);
      })
      .catch((err) => {
        console.error("[usage] load failed", err);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const tokenMetric = summary?.metrics.find((m) => m.type === "ai_tokens");
  const callsMetric = summary?.metrics.find((m) => m.type === "api_calls");
  const auditsMetric = summary?.metrics.find((m) => m.type === "audits");
  const mentionsMetric = summary?.metrics.find((m) => m.type === "mentions_tracked");

  // Derive the SVG chart path from history
  const chart = useMemo(() => {
    if (!history.length) return null;
    const width = 800;
    const height = 200;
    const pad = 20;
    const values = history.map((p) => p.metrics.ai_tokens || 0);
    const max = Math.max(...values, 1);
    const dx = (width - pad * 2) / Math.max(history.length - 1, 1);
    const points = values.map(
      (v, i) => `${pad + i * dx},${height - pad - (v / max) * (height - pad * 2)}`,
    );
    return {
      width,
      height,
      polyline: points.join(" "),
      areaPath: `M${pad},${height - pad} L${points.join(" L")} L${pad + (values.length - 1) * dx},${height - pad} Z`,
      max,
    };
  }, [history]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Usage & Costs
          </h1>
          <p className="text-muted-foreground mt-1">
            AI tokens, API calls, and per-feature consumption across your organization.
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Period">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-foreground hover:bg-white/10"
              }`}
            >
              Last {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          label="AI Tokens"
          value={formatNumber(tokenMetric?.current ?? 0)}
          sub={tokenMetric?.limit ? `of ${formatNumber(tokenMetric.limit)} limit` : "No limit"}
          percent={tokenMetric?.percentage}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
          label="AI Cost"
          value={formatCost(summary?.totalCost)}
          sub={summary?.projectedCost ? `${formatCost(summary.projectedCost)} projected` : undefined}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-cyan-400" />}
          label="API Calls"
          value={formatNumber(callsMetric?.current ?? 0)}
          sub={callsMetric?.limit ? `of ${formatNumber(callsMetric.limit)} limit` : undefined}
          percent={callsMetric?.percentage}
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-yellow-400" />}
          label="Audits Run"
          value={formatNumber(auditsMetric?.current ?? 0)}
          sub={`${formatNumber(mentionsMetric?.current ?? 0)} mentions tracked`}
        />
      </div>

      {/* Usage over time chart */}
      <div className="card-secondary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI tokens over time</h2>
          <span className="text-xs text-muted-foreground">
            {history.length > 0
              ? `${history.length} day${history.length === 1 ? "" : "s"} of data`
              : "No data yet"}
          </span>
        </div>
        {chart ? (
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5CC" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00E5CC" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.areaPath} fill="url(#usageGradient)" />
            <polyline points={chart.polyline} fill="none" stroke="#00E5CC" strokeWidth="2" />
          </svg>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No usage recorded in the last {period}. AI calls and API requests will appear here once
            they happen.
          </div>
        )}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard
          title="By feature"
          rows={(breakdown?.byFeature || []).map((f) => ({
            label: f.feature,
            value: f.metrics.ai_tokens || 0,
            unit: "tokens",
          }))}
        />
        <BreakdownCard
          title="By user"
          rows={(breakdown?.byUser || []).map((u) => ({
            label: u.userName,
            value: u.metrics.ai_tokens || 0,
            unit: "tokens",
          }))}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        Usage rolls up from <code className="bg-white/5 px-1 py-0.5 rounded">ai_usage</code> and{" "}
        <code className="bg-white/5 px-1 py-0.5 rounded">api_call_tracking</code> in your Supabase
        database. New events appear within seconds of the call.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  percent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  percent?: number;
}) {
  return (
    <div className="card-secondary rounded-lg p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {typeof percent === "number" && (
        <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-yellow-500" : "bg-primary"
            }`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number; unit: string }>;
}) {
  const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 6);
  const max = Math.max(...sorted.map((r) => r.value), 1);
  return (
    <div className="card-secondary rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {sorted.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">No data yet</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate max-w-[60%]">{row.label || "(unlabeled)"}</span>
                <span className="text-muted-foreground">
                  {formatNumber(row.value)} {row.unit}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
