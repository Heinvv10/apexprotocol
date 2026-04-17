"use client";

import { ReactNode, useEffect } from "react";
import { DashboardShell } from "@/components/layout";

export default function LightDemoLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;

    // Force light theme by removing dark and adding light-theme
    const forceLight = () => {
      html.classList.remove('dark');
      html.classList.add('light-theme');
      // Also set the data-theme attribute to override next-themes
      html.setAttribute('data-theme', 'light');
      html.style.colorScheme = 'light';
    };

    // Apply immediately
    forceLight();

    // Watch for changes from ThemeProvider and force light theme back
    const observer = new MutationObserver(forceLight);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    return () => {
      observer.disconnect();
      html.classList.remove('light-theme');
      html.classList.add('dark');
      html.removeAttribute('data-theme');
      html.style.colorScheme = 'dark';
    };
  }, []);

  return (
    <div className="light-theme" data-theme="light" style={{ colorScheme: 'light' }}>
      <DashboardShell title="Light Theme Demo">
        {children}
      </DashboardShell>
    </div>
  );
}
