/**
 * AI Crawler Audit Check
 * Checks robots.txt to identify blocked AI crawlers that impact GEO visibility
 */

import { createId } from "@paralleldrive/cuid2";
import type { AuditIssue } from "@/lib/db/schema/audits";

// AI crawler user agents that affect GEO visibility
const AI_CRAWLERS = [
  {
    userAgent: "GPTBot",
    name: "GPTBot (OpenAI)",
    platform: "ChatGPT",
    trafficShare: "35%",
  },
  {
    userAgent: "ClaudeBot",
    name: "ClaudeBot (Anthropic)",
    platform: "Claude",
    trafficShare: "15%",
  },
  {
    userAgent: "PerplexityBot",
    name: "PerplexityBot",
    platform: "Perplexity",
    trafficShare: "18%",
  },
  {
    userAgent: "GoogleOther",
    name: "GoogleOther (Google AI)",
    platform: "Gemini",
    trafficShare: "20%",
  },
  {
    userAgent: "anthropic-ai",
    name: "anthropic-ai",
    platform: "Claude",
    trafficShare: "15%",
  },
];

interface RobotsTxtRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

/**
 * Parse robots.txt content into structured rules
 */
function parseRobotsTxt(content: string): RobotsTxtRule[] {
  const rules: RobotsTxtRule[] = [];
  const lines = content.split("\n").map((line) => line.trim());

  let currentUserAgent: string | null = null;
  let currentDisallow: string[] = [];
  let currentAllow: string[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith("#") || line === "") {
      continue;
    }

    const lowerLine = line.toLowerCase();

    if (lowerLine.startsWith("user-agent:")) {
      // Save previous rule if exists
      if (currentUserAgent) {
        rules.push({
          userAgent: currentUserAgent,
          disallow: currentDisallow,
          allow: currentAllow,
        });
      }

      // Start new rule
      currentUserAgent = line.substring("user-agent:".length).trim();
      currentDisallow = [];
      currentAllow = [];
    } else if (lowerLine.startsWith("disallow:") && currentUserAgent) {
      const path = line.substring("disallow:".length).trim();
      if (path) {
        currentDisallow.push(path);
      }
    } else if (lowerLine.startsWith("allow:") && currentUserAgent) {
      const path = line.substring("allow:".length).trim();
      if (path) {
        currentAllow.push(path);
      }
    }
  }

  // Save last rule
  if (currentUserAgent) {
    rules.push({
      userAgent: currentUserAgent,
      disallow: currentDisallow,
      allow: currentAllow,
    });
  }

  return rules;
}

/**
 * Check if a specific user agent is blocked
 */
function isUserAgentBlocked(
  rules: RobotsTxtRule[],
  userAgent: string
): boolean {
  // Check for specific user agent rules
  const specificRule = rules.find(
    (r) => r.userAgent.toLowerCase() === userAgent.toLowerCase()
  );

  if (specificRule) {
    // If Disallow: / is present, the bot is fully blocked
    return specificRule.disallow.includes("/");
  }

  // Check wildcard rules
  const wildcardRule = rules.find((r) => r.userAgent === "*");
  if (wildcardRule) {
    // Only consider blocked if disallow root and no specific allow for this agent
    return wildcardRule.disallow.includes("/");
  }

  return false;
}

/**
 * Check AI crawlers in robots.txt
 * @param url - The URL to check (will fetch {url}/robots.txt)
 * @returns Array of AuditIssue for any blocked AI crawlers
 */
export async function checkAiCrawlers(url: string): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];

  try {
    // Normalize URL to get base domain
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    // Fetch robots.txt with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ApexGEO-Auditor/1.0",
      },
    });

    clearTimeout(timeoutId);

    // Handle 404 - robots.txt not found
    if (response.status === 404) {
      issues.push({
        id: createId(),
        category: "ai_crawlability",
        severity: "low",
        title: "No robots.txt file found",
        description:
          "The website does not have a robots.txt file. While this means AI crawlers are not explicitly blocked, having a robots.txt with explicit allow rules for AI bots signals crawler-friendliness.",
        recommendation:
          "Create a robots.txt file and explicitly allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot, GoogleOther) to crawl your content.",
        impact: "Missing robots.txt may indicate less intentional SEO/GEO optimization.",
      });
      return issues;
    }

    // Handle other error responses
    if (!response.ok) {
      issues.push({
        id: createId(),
        category: "ai_crawlability",
        severity: "low",
        title: "Unable to access robots.txt",
        description: `The robots.txt file returned HTTP ${response.status}. AI crawler access rules cannot be determined.`,
        recommendation:
          "Ensure your robots.txt is accessible at the root of your domain.",
        impact: "Cannot verify AI crawler access permissions.",
      });
      return issues;
    }

    // Parse robots.txt
    const content = await response.text();
    const rules = parseRobotsTxt(content);

    // Check each AI crawler
    for (const crawler of AI_CRAWLERS) {
      if (isUserAgentBlocked(rules, crawler.userAgent)) {
        issues.push({
          id: createId(),
          category: "ai_crawlability",
          severity: "high",
          title: `${crawler.name} is blocked in robots.txt`,
          description: `Your robots.txt explicitly blocks ${crawler.userAgent}, preventing ${crawler.platform} from crawling your content. This platform represents approximately ${crawler.trafficShare} of AI-referred traffic.`,
          recommendation: `Remove the Disallow: / rule for ${crawler.userAgent} or add an explicit Allow: / rule. Consider which AI platforms you want indexing your content for GEO visibility.`,
          impact: `Your brand will not appear in ${crawler.platform} responses, losing potential visibility and citations from this AI platform.`,
        });
      }
    }

    // If no issues found, good standing
    if (issues.length === 0) {
      // No issues to add - AI crawlers are allowed
    }
  } catch (error) {
    // Handle timeout or network errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      issues.push({
        id: createId(),
        category: "ai_crawlability",
        severity: "low",
        title: "Timeout fetching robots.txt",
        description:
          "The robots.txt file took too long to fetch (>5s timeout). AI crawler access rules cannot be determined.",
        recommendation:
          "Ensure your server responds quickly to requests at the root level.",
        impact: "Cannot verify AI crawler access permissions due to slow response.",
      });
    } else {
      issues.push({
        id: createId(),
        category: "ai_crawlability",
        severity: "low",
        title: "Error fetching robots.txt",
        description: `Failed to fetch robots.txt: ${error instanceof Error ? error.message : "Unknown error"}`,
        recommendation:
          "Ensure your robots.txt is accessible and your server is responding correctly.",
        impact: "Cannot verify AI crawler access permissions.",
      });
    }
  }

  return issues;
}
