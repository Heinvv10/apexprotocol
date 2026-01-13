import { Suspense } from "react";
import NewBrandClient from "./new-brand-client";

// Force dynamic rendering - this page uses React Hook Form which requires client-side context
export const dynamic = "force-dynamic";

// Loading fallback component
function NewBrandLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white/10 rounded animate-pulse" />
          <div>
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-72 bg-white/5 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>

      {/* Form card skeleton */}
      <div className="bg-card/50 border border-white/10 rounded-lg p-6">
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-10 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-64 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Helper card skeleton */}
      <div className="bg-card/30 border border-white/5 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
            <div className="space-y-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBrandPage() {
  return (
    <Suspense fallback={<NewBrandLoading />}>
      <NewBrandClient />
    </Suspense>
  );
}
