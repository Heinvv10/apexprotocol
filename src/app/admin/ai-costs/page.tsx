"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Cpu,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Calendar,
  Zap,
  Bot,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// Types
interface CostBreakdown {
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  usageCount: number;
}

interface CostSummary {
  totalCost: number;
  totalTokens: number;
  byProvider: Record<string, {
    cost: number;
    tokens: number;
    models: Record<string, { cost: number; tokens: number }>;
  }>;
  byOperation: Record<string, {
    cost: number;
    tokens: number;
    providers: Record<string, { cost: number; tokens: number }>;
  }>;
  breakdown: CostBreakdown[];
  timestamp: string;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

// Provider colors and icons
const providerConfig: Record<string, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  claude: { color: "text-orange-400", bgColor: "bg-orange-500/20", icon: Brain },
  openai: { color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: Bot },
  gemini: { color: "text-blue-400", bgColor: "bg-blue-500/20", icon: Sparkles },
};

// Operation colors
const operationColors: Record<string, string> = {
  sentiment: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  content_generation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  recommendation: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  audit_analysis: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  insight_generation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  classification: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  summarization: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  chat: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  default: "bg-red-500/20 text-red-400 border-red-500/30",
};

function ProviderCard({
  provider,
  cost,
  tokens,
  models,
  totalCost,
}: {
  provider: string;
  cost: number;
  tokens: number;
  models: Record<string, { cost: number; tokens: number }>;
  totalCost: number;
}) {
  const config = providerConfig[provider] || { color: "text-gray-400", bgColor: "bg-gray-500/20", icon: Bot };
  const Icon = config.icon;
  const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : "0";

  return (
    <div className="card-secondary">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold capitalize">{provider}</h3>
            <p className="text-xs text-muted-foreground">{percentage}% of total spend</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${config.color}`}>${cost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{formatNumber(tokens, { abbreviate: true })} tokens</p>
        </div>
      </div>

      {/* Cost bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.bgColor.replace('/20', '/60')}`}
            style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
          />
        </div>
      </div>

      {/* Models breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Models</p>
        {Object.entries(models).map(([model, data]) => (
          <div key={model} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span className="text-sm font-mono truncate flex-1">{model}</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{formatNumber(data.tokens, { abbreviate: true })} tokens</span>
              <span className={`font-medium ${config.color}`}>${data.cost.toFixed(3)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationCard({
  operation,
  cost,
  tokens,
  providers,
  totalCost,
}: {
  operation: string;
  cost: number;
  tokens: number;
  providers: Record<string, { cost: number; tokens: number }>;
  totalCost: number;
}) {
  const colorClass = operationColors[operation] || operationColors.default;
  const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : "0";

  return (
    <div className="card-tertiary p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-md border ${colorClass}`}>
            {operation.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-muted-foreground">{percentage}%</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${cost.toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">{formatNumber(tokens, { abbreviate: true })} tokens</p>
        </div>
      </div>

      {/* Mini provider breakdown */}
      <div className="flex items-center gap-2">
        {Object.entries(providers).map(([provider, data]) => {
          const config = providerConfig[provider] || { color: "text-gray-400", bgColor: "bg-gray-500/20" };
          return (
            <div key={provider} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bgColor}`}>
              <span className={`font-medium ${config.color} capitalize`}>{provider}</span>
              <span className="text-muted-foreground">${data.cost.toFixed(3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsageTable({ breakdown }: { breakdown: CostBreakdown[] }) {
  return (
    <div className="card-secondary overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-red-400" />
        Detailed Usage Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Provider</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Model</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Operation</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Requests</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Input</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Output</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row, i) => {
              const config = providerConfig[row.provider] || { color: "text-gray-400" };
              const opColor = operationColors[row.operation] || operationColors.default;
              return (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className={`py-3 px-4 font-medium capitalize ${config.color}`}>{row.provider}</td>
                  <td className="py-3 px-4 font-mono text-xs">{row.model}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded border ${opColor}`}>
                      {row.operation.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumber(row.usageCount)}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{formatNumber(row.inputTokens, { abbreviate: true })}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{formatNumber(row.outputTokens, { abbreviate: true })}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatNumber(row.totalTokens, { abbreviate: true })}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">${row.totalCost.toFixed(4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AICostsPage() {
  const [data, setData] = React.useState<CostSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState(30);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/dashboard/ai-costs?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch AI costs:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [days]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const providerCount = data ? Object.keys(data.byProvider).length : 0;
  const operationCount = data ? Object.keys(data.byOperation).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-red-400" />
              AI Usage & Costs
            </h1>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of AI service usage and costs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  days === d
                    ? "bg-red-500/20 text-red-400 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-3xl font-bold text-emerald-400">${data?.totalCost.toFixed(2) || "0.00"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                {data?.period.startDate} - {data?.period.endDate}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-3xl font-bold text-cyan-400">{formatNumber(data?.totalTokens || 0, { abbreviate: true })}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Input + Output combined
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/20">
              <Cpu className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Providers</p>
              <p className="text-3xl font-bold text-purple-400">{providerCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {providerCount > 0 ? Object.keys(data?.byProvider || {}).join(", ") : "No providers"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Operation Types</p>
              <p className="text-3xl font-bold text-amber-400">{operationCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Different AI tasks used
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Zap className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      {data && Object.keys(data.byProvider).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-red-400" />
            Costs by Provider
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(data.byProvider).map(([provider, providerData]) => (
              <ProviderCard
                key={provider}
                provider={provider}
                cost={providerData.cost}
                tokens={providerData.tokens}
                models={providerData.models}
                totalCost={data.totalCost}
              />
            ))}
          </div>
        </div>
      )}

      {/* Operations Breakdown */}
      {data && Object.keys(data.byOperation).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-400" />
            Costs by Operation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.byOperation)
              .sort(([, a], [, b]) => b.cost - a.cost)
              .map(([operation, opData]) => (
                <OperationCard
                  key={operation}
                  operation={operation}
                  cost={opData.cost}
                  tokens={opData.tokens}
                  providers={opData.providers}
                  totalCost={data.totalCost}
                />
              ))}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {data && data.breakdown.length > 0 && (
        <UsageTable breakdown={data.breakdown} />
      )}

      {/* Empty state */}
      {data && data.breakdown.length === 0 && (
        <div className="card-secondary text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No AI Usage Data</h3>
          <p className="text-muted-foreground">
            No AI service usage recorded in the last {days} days.
          </p>
        </div>
      )}
    </div>
  );
}
