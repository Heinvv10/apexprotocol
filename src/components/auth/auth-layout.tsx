"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full flex items-center justify-center",
        "bg-background relative overflow-hidden",
        className
      )}
    >
      {/* Background gradient pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[128px]" />
        {/* Secondary gradient orb */}
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent-pink/15 rounded-full blur-[128px]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}

// Brand logo component for auth pages
export function AuthLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Logo mark */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center">
        <span className="text-2xl font-bold text-white">A</span>
      </div>
      {/* Logo text */}
      <h1 className="text-2xl font-bold tracking-tight">
        <span className="text-foreground">Apex</span>
      </h1>
      <p className="text-sm text-muted-foreground">AI Visibility Platform</p>
    </div>
  );
}
