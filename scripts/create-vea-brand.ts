import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { brands } from "../src/lib/db/schema/brands";
import { createId } from "@paralleldrive/cuid2";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function createVEABrand() {
  const brandId = createId();
  const organizationId = "s5emwdzfollhth1819bprw2a"; // Apex Demo Company

  console.log("Creating VEA Group brand...");
  console.log("Brand ID:", brandId);
  console.log("Organization ID:", organizationId);

  // Create brand with new schema structure
  await db.insert(brands).values({
    id: brandId,
    organizationId: organizationId,
    name: "VEA Group",
    domain: "veagroup.co.za",
    description: "VEA Group is a leading South African investment holding company specializing in technology, telecommunications, and digital infrastructure. The group focuses on strategic investments across various sectors including cybersecurity, cloud computing, and digital transformation services.",
    tagline: "Leading Technology Investment Across Africa",
    industry: "Technology & Telecommunications",
    keywords: ["technology investment", "telecommunications", "digital infrastructure", "South Africa IT"],
    seoKeywords: ["VEA Group", "South African tech", "telecommunications investment", "digital transformation"],
    geoKeywords: ["cybersecurity", "cloud computing", "enterprise technology", "IT infrastructure"],
    competitors: [
      { name: "Naspers", url: "https://www.naspers.com", reason: "Major South African tech investment company" },
      { name: "MTN Group", url: "https://www.mtn.com", reason: "Leading telecommunications provider" },
      { name: "Vodacom", url: "https://www.vodacom.co.za", reason: "Major mobile network operator" },
      { name: "Telkom", url: "https://www.telkom.co.za", reason: "Integrated telecommunications provider" }
    ],
    valuePropositions: [
      "Strategic technology investments across Africa",
      "Focus on digital infrastructure and transformation",
      "Expertise in cybersecurity and cloud computing",
      "Enterprise-grade telecommunications solutions"
    ],
    socialLinks: {},
    voice: {
      tone: "professional",
      personality: ["innovative", "strategic", "reliable", "forward-thinking"],
      targetAudience: "Enterprise IT decision makers, CTOs, CIOs, and business leaders in South Africa",
      keyMessages: [
        "Leading technology investment in Africa",
        "Driving digital transformation",
        "Enterprise-grade solutions"
      ],
      avoidTopics: []
    },
    visual: {
      primaryColor: "#1E40AF",
      secondaryColor: null,
      accentColor: null,
      colorPalette: ["#1E40AF", "#3B82F6", "#60A5FA"],
      fontFamily: null
    },
    monitoringEnabled: true,
    monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log("✅ VEA Group brand created successfully!");
  console.log("Brand ID:", brandId);
  console.log("Monitoring enabled for platforms:", ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek"]);

  process.exit(0);
}

createVEABrand().catch((err) => {
  console.error("❌ Error creating brand:", err);
  process.exit(1);
});
