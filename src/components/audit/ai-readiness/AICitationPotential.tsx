"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Award, Target } from "lucide-react";

interface CitationMetric {
  category: string;
  likelihood: number;
  relevance: number;
  authority: number;
}

interface AICitationPotentialProps {
  metrics: CitationMetric[];
  overallScore: number;
  percentile: number;
}

export function AICitationPotential({
  metrics,
  overallScore,
  percentile,
}: AICitationPotentialProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "High", color: "text-success" };
    if (score >= 60) return { level: "Medium", color: "text-warning" };
    if (score >= 40) return { level: "Low", color: "text-error" };
    return { level: "Very Low", color: "text-error" };
  };

  const risk = getRiskLevel(overallScore);

  const CustomTooltip = (props: any) => {
    if (!props.active) return null;
    const data = props.payload?.[0];
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground">{data.payload.category}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Likelihood: {data.payload.likelihood}%
        </p>
        <p className="text-xs text-muted-foreground">
          Relevance: {data.payload.relevance}%
        </p>
        <p className="text-xs text-muted-foreground">
          Authority: {data.payload.authority}%
        </p>
      </div>
    );
  };

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Citation Potential</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Probability your content will be cited by AI models in responses
        </p>
      </div>

      {/* Overall score card */}
      <div className="card-tertiary p-6 border bg-gradient-to-br from-primary/5 to-muted/5 space-y-4">
        <div className={`grid ${percentile > 0 ? "grid-cols-3" : "grid-cols-2"} gap-4`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{overallScore}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Citation Score
            </div>
          </div>
          {percentile > 0 && (
            <div className="text-center border-l border-r border-border">
              <div className={`text-4xl font-bold ${risk.color}`}>
                {percentile}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Percentile</div>
            </div>
          )}
          <div className="text-center">
            <div className={`text-xl font-bold ${risk.color}`}>{risk.level}</div>
            <div className="text-xs text-muted-foreground mt-1">Risk Level</div>
          </div>
        </div>

        {/* Status message */}
        <div className="text-sm text-muted-foreground italic">
          {overallScore >= 80
            ? "✅ Your content has excellent citation potential. AI models are likely to include your content in responses."
            : overallScore >= 60
            ? "🟡 Your content has moderate citation potential. Consider optimizations to increase AI readiness."
            : "⚠️ Your content has low citation potential. Implement recommendations to improve AI visibility."}
        </div>
      </div>

      {/* Metric breakdown chart + per-factor averages — only render when we
          actually have per-category citation metrics. The hook used to publish
          a fabricated Technology/Business/Education/Health/Science breakdown
          for every brand using deterministic multipliers on the overall score;
          it now returns []. Empty metrics would divide-by-zero the per-factor
          averages (NaN%) and render an empty chart, so hide both. */}
      {metrics.length > 0 && (
        <>
          <div>
            <h4 className="text-sm font-medium mb-3">Citation Factors by Category</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="likelihood" fill="hsl(var(--primary))" name="Likelihood" />
                <Bar dataKey="relevance" fill="hsl(var(--success))" name="Relevance" />
                <Bar dataKey="authority" fill="hsl(var(--warning))" name="Authority" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Citation Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="card-tertiary p-3 space-y-1 text-center">
                <div className="text-xs text-muted-foreground">Likelihood Score</div>
                <div className="text-lg font-bold text-primary">
                  {Math.round(
                    metrics.reduce((sum, m) => sum + m.likelihood, 0) /
                      metrics.length
                  )}
%
                </div>
                <div className="text-xs text-muted-foreground">
                  How likely to be cited
                </div>
              </div>
              <div className="card-tertiary p-3 space-y-1 text-center border-l border-r">
                <div className="text-xs text-muted-foreground">Relevance Score</div>
                <div className="text-lg font-bold text-success">
                  {Math.round(
                    metrics.reduce((sum, m) => sum + m.relevance, 0) /
                      metrics.length
                  )}
%
                </div>
                <div className="text-xs text-muted-foreground">
                  Topic relevance match
                </div>
              </div>
              <div className="card-tertiary p-3 space-y-1 text-center">
                <div className="text-xs text-muted-foreground">Authority Score</div>
                <div className="text-lg font-bold text-warning">
                  {Math.round(
                    metrics.reduce((sum, m) => sum + m.authority, 0) /
                      metrics.length
                  )}
%
                </div>
                <div className="text-xs text-muted-foreground">
                  Domain authority
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recommendations */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground mb-1">
              To Improve Citation Potential:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Create original, authoritative content on niche topics</li>
              <li>• Build domain authority through backlinks and citations</li>
              <li>• Use clear structure with headings and FAQ schema</li>
              <li>• Ensure E-E-A-T (Experience, Expertise, Authority, Trust)</li>
              <li>
                • Monitor AI platform trends and adapt content strategy
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
