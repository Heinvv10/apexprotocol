"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandHeader } from "@/components/layout/brand-header";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Bot,
  Linkedin,
  Twitter,
  Crown,
  Award,
  Mic,
  BookOpen,
  CheckCircle,
  Plus,
  User,
  Sparkles,
} from "lucide-react";
import { TeamSuggestions } from "@/components/people/team-suggestions";
import { useSelectedBrand } from "@/stores";
import { useQuery } from "@tanstack/react-query";

// Phase 9.4 - Premium Gating
import { FeatureGate, UsageMeter, PremiumBadge } from "@/components/premium";
import { useCurrentPlan } from "@/hooks/use-subscription";

// Types
interface PeopleSummary {
  brandId: string;
  brandName: string;
  summary: {
    ppoScore: number;
    ppoTrend: "up" | "down" | "stable";
    totalPeople: number;
    totalAiMentions: number;
    totalSocialFollowers: number;
    avgThoughtLeadership: number;
    executiveCount: number;
    founderCount: number;
  };
  breakdown: {
    executiveVisibility: number;
    thoughtLeadership: number;
    aiMentions: number;
    socialEngagement: number;
  };
  lastUpdated: string;
}

interface BrandPerson {
  id: string;
  name: string;
  title: string;
  roleCategory: string;
  photoUrl?: string;
  bio?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  linkedinFollowers: number;
  twitterFollowers: number;
  totalSocialFollowers: number;
  aiMentionCount: number;
  aiVisibilityScore: number;
  thoughtLeadershipScore: number;
  publicationsCount: number;
  speakingEngagementsCount: number;
  isVerified: boolean;
  isPrimary: boolean;
}

interface PersonAiMention {
  id: string;
  personId: string;
  personName: string;
  platform: string;
  query: string;
  responseSnippet: string;
  sentiment: string;
  mentionedWithBrand: boolean;
  queryTimestamp: string;
}

// API hooks
function usePeopleSummary(brandId: string) {
  return useQuery({
    queryKey: ["people", "summary", brandId],
    queryFn: async (): Promise<PeopleSummary> => {
      const res = await fetch(`/api/people?brandId=${brandId}&type=summary`);
      if (!res.ok) throw new Error("Failed to fetch people summary");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

function useBrandPeople(brandId: string) {
  return useQuery({
    queryKey: ["people", "list", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/people?brandId=${brandId}&type=list`);
      if (!res.ok) throw new Error("Failed to fetch people");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

function usePeopleAiMentions(brandId: string) {
  return useQuery({
    queryKey: ["people", "ai-mentions", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/people?brandId=${brandId}&type=ai-mentions`);
      if (!res.ok) throw new Error("Failed to fetch AI mentions");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

// Select brand prompt
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to View People Analytics</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to analyze leadership presence.
          </p>
        </div>
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
        >
          Manage Brands
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Analyzing leadership presence...</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Failed to Load People Data</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

// PPO Score Gauge Component
function PPOScoreGauge({ value, trend, breakdown }: {
  value: number;
  trend: "up" | "down" | "stable";
  breakdown: { executiveVisibility: number; thoughtLeadership: number; aiMentions: number; socialEngagement: number };
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-muted-foreground";
  const trendBg = trend === "up" ? "bg-success/10" : trend === "down" ? "bg-error/10" : "bg-muted/20";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-error";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  return (
    <div className="card-primary p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Users className="w-full h-full text-primary" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">People Presence Score (PPO)</h3>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${trendBg}`}>
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-5xl font-bold ${getScoreColor(value)}`}>{value}</span>
          <span className={`text-2xl font-semibold ${getScoreColor(value)}`}>{getGrade(value)}</span>
        </div>

        {/* Score breakdown bars */}
        <div className="space-y-2 pt-2">
          {[
            { label: "Executive Visibility", value: breakdown.executiveVisibility, weight: "35%" },
            { label: "Thought Leadership", value: breakdown.thoughtLeadership, weight: "30%" },
            { label: "AI Mentions", value: breakdown.aiMentions, weight: "20%" },
            { label: "Social Engagement", value: breakdown.socialEngagement, weight: "15%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-32">{item.label}</span>
              <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-purple to-primary rounded-full transition-all duration-500"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: "primary" | "warning" | "error" | "success" | "purple";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    error: "bg-error/10 text-error border-error/30",
    success: "bg-success/10 text-success border-success/30",
    purple: "bg-accent-purple/10 text-accent-purple border-accent-purple/30",
  };

  return (
    <div className="card-secondary p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {subValue && <div className="text-xs text-muted-foreground/70">{subValue}</div>}
      </div>
    </div>
  );
}

// Role category badge
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    c_suite: "bg-accent-purple/20 text-accent-purple border-accent-purple/30",
    founder: "bg-warning/20 text-warning border-warning/30",
    board: "bg-primary/20 text-primary border-primary/30",
    key_employee: "bg-success/20 text-success border-success/30",
    ambassador: "bg-accent-pink/20 text-accent-pink border-accent-pink/30",
    advisor: "bg-muted/30 text-muted-foreground border-muted/30",
    investor: "bg-warning/20 text-warning border-warning/30",
  };

  const labels: Record<string, string> = {
    c_suite: "C-Suite",
    founder: "Founder",
    board: "Board",
    key_employee: "Key Employee",
    ambassador: "Ambassador",
    advisor: "Advisor",
    investor: "Investor",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[role] || colors.key_employee}`}>
      {labels[role] || role}
    </span>
  );
}

// Person Card Component
function PersonCard({ person }: { person: BrandPerson }) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          {person.isPrimary && (
            <Crown className="w-4 h-4 text-warning absolute -top-1 -right-1" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground truncate">{person.name}</span>
            {person.isVerified && <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          </div>
          <div className="text-xs text-muted-foreground truncate mb-2">{person.title}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <RoleBadge role={person.roleCategory} />
            {person.aiMentionCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                {person.aiMentionCount} AI mentions
              </span>
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="text-right space-y-2">
          <div className="flex items-center gap-3">
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#0A66C2] transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                {formatNumber(person.linkedinFollowers)}
              </a>
            )}
            {person.twitterUrl && (
              <a
                href={person.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#1DA1F2] transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
                {formatNumber(person.twitterFollowers)}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {person.publicationsCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {person.publicationsCount}
              </span>
            )}
            {person.speakingEngagementsCount > 0 && (
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                {person.speakingEngagementsCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Mention Card
function AiMentionCard({ mention }: { mention: PersonAiMention }) {
  const platformColors: Record<string, string> = {
    chatgpt: "bg-[#10A37F]/20 text-[#10A37F]",
    claude: "bg-[#D97706]/20 text-[#D97706]",
    gemini: "bg-[#4285F4]/20 text-[#4285F4]",
    perplexity: "bg-[#1FB8CD]/20 text-[#1FB8CD]",
    grok: "bg-white/20 text-white",
    deepseek: "bg-[#6366F1]/20 text-[#6366F1]",
    copilot: "bg-[#0078D4]/20 text-[#0078D4]",
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${platformColors[mention.platform] || "bg-muted/20"}`}>
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{mention.personName}</span>
              <span className="text-xs text-muted-foreground capitalize">{mention.platform}</span>
            </div>
            {mention.mentionedWithBrand && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                With Brand
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1 italic">&quot;{mention.query}&quot;</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{mention.responseSnippet}</p>
          <div className="text-xs text-muted-foreground/70 mt-2">
            {formatTimeAgo(mention.queryTimestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Top Performers Card
function TopPerformersCard({ people }: { people: BrandPerson[] }) {
  const topByAi = [...people].sort((a, b) => b.aiMentionCount - a.aiMentionCount).slice(0, 3);
  const topBySocial = [...people].sort((a, b) => b.totalSocialFollowers - a.totalSocialFollowers).slice(0, 3);

  return (
    <div className="card-secondary p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Top Performers</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By AI Visibility */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-purple" />
            AI Visibility
          </h4>
          <div className="space-y-2">
            {topByAi.map((person, i) => (
              <div key={person.id} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-warning/20 text-warning" : "bg-muted/20 text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm text-foreground truncate flex-1">{person.name}</span>
                <span className="text-xs text-accent-purple">{person.aiMentionCount} mentions</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Social Following */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Social Following
          </h4>
          <div className="space-y-2">
            {topBySocial.map((person, i) => (
              <div key={person.id} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-warning/20 text-warning" : "bg-muted/20 text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm text-foreground truncate flex-1">{person.name}</span>
                <span className="text-xs text-primary">
                  {person.totalSocialFollowers >= 1000
                    ? `${(person.totalSocialFollowers / 1000).toFixed(1)}K`
                    : person.totalSocialFollowers}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function PeoplePage() {
  const router = useRouter();
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id || "";
  const currentPlan = useCurrentPlan();

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = usePeopleSummary(brandId);

  const { data: peopleData } = useBrandPeople(brandId);
  const { data: aiMentionsData } = usePeopleAiMentions(brandId);

  // Handle upgrade navigation
  const handleUpgrade = () => {
    router.push("/dashboard/settings?tab=billing");
  };

  // Handle states
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <BrandHeader pageName="People" />
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  if (summaryLoading) {
    return (
      <div className="space-y-6 relative">
        <BrandHeader pageName="People" />
        <LoadingState />
        <DecorativeStar />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="space-y-6 relative">
        <BrandHeader pageName="People" />
        <ErrorState error={summaryError as Error} onRetry={() => refetchSummary()} />
        <DecorativeStar />
      </div>
    );
  }

  const people: BrandPerson[] = peopleData?.people || [];
  const aiMentions: PersonAiMention[] = aiMentionsData?.mentions || [];
  const summaryData = summary?.summary || {
    ppoScore: 0,
    ppoTrend: "stable" as const,
    totalPeople: 0,
    totalAiMentions: 0,
    totalSocialFollowers: 0,
    avgThoughtLeadership: 0,
    executiveCount: 0,
    founderCount: 0,
  };
  const breakdown = summary?.breakdown || {
    executiveVisibility: 0,
    thoughtLeadership: 0,
    aiMentions: 0,
    socialEngagement: 0,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6 relative">
      <BrandHeader pageName="People" />

      <div className="space-y-6">
        {/* Top Row - PPO Score and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <PPOScoreGauge value={summaryData.ppoScore} trend={summaryData.ppoTrend} breakdown={breakdown} />

          <StatCard
            icon={Users}
            label="People Tracked"
            value={summaryData.totalPeople}
            subValue={`${summaryData.executiveCount} executives, ${summaryData.founderCount} founders`}
            color="primary"
          />

          <StatCard
            icon={Bot}
            label="AI Mentions"
            value={formatNumber(summaryData.totalAiMentions)}
            subValue="Across 7 AI platforms"
            color="purple"
          />

          <StatCard
            icon={Award}
            label="Thought Leadership"
            value={Math.round(summaryData.avgThoughtLeadership)}
            subValue="Average score"
            color="success"
          />
        </div>

        {/* Top Performers - Gated to Professional+ */}
        {people.length > 0 && (
          <FeatureGate
            feature="influence_scoring"
            plan={currentPlan}
            mode="blur"
            onUpgrade={handleUpgrade}
          >
            <TopPerformersCard people={people} />
          </FeatureGate>
        )}

        {/* People Enrichment Usage Meter for Professional Plan */}
        {currentPlan === "professional" && (
          <div className="card-secondary p-4">
            <UsageMeter
              resource="people_enrichment"
              plan={currentPlan}
              currentUsage={summaryData.totalPeople}
              variant="detailed"
              onUpgrade={handleUpgrade}
            />
          </div>
        )}

        {/* Team Suggestions - LinkedIn Integration */}
        <TeamSuggestions
          brandId={brandId}
          onAddPerson={() => {
            // TODO: Open add person modal
            console.log("Add person clicked");
          }}
          onDiscoverTeam={() => {
            // Navigate to team discovery
            router.push(`/dashboard/people/discover?brandId=${brandId}`);
          }}
          onEnrichProfile={(personId) => {
            // Navigate to person enrichment
            router.push(`/dashboard/people/${personId}/enrich`);
          }}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* People List */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Key People</h2>
                {currentPlan === "starter" && (
                  <PremiumBadge requiredPlan="professional" size="sm" />
                )}
              </div>
              <FeatureGate
                feature="executive_enrichment"
                plan={currentPlan}
                mode="replace"
                fallback={
                  <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Person (Upgrade)
                  </button>
                }
              >
                <button className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-3 h-3" />
                  Add Person
                </button>
              </FeatureGate>
            </div>

            {people.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No people added yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Add key people to track their digital presence
                </p>
                <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-all">
                  <Plus className="w-4 h-4" />
                  Add Person
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {people.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            )}
          </div>

          {/* AI Mentions */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent-purple" />
                <h2 className="text-lg font-semibold text-foreground">Recent AI Mentions</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {aiMentions.length} recent
              </span>
            </div>

            {aiMentions.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-accent-purple/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No AI mentions yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Mentions will appear when your people are referenced in AI responses
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {aiMentions.slice(0, 10).map((mention) => (
                  <AiMentionCard key={mention.id} mention={mention} />
                ))}
                {aiMentions.length > 10 && (
                  <button className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors">
                    View all {aiMentions.length} mentions
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Row */}
        {summaryData.ppoScore < 70 && (
          <div className="card-secondary p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Recommendations to Improve PPO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {breakdown.executiveVisibility < 50 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Boost Executive Profiles</h4>
                  <p className="text-xs text-muted-foreground">
                    Encourage executives to complete their LinkedIn profiles and increase posting frequency.
                  </p>
                </div>
              )}
              {breakdown.thoughtLeadership < 50 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Increase Thought Leadership</h4>
                  <p className="text-xs text-muted-foreground">
                    Publish articles, speak at conferences, and participate in podcasts to build authority.
                  </p>
                </div>
              )}
              {breakdown.aiMentions < 50 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Improve AI Visibility</h4>
                  <p className="text-xs text-muted-foreground">
                    Create authoritative content and optimize bios for AI platform recognition.
                  </p>
                </div>
              )}
              {summaryData.totalPeople < 3 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Add More Key People</h4>
                  <p className="text-xs text-muted-foreground">
                    Track additional executives, founders, and key employees to improve coverage.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DecorativeStar />
    </div>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientPeople)"
        />
        <defs>
          <linearGradient id="starGradientPeople" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

