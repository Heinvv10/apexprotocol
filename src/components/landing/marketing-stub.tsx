import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

interface MarketingStubProps {
  title: string;
  description: string;
  note?: string;
}

/**
 * Placeholder page wrapped in the marketing site chrome (header + footer).
 * Used for routes whose real content is still pending so the surrounding
 * navigation stays usable and the page is on-brand instead of a bare
 * heading on black.
 */
export function MarketingStub({
  title,
  description,
  note = "We're putting this together. In the meantime, check the dashboard or jump back to the landing page.",
}: MarketingStubProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="card-secondary max-w-xl w-full text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
          <p className="text-xs text-muted-foreground mb-8">{note}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gradient-primary text-white">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
