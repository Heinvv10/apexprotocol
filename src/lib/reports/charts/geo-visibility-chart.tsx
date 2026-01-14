/**
 * GeoVisibilityChart component for investor reports
 * Uses recharts-to-png to convert Recharts to base64 PNG for PDF embedding
 * Workflow: Recharts â†’ useCurrentPng() â†’ await getPng() â†’ blobToBase64() â†’ PDF Image
 *
 * âšª UNTESTED: Component written but not yet verified with actual data
 */

import React, { useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { svgToPng, downloadPng } from "@/lib/export/png";

// ============================================================================
// Types
// ============================================================================

export interface GeoDataPoint {
  date: string;
  avgOverallScore: number;
  avgVisibilityScore: number;
  avgSentimentScore: number;
  avgRecommendationScore: number;
  totalMentions: number;
}

export interface GeoVisibilityChartProps {
  data: GeoDataPoint[];
  width?: number;
  height?: number;
  onExportReady?: (exportFn: () => Promise<string>) => void;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert Blob to base64 string
 * Used to embed PNG chart images in PDF documents
 *
 * âšª UNTESTED: Standard FileReader pattern, needs verification in PDF workflow
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================================================
// Component
// ============================================================================

/**
 * GeoVisibilityChart
 *
 * Renders GEO visibility trends as a line chart for investor reports
 * Supports conversion to PNG via svgToPng utility for PDF embedding
 *
 * @param data - Array of GEO data points with scores and metrics
 * @param width - Chart width in pixels (default: 800)
 * @param height - Chart height in pixels (default: 400)
 * @param onExportReady - Callback that receives the export function when chart is ready
 */
export function GeoVisibilityChart({
  data,
  width = 800,
  height = 400,
  onExportReady,
}: GeoVisibilityChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  /**
   * Export chart to PNG data URL
   */
  const exportToPng = useCallback(async (): Promise<string> => {
    if (!chartRef.current) {
      throw new Error("Chart container not available");
    }

    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) {
      throw new Error("SVG element not found in chart");
    }

    return svgToPng(svgElement, {
      width: width - 40, // Account for padding
      height: height - 40,
      backgroundColor: "#ffffff",
      scale: 2, // 2x resolution for better quality
    });
  }, [width, height]);

  /**
   * Download chart as PNG file
   */
  const downloadChart = useCallback(async (filename: string = "geo-visibility-chart.png") => {
    const dataUrl = await exportToPng();
    downloadPng(dataUrl, filename);
  }, [exportToPng]);

  // Notify parent when export function is ready
  React.useEffect(() => {
    if (onExportReady) {
      onExportReady(exportToPng);
    }
  }, [onExportReady, exportToPng]);

  return (
    <div
      ref={chartRef}
      style={{
        width,
        height,
        padding: "20px",
        backgroundColor: "#ffffff",
      }}
    >
      <LineChart
        width={width - 40}
        height={height - 40}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#d1d5db" }}
          axisLine={{ stroke: "#d1d5db" }}
          label={{
            value: "Date",
            position: "insideBottom",
            offset: -10,
            style: { fontSize: 12, fill: "#374151" },
          }}
        />

        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#d1d5db" }}
          axisLine={{ stroke: "#d1d5db" }}
          domain={[0, 100]}
          label={{
            value: "Score",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12, fill: "#374151" },
          }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          labelStyle={{ color: "#111827", fontWeight: 600, marginBottom: "4px" }}
          itemStyle={{ padding: "2px 0" }}
        />

        <Legend
          wrapperStyle={{
            fontSize: "12px",
            paddingTop: "16px",
          }}
          iconType="line"
        />

        {/* Overall GEO Score */}
        <Line
          type="monotone"
          dataKey="avgOverallScore"
          name="Overall Score"
          stroke="#00E5CC"
          strokeWidth={3}
          dot={{ fill: "#00E5CC", r: 4 }}
          activeDot={{ r: 6 }}
        />

        {/* Visibility Score */}
        <Line
          type="monotone"
          dataKey="avgVisibilityScore"
          name="Visibility Score"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ fill: "#8B5CF6", r: 3 }}
          activeDot={{ r: 5 }}
        />

        {/* Sentiment Score */}
        <Line
          type="monotone"
          dataKey="avgSentimentScore"
          name="Sentiment Score"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: "#10B981", r: 3 }}
          activeDot={{ r: 5 }}
        />

        {/* Recommendation Score */}
        <Line
          type="monotone"
          dataKey="avgRecommendationScore"
          name="Recommendation Score"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={{ fill: "#F59E0B", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </div>
  );
}

// ============================================================================
// Export Function for PDF Generation
// ============================================================================

/**
 * Generate GEO visibility chart as base64 PNG image
 *
 * This function is used in the PDF generation flow to convert
 * the chart into an embeddable image format
 *
 * @param getPngFn - PNG generation function from the chart component's onExportReady callback
 * @returns Promise resolving to base64 PNG data URL string
 * @throws Error if chart generation fails
 */
export async function generateGeoChartImage(
  getPngFn: () => Promise<string>
): Promise<string> {
  try {
    const pngDataUrl = await getPngFn();

    if (!pngDataUrl) {
      throw new Error("Failed to generate GEO visibility chart image");
    }

    return pngDataUrl;
  } catch (error) {
    throw new Error(
      `Chart image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Export utility hook for chart export functionality
 * Returns an object with export methods that can be called imperatively
 */
export function useChartExport() {
  const exportFnRef = useRef<(() => Promise<string>) | null>(null);

  const setExportFn = useCallback((fn: () => Promise<string>) => {
    exportFnRef.current = fn;
  }, []);

  const exportToPng = useCallback(async (): Promise<string> => {
    if (!exportFnRef.current) {
      throw new Error("Chart export function not available");
    }
    return exportFnRef.current();
  }, []);

  const downloadAsPng = useCallback(async (filename: string = "chart.png") => {
    const dataUrl = await exportToPng();
    downloadPng(dataUrl, filename);
  }, [exportToPng]);

  return {
    setExportFn,
    exportToPng,
    downloadAsPng,
  };
}
