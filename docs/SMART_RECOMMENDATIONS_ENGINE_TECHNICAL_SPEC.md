# Smart Recommendations Engine - Technical Design Specification

**Version:** 1.0
**Date:** December 8, 2025
**Status:** Architecture Design Phase

---

## 🎯 Executive Summary

The **Smart Recommendations Engine** is the core differentiator of our GEO platform. It transforms raw analytics into **actionable, prioritized tasks** that users can implement immediately.

### Key Capabilities
1. **Content Gap Analysis** - NLP-based entity extraction comparing brand presence across AI models
2. **Structured Data Auditing** - Automated schema.org validation with code snippets
3. **Multi-Language Content Planning** - Local language recommendations (Swahili, isiZulu, Yoruba, etc.)
4. **Voice Search Optimization** - Readability analysis and Q&A format suggestions
5. **Task Management Integration** - Sync recommendations to Jira, Trello, Asana

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │ Task Manager │  │  Reports     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   GraphQL    │  │  REST API    │  │  WebSocket   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ RECOMMENDATION   │  │  DATA COLLECTION │  │  INTEGRATION     │
│     ENGINE       │  │     PIPELINE     │  │    SERVICES      │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • Content Gap    │  │ • AI Query       │  │ • Jira API       │
│ • Schema Audit   │  │ • Web Scraper    │  │ • Trello API     │
│ • Language Rec   │  │ • Analytics      │  │ • Asana API      │
│ • Voice Opt      │  │ • Competitor     │  │ • Slack API      │
│ • Priority Calc  │  │   Tracking       │  │ • WordPress      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   Vector DB  │          │
│  │ (Main Data)  │  │  (Caching)   │  │  (Embeddings)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ OpenAI API   │  │ Claude API   │  │ Translation  │          │
│  │ (GPT-4)      │  │ (Sonnet)     │  │ APIs         │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Core Components

### 1. **Content Gap Analyzer**

**Purpose:** Compare brand's digital footprint against AI model responses to identify missing information.

**Process Flow:**
```
1. Fetch brand's website content (sitemap crawl)
2. Extract entities (products, services, people, locations, facts)
3. Query AI models (ChatGPT, Claude, Perplexity, Gemini) with brand-related prompts
4. Extract entities from AI responses
5. Compare: What AI knows vs What brand published
6. Generate recommendations for missing entities
```

**Algorithm:**

```typescript
interface EntityComparison {
  entity: string;
  entityType: 'product' | 'service' | 'person' | 'location' | 'fact';
  presentInWebsite: boolean;
  presentInAI: boolean;
  aiConfidence: number; // 0-100
  sources: string[]; // URLs where AI found this info
}

async function analyzeContentGaps(brandId: string): Promise<Recommendation[]> {
  // Step 1: Extract entities from brand's website
  const websiteEntities = await extractEntitiesFromWebsite(brandId);

  // Step 2: Query AI models with brand-related prompts
  const aiPrompts = generateBrandPrompts(brandId); // e.g., "What does [Brand] sell?"
  const aiResponses = await queryAllAIModels(aiPrompts);

  // Step 3: Extract entities from AI responses
  const aiEntities = await extractEntitiesFromAIResponses(aiResponses);

  // Step 4: Compare and find gaps
  const gaps = compareEntities(websiteEntities, aiEntities);

  // Step 5: Generate recommendations
  const recommendations = gaps
    .filter(gap => !gap.presentInWebsite && gap.presentInAI)
    .map(gap => ({
      type: 'CONTENT_GAP',
      priority: calculatePriority(gap),
      title: `Add "${gap.entity}" information to your website`,
      description: `AI models mention "${gap.entity}" but it's not on your site`,
      actionItems: generateActionItems(gap),
      estimatedImpact: estimateImpact(gap),
      language: detectLanguage(gap),
    }));

  return recommendations.sort((a, b) => b.priority - a.priority);
}

function calculatePriority(gap: EntityComparison): number {
  let priority = 0;

  // Higher priority if AI mentions it frequently
  priority += gap.aiConfidence * 0.4;

  // Higher priority if missing critical entity types
  if (gap.entityType === 'product' || gap.entityType === 'service') {
    priority += 30;
  }

  // Higher priority if found in multiple sources
  priority += Math.min(gap.sources.length * 5, 30);

  return Math.min(priority, 100);
}
```

---

### 2. **Schema & Structured Data Auditor**

**Purpose:** Validate website's schema.org markup and recommend improvements for AI extraction.

**Process Flow:**
```
1. Crawl website pages
2. Parse HTML and extract existing schema markup
3. Validate against schema.org specs
4. Identify missing schemas critical for AI
5. Generate code snippets for implementation
```

**Algorithm:**

```typescript
interface SchemaAudit {
  url: string;
  existingSchemas: string[]; // e.g., ['Organization', 'Product']
  missingSchemas: string[];
  invalidSchemas: SchemaValidationError[];
  recommendations: SchemaRecommendation[];
}

interface SchemaRecommendation {
  schemaType: string; // e.g., 'FAQPage', 'Product', 'LocalBusiness'
  priority: 'high' | 'medium' | 'low';
  reason: string;
  codeSnippet: string;
  expectedImpact: string;
}

async function auditStructuredData(websiteUrl: string): Promise<SchemaAudit> {
  // Step 1: Crawl website
  const pages = await crawlWebsite(websiteUrl);

  // Step 2: Extract existing schemas
  const existingSchemas = pages.flatMap(page =>
    extractSchemaMarkup(page.html)
  );

  // Step 3: Validate schemas
  const invalidSchemas = existingSchemas
    .map(schema => validateSchema(schema))
    .filter(result => !result.isValid);

  // Step 4: Identify missing critical schemas
  const missingSchemas = identifyMissingSchemas(pages, existingSchemas);

  // Step 5: Generate recommendations
  const recommendations = missingSchemas.map(schema => ({
    schemaType: schema.type,
    priority: schema.importance,
    reason: schema.reason,
    codeSnippet: generateSchemaSnippet(schema),
    expectedImpact: estimateSchemaImpact(schema),
  }));

  return {
    url: websiteUrl,
    existingSchemas: existingSchemas.map(s => s.type),
    missingSchemas: missingSchemas.map(s => s.type),
    invalidSchemas,
    recommendations,
  };
}

function identifyMissingSchemas(
  pages: Page[],
  existingSchemas: Schema[]
): MissingSchema[] {
  const missing: MissingSchema[] = [];

  // Check for critical schemas based on page type
  pages.forEach(page => {
    const pageType = detectPageType(page);

    switch (pageType) {
      case 'product':
        if (!hasSchema(existingSchemas, 'Product')) {
          missing.push({
            type: 'Product',
            importance: 'high',
            reason: 'Product pages should have Product schema for AI shopping',
            page: page.url,
          });
        }
        break;

      case 'faq':
        if (!hasSchema(existingSchemas, 'FAQPage')) {
          missing.push({
            type: 'FAQPage',
            importance: 'high',
            reason: 'FAQ schema helps AI extract question-answer pairs',
            page: page.url,
          });
        }
        break;

      case 'about':
        if (!hasSchema(existingSchemas, 'Organization')) {
          missing.push({
            type: 'Organization',
            importance: 'high',
            reason: 'Organization schema provides brand context to AI',
            page: page.url,
          });
        }
        break;

      case 'article':
        if (!hasSchema(existingSchemas, 'Article')) {
          missing.push({
            type: 'Article',
            importance: 'medium',
            reason: 'Article schema improves content attribution in AI',
            page: page.url,
          });
        }
        break;
    }
  });

  return missing;
}

function generateSchemaSnippet(schema: MissingSchema): string {
  const templates = {
    Product: `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Your Product Name",
  "description": "Product description here",
  "brand": {
    "@type": "Brand",
    "name": "Your Brand"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
    `,

    FAQPage: `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Your question here?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your answer here"
    }
  }]
}
</script>
    `,

    Organization: `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourwebsite.com",
  "logo": "https://yourwebsite.com/logo.png",
  "description": "Company description",
  "foundingDate": "2020",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-xxx-xxx-xxxx",
    "contactType": "customer service"
  }
}
</script>
    `,
  };

  return templates[schema.type] || '';
}
```

---

### 3. **Multi-Language Content Planner**

**Purpose:** Recommend local language content based on target markets and query analysis.

**Process Flow:**
```
1. Identify target markets (user input or auto-detect from analytics)
2. Analyze AI query patterns in those markets
3. Detect language gaps (content exists in English but not Swahili)
4. Generate language-specific content recommendations
5. Provide translation priorities and keyword lists
```

**Algorithm:**

```typescript
interface LanguageRecommendation {
  targetLanguage: string; // e.g., 'sw' (Swahili), 'zu' (Zulu)
  contentType: 'product_page' | 'faq' | 'blog' | 'about';
  priority: number; // 0-100
  reason: string;
  keywords: string[]; // Local language keywords
  sampleTitles: string[];
  estimatedSearchVolume: number;
  competitionLevel: 'low' | 'medium' | 'high';
}

async function analyzeLanguageOpportunities(
  brandId: string,
  targetMarkets: string[]
): Promise<LanguageRecommendation[]> {
  const recommendations: LanguageRecommendation[] = [];

  // Step 1: Get brand's existing content
  const existingContent = await getContentInventory(brandId);

  // Step 2: Analyze AI queries in target markets
  for (const market of targetMarkets) {
    const marketLanguages = getMarketLanguages(market);

    for (const language of marketLanguages) {
      // Step 3: Identify content gaps
      const contentGaps = findLanguageGaps(existingContent, language);

      // Step 4: Get local search data
      const localKeywords = await getLocalKeywords(brandId, language);

      // Step 5: Generate recommendations
      for (const gap of contentGaps) {
        recommendations.push({
          targetLanguage: language,
          contentType: gap.type,
          priority: calculateLanguagePriority(gap, localKeywords),
          reason: generateReason(gap, language, market),
          keywords: localKeywords.slice(0, 10),
          sampleTitles: generateSampleTitles(gap, language),
          estimatedSearchVolume: localKeywords.reduce((sum, kw) => sum + kw.volume, 0),
          competitionLevel: assessCompetition(language, gap.type),
        });
      }
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

function getMarketLanguages(market: string): string[] {
  const marketLanguageMap = {
    'south_africa': ['en', 'zu', 'xh', 'af'], // English, Zulu, Xhosa, Afrikaans
    'kenya': ['en', 'sw'], // English, Swahili
    'nigeria': ['en', 'yo', 'ig', 'ha'], // English, Yoruba, Igbo, Hausa
    'tanzania': ['sw', 'en'], // Swahili, English
    'ghana': ['en', 'tw'], // English, Twi
    'uganda': ['en', 'sw', 'lg'], // English, Swahili, Luganda
    'rwanda': ['rw', 'en', 'fr'], // Kinyarwanda, English, French
  };

  return marketLanguageMap[market] || ['en'];
}

function findLanguageGaps(
  existingContent: Content[],
  targetLanguage: string
): ContentGap[] {
  const gaps: ContentGap[] = [];

  // Find content that exists in English but not in target language
  const englishContent = existingContent.filter(c => c.language === 'en');

  for (const content of englishContent) {
    const hasTranslation = existingContent.some(
      c => c.sourceId === content.id && c.language === targetLanguage
    );

    if (!hasTranslation) {
      gaps.push({
        type: content.type,
        sourceContent: content,
        targetLanguage,
        priority: content.pageViews, // Higher views = higher priority
      });
    }
  }

  return gaps;
}

function generateSampleTitles(gap: ContentGap, language: string): string[] {
  const templates = {
    sw: { // Swahili
      product_page: [
        `Ni nini ${gap.sourceContent.title}?`,
        `${gap.sourceContent.title} - Maelezo kamili`,
        `Jinsi ya kutumia ${gap.sourceContent.title}`,
      ],
      faq: [
        `Maswali yanayoulizwa mara kwa mara kuhusu ${gap.sourceContent.brand}`,
        `Jibu la swali lako kuhusu ${gap.sourceContent.brand}`,
      ],
      blog: [
        `Mwongozo kamili wa ${gap.sourceContent.topic}`,
        `Kila kitu unachohitaji kujua kuhusu ${gap.sourceContent.topic}`,
      ],
    },
    zu: { // Zulu
      product_page: [
        `Yini ${gap.sourceContent.title}?`,
        `${gap.sourceContent.title} - Incazelo ephelele`,
        `Indlela yokusebenzisa ${gap.sourceContent.title}`,
      ],
    },
    yo: { // Yoruba
      product_page: [
        `Kini ${gap.sourceContent.title}?`,
        `${gap.sourceContent.title} - Alaye pipe`,
        `Bi o ṣe le lo ${gap.sourceContent.title}`,
      ],
    },
  };

  return templates[language]?.[gap.type] || [];
}
```

---

### 4. **Voice Search Optimizer**

**Purpose:** Analyze content for voice-friendliness and recommend Q&A format improvements.

**Process Flow:**
```
1. Analyze content readability (Flesch-Kincaid, sentence length)
2. Detect conversational vs formal tone
3. Identify questions that could be answered
4. Recommend Q&A format restructuring
5. Suggest audio snippet opportunities
```

**Algorithm:**

```typescript
interface VoiceOptimizationScore {
  overallScore: number; // 0-100
  readabilityScore: number;
  conversationalTone: number;
  questionAnswerCoverage: number;
  sentenceComplexity: 'simple' | 'moderate' | 'complex';
  recommendations: VoiceRecommendation[];
}

interface VoiceRecommendation {
  type: 'rewrite' | 'add_qa' | 'simplify' | 'audio_snippet';
  priority: 'high' | 'medium' | 'low';
  originalText: string;
  suggestedText: string;
  reason: string;
}

async function analyzeVoiceOptimization(
  content: string,
  contentType: string
): Promise<VoiceOptimizationScore> {
  // Step 1: Calculate readability
  const readability = calculateReadability(content);

  // Step 2: Analyze tone
  const tone = analyzeTone(content);

  // Step 3: Extract implicit questions
  const implicitQuestions = extractQuestions(content);

  // Step 4: Calculate scores
  const readabilityScore = scoreReadability(readability);
  const conversationalTone = scoreTone(tone);
  const qaScore = scoreQACoverage(implicitQuestions, content);

  // Step 5: Generate recommendations
  const recommendations = generateVoiceRecommendations(
    content,
    readability,
    tone,
    implicitQuestions
  );

  return {
    overallScore: (readabilityScore + conversationalTone + qaScore) / 3,
    readabilityScore,
    conversationalTone,
    questionAnswerCoverage: qaScore,
    sentenceComplexity: categorizeComplexity(readability),
    recommendations,
  };
}

function calculateReadability(content: string): ReadabilityMetrics {
  const sentences = content.split(/[.!?]+/);
  const words = content.split(/\s+/);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  // Flesch-Kincaid Grade Level
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Flesch Reading Ease
  const readingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return {
    gradeLevel,
    readingEase,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    longSentences: sentences.filter(s => s.split(/\s+/).length > 20).length,
  };
}

function analyzeTone(content: string): ToneAnalysis {
  const conversationalMarkers = [
    /\b(you|your)\b/gi,
    /\b(I|we|us)\b/gi,
    /\?/g,
    /\b(here's|here are)\b/gi,
    /\b(let's|let me)\b/gi,
  ];

  const formalMarkers = [
    /\b(therefore|furthermore|however)\b/gi,
    /\b(shall|ought|must)\b/gi,
    /\b(aforementioned|heretofore)\b/gi,
  ];

  const conversationalCount = conversationalMarkers.reduce(
    (sum, marker) => sum + (content.match(marker)?.length || 0),
    0
  );

  const formalCount = formalMarkers.reduce(
    (sum, marker) => sum + (content.match(marker)?.length || 0),
    0
  );

  return {
    conversationalScore: conversationalCount,
    formalScore: formalCount,
    ratio: conversationalCount / (formalCount + conversationalCount + 1),
  };
}

function extractQuestions(content: string): ImplicitQuestion[] {
  const questions: ImplicitQuestion[] = [];

  // Common question patterns
  const patterns = [
    /what is ([^.?!]+)/gi,
    /how to ([^.?!]+)/gi,
    /why ([^.?!]+)/gi,
    /when ([^.?!]+)/gi,
    /where ([^.?!]+)/gi,
    /who ([^.?!]+)/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      questions.push({
        question: match[0],
        context: extractContext(content, match.index),
        hasExplicitAnswer: hasAnswerNearby(content, match.index),
      });
    }
  });

  return questions;
}

function generateVoiceRecommendations(
  content: string,
  readability: ReadabilityMetrics,
  tone: ToneAnalysis,
  questions: ImplicitQuestion[]
): VoiceRecommendation[] {
  const recommendations: VoiceRecommendation[] = [];

  // Recommendation 1: Simplify long sentences
  if (readability.longSentences > 0) {
    recommendations.push({
      type: 'simplify',
      priority: 'high',
      originalText: 'Multiple long sentences detected',
      suggestedText: 'Break into shorter sentences (max 15-20 words)',
      reason: 'Voice assistants perform better with concise sentences',
    });
  }

  // Recommendation 2: Add conversational tone
  if (tone.ratio < 0.3) {
    recommendations.push({
      type: 'rewrite',
      priority: 'medium',
      originalText: 'Formal tone detected',
      suggestedText: 'Use "you/your" and conversational language',
      reason: 'Voice queries are conversational - match that tone',
    });
  }

  // Recommendation 3: Convert to Q&A format
  questions.forEach(q => {
    if (!q.hasExplicitAnswer) {
      recommendations.push({
        type: 'add_qa',
        priority: 'high',
        originalText: q.question,
        suggestedText: formatAsQA(q),
        reason: 'Explicit Q&A format improves voice search visibility',
      });
    }
  });

  // Recommendation 4: Audio snippet opportunity
  if (readability.readingEase > 60 && tone.ratio > 0.5) {
    recommendations.push({
      type: 'audio_snippet',
      priority: 'low',
      originalText: 'Content is voice-friendly',
      suggestedText: 'Record audio version of this content',
      reason: 'Voice-optimized content performs well as audio',
    });
  }

  return recommendations;
}

function formatAsQA(question: ImplicitQuestion): string {
  return `
**Q: ${question.question}?**

A: ${question.context}

(Extracted from your existing content and formatted for voice search)
  `.trim();
}
```

---

### 5. **Priority Calculation Engine**

**Purpose:** Rank all recommendations by potential impact, effort, and urgency.

**Algorithm:**

```typescript
interface PriorityScore {
  total: number; // 0-100
  impact: number; // 0-100
  effort: number; // 0-100 (inverse - lower effort = higher score)
  urgency: number; // 0-100
  confidence: number; // 0-100
}

function calculateRecommendationPriority(
  recommendation: Recommendation,
  brandContext: BrandContext
): PriorityScore {
  // Impact calculation (40% weight)
  const impact = calculateImpact(recommendation, brandContext);

  // Effort calculation (30% weight) - inverted
  const effort = 100 - estimateEffort(recommendation);

  // Urgency calculation (20% weight)
  const urgency = calculateUrgency(recommendation, brandContext);

  // Confidence calculation (10% weight)
  const confidence = estimateConfidence(recommendation);

  // Weighted total
  const total = (
    impact * 0.4 +
    effort * 0.3 +
    urgency * 0.2 +
    confidence * 0.1
  );

  return {
    total: Math.round(total),
    impact,
    effort: 100 - effort, // Return actual effort for display
    urgency,
    confidence,
  };
}

function calculateImpact(
  recommendation: Recommendation,
  context: BrandContext
): number {
  let impact = 50; // Base score

  // Factor 1: Recommendation type importance
  const typeWeights = {
    CONTENT_GAP: 30,
    SCHEMA_MISSING: 25,
    LANGUAGE_OPPORTUNITY: 20,
    VOICE_OPTIMIZATION: 15,
    TECHNICAL_SEO: 20,
  };
  impact += typeWeights[recommendation.type] || 0;

  // Factor 2: Search volume (if available)
  if (recommendation.estimatedSearchVolume) {
    impact += Math.min(recommendation.estimatedSearchVolume / 100, 20);
  }

  // Factor 3: Competitor gap
  if (recommendation.competitorHasThis === false) {
    impact += 15; // Low-hanging fruit
  }

  // Factor 4: AI model coverage
  const aiModelCount = recommendation.affectedAIModels?.length || 0;
  impact += Math.min(aiModelCount * 5, 20);

  return Math.min(impact, 100);
}

function estimateEffort(recommendation: Recommendation): number {
  let effort = 50; // Base effort

  // Effort modifiers based on recommendation type
  switch (recommendation.type) {
    case 'SCHEMA_MISSING':
      // Low effort - just add code snippet
      effort = 20;
      break;

    case 'CONTENT_GAP':
      // Medium effort - write new content
      if (recommendation.wordCount && recommendation.wordCount < 500) {
        effort = 40;
      } else {
        effort = 60;
      }
      break;

    case 'LANGUAGE_OPPORTUNITY':
      // High effort - translation required
      effort = 70;
      if (recommendation.autoTranslationAvailable) {
        effort = 50; // Lower if we can auto-translate
      }
      break;

    case 'VOICE_OPTIMIZATION':
      // Medium effort - rewrite existing content
      effort = 50;
      break;

    case 'TECHNICAL_SEO':
      // Variable effort
      effort = recommendation.requiresDeveloper ? 80 : 40;
      break;
  }

  return effort;
}

function calculateUrgency(
  recommendation: Recommendation,
  context: BrandContext
): number {
  let urgency = 50; // Base urgency

  // Factor 1: Competitor activity
  if (recommendation.competitorRecentlyAdded) {
    urgency += 30; // Catch up urgently
  }

  // Factor 2: Declining visibility
  if (context.visibilityTrend === 'declining') {
    urgency += 20;
  }

  // Factor 3: Seasonal relevance
  if (recommendation.seasonalRelevance === 'high') {
    urgency += 20;
  }

  // Factor 4: Low-hanging fruit
  if (recommendation.expectedImpact === 'high' && estimateEffort(recommendation) < 30) {
    urgency += 15;
  }

  return Math.min(urgency, 100);
}

function estimateConfidence(recommendation: Recommendation): number {
  let confidence = 70; // Base confidence

  // Factor 1: Data source reliability
  if (recommendation.dataSource === 'direct_measurement') {
    confidence = 90;
  } else if (recommendation.dataSource === 'ai_inference') {
    confidence = 60;
  }

  // Factor 2: Sample size
  if (recommendation.sampleSize && recommendation.sampleSize > 1000) {
    confidence += 10;
  }

  // Factor 3: Historical validation
  if (recommendation.similarRecommendationsSucceeded) {
    confidence += 15;
  }

  return Math.min(confidence, 100);
}
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  industry VARCHAR(100),
  target_markets TEXT[], -- e.g., ['south_africa', 'kenya']
  target_languages TEXT[], -- e.g., ['en', 'sw', 'zu']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations table
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'CONTENT_GAP', 'SCHEMA_MISSING', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
  priority_score INTEGER NOT NULL, -- 0-100
  impact_score INTEGER NOT NULL,
  effort_score INTEGER NOT NULL,
  urgency_score INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,

  -- Recommendation details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  action_items JSONB, -- Array of specific actions
  code_snippet TEXT, -- For schema recommendations

  -- Metadata
  language VARCHAR(10), -- ISO language code
  affected_ai_models TEXT[], -- ['chatgpt', 'claude', 'perplexity']
  estimated_search_volume INTEGER,
  competitor_has_this BOOLEAN,

  -- Tracking
  assigned_to UUID, -- User ID
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  dismissal_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_brand_status (brand_id, status),
  INDEX idx_priority (priority_score DESC),
  INDEX idx_type (type)
);

-- Content inventory (for gap analysis)
CREATE TABLE content_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  url VARCHAR(1000) NOT NULL,
  content_type VARCHAR(50), -- 'product', 'blog', 'faq', 'about'
  language VARCHAR(10),
  title VARCHAR(500),
  content_text TEXT,
  word_count INTEGER,
  page_views INTEGER,
  last_modified TIMESTAMP,

  -- Extracted entities
  entities JSONB, -- {products: [], services: [], people: [], locations: []}

  -- Schema analysis
  existing_schemas TEXT[],
  missing_schemas TEXT[],

  -- Voice optimization
  readability_score FLOAT,
  voice_optimization_score FLOAT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_brand_lang (brand_id, language),
  INDEX idx_content_type (content_type)
);

-- AI query responses (for comparison)
CREATE TABLE ai_query_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  ai_model VARCHAR(50), -- 'chatgpt', 'claude', 'perplexity', etc.
  query TEXT NOT NULL,
  response TEXT,

  -- Extracted data
  brand_mentioned BOOLEAN,
  brand_sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  entities JSONB,
  citations TEXT[], -- URLs cited by AI
  position INTEGER, -- Position in response (1 = first mention)

  queried_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_brand_model (brand_id, ai_model),
  INDEX idx_queried_at (queried_at DESC)
);

-- Task integrations (Jira, Trello, Asana sync)
CREATE TABLE task_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,

  integration_type VARCHAR(50), -- 'jira', 'trello', 'asana'
  external_task_id VARCHAR(255),
  external_task_url VARCHAR(1000),

  sync_status VARCHAR(20), -- 'synced', 'failed', 'pending'
  last_synced_at TIMESTAMP,
  sync_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_recommendation (recommendation_id),
  UNIQUE (recommendation_id, integration_type)
);

-- Recommendation templates
CREATE TABLE recommendation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title_template VARCHAR(500),
  description_template TEXT,
  action_items_template JSONB,
  code_snippet_template TEXT,

  -- Conditions for triggering
  trigger_conditions JSONB,

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  success_rate FLOAT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User feedback on recommendations
CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  helpful BOOLEAN,
  difficulty_rating INTEGER, -- 1-5 (1=very easy, 5=very hard)
  impact_rating INTEGER, -- 1-5 (1=no impact, 5=huge impact)
  comments TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Redis Cache Structure

```typescript
// Cache keys structure
const CACHE_KEYS = {
  // Content inventory cache (24 hours)
  contentInventory: (brandId: string) => `content:inventory:${brandId}`,

  // AI query cache (1 hour)
  aiQuery: (model: string, query: string) =>
    `ai:query:${model}:${hashQuery(query)}`,

  // Recommendations cache (30 minutes)
  recommendations: (brandId: string) => `recommendations:${brandId}`,

  // Schema validation cache (6 hours)
  schemaValidation: (url: string) => `schema:validation:${hashUrl(url)}`,

  // Priority calculation cache (15 minutes)
  priorityScores: (brandId: string) => `priority:scores:${brandId}`,
};

// Example cache usage
await redis.setex(
  CACHE_KEYS.recommendations(brandId),
  1800, // 30 minutes
  JSON.stringify(recommendations)
);
```

---

## 🔌 API Design

### REST API Endpoints

```typescript
// Recommendations API

/**
 * GET /api/recommendations/:brandId
 * Fetch all recommendations for a brand
 */
GET /api/recommendations/:brandId
Query params:
  - status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  - type: 'CONTENT_GAP' | 'SCHEMA_MISSING' | 'LANGUAGE_OPPORTUNITY' | 'VOICE_OPTIMIZATION'
  - priority_min: number (0-100)
  - language: string (ISO code)
  - limit: number (default 50)
  - offset: number (default 0)

Response:
{
  recommendations: Recommendation[],
  total: number,
  page: number,
  hasMore: boolean
}

/**
 * POST /api/recommendations/:brandId/generate
 * Trigger recommendation generation for a brand
 */
POST /api/recommendations/:brandId/generate
Body:
{
  analysisTypes: ['content_gap', 'schema', 'language', 'voice'], // Optional
  forceRefresh: boolean // Skip cache
}

Response:
{
  jobId: string,
  status: 'queued' | 'processing' | 'completed',
  estimatedTime: number // seconds
}

/**
 * PATCH /api/recommendations/:recommendationId
 * Update recommendation status/assignment
 */
PATCH /api/recommendations/:recommendationId
Body:
{
  status?: 'in_progress' | 'completed' | 'dismissed',
  assignedTo?: string (user ID),
  dueDate?: string (ISO date),
  dismissalReason?: string
}

/**
 * POST /api/recommendations/:recommendationId/sync
 * Sync recommendation to external PM tool
 */
POST /api/recommendations/:recommendationId/sync
Body:
{
  integrationType: 'jira' | 'trello' | 'asana',
  projectId: string,
  assignee?: string
}

Response:
{
  externalTaskId: string,
  externalTaskUrl: string,
  syncStatus: 'synced' | 'failed'
}

/**
 * POST /api/recommendations/:recommendationId/feedback
 * Submit feedback on recommendation
 */
POST /api/recommendations/:recommendationId/feedback
Body:
{
  helpful: boolean,
  difficultyRating: number, // 1-5
  impactRating: number, // 1-5
  comments?: string
}

// Content Analysis API

/**
 * POST /api/analysis/content-gap
 * Analyze content gaps for a brand
 */
POST /api/analysis/content-gap
Body:
{
  brandId: string,
  websiteUrl: string,
  targetAIModels: string[] // ['chatgpt', 'claude', 'perplexity']
}

/**
 * POST /api/analysis/schema-audit
 * Audit website structured data
 */
POST /api/analysis/schema-audit
Body:
{
  brandId: string,
  urls: string[] // Pages to audit
}

/**
 * POST /api/analysis/language-opportunities
 * Identify language expansion opportunities
 */
POST /api/analysis/language-opportunities
Body:
{
  brandId: string,
  targetMarkets: string[] // ['south_africa', 'kenya']
}

/**
 * POST /api/analysis/voice-optimization
 * Analyze content for voice search
 */
POST /api/analysis/voice-optimization
Body:
{
  brandId: string,
  contentUrls: string[]
}

// Integration API

/**
 * GET /api/integrations/:brandId
 * List connected integrations
 */
GET /api/integrations/:brandId

/**
 * POST /api/integrations/:brandId/connect
 * Connect to external tool
 */
POST /api/integrations/:brandId/connect
Body:
{
  integrationType: 'jira' | 'trello' | 'asana' | 'slack',
  credentials: {
    apiKey?: string,
    accessToken?: string,
    webhookUrl?: string
  },
  config: {
    defaultProject?: string,
    defaultBoard?: string
  }
}

/**
 * DELETE /api/integrations/:integrationId
 * Disconnect integration
 */
DELETE /api/integrations/:integrationId
```

### GraphQL Schema

```graphql
type Recommendation {
  id: ID!
  brandId: ID!
  type: RecommendationType!
  status: RecommendationStatus!

  # Priority scores
  priorityScore: Int!
  impactScore: Int!
  effortScore: Int!
  urgencyScore: Int!
  confidenceScore: Int!

  # Content
  title: String!
  description: String
  actionItems: [ActionItem!]!
  codeSnippet: String

  # Metadata
  language: String
  affectedAIModels: [String!]
  estimatedSearchVolume: Int
  competitorHasThis: Boolean

  # Tracking
  assignedTo: User
  dueDate: DateTime
  completedAt: DateTime
  dismissedAt: DateTime
  dismissalReason: String

  # Relations
  integration: TaskIntegration
  feedback: [RecommendationFeedback!]

  createdAt: DateTime!
  updatedAt: DateTime!
}

enum RecommendationType {
  CONTENT_GAP
  SCHEMA_MISSING
  LANGUAGE_OPPORTUNITY
  VOICE_OPTIMIZATION
  TECHNICAL_SEO
}

enum RecommendationStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  DISMISSED
}

type ActionItem {
  id: ID!
  description: String!
  completed: Boolean!
  order: Int!
}

type Query {
  recommendations(
    brandId: ID!
    status: RecommendationStatus
    type: RecommendationType
    language: String
    priorityMin: Int
    limit: Int
    offset: Int
  ): RecommendationConnection!

  recommendation(id: ID!): Recommendation

  recommendationStats(brandId: ID!): RecommendationStats!
}

type Mutation {
  generateRecommendations(
    brandId: ID!
    analysisTypes: [AnalysisType!]
    forceRefresh: Boolean
  ): GenerateRecommendationsJob!

  updateRecommendation(
    id: ID!
    input: UpdateRecommendationInput!
  ): Recommendation!

  syncRecommendation(
    id: ID!
    integrationType: IntegrationType!
    projectId: String!
  ): TaskIntegration!

  submitFeedback(
    recommendationId: ID!
    input: FeedbackInput!
  ): RecommendationFeedback!
}

type Subscription {
  recommendationUpdated(brandId: ID!): Recommendation!
  recommendationGenerated(brandId: ID!): Recommendation!
}
```

---

## 🔄 Data Flow Diagrams

### Recommendation Generation Flow

```
┌─────────────┐
│   User      │
│ Triggers    │
│ Analysis    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  API: POST /api/recommendations/generate     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Queue Job (Bull/BullMQ)                    │
│  - Job ID created                            │
│  - Priority: High                            │
│  - Timeout: 5 minutes                        │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Background Worker                           │
│  Parallel execution:                         │
│  ┌──────────────────────────────────────┐   │
│  │ 1. Content Gap Analyzer              │   │
│  │    - Crawl website                   │   │
│  │    - Extract entities                │   │
│  │    - Query AI models                 │   │
│  │    - Compare & generate recs         │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 2. Schema Auditor                    │   │
│  │    - Parse HTML                      │   │
│  │    - Validate schemas                │   │
│  │    - Generate code snippets          │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 3. Language Planner                  │   │
│  │    - Identify content gaps           │   │
│  │    - Get local keywords              │   │
│  │    - Generate recommendations        │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 4. Voice Optimizer                   │   │
│  │    - Analyze readability             │   │
│  │    - Detect tone                     │   │
│  │    - Suggest improvements            │   │
│  └──────────────────────────────────────┘   │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Priority Calculator                         │
│  - Calculate impact, effort, urgency         │
│  - Rank all recommendations                  │
│  - Apply ML adjustments (future)             │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Database Storage                            │
│  - Insert recommendations                    │
│  - Update content inventory                  │
│  - Cache results (Redis)                     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  WebSocket Notification                      │
│  - Notify user: "50 new recommendations"     │
│  - Update dashboard in real-time             │
└─────────────────────────────────────────────┘
```

### Task Sync Flow (Jira/Trello/Asana)

```
┌─────────────┐
│   User      │
│ Clicks      │
│ "Sync to    │
│  Jira"      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  API: POST /api/recommendations/:id/sync     │
│  Body: { integrationType: 'jira', ... }      │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Validate Integration                        │
│  - Check Jira credentials exist              │
│  - Verify API connection                     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Transform Recommendation → Jira Task        │
│  ┌───────────────────────────────────────┐  │
│  │ Title → Jira Issue Summary            │  │
│  │ Description → Jira Issue Description  │  │
│  │ Action Items → Jira Checklist         │  │
│  │ Code Snippet → Jira Comment           │  │
│  │ Priority → Jira Priority              │  │
│  │ Due Date → Jira Due Date              │  │
│  └───────────────────────────────────────┘  │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Create Jira Issue (API Call)                │
│  POST https://your-domain.atlassian.net/     │
│       rest/api/3/issue                       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Store Integration Mapping                   │
│  - recommendation_id → jira_issue_id         │
│  - external_task_url                         │
│  - sync_status: 'synced'                     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Set Up Webhook (Bi-directional Sync)        │
│  - Jira → Our Platform: Status updates       │
│  - Listen for Jira issue status changes      │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Return Success to User                      │
│  - Show Jira issue link                      │
│  - Display sync status                       │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack Recommendations

### Backend

```typescript
// Framework
- Next.js 14+ (App Router) - Unified frontend + API
- TypeScript - Type safety throughout

// Database
- PostgreSQL (Neon) - Main data store
- Redis - Caching & job queues
- Pinecone/Qdrant - Vector database for semantic search

// Queue & Background Jobs
- BullMQ - Job queue for async processing
- Bull Board - Job monitoring dashboard

// AI/ML
- OpenAI API (GPT-4) - Entity extraction, content analysis
- Anthropic API (Claude) - Alternative LLM for diversity
- LangChain - LLM orchestration
- Hugging Face Transformers - Local NLP models

// Web Scraping & Analysis
- Playwright - Website crawling
- Cheerio - HTML parsing
- Mozilla Readability - Content extraction
- Metascraper - Metadata extraction

// Integrations
- Jira REST API - Task sync
- Trello API - Card creation
- Asana API - Task management
- Slack API - Notifications

// Monitoring
- Sentry - Error tracking
- PostHog - Product analytics
- Vercel Analytics - Performance monitoring
```

### Frontend

```typescript
// Framework
- Next.js 14+ (App Router)
- React 18
- TypeScript

// UI Components
- shadcn/ui - Component library
- Tailwind CSS - Styling
- Radix UI - Headless components
- Framer Motion - Animations

// State Management
- Zustand - Global state
- React Query (TanStack Query) - Server state
- React Hook Form - Form state

// Data Visualization
- Recharts - Charts & graphs
- React Flow - Workflow diagrams
- D3.js - Custom visualizations

// Real-time
- Socket.io - WebSocket connections
- React Query subscriptions - Real-time updates
```

### Infrastructure

```yaml
# Deployment
Platform: Vercel (Next.js native)
CDN: Vercel Edge Network
Environment: Serverless + Edge Functions

# Database
Primary: Neon PostgreSQL (serverless)
Cache: Upstash Redis (serverless)
Vector: Pinecone (managed)

# Storage
Static Assets: Vercel Blob Storage
File Uploads: Vercel Blob / S3

# Background Jobs
Queue: Upstash Redis + BullMQ
Workers: Vercel Serverless Functions (long-running)

# Monitoring
Errors: Sentry
Logs: Vercel Logs + Logtail
APM: Vercel Analytics + PostHog

# CI/CD
Version Control: GitHub
CI: GitHub Actions
Deployment: Vercel (auto-deploy)
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Basic recommendation generation working

**Tasks:**
1. ✅ Set up Next.js + PostgreSQL + Redis
2. ✅ Implement database schema
3. ✅ Build content crawler (Playwright)
4. ✅ Implement entity extraction (GPT-4)
5. ✅ Create Content Gap Analyzer (basic)
6. ✅ Build recommendation API endpoints
7. ✅ Create simple dashboard UI

**Deliverable:** Users can generate content gap recommendations for their website

---

### Phase 2: Schema & Language (Weeks 5-8)

**Goal:** Add schema auditing and language recommendations

**Tasks:**
1. ✅ Implement Schema Auditor
2. ✅ Create schema validation logic
3. ✅ Generate schema code snippets
4. ✅ Build Multi-Language Planner
5. ✅ Integrate translation APIs
6. ✅ Add language keyword research
7. ✅ Implement priority calculation

**Deliverable:** Complete recommendation engine with 3 analysis types

---

### Phase 3: Voice & Integrations (Weeks 9-12)

**Goal:** Voice optimization and task management sync

**Tasks:**
1. ✅ Build Voice Optimization Analyzer
2. ✅ Implement readability scoring
3. ✅ Create Q&A format converter
4. ✅ Integrate Jira API
5. ✅ Integrate Trello API
6. ✅ Integrate Asana API
7. ✅ Build task sync UI

**Deliverable:** Full recommendation engine with PM tool integrations

---

### Phase 4: Intelligence & Automation (Weeks 13-18)

**Goal:** ML-powered recommendations and automation

**Tasks:**
1. ✅ Implement feedback loop (learn from user actions)
2. ✅ Add ML-based priority adjustment
3. ✅ Build automated content generation
4. ✅ Create recommendation templates
5. ✅ Implement auto-scheduling
6. ✅ Add compliance checker (POPIA, GDPR)
7. ✅ Build GEO scorecard

**Deliverable:** Intelligent, self-improving recommendation engine

---

## 🎯 Success Metrics

### Technical Metrics

```typescript
interface PerformanceMetrics {
  // Speed
  recommendationGenerationTime: number; // Target: <60 seconds
  apiResponseTime: number; // Target: <500ms
  websiteCrawlTime: number; // Target: <30 seconds for 50 pages

  // Accuracy
  contentGapAccuracy: number; // Target: >85%
  schemaValidationAccuracy: number; // Target: >95%
  languageRecommendationRelevance: number; // Target: >80%

  // Scale
  concurrentAnalysisJobs: number; // Target: 100+
  recommendationsPerBrand: number; // Target: 20-50
  cachHitRate: number; // Target: >70%
}
```

### Business Metrics

```typescript
interface BusinessMetrics {
  // Adoption
  recommendationsGenerated: number;
  recommendationsCompleted: number;
  completionRate: number; // Target: >40%

  // Engagement
  avgTimeToFirstAction: number; // Target: <24 hours
  recommendationsDismissedRate: number; // Target: <20%
  taskSyncRate: number; // Target: >30%

  // Impact
  avgHelpfulnessRating: number; // 1-5, Target: >4.0
  avgDifficultyRating: number; // 1-5, Target: <3.0
  avgImpactRating: number; // 1-5, Target: >3.5

  // Retention
  weeklyActiveRecommendationUsers: number;
  monthlyRecommendationCompletions: number;
}
```

---

## 🔒 Security & Compliance Considerations

### Data Privacy

```typescript
// POPIA & GDPR Compliance Checklist

const complianceChecks = {
  dataCollection: {
    // Only collect necessary data
    minimumDataCollection: true,

    // Explicit user consent
    consentRequired: ['website_crawling', 'ai_querying', 'data_storage'],

    // Data retention policies
    retentionPeriod: '12 months',
    autoDelete: true,
  },

  dataStorage: {
    // Encryption at rest
    encryptedStorage: true,

    // Encryption in transit
    tlsRequired: true,

    // Data residency (African markets)
    dataResidency: 'south_africa', // or 'eu' for GDPR
  },

  userRights: {
    // Right to access
    dataExport: true,

    // Right to deletion
    accountDeletion: true,
    dataErasure: true,

    // Right to portability
    dataPortability: true,
  },

  aiEthics: {
    // Transparent AI usage
    aiDisclosure: true,

    // No discriminatory recommendations
    biasTesting: true,

    // Human oversight
    humanReview: 'optional',
  },
};
```

### API Security

```typescript
// Rate limiting per API key
const rateLimits = {
  recommendations: {
    generate: '10 requests/hour',
    list: '100 requests/minute',
  },
  analysis: {
    contentGap: '5 requests/hour',
    schemaAudit: '10 requests/hour',
  },
};

// Authentication
const authMethods = {
  apiKey: true, // For server-to-server
  jwt: true, // For user sessions
  oauth: ['google', 'microsoft'], // For integrations
};

// Input validation
const validation = {
  urlValidation: 'strict', // Prevent SSRF attacks
  sqlInjectionPrevention: true,
  xssPrevention: true,
  maxPayloadSize: '10MB',
};
```

---

## 📝 Next Steps

### Immediate Actions (This Week)

1. **Set up development environment**
   - Initialize Next.js project
   - Configure PostgreSQL (Neon)
   - Set up Redis (Upstash)
   - Configure environment variables

2. **Implement database schema**
   - Create migration files
   - Set up Drizzle ORM
   - Seed test data

3. **Build basic content crawler**
   - Playwright setup
   - Sitemap parser
   - HTML content extractor

4. **Create first API endpoint**
   - `POST /api/analysis/content-gap`
   - Test with sample website

### Week 2-4 Priorities

1. **Complete Content Gap Analyzer**
2. **Build recommendation UI**
3. **Implement priority calculation**
4. **Add caching layer (Redis)**

---

## 🎨 UI/UX Workflow Examples

### Recommendation Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Recommendations (47)          [Generate New] [Filters ▼]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔴 HIGH PRIORITY (12)                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🎯 Add Product Schema to /products/coffee-maker            │  │
│  │ Impact: 95  Effort: 20  Urgency: 85                        │  │
│  │ [Code Snippet ▼] [Sync to Jira] [Mark Complete]            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🌍 Create Swahili version of "About Us" page              │  │
│  │ Impact: 80  Effort: 60  Urgency: 70                        │  │
│  │ 3,200 searches/month in Kenya                              │  │
│  │ [Sample Titles] [Auto-Translate] [Sync to Trello]          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  🟡 MEDIUM PRIORITY (20)                                         │
│  🟢 LOW PRIORITY (15)                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**END OF TECHNICAL SPECIFICATION**

*Ready for implementation. Let's build this! 🚀*
