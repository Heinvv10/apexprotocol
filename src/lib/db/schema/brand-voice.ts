/**
 * Brand voice samples + extracted style descriptors.
 *
 * FR-CRE-002 v0.5 — "Brand voice" starts simple: user uploads 1-5 samples,
 * we extract a structured style descriptor once per sample, then inject
 * those descriptors into every content-generation prompt for that brand.
 *
 * v1.0 (later) will add embedding-based similarity scoring and eval. The
 * schema below leaves room for that without needing a migration: the
 * `descriptorJson` column is jsonb so we can add fields freely.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { users } from "./users";

export const brandVoiceSourceTypeEnum = pgEnum("brand_voice_source_type", [
  "paste",
  "url",
  "upload",
]);

/**
 * Voice descriptor — structured output from the LLM extractor.
 * Fields are intentionally narrow; we want the generator to consume them
 * without having to re-interpret prose.
 */
export interface BrandVoiceDescriptor {
  /** Natural-language tone description (e.g. "warm, technical, slightly irreverent") */
  tone: string;
  /** Target reading level (Flesch-Kincaid grade, approx.) */
  readingLevel: number;
  /** Formality 0..10 (0 = casual chat, 10 = academic) */
  formality: number;
  /** Average words per sentence across the samples */
  avgSentenceLength: number;
  /** Sentence-length std-dev — higher = more burstiness (preserve) */
  sentenceLengthStdev: number;
  /** Vocabulary patterns — e.g. prefers "we/our", avoids passive voice */
  vocabulary: string[];
  /** Signature phrases or callbacks the brand uses repeatedly */
  signaturePhrases: string[];
  /** Words/phrases the brand explicitly avoids (clichés, buzzwords) */
  avoid: string[];
  /** Perspective the brand writes from */
  perspective: "first_person_singular" | "first_person_plural" | "second_person" | "third_person" | "mixed";
  /** Extractor model + version for audit/replay */
  extractedWith?: {
    model: string;
    version: string;
    extractedAt: string;
  };
}

export const brandVoiceSamples = pgTable(
  "brand_voice_samples",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),

    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    /** Human label for this sample */
    label: text("label").notNull(),
    sourceType: brandVoiceSourceTypeEnum("source_type").notNull(),
    /** Original URL if sourceType = url */
    sourceUrl: text("source_url"),
    /** Raw text — capped at 40k chars by app validation */
    rawText: text("raw_text").notNull(),

    /** Extracted descriptor — null until extraction runs */
    descriptorJson: jsonb("descriptor_json").$type<BrandVoiceDescriptor>(),
    extractionError: text("extraction_error"),
    extractedAt: timestamp("extracted_at", { withTimezone: true }),

    /** Schema version — bump when BrandVoiceDescriptor shape changes */
    schemaVersion: text("schema_version").notNull().default("0.5"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("brand_voice_samples_brand_created_idx").on(
      t.brandId,
      t.createdAt.desc(),
    ),
  ],
);

export const brandVoiceSamplesRelations = relations(
  brandVoiceSamples,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandVoiceSamples.brandId],
      references: [brands.id],
    }),
    createdBy: one(users, {
      fields: [brandVoiceSamples.createdById],
      references: [users.id],
    }),
  }),
);

export type BrandVoiceSample = typeof brandVoiceSamples.$inferSelect;
export type NewBrandVoiceSample = typeof brandVoiceSamples.$inferInsert;
