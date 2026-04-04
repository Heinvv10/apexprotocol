import { TrendingUp, Zap, Target, Brain } from "lucide-react";

export const metadata = {
  title: "Predictions | ApexGEO",
  description: "AI-powered predictions for your brand visibility.",
};

const placeholderPredictions = [
  {
    icon: TrendingUp,
    title: "Visibility Score Forecast",
    value: "+12%",
    description: "Expected increase over next 30 days based on current trajectory.",
    color: "text-green-400",
  },
  {
    icon: Brain,
    title: "AI Mention Opportunity",
    value: "High",
    description: "ChatGPT and Claude are likely to mention your category more this week.",
    color: "text-blue-400",
  },
  {
    icon: Target,
    title: "Competitor Gap",
    value: "3 topics",
    description: "Topics where competitors rank but you don't — prime opportunities.",
    color: "text-purple-400",
  },
  {
    icon: Zap,
    title: "Recommended Action",
    value: "Content update",
    description: "Refreshing your FAQ page could increase AI citation rate by ~8%.",
    color: "text-yellow-400",
  },
];

export default function PredictionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Predictions</h1>
        <p className="text-muted-foreground text-sm">
          AI-powered forecasts and recommendations to stay ahead of the curve.
        </p>
      </div>

      {/* Coming soon badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
        <Zap className="w-3 h-3" />
        Full predictions engine launching soon
      </div>

      {/* Prediction cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {placeholderPredictions.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="card-secondary p-6 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.title}
                  </span>
                </div>
                <span className={`text-lg font-bold ${item.color}`}>
                  {item.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Empty state footer note */}
      <div className="card-tertiary p-6 text-center border-dashed">
        <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Predictions improve as we gather more data about your brand. Add more brands and check back soon.
        </p>
      </div>
    </div>
  );
}
