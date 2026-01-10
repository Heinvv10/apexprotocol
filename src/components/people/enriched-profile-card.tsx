"use client";

/**
 * EnrichedProfileCard Component (Phase 9.3)
 *
 * Displays enriched executive profile with influence score,
 * career timeline, skills, and thought leadership activities.
 */

import { useState } from "react";
// ðŸŸ¢ WORKING: Using centralized formatters
import { cn, formatNumber, formatDate } from "@/lib/utils";
import {
  InfluenceScoreBadge,
  InfluenceInlineBadge,
} from "./influence-score-badge";
import { CareerTimeline } from "./career-timeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Loader2,
  ExternalLink,
  Mic,
  FileText,
  Podcast,
  Award,
  TrendingUp,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";

// Types from schema
interface CareerPosition {
  title: string;
  company: string;
  companyLinkedinUrl?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

interface Education {
  school: string;
  schoolLinkedinUrl?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface ConferenceAppearance {
  name: string;
  eventDate: string;
  topic?: string;
  role?: "speaker" | "panelist" | "moderator" | "keynote";
  url?: string;
  audienceSize?: number;
  location?: string;
}

interface PodcastAppearance {
  podcastName: string;
  episodeTitle?: string;
  episodeDate: string;
  url?: string;
  downloads?: number;
}

interface Publication {
  title: string;
  publisher: string;
  publicationDate?: string;
  url?: string;
  description?: string;
  coAuthors?: string[];
}

interface InfluenceMetrics {
  overallScore: number;
  breakdown: {
    social: number;
    thoughtLeadership: number;
    aiVisibility: number;
    career: number;
  };
  tier: "thought_leader" | "influential" | "established" | "emerging";
  raw: {
    linkedinFollowers: number;
    twitterFollowers: number;
    totalFollowers: number;
    publicationsCount: number;
    speakingEngagementsCount: number;
    aiMentionCount: number;
    yearsExperience: number;
    positionsHeld: number;
  };
}

interface InfluenceAnalysis {
  strengths: string[];
  areasForGrowth: string[];
  tier: string;
}

interface EnrichedProfileCardProps {
  // Basic person info
  person: {
    id: string;
    name: string;
    title?: string | null;
    photoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    twitterUrl?: string | null;
    personalWebsite?: string | null;
    roleCategory?: string | null;
    bio?: string | null;
    linkedinFollowers?: number | null;
    twitterFollowers?: number | null;
    aiMentionCount?: number | null;
  };

  // Enrichment data
  enrichment?: {
    linkedinHeadline?: string | null;
    linkedinAbout?: string | null;
    currentPosition?: string | null;
    currentCompany?: string | null;
    pastPositions?: CareerPosition[];
    education?: Education[];
    certifications?: Certification[];
    skills?: string[];
    topSkills?: string[];
    languages?: string[];
    totalYearsExperience?: number | null;
    conferenceAppearances?: ConferenceAppearance[];
    podcastAppearances?: PodcastAppearance[];
    publications?: Publication[];
    awards?: { name: string; issuer?: string; date?: string }[];
    lastEnrichedAt?: string | null;
  } | null;

  // Influence data
  influence?: {
    metrics: InfluenceMetrics;
    analysis: InfluenceAnalysis;
  } | null;

  // Actions
  onEnrich?: () => void;
  isEnriching?: boolean;

  // Display options
  variant?: "full" | "compact" | "inline";
  showEnrichButton?: boolean;
  className?: string;
}

export function EnrichedProfileCard({
  person,
  enrichment,
  influence,
  onEnrich,
  isEnriching = false,
  variant = "full",
  showEnrichButton = true,
  className,
}: EnrichedProfileCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasEnrichment = !!enrichment && Object.keys(enrichment).length > 0;
  const displayTitle =
    enrichment?.currentPosition || person.title || "Executive";
  const displayCompany = enrichment?.currentCompany || "";

  // Inline variant - minimal display for lists
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3 card-tertiary rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
          className
        )}
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="flex items-center gap-3">
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {person.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{person.name}</p>
            <p className="text-xs text-muted-foreground">
              {displayTitle}
              {displayCompany && ` at ${displayCompany}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {influence && (
            <InfluenceInlineBadge
              score={influence.metrics.overallScore}
              showLabel={false}
            />
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <DetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          person={person}
          enrichment={enrichment}
          influence={influence}
          onEnrich={onEnrich}
          isEnriching={isEnriching}
        />
      </div>
    );
  }

  // Compact variant - card without full details
  if (variant === "compact") {
    return (
      <div className={cn("card-secondary rounded-lg p-4", className)}>
        <div className="flex items-start gap-4">
          {/* Photo */}
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-medium text-primary">
                {person.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{person.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {displayTitle}
                  {displayCompany && ` at ${displayCompany}`}
                </p>
              </div>
              {influence && (
                <InfluenceInlineBadge score={influence.metrics.overallScore} />
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 mt-2">
              {person.linkedinUrl && (
                <SocialLink
                  href={person.linkedinUrl}
                  icon={Linkedin}
                  label="LinkedIn"
                />
              )}
              {person.twitterUrl && (
                <SocialLink
                  href={person.twitterUrl}
                  icon={Twitter}
                  label="Twitter"
                />
              )}
              {person.personalWebsite && (
                <SocialLink
                  href={person.personalWebsite}
                  icon={Globe}
                  label="Website"
                />
              )}
            </div>

            {/* Quick Stats */}
            {influence && (
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                {influence.metrics.raw.linkedinFollowers > 0 && (
                  <span>
                    {formatNumber(influence.metrics.raw.linkedinFollowers)} LinkedIn
                  </span>
                )}
                {influence.metrics.raw.aiMentionCount > 0 && (
                  <span>{influence.metrics.raw.aiMentionCount} AI mentions</span>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDetailOpen(true)}
          className="w-full mt-3"
        >
          View Full Profile
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        <DetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          person={person}
          enrichment={enrichment}
          influence={influence}
          onEnrich={onEnrich}
          isEnriching={isEnriching}
        />
      </div>
    );
  }

  // Full variant - complete card with all details
  return (
    <div className={cn("card-secondary rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start gap-4">
          {/* Photo */}
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-medium text-primary">
                {person.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{person.name}</h3>
                <p className="text-muted-foreground">
                  {displayTitle}
                  {displayCompany && (
                    <span className="text-sm"> at {displayCompany}</span>
                  )}
                </p>
                {enrichment?.linkedinHeadline && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {enrichment.linkedinHeadline}
                  </p>
                )}
              </div>

              {influence && (
                <InfluenceScoreBadge
                  score={influence.metrics.overallScore}
                  tier={influence.metrics.tier}
                  breakdown={influence.metrics.breakdown}
                  showBreakdown
                  size="md"
                />
              )}
            </div>

            {/* Contact & Social Links */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {person.email}
                </a>
              )}
              {person.linkedinUrl && (
                <SocialLink
                  href={person.linkedinUrl}
                  icon={Linkedin}
                  label="LinkedIn"
                />
              )}
              {person.twitterUrl && (
                <SocialLink
                  href={person.twitterUrl}
                  icon={Twitter}
                  label="Twitter"
                />
              )}
              {person.personalWebsite && (
                <SocialLink
                  href={person.personalWebsite}
                  icon={Globe}
                  label="Website"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* About */}
        {(enrichment?.linkedinAbout || person.bio) && (
          <div>
            <h4 className="text-sm font-medium mb-2">About</h4>
            <p className="text-sm text-muted-foreground line-clamp-4">
              {enrichment?.linkedinAbout || person.bio}
            </p>
          </div>
        )}

        {/* Skills */}
        {enrichment?.skills && enrichment.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {(enrichment.topSkills || enrichment.skills)
                .slice(0, 10)
                .map((skill, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      enrichment.topSkills?.includes(skill)
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {skill}
                  </span>
                ))}
              {enrichment.skills.length > 10 && (
                <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                  +{enrichment.skills.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Career Timeline */}
        {hasEnrichment && (
          <CareerTimeline
            positions={enrichment?.pastPositions || []}
            education={enrichment?.education || []}
            certifications={enrichment?.certifications || []}
            currentPosition={enrichment?.currentPosition || undefined}
            currentCompany={enrichment?.currentCompany || undefined}
            totalYearsExperience={enrichment?.totalYearsExperience || undefined}
          />
        )}

        {/* Thought Leadership */}
        <ThoughtLeadershipSection
          conferences={enrichment?.conferenceAppearances || []}
          podcasts={enrichment?.podcastAppearances || []}
          publications={enrichment?.publications || []}
          awards={enrichment?.awards || []}
        />

        {/* Strengths & Growth Areas */}
        {influence?.analysis && (
          <div className="grid grid-cols-2 gap-4">
            {influence.analysis.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-green-500">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {influence.analysis.strengths.map((strength, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-green-500" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {influence.analysis.areasForGrowth.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-amber-500">
                  <Sparkles className="h-4 w-4" />
                  Growth Areas
                </h4>
                <ul className="space-y-1">
                  {influence.analysis.areasForGrowth.map((area, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Enrich Button */}
        {showEnrichButton && onEnrich && (
          <div className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={onEnrich}
              disabled={isEnriching}
              className="w-full"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enriching Profile...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {hasEnrichment ? "Refresh Enrichment" : "Enrich Profile"}
                </>
              )}
            </Button>
            {enrichment?.lastEnrichedAt && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {/* ðŸŸ¢ WORKING: Using centralized formatDate */}
                Last enriched: {formatDate(enrichment.lastEnrichedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Linkedin;
  label: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Icon className="h-4 w-4" />
          </a>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ThoughtLeadershipSection({
  conferences,
  podcasts,
  publications,
  awards,
}: {
  conferences: ConferenceAppearance[];
  podcasts: PodcastAppearance[];
  publications: Publication[];
  awards: { name: string; issuer?: string; date?: string }[];
}) {
  const totalItems =
    conferences.length + podcasts.length + publications.length + awards.length;

  if (totalItems === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Thought Leadership</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {conferences.length > 0 && (
          <StatItem
            icon={Mic}
            label="Speaking"
            value={conferences.length}
            color="text-purple-500"
          />
        )}
        {podcasts.length > 0 && (
          <StatItem
            icon={Podcast}
            label="Podcasts"
            value={podcasts.length}
            color="text-blue-500"
          />
        )}
        {publications.length > 0 && (
          <StatItem
            icon={FileText}
            label="Publications"
            value={publications.length}
            color="text-cyan-500"
          />
        )}
        {awards.length > 0 && (
          <StatItem
            icon={Award}
            label="Awards"
            value={awards.length}
            color="text-amber-500"
          />
        )}
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Mic;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card-tertiary p-3 rounded-lg text-center">
      <Icon className={cn("h-5 w-5 mx-auto mb-1", color)} />
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ðŸŸ¢ WORKING: Removed inline formatNumber - now using centralized utility from @/lib/utils

// Detail Dialog for inline/compact variants
function DetailDialog({
  open,
  onOpenChange,
  person,
  enrichment,
  influence,
  onEnrich,
  isEnriching,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: EnrichedProfileCardProps["person"];
  enrichment: EnrichedProfileCardProps["enrichment"];
  influence: EnrichedProfileCardProps["influence"];
  onEnrich?: () => void;
  isEnriching?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{person.name} Profile</DialogTitle>
        </DialogHeader>
        <EnrichedProfileCard
          person={person}
          enrichment={enrichment}
          influence={influence}
          onEnrich={onEnrich}
          isEnriching={isEnriching}
          variant="full"
          showEnrichButton={!!onEnrich}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
