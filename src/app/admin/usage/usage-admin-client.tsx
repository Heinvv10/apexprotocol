"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, DollarSign, Activity, Users, Sparkles } from "lucide-react";

type PeriodDays = 7 | 30 | 90;

interface CostRow {
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  usageCount: number;
}

interface OrgLeaderRow {
  organizationId: string;
  organizationName: string | null;
  tokens: number;
  cost: number;
  calls: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function UsageAdminClient() {
  const [days, setDays] = useState<PeriodDays>(30);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CostRow[]>([]);
  const [orgLeaders, setOrgLeaders] = useState<OrgLeaderRow[]>([]);

  useEffect(() => {
    setLoading(true);
    void Promise.all([
      fetch(`/api/admin/dashboard/ai-costs?days=${days}`).then((r) => r.json()),
      fetch(`/api/admin/usage/by-org?days=${days}`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([costs, orgs]) => {
        const breakdown = (costs?.data?.breakdown || costs?.breakdown || []) as CostRow[];
        setRows(breakdown);
        setOrgLeaders(orgs?.data || []);
      })
      .catch((err) => {
        console.error("[admin-usage] load failed", err);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const totalTokens = rows.reduce((s, r) => s + (r.totalTokens || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.totalCost || 0), 0);
  const totalCalls = rows.reduce((s, r) => s + (r.usageCount || 0), 0);
  const activeOrgs = orgLeaders.length;

  const byProvider: Record<string, { tokens: number; cost: number; count: number }> = {};
  for (const r of rows) {
    const p = (byProvider[r.provider] ||= { tokens: 0, cost: 0, count: 0 });
    p.tokens += r.totalTokens || 0;
    p.cost += r.totalCost || 0;
    p.count += r.usageCount || 0;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Platform Usage
          </h1>
          <p className="text-muted-foreground mt-1">
            Super-admin view: AI consumption, costs, and API traffic across every organization.
          </p>
        </div>
        <div className="flex gap-2">
          {([7, 30, 90] as PeriodDays[]).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-foreground hover:bg-white/10"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat icon={<Sparkles className="h-5 w-5 text-primary" />} label="Total Tokens" value={formatNumber(totalTokens)} />
            <Stat icon={<DollarSign className="h-5 w-5 text-green-400" />} label="Total Cost" value={formatCost(totalCost)} />
            <Stat icon={<Activity className="h-5 w-5 text-cyan-400" />} label="AI Calls" value={formatNumber(totalCalls)} />
            <Stat icon={<Users className="h-5 w-5 text-yellow-400" />} label="Active Orgs" value={String(activeOrgs)} />
          </div>

          {/* Provider split */}
          <div className="card-secondary rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">By provider</h2>
            {Object.keys(byProvider).length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No AI usage recorded in the last {days} days.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(byProvider).map(([provider, p]) => (
                  <div key={provider} className="card-tertiary rounded-lg p-4">
                    <div className="text-sm font-medium text-foreground capitalize mb-2">{provider}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div><span className="text-foreground font-semibold">{formatNumber(p.tokens)}</span> tokens</div>
                      <div><span className="text-foreground font-semibold">{formatCost(p.cost)}</span> cost</div>
                      <div><span className="text-foreground font-semibold">{formatNumber(p.count)}</span> calls</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top orgs */}
          <div className="card-secondary rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Top organizations by token usage</h2>
            {orgLeaders.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No data. If you just wired tracking, new orgs appear here as they make AI calls.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <tr className="border-b border-white/5">
                      <th className="pb-2 font-medium">Organization</th>
                      <th className="pb-2 font-medium text-right">Tokens</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                      <th className="pb-2 font-medium text-right">Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgLeaders.slice(0, 20).map((row) => (
                      <tr key={row.organizationId} className="border-b border-white/5 last:border-0">
                        <td className="py-2 font-medium">{row.organizationName || row.organizationId}</td>
                        <td className="py-2 text-right">{formatNumber(row.tokens)}</td>
                        <td className="py-2 text-right">{formatCost(row.cost)}</td>
                        <td className="py-2 text-right">{formatNumber(row.calls)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Model breakdown */}
          <div className="card-secondary rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">By model + operation</h2>
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No usage to show.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <tr className="border-b border-white/5">
                      <th className="pb-2 font-medium">Provider</th>
                      <th className="pb-2 font-medium">Model</th>
                      <th className="pb-2 font-medium">Operation</th>
                      <th className="pb-2 font-medium text-right">In</th>
                      <th className="pb-2 font-medium text-right">Out</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                      <th className="pb-2 font-medium text-right">Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 30).map((r, i) => (
                      <tr key={`${r.provider}-${r.model}-${r.operation}-${i}`} className="border-b border-white/5 last:border-0">
                        <td className="py-2 capitalize">{r.provider}</td>
                        <td className="py-2 text-muted-foreground">{r.model}</td>
                        <td className="py-2 text-muted-foreground">{r.operation}</td>
                        <td className="py-2 text-right">{formatNumber(r.inputTokens)}</td>
                        <td className="py-2 text-right">{formatNumber(r.outputTokens)}</td>
                        <td className="py-2 text-right font-semibold">{formatNumber(r.totalTokens)}</td>
                        <td className="py-2 text-right">{formatCost(r.totalCost)}</td>
                        <td className="py-2 text-right">{formatNumber(r.usageCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-secondary rounded-lg p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}
