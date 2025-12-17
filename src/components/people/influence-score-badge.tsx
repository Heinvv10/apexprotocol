"use client";

/**
 * InfluenceScoreBadge Component (Phase 9.3)
 *
 * Displays influence score with tier badge and breakdown.
 * Shows score as a gauge/number with color-coded tier indicator.
 */

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  Users,
  Mic,
  Brain,
  Briefcase,
  Crown,
  Star,
  Award,
  Sparkles,
} from "lucide-react";

// Tier configuration
const TIER_CONFIG = {
  thought_leader: {
    label: "Thought Leader",
    color: "#8B5CF6", // Purple
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-500",
    icon: Crown,
    description: "Industry-recognized expert with significant influence",
  },
  influential: {
    label: "Influential",
    color: "#00E5CC", // Cyan
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    textColor: "text-cyan-500",
    icon: Star,
    description: "Strong presence and growing influence in their field",
  },
  established: {
    label: "Established",
    color: "#22C55E", // Green
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-500",
    icon: Award,
    description: "Solid professional presence with room for growth",
  },
  emerging: {
    label: "Emerging",
    color: "#F59E0B", // Warning/Yellow
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-500",
    icon: Sparkles,
    description: "Building their professional presence and influence",
  },
};

interface InfluenceBreakdown {
  social: number;
  thoughtLeadership: number;
  aiVisibility: number;
  career: number;
}

interface InfluenceScoreBadgeProps {
  score: number;
  tier?: "thought_leader" | "influential" | "established" | "emerging";
  breakdown?: InfluenceBreakdown;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getTierFromScore(score: number): "thought_leader" | "influential" | "established" | "emerging" {
  if (score >= 80) return "thought_leader";
  if (score >= 60) return "influential";
  if (score >= 40) return "established";
  return "emerging";
}

export function InfluenceScoreBadge({
  score,
  tier,
  breakdown,
  showBreakdown = false,
  size = "md",
  className,
}: InfluenceScoreBadgeProps) {
  const actualTier = tier || getTierFromScore(score);
  const config = TIER_CONFIG[actualTier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: "p-2",
      score: "text-xl",
      label: "text-xs",
      icon: "h-3 w-3",
    },
    md: {
      container: "p-3",
      score: "text-2xl",
      label: "text-sm",
      icon: "h-4 w-4",
    },
    lg: {
      container: "p-4",
      score: "text-3xl",
      label: "text-base",
      icon: "h-5 w-5",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "rounded-lg border",
              config.bgColor,
              config.borderColor,
              sizes.container,
              "cursor-default",
              className
            )}
          >
            <div className="flex items-center gap-2">
              {/* Score Circle */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: size === "lg" ? 64 : size === "md" ? 48 : 36,
                  height: size === "lg" ? 64 : size === "md" ? 48 : 36,
                }}
              >
                {/* Background ring */}
                <svg
                  className="absolute inset-0"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/20"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={config.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${score * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className={cn("font-bold", sizes.score, config.textColor)}>
                  {score}
                </span>
              </div>

              {/* Tier Label */}
              <div className="flex flex-col">
                <div className={cn("flex items-center gap-1", config.textColor)}>
                  <Icon className={sizes.icon} />
                  <span className={cn("font-medium", sizes.label)}>
                    {config.label}
                  </span>
                </div>
                {size !== "sm" && (
                  <span className="text-xs text-muted-foreground">
                    Influence Score
                  </span>
                )}
              </div>
            </div>

            {/* Breakdown (if shown) */}
            {showBreakdown && breakdown && size !== "sm" && (
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-4 gap-2">
                <BreakdownItem
                  icon={Users}
                  label="Social"
                  value={breakdown.social}
                  max={35}
                />
                <BreakdownItem
                  icon={Mic}
                  label="Thought"
                  value={breakdown.thoughtLeadership}
                  max={25}
                />
                <BreakdownItem
                  icon={Brain}
                  label="AI"
                  value={breakdown.aiVisibility}
                  max={20}
                />
                <BreakdownItem
                  icon={Briefcase}
                  label="Career"
                  value={breakdown.career}
                  max={20}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium">{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          {breakdown && (
            <div className="mt-2 text-xs">
              <p>Social: {breakdown.social}/35 • Thought Leadership: {breakdown.thoughtLeadership}/25</p>
              <p>AI Visibility: {breakdown.aiVisibility}/20 • Career: {breakdown.career}/20</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function BreakdownItem({
  icon: Icon,
  label,
  value,
  max,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  max: number;
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="text-center">
      <Icon className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
      <div className="text-xs font-medium">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="h-1 w-full bg-muted/20 rounded-full mt-1 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Compact inline badge for lists
interface InfluenceInlineBadgeProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function InfluenceInlineBadge({
  score,
  showLabel = true,
  className,
}: InfluenceInlineBadgeProps) {
  const tier = getTierFromScore(score);
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{score}</span>
      {showLabel && <span className="hidden sm:inline">• {config.label}</span>}
    </div>
  );
}
