"use client";

import * as React from "react";
// ðŸŸ¢ WORKING: Using centralized formatters
import { cn, formatNumber } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// Platform brand colors and icons
const platformConfig = {
  chatgpt: {
    name: "ChatGPT",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.1)",
    borderColor: "rgba(16, 163, 127, 0.3)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    ),
  },
  claude: {
    name: "Claude",
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.1)",
    borderColor: "rgba(217, 119, 6, 0.3)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
  },
  gemini: {
    name: "Gemini",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.1)",
    borderColor: "rgba(66, 133, 244, 0.3)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  perplexity: {
    name: "Perplexity",
    color: "#20B2AA",
    bgColor: "rgba(32, 178, 170, 0.1)",
    borderColor: "rgba(32, 178, 170, 0.3)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  },
  grok: {
    name: "Grok",
    color: "#1DA1F2",
    bgColor: "rgba(29, 161, 242, 0.1)",
    borderColor: "rgba(29, 161, 242, 0.3)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  deepseek: {
    name: "DeepSeek",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.1)",
    borderColor: "rgba(124, 58, 237, 0.3)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4-8a4 4 0 1 1-4-4 4 4 0 0 1 4 4z" />
      </svg>
    ),
  },
};

export type PlatformId = keyof typeof platformConfig;

interface PlatformCardProps {
  platformId: PlatformId;
  enabled: boolean;
  connected: boolean;
  lastScan?: string;
  mentionCount?: number;
  onToggle: (platformId: PlatformId, enabled: boolean) => void;
  className?: string;
}

export function PlatformCard({
  platformId,
  enabled,
  connected,
  lastScan,
  mentionCount = 0,
  onToggle,
  className,
}: PlatformCardProps) {
  const platform = platformConfig[platformId];

  return (
    <div
      className={cn(
        "card-secondary transition-all duration-150 ease-in-out",
        enabled && "ring-2 ring-offset-2 ring-offset-background",
        className
      )}
      style={{
        borderColor: enabled ? platform.borderColor : undefined,
        boxShadow: enabled ? `0 0 20px ${platform.bgColor}` : undefined,
        // @ts-expect-error CSS custom property
        "--tw-ring-color": platform.color,
      }}
    >
      <div className="flex items-start justify-between">
        {/* Platform info */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-lg"
            style={{ backgroundColor: platform.bgColor, color: platform.color }}
          >
            {platform.icon}
          </div>
          <div>
            <h3 className="font-semibold">{platform.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {/* Connection status */}
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    connected ? "bg-success" : "bg-muted-foreground"
                  )}
                  style={{
                    boxShadow: connected ? "0 0 6px hsl(var(--success))" : undefined,
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle switch */}
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => onToggle(platformId, checked)}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-4">
          {/* Mention count */}
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: platform.color }}>
              {/* ðŸŸ¢ WORKING: Using centralized formatNumber */}
              {formatNumber(mentionCount)}
            </p>
            <p className="text-xs text-muted-foreground">Mentions</p>
          </div>
        </div>

        {/* Last scan */}
        {lastScan && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last scan</p>
            <p className="text-sm font-medium">{lastScan}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export platform config for use elsewhere
export { platformConfig };
