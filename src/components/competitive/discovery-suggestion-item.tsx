"use client";

import * as React from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  MessageSquare,
  Building,
  Loader2,
  Link as LinkIcon,
  Hash,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface DiscoveredCompetitor {
  id: string;
  competitorName: string;
  competitorDomain: string | null;
  discoveryMethod: "keyword_overlap" | "ai_co_occurrence" | "industry_match" | "search_overlap" | "manual";
  confidenceScore: number;
  keywordOverlap: number | null;
  aiCoOccurrence: number | null;
  industryMatch: boolean | null;
  sharedKeywords: string[];
  coOccurrenceQueries: string[];
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}

interface DiscoverySuggestionItemProps {
  discovery: DiscoveredCompetitor;
  onConfirm: () => void;
  onReject: (reason?: string) => void;
}

// Discovery method labels and icons
const methodInfo = {
  keyword_overlap: {
    label: "Keyword Match",
    icon: Hash,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    description: "Shares significant keyword overlap with your brand",
  },
  ai_co_occurrence: {
    label: "AI Co-mention",
    icon: MessageSquare,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    description: "Frequently mentioned alongside your brand in AI responses",
  },
  industry_match: {
    label: "Industry Match",
    icon: Building,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    description: "Operates in the same industry and market segment",
  },
  search_overlap: {
    label: "Search Overlap",
    icon: Search,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    description: "Competes for similar search queries",
  },
  manual: {
    label: "Manual",
    icon: LinkIcon,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    description: "Manually identified competitor",
  },
};

// Confidence badge
function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 70) return "text-success bg-success/10 border-success/30";
    if (percentage >= 50) return "text-warning bg-warning/10 border-warning/30";
    return "text-muted-foreground bg-muted/10 border-muted/30";
  };

  return (
    <span className={cn(
      "px-2 py-0.5 text-xs font-medium rounded-full border",
      getColor()
    )}>
      {percentage}% confidence
    </span>
  );
}

export function DiscoverySuggestionItem({
  discovery,
  onConfirm,
  onReject,
}: DiscoverySuggestionItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);

  const method = methodInfo[discovery.discoveryMethod];
  const MethodIcon = method.icon;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="card-tertiary overflow-hidden">
      {/* Main row */}
      <div className="p-3 flex items-center gap-3">
        {/* Logo placeholder */}
        <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center text-lg font-bold text-foreground flex-shrink-0">
          {discovery.competitorName.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {discovery.competitorName}
            </span>
            <ConfidenceBadge score={discovery.confidenceScore} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {discovery.competitorDomain && (
              <a
                href={`https://${discovery.competitorDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                {discovery.competitorDomain}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              method.bg,
              method.color
            )}>
              <MethodIcon className="w-3 h-3" />
              {method.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={isConfirming || isRejecting}
            className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
            title="Add to competitors"
          >
            {isConfirming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleReject}
            disabled={isConfirming || isRejecting}
            className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
            title="Not a competitor"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Show details"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border/20 mt-0">
          <div className="pt-3 space-y-3">
            {/* Discovery reason */}
            <div className="text-xs text-muted-foreground">
              <span className={method.color}>{method.description}</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              {discovery.keywordOverlap !== null && discovery.keywordOverlap > 0 && (
                <div className="p-2 rounded-lg bg-blue-400/5 border border-blue-400/20">
                  <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1">
                    Keyword Overlap
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {Math.round(discovery.keywordOverlap * 100)}%
                  </div>
                </div>
              )}
              {discovery.aiCoOccurrence !== null && discovery.aiCoOccurrence > 0 && (
                <div className="p-2 rounded-lg bg-purple-400/5 border border-purple-400/20">
                  <div className="text-[10px] text-purple-400 uppercase tracking-wide mb-1">
                    Co-occurrence Rate
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {Math.round(discovery.aiCoOccurrence * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* Shared keywords */}
            {discovery.sharedKeywords.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
                  Shared Keywords
                </div>
                <div className="flex flex-wrap gap-1">
                  {discovery.sharedKeywords.slice(0, 8).map((keyword, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-muted/30 text-muted-foreground"
                    >
                      {keyword}
                    </span>
                  ))}
                  {discovery.sharedKeywords.length > 8 && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted/30 text-muted-foreground">
                      +{discovery.sharedKeywords.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Co-occurrence queries */}
            {discovery.coOccurrenceQueries.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
                  Mentioned Together In
                </div>
                <div className="space-y-1">
                  {discovery.coOccurrenceQueries.slice(0, 3).map((query, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Quote className="w-3 h-3 mt-0.5 text-purple-400 flex-shrink-0" />
                      <span className="line-clamp-1">{query}</span>
                    </div>
                  ))}
                  {discovery.coOccurrenceQueries.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-5">
                      +{discovery.coOccurrenceQueries.length - 3} more queries
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
