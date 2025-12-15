"use client";

import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Bot
} from "lucide-react";

export function DashboardPreview() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-purple/10 text-[hsl(var(--accent-purple))] text-sm font-medium mb-4">
            Dashboard Preview
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Intelligence at a{" "}
            <span className="bg-gradient-to-r from-accent-purple to-primary bg-clip-text text-transparent">
              Glance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A dashboard-first experience. No chatbots, just actionable insights.
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="max-w-5xl mx-auto">
          <div className="card-primary-gradient p-1">
            <div className="bg-background/95 rounded-xl p-6 space-y-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold">Apex Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Last updated: 2 min ago</span>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="GEO Score"
                  value="72"
                  trend="+12%"
                  positive
                />
                <MetricCard
                  label="AI Mentions"
                  value="847"
                  trend="+156"
                  positive
                />
                <MetricCard
                  label="Share of Answer"
                  value="68%"
                  trend="+8%"
                  positive
                />
                <MetricCard
                  label="Open Tasks"
                  value="12"
                  trend="-3"
                  positive
                />
              </div>

              {/* Main Content */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Recommendations */}
                <div className="md:col-span-2 card-secondary">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    Priority Recommendations
                  </h4>
                  <div className="space-y-2">
                    <RecommendationRow
                      priority="high"
                      text="Add FAQ schema to pricing page"
                    />
                    <RecommendationRow
                      priority="medium"
                      text="Update product descriptions for AI extraction"
                    />
                    <RecommendationRow
                      priority="low"
                      text="Optimize images for Core Web Vitals"
                    />
                  </div>
                </div>

                {/* AI Platforms */}
                <div className="card-secondary">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    AI Platforms
                  </h4>
                  <div className="space-y-2">
                    <PlatformRow name="ChatGPT" score={85} />
                    <PlatformRow name="Claude" score={72} />
                    <PlatformRow name="Gemini" score={68} />
                    <PlatformRow name="Perplexity" score={91} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent-purple/10 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  trend,
  positive
}: {
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <div className="card-tertiary">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <span className={`text-xs flex items-center gap-0.5 ${positive ? "text-success" : "text-destructive"}`}>
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      </div>
    </div>
  );
}

function RecommendationRow({
  priority,
  text
}: {
  priority: "high" | "medium" | "low";
  text: string;
}) {
  const colors = {
    high: "bg-destructive/20 text-destructive",
    medium: "bg-warning/20 text-warning",
    low: "bg-success/20 text-success",
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${colors[priority]}`}>
        {priority}
      </span>
      <span className="text-sm flex-1 truncate">{text}</span>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function PlatformRow({
  name,
  score
}: {
  name: string;
  score: number;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{name}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs font-medium w-8 text-right">{score}%</span>
      </div>
    </div>
  );
}
