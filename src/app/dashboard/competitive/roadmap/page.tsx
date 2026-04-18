"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  Rocket,
  Plus,
  Map,
} from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { useSelectedBrand } from "@/stores";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// Phase 9.2 Components
import {
  ImprovementRoadmap,
  RoadmapGenerator,
} from "@/components/competitive";

// Premium Gating
import { FeatureGate } from "@/components/premium";
import { useCurrentPlan } from "@/hooks/use-subscription";

// Types
interface Roadmap {
  id: string;
  brandId: string;
  title: string;
  description: string | null;
  targetCompetitor: string | null;
  targetPosition: "leader" | "top3" | "competitive";
  currentUnifiedScore: number;
  targetUnifiedScore: number;
  currentGrade: string;
  targetGrade: string;
  estimatedWeeks: number;
  status: "draft" | "active" | "paused" | "completed";
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface RoadmapListResponse {
  roadmaps: Roadmap[];
  activeRoadmap: Roadmap | null;
}

// API hooks
function useRoadmaps(brandId: string) {
  return useQuery({
    queryKey: ["competitive", "roadmaps", brandId],
    queryFn: async (): Promise<RoadmapListResponse> => {
      const res = await fetch(`/api/competitive/roadmap?brandId=${brandId}`);
      if (!res.ok) throw new Error("Failed to fetch roadmaps");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

// Select brand prompt
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Map className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to View Roadmap</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to view or generate an improvement roadmap.
          </p>
        </div>
        <Link href="/dashboard/brands">
          <Button variant="outline" size="lg" className="gap-2">
            Manage Brands
            <Target className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading improvement roadmap...</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Failed to Load Roadmap</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// Empty state for no roadmaps
function EmptyRoadmapState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-24 h-24">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />
          <div className="relative w-24 h-24 rounded-2xl bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
            <Rocket className="w-12 h-12 text-accent-purple" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Start Your Improvement Journey</h2>
          <p className="text-muted-foreground">
            Generate a personalized roadmap to improve your brand's visibility and beat competitors.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={onGenerate} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Generate Improvement Roadmap
          </Button>
          <p className="text-xs text-muted-foreground">
            Our AI will analyze your current scores and create a step-by-step plan
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function RoadmapPage() {
  const router = useRouter();
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id || "";
  const currentPlan = useCurrentPlan();

  const [showGenerator, setShowGenerator] = React.useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useRoadmaps(brandId);

  // Handle upgrade navigation
  const handleUpgrade = () => {
    router.push("/dashboard/settings?tab=billing");
  };

  // Handle roadmap generated
  const handleRoadmapGenerated = () => {
    setShowGenerator(false);
    refetch();
  };

  // Handle states
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/competitive">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <BrandHeader pageName="Improvement Roadmap" className="flex-1" />
        </div>
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/competitive">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <BrandHeader pageName="Improvement Roadmap" className="flex-1" />
        </div>
        <LoadingState />
        <DecorativeStar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/competitive">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <BrandHeader pageName="Improvement Roadmap" className="flex-1" />
        </div>
        <ErrorState error={error as Error} onRetry={() => refetch()} />
        <DecorativeStar />
      </div>
    );
  }

  const activeRoadmap = data?.activeRoadmap;
  const allRoadmaps = data?.roadmaps || [];

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/competitive">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <BrandHeader
          pageName="Improvement Roadmap"
          className="flex-1"
          rightSlot={activeRoadmap ? (
            <Button variant="outline" size="sm" onClick={() => setShowGenerator(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Roadmap
            </Button>
          ) : undefined}
        />
      </div>

      {/* Feature Gate for Roadmap */}
      <FeatureGate
        feature="improvement_roadmap"
        plan={currentPlan}
        mode="replace"
        onUpgrade={handleUpgrade}
      >
        {!activeRoadmap ? (
          <EmptyRoadmapState onGenerate={() => setShowGenerator(true)} />
        ) : (
          <ImprovementRoadmap
            brandId={brandId}
            brandName={selectedBrand.name}
            currentScore={activeRoadmap.currentUnifiedScore}
          />
        )}
      </FeatureGate>

      {/* Past Roadmaps Section */}
      {allRoadmaps.length > 1 && (
        <div className="card-secondary p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Past Roadmaps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoadmaps
              .filter((r) => r.id !== activeRoadmap?.id)
              .slice(0, 6)
              .map((roadmap) => (
                <RoadmapHistoryCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  onClick={() => {
                    // Could navigate to a specific roadmap view
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {/* Roadmap Generator Modal */}
      <RoadmapGenerator
        brandId={brandId}
        competitors={[]}
        currentScore={activeRoadmap?.currentUnifiedScore || 50}
        open={showGenerator}
        onOpenChange={setShowGenerator}
        onGenerated={handleRoadmapGenerated}
      />

      <DecorativeStar />
    </div>
  );
}

// Roadmap History Card
function RoadmapHistoryCard({
  roadmap,
  onClick,
}: {
  roadmap: Roadmap;
  onClick: () => void;
}) {
  const statusColors = {
    draft: "bg-muted/20 text-muted-foreground",
    active: "bg-primary/20 text-primary",
    paused: "bg-warning/20 text-warning",
    completed: "bg-success/20 text-success",
  };

  return (
    <button
      onClick={onClick}
      className="card-tertiary p-4 text-left hover:bg-white/5 transition-colors w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-foreground line-clamp-1">
          {roadmap.title}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[roadmap.status]}`}>
          {roadmap.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{roadmap.currentGrade} → {roadmap.targetGrade}</span>
        <span>{roadmap.progressPercentage}% complete</span>
      </div>
      <div className="mt-2 h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${roadmap.progressPercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Created {new Date(roadmap.createdAt).toLocaleDateString()}
      </p>
    </button>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientRoadmap)"
        />
        <defs>
          <linearGradient id="starGradientRoadmap" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--color-accent-purple))" stopOpacity="0.6"/>
            <stop offset="1" stopColor="hsl(var(--color-primary))" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Page Header Component
