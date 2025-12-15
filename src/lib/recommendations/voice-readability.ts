/**
 * Voice Search Readability Scoring (F110)
 * Flesch-Kincaid readability analysis for voice search optimization
 */

import {
  VoiceReadabilityScore,
  VoiceOptimizationSuggestion,
} from "./types";

// Syllable count exceptions
const SYLLABLE_ADDITIONS: Record<string, number> = {
  "create": 2,
  "created": 2,
  "area": 3,
  "idea": 3,
  "real": 2,
  "being": 2,
  "doing": 2,
  "going": 2,
};

const SYLLABLE_SUBTRACTIONS: Record<string, number> = {
  "every": 2,
  "different": 2,
  "evening": 2,
  "business": 2,
  "family": 2,
  "several": 2,
  "chocolate": 2,
  "comfortable": 3,
  "interesting": 3,
  "vegetable": 3,
};

/**
 * Calculate voice search readability score
 */
export function calculateVoiceReadability(text: string): VoiceReadabilityScore {
  const sentences = splitSentences(text);
  const words = splitWords(text);
  const syllables = countTotalSyllables(words);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const syllableCount = syllables;

  // Flesch Reading Ease Score
  // 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const fleschReadingEase =
    wordCount > 0 && sentenceCount > 0
      ? 206.835 -
        1.015 * (wordCount / sentenceCount) -
        84.6 * (syllableCount / wordCount)
      : 0;

  // Flesch-Kincaid Grade Level
  // 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const fleschKincaid =
    wordCount > 0 && sentenceCount > 0
      ? 0.39 * (wordCount / sentenceCount) +
        11.8 * (syllableCount / wordCount) -
        15.59
      : 0;

  const averageSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const averageSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

  // Determine grade based on Flesch Reading Ease
  const grade = getReadabilityGrade(fleschReadingEase);

  // Generate suggestions for improvement
  const suggestions = generateSuggestions(text, {
    fleschReadingEase,
    averageSentenceLength,
    averageSyllablesPerWord,
    sentences,
    words,
  });

  return {
    fleschKincaid: Math.max(0, Math.round(fleschKincaid * 10) / 10),
    fleschReadingEase: Math.max(0, Math.min(100, Math.round(fleschReadingEase * 10) / 10)),
    averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
    averageSyllablesPerWord: Math.round(averageSyllablesPerWord * 100) / 100,
    grade,
    suggestions,
  };
}

/**
 * Analyze text for voice search optimization
 */
export function analyzeForVoiceSearch(text: string): {
  readability: VoiceReadabilityScore;
  voiceOptimizationScore: number;
  recommendations: string[];
} {
  const readability = calculateVoiceReadability(text);
  const recommendations: string[] = [];

  // Calculate voice optimization score (0-100)
  let voiceOptimizationScore = 50; // Base score

  // Adjust for reading ease
  if (readability.fleschReadingEase >= 60) {
    voiceOptimizationScore += 20;
  } else if (readability.fleschReadingEase >= 40) {
    voiceOptimizationScore += 10;
  } else {
    voiceOptimizationScore -= 10;
    recommendations.push("Simplify language - aim for 8th grade reading level or below");
  }

  // Adjust for sentence length
  if (readability.averageSentenceLength <= 15) {
    voiceOptimizationScore += 15;
  } else if (readability.averageSentenceLength <= 20) {
    voiceOptimizationScore += 10;
  } else {
    voiceOptimizationScore -= 10;
    recommendations.push("Shorten sentences - ideal length for voice is 15 words or less");
  }

  // Adjust for syllables per word
  if (readability.averageSyllablesPerWord <= 1.5) {
    voiceOptimizationScore += 15;
  } else if (readability.averageSyllablesPerWord <= 2.0) {
    voiceOptimizationScore += 5;
  } else {
    voiceOptimizationScore -= 10;
    recommendations.push("Use simpler words with fewer syllables");
  }

  // Check for voice-friendly patterns
  const hasQuestionFormat = /\?/.test(text);
  if (hasQuestionFormat) {
    voiceOptimizationScore += 5;
  } else {
    recommendations.push("Consider adding Q&A format content for voice queries");
  }

  // Check for conversational tone
  const hasConversationalTone = /\b(you|your|we|our|let's|here's|that's)\b/i.test(text);
  if (hasConversationalTone) {
    voiceOptimizationScore += 5;
  } else {
    recommendations.push("Use conversational tone with words like 'you', 'your', 'we'");
  }

  // Check for bullet points or lists (good for featured snippets)
  const hasLists = /^[\s]*[-•*\d.]\s/m.test(text);
  if (hasLists) {
    voiceOptimizationScore += 5;
  } else {
    recommendations.push("Consider using bullet points or numbered lists for better voice extraction");
  }

  // Clamp score
  voiceOptimizationScore = Math.max(0, Math.min(100, voiceOptimizationScore));

  return {
    readability,
    voiceOptimizationScore,
    recommendations,
  };
}

/**
 * Optimize text for voice search
 */
export function optimizeForVoice(text: string): {
  original: string;
  optimized: string;
  changes: VoiceOptimizationSuggestion[];
} {
  const changes: VoiceOptimizationSuggestion[] = [];
  let optimized = text;

  // Replace complex words with simpler alternatives
  const wordReplacements: Record<string, string> = {
    "utilize": "use",
    "implement": "use",
    "facilitate": "help",
    "comprehensive": "complete",
    "subsequently": "then",
    "approximately": "about",
    "demonstrate": "show",
    "accomplish": "do",
    "assistance": "help",
    "additional": "more",
    "communicate": "talk",
    "determine": "find",
    "establish": "set up",
    "numerous": "many",
    "obtain": "get",
    "provide": "give",
    "purchase": "buy",
    "requirement": "need",
    "sufficient": "enough",
    "terminate": "end",
  };

  for (const [complex, simple] of Object.entries(wordReplacements)) {
    const regex = new RegExp(`\\b${complex}\\b`, "gi");
    if (regex.test(optimized)) {
      changes.push({
        original: complex,
        suggestion: simple,
        reason: `"${simple}" is easier to understand in voice responses`,
      });
      optimized = optimized.replace(regex, simple);
    }
  }

  // Split long sentences
  const sentences = splitSentences(optimized);
  const longSentences = sentences.filter(
    (s) => splitWords(s).length > 20
  );

  for (const longSentence of longSentences) {
    const simplified = simplifyLongSentence(longSentence);
    if (simplified !== longSentence) {
      changes.push({
        original: longSentence,
        suggestion: simplified,
        reason: "Shorter sentences are easier for voice assistants to read",
      });
      optimized = optimized.replace(longSentence, simplified);
    }
  }

  // Remove passive voice where possible
  const passivePatterns = [
    { pattern: /was (\w+ed) by/gi, replacement: "$1" },
    { pattern: /is being (\w+ed)/gi, replacement: "$1s" },
    { pattern: /has been (\w+ed)/gi, replacement: "$1" },
  ];

  for (const { pattern, replacement } of passivePatterns) {
    const matches = optimized.match(pattern);
    if (matches) {
      for (const match of matches) {
        const simplified = match.replace(pattern, replacement);
        changes.push({
          original: match,
          suggestion: simplified,
          reason: "Active voice is clearer for voice responses",
        });
      }
      optimized = optimized.replace(pattern, replacement);
    }
  }

  return {
    original: text,
    optimized,
    changes,
  };
}

/**
 * Score content for specific voice platforms
 */
export function scoreForPlatform(
  text: string,
  platform: "alexa" | "google" | "siri"
): {
  score: number;
  platformSpecificTips: string[];
} {
  const baseAnalysis = analyzeForVoiceSearch(text);
  let score = baseAnalysis.voiceOptimizationScore;
  const tips: string[] = [];

  switch (platform) {
    case "alexa":
      // Alexa prefers concise answers
      if (text.length > 300) {
        score -= 10;
        tips.push("Alexa prefers answers under 300 characters for flash briefings");
      }
      // Check for speakable structure
      if (!/<speak>/.test(text) && !/\bSSML\b/.test(text)) {
        tips.push("Consider SSML markup for Alexa Skills");
      }
      break;

    case "google":
      // Google Assistant likes featured snippet format
      const wordCount = splitWords(text).length;
      if (wordCount > 40 && wordCount < 60) {
        score += 10;
        tips.push("Good length for Google featured snippets (40-60 words)");
      } else if (wordCount > 60) {
        tips.push("Trim to 40-60 words for optimal Google featured snippet length");
      }
      // Check for structured data compatibility
      if (!/schema\.org|JSON-LD/i.test(text)) {
        tips.push("Add FAQ or HowTo schema for better Google Assistant integration");
      }
      break;

    case "siri":
      // Siri integrates with Apple's ecosystem
      if (/\bApp Store\b|\biOS\b|\bApple\b/i.test(text)) {
        score += 5;
        tips.push("Apple ecosystem mentions detected - good for Siri");
      }
      // Natural language is important
      if (baseAnalysis.readability.fleschReadingEase < 50) {
        tips.push("Siri performs better with natural, conversational content");
      }
      break;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    platformSpecificTips: tips,
  };
}

/**
 * Check if content is voice-search ready
 */
export function isVoiceSearchReady(text: string): {
  ready: boolean;
  score: number;
  issues: string[];
  passed: string[];
} {
  const analysis = analyzeForVoiceSearch(text);
  const issues: string[] = [];
  const passed: string[] = [];

  // Check reading ease
  if (analysis.readability.fleschReadingEase >= 60) {
    passed.push("Reading ease is good for voice");
  } else {
    issues.push("Reading level too complex for voice");
  }

  // Check sentence length
  if (analysis.readability.averageSentenceLength <= 15) {
    passed.push("Sentence length is optimal for voice");
  } else if (analysis.readability.averageSentenceLength <= 20) {
    passed.push("Sentence length is acceptable for voice");
  } else {
    issues.push("Sentences too long for voice readability");
  }

  // Check word complexity
  if (analysis.readability.averageSyllablesPerWord <= 1.5) {
    passed.push("Word complexity is optimal");
  } else if (analysis.readability.averageSyllablesPerWord <= 2.0) {
    passed.push("Word complexity is acceptable");
  } else {
    issues.push("Words are too complex for voice");
  }

  // Check content length
  const wordCount = splitWords(text).length;
  if (wordCount >= 40 && wordCount <= 60) {
    passed.push("Content length is ideal for featured snippets");
  } else if (wordCount < 40) {
    issues.push("Content too short for comprehensive voice answers");
  } else if (wordCount > 100) {
    issues.push("Content may be too long for voice responses");
  }

  const ready = issues.length === 0;
  const score = analysis.voiceOptimizationScore;

  return { ready, score, issues, passed };
}

// Helper functions

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z\s'-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function countSyllables(word: string): number {
  const lowerWord = word.toLowerCase().replace(/[^a-z]/g, "");

  if (lowerWord.length <= 2) return 1;

  // Check exceptions
  if (SYLLABLE_ADDITIONS[lowerWord]) {
    return SYLLABLE_ADDITIONS[lowerWord];
  }
  if (SYLLABLE_SUBTRACTIONS[lowerWord]) {
    return SYLLABLE_SUBTRACTIONS[lowerWord];
  }

  // Count vowel groups
  let count = 0;
  let prevVowel = false;
  const vowels = "aeiouy";

  for (let i = 0; i < lowerWord.length; i++) {
    const isVowel = vowels.includes(lowerWord[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Handle silent 'e'
  if (lowerWord.endsWith("e") && !lowerWord.endsWith("le")) {
    count--;
  }

  // Handle 'es' and 'ed' endings
  if (lowerWord.endsWith("es") || lowerWord.endsWith("ed")) {
    if (!lowerWord.endsWith("ted") && !lowerWord.endsWith("ded")) {
      count--;
    }
  }

  return Math.max(1, count);
}

function countTotalSyllables(words: string[]): number {
  return words.reduce((sum, word) => sum + countSyllables(word), 0);
}

function getReadabilityGrade(fleschScore: number): "excellent" | "good" | "average" | "poor" {
  if (fleschScore >= 70) return "excellent";
  if (fleschScore >= 50) return "good";
  if (fleschScore >= 30) return "average";
  return "poor";
}

function generateSuggestions(
  text: string,
  metrics: {
    fleschReadingEase: number;
    averageSentenceLength: number;
    averageSyllablesPerWord: number;
    sentences: string[];
    words: string[];
  }
): VoiceOptimizationSuggestion[] {
  const suggestions: VoiceOptimizationSuggestion[] = [];

  // Find long sentences
  for (const sentence of metrics.sentences) {
    const wordCount = splitWords(sentence).length;
    if (wordCount > 20) {
      const simplified = simplifyLongSentence(sentence);
      if (simplified !== sentence) {
        suggestions.push({
          original: sentence,
          suggestion: simplified,
          reason: `Sentence has ${wordCount} words - consider breaking it up for voice clarity`,
        });
      }
    }
  }

  // Find complex words
  const complexWords: Record<string, string> = {
    "utilize": "use",
    "implement": "set up",
    "facilitate": "help",
    "comprehensive": "full",
    "subsequently": "then",
    "approximately": "about",
  };

  for (const word of metrics.words) {
    if (complexWords[word]) {
      suggestions.push({
        original: word,
        suggestion: complexWords[word],
        reason: "Simpler word improves voice readability",
      });
    }
  }

  return suggestions.slice(0, 10); // Limit suggestions
}

function simplifyLongSentence(sentence: string): string {
  // Try to split on conjunctions
  const conjunctions = [", and ", ", but ", ", so ", ", which ", ", that "];

  for (const conj of conjunctions) {
    if (sentence.includes(conj)) {
      const parts = sentence.split(conj);
      if (parts.length === 2 && parts[0].length > 10 && parts[1].length > 10) {
        return parts[0] + ". " + parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      }
    }
  }

  return sentence;
}
