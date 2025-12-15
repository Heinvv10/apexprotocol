"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueryRow {
  id: string;
  query: string;
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok";
  sentiment: "positive" | "neutral" | "negative";
  citationStatus: "cited" | "mentioned" | "not_cited";
  timestamp: string;
  response?: string;
  url?: string;
  confidence?: number;
  competitors?: string[];
}

interface SmartTableProps {
  data: QueryRow[];
  onRowClick?: (row: QueryRow) => void;
  className?: string;
}

// AI Engine icons - SVG representations
const AIEngineIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, React.ReactNode> = {
    chatgpt: (
      <div className="w-8 h-8 rounded-lg bg-[#10A37F]/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#10A37F]" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
        </svg>
      </div>
    ),
    claude: (
      <div className="w-8 h-8 rounded-lg bg-[#D97757]/20 flex items-center justify-center">
        <span className="text-[#D97757] font-bold text-sm">AI</span>
      </div>
    ),
    gemini: (
      <div className="w-8 h-8 rounded-lg bg-[#4285F4]/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4285F4"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4285F4" strokeWidth="2"/>
        </svg>
      </div>
    ),
    perplexity: (
      <div className="w-8 h-8 rounded-lg bg-[#20B8CD]/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#20B8CD]" fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
    ),
    grok: (
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
        <span className="text-white font-bold text-sm">X</span>
      </div>
    ),
  };
  return icons[platform] || icons.chatgpt;
};

// Citation badge component matching reference design
const CitationBadge = ({ status }: { status: "cited" | "mentioned" | "not_cited" }) => {
  const config = {
    cited: {
      label: "Primary Citation",
      className: "bg-gradient-to-r from-[hsl(var(--warning))] to-[hsl(var(--warning-muted))] text-white",
    },
    mentioned: {
      label: "Mentioned",
      className: "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]",
    },
    not_cited: {
      label: "Omitted",
      className: "bg-[hsl(var(--error)/0.2)] text-[hsl(var(--error))] border border-[hsl(var(--error)/0.3)]",
    },
  };
  const { label, className } = config[status];
  return (
    <span className={cn("text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap", className)}>
      {label}
    </span>
  );
};

// Speedometer gauge component matching reference design
const SpeedometerGauge = ({ value, sentiment }: { value: number; sentiment: string }) => {
  // Calculate the rotation angle for the needle (-90 to 90 degrees)
  const angle = -90 + (value / 100) * 180;

  // Color based on sentiment
  const gaugeColor = sentiment === "positive" ? "#17CA29" : sentiment === "neutral" ? "#FFB020" : "#D4292A";

  return (
    <div className="relative w-24 h-16 flex-shrink-0">
      <svg viewBox="0 0 100 60" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored arc based on value */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 126} 126`}
          className="transition-all duration-[800ms]"
        />
        {/* Center dot */}
        <circle cx="50" cy="55" r="4" fill={gaugeColor} />
        {/* Needle */}
        <line
          x1="50"
          y1="55"
          x2="50"
          y2="20"
          stroke={gaugeColor}
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${angle} 50 55)`}
          className="transition-all duration-[800ms]"
        />
        {/* Glow effect */}
        <circle cx="50" cy="55" r="3" fill={gaugeColor} className="animate-pulse" style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }} />
      </svg>
    </div>
  );
};

// Sentiment badge component
const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const config = {
    positive: { label: "Highly Positive", className: "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]" },
    neutral: { label: "Neutral", className: "bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]" },
    negative: { label: "Negative", className: "bg-[hsl(var(--error)/0.2)] text-[hsl(var(--error))]" },
  };
  const { label, className } = config[sentiment as keyof typeof config] || config.neutral;
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded font-medium", className)}>
      {label}
    </span>
  );
};

export function SmartTable({ data, className }: SmartTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const platformNames: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    grok: "Grok",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Table Header - Matching reference */}
      <div className="smart-table-header-v2 flex items-center px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="w-8" />
        <div className="flex-1 min-w-[200px]">Query</div>
        <div className="w-36 text-center">Citation</div>
        <div className="w-32 text-center">Leading engine</div>
        <div className="w-28 text-right">Time</div>
      </div>

      {/* Table Body */}
      <div className="space-y-2">
        {data.map((row) => {
          const isExpanded = expandedRows.has(row.id);

          return (
            <div key={row.id} className="monitor-row-card">
              {/* Main Row */}
              <div
                className={cn(
                  "monitor-row flex items-center px-4 py-3 cursor-pointer transition-all",
                  isExpanded && "monitor-row-expanded"
                )}
                onClick={() => toggleRow(row.id)}
              >
                {/* Expand Toggle */}
                <div className="w-8 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Query */}
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-foreground">
                    {row.query}
                  </p>
                </div>

                {/* Citation Badge */}
                <div className="w-36 flex justify-center">
                  <CitationBadge status={row.citationStatus} />
                </div>

                {/* Leading Engine */}
                <div className="w-32 flex items-center justify-center gap-2">
                  <AIEngineIcon platform={row.platform} />
                  <span className="text-sm text-muted-foreground">{platformNames[row.platform]}</span>
                </div>

                {/* Timestamp */}
                <div className="w-28 text-right text-sm text-muted-foreground">
                  {row.timestamp}
                </div>
              </div>

              {/* Expanded Content - Two Column Layout matching reference exactly */}
              {isExpanded && (
                <div className="monitor-expanded-content">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    {/* Left Column - AI Output with cyan border */}
                    <div className="monitor-ai-output">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">AI Output</h4>
                        <button className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      {row.response && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          ...<span className="text-cyan-400 font-medium">Apex</span> {row.response.replace(/your platform/gi, '').replace(/Apex/gi, '').trim()}
                        </p>
                      )}
                    </div>

                    {/* Right Column - Apex Analysis with speedometer */}
                    <div className="monitor-apex-analysis">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">Apex Analysis</h4>
                        <SentimentBadge sentiment={row.sentiment} />
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Speedometer Gauge */}
                        <SpeedometerGauge value={row.confidence || 75} sentiment={row.sentiment} />

                        {/* Analysis Text */}
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {row.citationStatus === 'cited'
                              ? `${platformNames[row.platform]} cited your "${row.query.split(' ').slice(0, 3).join(' ')}..." page as the definitive source.`
                              : row.citationStatus === 'mentioned'
                              ? `Your brand was mentioned in the ${platformNames[row.platform]} response.`
                              : `Your brand was not included in this ${platformNames[row.platform]} response.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">No queries match your filters</p>
        </div>
      )}
    </div>
  );
}
