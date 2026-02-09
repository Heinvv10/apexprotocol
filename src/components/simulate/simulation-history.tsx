"use client";

import { useSimulations, useDeleteSimulation } from "@/hooks/useSimulation";
import { useSimulationStore } from "@/stores/simulation-store";
import { Trash2, Eye, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulationHistoryProps {
  brandId: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-success" />,
  failed: <XCircle className="w-4 h-4 text-error" />,
  partial: <CheckCircle2 className="w-4 h-4 text-warning" />,
  running: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export function SimulationHistory({ brandId }: SimulationHistoryProps) {
  const { data: sims, isLoading } = useSimulations(brandId);
  const deleteMutation = useDeleteSimulation();
  const { setActiveSimulationId, setStep } = useSimulationStore();

  if (isLoading) {
    return (
      <div className="card-secondary p-4 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!sims || sims.length === 0) return null;

  const handleView = (id: string, status: string) => {
    setActiveSimulationId(id);
    if (status === "running" || status === "pending") {
      setStep("running");
    } else {
      setStep("results");
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Recent Simulations</h4>
      <div className="space-y-2">
        {sims.slice(0, 10).map((sim: any) => (
          <div key={sim.id} className="card-tertiary flex items-center gap-3">
            {statusIcons[sim.status] || statusIcons.pending}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{sim.query}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{sim.status}</span>
                <span>-</span>
                <span>{sim.type === "ab_test" ? "A/B Test" : "Single"}</span>
                <span>-</span>
                <span>{new Date(sim.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleView(sim.id, sim.status)}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-error"
                onClick={() => deleteMutation.mutate(sim.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
