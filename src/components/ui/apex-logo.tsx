"use client";

/**
 * Brand Logo Component
 *
 * The radar mark below is Apex-specific. For white-label tenants that
 * ship their own logo SVG via `public/brands/<slug>/logo.svg`, use the
 * `logoUrl` field from brand-presets.ts to render an <img>.
 *
 * The wordmark reads `name` + optional `wordmarkSuffix` from the active
 * brand preset and colours the suffix with --color-primary.
 */

import { getActiveBrand } from "@/config/brand-presets";

interface ApexLogoProps {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  layout?: "horizontal" | "stacked";
  className?: string;
}

export function ApexLogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = `radar-${Math.random().toString(36).substr(2, 6)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ApexGEO logo mark"
    >
      <defs>
        {/* Outer ring glow */}
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Sweep gradient */}
        <radialGradient id={`${id}-sweep`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00E5CC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00E5CC" stopOpacity="0" />
        </radialGradient>
        {/* Inner dim ring gradient */}
        <linearGradient id={`${id}-ring2`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5CC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Outer ring — bright cyan */}
      <circle
        cx="32" cy="32" r="28"
        stroke="#00E5CC"
        strokeWidth="1.5"
        fill="none"
        filter={`url(#${id}-glow)`}
        opacity="0.9"
      />

      {/* Middle ring — dim */}
      <circle
        cx="32" cy="32" r="19"
        stroke="#00E5CC"
        strokeWidth="0.8"
        fill="none"
        opacity="0.35"
      />

      {/* Inner ring — dimmer */}
      <circle
        cx="32" cy="32" r="11"
        stroke="#00E5CC"
        strokeWidth="0.6"
        fill="none"
        opacity="0.2"
      />

      {/* Radar sweep wedge — top-right quadrant */}
      <path
        d="M32 32 L50 14 A25 25 0 0 0 32 7 Z"
        fill="#00E5CC"
        opacity="0.12"
      />
      {/* Sweep line */}
      <line
        x1="32" y1="32"
        x2="52" y2="12"
        stroke="#00E5CC"
        strokeWidth="1"
        opacity="0.7"
        filter={`url(#${id}-glow)`}
      />

      {/* Target dots on outer ring — compass points */}
      {/* Top */}
      <circle cx="32" cy="4" r="2.5" fill="#00E5CC" filter={`url(#${id}-glow)`} />
      {/* Right */}
      <circle cx="60" cy="32" r="2.5" fill="#8B5CF6" filter={`url(#${id}-glow)`} />
      {/* Bottom */}
      <circle cx="32" cy="60" r="2.5" fill="#3B82F6" filter={`url(#${id}-glow)`} />
      {/* Left */}
      <circle cx="4" cy="32" r="2.5" fill="#00E5CC" opacity="0.7" filter={`url(#${id}-glow)`} />

      {/* Detected target — mid-ring, upper right */}
      <circle cx="46" cy="18" r="1.8" fill="#FFFFFF" opacity="0.9" filter={`url(#${id}-glow)`} />

      {/* Centre crosshair node */}
      <circle cx="32" cy="32" r="3.5" fill="#00E5CC" filter={`url(#${id}-glow)`} />
      <circle cx="32" cy="32" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export function ApexWordmark({ className = "" }: { className?: string }) {
  const brand = getActiveBrand();

  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-white">{brand.name}</span>
      {brand.wordmarkSuffix && (
        <span style={{ color: "hsl(var(--color-primary))" }}>
          {brand.wordmarkSuffix}
        </span>
      )}
    </span>
  );
}

export function ApexLogo({
  size = 32,
  showWordmark = true,
  showTagline = false,
  layout = "horizontal",
  className = "",
}: ApexLogoProps) {
  if (layout === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <ApexLogoMark size={size} />
        {showWordmark && (
          <div className="flex flex-col items-center">
            <ApexWordmark className="text-xl" />
            {showTagline && (
              <span className="text-xs text-slate-400 mt-0.5">AI Visibility Platform</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ApexLogoMark size={size} />
      {showWordmark && (
        <div className="flex flex-col">
          <ApexWordmark className="text-lg leading-tight" />
          {showTagline && (
            <span className="text-xs text-slate-400 leading-tight">AI Visibility Platform</span>
          )}
        </div>
      )}
    </div>
  );
}

export default ApexLogo;
