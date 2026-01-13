/**
 * Seed Engine Room - Populate brand_mentions table with sample data
 * This populates brand mentions across 6 AI platforms for testing
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Schema definitions
const aiPlatformEnum = pgEnum("ai_platform", [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "copilot",
]);

const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);

const brands = pgTable("brands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

const brandMentions = pgTable("brand_mentions", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").notNull(),
  platform: aiPlatformEnum("platform").notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),
  sentiment: sentimentEnum("sentiment").default("neutral").notNull(),
  position: integer("position"),
  citationUrl: text("citation_url"),
  competitors: jsonb("competitors").default([]),
  promptCategory: text("prompt_category"),
  topics: jsonb("topics").default([]),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Connect to DB
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Generate unique ID
function generateId() {
  return `mention_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Sample queries by category
const queries = {
  comparison: [
    "What are the best online shopping platforms in South Africa?",
    "Compare Takealot vs Makro vs Game online stores",
    "Which e-commerce site has the best delivery service in SA?",
    "Where can I buy electronics online in South Africa?",
  ],
  recommendation: [
    "Recommend a reliable online store for tech products in South Africa",
    "Where should I shop online for home appliances?",
    "What's the most trusted e-commerce platform in SA?",
    "Best place to buy books and media online in South Africa",
  ],
  review: [
    "Is Takealot a good online shopping platform?",
    "What do people think about Takealot's customer service?",
    "How reliable is Takealot for electronics?",
    "Takealot delivery times - are they fast?",
  ],
  general: [
    "Tell me about Takealot",
    "What is Takealot known for?",
    "Who are the main competitors to Takealot?",
    "How does Takealot's pricing compare to others?",
  ],
};

// Responses by platform and sentiment
const responses = {
  positive: [
    "Takealot is South Africa's leading online retailer, known for its extensive product range and reliable delivery service. They offer competitive pricing and excellent customer support.",
    "Takealot stands out as a premier e-commerce platform in South Africa, with a strong reputation for quality products and efficient logistics. Customers appreciate their user-friendly interface and wide selection.",
    "Among South African online retailers, Takealot is highly regarded for its comprehensive catalog and dependable service. They've built a solid reputation through consistent delivery and good customer care.",
  ],
  neutral: [
    "Takealot is a major online shopping platform in South Africa that sells electronics, books, and various consumer goods. They compete with Makro, Game, and Amazon.",
    "Takealot operates as an e-commerce marketplace in South Africa, offering products across multiple categories including technology, home goods, and media.",
    "As one of South Africa's established online retailers, Takealot provides a platform for purchasing various products with delivery options throughout the country.",
  ],
  negative: [
    "While Takealot is a popular option in South Africa, some customers report mixed experiences with delivery times and customer service responsiveness.",
    "Takealot has a large presence in the SA market, though it faces competition from other retailers that may offer better pricing or faster delivery in some categories.",
  ],
};

// Competitors for context
const competitors = [
  { name: "Amazon", position: 1, sentiment: "positive" },
  { name: "Walmart", position: 2, sentiment: "positive" },
  { name: "Makro", position: 3, sentiment: "neutral" },
  { name: "Game", position: 4, sentiment: "neutral" },
  { name: "eBay", position: 5, sentiment: "neutral" },
];

async function seedEngineRoom() {
  console.log("🌱 Seeding Engine Room Data...\n");

  // Find Takealot brand
  console.log("🔍 Finding Takealot brand...");
  const takealot = await db
    .select()
    .from(brands)
    .where(eq(brands.name, "Takealot.com"))
    .limit(1);

  if (takealot.length === 0) {
    console.error("❌ Takealot brand not found. Please create a brand first.");
    return;
  }

  const brandId = takealot[0].id;
  console.log(`✅ Found Takealot (${brandId})\n`);

  // Define platforms and their sentiment distributions
  const platforms = [
    { id: "chatgpt", name: "ChatGPT", positive: 12, neutral: 8, negative: 2 },
    { id: "claude", name: "Claude", positive: 10, neutral: 7, negative: 1 },
    { id: "gemini", name: "Gemini", positive: 9, neutral: 6, negative: 2 },
    { id: "perplexity", name: "Perplexity", positive: 8, neutral: 5, negative: 1 },
    { id: "grok", name: "Grok", positive: 6, neutral: 4, negative: 1 },
    { id: "deepseek", name: "DeepSeek", positive: 5, neutral: 3, negative: 1 },
  ];

  let totalMentions = 0;

  // Generate mentions for each platform
  for (const platform of platforms) {
    console.log(`\n📊 Generating mentions for ${platform.name}...`);

    // Generate positive mentions
    for (let i = 0; i < platform.positive; i++) {
      const category = Object.keys(queries)[Math.floor(Math.random() * Object.keys(queries).length)];
      const queryList = queries[category];
      const query = queryList[Math.floor(Math.random() * queryList.length)];
      const response = responses.positive[Math.floor(Math.random() * responses.positive.length)];

      await db.insert(brandMentions).values({
        id: generateId(),
        brandId,
        platform: platform.id,
        query,
        response,
        sentiment: "positive",
        position: Math.floor(Math.random() * 5) + 1, // Position 1-5
        citationUrl: Math.random() > 0.5 ? "https://www.takealot.com" : null,
        competitors: Math.random() > 0.7 ? competitors.slice(0, 3) : [],
        promptCategory: category,
        topics: ["e-commerce", "retail", "south africa"],
        metadata: {
          modelVersion: platform.name,
          responseLength: response.length,
          confidenceScore: 0.8 + Math.random() * 0.2,
        },
      });

      totalMentions++;
    }

    // Generate neutral mentions
    for (let i = 0; i < platform.neutral; i++) {
      const category = Object.keys(queries)[Math.floor(Math.random() * Object.keys(queries).length)];
      const queryList = queries[category];
      const query = queryList[Math.floor(Math.random() * queryList.length)];
      const response = responses.neutral[Math.floor(Math.random() * responses.neutral.length)];

      await db.insert(brandMentions).values({
        id: generateId(),
        brandId,
        platform: platform.id,
        query,
        response,
        sentiment: "neutral",
        position: Math.floor(Math.random() * 10) + 1, // Position 1-10
        citationUrl: Math.random() > 0.6 ? "https://www.takealot.com" : null,
        competitors: Math.random() > 0.5 ? competitors.slice(0, 4) : [],
        promptCategory: category,
        topics: ["e-commerce", "online shopping"],
        metadata: {
          modelVersion: platform.name,
          responseLength: response.length,
          confidenceScore: 0.6 + Math.random() * 0.2,
        },
      });

      totalMentions++;
    }

    // Generate negative mentions
    for (let i = 0; i < platform.negative; i++) {
      const category = Object.keys(queries)[Math.floor(Math.random() * Object.keys(queries).length)];
      const queryList = queries[category];
      const query = queryList[Math.floor(Math.random() * queryList.length)];
      const response = responses.negative[Math.floor(Math.random() * responses.negative.length)];

      await db.insert(brandMentions).values({
        id: generateId(),
        brandId,
        platform: platform.id,
        query,
        response,
        sentiment: "negative",
        position: Math.floor(Math.random() * 15) + 10, // Position 10-25
        citationUrl: null,
        competitors: competitors.slice(0, 5),
        promptCategory: category,
        topics: ["e-commerce", "customer service"],
        metadata: {
          modelVersion: platform.name,
          responseLength: response.length,
          confidenceScore: 0.5 + Math.random() * 0.2,
        },
      });

      totalMentions++;
    }

    console.log(`   ✅ ${platform.positive} positive, ${platform.neutral} neutral, ${platform.negative} negative`);
  }

  console.log(`\n✅ Successfully seeded ${totalMentions} brand mentions across ${platforms.length} platforms!`);
  console.log("\n🎯 Engine Room is now configured with data.");
  console.log("Navigate to http://localhost:3002/dashboard/engine-room to see it in action.\n");
}

seedEngineRoom().catch(console.error);
