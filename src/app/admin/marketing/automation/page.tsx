"use client";

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automation</h1>
        <p className="text-muted-foreground mt-1">Manage email sequences and automations</p>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <p className="text-muted-foreground">No automations configured</p>
      </div>
    </div>
  );
}
