"use client";

import Link from "next/link";

interface PageHeaderProps {
  pageName: string;
  currentPage: string;
}

export function PageHeader({ pageName, currentPage }: PageHeaderProps) {
  const navItems = [
    { label: "Orbit", href: "/dashboard" },
    { label: "Monitor", href: "/dashboard/monitor" },
    { label: "Feedback", href: "/dashboard/feedback" },
    { label: "Engines", href: "/dashboard/engine-room" },
    { label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="apex-logo-icon w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGrad)" />
            <defs>
              <linearGradient id="apexGrad" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-white ml-1">{pageName}</span>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              item.href === currentPage || item.label.toLowerCase() === pageName.toLowerCase()
                ? "text-sm text-cyan-400 font-medium relative"
                : "text-sm text-slate-400 hover:text-white transition-colors"
            }
          >
            {item.label}
            {(item.href === currentPage || item.label.toLowerCase() === pageName.toLowerCase()) && (
              <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      {/* AI Status */}
      <div className="ai-status-indicator">
        <span className="ai-status-dot active" />
        <span className="text-xs text-slate-400">AI Status:</span>
        <span className="text-xs text-cyan-400 font-medium">Active</span>
      </div>
    </div>
  );
}
