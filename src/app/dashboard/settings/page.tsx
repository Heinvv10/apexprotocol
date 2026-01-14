import { Suspense } from "react";
import SettingsClient from "./settings-client";
import { SettingsErrorBoundary } from "@/components/settings/settings-error-boundary";

// Force dynamic rendering - this page requires authentication context
export const dynamic = "force-dynamic";

// Loading fallback component
function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/10 animate-pulse" />
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <div className="bg-card/50 border border-white/10 rounded-lg p-4">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-card/50 border border-white/10 rounded-lg p-6">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-8" />
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsClient />
    </Suspense>
  );
}
