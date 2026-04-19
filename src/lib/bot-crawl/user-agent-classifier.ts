/**
 * Normalize a raw User-Agent string into an AI-crawler enum value.
 *
 * Keep this list in sync with the ai_crawler pgEnum. When adding a new
 * crawler: add it to the enum (bot-crawls.ts), add the regex here, and
 * add traffic-share metadata to the robots.txt checker.
 */

export type AiCrawler =
  | "gptbot"
  | "chatgpt_user"
  | "oai_searchbot"
  | "claudebot"
  | "anthropic_ai"
  | "claude_web"
  | "perplexitybot"
  | "perplexity_user"
  | "google_extended"
  | "googleother"
  | "bingbot_gpt"
  | "meta_externalagent"
  | "ccbot"
  | "unknown";

interface ClassifierRule {
  crawler: AiCrawler;
  match: RegExp;
}

const RULES: ClassifierRule[] = [
  { crawler: "gptbot", match: /GPTBot/i },
  { crawler: "chatgpt_user", match: /ChatGPT-User/i },
  { crawler: "oai_searchbot", match: /OAI-SearchBot/i },
  { crawler: "claudebot", match: /ClaudeBot/i },
  { crawler: "anthropic_ai", match: /anthropic-ai/i },
  { crawler: "claude_web", match: /Claude-Web/i },
  { crawler: "perplexitybot", match: /PerplexityBot/i },
  { crawler: "perplexity_user", match: /Perplexity-User/i },
  { crawler: "google_extended", match: /Google-Extended/i },
  { crawler: "googleother", match: /GoogleOther/i },
  { crawler: "bingbot_gpt", match: /bingbot.+GPTBot|msnbot.+GPT/i },
  { crawler: "meta_externalagent", match: /meta-externalagent/i },
  { crawler: "ccbot", match: /CCBot/i },
];

export function classifyUserAgent(ua: string | null | undefined): AiCrawler {
  if (!ua) return "unknown";
  for (const rule of RULES) {
    if (rule.match.test(ua)) return rule.crawler;
  }
  return "unknown";
}

/**
 * True iff the UA matches one of the known AI crawlers. Used by the
 * ingest webhook to drop non-AI traffic before writing rows.
 */
export function isKnownAiCrawler(ua: string | null | undefined): boolean {
  return classifyUserAgent(ua) !== "unknown";
}

/**
 * Redact an IP to /24 (IPv4) or /48 (IPv6) for storage. We need enough
 * to rate-limit + spot abuse patterns, not enough to fingerprint a visitor.
 */
export function redactIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (trimmed.includes(".")) {
    // IPv4 — drop last octet
    const parts = trimmed.split(".");
    if (parts.length !== 4) return null;
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  if (trimmed.includes(":")) {
    // IPv6 — keep first 3 groups (approx /48)
    const parts = trimmed.split(":");
    return parts.slice(0, 3).join(":") + "::/48";
  }
  return null;
}
