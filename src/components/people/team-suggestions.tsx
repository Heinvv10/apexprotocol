"use client";

import * as React from "react";
import {
  Sparkles,
  UserPlus,
  Linkedin,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Types
interface TeamSuggestion {
  type: "missing_role" | "incomplete_profile" | "linkedin_candidate" | "high_influence";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionLabel: string;
  actionType: "add_role" | "enrich_profile" | "import_linkedin" | "discover";
  metadata?: {
    roleCategory?: string;
    personId?: string;
    linkedinUrl?: string;
    missingFields?: string[];
    influenceScore?: number;
  };
}

interface TeamCompletenessReport {
  score: number;
  totalRoles: number;
  filledRoles: number;
  missingRoles: string[];
  incompleteProfiles: number;
  suggestedActions: TeamSuggestion[];
}

interface TeamSuggestionsProps {
  brandId: string;
  onAddPerson?: () => void;
  onDiscoverTeam?: () => void;
  onEnrichProfile?: (personId: string) => void;
}

// API hooks
function useTeamCompleteness(brandId: string) {
  return useQuery({
    queryKey: ["team-completeness", brandId],
    queryFn: async (): Promise<TeamCompletenessReport> => {
      const res = await fetch(
        `/api/people/suggestions?brandId=${brandId}&type=completeness`
      );
      if (!res.ok) throw new Error("Failed to fetch team completeness");
      const data = await res.json();
      return data.data;
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useTeamSuggestions(brandId: string) {
  return useQuery({
    queryKey: ["team-suggestions", brandId],
    queryFn: async (): Promise<{ suggestions: TeamSuggestion[]; count: number }> => {
      const res = await fetch(
        `/api/people/suggestions?brandId=${brandId}&type=suggestions&maxSuggestions=5`
      );
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      return data.data;
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
  });
}

// Completeness Score Ring
function CompletenessRing({
  score,
  size = 80,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "#22C55E"; // success
    if (s >= 60) return "#00E5CC"; // primary
    if (s >= 40) return "#F59E0B"; // warning
    return "#EF4444"; // error
  };

  const getGrade = (s: number) => {
    if (s >= 90) return "A+";
    if (s >= 80) return "A";
    if (s >= 70) return "B";
    if (s >= 60) return "C";
    if (s >= 50) return "D";
    return "F";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color: getColor(score) }}>
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground">{getGrade(score)}</span>
      </div>
    </div>
  );
}

// Suggestion Card
function SuggestionCard({
  suggestion,
  onAction,
  isLoading,
}: {
  suggestion: TeamSuggestion;
  onAction: () => void;
  isLoading: boolean;
}) {
  const getIcon = () => {
    switch (suggestion.type) {
      case "missing_role":
        return <Briefcase className="w-4 h-4" />;
      case "incomplete_profile":
        return <UserCheck className="w-4 h-4" />;
      case "linkedin_candidate":
        return <Linkedin className="w-4 h-4" />;
      case "high_influence":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const priorityColors = {
    high: "bg-error/10 text-error border-error/30",
    medium: "bg-warning/10 text-warning border-warning/30",
    low: "bg-muted/20 text-muted-foreground border-muted/30",
  };

  const typeColors = {
    missing_role: "bg-accent-purple/10 text-accent-purple",
    incomplete_profile: "bg-warning/10 text-warning",
    linkedin_candidate: "bg-[#0A66C2]/10 text-[#0A66C2]",
    high_influence: "bg-success/10 text-success",
  };

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[suggestion.type]}`}
        >
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {suggestion.title}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${priorityColors[suggestion.priority]}`}
            >
              {suggestion.priority}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {suggestion.description}
          </p>
        </div>
        <button
          onClick={onAction}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            suggestion.actionLabel
          )}
        </button>
      </div>
    </div>
  );
}

// Main Component
export function TeamSuggestions({
  brandId,
  onAddPerson,
  onDiscoverTeam,
  onEnrichProfile,
}: TeamSuggestionsProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: completeness,
    isLoading: completenessLoading,
    error: completenessError,
    refetch: refetchCompleteness,
  } = useTeamCompleteness(brandId);

  const {
    data: suggestionsData,
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
  } = useTeamSuggestions(brandId);

  const handleAction = async (suggestion: TeamSuggestion) => {
    setActionLoading(suggestion.title);

    try {
      switch (suggestion.actionType) {
        case "add_role":
          onAddPerson?.();
          break;
        case "enrich_profile":
          if (suggestion.metadata?.personId) {
            onEnrichProfile?.(suggestion.metadata.personId);
          }
          break;
        case "discover":
          onDiscoverTeam?.();
          break;
        case "import_linkedin":
          onDiscoverTeam?.();
          break;
      }

      // Refresh data after action
      await Promise.all([refetchCompleteness(), refetchSuggestions()]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    refetchCompleteness();
    refetchSuggestions();
  };

  if (completenessLoading) {
    return (
      <div className="card-secondary p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (completenessError) {
    return (
      <div className="card-secondary p-6">
        <div className="flex items-center gap-3 text-error">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load team suggestions</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-xs text-primary hover:text-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const suggestions = suggestionsData?.suggestions || completeness?.suggestedActions || [];
  const hasHighPriority = suggestions.some((s) => s.priority === "high");

  return (
    <div className="card-secondary p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h3 className="text-lg font-semibold text-foreground">Team Suggestions</h3>
          {hasHighPriority && (
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Refresh suggestions"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Completeness Overview */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border/50">
            <CompletenessRing score={completeness?.score || 0} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Team Completeness</span>
                <span className="text-foreground font-medium">
                  {completeness?.score || 0}%
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {completeness?.filledRoles || 0}/{completeness?.totalRoles || 0} roles
                  </span>
                </div>
                {completeness?.incompleteProfiles !== undefined && completeness.incompleteProfiles > 0 && (
                  <div className="flex items-center gap-1 text-warning">
                    <AlertCircle className="w-3 h-3" />
                    <span>{completeness.incompleteProfiles} incomplete</span>
                  </div>
                )}
              </div>
              {completeness?.missingRoles && completeness.missingRoles.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="text-error">Missing: </span>
                  {completeness.missingRoles.slice(0, 3).join(", ")}
                  {completeness.missingRoles.length > 3 && (
                    <span> +{completeness.missingRoles.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <SuggestionCard
                  key={`${suggestion.type}-${i}`}
                  suggestion={suggestion}
                  onAction={() => handleAction(suggestion)}
                  isLoading={actionLoading === suggestion.title}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">
                Your team is well optimized!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No immediate suggestions at this time
              </p>
            </div>
          )}
        </>
      )}

      {/* Decorative gradient */}
      <div
        className="absolute top-0 right-0 w-40 h-40 opacity-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(139, 92, 246, 0.8), transparent)",
        }}
      />
    </div>
  );
}

// Export for direct use
export default TeamSuggestions;
