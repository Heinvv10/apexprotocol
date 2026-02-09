import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- API functions ---

async function fetchSimulations(brandId: string) {
  const res = await fetch(`/api/simulations?brandId=${brandId}`);
  if (!res.ok) throw new Error("Failed to fetch simulations");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch simulations");
  return json.data;
}

async function fetchSimulation(id: string) {
  const res = await fetch(`/api/simulations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch simulation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch simulation");
  return json.data;
}

async function fetchSimulationStatus(id: string) {
  const res = await fetch(`/api/simulations/${id}/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch status");
  return json.data;
}

interface CreateSimulationInput {
  brandId: string;
  query: string;
  contentTitle?: string;
  contentBody: string;
  contentType?: string;
  variantBTitle?: string;
  variantBBody?: string;
  platforms: string[];
}

async function createSimulation(input: CreateSimulationInput) {
  const res = await fetch("/api/simulations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create simulation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to create simulation");
  return json.data;
}

async function deleteSimulation(id: string) {
  const res = await fetch(`/api/simulations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete simulation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to delete simulation");
  return json;
}

// --- Query key extensions ---

const simulationKeys = {
  all: ["simulations"] as const,
  lists: () => [...simulationKeys.all, "list"] as const,
  list: (brandId: string) => [...simulationKeys.lists(), brandId] as const,
  details: () => [...simulationKeys.all, "detail"] as const,
  detail: (id: string) => [...simulationKeys.details(), id] as const,
  status: (id: string) => [...simulationKeys.all, "status", id] as const,
};

// --- Hooks ---

export function useSimulations(brandId: string) {
  return useQuery({
    queryKey: simulationKeys.list(brandId),
    queryFn: () => fetchSimulations(brandId),
    enabled: !!brandId,
    staleTime: 1000 * 30,
  });
}

export function useSimulation(id: string | null) {
  return useQuery({
    queryKey: simulationKeys.detail(id || ""),
    queryFn: () => fetchSimulation(id!),
    enabled: !!id,
    staleTime: 1000 * 10,
  });
}

export function useSimulationStatus(id: string | null, enabled = true) {
  return useQuery({
    queryKey: simulationKeys.status(id || ""),
    queryFn: () => fetchSimulationStatus(id!),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when simulation is done
      if (data?.status === "completed" || data?.status === "failed" || data?.status === "partial") {
        return false;
      }
      return 2000; // Poll every 2 seconds while running
    },
    staleTime: 0,
  });
}

export function useCreateSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulationKeys.all });
    },
  });
}

export function useDeleteSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulationKeys.all });
    },
  });
}
