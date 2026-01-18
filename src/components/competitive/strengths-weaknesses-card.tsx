"use client";

import * as React from "react";
import {
  Shield,
  AlertTriangle,
  Lightbulb,
  Skull,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StrengthsWeaknessesCardProps {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  competitorName: string;
  className?: string;
}

// SWOT category config
const SWOT_CONFIG = {
  strengths: {
    icon: Shield,
    title: "Your Strengths",
    description: "Where you outperform the competitor",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  weaknesses: {
    icon: AlertTriangle,
    title: "Your Weaknesses",
    description: "Areas where the competitor leads",
    color: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
  },
  opportunities: {
    icon: Lightbulb,
    title: "Opportunities",
    description: "Areas with growth potential",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  threats: {
    icon: Skull,
    title: "Threats",
    description: "Potential risks to watch",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
};

// SWOT section component
function SWOTSection({
  type,
  items,
  isExpanded,
  onToggle,
}: {
  type: keyof typeof SWOT_CONFIG;
  items: string[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = SWOT_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border overflow-hidden", config.border)}>
      <button
        onClick={onToggle}
        className={cn(
          "w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors",
          config.bg
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5", config.color)} />
          <div className="text-left">
            <div className="font-medium text-foreground">{config.title}</div>
            <div className="text-xs text-muted-foreground">
              {config.description}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded",
              config.bg,
              config.color
            )}
          >
            {items.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && items.length > 0 && (
        <div className="p-4 border-t border-border/30 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full", config.color.replace("text-", "bg-"))} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && items.length === 0 && (
        <div className="p-4 border-t border-border/30 text-sm text-muted-foreground text-center">
          No items identified
        </div>
      )}
    </div>
  );
}

export function StrengthsWeaknessesCard({
  strengths,
  weaknesses,
  opportunities,
  threats,
  competitorName,
  className,
}: StrengthsWeaknessesCardProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(["strengths", "weaknesses"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpanded(newExpanded);
  };

  // Calculate summary
  const totalItems = strengths.length + weaknesses.length + opportunities.length + threats.length;
  const positiveItems = strengths.length + opportunities.length;
  const negativeItems = weaknesses.length + threats.length;

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              SWOT Analysis
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your position vs {competitorName}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-success">{positiveItems}</div>
              <div className="text-xs text-muted-foreground">Positive</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-error">{negativeItems}</div>
              <div className="text-xs text-muted-foreground">Concerns</div>
            </div>
          </div>
        </div>
      </div>

      {/* SWOT Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SWOTSection
          type="strengths"
          items={strengths}
          isExpanded={expanded.has("strengths")}
          onToggle={() => toggleSection("strengths")}
        />
        <SWOTSection
          type="weaknesses"
          items={weaknesses}
          isExpanded={expanded.has("weaknesses")}
          onToggle={() => toggleSection("weaknesses")}
        />
        <SWOTSection
          type="opportunities"
          items={opportunities}
          isExpanded={expanded.has("opportunities")}
          onToggle={() => toggleSection("opportunities")}
        />
        <SWOTSection
          type="threats"
          items={threats}
          isExpanded={expanded.has("threats")}
          onToggle={() => toggleSection("threats")}
        />
      </div>
    </div>
  );
}
