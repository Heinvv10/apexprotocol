"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SupabaseAuthSync as AuthSync } from "@/components/providers/supabase-auth-sync";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/command-palette";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // NFR-UX-001: Global ⌘K / Ctrl+K command palette. Mounted once at shell
  // level so every dashboard route shares one instance + one keyboard hook.
  const palette = useCommandPalette();

  return (
    <div className="flex h-screen overflow-hidden dashboard-bg">
      <AuthSync />
      <CommandPalette isOpen={palette.isOpen} onClose={palette.close} />
      {/* Skip Navigation Links - WCAG 2.4.1 Bypass Blocks */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#primary-navigation" className="skip-link">
          Skip to navigation
        </a>
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header title={title} />

        {/* Page Content - IMPROVED DENSITY */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 max-w-[1800px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
