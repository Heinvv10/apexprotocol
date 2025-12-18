/**
 * Engine Room Hook
 * Fetches AI platform analysis data
 */

import { useQuery } from "@tanstack/react-query";

// Response types matching component expectations
export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface MetricBadge {
  id: string;
  label: string;
  active: boolean;
}

export interface RadarDataPoint {
  metric: string;
  score: number;
  industryAverage: number;
}

export interface PerceptionBubble {
  id: string;
  label: string;
  size: "sm" | "md" | "lg";
  top: string;
  left: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  count?: number;
  options: Array<{ id: string; label: string; checked: boolean }>;
}

export interface PlatformData {
  model: string;
  perception: string;
}

interface EngineRoomResponse {
  success: boolean;
  platforms: Platform[];
  metricBadges: MetricBadge[];
  radarData: RadarDataPoint[];
  perceptionBubbles: PerceptionBubble[];
  filterGroups: FilterGroup[];
  platformData: Record<string, PlatformData>;
}

/**
 * Hook to fetch engine room data
 */
export function useEngineRoom(brandId?: string) {
  return useQuery<EngineRoomResponse>({
    queryKey: ["engine-room", brandId || "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (brandId) params.set("brandId", brandId);

      const response = await fetch(`/api/engine-room?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch engine room data");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
