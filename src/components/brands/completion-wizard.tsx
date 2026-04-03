"use client";

import * as React from "react";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Users,
  Target,
  MessageSquare,
  Lightbulb,
  MapPin,
  Palette,
  Sparkles,
  SkipForward,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Brand } from "@/stores";

// Design system colors (from APEX_DESIGN_SYSTEM.md)
const DESIGN = {
  primaryCyan: "#00E5CC",
  cyanBright: "#00FFE0",
  accentPurple: "#8B5CF6",
  accentPink: "#EC4899",
  successGreen: "#22C55E",
  warningYellow: "#F59E0B",
  errorRed: "#EF4444",
  infoBlue: "#3B82F6",
  bgDeep: "#02030A",
  bgBase: "#060812",
  bgElevated: "#0A0D1A",
  bgCard: "#0F1225",
  bgCardHover: "#151935",
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textAccent: "#00E5CC",
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderAccent: "rgba(0, 229, 204, 0.3)",
};

// Voice tones
const VOICE_TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
];

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  impactWarning?: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "social",
    title: "Social Media Profiles",
    description: "Add your social media URLs for visibility tracking",
    icon: Globe,
    iconColor: DESIGN.accentPurple,
    impactWarning: "Social dashboard won't work without social profiles",
  },
  {
    id: "keywords",
    title: "SEO/GEO Keywords",
    description: "Target keywords for AI platform monitoring",
    icon: Target,
    iconColor: DESIGN.successGreen,
    impactWarning: "Monitor dashboard needs keywords to track specific mentions",
  },
  {
    id: "competitors",
    title: "Competitors",
    description: "Track your main competitors",
    icon: Users,
    iconColor: DESIGN.warningYellow,
    impactWarning: "Competitive dashboard requires competitor data",
  },
  {
    id: "audience",
    title: "Target Audience",
    description: "Define who your brand serves",
    icon: Users,
    iconColor: DESIGN.infoBlue,
    impactWarning: "AI content generation works better with audience context",
  },
  {
    id: "value-props",
    title: "Value Propositions",
    description: "What makes your brand unique",
    icon: Lightbulb,
    iconColor: DESIGN.primaryCyan,
    impactWarning: "Helps AI understand your brand positioning",
  },
  {
    id: "team",
    title: "Team Members",
    description: "Add leadership and key team members",
    icon: Users,
    iconColor: DESIGN.accentPink,
    impactWarning: "People dashboard needs team member data",
  },
  {
    id: "locations",
    title: "Locations",
    description: "Physical business locations",
    icon: MapPin,
    iconColor: DESIGN.errorRed,
    impactWarning: "Location-based features require address data",
  },
  {
    id: "voice",
    title: "Brand Voice",
    description: "Customize your brand's communication style",
    icon: MessageSquare,
    iconColor: DESIGN.accentPurple,
    impactWarning: "Affects AI-generated content quality",
  },
];

// Small badge shown when an item was pre-filled by the scraper
function ScrapedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${DESIGN.primaryCyan}20`,
        color: DESIGN.primaryCyan,
        border: `1px solid ${DESIGN.primaryCyan}40`,
      }}
    >
      <Zap className="w-3 h-3" />
      Found on website
    </span>
  );
}

interface CompletionWizardProps {
  brand: Brand;
  onComplete: (updatedData: Partial<Brand>) => Promise<void>;
  onClose: () => void;
}

export function CompletionWizard({ brand, onComplete, onClose }: CompletionWizardProps) {
  // ── Capture initial scraped data once (ref value is set only on first render) ──
  const _scraped = React.useRef({
    personnel: ((brand as any).personnel?.map((p: any) => ({
      name: p.name || "",
      title: p.title || "",
      bio: p.bio || "",
    })) || []) as Array<{ name: string; title: string; bio?: string }>,
    locations: ((brand as any).locations?.map((l: any) => ({
      address: l.address || "",
      city: l.city || "",
      country: l.country || "",
    })) || []) as Array<{ address: string; city: string; country: string }>,
    socials: {
      facebook: !!(brand.socialLinks?.facebook),
      twitter: !!(brand.socialLinks?.twitter),
      linkedin: !!(brand.socialLinks?.linkedin),
      instagram: !!(brand.socialLinks?.instagram),
    },
  });

  // Derived booleans — which steps have pre-existing/scraped data
  const _hasSocial = !!(brand.socialLinks && Object.values(brand.socialLinks).some((l: any) => l && String(l).trim() !== ""));
  const _hasTeam = _scraped.current.personnel.length > 0;
  const _hasLocations = _scraped.current.locations.length > 0;

  // Pre-mark completed steps based on existing brand data
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(() => {
    const s = new Set<string>();
    if (_hasSocial) s.add("social");
    if ((brand.keywords || []).length > 0) s.add("keywords");
    if ((brand.competitors || []).length > 0) s.add("competitors");
    if (brand.voice?.targetAudience?.trim()) s.add("audience");
    if ((brand.valuePropositions || []).length > 0) s.add("value-props");
    if (_hasTeam) s.add("team");
    if (_hasLocations) s.add("locations");
    return s;
  });

  // Auto-skip scraper-dependent steps when no data was found
  const [skippedSteps, setSkippedSteps] = React.useState<Set<string>>(() => {
    const s = new Set<string>();
    if (!_hasSocial) s.add("social");
    if (!_hasTeam) s.add("team");
    if (!_hasLocations) s.add("locations");
    return s;
  });

  // Start at first step that needs user attention (not auto-completed or auto-skipped)
  const [currentStep, setCurrentStep] = React.useState(() => {
    const autoCompleted = new Set<string>();
    if (_hasSocial) autoCompleted.add("social");
    if ((brand.keywords || []).length > 0) autoCompleted.add("keywords");
    if ((brand.competitors || []).length > 0) autoCompleted.add("competitors");
    if (brand.voice?.targetAudience?.trim()) autoCompleted.add("audience");
    if ((brand.valuePropositions || []).length > 0) autoCompleted.add("value-props");
    if (_hasTeam) autoCompleted.add("team");
    if (_hasLocations) autoCompleted.add("locations");
    const autoSkipped = new Set<string>();
    if (!_hasSocial) autoSkipped.add("social");
    if (!_hasTeam) autoSkipped.add("team");
    if (!_hasLocations) autoSkipped.add("locations");
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      const id = WIZARD_STEPS[i].id;
      if (!autoCompleted.has(id) && !autoSkipped.has(id)) return i;
    }
    // Everything done/skipped — land on first completed step for review
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      if (autoCompleted.has(WIZARD_STEPS[i].id)) return i;
    }
    return 0;
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form data state
  const [socialLinks, setSocialLinks] = React.useState({
    facebook: brand.socialLinks?.facebook || "",
    twitter: brand.socialLinks?.twitter || "",
    linkedin: brand.socialLinks?.linkedin || "",
    instagram: brand.socialLinks?.instagram || "",
  });
  const [keywords, setKeywords] = React.useState<string[]>(brand.keywords || []);
  const [keywordInput, setKeywordInput] = React.useState("");
  const [competitors, setCompetitors] = React.useState<Array<{ name: string; url: string }>>(
    brand.competitors?.map(c => ({ name: c.name, url: c.url || "" })) || []
  );
  const [competitorInput, setCompetitorInput] = React.useState({ name: "", url: "" });
  const [targetAudience, setTargetAudience] = React.useState(brand.voice?.targetAudience || "");
  const [valueProps, setValueProps] = React.useState<string[]>(brand.valuePropositions || []);
  const [valuePropInput, setValuePropInput] = React.useState("");

  // Pre-populate team from scraped personnel
  const [team, setTeam] = React.useState<Array<{ name: string; title: string; bio?: string }>>(
    _scraped.current.personnel
  );
  const [teamInput, setTeamInput] = React.useState({ name: "", title: "", bio: "" });

  // Pre-populate locations from scraped locations
  const [locations, setLocations] = React.useState<Array<{ address: string; city: string; country: string }>>(
    _scraped.current.locations
  );
  const [locationInput, setLocationInput] = React.useState({ address: "", city: "", country: "" });
  const [voiceTone, setVoiceTone] = React.useState(brand.voice?.tone || "professional");

  const currentStepData = WIZARD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  // Which steps have scraper-detected data (for badges / "Auto-detected" indicators)
  const scrapedStepData = {
    social: Object.values(_scraped.current.socials).some(Boolean),
    team: _scraped.current.personnel.length > 0,
    locations: _scraped.current.locations.length > 0,
  };

  // Check what was auto-filled
  const autoFilled = {
    name: !!brand.name,
    domain: !!brand.domain,
    logo: !!brand.logoUrl,
    description: !!brand.description,
    industry: !!brand.industry,
    monitoring: !!brand.monitoringEnabled,
  };

  const autoFilledCount = Object.values(autoFilled).filter(Boolean).length;

  // Add keyword
  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  // Add competitor
  const addCompetitor = () => {
    if (competitorInput.name.trim()) {
      setCompetitors([...competitors, competitorInput]);
      setCompetitorInput({ name: "", url: "" });
    }
  };

  // Add value prop
  const addValueProp = () => {
    const vp = valuePropInput.trim();
    if (vp && !valueProps.includes(vp)) {
      setValueProps([...valueProps, vp]);
      setValuePropInput("");
    }
  };

  // Add team member
  const addTeamMember = () => {
    if (teamInput.name.trim() && teamInput.title.trim()) {
      setTeam([...team, teamInput]);
      setTeamInput({ name: "", title: "", bio: "" });
    }
  };

  // Add location
  const addLocation = () => {
    if (locationInput.city.trim() && locationInput.country.trim()) {
      setLocations([...locations, locationInput]);
      setLocationInput({ address: "", city: "", country: "" });
    }
  };

  // Check if current step has data
  const hasStepData = () => {
    switch (currentStepData.id) {
      case "social":
        return Object.values(socialLinks).some(link => link.trim());
      case "keywords":
        return keywords.length > 0;
      case "competitors":
        return competitors.length > 0;
      case "audience":
        return targetAudience.trim();
      case "value-props":
        return valueProps.length > 0;
      case "team":
        return team.length > 0;
      case "locations":
        return locations.length > 0;
      case "voice":
        return voiceTone !== "professional";
      default:
        return false;
    }
  };

  // Check if the current step's data was auto-detected by the scraper
  const isCurrentStepScraped = (): boolean => {
    const id = currentStepData.id;
    if (id === "social") return scrapedStepData.social;
    if (id === "team") return scrapedStepData.team;
    if (id === "locations") return scrapedStepData.locations;
    return false;
  };

  // Skip current step
  const handleSkip = () => {
    setSkippedSteps(prev => new Set([...prev, currentStepData.id]));
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Complete current step
  const handleNext = () => {
    if (hasStepData()) {
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    }
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Go back
  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // Finish and save
  const handleFinish = async () => {
    setIsSubmitting(true);

    const updatedData: Partial<Brand> = {
      socialLinks: Object.fromEntries(
        Object.entries(socialLinks).filter(([_, url]) => url.trim())
      ),
      keywords,
      competitors: competitors.map(c => ({ ...c, reason: "" })),
      voice: {
        ...brand.voice,
        tone: voiceTone as Brand["voice"]["tone"],
        targetAudience,
        personality: [],
        keyMessages: [],
        avoidTopics: [],
      },
      valuePropositions: valueProps,
      // Team and locations would need backend schema updates
    };

    try {
      await onComplete(updatedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: `${DESIGN.bgDeep}E6` }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative max-w-2xl w-full rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: `${DESIGN.bgCard}B3`,
          border: `1px solid ${DESIGN.primaryCyan}33`,
          boxShadow: `0 0 40px ${DESIGN.primaryCyan}15, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Header */}
        {currentStep === -1 ? (
          // Welcome screen
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${DESIGN.primaryCyan}20` }}
            >
              <Sparkles className="w-8 h-8" style={{ color: DESIGN.primaryCyan }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: DESIGN.textPrimary }}>
              {brand.name} Created!
            </h2>
            <p className="text-sm mb-6" style={{ color: DESIGN.textSecondary }}>
              Let's complete your brand profile for full Apex functionality
            </p>

            {/* What was auto-filled */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                backgroundColor: `${DESIGN.successGreen}15`,
                border: `1px solid ${DESIGN.successGreen}40`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5" style={{ color: DESIGN.successGreen }} />
                <h3 className="font-semibold" style={{ color: DESIGN.successGreen }}>
                  Auto-filled ({autoFilledCount}/6)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-left">
                {Object.entries(autoFilled).map(([key, filled]) => (
                  <div key={key} className="flex items-center gap-2">
                    {filled ? (
                      <Check className="w-4 h-4" style={{ color: DESIGN.successGreen }} />
                    ) : (
                      <X className="w-4 h-4" style={{ color: DESIGN.textMuted }} />
                    )}
                    <span style={{ color: filled ? DESIGN.textPrimary : DESIGN.textMuted }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                backgroundColor: `${DESIGN.warningYellow}15`,
                border: `1px solid ${DESIGN.warningYellow}40`,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: DESIGN.warningYellow }} />
                <div className="text-left">
                  <h3 className="font-semibold mb-1" style={{ color: DESIGN.warningYellow }}>
                    Some dashboards won't work yet
                  </h3>
                  <p className="text-sm" style={{ color: DESIGN.textSecondary }}>
                    Complete these steps to unlock Monitor, Competitive, Social, and People dashboards.
                    You can skip any step and fill it in later.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={onClose}
                style={{ borderColor: DESIGN.borderDefault }}
              >
                Skip for Now
              </Button>
              <Button
                onClick={() => setCurrentStep(0)}
                style={{
                  backgroundColor: DESIGN.primaryCyan,
                  color: DESIGN.bgDeep,
                }}
              >
                Complete Setup
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="px-8 pt-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: DESIGN.textSecondary }}>
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </span>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%`,
                    backgroundColor: DESIGN.primaryCyan,
                  }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-6">
              {/* Step Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentStepData.iconColor}20` }}
                  >
                    <currentStepData.icon className="w-5 h-5" style={{ color: currentStepData.iconColor }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold" style={{ color: DESIGN.textPrimary }}>
                        {currentStepData.title}
                      </h3>
                      {isCurrentStepScraped() && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${DESIGN.successGreen}20`,
                            color: DESIGN.successGreen,
                            border: `1px solid ${DESIGN.successGreen}40`,
                          }}
                        >
                          <Check className="w-3 h-3" />
                          Auto-detected ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: DESIGN.textSecondary }}>
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
                {currentStepData.impactWarning && (
                  <div
                    className="p-3 rounded-lg flex items-start gap-2 text-sm"
                    style={{
                      backgroundColor: `${DESIGN.infoBlue}15`,
                      border: `1px solid ${DESIGN.infoBlue}40`,
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: DESIGN.infoBlue }} />
                    <span style={{ color: DESIGN.textSecondary }}>{currentStepData.impactWarning}</span>
                  </div>
                )}
              </div>

              {/* Step Form */}
              <div className="space-y-4">
                {currentStepData.id === "social" && (
                  <div className="space-y-3">
                    {(["facebook", "twitter", "linkedin", "instagram"] as const).map((platform) => {
                      const icons = {
                        facebook: <Facebook className="w-4 h-4" style={{ color: "#1877F2" }} />,
                        twitter: <Twitter className="w-4 h-4" style={{ color: "#1DA1F2" }} />,
                        linkedin: <Linkedin className="w-4 h-4" style={{ color: "#0A66C2" }} />,
                        instagram: <Instagram className="w-4 h-4" style={{ color: "#E4405F" }} />,
                      };
                      const placeholders = {
                        facebook: "https://facebook.com/yourbrand",
                        twitter: "https://twitter.com/yourbrand",
                        linkedin: "https://linkedin.com/company/yourbrand",
                        instagram: "https://instagram.com/yourbrand",
                      };
                      const wasScraped = _scraped.current.socials[platform];
                      return (
                        <div key={platform} className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            {icons[platform]}
                            {platform.charAt(0).toUpperCase() + platform.slice(1).replace("twitter", "Twitter/X")}
                            {wasScraped && <ScrapedBadge />}
                          </label>
                          <Input
                            value={socialLinks[platform]}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, [platform]: e.target.value }))}
                            placeholder={placeholders[platform]}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentStepData.id === "keywords" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                        placeholder="Add a keyword..."
                      />
                      <Button type="button" onClick={addKeyword} variant="outline">
                        Add
                      </Button>
                    </div>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                            style={{
                              backgroundColor: `${DESIGN.primaryCyan}20`,
                              color: DESIGN.primaryCyan,
                            }}
                          >
                            {kw}
                            <button
                              onClick={() => setKeywords(keywords.filter(k => k !== kw))}
                              className="hover:opacity-70"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStepData.id === "competitors" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        value={competitorInput.name}
                        onChange={(e) => setCompetitorInput(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Competitor name"
                      />
                      <Input
                        value={competitorInput.url}
                        onChange={(e) => setCompetitorInput(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="Website URL (optional)"
                      />
                      <Button type="button" onClick={addCompetitor} variant="outline" className="w-full">
                        Add Competitor
                      </Button>
                    </div>
                    {competitors.length > 0 && (
                      <div className="space-y-2">
                        {competitors.map((comp, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg flex items-center justify-between"
                            style={{
                              backgroundColor: DESIGN.bgElevated,
                              border: `1px solid ${DESIGN.borderDefault}`,
                            }}
                          >
                            <div>
                              <div className="font-medium">{comp.name}</div>
                              {comp.url && (
                                <div className="text-xs text-muted-foreground">{comp.url}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCompetitors(competitors.filter((_, i) => i !== idx))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStepData.id === "audience" && (
                  <textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Describe your target customers... (e.g., Small business owners, Enterprise IT managers)"
                    className="w-full h-32 px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                )}

                {currentStepData.id === "value-props" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={valuePropInput}
                        onChange={(e) => setValuePropInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValueProp())}
                        placeholder="What makes your brand unique..."
                      />
                      <Button type="button" onClick={addValueProp} variant="outline">
                        Add
                      </Button>
                    </div>
                    {valueProps.length > 0 && (
                      <div className="space-y-2">
                        {valueProps.map((vp, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg flex items-start justify-between gap-2"
                            style={{
                              backgroundColor: DESIGN.bgElevated,
                              border: `1px solid ${DESIGN.borderDefault}`,
                            }}
                          >
                            <span className="text-sm">{vp}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setValueProps(valueProps.filter((_, i) => i !== idx))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStepData.id === "team" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        value={teamInput.name}
                        onChange={(e) => setTeamInput(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Name"
                      />
                      <Input
                        value={teamInput.title}
                        onChange={(e) => setTeamInput(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Title/Role"
                      />
                      <textarea
                        value={teamInput.bio}
                        onChange={(e) => setTeamInput(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Bio (optional)"
                        className="w-full h-20 px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                      <Button type="button" onClick={addTeamMember} variant="outline" className="w-full">
                        Add Team Member
                      </Button>
                    </div>
                    {team.length > 0 && (
                      <div className="space-y-2">
                        {team.map((member, idx) => {
                          const isScraped = idx < _scraped.current.personnel.length;
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-lg flex items-start justify-between"
                              style={{
                                backgroundColor: DESIGN.bgElevated,
                                border: `1px solid ${isScraped ? DESIGN.primaryCyan + "40" : DESIGN.borderDefault}`,
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-medium">{member.name}</div>
                                  {isScraped && <ScrapedBadge />}
                                </div>
                                <div className="text-sm text-muted-foreground">{member.title}</div>
                                {member.bio && (
                                  <div className="text-xs text-muted-foreground mt-1">{member.bio}</div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTeam(team.filter((_, i) => i !== idx))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {currentStepData.id === "locations" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        value={locationInput.address}
                        onChange={(e) => setLocationInput(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Address (optional)"
                      />
                      <Input
                        value={locationInput.city}
                        onChange={(e) => setLocationInput(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                      <Input
                        value={locationInput.country}
                        onChange={(e) => setLocationInput(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Country"
                      />
                      <Button type="button" onClick={addLocation} variant="outline" className="w-full">
                        Add Location
                      </Button>
                    </div>
                    {locations.length > 0 && (
                      <div className="space-y-2">
                        {locations.map((loc, idx) => {
                          const isScraped = idx < _scraped.current.locations.length;
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-lg flex items-start justify-between"
                              style={{
                                backgroundColor: DESIGN.bgElevated,
                                border: `1px solid ${isScraped ? DESIGN.primaryCyan + "40" : DESIGN.borderDefault}`,
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                {isScraped && (
                                  <div className="mb-1">
                                    <ScrapedBadge />
                                  </div>
                                )}
                                {loc.address && <div className="text-sm">{loc.address}</div>}
                                <div className="text-sm font-medium">{loc.city}, {loc.country}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocations(locations.filter((_, i) => i !== idx))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {currentStepData.id === "voice" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Communication Style</label>
                    <Select value={voiceTone} onValueChange={(value) => setVoiceTone(value as Brand["voice"]["tone"])}>
                      <SelectTrigger className="w-full h-10 bg-muted/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_TONES.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-8 py-4 flex items-center justify-between gap-3"
              style={{
                borderTop: `1px solid ${DESIGN.borderDefault}`,
                background: `linear-gradient(180deg, ${DESIGN.bgCard} 0%, ${DESIGN.bgElevated} 100%)`,
              }}
            >
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isFirstStep}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="gap-2"
                  style={{ borderColor: DESIGN.borderDefault }}
                >
                  <SkipForward className="w-4 h-4" />
                  Skip Step
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isLastStep ? DESIGN.successGreen : DESIGN.primaryCyan,
                    color: DESIGN.bgDeep,
                  }}
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : isLastStep ? (
                    "Finish"
                  ) : (
                    <>
                      {hasStepData() ? "Save & " : ""}Continue
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
