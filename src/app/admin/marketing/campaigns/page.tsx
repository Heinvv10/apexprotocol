"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage marketing campaigns</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <p className="text-muted-foreground">No campaigns yet</p>
      </div>
    </div>
  );
}
