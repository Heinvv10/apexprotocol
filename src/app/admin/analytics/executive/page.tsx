"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /admin/analytics/executive to /admin/analytics/executive-dashboard
 */
export default function AnalyticsExecutiveRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/analytics/executive-dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400" />
        <p className="text-muted-foreground">Redirecting to Executive Dashboard...</p>
      </div>
    </div>
  );
}
