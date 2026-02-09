"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ResponseViewerProps {
  platform: string;
  baselineResponse: string | null;
  enrichedResponse: string | null;
  brandName?: string;
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

function highlightBrand(text: string, brandName?: string) {
  if (!brandName || !text) return text;

  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const splitRegex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(splitRegex);

  return parts.map((part, i) =>
    part.toLowerCase() === brandName.toLowerCase() ? (
      <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ResponseViewer({
  platform,
  baselineResponse,
  enrichedResponse,
  brandName,
}: ResponseViewerProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="card-tertiary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-medium">
          {platformLabels[platform] || platform} - AI Responses
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {/* Baseline */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Baseline Response
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-foreground/80 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {baselineResponse
                ? highlightBrand(baselineResponse, brandName)
                : <span className="text-muted-foreground italic">No response</span>}
            </div>
          </div>

          {/* Enriched */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-primary uppercase tracking-wider">
              Enriched Response (with draft content)
            </div>
            <div className="p-3 rounded-lg bg-primary/[0.02] border border-primary/10 text-sm text-foreground/80 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {enrichedResponse
                ? highlightBrand(enrichedResponse, brandName)
                : <span className="text-muted-foreground italic">No response</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
