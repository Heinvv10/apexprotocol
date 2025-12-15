import { z } from "zod";

// Brand schema
export const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required")
    .max(100, "Brand name must be less than 100 characters"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Please enter a valid domain (e.g., example.com)"
    ),
  industry: z.string().min(1, "Industry is required"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  competitors: z
    .array(z.string().max(100))
    .max(10, "Maximum 10 competitors allowed")
    .optional(),
  keywords: z
    .array(z.string().max(50))
    .max(20, "Maximum 20 keywords allowed")
    .optional(),
  socialProfiles: z
    .object({
      twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
      linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
      facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
      instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
    })
    .optional(),
});

export type BrandFormData = z.infer<typeof brandSchema>;

// Brand voice settings
export const brandVoiceSchema = z.object({
  tone: z.enum(["professional", "casual", "friendly", "authoritative", "playful"]),
  personality: z.array(z.string()).min(1, "Select at least one personality trait"),
  doUse: z.array(z.string()).optional(),
  dontUse: z.array(z.string()).optional(),
  examples: z
    .array(
      z.object({
        type: z.enum(["tagline", "headline", "body", "social"]),
        content: z.string().min(1).max(500),
      })
    )
    .optional(),
});

export type BrandVoiceFormData = z.infer<typeof brandVoiceSchema>;

// Brand colors/visual identity
export const brandVisualSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .optional(),
  logo: z.string().url("Invalid logo URL").optional(),
  favicon: z.string().url("Invalid favicon URL").optional(),
});

export type BrandVisualFormData = z.infer<typeof brandVisualSchema>;
