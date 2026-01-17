import { Suspense } from "react";
import { HelpClient } from "./help-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Loading fallback
function HelpLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card/50 border border-white/10 rounded-lg p-6">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-white/5 rounded animate-pulse" />
              <div className="h-4 bg-white/5 rounded animate-pulse" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<HelpLoading />}>
      <HelpClient />
    </Suspense>
  );
}
