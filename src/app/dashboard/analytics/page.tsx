"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PredictiveChart, PredictiveDataPoint } from "@/components/analytics/PredictiveChart";
import { ConfidenceIndicator } from "@/components/analytics/ConfidenceIndicator";
import { EmergingOpportunities } from "@/components/analytics/EmergingOpportunities";

// Sample data for testing the PredictiveChart component
const sampleData: PredictiveDataPoint[] = [
  // Historical data (Jan-Jun)
  { month: "Jan", actual: 65, isPrediction: false },
  { month: "Feb", actual: 68, isPrediction: false },
  { month: "Mar", actual: 72, isPrediction: false },
  { month: "Apr", actual: 70, isPrediction: false },
  { month: "May", actual: 75, isPrediction: false },
  { month: "Jun", actual: 78, isPrediction: false },

  // Forecast data (Jul-Dec) with confidence bands
  {
    month: "Jul",
    predicted: 80,
    confidenceLower: 75,
    confidenceUpper: 85,
    isPrediction: true,
  },
  {
    month: "Aug",
    predicted: 82,
    confidenceLower: 76,
    confidenceUpper: 88,
    isPrediction: true,
  },
  {
    month: "Sep",
    predicted: 85,
    confidenceLower: 78,
    confidenceUpper: 92,
    isPrediction: true,
  },
  {
    month: "Oct",
    predicted: 87,
    confidenceLower: 79,
    confidenceUpper: 95,
    isPrediction: true,
  },
  {
    month: "Nov",
    predicted: 89,
    confidenceLower: 80,
    confidenceUpper: 98,
    isPrediction: true,
  },
  {
    month: "Dec",
    predicted: 92,
    confidenceLower: 82,
    confidenceUpper: 102,
    isPrediction: true,
  },
];

export default function AnalyticsPage() {
  const [showConfidence, setShowConfidence] = React.useState(true);
  const [showLegend, setShowLegend] = React.useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Predictive Analytics Demo
            </h2>
            <p className="text-muted-foreground text-sm">
              Testing PredictiveChart component with sample data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfidence(!showConfidence)}
          >
            {showConfidence ? "Hide" : "Show"} Confidence Bands
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLegend(!showLegend)}
          >
            {showLegend ? "Hide" : "Show"} Legend
          </Button>
        </div>
      </div>

      {/* Main Predictive Chart */}
      <PredictiveChart
        data={sampleData}
        title="GEO Score Forecast"
        description="6-month historical data with 6-month prediction"
        showConfidenceBands={showConfidence}
        showLegend={showLegend}
        height={450}
      />

      {/* Additional examples */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Loading state */}
        <PredictiveChart
          title="Loading State Example"
          description="Component in loading state"
          isLoading={true}
          height={300}
        />

        {/* Empty state */}
        <PredictiveChart
          data={[]}
          title="Empty State Example"
          description="Component with no data"
          height={300}
        />
      </div>

      {/* Error state */}
      <PredictiveChart
        title="Error State Example"
        description="Component in error state"
        isError={true}
        error={new Error("Failed to fetch predictive data")}
        height={300}
      />

      {/* Emerging Opportunities Component */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Emerging Opportunities Component
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Testing EmergingOpportunities component with sample brand
        </p>

        {/* Empty state - no brandId */}
        <EmergingOpportunities />

        {/* With brandId (will fetch from API) */}
        {/* Uncomment to test with real data:
        <EmergingOpportunities brandId="your-brand-id" />
        */}
      </div>

      {/* Confidence Indicator Examples */}
      <div className="card-secondary">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Confidence Indicator Examples
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Testing ConfidenceIndicator component with different confidence levels
        </p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* High confidence (>80%) - Green */}
          <div className="flex flex-col items-center gap-2">
            <ConfidenceIndicator
              confidence={0.92}
              explanation="High confidence prediction based on strong historical patterns and stable trends. The model has identified consistent upward trajectory with minimal variance."
            />
            <p className="text-xs text-center text-muted-foreground">
              High Confidence (92%)
            </p>
          </div>

          {/* Medium-high confidence (75%) - Yellow */}
          <div className="flex flex-col items-center gap-2">
            <ConfidenceIndicator
              confidence={0.75}
              explanation="Medium confidence prediction. Some variability in historical data but overall trend is clear. Consider this forecast with moderate certainty."
            />
            <p className="text-xs text-center text-muted-foreground">
              Medium Confidence (75%)
            </p>
          </div>

          {/* Low confidence (60%) - Red */}
          <div className="flex flex-col items-center gap-2">
            <ConfidenceIndicator
              confidence={0.60}
              explanation="Low confidence prediction due to limited historical data and high variability. Use this forecast as a rough estimate only and consider gathering more data."
            />
            <p className="text-xs text-center text-muted-foreground">
              Low Confidence (60%)
            </p>
          </div>

          {/* Edge case - 70% threshold */}
          <div className="flex flex-col items-center gap-2">
            <ConfidenceIndicator
              confidence={0.70}
              explanation="Confidence at threshold level. The prediction meets minimum reliability standards but should be monitored closely."
            />
            <p className="text-xs text-center text-muted-foreground">
              Threshold (70%)
            </p>
          </div>
        </div>

        {/* Different sizes */}
        <div className="mt-8 pt-8 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-4">Size Variants</h4>
          <div className="flex items-end gap-8 justify-center">
            <div className="flex flex-col items-center gap-2">
              <ConfidenceIndicator
                confidence={0.85}
                size="sm"
                explanation="Small size indicator"
              />
              <p className="text-xs text-muted-foreground">Small</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ConfidenceIndicator
                confidence={0.85}
                size="md"
                explanation="Medium size indicator"
              />
              <p className="text-xs text-muted-foreground">Medium (Default)</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ConfidenceIndicator
                confidence={0.85}
                size="lg"
                explanation="Large size indicator"
              />
              <p className="text-xs text-muted-foreground">Large</p>
            </div>
          </div>
        </div>

        {/* Without label or icon */}
        <div className="mt-8 pt-8 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-4">Display Options</h4>
          <div className="flex items-center gap-8 justify-center">
            <div className="flex flex-col items-center gap-2">
              <ConfidenceIndicator
                confidence={0.88}
                showLabel={false}
                explanation="Without label"
              />
              <p className="text-xs text-muted-foreground">No Label</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ConfidenceIndicator
                confidence={0.88}
                showIcon={false}
                explanation="Without icon"
              />
              <p className="text-xs text-muted-foreground">No Icon</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ConfidenceIndicator
                confidence={0.88}
                showLabel={false}
                showIcon={false}
                explanation="Minimal version"
              />
              <p className="text-xs text-muted-foreground">Minimal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
