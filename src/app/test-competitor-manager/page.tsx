/**
 * Test page for CompetitorManager component
 * Navigate to /test-competitor-manager to verify functionality
 */

import { CompetitorManager } from "@/components/competitors/CompetitorManager";

export default function TestCompetitorManagerPage() {
  // Using a test brand ID - in production this would come from route params
  const testBrandId = "test-brand-123";

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Competitor Manager Test Page</h1>
          <p className="text-muted-foreground">
            This page is for testing the CompetitorManager component functionality.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <CompetitorManager
            brandId={testBrandId}
            onCompetitorAdded={() => console.log("Competitor added!")}
            onCompetitorRemoved={() => console.log("Competitor removed!")}
          />
        </div>

        <div className="space-y-4 text-sm">
          <h2 className="text-xl font-semibold">Verification Checklist:</h2>
          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
            <li>CompetitorManager component renders correctly</li>
            <li>Empty state shows when no competitors are tracked</li>
            <li>&quot;Add Competitor&quot; button opens the dialog</li>
            <li>Form accepts competitor name and domain</li>
            <li>Competitor appears in list after adding</li>
            <li>10-competitor limit is enforced (button disabled, warning shown)</li>
            <li>Remove button appears on hover and works correctly</li>
            <li>Loading states display properly</li>
            <li>Error states display properly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
