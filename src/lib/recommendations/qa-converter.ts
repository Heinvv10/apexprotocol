/**
 * Q&A Format Converter (F111)
 * Convert content to Q&A format for featured snippet optimization
 */

import { createId } from "@paralleldrive/cuid2";
import { QAPair, QAConversionResult } from "./types";

// Question patterns to detect
const QUESTION_PATTERNS = [
  /^what\s+(?:is|are|does|do|was|were)/i,
  /^how\s+(?:to|do|does|can|much|many|long)/i,
  /^why\s+(?:is|are|do|does|should)/i,
  /^when\s+(?:is|are|do|does|should|was|were)/i,
  /^where\s+(?:is|are|do|does|can)/i,
  /^who\s+(?:is|are|was|were|can|should)/i,
  /^which\s+(?:is|are|one)/i,
  /^can\s+(?:i|you|we|they)/i,
  /^should\s+(?:i|you|we|they)/i,
  /^does\s+/i,
  /^is\s+(?:it|there|this)/i,
  /\?$/,
];

// Topic indicators for question generation
const TOPIC_INDICATORS: Record<string, string[]> = {
  definition: ["is", "are", "means", "refers to", "defined as"],
  process: ["steps", "process", "how to", "procedure", "method"],
  comparison: ["vs", "versus", "compared to", "difference between", "better than"],
  list: ["types of", "kinds of", "examples of", "best", "top"],
  reason: ["because", "reason", "why", "due to", "caused by"],
  time: ["when", "duration", "how long", "time", "deadline"],
  location: ["where", "located", "place", "location"],
  cost: ["cost", "price", "how much", "fee", "charge"],
};

/**
 * Convert content to Q&A pairs
 */
export function convertToQA(
  content: string,
  options: {
    maxPairs?: number;
    minConfidence?: number;
    topicContext?: string;
  } = {}
): QAConversionResult {
  const { maxPairs = 20, minConfidence = 0.5, topicContext } = options;

  const paragraphs = splitIntoParagraphs(content);
  const sentences = splitIntoSentences(content);
  const pairs: QAPair[] = [];
  let coveredContentLength = 0;

  // Extract existing Q&A pairs
  const existingQA = extractExistingQA(content);
  for (const qa of existingQA) {
    pairs.push(qa);
    coveredContentLength += qa.sourceText.length;
  }

  // Generate Q&A from headings
  const headingQA = generateFromHeadings(content, topicContext);
  for (const qa of headingQA) {
    if (!isDuplicate(qa, pairs)) {
      pairs.push(qa);
      coveredContentLength += qa.sourceText.length;
    }
  }

  // Generate Q&A from paragraphs
  for (const paragraph of paragraphs) {
    if (pairs.length >= maxPairs) break;

    const qa = generateFromParagraph(paragraph, topicContext);
    if (qa && qa.confidence >= minConfidence && !isDuplicate(qa, pairs)) {
      pairs.push(qa);
      coveredContentLength += qa.sourceText.length;
    }
  }

  // Generate Q&A from sentences with indicators
  for (const sentence of sentences) {
    if (pairs.length >= maxPairs) break;

    const qa = generateFromSentence(sentence, topicContext);
    if (qa && qa.confidence >= minConfidence && !isDuplicate(qa, pairs)) {
      pairs.push(qa);
      coveredContentLength += qa.sourceText.length;
    }
  }

  // Sort by confidence
  pairs.sort((a, b) => b.confidence - a.confidence);

  // Calculate coverage
  const coverage = content.length > 0 ? (coveredContentLength / content.length) * 100 : 0;

  // Generate FAQ schema
  const faqSchema = generateFAQSchema(pairs.filter((p) => p.confidence >= minConfidence));

  return {
    pairs: pairs.slice(0, maxPairs),
    originalContent: content,
    coverage: Math.min(100, Math.round(coverage)),
    faqSchema,
  };
}

/**
 * Extract existing Q&A pairs from content
 */
function extractExistingQA(content: string): QAPair[] {
  const pairs: QAPair[] = [];

  // Pattern: Question followed by answer
  const qaPattern = /([^.!?\n]+\?)\s*([^?]+?)(?=\n\n|\n[A-Z]|$)/g;
  let match;

  while ((match = qaPattern.exec(content)) !== null) {
    const question = match[1].trim();
    const answer = match[2].trim();

    if (question.length > 10 && answer.length > 20) {
      pairs.push({
        question: cleanQuestion(question),
        answer: cleanAnswer(answer),
        sourceText: match[0],
        confidence: 0.95, // High confidence for explicit Q&A
      });
    }
  }

  return pairs;
}

/**
 * Generate Q&A from headings
 */
function generateFromHeadings(content: string, topicContext?: string): QAPair[] {
  const pairs: QAPair[] = [];

  // Match headings (markdown style or HTML)
  const headingPattern = /(?:^#{1,6}\s+(.+)$|<h[1-6][^>]*>([^<]+)<\/h[1-6]>)/gm;
  let match;

  while ((match = headingPattern.exec(content)) !== null) {
    const heading = (match[1] || match[2]).trim();

    // Find content after heading
    const startIndex = match.index + match[0].length;
    const nextHeadingMatch = content.slice(startIndex).match(/^#{1,6}\s+|<h[1-6]/m);
    const endIndex = nextHeadingMatch
      ? startIndex + (nextHeadingMatch.index || 0)
      : Math.min(startIndex + 500, content.length);

    const followingContent = content.slice(startIndex, endIndex).trim();

    if (followingContent.length > 20) {
      const question = headingToQuestion(heading, topicContext);
      if (question) {
        pairs.push({
          question,
          answer: truncateAnswer(followingContent),
          sourceText: `${heading}\n${followingContent}`,
          confidence: 0.85,
        });
      }
    }
  }

  return pairs;
}

/**
 * Generate Q&A from a paragraph
 */
function generateFromParagraph(paragraph: string, topicContext?: string): QAPair | null {
  // Skip short paragraphs
  if (paragraph.length < 50) return null;

  // Detect topic type
  const topicType = detectTopicType(paragraph);
  if (!topicType) return null;

  // Generate question based on topic type
  const question = generateQuestion(paragraph, topicType, topicContext);
  if (!question) return null;

  // Extract answer
  const answer = extractAnswer(paragraph, topicType);

  return {
    question,
    answer,
    sourceText: paragraph,
    confidence: calculateConfidence(paragraph, topicType),
  };
}

/**
 * Generate Q&A from a sentence
 */
function generateFromSentence(sentence: string, topicContext?: string): QAPair | null {
  // Skip short sentences
  if (sentence.length < 30) return null;

  // Check for definition pattern
  const definitionMatch = sentence.match(/^(.+?)\s+(?:is|are|means|refers to)\s+(.+)$/i);
  if (definitionMatch) {
    const subject = definitionMatch[1].trim();
    const definition = definitionMatch[2].trim();

    return {
      question: `What is ${subject}?`,
      answer: `${subject} is ${definition}`,
      sourceText: sentence,
      confidence: 0.8,
    };
  }

  // Check for list indicators
  const listMatch = sentence.match(/(?:types|kinds|examples|benefits|advantages|features)\s+(?:of|include)/i);
  if (listMatch) {
    const topicType = detectTopicType(sentence);
    const question = generateQuestion(sentence, topicType || "list", topicContext);

    if (question) {
      return {
        question,
        answer: cleanAnswer(sentence),
        sourceText: sentence,
        confidence: 0.7,
      };
    }
  }

  return null;
}

/**
 * Convert heading to question
 */
function headingToQuestion(heading: string, topicContext?: string): string | null {
  const lowerHeading = heading.toLowerCase();

  // Direct question patterns
  if (heading.endsWith("?")) {
    return cleanQuestion(heading);
  }

  // "How to" headings
  if (lowerHeading.startsWith("how to")) {
    return `How do you ${lowerHeading.slice(7)}?`;
  }

  // "Why" headings
  if (lowerHeading.startsWith("why")) {
    return `${heading}?`;
  }

  // "What is" patterns
  if (lowerHeading.startsWith("what is") || lowerHeading.startsWith("what are")) {
    return `${heading}?`;
  }

  // Definition headings (single noun or noun phrase)
  if (/^[A-Za-z\s]+$/.test(heading) && heading.split(" ").length <= 4) {
    const contextPrefix = topicContext ? `in ${topicContext}` : "";
    return `What is ${heading}${contextPrefix ? ` ${contextPrefix}` : ""}?`;
  }

  // Benefits/advantages headings
  if (lowerHeading.includes("benefit") || lowerHeading.includes("advantage")) {
    const subject = topicContext || "this";
    return `What are the benefits of ${subject}?`;
  }

  // Steps/process headings
  if (lowerHeading.includes("step") || lowerHeading.includes("process") || lowerHeading.includes("guide")) {
    return `How do you ${lowerHeading.replace(/steps?|process|guide/gi, "").trim()}?`;
  }

  // Generic conversion
  if (heading.length > 5 && heading.length < 60) {
    return `What is ${heading}?`;
  }

  return null;
}

/**
 * Detect topic type from content
 */
function detectTopicType(content: string): keyof typeof TOPIC_INDICATORS | null {
  const lowerContent = content.toLowerCase();

  for (const [type, indicators] of Object.entries(TOPIC_INDICATORS)) {
    for (const indicator of indicators) {
      if (lowerContent.includes(indicator)) {
        return type as keyof typeof TOPIC_INDICATORS;
      }
    }
  }

  return null;
}

/**
 * Generate question based on topic type
 */
function generateQuestion(
  content: string,
  topicType: keyof typeof TOPIC_INDICATORS,
  topicContext?: string
): string | null {
  const subject = extractSubject(content) || topicContext || "this";

  switch (topicType) {
    case "definition":
      return `What is ${subject}?`;
    case "process":
      return `How do you ${subject}?`;
    case "comparison":
      return `What is the difference between ${subject}?`;
    case "list":
      return `What are the types of ${subject}?`;
    case "reason":
      return `Why is ${subject} important?`;
    case "time":
      return `When should you ${subject}?`;
    case "location":
      return `Where can you find ${subject}?`;
    case "cost":
      return `How much does ${subject} cost?`;
    default:
      return `What is ${subject}?`;
  }
}

/**
 * Extract subject from content
 */
function extractSubject(content: string): string | null {
  // Try to find the main subject (usually the first noun phrase)
  const match = content.match(/^([A-Z][a-z]+(?:\s+[a-z]+){0,3})/);
  if (match) {
    return match[1];
  }

  // Try to extract from "X is Y" pattern
  const isMatch = content.match(/^(.+?)\s+(?:is|are)/i);
  if (isMatch && isMatch[1].length < 50) {
    return isMatch[1].trim();
  }

  return null;
}

/**
 * Extract answer based on topic type
 */
function extractAnswer(content: string, topicType: keyof typeof TOPIC_INDICATORS): string {
  let answer = content;

  // For definitions, extract the definition part
  if (topicType === "definition") {
    const defMatch = content.match(/(?:is|are|means|refers to)\s+(.+)/i);
    if (defMatch) {
      answer = defMatch[0];
    }
  }

  return truncateAnswer(cleanAnswer(answer));
}

/**
 * Calculate confidence for generated Q&A
 */
function calculateConfidence(content: string, topicType: keyof typeof TOPIC_INDICATORS | null): number {
  let confidence = 0.5; // Base confidence

  // Increase for clear topic type
  if (topicType) {
    confidence += 0.15;
  }

  // Increase for appropriate length
  if (content.length >= 50 && content.length <= 300) {
    confidence += 0.1;
  }

  // Increase for complete sentences
  if (content.endsWith(".") || content.endsWith("!")) {
    confidence += 0.05;
  }

  // Decrease for very long content
  if (content.length > 500) {
    confidence -= 0.1;
  }

  return Math.min(1, Math.max(0, confidence));
}

/**
 * Generate FAQ schema JSON-LD
 */
function generateFAQSchema(pairs: QAPair[]): string {
  if (pairs.length === 0) {
    return "";
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.answer,
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Optimize existing Q&A for featured snippets
 */
export function optimizeQAForFeaturedSnippets(pairs: QAPair[]): QAPair[] {
  return pairs.map((pair) => ({
    ...pair,
    question: optimizeQuestion(pair.question),
    answer: optimizeAnswer(pair.answer),
  }));
}

/**
 * Batch convert multiple content pieces
 */
export function batchConvertToQA(
  contents: Array<{ id: string; content: string; topic?: string }>,
  options?: {
    maxPairsPerContent?: number;
    minConfidence?: number;
  }
): Map<string, QAConversionResult> {
  const results = new Map<string, QAConversionResult>();

  for (const item of contents) {
    const result = convertToQA(item.content, {
      maxPairs: options?.maxPairsPerContent || 10,
      minConfidence: options?.minConfidence || 0.5,
      topicContext: item.topic,
    });
    results.set(item.id, result);
  }

  return results;
}

/**
 * Merge Q&A pairs from multiple sources
 */
export function mergeQAPairs(
  pairSets: QAPair[][],
  options?: {
    maxTotal?: number;
    minConfidence?: number;
  }
): QAPair[] {
  const allPairs: QAPair[] = [];
  const seen = new Set<string>();

  for (const pairs of pairSets) {
    for (const pair of pairs) {
      const key = normalizeForComparison(pair.question);
      if (!seen.has(key)) {
        seen.add(key);
        allPairs.push(pair);
      }
    }
  }

  // Filter by confidence and sort
  const filtered = allPairs
    .filter((p) => p.confidence >= (options?.minConfidence || 0.5))
    .sort((a, b) => b.confidence - a.confidence);

  return filtered.slice(0, options?.maxTotal || 50);
}

// Helper functions

function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function splitIntoSentences(content: string): string[] {
  return content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function cleanQuestion(question: string): string {
  return question
    .replace(/^#+\s*/, "") // Remove markdown heading markers
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

function cleanAnswer(answer: string): string {
  return answer
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/^\s*[-•*]\s+/gm, "") // Remove bullet points
    .trim();
}

function truncateAnswer(answer: string, maxLength: number = 300): string {
  if (answer.length <= maxLength) {
    return answer;
  }

  // Try to truncate at sentence boundary
  const truncated = answer.slice(0, maxLength);
  const lastSentence = truncated.lastIndexOf(".");

  if (lastSentence > maxLength * 0.6) {
    return truncated.slice(0, lastSentence + 1);
  }

  return truncated + "...";
}

function isDuplicate(newPair: QAPair, existingPairs: QAPair[]): boolean {
  const normalizedNew = normalizeForComparison(newPair.question);

  for (const existing of existingPairs) {
    const normalizedExisting = normalizeForComparison(existing.question);
    if (normalizedNew === normalizedExisting) {
      return true;
    }

    // Check for semantic similarity (simple approach)
    const newWords = new Set(normalizedNew.split(" "));
    const existingWords = new Set(normalizedExisting.split(" "));
    const intersection = new Set([...newWords].filter((x) => existingWords.has(x)));
    const similarity = intersection.size / Math.max(newWords.size, existingWords.size);

    if (similarity > 0.8) {
      return true;
    }
  }

  return false;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function optimizeQuestion(question: string): string {
  let optimized = question;

  // Ensure question ends with ?
  if (!optimized.endsWith("?")) {
    optimized += "?";
  }

  // Capitalize first letter
  optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

  return optimized;
}

function optimizeAnswer(answer: string): string {
  let optimized = answer;

  // Ensure answer ends with period
  if (!optimized.endsWith(".") && !optimized.endsWith("!") && !optimized.endsWith("?")) {
    optimized += ".";
  }

  // Capitalize first letter
  optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

  // Ensure reasonable length
  if (optimized.length > 300) {
    optimized = truncateAnswer(optimized, 300);
  }

  return optimized;
}
