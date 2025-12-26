"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPlatformCardProps {
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok";
  score: number;
  change?: number;
  mentions?: number;
  className?: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
}

const platformConfig = {
  chatgpt: {
    name: "ChatGPT",
    icon: "G",
    colorVar: "--ai-chatgpt",
    gradient: "from-[#10A37F] to-[#0D8B6A]",
  },
  claude: {
    name: "Claude",
    icon: "C",
    colorVar: "--ai-claude",
    gradient: "from-[#D97757] to-[#C46545]",
  },
  gemini: {
    name: "Gemini",
    icon: "G",
    colorVar: "--ai-gemini",
    gradient: "from-[#4285F4] to-[#3367D6]",
  },
  perplexity: {
    name: "Perplexity",
    icon: "P",
    colorVar: "--ai-perplexity",
    gradient: "from-[#20B8CD] to-[#1A9AAD]",
  },
  grok: {
    name: "Grok",
    icon: "X",
    colorVar: "--ai-grok",
    gradient: "from-[#1DA1F2] to-[#0D8BD9]",
  },
};

export function AIPlatformCard({
  platform,
  score,
  change = 0,
  mentions = 0,
  className,
  onClick,
  href,
  ariaLabel,
}: AIPlatformCardProps) {
  const config = platformConfig[platform];
  const [displayScore, setDisplayScore] = React.useState(0);

  React.useEffect(() => {
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendClass = () => {
    if (change > 0) return "trend-up";
    if (change < 0) return "trend-down";
    return "text-muted-foreground";
  };

  const isInteractive = !!(onClick || href);
  const cardClass = cn(
    "card-tertiary group hover:card-secondary transition-all duration-200",
    className
  );
  const interactiveClass = cn(
    cardClass,
    "focus-ring-primary cursor-pointer"
  );

  const cardContent = (
    <>
      {/* Platform Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br",
            config.gradient
          )}
        >
          {config.icon}
        </div>
        <span className="font-medium text-foreground">{config.name}</span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-foreground">{displayScore}%</span>
        <div className={cn("flex items-center gap-0.5 text-xs font-medium", getTrendClass())}>
          {getTrendIcon()}
          <span>{change > 0 ? "+" : ""}{change}%</span>
        </div>
      </div>

      {/* Mentions */}
      <p className="text-xs text-muted-foreground">
        {mentions.toLocaleString()} mentions this week
      </p>

      {/* Progress Bar */}
      <div className="mt-3 h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-[800ms] bg-gradient-to-r", config.gradient)}
          style={{ width: `${score}%` }}
        />
      </div>
    </>
  );

  // Interactive card with href (navigation)
  if (href) {
    return (
      <Link
        href={href}
        className={interactiveClass}
        aria-label={ariaLabel || `View ${config.name} details`}
      >
        {cardContent}
      </Link>
    );
  }

  // Interactive card with onClick (action)
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(interactiveClass, "text-left w-full")}
        aria-label={ariaLabel || `Select ${config.name}`}
      >
        {cardContent}
      </button>
    );
  }

  // Non-interactive card
  return (
    <div className={cardClass}>
      {cardContent}
    </div>
  );
}
