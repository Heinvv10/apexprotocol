"use client";

import { Target, TrendingUp } from "lucide-react";

interface ActionPlanItem {
  rank: 1 | 2 | 3;
  title: string;
  reason: string;
  findingIds: string[];
  expectedScoreImpact?: number;
}

interface ActionPlanCardProps {
  items: ActionPlanItem[];
  generatedAt?: string;
}

export function ActionPlanCard({ items, generatedAt }: ActionPlanCardProps) {
  if (items.length === 0) return null;

  return (
    <div className="card-primary p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Do these first</h2>
        {generatedAt && (
          <span className="text-xs text-muted-foreground ml-auto">
            Generated {new Date(generatedAt).toLocaleString()}
          </span>
        )}
      </div>
      <ol className="space-y-4">
        {items.map((item) => (
          <li key={item.findingIds.join("-")} className="flex gap-4">
            <span className="flex-none flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                {typeof item.expectedScoreImpact === "number" &&
                  item.expectedScoreImpact > 0 && (
                    <span className="flex-none inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3" />+
                      {item.expectedScoreImpact} pts
                    </span>
                  )}
              </div>
              <p className="text-sm text-muted-foreground">{item.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
