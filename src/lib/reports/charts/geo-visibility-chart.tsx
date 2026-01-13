/**
 * GeoVisibilityChart component for investor reports
 * Uses recharts-to-png to convert Recharts to base64 PNG for PDF embedding
 * Workflow: Recharts â†’ useCurrentPng() â†’ await getPng() â†’ blobToBase64() â†’ PDF Image
 *
 * âšª UNTESTED: Component written but not yet verified with actual data
 */

import React from "react";
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
// NOTE: recharts-to-png import removed - package not installed
// TODO: Implement PNG export functionality when package is available

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
 * Supports conversion to PNG via useCurrentPng hook for PDF embedding
 *
 * @param data - Array of GEO data points with scores and metrics
 * @param width - Chart width in pixels (default: 800)
 * @param height - Chart height in pixels (default: 400)
 */
export function GeoVisibilityChart({
  data,
  width = 800,
  height = 400,
}: GeoVisibilityChartProps) {
  return (
    <div
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
 * @param data - GEO data points to visualize
 * @param getPngFn - PNG generation function from useCurrentPng hook
 * @returns Promise resolving to base64 image string
 * @throws Error if chart generation fails or Blob is null
 *
 * âšª UNTESTED: Error handling logic written but not verified with actual chart generation
 */
export async function generateGeoChartImage(
  getPngFn: () => Promise<Blob | null>
): Promise<string> {
  const pngBlob = await getPngFn();

  if (!pngBlob) {
    throw new Error("Failed to generate GEO visibility chart image");
  }

  return await blobToBase64(pngBlob);
}
