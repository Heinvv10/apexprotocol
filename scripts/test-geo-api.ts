/**
 * Test GEO API Functions
 * Tests the GEO knowledge base functions that power the API endpoints
 * Run with: npx tsx scripts/test-geo-api.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import {
  getActiveBestPractices,
  getBestPracticesByPlatform,
  getHighImpactPractices,
  getKnowledgeBaseSummary,
  getCurrentSchemaTemplates,
  getSchemaTemplateByType,
} from "../src/lib/geo/knowledge-base";

async function testBestPracticesAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST: GEO Best Practices API Functions");
  console.log("=".repeat(60));

  // Test 1: Get all active best practices
  console.log("\n📋 Test 1: getActiveBestPractices()");
  try {
    const allPractices = await getActiveBestPractices();
    console.log(`   ✅ Retrieved ${allPractices.length} best practices`);
    if (allPractices.length > 0) {
      console.log(`   Sample: "${allPractices[0].title}" (${allPractices[0].platform}/${allPractices[0].category})`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 2: Filter by platform
  console.log("\n📋 Test 2: getActiveBestPractices(platform='all')");
  try {
    const allPlatform = await getActiveBestPractices("all", undefined);
    console.log(`   ✅ Retrieved ${allPlatform.length} practices for 'all' platform`);
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 3: Filter by category
  console.log("\n📋 Test 3: getActiveBestPractices(undefined, category='schema')");
  try {
    const schemaPractices = await getActiveBestPractices(undefined, "schema");
    console.log(`   ✅ Retrieved ${schemaPractices.length} schema practices`);
    schemaPractices.forEach(p => console.log(`      - ${p.title} (impact: ${p.impactScore})`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 4: Get by specific platform
  console.log("\n📋 Test 4: getBestPracticesByPlatform('gemini')");
  try {
    const geminiPractices = await getBestPracticesByPlatform("gemini");
    console.log(`   ✅ Retrieved ${geminiPractices.length} practices for Gemini`);
    geminiPractices.forEach(p => console.log(`      - ${p.title}`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 5: High impact practices
  console.log("\n📋 Test 5: getHighImpactPractices()");
  try {
    const highImpact = await getHighImpactPractices();
    console.log(`   ✅ Retrieved ${highImpact.length} high-impact practices (score >= 8)`);
    highImpact.forEach(p => console.log(`      - ${p.title} (impact: ${p.impactScore})`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 6: Knowledge base summary
  console.log("\n📋 Test 6: getKnowledgeBaseSummary()");
  try {
    const summary = await getKnowledgeBaseSummary();
    console.log(`   ✅ Summary retrieved:`);
    console.log(`      - Active Practices: ${summary.activePractices}`);
    console.log(`      - Deprecated Practices: ${summary.deprecatedPractices}`);
    console.log(`      - Schema Templates: ${summary.schemaTemplates}`);
    console.log(`      - Recent Changes (30d): ${summary.recentChanges}`);
    console.log(`      - Platform Coverage: ${JSON.stringify(summary.platformCoverage)}`);
    console.log(`      - Last Updated: ${summary.lastUpdated || 'never'}`);
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }
}

async function testSchemaTemplatesAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST: Schema Templates API Functions");
  console.log("=".repeat(60));

  // Test 1: Get all current templates
  console.log("\n📄 Test 1: getCurrentSchemaTemplates()");
  try {
    const templates = await getCurrentSchemaTemplates();
    console.log(`   ✅ Retrieved ${templates.length} current schema templates`);
    templates.forEach(t => console.log(`      - ${t.schemaType} v${t.version}`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 2: Get specific template
  console.log("\n📄 Test 2: getSchemaTemplateByType('FAQPage')");
  try {
    const faqTemplate = await getSchemaTemplateByType("FAQPage");
    if (faqTemplate) {
      console.log(`   ✅ Retrieved FAQPage template v${faqTemplate.version}`);
      console.log(`      Platform relevance: ChatGPT=${faqTemplate.platformRelevance?.chatgpt}, Perplexity=${faqTemplate.platformRelevance?.perplexity}`);
      console.log(`      Template code length: ${faqTemplate.templateCode.length} chars`);
    } else {
      console.log(`   ⚠️ FAQPage template not found`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  // Test 3: Get Organization template
  console.log("\n📄 Test 3: getSchemaTemplateByType('Organization')");
  try {
    const orgTemplate = await getSchemaTemplateByType("Organization");
    if (orgTemplate) {
      console.log(`   ✅ Retrieved Organization template v${orgTemplate.version}`);
      console.log(`      Instructions: ${orgTemplate.usageInstructions.substring(0, 80)}...`);
    } else {
      console.log(`   ⚠️ Organization template not found`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }
}

async function testPlatformChangesAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST: Platform Changes API Functions");
  console.log("=".repeat(60));

  // Import the platform monitor functions
  const { getPlatformMetrics, MONITORED_PLATFORMS, runFullPlatformAnalysis } = await import("../src/lib/geo/platform-monitor");
  const { getRecentPlatformChanges, getHighConfidenceChanges } = await import("../src/lib/geo/knowledge-base");

  console.log("\n🔍 Test 1: Get monitored platforms");
  console.log(`   ✅ Monitoring ${MONITORED_PLATFORMS.length} platforms: ${MONITORED_PLATFORMS.join(", ")}`);

  console.log("\n🔍 Test 2: getPlatformMetrics('chatgpt')");
  try {
    const metrics = await getPlatformMetrics("chatgpt", 30);
    console.log(`   ✅ ChatGPT metrics:`);
    console.log(`      - Mentions: ${metrics.mentionCount}`);
    console.log(`      - Citation rate: ${metrics.citationRate.toFixed(2)}`);
    console.log(`      - Top content types: ${metrics.topContentTypes.join(", ") || "none"}`);
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  console.log("\n🔍 Test 3: getRecentPlatformChanges()");
  try {
    const changes = await getRecentPlatformChanges(undefined, 5);
    console.log(`   ✅ Retrieved ${changes.length} recent platform changes`);
    changes.forEach(c => console.log(`      - ${c.platform}: ${c.changeType} (${c.confidenceScore}% confidence)`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  console.log("\n🔍 Test 4: getHighConfidenceChanges()");
  try {
    const highConf = await getHighConfidenceChanges();
    console.log(`   ✅ Retrieved ${highConf.length} high-confidence changes (>=70%)`);
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }
}

async function testAlertsAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST: GEO Alerts API Functions");
  console.log("=".repeat(60));

  const {
    getOrganizationAlerts,
    getAlertSummary,
  } = await import("../src/lib/geo/alert-generator");
  const { recordPlatformChange } = await import("../src/lib/geo/knowledge-base");

  // Use a test organization ID
  const testOrgId = "00000000-0000-0000-0000-000000000001";

  console.log("\n🔔 Test 1: getOrganizationAlerts()");
  try {
    const alerts = await getOrganizationAlerts(testOrgId, { limit: 5 });
    console.log(`   ✅ Retrieved ${alerts.length} alerts for test org`);
    alerts.forEach(a => console.log(`      - [${a.severity}] ${a.title}`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  console.log("\n🔔 Test 2: getAlertSummary()");
  try {
    const summary = await getAlertSummary(testOrgId);
    console.log(`   ✅ Alert summary:`);
    console.log(`      - Total: ${summary.total}`);
    console.log(`      - Unread: ${summary.unread}`);
    console.log(`      - Critical: ${summary.critical}`);
    console.log(`      - Action Required: ${summary.actionRequired}`);
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }
}

async function testPipelineAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST: GEO Pipeline API Functions");
  console.log("=".repeat(60));

  const { getPipelineHistory, getLastSuccessfulRun } = await import("../src/lib/geo/update-pipeline");

  console.log("\n⚙️ Test 1: getPipelineHistory()");
  try {
    const history = await getPipelineHistory(5);
    console.log(`   ✅ Retrieved ${history.length} pipeline runs`);
    history.forEach(h => console.log(`      - ${h.updateType}: ${h.success ? '✓' : '✗'} (${h.itemsAdded} added)`));
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  console.log("\n⚙️ Test 2: getLastSuccessfulRun()");
  try {
    const lastRun = await getLastSuccessfulRun();
    if (lastRun) {
      console.log(`   ✅ Last successful run: ${lastRun.updateType} at ${lastRun.createdAt}`);
    } else {
      console.log(`   ⚠️ No successful pipeline runs found`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }
}

async function main() {
  console.log("\n🧪 GEO API Functions Test Suite");
  console.log("================================\n");

  await testBestPracticesAPI();
  await testSchemaTemplatesAPI();
  await testPlatformChangesAPI();
  await testAlertsAPI();
  await testPipelineAPI();

  console.log("\n" + "=".repeat(60));
  console.log("TEST SUITE COMPLETE");
  console.log("=".repeat(60) + "\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Test suite failed:", err);
  process.exit(1);
});
