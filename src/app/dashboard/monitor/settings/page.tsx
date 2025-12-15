"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BrandConfigForm } from "@/components/monitor";
import { Button } from "@/components/ui/button";

// Brand config interface
interface BrandConfig {
  brandName: string;
  keywords: string[];
  competitors: string[];
}

export default function MonitorSettingsPage() {
  // TODO: Fetch brand config from API endpoint
  // const { data: brandConfig } = useQuery(['brandConfig'], fetchBrandConfig);
  const [brandConfig] = React.useState<BrandConfig | undefined>(undefined); // No initial data - loaded from API

  const handleSubmit = async (data: {
    brandName: string;
    keywords: string[];
    competitors: string[];
  }) => {
    // TODO: Implement API call to save brand config
    // await saveBrandConfig(data);
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
        <BrandConfigForm initialData={brandConfig} onSubmit={handleSubmit} />
      </div>

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
