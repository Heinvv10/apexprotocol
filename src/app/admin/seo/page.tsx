"use client";

import { Search } from "lucide-react";

export default function SEOPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO</h1>
        <p className="text-muted-foreground mt-1">Monitor website SEO and search visibility</p>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <div className="text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to SEO data...</p>
        </div>
      </div>
    </div>
  );
}
