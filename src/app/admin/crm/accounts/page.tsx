"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage customer accounts</p>
        </div>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No accounts yet</p>
        </div>
      </div>
    </div>
  );
}
