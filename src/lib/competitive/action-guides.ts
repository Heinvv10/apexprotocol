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
      "For individual page checks, use the Apex Meta Tag Scanner (button below).",
      "Sort by impressions desc so you fix highest-traffic pages first.",
    ],
    resources: [
      { label: "Google Search Console", url: "https://search.google.com/search-console" },
      { label: "Screaming Frog SEO Spider", url: "https://www.screamingfrog.co.uk/seo-spider/", note: "Free for up to 500 URLs." },
    ],
    tool: {
      kind: "meta_tag_suggester",
      href: "/dashboard/tools/meta-tags",
      cta: "Scan a page's meta tags",
      description: "Fetches current title/description/OG and drafts replacements.",
    },
    estMinutes: 20,
  },
  "Write unique titles (50-60 chars) for each page": {
    why: "50–60 chars is the sweet spot: Google truncates at ~60, and shorter titles get higher CTR. Each page needs a unique one.",
    steps: [
      "For each page, identify the primary keyword + user intent.",
      "Draft: `[Primary Keyword] — [Value Prop] | [Brand]`.",
      "Use the Apex Meta Tag Scanner (button below) — it drafts an optimized title for any URL.",
      "Count characters — trim to ≤60 without losing the keyword.",
      "Check no two pages have the same title (grep your exports).",
      "Apply A/B test on 5 high-traffic pages to validate CTR lift.",
    ],
    tool: {
      kind: "meta_tag_suggester",
      href: "/dashboard/tools/meta-tags",
      cta: "Draft a title for a URL",
      description: "Scan any page — we generate a rule-based title suggestion to refine.",
    },
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
      "Open the Apex PageSpeed Scanner (button below) — paste any URL and run the scan in-app.",
      "Alternatively: use the raw Google PageSpeed Insights (external link below).",
      "Wait ~30 seconds for the lab + field data to load.",
      "Note the mobile scores for LCP, CLS, INP, TBT — mobile matters more than desktop.",
      "Repeat for your 9 next-highest-traffic URLs. Save a spreadsheet of the numbers.",
    ],
    resources: [
      { label: "PageSpeed Insights (Google)", url: "https://pagespeed.web.dev" },
      { label: "web.dev Core Web Vitals guide", url: "https://web.dev/articles/vitals" },
    ],
    tool: {
      kind: "pagespeed_scan",
      href: "/dashboard/tools/pagespeed",
      cta: "Run PageSpeed scan",
      description: "Scan any URL and get Core Web Vitals + prioritized fixes inline.",
    },
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

  // ============================================================
  // GEO Phase 2 — Build Authority Content Cluster
  // ============================================================
  "Identify core topic with high AI visibility potential": {
    why: "Content clusters only work when they center on a topic you can credibly own. Pick something where you have data, customer stories, or unique perspective.",
    steps: [
      "List 5 topics your team knows deeply — things you'd speak at a conference about.",
      "Check existing AI citation patterns in Apex's Monitor view — which of these topics already surface your brand?",
      "Check search volume on AlsoAsked or Google Trends for each.",
      "Pick the intersection: owned expertise + real demand + gap in current content.",
      "Write a one-paragraph \"why we're the authority here\" statement — if you can't, pick a different topic.",
    ],
    resources: [
      { label: "AlsoAsked", url: "https://alsoasked.com" },
      { label: "Google Trends", url: "https://trends.google.com" },
    ],
    estMinutes: 120,
  },
  "Create pillar page (3000+ words, comprehensive)": {
    why: "Pillar pages are the anchor LLMs cite when summarizing a topic. Comprehensive = answers every sub-question a user might have.",
    steps: [
      "Outline all sub-topics first — aim for 8–12 H2 sections covering every angle.",
      "Write in clear, direct language. Lead each section with a 1–2 sentence direct answer.",
      "Include 3–5 data points with cited sources. Include original insight where you have it.",
      "Add a table of contents at the top. Use semantic HTML — `<article>`, `<section>`, `<nav>`.",
      "Target 3000–5000 words. Under 3000 and LLMs deprioritize it; over 5000 and engagement drops.",
    ],
    estMinutes: 480,
  },
  "Write 5-7 supporting articles": {
    why: "Supporting articles capture long-tail queries and funnel link equity to the pillar. Each should answer ONE specific sub-question.",
    steps: [
      "Extract each H2 from the pillar as a potential standalone article topic.",
      "For each, write 800–1500 words on that specific question.",
      "Open with a direct answer in the first 2 sentences.",
      "Every supporting article links back to the pillar in the first 2 paragraphs.",
      "Publish on a steady cadence (1 per week) — dumping 5 at once looks unnatural.",
    ],
    estMinutes: 600,
  },
  "Implement internal linking structure": {
    why: "The cluster's SEO power comes from the link graph. Pillar ←→ supporting articles ←→ each other where relevant.",
    steps: [
      "Pillar page links to each supporting article in its relevant section.",
      "Each supporting article links back to the pillar with descriptive anchor text.",
      "Supporting articles cross-link where topics genuinely relate (don't force it).",
      "Aim for 3–5 internal links per 1000 words.",
      "Verify with Screaming Frog crawl — look for orphan pages.",
    ],
    resources: [
      { label: "Screaming Frog SEO Spider", url: "https://www.screamingfrog.co.uk/seo-spider/" },
    ],
    estMinutes: 120,
  },
  "Add schema markup to all pages": {
    why: "Article schema tells Google (and AI crawlers) the author, publish date, and topic. Without it, your content is just text.",
    steps: [
      "Add Article schema to every pillar + supporting article.",
      "Include required fields: `author`, `datePublished`, `headline`, `image`.",
      "Add BreadcrumbList schema to help crawlers understand the hierarchy.",
      "Validate each page with Google Rich Results Test.",
      "Use the Apex FAQ Schema Generator (below) for any page with Q&A content.",
    ],
    resources: [
      { label: "Google Rich Results Test", url: "https://search.google.com/test/rich-results" },
      { label: "Schema.org Article type", url: "https://schema.org/Article" },
    ],
    tool: {
      kind: "faq_schema_generator",
      href: "/dashboard/tools/faq-schema",
      cta: "Generate FAQ schema",
      description: "For the Q&A-style pages in your cluster.",
    },
    estMinutes: 180,
  },
  "Promote content through outreach": {
    why: "Publishing ≠ ranking. Without backlinks and visibility boost in week 1, pages languish regardless of quality.",
    steps: [
      "Identify 20 publications/newsletters in your industry.",
      "Personalize each outreach — reference their recent work, explain why your content adds value.",
      "Share on all your own channels (LinkedIn, X, email) day-of publication.",
      "Ask 5 customers or partners to share with their network.",
      "Run a small LinkedIn ad targeting decision-makers in your ICP for $500 as velocity boost.",
    ],
    estMinutes: 300,
  },

  // ============================================================
  // GEO Phase 2 — Develop Proprietary Research
  // ============================================================
  "Identify research topic with high citation potential": {
    why: "The State of X / Benchmark reports are the #1 most-cited content format in AI responses. Unique data beats opinion content every time.",
    steps: [
      "Pick a topic where no-one has published recent primary data in 12+ months.",
      "Verify you have access to the data source — survey audience, internal platform data, partner data.",
      "Estimate sample size needed (200+ respondents for any statistical claim).",
      "Confirm the topic is specific enough to own: \"State of AI SEO in B2B SaaS\" > \"State of SEO\".",
      "Write your intended headline stats before running the study — keeps analysis focused.",
    ],
    estMinutes: 120,
  },
  "Design and conduct survey/research": {
    why: "Methodology quality determines how trustworthy your stats are — and trust drives citations.",
    steps: [
      "Write a 10–15 question survey. Mix multiple-choice and open-ended.",
      "Use Typeform, Google Forms, or SurveyMonkey. Budget for 500 responses if using paid panel (Pollfish, Prolific).",
      "Distribute via email list, social, and — if budget allows — a paid panel for representative sample.",
      "Run for 2–3 weeks to hit target response count.",
      "Document methodology in the final report — sample size, how recruited, geographic split.",
    ],
    resources: [
      { label: "Typeform", url: "https://typeform.com" },
      { label: "Prolific (paid respondents)", url: "https://prolific.com" },
    ],
    estMinutes: 480,
  },
  "Analyze and visualize results": {
    why: "Raw data doesn't persuade. Charts + a clear headline stat do. Plan for shareable visuals from day one.",
    steps: [
      "Extract 3–5 headline stats — the ones that make people stop scrolling.",
      "Make each stat into a standalone social-shareable image (Canva or Figma).",
      "Add cross-tabs: split key stats by industry, company size, role.",
      "Identify the one counter-intuitive finding — that's your PR hook.",
      "Have a data-literate peer review the methodology + conclusions before publishing.",
    ],
    resources: [
      { label: "Canva", url: "https://canva.com" },
      { label: "Figma", url: "https://figma.com" },
    ],
    estMinutes: 360,
  },
  "Write comprehensive research report": {
    why: "The report is your citation asset. Structure it so a journalist or LLM can extract any stat with attribution.",
    steps: [
      "Start with an executive summary — the 3 headline findings + methodology in one page.",
      "One finding per chapter. Each chapter: the stat, the chart, what it means, implications.",
      "Include a methodology appendix: sample size, demographics, how questions were worded.",
      "Cite every stat with a footnote including survey question number.",
      "Publish as both a landing page (for AI crawling) AND a gated PDF (for lead capture).",
    ],
    estMinutes: 600,
  },
  "Create press release and outreach plan": {
    why: "Press coverage drives both backlinks and initial traffic — the twin signals AI platforms use to decide content authority.",
    steps: [
      "Write a 400-word press release with the most counter-intuitive finding as the headline.",
      "Build a media list of 30 journalists covering your space — Muck Rack or manual LinkedIn search.",
      "Draft 3 subject line variants for email outreach — test before sending.",
      "Offer exclusive data cuts (e.g. by industry vertical) to top-tier publications.",
      "Send to top 3 outlets 72 hours before general release.",
    ],
    resources: [
      { label: "Muck Rack", url: "https://muckrack.com", note: "Journalist database" },
    ],
    estMinutes: 180,
  },
  "Share findings with industry publications": {
    why: "Each citation from a reputable publication compounds: links boost your domain, AI crawlers index the coverage, and the stat becomes associated with your brand forever.",
    steps: [
      "Track coverage in a shared sheet — URL, outlet, journalist, publish date.",
      "Follow up with every journalist who covered it — offer follow-up data cuts or interviews.",
      "Submit to industry newsletters (The Download, CB Insights, etc.).",
      "Present findings at 1–2 industry events or webinars.",
      "Re-package the data into a \"year 2\" update 11 months later — extends citation life.",
    ],
    estMinutes: 240,
  },

  // ============================================================
  // GEO/AEO Phase 2 — Comprehensive Schema Implementation
  // ============================================================
  "Audit current schema implementation": {
    why: "You can't improve what you haven't measured. Most sites have some schema — but it's often broken, incomplete, or on the wrong pages.",
    steps: [
      "Run Screaming Frog with the \"Structured Data\" option enabled over your sitemap.",
      "Export a list of every page + every schema type found + any errors/warnings.",
      "Filter the list to group by error type — common issues: missing required fields, invalid URLs, wrong types.",
      "Benchmark against 2 top competitors — what schema types do they use that you don't?",
      "Create a spreadsheet: page × schema type × current status × priority.",
    ],
    resources: [
      { label: "Screaming Frog SEO Spider", url: "https://www.screamingfrog.co.uk/seo-spider/" },
      { label: "Google Rich Results Test", url: "https://search.google.com/test/rich-results" },
    ],
    estMinutes: 90,
  },
  "Identify missing schema types for your industry": {
    why: "Different industries reward different schema. E-commerce needs Product + Offer; SaaS needs SoftwareApplication + Organization; services need LocalBusiness + Service.",
    steps: [
      "Review schema.org's full type index for your category.",
      "Check the top 5 competitors — what types do they deploy?",
      "Prioritize: 1) Organization, 2) WebSite with SearchAction, 3) BreadcrumbList, 4) industry-specific types.",
      "For each type, list which pages on your site it applies to.",
      "Document the expected ROI per type — some (FAQPage, HowTo) get rich results; others (Person, Service) just help crawlers.",
    ],
    resources: [
      { label: "Schema.org type list", url: "https://schema.org/docs/full.html" },
    ],
    estMinutes: 120,
  },
  "Implement Organization and LocalBusiness schema": {
    why: "Organization schema tells search engines \"this is the canonical entity for [brand]\" — critical for Knowledge Graph inclusion and Wikipedia-style AI lookups.",
    steps: [
      "Create one Organization schema block on your homepage (and only there, unless LocalBusiness is different per location).",
      "Include: name, url, logo (absolute URL), sameAs (all your verified social profiles).",
      "For physical locations, add LocalBusiness schema with address, telephone, openingHours.",
      "Link sameAs to Wikipedia, Wikidata, Crunchbase — every authoritative profile you have.",
      "Validate with Google Rich Results Test.",
    ],
    resources: [
      { label: "Schema.org Organization", url: "https://schema.org/Organization" },
      { label: "Schema.org LocalBusiness", url: "https://schema.org/LocalBusiness" },
    ],
    estMinutes: 90,
  },
  "Add Product/Service schema where applicable": {
    why: "Product schema enables rich result cards (price, ratings, availability). Even for SaaS, SoftwareApplication schema earns more SERP real estate.",
    steps: [
      "For each product/service page, identify the correct schema type (Product, Service, SoftwareApplication).",
      "Include name, description, image, aggregateRating (if you have reviews), offers (price).",
      "For SaaS: SoftwareApplication with `applicationCategory`, `offers`, `operatingSystem`.",
      "Add `review` blocks for individual customer testimonials — they count too.",
      "Validate each page in Rich Results Test.",
    ],
    resources: [
      { label: "Schema.org Product", url: "https://schema.org/Product" },
      { label: "Schema.org SoftwareApplication", url: "https://schema.org/SoftwareApplication" },
    ],
    estMinutes: 240,
  },
  "Implement Article schema for blog posts": {
    why: "Article schema gives every blog post an author, publish date, and headline that AI crawlers can extract for attribution.",
    steps: [
      "Add Article (or NewsArticle / BlogPosting) to every post.",
      "Required: `headline`, `author` (Person with URL to bio), `datePublished`, `image`.",
      "Add `dateModified` when you update old posts — signals freshness.",
      "Include `publisher` (your Organization).",
      "Automate via CMS template if possible — manual per-post will drift within 3 months.",
    ],
    resources: [
      { label: "Schema.org Article", url: "https://schema.org/Article" },
    ],
    estMinutes: 180,
  },
  "Test all implementations with validators": {
    why: "A typo in JSON-LD means the schema is invisible to crawlers. Test every template, not just one example.",
    steps: [
      "Google Rich Results Test — primary. Paste each unique page template URL.",
      "Schema.org Validator — secondary. Catches issues RRT ignores.",
      "Fix every error. Warnings are OK if you understand them.",
      "Re-test after every template change.",
      "Monitor Search Console's \"Enhancements\" tab for errors after indexing.",
    ],
    resources: [
      { label: "Google Rich Results Test", url: "https://search.google.com/test/rich-results" },
      { label: "Schema.org Validator", url: "https://validator.schema.org" },
    ],
    estMinutes: 60,
  },

  // ============================================================
  // AEO Phase 2 — Build Question-Answer Database
  // ============================================================
  "Compile 50+ industry-relevant questions": {
    why: "Answer Engine Optimization wins on breadth. One FAQ page with 50 Q&As out-ranks ten pages with 5 each.",
    steps: [
      "Mine the same sources as Phase 1: support tickets, sales objections, AlsoAsked.",
      "Add competitor FAQ pages — any question they answer you don't is a gap.",
      "Add People Also Ask boxes from Google SERPs for your primary keywords.",
      "Deduplicate — cluster semantically similar questions into a canonical one.",
      "Aim for 50+ unique questions before writing any answers.",
    ],
    resources: [
      { label: "AlsoAsked", url: "https://alsoasked.com" },
    ],
    estMinutes: 180,
  },
  "Write authoritative answers for each": {
    why: "A 2-sentence FAQ answer can outrank a 2000-word blog post for the same question. Be direct, factual, and cite sources.",
    steps: [
      "One direct answer sentence first. Supporting fact second. Example or data third.",
      "Target 40–80 words per answer.",
      "Include specific numbers, dates, or entity names — helps AI crawlers extract.",
      "Have a subject-matter expert review each for accuracy.",
      "Update quarterly — stale answers hurt more than no answer.",
    ],
    estMinutes: 600,
  },
  "Organize by topic/category": {
    why: "Categorized FAQs help users skim AND give AI crawlers a topic taxonomy to understand your coverage.",
    steps: [
      "Group Q&As by theme: Pricing, Setup, Integrations, Security, Troubleshooting, etc.",
      "Aim for 5–10 Q&As per category — fewer and the category looks weak.",
      "Create a landing page per category — each becomes a ranking opportunity.",
      "Add anchor links for every Q&A to enable deep-linking from content.",
      "Include a search box if you have 50+ Q&As — UX matters.",
    ],
    estMinutes: 90,
  },
  "Add FAQ schema to Q&A pages": {
    why: "FAQ schema is the single highest-ROI structured data for AEO. Without it, AI platforms can't reliably extract your Q&A pairs.",
    steps: [
      "Use the Apex FAQ Schema Generator (below) to produce JSON-LD for each FAQ page.",
      "Paste the JSON-LD in the `<head>` of every FAQ category page.",
      "Validate each page in Google Rich Results Test.",
      "Monitor Search Console for FAQ rich result impressions — that's your signal it's working.",
      "Re-test after any CMS template changes.",
    ],
    resources: [
      { label: "Google Rich Results Test", url: "https://search.google.com/test/rich-results" },
    ],
    tool: {
      kind: "faq_schema_generator",
      href: "/dashboard/tools/faq-schema",
      cta: "Generate FAQ schema",
      description: "Paste Q&A pairs, get ready-to-deploy JSON-LD.",
    },
    estMinutes: 60,
  },
  "Create interconnected links between Q&As": {
    why: "Related-answer links keep users on site and signal topic depth to crawlers.",
    steps: [
      "For every Q&A, link to 2–3 related Q&As at the bottom.",
      "Use descriptive anchor text (\"Learn how pricing works\" not \"click here\").",
      "Cross-link from blog posts + product pages to relevant FAQs.",
      "Add FAQ links to your support emails and onboarding flows.",
      "Review monthly — kill broken links, add new relationships as content grows.",
    ],
    estMinutes: 90,
  },

  // ============================================================
  // SMO Phase 2 — Launch Social Media Campaign
  // ============================================================
  "Define campaign goals and KPIs": {
    why: "Campaigns without measurable goals drift into vanity. Define success before spending a dollar.",
    steps: [
      "Pick 1 primary metric: reach, engagement rate, click-throughs, or qualified leads.",
      "Set a specific numeric target and deadline (e.g. \"5000 clicks in 30 days\").",
      "Define 2 secondary metrics — things you'd lose sleep over if they regressed.",
      "Baseline the last 30 days so you can prove delta.",
      "Write it in a one-pager the whole team agrees to.",
    ],
    estMinutes: 60,
  },
  "Create campaign content calendar": {
    why: "A campaign is not a post — it's 3–6 weeks of coordinated posts that build to a single moment.",
    steps: [
      "Define the hero moment (launch day) and count back 3 weeks.",
      "Week 1: teases and anticipation. Week 2: education about the problem. Week 3: the solution.",
      "Assign each post an objective: awareness, education, engagement, conversion.",
      "Draft copy + visual for every post in one sprint (avoid day-of panic).",
      "Plan 5–10 response templates for predictable engagement (Q&A, objections).",
    ],
    estMinutes: 240,
  },
  "Design campaign visuals and assets": {
    why: "Consistent visual language is what turns disparate posts into a recognizable campaign.",
    steps: [
      "Lock in a color palette + typography + visual motif before producing any asset.",
      "Create templated formats in Canva or Figma: quote card, data card, event card, CTA card.",
      "Size for every platform you're targeting (LinkedIn 1200×627, X 1600×900, IG 1080×1080).",
      "Maintain a shared asset folder so the team pulls from one source.",
      "Use the brand's hero font — don't default to Canva's defaults; they're visibly generic.",
    ],
    resources: [
      { label: "Canva", url: "https://canva.com" },
      { label: "Figma", url: "https://figma.com" },
    ],
    estMinutes: 480,
  },
  "Launch and monitor daily": {
    why: "Campaigns fail in week 1 without hands-on monitoring. Engagement compounds — so does silence.",
    steps: [
      "Post at your platform's peak time, not whenever someone remembers.",
      "Assign one owner to monitor mentions hourly for the first 48 hours.",
      "Respond to every comment within 2 hours during launch week.",
      "Watch your primary KPI daily — pivot mid-campaign if it's flat by day 3.",
      "Document what worked in a running doc for the post-mortem.",
    ],
    estMinutes: 1200,
  },
  "Engage with all comments and shares": {
    why: "The algorithm rewards early engagement. First-hour comments predict reach; unanswered comments kill follow-on engagement.",
    steps: [
      "Target: respond to every comment within 1 hour during active windows.",
      "Engage beyond your own posts — reply to the 10 most recent industry-adjacent posts daily.",
      "Ask follow-up questions — don't just \"thanks!\" — drive thread depth.",
      "Turn public shares into relationships (DM shares with a personal thanks).",
      "Screenshot best interactions for internal morale + case studies.",
    ],
    estMinutes: 900,
  },
  "Analyze results and document learnings": {
    why: "Campaigns compound value only when the next one learns from this one.",
    steps: [
      "Pull all metrics against the baseline you set at kickoff.",
      "For each primary + secondary KPI: actual vs target + % delta.",
      "Identify the 3 highest-performing posts — what made them work?",
      "Identify the 3 worst-performing — what went wrong?",
      "Write a 1-page retrospective + 3 decisions for next campaign.",
    ],
    estMinutes: 120,
  },

  // ============================================================
  // PPO Phase 2 — Launch Thought Leadership Series
  // ============================================================
  "Identify 3-4 key topics for executives": {
    why: "Thought leadership means owning a narrow topic, not opining on everything. Narrow = memorable.",
    steps: [
      "For each executive, list topics where they have unique perspective (not just opinions).",
      "Narrow to 3–4 topics per exec — any more and the positioning blurs.",
      "Cross-check: do their topics overlap with where the brand needs GEO visibility?",
      "Confirm they can sustain writing on these topics for 12+ months.",
      "Document the positioning statement: \"[Exec] is the authority on [topic] because [proof]\".",
    ],
    estMinutes: 120,
  },
  "Create LinkedIn article publishing schedule": {
    why: "Sporadic thought leadership looks like someone remembered to post. Scheduled cadence looks intentional.",
    steps: [
      "Commit to a sustainable cadence — 1 article per exec per week is aggressive; fortnightly is realistic.",
      "Batch-plan 6 weeks of topics per exec at kickoff.",
      "Publish on the same day each week for predictability.",
      "Create a shared calendar the exec's team can see (avoids duplicate work).",
      "Build in 1 buffer article per month for topical/news-jacking.",
    ],
    estMinutes: 60,
  },
  "Write and publish weekly articles": {
    why: "1200–1500 word articles outperform short posts on LinkedIn's algorithm AND give AI crawlers something to cite.",
    steps: [
      "Ghost-write or co-author — most execs don't have 4 hours/week to draft.",
      "Structure: hook (1 para) → problem (2 paras) → unique perspective (4 paras) → actionable takeaway (1 para).",
      "Include one original insight or data point per article.",
      "Publish via the exec's own LinkedIn account, not the company page (reach is 5–10× higher).",
      "Cross-post to their personal blog for the long-term SEO benefit.",
    ],
    estMinutes: 240,
  },
  "Engage with comments and discussions": {
    why: "Comments are where LinkedIn's algorithm + the execs' credibility actually grow. A published article with no author responses looks abandoned.",
    steps: [
      "Exec personally responds to the top 5 comments within 4 hours of publish.",
      "Pin the most thoughtful comment to invite threaded discussion.",
      "Follow up 48 hours later on the top thread to extend conversation.",
      "Connect with the top 10 commenters — they're your early advocates.",
      "Track comment quality over time — quality engagement > vanity metrics.",
    ],
    estMinutes: 45,
  },
  "Cross-promote on company channels": {
    why: "Exec content benefits the brand only if the brand amplifies it. Don't silo.",
    steps: [
      "Company LinkedIn page reshares exec articles within 1 hour of publish.",
      "Include in weekly company newsletter.",
      "Clip key quotes as shareable graphics for X + Instagram.",
      "Link from relevant product/solution pages — builds internal authority signal.",
      "Include in sales collateral as proof of expertise.",
    ],
    estMinutes: 60,
  },

  // ============================================================
  // Phase 3 — Continuous Content Optimization
  // ============================================================
  "Monthly content audit for top pages": {
    why: "Content decays. Pages that ranked 6 months ago often don't now. Scheduled audits catch the rot.",
    steps: [
      "Export top 20 organic pages from Search Console by impressions.",
      "For each, check: are clicks declining month-over-month?",
      "Review the content — is any data outdated? Any claims no longer true?",
      "Run the Apex On-Page Audit against the URL for a fresh signal-grounded score.",
      "Prioritize 3–5 pages for updates this month — don't try to fix 20.",
    ],
    resources: [
      { label: "Google Search Console", url: "https://search.google.com/search-console" },
    ],
    estMinutes: 120,
  },
  "Update statistics and references": {
    why: "Stale stats kill citation-worthiness. If your \"2023 survey\" is still the lead data point in 2026, LLMs will cite fresher sources.",
    steps: [
      "For every stat in the article, find the most recent authoritative source.",
      "Update year references — \"[Current year]\" beats a hardcoded year.",
      "Replace broken reference links.",
      "Update dateModified in Article schema — signals freshness to crawlers.",
      "Submit updated URL to GSC for re-indexing.",
    ],
    estMinutes: 60,
  },
  "Improve content based on AI citation patterns": {
    why: "Apex's Monitor tab shows which of your pages AI platforms are citing (or not). Use the data.",
    steps: [
      "Check the Mentions page in Apex — which URLs show up as citation sources?",
      "For cited pages: what structural patterns do they share? (FAQ, data, author bio?)",
      "For pages that should be cited but aren't: what's missing vs the cited ones?",
      "Apply the winning structure to 3 non-cited pages per month.",
      "Re-measure citations 30 days later — is the pattern repeatable?",
    ],
    estMinutes: 90,
  },
  "Add new internal links": {
    why: "New content only gets discovered via crawls. Internal links are the cheapest way to say \"this page matters\".",
    steps: [
      "For each new article published last month, add 3 internal links TO it from existing authority pages.",
      "Update the pillar page to link to any new supporting articles.",
      "Kill low-value links pointing to stale pages.",
      "Screaming Frog crawl monthly to spot orphan pages.",
      "Aim for every important page to have at least 3 internal inbound links.",
    ],
    resources: [
      { label: "Screaming Frog SEO Spider", url: "https://www.screamingfrog.co.uk/seo-spider/" },
    ],
    estMinutes: 45,
  },

  // ============================================================
  // Phase 3 — Monitor and Respond to Algorithm Changes
  // ============================================================
  "Set up AI platform change monitoring": {
    why: "AI platforms change citation behavior frequently. Without monitoring, you'll learn from ranking drops instead of ahead.",
    steps: [
      "Subscribe to official changelogs — OpenAI, Anthropic, Google, Perplexity.",
      "Follow 5 SEO/GEO practitioners who cover AI search weekly (search newsletter signals).",
      "Enable Apex alerts for significant score drops (Settings → Alerts).",
      "Set up Slack/email alert for unexpected citation drops.",
      "Monthly review: any platform behavior shifts you should react to?",
    ],
    estMinutes: 60,
  },
  "Weekly review of citation patterns": {
    why: "Trends > snapshots. A single week's dip may be noise; 3 weeks is a pattern that needs action.",
    steps: [
      "Open the Apex Monitor tab every Monday.",
      "Compare this week's mention count per platform vs the 4-week trailing average.",
      "Flag any platform with >20% WoW change.",
      "Check which URLs drove the change — up or down.",
      "Document in a running log; decide if any change requires content action.",
    ],
    estMinutes: 30,
  },
  "Adjust content strategy as needed": {
    why: "The one thing more expensive than pivoting is continuing a strategy that's stopped working.",
    steps: [
      "Review quarter-over-quarter: which content types are gaining / losing citations?",
      "Kill formats with declining returns — don't prop them up from inertia.",
      "Double down on rising formats: FAQPage pages, statistics-heavy articles, original research.",
      "Shift editorial mix at the quarterly content planning meeting.",
      "Communicate the pivot to content contributors — no surprise revisions.",
    ],
    estMinutes: 120,
  },

  // ============================================================
  // Phase 3 — Regular Social Engagement
  // ============================================================
  "Daily engagement with followers": {
    why: "Social algorithms reward daily signal. Even 15 min/day beats one 2-hour session per week.",
    steps: [
      "Set a fixed 15-minute window per day (e.g. 9:00–9:15 AM).",
      "Review DMs and @-mentions first — respond to every one.",
      "Engage with 10 posts from your target audience (not your followers — your ICP).",
      "Share or quote one piece of genuinely useful content from someone else daily.",
      "Don't auto-schedule engagement — algorithms detect and demote formulaic replies.",
    ],
    estMinutes: 15,
  },
  "Weekly content creation and scheduling": {
    why: "Consistency beats bursts. Weekly cadence keeps the algorithm engaged and your team on rhythm.",
    steps: [
      "Block a 2-hour window every week for content creation.",
      "Produce 3–5 posts per platform.",
      "Schedule via your chosen tool for the week ahead.",
      "Leave one slot per platform unscheduled for day-of reactions.",
      "Review last week's top post — what to replicate?",
    ],
    estMinutes: 120,
  },
  "Monthly performance review and adjustment": {
    why: "Without monthly reviews you ship momentum-based content forever. Review forces strategic pivots.",
    steps: [
      "Pull 30-day metrics per platform: reach, engagement rate, clicks, follower delta.",
      "Compare to previous month and to your 6-month average.",
      "Identify top 3 and bottom 3 posts by engagement rate.",
      "Write one paragraph: what worked, what didn't, what to change.",
      "Adjust the content calendar for next month accordingly.",
    ],
    estMinutes: 60,
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
