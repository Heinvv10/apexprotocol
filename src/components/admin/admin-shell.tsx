"use client";

import * as React from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminShell({ children, title }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0a0f1a" }}>
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader title={title} />

        {/* Page Content - IMPROVED DENSITY */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#0a0f1a" }}>
          <div className="container mx-auto p-4 max-w-[1800px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
