"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Image as ImageIcon,
  Video,
  Calendar,
  Clock,
  Send,
  Save,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useConnectedAccounts } from "@/hooks/useSocial";
import { useSelectedBrand } from "@/stores/brand-store";

interface PostComposerProps {
  onSave: (draft: any) => void;
  onPublish: (post: any) => void;
}

export function PostComposer({ onSave, onPublish }: PostComposerProps) {
  const selectedBrand = useSelectedBrand();
  const { connectedAccounts, isPlatformConnected } = useConnectedAccounts(selectedBrand?.id ?? null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [postType, setPostType] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; postUrl?: string; error?: string }> | null>(null);
  const [hashtagSuggestions] = useState([
    "#GEO", "#AEO", "#AIOptimization", "#ContentMarketing",
    "#DigitalMarketing", "#SEO", "#Innovation", "#TechNews"
  ]);

  const platforms = [
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", maxChars: 3000 },
    { id: "twitter", name: "Twitter/X", icon: Twitter, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", maxChars: 280 },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-400 bg-pink-500/10 border-pink-500/30", maxChars: 2200 },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", maxChars: 63206 },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-400 bg-red-500/10 border-red-500/30", maxChars: 5000 },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const getCharacterLimit = () => {
    const limits = selectedPlatforms.map(id =>
      platforms.find(p => p.id === id)?.maxChars || 0
    );
    return Math.min(...limits);
  };

  const characterLimit = getCharacterLimit();
  const remainingChars = characterLimit - content.length;
  const isOverLimit = remainingChars < 0;

  const handleSaveDraft = () => {
    const draft = {
      content,
      platforms: selectedPlatforms,
      mediaUrls: mediaFiles,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    onSave(draft);
  };

  const handlePublish = async () => {
    if (!selectedBrand?.id) {
      toast.error("Please select a brand first");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    if (!content.trim()) {
      toast.error("Please enter post content");
      return;
    }
    if (isOverLimit) {
      toast.error("Post content exceeds character limit for selected platforms");
      return;
    }
    if (postType === "scheduled" && (!scheduledDate || !scheduledTime)) {
      toast.error("Please select date and time for scheduled post");
      return;
    }

    // Check if selected platforms are connected
    const unconnectedPlatforms = selectedPlatforms.filter(p => !isPlatformConnected(p));
    if (unconnectedPlatforms.length > 0) {
      toast.error(`Please connect these platforms first: ${unconnectedPlatforms.join(", ")}`);
      return;
    }

    setIsPublishing(true);
    setPublishResults(null);

    try {
      const response = await fetch("/api/social/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          platforms: selectedPlatforms,
          content: {
            text: content,
          },
        }),
      });

      const data = await response.json();

      if (data.results) {
        setPublishResults(data.results);

        // Count successes
        const successCount = Object.values(data.results as Record<string, { success: boolean }>).filter(
          (r) => r.success
        ).length;
        const failCount = selectedPlatforms.length - successCount;

        if (successCount > 0 && failCount === 0) {
          toast.success(`Published to ${successCount} platform(s)!`);
        } else if (successCount > 0) {
          toast.warning(`Published to ${successCount}, failed on ${failCount}`);
        } else {
          toast.error("Publishing failed on all platforms");
        }

        // Call original onPublish callback
        const post = {
          content,
          platforms: selectedPlatforms,
          mediaUrls: mediaFiles,
          status: "published",
          publishedAt: new Date().toISOString(),
          results: data.results,
        };
        onPublish(post);
      } else if (data.error) {
        toast.error(`Publishing failed: ${data.error}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPublishing(false);
    }
  };

  const addHashtag = (tag: string) => {
    setContent(prev => prev + (prev ? " " : "") + tag);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Compose Post</h1>
        <p className="text-muted-foreground mt-1">Create and schedule content across platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <div className="card-secondary p-6">
            <Label className="text-white mb-3 block">Select Platforms</Label>
            <div className="flex flex-wrap gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                const isConnected = isPlatformConnected(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => isConnected && togglePlatform(platform.id)}
                    disabled={!isConnected}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
                      !isConnected
                        ? "text-gray-500 bg-gray-800/50 border-gray-700/50 cursor-not-allowed opacity-60"
                        : isSelected
                          ? platform.color
                          : "text-gray-400 bg-gray-800 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{platform.name}</span>
                    {isConnected ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <span className="text-xs text-gray-500">Not connected</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-xs text-yellow-400 mt-3 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                {connectedAccounts.length === 0
                  ? "No platforms connected. Connect platforms in Channels to publish."
                  : "Please select at least one platform"}
              </p>
            )}
          </div>

          {/* Content Editor */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Post Content</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isOverLimit ? "text-red-400" : remainingChars < 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {remainingChars} characters remaining
                </span>
                {selectedPlatforms.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (Limit: {characterLimit})
                  </span>
                )}
              </div>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to share?"
              className="min-h-[200px] bg-gray-900 border-gray-700 text-white resize-none"
            />
            {isOverLimit && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Content exceeds character limit for selected platforms
              </p>
            )}
          </div>

          {/* Media Upload (Placeholder) */}
          <div className="card-secondary p-6">
            <Label className="text-white mb-3 block">Media (Coming Soon)</Label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
                <Video className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Media upload coming soon
              </p>
            </div>
          </div>

          {/* Publishing Options */}
          <div className="card-secondary p-6">
            <Label className="text-white mb-3 block">Publishing</Label>
            <Tabs value={postType} onValueChange={(v) => setPostType(v as any)}>
              <TabsList className="bg-gray-900">
                <TabsTrigger value="immediate">Post Now</TabsTrigger>
                <TabsTrigger value="scheduled">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="immediate" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Post will be published immediately to all selected platforms
                </p>
              </TabsContent>
              <TabsContent value="scheduled" className="mt-4 space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Time</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Publish Results */}
          {publishResults && (
            <div className="card-secondary p-6">
              <h3 className="text-white font-semibold mb-4">Publishing Results</h3>
              <div className="space-y-3">
                {Object.entries(publishResults).map(([platformId, result]) => {
                  const platform = platforms.find(p => p.id === platformId);
                  const Icon = platform?.icon || Send;
                  return (
                    <div
                      key={platformId}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? "bg-green-500/10 border-green-500/20"
                          : "bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium text-white">
                            {platform?.name || platformId}
                          </span>
                        </div>
                        {result.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            {result.postUrl && (
                              <a
                                href={result.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-red-400">{result.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePublish}
              className="bg-cyan-600 hover:bg-cyan-700 flex-1"
              disabled={selectedPlatforms.length === 0 || !content.trim() || isOverLimit || isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : postType === "scheduled" ? (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </>
              )}
            </Button>
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              className="border-gray-700"
              disabled={isPublishing}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Tips */}
          <div className="card-secondary p-6">
            <h3 className="text-white font-semibold mb-4">Platform Tips</h3>
            <div className="space-y-3">
              {selectedPlatforms.length > 0 ? (
                selectedPlatforms.map((platformId) => {
                  const platform = platforms.find(p => p.id === platformId);
                  if (!platform) return null;
                  const Icon = platform.icon;
                  return (
                    <div key={platformId} className="flex items-start gap-3">
                      <Icon className="h-4 w-4 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Max {platform.maxChars.toLocaleString()} characters
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Select platforms to see tips</p>
              )}
            </div>
          </div>

          {/* Hashtag Suggestions */}
          <div className="card-secondary p-6">
            <h3 className="text-white font-semibold mb-4">Suggested Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {hashtagSuggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addHashtag(tag)}
                  className="px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Best Time to Post */}
          <div className="card-secondary p-6">
            <h3 className="text-white font-semibold mb-4">Best Time to Post</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-white">LinkedIn</span>
                </div>
                <span className="text-xs text-muted-foreground">9-11 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-white">Twitter/X</span>
                </div>
                <span className="text-xs text-muted-foreground">12-3 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-400" />
                  <span className="text-sm text-white">Instagram</span>
                </div>
                <span className="text-xs text-muted-foreground">7-9 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
