"use client";

import * as React from "react";
import { ArrowLeft, Loader2, AlertCircle, Building2 } from "lucide-react";
import Link from "next/link";
import { BrandConfigForm } from "@/components/monitor";
import { Button } from "@/components/ui/button";
import { useBrandConfig, useSaveBrandConfig } from "@/hooks/useMonitor";
import { useSelectedBrand } from "@/stores";

// Loading state component
function SettingsLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading brand configuration...</p>
      </div>
    </div>
  );
}

// Error state component
function SettingsErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <div>
          <p className="text-destructive font-medium">Failed to load brand configuration</p>
          <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

// No brand selected state
function NoBrandSelectedState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
        <div>
          <p className="font-medium">No brand selected</p>
          <p className="text-muted-foreground text-sm mt-1">
            Please select a brand from the Monitor dashboard to configure its settings.
          </p>
        </div>
        <Link href="/dashboard/monitor">
          <Button variant="outline">Go to Monitor Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default function MonitorSettingsPage() {
  const selectedBrand = useSelectedBrand();

  // Fetch brand config from API
  const { data: brandConfig, isLoading, error, refetch } = useBrandConfig(selectedBrand?.id || "");
  const saveBrandConfig = useSaveBrandConfig();

  // Transform API data to form format
  const formData = React.useMemo(() => {
    if (!brandConfig) return undefined;
    return {
      brandName: brandConfig.name,
      keywords: brandConfig.keywords || [],
      competitors: brandConfig.competitors || [],
    };
  }, [brandConfig]);

  const handleSubmit = async (data: {
    brandName: string;
    keywords: string[];
    competitors: string[];
  }) => {
    if (!selectedBrand?.id) return;

    await saveBrandConfig.mutateAsync({
      id: selectedBrand.id,
      name: data.brandName,
      keywords: data.keywords,
      competitors: data.competitors,
      trackingEnabled: brandConfig?.trackingEnabled ?? true,
      alertsEnabled: brandConfig?.alertsEnabled ?? true,
      platforms: brandConfig?.platforms || [],
    });
  };

  // Render appropriate content based on state
  const renderContent = () => {
    if (!selectedBrand?.id) {
      return <NoBrandSelectedState />;
    }
    if (isLoading) {
      return <SettingsLoadingState />;
    }
    if (error) {
      return <SettingsErrorState error={error as Error} onRetry={() => refetch()} />;
    }
    return <BrandConfigForm initialData={formData} onSubmit={handleSubmit} />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/monitor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brand Configuration</h2>
          <p className="text-muted-foreground">
            Configure your brand details for AI platform monitoring
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card-secondary max-w-2xl">
        {renderContent()}
      </div>

      {/* Save Error Feedback */}
      {saveBrandConfig.isError && (
        <div className="max-w-2xl bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Failed to save configuration</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {saveBrandConfig.error?.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="card-tertiary max-w-2xl">
        <h3 className="font-semibold mb-3">How Brand Monitoring Works</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            Your brand name and keywords are used to find mentions across AI platforms
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            Competitors help benchmark your AI visibility against industry rivals
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            Monitoring runs automatically every 2 hours on enabled platforms
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            Results are analyzed for sentiment and context quality
          </li>
        </ul>
      </div>
    </div>
  );
}
