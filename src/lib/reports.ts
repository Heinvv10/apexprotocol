import React from "react";

export type ReportPeriod = "weekly" | "monthly" | "quarterly" | "custom";

export interface ReportOptions {
  brandId: string;
  period: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  includeCompetitors?: boolean;
  includeRecommendations?: boolean;
  includeROI?: boolean;
  includeForecast?: boolean;
  forecastHorizon?: 30 | 60 | 90;
  whiteLabel?: {
    agencyName?: string;
    agencyWebsite?: string;
    agencyEmail?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    darkMode?: boolean;
  };
}

export interface ReportData {
  brandId: string;
  brandName: string;
  period: ReportPeriod;
  generatedAt: Date;
}

// MOCK: Stub implementation — replace with real report data fetching
export async function fetchReportData(options: ReportOptions): Promise<ReportData | null> {
  return {
    brandId: options.brandId,
    brandName: "Brand",
    period: options.period,
    generatedAt: new Date(),
  };
}

interface ReportDocumentProps {
  data: ReportData | null;
}

// MOCK: Stub report document component
export function ReportDocument(props: ReportDocumentProps): React.ReactElement {
  return React.createElement("div", null, props.data?.brandName ?? "Report");
}
