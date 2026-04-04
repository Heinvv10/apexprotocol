"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface PlatformData {
  platform: string;
  visibility: number;
  confidence: number;
  position?: number | null;
}

interface PlatformComparisonChartProps {
  data: PlatformData[];
  title: string;
  type?: "bar" | "line";
  height?: number;
}

export function PlatformComparisonChart({
  data,
  title,
  type = "bar",
  height = 300,
}: PlatformComparisonChartProps) {
  const chartData = data.map((item) => ({
    name: item.platform,
    visibility: item.visibility,
    confidence: item.confidence,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-cyan-500/30 rounded p-2 text-xs">
          <p className="text-cyan-400 font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-secondary p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#9ca3af" }} />
            <Bar dataKey="visibility" fill="#00e5cc" radius={[8, 8, 0, 0]} />
            <Bar dataKey="confidence" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#9ca3af" }} />
            <Line type="monotone" dataKey="visibility" stroke="#00e5cc" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}
