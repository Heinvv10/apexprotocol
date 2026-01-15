"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Youtube,
  Facebook,
  Image as ImageIcon,
  Video,
  Calendar,
  Clock,
  Send,
  Save,
  Eye,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface PostComposerProps {
  onClose?: () => void;
  onSave?: (post: any) => void;
  onPublish?: (post: any) => void;
}

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
  maxChars: number;
  supports: {
    images: boolean;
    videos: boolean;
    hashtags: boolean;
    mentions: boolean;
  };
}

const platforms: Platform[] = [
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    color: "text-blue-400",
    maxChars: 280,
    supports: { images: true, videos: true, hashtags: true, mentions: true },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-cyan-400",
    maxChars: 3000,
    supports: { images: true, videos: true, hashtags: true, mentions: true },
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-400",
    maxChars: 2200,
    supports: { images: true, videos: true, hashtags: true, mentions: true },
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "text-red-400",
    maxChars: 5000,
    supports: { images: true, videos: true, hashtags: true, mentions: false },
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-indigo-400",
    maxChars: 63206,
    supports: { images: true, videos: true, hashtags: true, mentions: true },
  },
];

const postTemplates = [
  {
    id: "product_launch",
    name: "Product Launch",
    content: "🚀 Exciting news! We're launching [Product Name]!\n\n✨ Key features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\nLearn more: [Link]\n\n#ProductLaunch #Innovation",
  },
  {
    id: "blog_announcement",
    name: "Blog Post",
    content: "📝 New blog post alert!\n\n[Title]\n\n[Brief description]\n\nRead the full article: [Link]\n\n#Blog #Content",
  },
  {
    id: "customer_success",
    name: "Customer Success",
    content: "💬 Customer success story!\n\n\"[Customer quote]\"\n\n- [Customer Name], [Title] at [Company]\n\nSee how we helped them: [Link]\n\n#CustomerSuccess #CaseStudy",
  },
  {
    id: "event_promotion",
    name: "Event Promotion",
    content: "📅 Join us for [Event Name]!\n\n📍 [Location/Virtual]\n🗓️ [Date & Time]\n\nWhat to expect:\n• [Topic 1]\n• [Topic 2]\n• [Topic 3]\n\nRegister: [Link]\n\n#Event #Webinar",
  },
  {
    id: "tips_tricks",
    name: "Tips & Tricks",
    content: "💡 Pro tip: [Tip headline]\n\nHere's how:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nTry it out and let us know how it works!\n\n#Tips #HowTo",
  },
];

const optimalPostingTimes = {
  twitter: [
    { time: "09:00", label: "9:00 AM - Peak morning engagement" },
    { time: "12:00", label: "12:00 PM - Lunch hour peak" },
    { time: "17:00", label: "5:00 PM - Evening commute" },
  ],
  linkedin: [
    { time: "08:00", label: "8:00 AM - Business hour start" },
    { time: "12:00", label: "12:00 PM - Lunch break" },
    { time: "17:00", label: "5:00 PM - Post-work check" },
  ],
  instagram: [
    { time: "11:00", label: "11:00 AM - Mid-morning scroll" },
    { time: "14:00", label: "2:00 PM - Afternoon break" },
    { time: "19:00", label: "7:00 PM - Evening engagement" },
  ],
  youtube: [
    { time: "14:00", label: "2:00 PM - Afternoon views" },
    { time: "18:00", label: "6:00 PM - Prime time" },
    { time: "20:00", label: "8:00 PM - Evening peak" },
  ],
  facebook: [
    { time: "09:00", label: "9:00 AM - Morning check" },
    { time: "13:00", label: "1:00 PM - Lunch scroll" },
    { time: "19:00", label: "7:00 PM - Evening engagement" },
  ],
};

export function PostComposer({ onClose, onSave, onPublish }: PostComposerProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const applyTemplate = (templateContent: string) => {
    setContent(templateContent);
    setSelectedTemplate("");
  };

  const getCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 0;
    const limits = selectedPlatforms.map(
      (id) => platforms.find((p) => p.id === id)?.maxChars || 0
    );
    return Math.min(...limits);
  };

  const getCharacterCount = () => content.length;

  const isOverLimit = () => {
    const limit = getCharacterLimit();
    return limit > 0 && getCharacterCount() > limit;
  };

  const getOptimalTimes = () => {
    if (selectedPlatforms.length === 0) return [];
    const primaryPlatform = selectedPlatforms[0];
    return optimalPostingTimes[primaryPlatform as keyof typeof optimalPostingTimes] || [];
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setMediaFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    const draft = {
      content,
      platforms: selectedPlatforms,
      scheduledDate,
      scheduledTime,
      mediaFiles: mediaFiles.map((f) => f.name),
      status: "draft",
    };
    onSave?.(draft);
  };

  const handlePublish = () => {
    const post = {
      content,
      platforms: selectedPlatforms,
      scheduledDate,
      scheduledTime,
      mediaFiles: mediaFiles.map((f) => f.name),
      status: scheduledDate && scheduledTime ? "scheduled" : "published",
    };
    onPublish?.(post);
  };

  const canPublish = selectedPlatforms.length > 0 && content.trim() !== "" && !isOverLimit();

  return (
    <div className="card-secondary">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Create Post</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Compose and schedule posts across multiple social media platforms
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Platform Selection */}
        <div>
          <Label className="text-sm font-medium text-white mb-3 block">Select Platforms</Label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-white/5 border-cyan-500/50 " + platform.color
                      : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <Label className="text-sm font-medium text-white mb-3 block">Post Template (Optional)</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="bg-[#0a0f1a] border-white/10">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {postTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplate && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                const template = postTemplates.find((t) => t.id === selectedTemplate);
                if (template) applyTemplate(template.content);
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Apply Template
            </Button>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-white">Post Content</Label>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-medium ${
                  isOverLimit()
                    ? "text-red-400"
                    : getCharacterCount() > getCharacterLimit() * 0.9
                    ? "text-yellow-400"
                    : "text-muted-foreground"
                }`}
              >
                {getCharacterCount()}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{getCharacterLimit()}</span>
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className={`min-h-[200px] bg-[#0a0f1a] border-white/10 resize-none ${
              isOverLimit() ? "border-red-500/50" : ""
            }`}
          />
          {isOverLimit() && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Content exceeds character limit for selected platforms</span>
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div>
          <Label className="text-sm font-medium text-white mb-3 block">Media (Optional)</Label>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 transition-all">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleMediaUpload}
              />
            </label>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 transition-all">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Video</span>
              </div>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
            </label>
          </div>
          {mediaFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                  <button
                    onClick={() => removeMediaFile(index)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Schedule Date (Optional)</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="bg-[#0a0f1a] border-white/10"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Schedule Time (Optional)</Label>
            <Select value={scheduledTime || undefined} onValueChange={setScheduledTime}>
              <SelectTrigger className="bg-[#0a0f1a] border-white/10">
                <SelectValue placeholder="Select time..." />
              </SelectTrigger>
              <SelectContent>
                {getOptimalTimes().map((time) => (
                  <SelectItem key={time.time} value={time.time}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!canPublish}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {scheduledDate && scheduledTime ? (
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
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Post Preview</h3>
            <Tabs defaultValue={selectedPlatforms[0] || "twitter"}>
              <TabsList className="mb-4">
                {selectedPlatforms.map((platformId) => {
                  const platform = platforms.find((p) => p.id === platformId);
                  if (!platform) return null;
                  const Icon = platform.icon;
                  return (
                    <TabsTrigger key={platformId} value={platformId}>
                      <Icon className="h-4 w-4 mr-2" />
                      {platform.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find((p) => p.id === platformId);
                if (!platform) return null;
                return (
                  <TabsContent key={platformId} value={platformId}>
                    <div className="card-tertiary">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">A</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">Apex Marketing</span>
                            <span className="text-muted-foreground text-sm">@apex-marketing</span>
                          </div>
                          <p className="text-white whitespace-pre-wrap">{content || "Your post content will appear here..."}</p>
                          {mediaFiles.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {mediaFiles.slice(0, 4).map((file, index) => (
                                <div
                                  key={index}
                                  className="aspect-video bg-white/5 rounded-lg flex items-center justify-center border border-white/10"
                                >
                                  <span className="text-xs text-muted-foreground">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-6 mt-4 text-muted-foreground">
                            <span className="text-sm">💬 0</span>
                            <span className="text-sm">🔄 0</span>
                            <span className="text-sm">❤️ 0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
