"use client";

import * as React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, DollarSign, Zap, TrendingUp, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

const COLORS = ['#00E5CC', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export default function AICostsDashboard() {
  const [costData, setCostData] = React.useState<CostSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [days, setDays] = React.useState("30");
  const [provider, setProvider] = React.useState<string | undefined>();
  const [operation, setOperation] = React.useState<string | undefined>();

  const fetchCosts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("days", days);
      if (provider) params.append("provider", provider);
      if (operation) params.append("operation", operation);

      const response = await fetch(`/api/admin/dashboard/ai-costs?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch AI costs: ${response.statusText}`);
      }

      const data = await response.json();
      setCostData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [days, provider, operation]);

  React.useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const handleExport = () => {
    if (!costData) return;

    const csv = [
      ["Provider", "Model", "Operation", "Input Tokens", "Output Tokens", "Total Tokens", "Cost", "Usage Count"],
      ...costData.breakdown.map(item => [
        item.provider,
        item.model,
        item.operation,
        item.inputTokens,
        item.outputTokens,
        item.totalTokens,
        item.totalCost.toFixed(4),
        item.usageCount,
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-costs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const providerChartData = costData
    ? Object.entries(costData.byProvider).map(([name, data]) => ({
        name,
        cost: data.cost,
        tokens: data.tokens,
      }))
    : [];

  const operationChartData = costData
    ? Object.entries(costData.byOperation).map(([name, data]) => ({
        name,
        cost: data.cost,
        tokens: data.tokens,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">AI Costs & Usage Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor API token usage and billing by provider, model, and operation type
        </p>
      </div>

      {/* Filters */}
      <div className="card-secondary p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Period (Days)</label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider || ""} onValueChange={(v) => setProvider(v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All providers</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Operation</label>
            <Select value={operation || ""} onValueChange={(v) => setOperation(v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="All operations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All operations</SelectItem>
                <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                <SelectItem value="content">Content Generation</SelectItem>
                <SelectItem value="recommendation">Recommendations</SelectItem>
                <SelectItem value="audit">Audit Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={fetchCosts} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!costData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card-secondary p-4 border-error/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-error mb-1">Error Loading Data</h3>
            <p className="text-sm text-error/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-secondary p-6 animate-pulse">
              <div className="h-8 bg-muted rounded mb-4 w-1/3" />
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && costData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Cost */}
            <div className="card-primary p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Cost</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${costData.totalCost.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground">
                Period: {costData.period.startDate} to {costData.period.endDate}
              </p>
            </div>

            {/* Total Tokens */}
            <div className="card-primary p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Tokens</p>
                  <p className="text-3xl font-bold text-foreground">
                    {(costData.totalTokens / 1000000).toFixed(2)}M
                  </p>
                </div>
                <Zap className="h-8 w-8 text-primary opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground">
                {costData.breakdown.length} different operations
              </p>
            </div>

            {/* Average Cost per Million Tokens */}
            <div className="card-primary p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Cost per 1M Tokens</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${((costData.totalCost / costData.totalTokens) * 1000000).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground">
                Weighted average across all providers
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Provider */}
            <div className="card-secondary p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Cost by Provider</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={providerChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#141930", border: "1px solid #1a1a2e" }}
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Bar dataKey="cost" fill="#00E5CC" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost by Operation */}
            <div className="card-secondary p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Cost by Operation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={operationChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                  >
                    {operationChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider Breakdown */}
          <div className="card-secondary p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Provider Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(costData.byProvider).map(([providerName, providerData]) => (
                <div key={providerName} className="card-tertiary p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{providerName}</h4>
                    <span className="text-lg font-bold text-primary">
                      ${providerData.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Tokens: {(providerData.tokens / 1000000).toFixed(2)}M</div>
                    <div>Models: {Object.keys(providerData.models).join(", ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="card-secondary p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Detailed Usage Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-3 px-4 font-semibold">Provider</th>
                    <th className="text-left py-3 px-4 font-semibold">Model</th>
                    <th className="text-left py-3 px-4 font-semibold">Operation</th>
                    <th className="text-right py-3 px-4 font-semibold">Input Tokens</th>
                    <th className="text-right py-3 px-4 font-semibold">Output Tokens</th>
                    <th className="text-right py-3 px-4 font-semibold">Total Tokens</th>
                    <th className="text-right py-3 px-4 font-semibold">Cost</th>
                    <th className="text-right py-3 px-4 font-semibold">Usage Count</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.breakdown.map((item, idx) => (
                    <tr key={idx} className="border-b border-muted/30 hover:bg-muted/50">
                      <td className="py-3 px-4 capitalize">{item.provider}</td>
                      <td className="py-3 px-4">{item.model}</td>
                      <td className="py-3 px-4 capitalize">{item.operation}</td>
                      <td className="py-3 px-4 text-right">{item.inputTokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{item.outputTokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{item.totalTokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-primary">
                        ${item.totalCost.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right">{item.usageCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
