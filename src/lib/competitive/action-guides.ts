/**
 * Step-by-step guidance for every roadmap action item.
 *
 * Each milestone template in roadmap-generator.ts only stores the action
 * item's title (e.g. "Run PageSpeed Insights on top 10 pages"). That's
 * not enough for a user who's never used PageSpeed Insights. This module
 * is the how-to manual: it maps each action title → structured guidance
 * including steps, external tool links, and — where available — an
 * in-app Apex tool that can do the work for them.
 *
 * Resolution is by exact title match against ACTION_GUIDES keys. If a
 * template title is renamed, update the key here too. ACTION_GUIDES is
 * the source of truth for "how to do this" copy shown in the UI.
 */

export interface ExternalResource {
  label: string;
  url: string;
  /** Short note on what this tool is for. Keeps links self-explaining. */
  note?: string;
}

/**
 * Apex-internal tool that can partially or fully automate the action.
 * When present, the UI shows a "Use Apex tool" CTA on that action item.
 */
export interface ApexTool {
  kind:
    | "faq_schema_generator"
    | "meta_tag_suggester"
    | "pagespeed_scan"
    | "content_brief_generator"
    | "schema_markup_builder";
  /** Path to the tool inside /dashboard/... */
  href: string;
  /** Button label shown to the user */
  cta: string;
  /** One-sentence description for the button's hover/tooltip */
  description: string;
}

export interface ActionGuide {
  /** 1-2 sentence rationale — "why does this action matter?" */
  why: string;
  /** Concrete step-by-step instructions. Each step is a short sentence. */
  steps: string[];
  /** Useful external tools / docs, in preferred order. */
  resources?: ExternalResource[];
  /** Optional apex tool that automates part of this action. */
  tool?: ApexTool;
  /** Estimated time in minutes to complete when following steps. */
  estMinutes?: number;
}

export const ACTION_GUIDES: Record<string, ActionGuide> = {
  // ============================================================
  // GEO — Add FAQ Schema Markup
  // ============================================================
  "Identify top 10 FAQ questions from customer support": {
    why: "AI assistants favor content that directly answers specific questions. Using your real support tickets as source material guarantees the questions are ones users actually ask.",
    steps: [
      "Pull the 200 most recent support tickets / chat logs from the last 90 days.",
      "Group tickets by recurring theme (e.g. pricing, cancellation, integration).",
      "For each theme, pick the single most-asked question as the canonical phrasing.",
      "Write the 10 questions in plain language exactly as a user would ask them.",
      "Save this list — you'll reuse it for the next two action items.",
    ],
    estMinutes: 30,
  },
  "Write clear, concise answers for each question": {
    why: "FAQ answers that get cited by AI are short (2–3 sentences), direct, and include specific facts. Avoid marketing fluff.",
    steps: [
      "For each question, write a one-sentence direct answer first.",
      "Add 1–2 sentences of context, fact, or example.",
      "Keep each answer under 60 words total.",
      "Read it aloud — if it sounds like marketing copy, rewrite it as plain statement of fact.",
      "Have a subject-matter expert fact-check the final answers.",
    ],
    estMinutes: 60,
  },
  "Add FAQ schema markup to relevant pages": {
    why: "FAQPage JSON-LD is the #1 markup AI crawlers parse to extract Q&A pairs. Without it, your carefully-written answers stay invisible to LLMs.",
    steps: [
      "Open the Apex FAQ Schema Generator (button below).",
      "Paste each Q&A pair into the generator.",
      "Copy the produced JSON-LD block.",
      "Paste the block inside the `<head>` of the page containing those FAQs.",
      "Deploy the change and validate with Google's Rich Results Test (link below).",
    ],
    resources: [
      { label: "Google Rich Results Test", url: "https://search.google.com/test/rich-results", note: "Paste a URL — confirms the FAQ schema is detected." },
      { label: "Schema.org FAQPage reference", url: "https://schema.org/FAQPage" },
    ],
    tool: {
      kind: "faq_schema_generator",
      href: "/dashboard/tools/faq-schema",
      cta: "Generate FAQ schema",
      description: "Paste your Q&As, get ready-to-deploy JSON-LD.",
    },
    estMinutes: 20,
  },
  "Test with Google Rich Results Test": {
    why: "If Google can't parse your schema, neither can most AI crawlers. This is the 30-second feedback loop that catches typos before they ship.",
    steps: [
      "Go to search.google.com/test/rich-results (link below).",
      "Paste the URL of the page that now has FAQ schema.",
      "Click \"Test URL\" and wait ~15 seconds.",
      "Verify the \"FAQ\" card shows all your questions.",
      "Fix any errors/warnings reported (usually missing `acceptedAnswer.text`).",
    ],
    resources: [
      { label: "Google Rich Results Test", url: "https://search.google.com/test/rich-results" },
    ],
    estMinutes: 10,
  },

  // ============================================================
  // GEO — Optimize Content for AI Citations
  // ============================================================
  "Audit top 5 pages for citation opportunities": {
    why: "Not all pages are citation candidates. Find the ones that already have authority (backlinks, long-form) and upgrade those first.",
    steps: [
      "In Google Search Console, sort pages by impressions desc over the last 90 days.",
      "Pick the top 5 pages that aren't homepage or product pages.",
      "For each, note the word count, presence of data/statistics, and heading structure.",
      "Flag pages missing: data citations, bullet summaries, clear H2 questions.",
      "Rank by \"effort to fix\" — prioritize pages with the highest impressions + lowest effort.",
    ],
    resources: [
      { label: "Google Search Console", url: "https://search.google.com/search-console" },
    ],
    estMinutes: 45,
  },
  "Add clear, factual statements with sources": {
    why: "LLMs weight content heavily when it includes verifiable facts and cites sources. \"According to [X]…\" patterns are disproportionately cited.",
    steps: [
      "For each claim in the page, ask: \"Could a skeptical reader verify this?\"",
      "Add an inline citation or link for every non-obvious factual statement.",
      "Prefer primary sources (studies, data releases) over blog posts.",
      "Use phrases like \"According to [source]\" or \"Data from [X] shows\" — these are LLM-friendly patterns.",
      "Replace any \"many experts agree\"-style vague claims with a specific attributed quote.",
    ],
    estMinutes: 90,
  },
  "Include statistics and data points": {
    why: "Pages with numeric data are cited ~3× more often by AI assistants than purely descriptive pages.",
    steps: [
      "Find 3–5 statistics relevant to your topic (industry reports, your own data, public datasets).",
      "Lead each major section with a number — e.g. \"67% of B2B buyers…\".",
      "Format as callout: `<strong>67%</strong> of buyers…` so it stands out visually.",
      "Cite the source inline on first mention.",
      "Add a \"Key stats\" callout box at the top of the article.",
    ],
    estMinutes: 45,
  },
  "Use bullet points and numbered lists": {
    why: "AI crawlers extract list items individually. A bulleted answer to a question is more quotable than a paragraph.",
    steps: [
      "Scan each H2/H3 section — if the content is a sequence or set, convert to a list.",
      "Use numbered lists for steps, bulleted lists for sets.",
      "Keep each item to one line where possible.",
      "Start each bullet with a strong verb or noun (not \"there is/are\").",
      "Don't over-list — if everything is a bullet, nothing stands out.",
    ],
    estMinutes: 30,
  },
  "Add author expertise signals (bio, credentials)": {
    why: "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) drives AI citation weighting. Anonymous content gets cited less.",
    steps: [
      "Add a visible author byline to every content page.",
      "Link the byline to a full author bio page.",
      "Include credentials (education, certs, years in role) on the bio.",
      "Add Person schema markup to the bio page (name, jobTitle, sameAs for social).",
      "Link to author's LinkedIn + any other authoritative profiles.",
    ],
    resources: [
      { label: "Schema.org Person type", url: "https://schema.org/Person" },
    ],
    estMinutes: 60,
  },

  // ============================================================
  // SEO — Fix Critical Meta Tags
  // ============================================================
  "Export list of all pages missing meta tags": {
    why: "You can't fix what you haven't inventoried. 40%+ of sites have at least one page with duplicate or missing meta tags.",
    steps: [
      "Open Google Search Console → Coverage report.",
      "Filter for \"Duplicate meta descriptions\" and \"Missing meta descriptions\".",
      "Export the full list to CSV.",
      "Alternatively: run Screaming Frog (free for ≤500 URLs) against your sitemap.",
      "Sort by impressions desc so you fix highest-traffic pages first.",
    ],
    resources: [
      { label: "Google Search Console", url: "https://search.google.com/search-console" },
      { label: "Screaming Frog SEO Spider", url: "https://www.screamingfrog.co.uk/seo-spider/", note: "Free for up to 500 URLs." },
    ],
    estMinutes: 20,
  },
  "Write unique titles (50-60 chars) for each page": {
    why: "50–60 chars is the sweet spot: Google truncates at ~60, and shorter titles get higher CTR. Each page needs a unique one.",
    steps: [
      "For each page, identify the primary keyword + user intent.",
      "Draft: `[Primary Keyword] — [Value Prop] | [Brand]`.",
      "Count characters — trim to ≤60 without losing the keyword.",
      "Check no two pages have the same title (grep your exports).",
      "Apply A/B test on 5 high-traffic pages to validate CTR lift.",
    ],
    estMinutes: 90,
  },
  "Write compelling descriptions (150-160 chars)": {
    why: "Meta descriptions don't directly rank but drive CTR. A good one summarizes the answer and includes a verb.",
    steps: [
      "Start with an action verb (Learn, Discover, See, Compare).",
      "Include the primary keyword early (first 100 chars).",
      "State the specific benefit or outcome.",
      "End with a soft CTA where natural.",
      "Keep under 160 chars — Google truncates mobile at ~155.",
    ],
    estMinutes: 60,
  },
  "Implement changes and verify with SEO tool": {
    why: "Writing titles is 10% of the job — deploying correctly and verifying is the other 90%.",
    steps: [
      "Push changes to staging, not prod, first.",
      "Use Screaming Frog or Sitebulb to re-crawl and diff titles/descs.",
      "Verify no pages now have empty `<title>` due to CMS templating bugs.",
      "Promote to prod.",
      "Request re-indexing in Search Console for the top-10 pages.",
    ],
    resources: [
      { label: "GSC URL Inspection (request indexing)", url: "https://search.google.com/search-console" },
    ],
    estMinutes: 30,
  },

  // ============================================================
  // SEO — Implement Core Web Vitals Fixes
  // ============================================================
  "Run PageSpeed Insights on top 10 pages": {
    why: "Core Web Vitals (LCP, CLS, INP) are Google ranking signals. PageSpeed Insights gives you the exact metric values plus prioritized fixes.",
    steps: [
      "Open pagespeed.web.dev (link below).",
      "Paste your homepage URL → click Analyze.",
      "Wait ~30 seconds for the lab + field data to load.",
      "Note the mobile scores for LCP, CLS, INP, TBT — mobile matters more than desktop.",
      "Repeat for your 9 next-highest-traffic URLs. Save a spreadsheet of the numbers.",
    ],
    resources: [
      { label: "PageSpeed Insights", url: "https://pagespeed.web.dev" },
      { label: "web.dev Core Web Vitals guide", url: "https://web.dev/articles/vitals" },
    ],
    estMinutes: 30,
  },
  "Optimize image sizes and formats": {
    why: "Unoptimized images are the #1 cause of slow LCP. Switching to WebP/AVIF and right-sizing often halves page weight.",
    steps: [
      "Audit page weight — look for any image > 200 KB.",
      "Convert all JPG/PNG to WebP (tools: Squoosh, ImageOptim, or your CMS's built-in).",
      "Generate responsive `srcset` variants (1×, 2×, and smaller sizes for mobile).",
      "Add `width` + `height` attributes on every `<img>` to prevent CLS.",
      "Set `loading=\"lazy\"` on all below-the-fold images.",
    ],
    resources: [
      { label: "Squoosh (free image optimizer)", url: "https://squoosh.app" },
    ],
    estMinutes: 120,
  },
  "Implement lazy loading for images": {
    why: "Lazy-loading defers off-screen images, improving LCP by ~20–40% on image-heavy pages.",
    steps: [
      "For every `<img>` that isn't the LCP candidate, add `loading=\"lazy\"`.",
      "For iframes (YouTube embeds, etc.) add `loading=\"lazy\"` too.",
      "For the LCP image specifically, set `fetchpriority=\"high\"` and `loading=\"eager\"`.",
      "Test via Chrome DevTools → Network → disable cache → throttle to Slow 4G.",
      "Confirm LCP image downloads first, below-fold images queued.",
    ],
    estMinutes: 45,
  },
  "Minimize JavaScript blocking time": {
    why: "Total Blocking Time (TBT) and INP are driven by heavy JS. Deferring non-critical scripts moves these metrics into the green.",
    steps: [
      "Audit your `<head>` — any `<script>` without `async` or `defer` is blocking.",
      "Add `defer` to non-critical scripts (analytics, chat widgets, A/B test SDKs).",
      "Move 3rd-party tags below the fold where possible, or load on interaction.",
      "Use PageSpeed Insights' \"Reduce unused JavaScript\" to find dead code.",
      "Consider tree-shaking or dynamic imports for heavy client components.",
    ],
    estMinutes: 90,
  },
  "Re-test and document improvements": {
    why: "Without a before/after metric, you can't prove the work moved the needle — and Google's ranking signals use field data, not lab.",
    steps: [
      "Re-run PageSpeed Insights on the same 10 pages you baselined.",
      "Record the new LCP / CLS / INP / TBT numbers.",
      "Wait 28 days for field data (Chrome UX Report) to update — that's the one Google uses for ranking.",
      "Diff before vs after in your spreadsheet. Calculate % improvement per metric.",
      "If any metric regressed, isolate which change caused it and revert/refine.",
    ],
    resources: [
      { label: "Chrome UX Report", url: "https://developer.chrome.com/docs/crux" },
    ],
    estMinutes: 30,
  },

  // ============================================================
  // AEO — Create Conversational Content
  // ============================================================
  "Research top questions in your industry": {
    why: "Conversational AI mirrors how people ask questions. Ranking for \"how do I X\" beats ranking for \"X tool\".",
    steps: [
      "Use AlsoAsked or AnswerThePublic (links below) — enter your primary keyword.",
      "Download the top 30 People-Also-Ask questions for your topic.",
      "Check Google Trends for volume — prioritize rising-interest questions.",
      "Cross-reference with your sales team's FAQ.",
      "Shortlist 10 questions you'll answer in dedicated content pieces.",
    ],
    resources: [
      { label: "AlsoAsked", url: "https://alsoasked.com" },
      { label: "AnswerThePublic", url: "https://answerthepublic.com" },
      { label: "Google Trends", url: "https://trends.google.com" },
    ],
    estMinutes: 60,
  },
  "Create direct answer content for each": {
    why: "Each piece of content should answer ONE specific question in the first 2 sentences. LLMs extract that opening as the answer.",
    steps: [
      "Open every new article with: \"[Question restated as statement]. [Direct answer].\"",
      "Follow up with 2–3 supporting paragraphs of detail.",
      "Include a TL;DR callout near the top for scanners and AI crawlers alike.",
      "Target 800–1500 words per piece — long enough for depth, short enough to stay on topic.",
      "End with 2–3 related questions (with links to your answers) to create a topical cluster.",
    ],
    estMinutes: 180,
  },
  "Structure with clear headers and summaries": {
    why: "Scannable structure lets LLMs pull specific sections as answers without returning the whole page.",
    steps: [
      "Every article has one H1 (the question or topic).",
      "H2s are specific sub-questions: \"How do I…\", \"What is…\", \"Why does…\".",
      "Immediately under each H2, write a 1–2 sentence summary answer.",
      "Use bulleted/numbered lists anywhere the content is a sequence or set.",
      "Add a \"Key Takeaways\" bullet list at the end of each article.",
    ],
    estMinutes: 45,
  },
  "Add internal links to related content": {
    why: "Internal links establish topical authority and help AI crawlers understand your content's relationships.",
    steps: [
      "Identify your pillar page for this topic (the most comprehensive piece).",
      "Link every supporting article back to the pillar in the first 2 paragraphs.",
      "Link between supporting articles where genuinely related.",
      "Use descriptive anchor text — \"learn how FAQ schema works\" not \"click here\".",
      "Aim for 3–5 internal links per 1000 words.",
    ],
    estMinutes: 45,
  },

  // ============================================================
  // SMO — Establish Consistent Posting Schedule
  // ============================================================
  "Audit current posting frequency across platforms": {
    why: "You can't manage what you don't measure. Most brands think they post more often than they actually do.",
    steps: [
      "For each active social platform, count posts in the last 30 days.",
      "Note the gaps — any week with zero posts?",
      "Identify best-performing post times (platform analytics).",
      "Compare your frequency to 2–3 competitors in your space.",
      "Decide a sustainable target (e.g. 5 LinkedIn posts/week, 3 X/week).",
    ],
    estMinutes: 60,
  },
  "Create content calendar for next 30 days": {
    why: "Planned posting beats reactive posting by ~3× on engagement. A calendar also stops the \"what do I post today?\" time sink.",
    steps: [
      "Pick a calendar tool (Notion, Google Sheets, Buffer, Hootsuite).",
      "Slot in anchor content: product launches, events, reports.",
      "Fill gaps with evergreen content types: tips, data, customer stories.",
      "Batch-create copy + images for all 30 days in 2–3 sessions.",
      "Have one person own approvals to keep voice consistent.",
    ],
    estMinutes: 240,
  },
  "Schedule posts using social media tool": {
    why: "Scheduling tools let you post at optimal times even when the team is offline, and keep cadence consistent.",
    steps: [
      "Pick one tool: Buffer (simple), Hootsuite (enterprise), Later (visual-first).",
      "Connect all your brand social accounts.",
      "Upload the 30-day calendar you built.",
      "Use the tool's \"best time to post\" suggestion for each platform.",
      "Enable analytics so you can iterate based on engagement.",
    ],
    resources: [
      { label: "Buffer", url: "https://buffer.com" },
      { label: "Hootsuite", url: "https://hootsuite.com" },
    ],
    estMinutes: 60,
  },
  "Set up engagement monitoring": {
    why: "Posting without monitoring is talking with your eyes closed. Engagement signals what resonates.",
    steps: [
      "Turn on notifications in each social platform's mobile app (not just email).",
      "Set up a shared inbox or team channel for incoming mentions/DMs.",
      "Define SLA: first response within 2 hours during business hours.",
      "Weekly review: top 3 posts by engagement → double down on that format.",
      "Monthly review: platform-by-platform follower growth + engagement rate.",
    ],
    estMinutes: 45,
  },

  // ============================================================
  // PPO — Optimize Executive LinkedIn Profiles
  // ============================================================
  "Update executive headshots and banners": {
    why: "Profiles with professional headshots get 14× more views. The banner is prime real estate — use it for positioning, not decoration.",
    steps: [
      "Book a 30-min professional photo session (or use a high-quality phone shot with natural light).",
      "Crop square, 400×400+ pixels, face centered.",
      "Design a banner (1584×396) with: role, value prop, logo, 1 CTA.",
      "Canva has a free \"LinkedIn Banner\" template library.",
      "Replace on all executive profiles the same day for consistency.",
    ],
    resources: [
      { label: "Canva LinkedIn banners", url: "https://www.canva.com/templates/s/linkedin-banner/" },
    ],
    estMinutes: 90,
  },
  "Rewrite headlines with expertise keywords": {
    why: "The headline shows in search and AI assistant lookups. Generic \"VP of Marketing\" loses to \"B2B SaaS GTM Leader | Scaled Revenue 10× at [X]\".",
    steps: [
      "Lead with the specific expertise (not just title).",
      "Include 1–2 measurable achievements if they fit.",
      "Use pipes `|` to separate — easy for LinkedIn search to parse.",
      "Include keywords your buyers actually search for.",
      "Stay under 220 chars.",
    ],
    estMinutes: 30,
  },
  "Add relevant skills and certifications": {
    why: "LinkedIn's internal search + external AI tools use Skills/Certs as trust signals. Without them, the profile looks hollow.",
    steps: [
      "Max out the 50 Skills slots — include both broad (leadership) and specific (Salesforce CPQ).",
      "Reorder so the top 3 Skills are the ones most relevant to your target audience.",
      "Add every legitimate certification with issuer + expiration.",
      "Request endorsements from recent colleagues on the top 5 Skills.",
      "Update quarterly as your focus shifts.",
    ],
    estMinutes: 45,
  },
  "Request recommendations from peers": {
    why: "Recommendations are social proof that LLMs and recruiters both read. 3+ recent recommendations is the baseline.",
    steps: [
      "Identify 5 people who've seen your work recently (colleagues, clients, managers).",
      "Send a personalized request — mention a specific project you worked on together.",
      "Suggest 2–3 points they could speak to (makes it easier for them to write).",
      "Offer to write one back — reciprocation lifts response rates.",
      "Repeat every 6 months to keep recent recommendations flowing.",
    ],
    estMinutes: 45,
  },
};

/**
 * Look up the guide for an action item by its exact title. Returns null
 * if no guide is defined yet (UI falls back to just showing the title
 * with a checkbox). This lets the feature ship without requiring the
 * library to be 100% complete on day one.
 */
export function getActionGuide(title: string): ActionGuide | null {
  return ACTION_GUIDES[title] ?? null;
}
