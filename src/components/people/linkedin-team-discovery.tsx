"use client";

/**
 * LinkedIn Team Discovery Component
 *
 * Discovers and displays team members from company LinkedIn page.
 * Allows users to extract employees and enrich profiles with LinkedIn data.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Linkedin,
  Loader2,
  RefreshCw,
  Plus,
  Check,
  AlertCircle,
  Users,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LinkedInPerson {
  id: string;
  name: string;
  title?: string;
  linkedinUrl?: string;
  linkedinFollowers?: number;
  isVerified?: boolean;
  discoveredFrom: string;
}

interface LinkedInTeamDiscoveryProps {
  brandId: string;
  brandName: string;
  domain?: string;
}

export function LinkedInTeamDiscovery({
  brandId,
  brandName,
  domain,
}: LinkedInTeamDiscoveryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnriching, setIsEnriching] = useState(false);

  // Fetch existing LinkedIn people
  const { data: linkedinPeople, isLoading: isPeopleLoading, refetch: refetchPeople } = useQuery({
    queryKey: ["linkedin-people", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/people/linkedin?brandId=${brandId}`);
      if (!res.ok) throw new Error("Failed to fetch LinkedIn people");
      const result = await res.json();
      return result.data.people || [];
    },
  });

  // Extract LinkedIn people mutation
  const extractMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/people/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          action: "extract",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details?.error || "Failed to extract LinkedIn people");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "LinkedIn Team Extracted",
        description: `Found ${data.data.peopleExtracted} team members from LinkedIn`,
      });
      refetchPeople();
      queryClient.invalidateQueries({ queryKey: ["linkedin-people", brandId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enrich all LinkedIn people mutation
  const enrichAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/people/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          action: "enrich-all",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to enrich people");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "LinkedIn Profiles Enriched",
        description: `Updated ${data.data.enrichedCount} of ${data.data.totalAttempted} profiles with LinkedIn data`,
      });
      refetchPeople();
      queryClient.invalidateQueries({ queryKey: ["linkedin-people", brandId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Enrichment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtract = async () => {
    extractMutation.mutate();
  };

  const handleEnrichAll = async () => {
    setIsEnriching(true);
    enrichAllMutation.mutate();
    setIsEnriching(false);
  };

  const peopleCount = linkedinPeople?.length || 0;

  return (
    <div className="space-y-4">
      <Card className="card-secondary border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  LinkedIn Team Discovery
                </CardTitle>
                <CardDescription>
                  Auto-populate team members from company LinkedIn page
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExtract}
              disabled={extractMutation.isPending}
              className="flex-1"
              variant="default"
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Extract Team from LinkedIn
                </>
              )}
            </Button>

            <Button
              onClick={handleEnrichAll}
              disabled={
                enrichAllMutation.isPending ||
                isEnriching ||
                peopleCount === 0
              }
              className="flex-1"
              variant="outline"
            >
              {enrichAllMutation.isPending || isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Enrich All with LinkedIn Data
                </>
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Team Members Found</p>
              <p className="text-2xl font-bold text-foreground">{peopleCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">From LinkedIn</p>
              <p className="text-2xl font-bold text-blue-500">✓</p>
            </div>
          </div>

          {/* People List */}
          {peopleCount > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Discovered Team Members:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {linkedinPeople?.map((person: LinkedInPerson) => (
                  <div
                    key={person.id}
                    className="flex items-start justify-between p-3 bg-muted/20 rounded-lg border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {person.name}
                      </p>
                      {person.title && (
                        <p className="text-xs text-muted-foreground truncate">
                          {person.title}
                        </p>
                      )}
                      {person.linkedinFollowers && (
                        <p className="text-xs text-muted-foreground">
                          {person.linkedinFollowers.toLocaleString()} followers
                        </p>
                      )}
                    </div>
                    {person.linkedinUrl && (
                      <a
                        href={person.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 flex-shrink-0"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {peopleCount === 0 && !isPeopleLoading && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 border border-border/50 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                No LinkedIn team members extracted yet. Click &quot;Extract Team from LinkedIn&quot; to discover your team.
              </p>
            </div>
          )}

          {/* Info Alert */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <Linkedin className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              This feature uses RapidAPI LinkedIn Data Scraper to extract verified employee data from your company&apos;s LinkedIn page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
