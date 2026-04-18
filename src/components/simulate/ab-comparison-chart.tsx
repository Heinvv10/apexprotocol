"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ABComparisonChartProps {
  results: Array<{
    platform: string;
    scoreDelta: number;
    variantBScoreDelta?: number | null;
    status: string;
  }>;
  winner?: "a" | "b" | "tie" | null;
}

const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
  deepseek: "DeepSeek",
  copilot: "Copilot",
};

export function ABComparisonChart({ results, winner }: ABComparisonChartProps) {
  const successResults = results.filter((r) => r.status === "success");

  const chartData = successResults.map((r) => ({
    platform: platformLabels[r.platform] || r.platform,
    "Variant A": Math.round(r.scoreDelta * 10) / 10,
    "Variant B": Math.round((r.variantBScoreDelta ?? 0) * 10) / 10,
  }));

  return (
    <div className="card-secondary space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">A/B Score Delta Comparison</h4>
        {winner && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              winner === "a"
                ? "bg-primary/10 text-primary"
                : winner === "b"
                  ? "bg-accent-purple/10 text-accent-purple"
                  : "bg-white/10 text-muted-foreground"
            }`}
          >
            {winner === "tie" ? "Tie" : `Variant ${winner.toUpperCase()} Wins`}
          </span>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="platform"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 18, 37, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="Variant A" fill="hsl(var(--color-primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Variant B" fill="hsl(var(--color-accent-purple))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
