"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getActionGuide } from "@/lib/competitive/action-guides";

interface ActionItemCardProps {
  id: string;
  title: string;
  isCompleted: boolean;
  disabled?: boolean;
  onToggle?: (completed: boolean) => void;
}

/**
 * Action item row with an expandable "How to do this" drawer. Guide
 * content lives in src/lib/competitive/action-guides.ts keyed by exact
 * action title — when we have a guide for this action, the caret expand
 * toggle appears; otherwise only the checkbox + title render.
 */
export function ActionItemCard({
  title,
  isCompleted,
  disabled,
  onToggle,
}: ActionItemCardProps) {
  const guide = getActionGuide(title);
  const [open, setOpen] = React.useState(false);
  const hasGuide = guide !== null;

  return (
    <div
      className={cn(
        "rounded-md border transition-colors",
        open
          ? "border-primary/30 bg-primary/[0.03]"
          : "border-transparent hover:border-border/50",
      )}
    >
      <div className="flex items-start gap-3 px-2 py-1.5">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(e) => onToggle?.(e.target.checked)}
          disabled={disabled}
          className="mt-1 w-4 h-4 rounded border-border bg-muted/30 text-primary focus:ring-primary/50 cursor-pointer"
          aria-label={`Mark "${title}" complete`}
        />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => hasGuide && setOpen((v) => !v)}
            disabled={!hasGuide}
            className={cn(
              "text-left w-full flex items-center justify-between gap-2",
              hasGuide && "cursor-pointer",
            )}
          >
            <span
              className={cn(
                "text-sm transition-colors",
                isCompleted
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {title}
            </span>
            {hasGuide && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                {guide.tool && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                    <Sparkles className="h-3 w-3" />
                    Apex tool
                  </span>
                )}
                {guide.estMinutes !== undefined && (
                  <span className="flex items-center gap-1 text-[10px]">
                    <Clock className="h-3 w-3" />
                    {guide.estMinutes}m
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </span>
            )}
          </button>
        </div>
      </div>

      {open && guide && (
        <div className="pl-9 pr-3 pb-3 space-y-3 text-xs">
          {/* Why it matters */}
          <div className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Why it matters: </span>
            {guide.why}
          </div>

          {/* Steps */}
          <div>
            <div className="font-medium text-foreground mb-1.5">How to do it</div>
            <ol className="list-decimal list-outside pl-4 space-y-1 text-muted-foreground leading-relaxed">
              {guide.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Apex tool CTA */}
          {guide.tool && (
            <Link
              href={guide.tool.href}
              className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              title={guide.tool.description}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {guide.tool.cta}
            </Link>
          )}

          {/* External resources */}
          {guide.resources && guide.resources.length > 0 && (
            <div>
              <div className="font-medium text-foreground mb-1">External tools</div>
              <ul className="space-y-1">
                {guide.resources.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {r.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {r.note && (
                      <span className="text-muted-foreground"> — {r.note}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
