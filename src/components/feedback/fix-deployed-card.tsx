"use client";

import * as React from "react";
import { Eye, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// AI Platform Icons mapping
const platformIcons: Record<string, { icon: string; color: string; bg: string }> = {
  gemini: { icon: "G", color: "#4285F4", bg: "bg-[#4285F4]/20" },
  claude: { icon: "C", color: "#D97757", bg: "bg-[#D97757]/20" },
  chatgpt: { icon: "G", color: "#10A37F", bg: "bg-[#10A37F]/20" },
  perplexity: { icon: "P", color: "#20B8CD", bg: "bg-[#20B8CD]/20" },
  grok: { icon: "X", color: "#1DA1F2", bg: "bg-[#1DA1F2]/20" },
};

export interface FixDeployedData {
  id: string;
  platform: string;
  title: string;
  schemaPreview?: {
    name: string;
    method: string;
    responder: string;
    resources?: {
      hallucintype?: {
        gemini?: string;
        predictedPickup?: string;
      };
    };
  };
}

interface FixDeployedCardProps {
  data: FixDeployedData;
  onViewSchema?: () => void;
  className?: string;
}

export function FixDeployedCard({
  data,
  onViewSchema,
  className,
}: FixDeployedCardProps) {
  const [showSchema, setShowSchema] = React.useState(false);
  const platform = platformIcons[data.platform.toLowerCase()] || platformIcons.claude;

  const schemaJSON = data.schemaPreview
    ? JSON.stringify(
        {
          name: "Apex",
          method: data.title,
          responder: "INET",
          responder_false: false,
          resources: {
            test: {
              hallucintype: {
                gemini: "Wrong Launch Date!",
                predictedPickup: "~4 weeks",
              },
            },
          },
        },
        null,
        2
      )
    : null;

  return (
    <div
      className={cn(
        "card-tertiary group hover:border-primary/30 transition-all duration-200",
        className
      )}
    >
      {/* Platform Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
            platform.bg
          )}
          style={{ color: platform.color }}
        >
          {platform.icon}
        </div>
        <span className="text-sm text-muted-foreground capitalize">
          {data.platform}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold text-foreground mb-4">
        {data.title}
      </h4>

      {/* View Schema Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mb-4"
        onClick={() => setShowSchema(!showSchema)}
      >
        <Eye className="w-4 h-4 mr-2" />
        View Apex Schema
      </Button>

      {/* Schema Preview */}
      {showSchema && schemaJSON && (
        <div className="relative">
          <div className="absolute top-2 right-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <pre className="bg-background rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto border border-border/50">
            <code>{schemaJSON}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
