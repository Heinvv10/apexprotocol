"use client";

/**
 * OpportunityMatches Component (Phase 9.3)
 *
 * Displays speaking opportunity matches for a person.
 * Shows match score, topics, and allows actions like apply/dismiss.
 */

import { useState } from "react";
// ðŸŸ¢ WORKING: Using centralized formatters
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Plane,
  Globe,
  ChevronRight,
  Sparkles,
  Target,
  RefreshCw,
  Loader2,
  Filter,
  ArrowUpDown,
} from "lucide-react";

// Types
interface SpeakingOpportunity {
  id: string;
  name: string;
  description?: string | null;
  organizer?: string | null;
  organizerUrl?: string | null;
  eventType: "conference" | "webinar" | "podcast" | "panel" | "workshop" | "meetup" | "summit";
  eventDate?: string | null;
  eventEndDate?: string | null;
  location?: string | null;
  isVirtual?: boolean;
  venue?: string | null;
  cfpUrl?: string | null;
  cfpDeadline?: string | null;
  applicationUrl?: string | null;
  topics?: string[];
  targetAudience?: string | null;
  expectedAudienceSize?: number | null;
  isPaid?: boolean;
  compensationDetails?: string | null;
  coversTravelExpenses?: boolean;
  requirements?: string | null;
  speakerBenefits?: string[];
  isFeatured?: boolean;
}

interface OpportunityMatch {
  id: string;
  opportunityId: string;
  personId: string;
  matchScore: number;
  matchReasons?: string[];
  matchedTopics?: string[];
  matchedSkills?: string[];
  status: "open" | "applied" | "accepted" | "declined" | "expired";
  userNotes?: string | null;
  appliedAt?: string | null;
  responseReceivedAt?: string | null;
  opportunity: SpeakingOpportunity;
}

interface OpportunityMatchesProps {
  matches: OpportunityMatch[];
  personName: string;
  onUpdateStatus?: (matchId: string, status: string) => Promise<void>;
  onRefreshMatches?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const EVENT_TYPE_CONFIG = {
  conference: { icon: Mic, label: "Conference", color: "text-purple-500" },
  webinar: { icon: Globe, label: "Webinar", color: "text-blue-500" },
  podcast: { icon: Mic, label: "Podcast", color: "text-pink-500" },
  panel: { icon: Users, label: "Panel", color: "text-cyan-500" },
  workshop: { icon: Target, label: "Workshop", color: "text-orange-500" },
  meetup: { icon: Users, label: "Meetup", color: "text-green-500" },
  summit: { icon: Mic, label: "Summit", color: "text-amber-500" },
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-500" },
  applied: { label: "Applied", color: "bg-amber-500/10 text-amber-500" },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-500" },
  declined: { label: "Declined", color: "bg-red-500/10 text-red-500" },
  expired: { label: "Expired", color: "bg-muted text-muted-foreground" },
};

// ðŸŸ¢ WORKING: Removed inline formatDate - now using centralized utility from @/lib/utils

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getMatchScoreColor(score: number): string {
  if (score >= 70) return "text-green-500";
  if (score >= 50) return "text-cyan-500";
  if (score >= 30) return "text-amber-500";
  return "text-muted-foreground";
}

export function OpportunityMatches({
  matches,
  personName,
  onUpdateStatus,
  onRefreshMatches,
  isLoading = false,
  className,
}: OpportunityMatchesProps) {
  const [selectedMatch, setSelectedMatch] = useState<OpportunityMatch | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "applied" | "accepted">("open");
  const [sortBy, setSortBy] = useState<"score" | "date" | "deadline">("score");

  // Filter and sort matches
  const filteredMatches = matches
    .filter((m) => {
      if (filter === "all") return true;
      return m.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.matchScore - a.matchScore;
      if (sortBy === "date") {
        const dateA = a.opportunity.eventDate ? new Date(a.opportunity.eventDate).getTime() : 0;
        const dateB = b.opportunity.eventDate ? new Date(b.opportunity.eventDate).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === "deadline") {
        const deadlineA = a.opportunity.cfpDeadline ? new Date(a.opportunity.cfpDeadline).getTime() : Infinity;
        const deadlineB = b.opportunity.cfpDeadline ? new Date(b.opportunity.cfpDeadline).getTime() : Infinity;
        return deadlineA - deadlineB;
      }
      return 0;
    });

  if (matches.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <h3 className="font-medium mb-1">No Opportunity Matches Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click the button below to find speaking opportunities that match {personName}&apos;s expertise.
        </p>
        {onRefreshMatches && (
          <Button onClick={onRefreshMatches} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finding Matches...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Find Speaking Opportunities
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Speaking Opportunities
          <span className="ml-2 text-sm text-muted-foreground">
            ({filteredMatches.length} matches)
          </span>
        </h3>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="applied">Applied</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
            >
              <option value="score">Match Score</option>
              <option value="date">Event Date</option>
              <option value="deadline">CFP Deadline</option>
            </select>
          </div>

          {/* Refresh */}
          {onRefreshMatches && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshMatches}
              disabled={isLoading}
              className="h-7 px-2"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={() => setSelectedMatch(match)}
          />
        ))}
      </div>

      {/* Detail Dialog */}
      {selectedMatch && (
        <MatchDetailDialog
          match={selectedMatch}
          open={!!selectedMatch}
          onOpenChange={(open) => !open && setSelectedMatch(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
}

function MatchCard({
  match,
  onClick,
}: {
  match: OpportunityMatch;
  onClick: () => void;
}) {
  const opp = match.opportunity;
  const config = EVENT_TYPE_CONFIG[opp.eventType];
  const statusConfig = STATUS_CONFIG[match.status];
  const Icon = config.icon;
  const daysUntilDeadline = getDaysUntil(opp.cfpDeadline);

  return (
    <div
      className="card-tertiary p-4 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Match Score Circle */}
        <div className="relative flex-shrink-0">
          <svg className="w-12 h-12" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/20"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${match.matchScore} 100`}
              transform="rotate(-90 18 18)"
              className={getMatchScoreColor(match.matchScore)}
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-xs font-bold",
              getMatchScoreColor(match.matchScore)
            )}
          >
            {match.matchScore}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <h4 className="font-medium text-sm line-clamp-1">{opp.name}</h4>
                {opp.isFeatured && (
                  <Sparkles className="h-3 w-3 text-amber-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {opp.organizer || config.label}
              </p>
            </div>

            {/* Status Badge */}
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {opp.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(opp.eventDate)}
              </span>
            )}
            {opp.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {opp.isVirtual ? "Virtual" : opp.location}
              </span>
            )}
            {opp.expectedAudienceSize && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {/* ðŸŸ¢ WORKING: Using centralized formatNumber */}
                {formatNumber(opp.expectedAudienceSize)} attendees
              </span>
            )}
          </div>

          {/* Matched Topics */}
          {match.matchedTopics && match.matchedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {match.matchedTopics.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                >
                  {topic}
                </span>
              ))}
              {match.matchedTopics.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                  +{match.matchedTopics.length - 3}
                </span>
              )}
            </div>
          )}

          {/* CFP Deadline Warning */}
          {match.status === "open" &&
            daysUntilDeadline !== null &&
            daysUntilDeadline <= 7 &&
            daysUntilDeadline > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
                <Clock className="h-3 w-3" />
                CFP closes in {daysUntilDeadline} day
                {daysUntilDeadline !== 1 && "s"}
              </div>
            )}
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}

function MatchDetailDialog({
  match,
  open,
  onOpenChange,
  onUpdateStatus,
}: {
  match: OpportunityMatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (matchId: string, status: string) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const opp = match.opportunity;
  const config = EVENT_TYPE_CONFIG[opp.eventType];
  const Icon = config.icon;

  const handleStatusUpdate = async (status: string) => {
    if (!onUpdateStatus) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(match.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", config.color.replace("text-", "bg-") + "/10")}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <DialogTitle>{opp.name}</DialogTitle>
              <DialogDescription>
                {opp.organizer || config.label}
                {opp.isFeatured && " • Featured Event"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Score */}
          <div className="flex items-center justify-between p-3 card-tertiary rounded-lg">
            <div>
              <p className="text-sm font-medium">Match Score</p>
              <p className="text-xs text-muted-foreground">
                Based on skills, experience, and topics
              </p>
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                getMatchScoreColor(match.matchScore)
              )}
            >
              {match.matchScore}%
            </div>
          </div>

          {/* Match Reasons */}
          {match.matchReasons && match.matchReasons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Why This Matches</h4>
              <ul className="space-y-1">
                {match.matchReasons.map((reason, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {opp.eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p>{formatDate(opp.eventDate)}</p>
                </div>
              </div>
            )}
            {opp.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p>{opp.isVirtual ? "Virtual" : opp.location}</p>
                </div>
              </div>
            )}
            {opp.expectedAudienceSize && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Audience</p>
                  {/* ðŸŸ¢ WORKING: Using centralized formatNumber */}
                  <p>{formatNumber(opp.expectedAudienceSize)}</p>
                </div>
              </div>
            )}
            {opp.cfpDeadline && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">CFP Deadline</p>
                  <p>{formatDate(opp.cfpDeadline)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Perks */}
          <div className="flex flex-wrap gap-2">
            {opp.isPaid && (
              <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Paid
              </span>
            )}
            {opp.coversTravelExpenses && (
              <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Travel Covered
              </span>
            )}
            {opp.isVirtual && (
              <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Virtual
              </span>
            )}
          </div>

          {/* Description */}
          {opp.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">About</h4>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {opp.description}
              </p>
            </div>
          )}

          {/* Topics */}
          {opp.topics && opp.topics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Topics</h4>
              <div className="flex flex-wrap gap-1">
                {opp.topics.map((topic, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      match.matchedTopics?.includes(topic)
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            {match.status === "open" && (
              <>
                {opp.cfpUrl && (
                  <Button asChild className="flex-1">
                    <a href={opp.cfpUrl} target="_blank" rel="noopener noreferrer">
                      Apply Now
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
                {onUpdateStatus && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("applied")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleStatusUpdate("declined")}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
            )}
            {match.status === "applied" && onUpdateStatus && (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Applied {match.appliedAt ? formatDate(match.appliedAt) : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate("accepted")}
                    disabled={isUpdating}
                  >
                    Mark Accepted
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusUpdate("declined")}
                    disabled={isUpdating}
                  >
                    Mark Declined
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
