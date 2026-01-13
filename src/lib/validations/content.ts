import { z } from "zod";

// Content types
export const contentTypeEnum = z.enum([
  "blog_post",
  "social_post",
  "product_description",
  "faq",
  "landing_page",
  "email",
  "ad_copy",
  "press_release",
]);

export type ContentType = z.infer<typeof contentTypeEnum>;

// AI platform types
export const aiPlatformEnum = z.enum([
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "copilot",
]);

export type AIPlatform = z.infer<typeof aiPlatformEnum>;

// Content creation schema
export const createContentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  type: contentTypeEnum,
  targetPlatforms: z
    .array(aiPlatformEnum)
    .min(1, "Select at least one target platform"),
  topic: z
    .string()
    .min(10, "Topic must be at least 10 characters")
    .max(500, "Topic must be less than 500 characters"),
  keywords: z
    .array(z.string().max(50))
    .min(1, "Add at least one keyword")
    .max(10, "Maximum 10 keywords allowed"),
  tone: z.enum(["professional", "casual", "friendly", "authoritative", "playful"]).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  additionalInstructions: z
    .string()
    .max(1000, "Instructions must be less than 1000 characters")
    .optional(),
});

export type CreateContentFormData = z.infer<typeof createContentSchema>;

// Content editing schema
export const editContentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content must be less than 50,000 characters"),
  status: z.enum(["draft", "published", "archived"]),
  scheduledAt: z.date().optional(),
  metadata: z
    .object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(160).optional(),
      ogImage: z.string().url().optional(),
    })
    .optional(),
});

export type EditContentFormData = z.infer<typeof editContentSchema>;

// Content feedback schema
export const contentFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z
    .string()
    .max(1000, "Feedback must be less than 1000 characters")
    .optional(),
  categories: z.array(z.enum([
    "accuracy",
    "tone",
    "relevance",
    "creativity",
    "seo",
    "other",
  ])).optional(),
});

export type ContentFeedbackFormData = z.infer<typeof contentFeedbackSchema>;

// Content generation schema for AI content generation form
export const generateContentSchema = z.object({
  contentType: contentTypeEnum,
  keywords: z
    .array(z.string().max(50))
    .min(1, "Add at least one keyword")
    .max(10, "Maximum 10 keywords allowed"),
  brandVoice: z.enum(["professional", "casual", "friendly", "authoritative", "playful"]),
  aiProvider: z.enum(["chatgpt", "claude"]), // ChatGPT and Claude supported
  streaming: z.boolean().optional(), // Add optional streaming flag
});

export type GenerateContentFormData = z.infer<typeof generateContentSchema>;
