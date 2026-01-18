"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelectedBrand } from "@/stores";

export interface ScheduleConfig {
  id: string;
  name: string;
  type: "daily" | "weekly" | "monthly" | "once";
  jobType: "audit:scan" | "report:weekly" | "report:monthly";
  enabled: boolean;
  nextRun?: string;
  lastRun?: string;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  name: string;
  type: "daily" | "weekly" | "monthly" | "once";
  jobType: "audit:scan" | "report:weekly" | "report:monthly";
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string;
}

// Fetch all schedules for a brand
export function useSchedules() {
  const { selectedBrand } = useSelectedBrand();

  return useQuery({
    queryKey: ["schedules", selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand?.id) return [];

      const response = await fetch(`/api/audit/schedules?brandId=${selectedBrand.id}`);
      if (!response.ok) throw new Error("Failed to fetch schedules");
      const data = await response.json();
      return data.schedules as ScheduleConfig[];
    },
    enabled: !!selectedBrand?.id,
    refetchInterval: 30000, // Refetch every 30 seconds to show updated "next run" times
  });
}

// Fetch a single schedule
export function useSchedule(scheduleId: string) {
  return useQuery({
    queryKey: ["schedule", scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/audit/schedules/${scheduleId}`);
      if (!response.ok) throw new Error("Failed to fetch schedule");
      const data = await response.json();
      return data.schedule as ScheduleConfig;
    },
    enabled: !!scheduleId,
  });
}

// Create a new schedule
export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { selectedBrand } = useSelectedBrand();

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const response = await fetch("/api/audit/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          brandId: selectedBrand?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", selectedBrand?.id] });
    },
  });
}

// Update a schedule
export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  const { selectedBrand } = useSelectedBrand();

  return useMutation({
    mutationFn: async (input: UpdateScheduleInput) => {
      const { id, ...updates } = input;
      const response = await fetch(`/api/audit/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", selectedBrand?.id] });
    },
  });
}

// Delete a schedule
export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  const { selectedBrand } = useSelectedBrand();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch(`/api/audit/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", selectedBrand?.id] });
    },
  });
}

// Toggle schedule enabled/disabled
export function useToggleSchedule() {
  const queryClient = useQueryClient();
  const { selectedBrand } = useSelectedBrand();

  return useMutation({
    mutationFn: async (input: { scheduleId: string; enabled: boolean }) => {
      const response = await fetch(`/api/audit/schedules/${input.scheduleId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: input.enabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", selectedBrand?.id] });
    },
  });
}

// Fetch audit history for a schedule
export function useScheduleHistory(scheduleId: string) {
  return useQuery({
    queryKey: ["schedule-history", scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/audit/schedules/${scheduleId}/history`);
      if (!response.ok) throw new Error("Failed to fetch schedule history");
      const data = await response.json();
      return data.audits;
    },
    enabled: !!scheduleId,
    refetchInterval: 60000, // Refetch every minute
  });
}
