"use client";

import { BarChart3 } from "lucide-react";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Track deals through sales stages</p>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No deals yet</p>
        </div>
      </div>
    </div>
  );
}
