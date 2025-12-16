/**
 * FAQ Extractor
 * Phase 4: Extract Q&A from content and generate schema markup
 *
 * Features:
 * - Extract question-answer pairs from unstructured content
 * - Generate FAQ schema markup (JSON-LD)
 * - Validate FAQ content for featured snippet potential
 * - AI-powered Q&A extraction from content
 */

import { routeMessage, LLMProvider } from "@/lib/ai/router";
import { trackUsage } from "@/lib/ai/token-tracker";

// Types
export interface FAQItem {
  question: string;
  answer: string;
  confidence: number;
  extractionMethod: "pattern" | "ai" | "explicit";
  metadata?: {
    originalPosition: number;
    wordCount: number;
    hasLinks: boolean;
    hasCode: boolean;
  };
}

export interface FAQExtractionResult {
  faqs: FAQItem[];
  totalExtracted: number;
  averageConfidence: number;
  schemaMarkup: FAQSchemaMarkup;
  validationResults: FAQValidation;
}

export interface FAQSchemaMarkup {
  jsonLd: string;
  microdataHtml: string;
  isValid: boolean;
  warnings: string[];
}

export interface FAQValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  featuredSnippetPotential: number;
  suggestions: string[];
}

interface ValidationError {
  faqIndex: number;
  field: "question" | "answer";
  message: string;
}

interface ValidationWarning {
  faqIndex: number;
  message: string;
}

/**
 * Extract FAQs from content using pattern matching
 */
export function extractFAQsFromContent(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Method 1: Explicit Q: A: format
  // Note: Using [\s\S] instead of . with 's' flag for ES2017 compatibility
  const explicitPattern =
    /(?:Q|Question)[:.]?\s*([\s\S]+?)\s*(?:A|Answer)[:.]?\s*([\s\S]+?)(?=(?:Q|Question)[:.]?|$)/gi;
  let match;
  while ((match = explicitPattern.exec(content)) !== null) {
    const question = cleanText(match[1]);
    const answer = cleanText(match[2]);

    if (isValidFAQ(question, answer)) {
      faqs.push({
        question,
        answer,
        confidence: 95,
        extractionMethod: "explicit",
        metadata: {
          originalPosition: match.index,
          wordCount: answer.split(/\s+/).length,
          hasLinks: /\[.+\]\(.+\)|<a\s/i.test(answer),
          hasCode: /`[^`]+`|```[\s\S]+```/.test(answer),
        },
      });
    }
  }

  // Method 2: Question headers followed by content
  const headerQuestionPattern =
    /#{1,3}\s*(.+\?)\s*\n+([\s\S]*?)(?=#{1,3}\s|\n\n#{1,3}|$)/g;
  while ((match = headerQuestionPattern.exec(content)) !== null) {
    const question = cleanText(match[1]);
    const answer = cleanText(match[2]);

    if (isValidFAQ(question, answer) && !faqs.some((f) => f.question === question)) {
      faqs.push({
        question,
        answer,
        confidence: 85,
        extractionMethod: "pattern",
        metadata: {
          originalPosition: match.index,
          wordCount: answer.split(/\s+/).length,
          hasLinks: /\[.+\]\(.+\)|<a\s/i.test(answer),
          hasCode: /`[^`]+`|```[\s\S]+```/.test(answer),
        },
      });
    }
  }

  // Method 3: Inline questions followed by answers
  const inlineQuestionPattern =
    /([A-Z][^.!?]*\?)\s*\n?\s*([A-Z][^?]*?\.(?:[^.]*\.)?)/g;
  while ((match = inlineQuestionPattern.exec(content)) !== null) {
    const question = cleanText(match[1]);
    const answer = cleanText(match[2]);

    // Only add if not already found and high confidence
    if (
      isValidFAQ(question, answer) &&
      !faqs.some(
        (f) =>
          f.question.toLowerCase().includes(question.toLowerCase().slice(0, 30))
      )
    ) {
      faqs.push({
        question,
        answer,
        confidence: 70,
        extractionMethod: "pattern",
        metadata: {
          originalPosition: match.index,
          wordCount: answer.split(/\s+/).length,
          hasLinks: /\[.+\]\(.+\)|<a\s/i.test(answer),
          hasCode: /`[^`]+`|```[\s\S]+```/.test(answer),
        },
      });
    }
  }

  return faqs.sort((a, b) => b.confidence - a.confidence);
}

/**
 * AI-powered FAQ extraction for complex content
 */
export async function extractFAQsWithAI(
  content: string,
  targetCount: number = 10,
  trackingInfo?: { orgId: string; userId: string }
): Promise<FAQItem[]> {
  const systemPrompt = `You are an expert at extracting FAQ (Frequently Asked Questions) content from text.
Your task is to identify and extract question-answer pairs that would be valuable for:
1. Featured snippets in Google search
2. AI assistant responses (ChatGPT, Claude, Perplexity)
3. Voice search answers

Extract clear, self-contained Q&A pairs where each answer can stand alone.`;

  const userPrompt = `Extract up to ${targetCount} FAQ pairs from this content:

---
${content.substring(0, 8000)}
---

Return a JSON array with this exact structure:
[
  {
    "question": "The question as it might be asked by a user",
    "answer": "A clear, direct answer (50-150 words ideal)",
    "confidence": 95
  }
]

Guidelines:
- Questions should start with What, How, Why, When, Where, Who, Is, Can, Does, etc.
- Answers should be direct and self-contained
- Prioritize questions likely to be searched
- Don't invent information not in the content
- Confidence: 90-100 for explicit Q&A, 70-89 for inferred, 50-69 for implied`;

  const response = await routeMessage(systemPrompt, userPrompt, {
    provider: "claude" as LLMProvider,
    maxTokens: 4000,
  });

  if (trackingInfo) {
    await trackUsage({
      organizationId: trackingInfo.orgId,
      userId: trackingInfo.userId,
      provider: response.provider,
      model: response.model,
      operation: "faq_extraction",
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    });
  }

  // Parse response
  try {
    const jsonMatch =
      response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
      response.content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return parsed.map(
        (
          item: { question: string; answer: string; confidence?: number },
          index: number
        ) => ({
          question: item.question,
          answer: item.answer,
          confidence: item.confidence || 80,
          extractionMethod: "ai" as const,
          metadata: {
            originalPosition: index,
            wordCount: item.answer.split(/\s+/).length,
            hasLinks: false,
            hasCode: false,
          },
        })
      );
    }
  } catch (error) {
    console.error("Failed to parse AI FAQ response:", error);
  }

  return [];
}

/**
 * Generate FAQ schema markup (JSON-LD)
 */
export function generateFAQSchema(faqs: FAQItem[]): FAQSchemaMarkup {
  const warnings: string[] = [];

  // Filter valid FAQs
  const validFaqs = faqs.filter((faq) => {
    if (faq.question.length < 10) {
      warnings.push(`Question too short: "${faq.question.substring(0, 20)}..."`);
      return false;
    }
    if (faq.answer.length < 20) {
      warnings.push(`Answer too short for: "${faq.question.substring(0, 30)}..."`);
      return false;
    }
    return true;
  });

  // Generate JSON-LD
  const jsonLdObject = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const jsonLd = JSON.stringify(jsonLdObject, null, 2);

  // Generate Microdata HTML
  const microdataHtml = `<div itemscope itemtype="https://schema.org/FAQPage">
${validFaqs
  .map(
    (faq) => `  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">${escapeHtml(faq.question)}</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text">${escapeHtml(faq.answer)}</div>
    </div>
  </div>`
  )
  .join("\n")}
</div>`;

  // Validate
  const isValid = validFaqs.length > 0;

  if (validFaqs.length === 0) {
    warnings.push("No valid FAQs to generate schema");
  }

  if (validFaqs.length > 10) {
    warnings.push(
      "More than 10 FAQs - Google may not display all in rich results"
    );
  }

  return {
    jsonLd,
    microdataHtml,
    isValid,
    warnings,
  };
}

/**
 * Generate complete FAQ extraction result with validation
 */
export async function extractAndValidateFAQs(
  content: string,
  options: {
    useAI?: boolean;
    targetCount?: number;
    trackingInfo?: { orgId: string; userId: string };
  } = {}
): Promise<FAQExtractionResult> {
  const { useAI = false, targetCount = 10, trackingInfo } = options;

  // Extract FAQs
  let faqs = extractFAQsFromContent(content);

  // Use AI extraction if enabled and we found few FAQs
  if (useAI && faqs.length < targetCount) {
    const aiFaqs = await extractFAQsWithAI(
      content,
      targetCount - faqs.length,
      trackingInfo
    );

    // Merge, avoiding duplicates
    for (const aiFaq of aiFaqs) {
      const isDuplicate = faqs.some(
        (f) =>
          f.question.toLowerCase().includes(aiFaq.question.toLowerCase().slice(0, 30)) ||
          aiFaq.question.toLowerCase().includes(f.question.toLowerCase().slice(0, 30))
      );

      if (!isDuplicate) {
        faqs.push(aiFaq);
      }
    }
  }

  // Limit to target count
  faqs = faqs.slice(0, targetCount);

  // Calculate average confidence
  const averageConfidence =
    faqs.length > 0
      ? Math.round(faqs.reduce((sum, f) => sum + f.confidence, 0) / faqs.length)
      : 0;

  // Generate schema
  const schemaMarkup = generateFAQSchema(faqs);

  // Validate
  const validationResults = validateFAQs(faqs);

  return {
    faqs,
    totalExtracted: faqs.length,
    averageConfidence,
    schemaMarkup,
    validationResults,
  };
}

/**
 * Validate FAQ content for quality and featured snippet potential
 */
export function validateFAQs(faqs: FAQItem[]): FAQValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  let featuredSnippetScore = 50; // Base score

  faqs.forEach((faq, index) => {
    // Question validation
    if (!faq.question.endsWith("?")) {
      errors.push({
        faqIndex: index,
        field: "question",
        message: "Question should end with a question mark",
      });
    }

    if (faq.question.length < 15) {
      warnings.push({
        faqIndex: index,
        message: "Question may be too short for featured snippet eligibility",
      });
    }

    if (faq.question.length > 150) {
      warnings.push({
        faqIndex: index,
        message: "Question may be too long - consider simplifying",
      });
    }

    // Answer validation
    if (faq.answer.length < 40) {
      errors.push({
        faqIndex: index,
        field: "answer",
        message: "Answer is too short (minimum 40 characters)",
      });
    }

    if (faq.answer.length > 500) {
      warnings.push({
        faqIndex: index,
        message:
          "Answer may be too long for featured snippets (ideal: 50-300 chars)",
      });
    }

    // Check for good answer patterns
    const startsWithDirectAnswer =
      /^(Yes|No|The|A|An|It|This|[A-Z][a-z]+\sis)/i.test(faq.answer);
    if (startsWithDirectAnswer) {
      featuredSnippetScore += 5;
    }

    // Check for promotional language (bad for snippets)
    if (/buy now|click here|discount|offer/i.test(faq.answer)) {
      warnings.push({
        faqIndex: index,
        message: "Promotional language may reduce featured snippet eligibility",
      });
      featuredSnippetScore -= 5;
    }
  });

  // General suggestions
  if (faqs.length < 5) {
    suggestions.push(
      "Consider adding more FAQs (5-10 is ideal for FAQ schema)"
    );
  }

  if (faqs.every((f) => f.answer.length > 200)) {
    suggestions.push(
      "Consider adding some shorter, punchier answers for voice search"
    );
  }

  const questionTypes = faqs.map((f) => {
    if (/^what/i.test(f.question)) return "what";
    if (/^how/i.test(f.question)) return "how";
    if (/^why/i.test(f.question)) return "why";
    if (/^when/i.test(f.question)) return "when";
    if (/^where/i.test(f.question)) return "where";
    if (/^who/i.test(f.question)) return "who";
    if (/^(is|are|can|does|do)/i.test(f.question)) return "yes-no";
    return "other";
  });

  const uniqueTypes = new Set(questionTypes);
  if (uniqueTypes.size < 3 && faqs.length >= 5) {
    suggestions.push(
      "Diversify question types (what, how, why, yes/no) for better coverage"
    );
  }

  // Adjust snippet score based on validation
  featuredSnippetScore = Math.max(0, Math.min(100, featuredSnippetScore));

  if (errors.length > 0) featuredSnippetScore -= 20;
  if (warnings.length > 3) featuredSnippetScore -= 10;
  if (faqs.length >= 5 && faqs.length <= 10) featuredSnippetScore += 10;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    featuredSnippetPotential: featuredSnippetScore,
    suggestions,
  };
}

/**
 * Generate FAQ suggestions based on content topic
 */
export async function generateFAQSuggestions(
  topic: string,
  existingFaqs: FAQItem[] = [],
  trackingInfo?: { orgId: string; userId: string }
): Promise<FAQItem[]> {
  const systemPrompt = `You are an FAQ expert. Generate common questions that users might ask about a topic.
Focus on questions that:
1. Are frequently searched on Google
2. AI assistants commonly answer
3. Could appear in "People Also Ask" boxes`;

  const existingQuestions = existingFaqs.map((f) => f.question).join("\n- ");

  const userPrompt = `Generate 10 FAQ questions about: "${topic}"

${existingFaqs.length > 0 ? `\nAlready covered (don't repeat):\n- ${existingQuestions}` : ""}

Return JSON array:
[
  {
    "question": "Question text?",
    "answer": "Suggested answer (2-3 sentences)",
    "confidence": 85
  }
]

Focus on:
- "What is..." definitions
- "How to..." processes
- "Why..." explanations
- Common misconceptions
- Comparison questions`;

  const response = await routeMessage(systemPrompt, userPrompt, {
    provider: "claude" as LLMProvider,
    maxTokens: 3000,
  });

  if (trackingInfo) {
    await trackUsage({
      organizationId: trackingInfo.orgId,
      userId: trackingInfo.userId,
      provider: response.provider,
      model: response.model,
      operation: "faq_suggestions",
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    });
  }

  try {
    const jsonMatch =
      response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
      response.content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return parsed.map(
        (
          item: { question: string; answer: string; confidence?: number },
          index: number
        ) => ({
          question: item.question,
          answer: item.answer,
          confidence: item.confidence || 80,
          extractionMethod: "ai" as const,
          metadata: {
            originalPosition: index,
            wordCount: item.answer.split(/\s+/).length,
            hasLinks: false,
            hasCode: false,
          },
        })
      );
    }
  } catch (error) {
    console.error("Failed to parse FAQ suggestions:", error);
  }

  return [];
}

// Utility functions
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[-*#]+\s*/, "")
    .trim();
}

function isValidFAQ(question: string, answer: string): boolean {
  // Question must be at least 10 chars and end with ?
  if (question.length < 10) return false;
  if (!question.includes("?")) return false;

  // Answer must be at least 20 chars
  if (answer.length < 20) return false;

  // Avoid false positives
  if (/^(if|when you|should you)\s/i.test(question)) return false;

  return true;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
