"use client";

import { Search, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">Manage your sales leads and track pipeline progress</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="card-secondary">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <Button variant="outline" className="border-white/20">
            <ChevronDown className="h-4 w-4 mr-2" />
            Status
          </Button>
          <Button variant="outline" className="border-white/20">
            <ChevronDown className="h-4 w-4 mr-2" />
            Score
          </Button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="card-secondary">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
            <p className="text-muted-foreground mb-4">Create your first lead to get started</p>
            <Button className="bg-red-500 hover:bg-red-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Lead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
