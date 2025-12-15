import { z } from "zod";

// URL validation with protocol
const urlSchema = z
  .string()
  .min(1, "URL is required")
  .refine(
    (val) => {
      try {
        new URL(val.startsWith("http") ? val : `https://${val}`);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  );

// Audit request schema
export const auditRequestSchema = z.object({
  url: urlSchema,
  depth: z.enum(["single", "section", "full"]).default("single"),
  options: z
    .object({
      checkSchema: z.boolean().default(true),
      checkMeta: z.boolean().default(true),
      checkContent: z.boolean().default(true),
      checkLinks: z.boolean().default(true),
      checkPerformance: z.boolean().default(true),
      checkAccessibility: z.boolean().default(false),
      checkSecurity: z.boolean().default(false),
    })
    .optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  scheduleType: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
});

export type AuditRequestFormData = z.infer<typeof auditRequestSchema>;

// Batch audit schema
export const batchAuditSchema = z.object({
  urls: z
    .array(urlSchema)
    .min(1, "Add at least one URL")
    .max(100, "Maximum 100 URLs per batch"),
  options: z
    .object({
      checkSchema: z.boolean().default(true),
      checkMeta: z.boolean().default(true),
      checkContent: z.boolean().default(true),
    })
    .optional(),
});

export type BatchAuditFormData = z.infer<typeof batchAuditSchema>;

// Audit schedule schema
export const auditScheduleSchema = z.object({
  name: z
    .string()
    .min(1, "Schedule name is required")
    .max(100, "Name must be less than 100 characters"),
  urls: z
    .array(urlSchema)
    .min(1, "Add at least one URL"),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  timezone: z.string().default("UTC"),
  notifications: z
    .object({
      email: z.boolean().default(true),
      slack: z.boolean().default(false),
      webhook: z.string().url().optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
});

export type AuditScheduleFormData = z.infer<typeof auditScheduleSchema>;

// Audit comparison schema
export const auditComparisonSchema = z.object({
  auditIds: z
    .array(z.string().uuid())
    .min(2, "Select at least 2 audits to compare")
    .max(4, "Maximum 4 audits for comparison"),
  metrics: z
    .array(z.enum([
      "geoScore",
      "schemaMarkup",
      "metaTags",
      "contentQuality",
      "performance",
      "accessibility",
    ]))
    .min(1, "Select at least one metric"),
});

export type AuditComparisonFormData = z.infer<typeof auditComparisonSchema>;
