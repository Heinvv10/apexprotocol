"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /admin/analytics/sales to /admin/analytics/sales-analytics
 */
export default function AnalyticsSalesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/analytics/sales-analytics");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400" />
        <p className="text-muted-foreground">Redirecting to Sales Analytics...</p>
      </div>
    </div>
  );
}
