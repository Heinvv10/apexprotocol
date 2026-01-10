#!/usr/bin/env bun
/**
 * Auto Meta-Prompt Clarification Hook
 *
 * Triggers on UserPromptSubmit to detect vague prompts and automatically
 * inject clarification questions using the 10-point clarity framework.
 *
 * Part of the TÂCHES meta-prompting integration for PAI.
 */

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  enabled: process.env.PAI_META_PROMPT_ENABLED !== "false",
  minClarityThreshold: 6, // Overall score below this triggers clarification
  minWordCount: 10, // Prompts shorter than this are likely vague
  maxWordCount: 200, // Very long prompts likely already detailed
  skipKeywords: [
    "[skip clarification]",
    "[no clarification]",
    "[raw]",
  ] as const,
  vagueTerms: [
    "improve",
    "fix",
    "better",
    "optimize",
    "help",
    "update",
    "change",
    "modify",
    "refactor",
    "enhance",
    "upgrade",
    "make",
    "add",
    "create",
  ] as const,
  technicalTerms: [
    "api",
    "database",
    "authentication",
    "algorithm",
    "refactor",
    "architecture",
    "migration",
    "optimization",
    "integration",
    "deployment",
    "typescript",
    "react",
    "python",
    "fastapi",
    "next.js",
  ] as const,
};

// ============================================================================
// Type Definitions
// ============================================================================

interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
  weighted: number;
  confidence: number;
}

interface ClarityAssessment {
  overall_score: number;
  complexity: "simple" | "moderate" | "complex" | "underspecified";
  dimensions: DimensionScore[];
  should_clarify: boolean;
}

// ============================================================================
// Main Hook Logic
// ============================================================================

async function main() {
  console.log("[auto-meta-prompt-clarification] Hook triggered");

  // Check if enabled
  if (!CONFIG.enabled) {
    console.log(
      "[auto-meta-prompt-clarification] Disabled via PAI_META_PROMPT_ENABLED"
    );
    return;
  }

  // Get user prompt from stdin
  const userPrompt = await readPromptFromStdin();

  if (!userPrompt) {
    console.log("[auto-meta-prompt-clarification] No prompt provided");
    return;
  }

  // Check for skip keywords
  if (shouldSkipClarification(userPrompt)) {
    console.log("[auto-meta-prompt-clarification] Skip keyword detected");
    return;
  }

  // Quick vague prompt detection
  if (!isLikelyVague(userPrompt)) {
    console.log("[auto-meta-prompt-clarification] Prompt appears specific enough");
    return;
  }

  // Run full clarity assessment
  const assessment = assessClarity(userPrompt);

  if (!assessment.should_clarify) {
    console.log(
      `[auto-meta-prompt-clarification] Clarity score ${assessment.overall_score.toFixed(1)} above threshold`
    );
    return;
  }

  // Generate clarification questions
  const questions = generateQuestions(assessment.dimensions);

  if (questions.length === 0) {
    console.log(
      "[auto-meta-prompt-clarification] No questions generated"
    );
    return;
  }

  // Output clarification message to inject into conversation
  outputClarificationMessage(userPrompt, assessment, questions);

  console.log(
    `[auto-meta-prompt-clarification] Injected ${questions.length} clarification questions`
  );
}

// ============================================================================
// Prompt Detection
// ============================================================================

async function readPromptFromStdin(): Promise<string> {
  // Read from stdin (Claude passes user prompt here)
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8").trim();
}

function shouldSkipClarification(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return CONFIG.skipKeywords.some((keyword) =>
    lowerPrompt.includes(keyword.toLowerCase())
  );
}

function isLikelyVague(prompt: string): boolean {
  const wordCount = prompt.split(/\s+/).length;

  // Too short
  if (wordCount < CONFIG.minWordCount) {
    return true;
  }

  // Very long prompts are usually specific
  if (wordCount > CONFIG.maxWordCount) {
    return false;
  }

  // Check for vague terms
  const lowerPrompt = prompt.toLowerCase();
  const hasVagueTerm = CONFIG.vagueTerms.some((term) =>
    lowerPrompt.includes(term)
  );

  // Check for specificity indicators
  const hasFileReference = /\.(ts|tsx|js|jsx|py|md|json|yaml|yml|sql|sh|bat)/i.test(
    prompt
  );
  const hasCodeBlock = /```/.test(prompt);
  const hasNumberedList = /\d+\.\s/.test(prompt);
  const hasBulletList = /^[\s]*[-*]\s/m.test(prompt);
  const hasLineReference = /:\d+/.test(prompt); // file.ts:42

  const specificityScore =
    (hasFileReference ? 3 : 0) +
    (hasCodeBlock ? 3 : 0) +
    (hasNumberedList ? 2 : 0) +
    (hasBulletList ? 1 : 0) +
    (hasLineReference ? 2 : 0);

  // Vague if has vague term AND low specificity
  return hasVagueTerm && specificityScore < 5;
}

// ============================================================================
// Clarity Assessment
// ============================================================================

function assessClarity(prompt: string): ClarityAssessment {
  const dimensions: DimensionScore[] = [
    assessObjective(prompt),
    assessScope(prompt),
    assessContext(prompt),
    assessTechnicalSpecificity(prompt),
    assessQualityStandards(prompt),
    assessConstraints(prompt),
    assessInputOutput(prompt),
    assessPriority(prompt),
    assessExecutionStrategy(prompt),
    assessVerification(prompt),
  ];

  // Calculate overall score
  const totalWeighted = dimensions.reduce((sum, d) => sum + d.weighted, 0);
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const overall = totalWeighted / totalWeight;

  // Classify complexity
  const complexity = classifyComplexity(overall, prompt);

  return {
    overall_score: overall,
    complexity,
    dimensions,
    should_clarify: overall < CONFIG.minClarityThreshold,
  };
}

function assessObjective(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.7;

  // Check for explicit goals
  const hasGoalKeywords =
    /\b(should|must|need to|want to|goal|objective|accomplish|achieve)\b/i.test(
      prompt
    );
  if (hasGoalKeywords) score += 3;

  // Check for success criteria
  const hasSuccessCriteria =
    /\b(when|if|until|success|complete|done|finished)\b/i.test(prompt);
  if (hasSuccessCriteria) score += 2;

  // Check for measurable outcomes
  const hasMeasurableOutcome = /\b(\d+|percent|all|every|each|zero)\b/i.test(
    prompt
  );
  if (hasMeasurableOutcome) score += 2;

  // Check for action verbs (clear intent)
  const hasActionVerb =
    /\b(create|build|implement|fix|refactor|migrate|add|remove|update|integrate)\b/i.test(
      prompt
    );
  if (hasActionVerb) score += 3;

  return {
    dimension: "objective",
    score: Math.min(10, score),
    weight: 1.2,
    weighted: Math.min(10, score) * 1.2,
    confidence,
  };
}

function assessScope(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.6;

  // File/component references
  const fileCount = (
    prompt.match(/\.(ts|tsx|js|jsx|py|md|json|yaml|yml)/gi) || []
  ).length;
  score += Math.min(4, fileCount);

  // Explicit boundaries
  const hasBoundaries =
    /\b(only|just|specifically|exclude|not|don't|avoid)\b/i.test(prompt);
  if (hasBoundaries) score += 3;

  // Scope keywords
  const hasScopeKeywords =
    /\b(entire|all|complete|partial|limited to|scoped to|within)\b/i.test(
      prompt
    );
  if (hasScopeKeywords) score += 2;

  // Specific components mentioned
  const componentCount = (
    prompt.match(
      /\b(component|service|hook|util|helper|api|route|model|controller)\b/gi
    ) || []
  ).length;
  score += Math.min(1, componentCount);

  return {
    dimension: "scope",
    score: Math.min(10, score),
    weight: 1.0,
    weighted: Math.min(10, score) * 1.0,
    confidence,
  };
}

function assessContext(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.5;

  // Current state mentioned
  const hasCurrentState =
    /\b(current|currently|existing|now|at present)\b/i.test(prompt);
  if (hasCurrentState) score += 2;

  // History/background
  const hasHistory = /\b(because|since|previously|used to|was)\b/i.test(
    prompt
  );
  if (hasHistory) score += 2;

  // Constraints mentioned
  const hasConstraints =
    /\b(must|cannot|limited|restriction|requirement|constraint)\b/i.test(
      prompt
    );
  if (hasConstraints) score += 2;

  // Problem description
  const hasProblem =
    /\b(issue|problem|bug|error|broken|failing|doesn't work)\b/i.test(prompt);
  if (hasProblem) score += 2;

  // Project context
  const hasProjectContext =
    /\b(project|codebase|system|application|platform)\b/i.test(prompt);
  if (hasProjectContext) score += 2;

  return {
    dimension: "context",
    score: Math.min(10, score),
    weight: 1.1,
    weighted: Math.min(10, score) * 1.1,
    confidence,
  };
}

function assessTechnicalSpecificity(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.8;

  // Specific technologies mentioned
  const techCount = CONFIG.technicalTerms.filter((term) =>
    prompt.toLowerCase().includes(term)
  ).length;
  score += Math.min(4, techCount * 2);

  // Version numbers
  const hasVersions = /\b(v?\d+\.\d+|\d+\.\d+\.\d+)\b/i.test(prompt);
  if (hasVersions) score += 2;

  // API/function names
  const hasAPIs = /\b[a-z]+\(\)|[a-z]+\.[a-z]+\(\)/i.test(prompt);
  if (hasAPIs) score += 2;

  // Code examples
  const hasCode = /```/.test(prompt);
  if (hasCode) score += 2;

  return {
    dimension: "technical_specificity",
    score: Math.min(10, score),
    weight: 1.3,
    weighted: Math.min(10, score) * 1.3,
    confidence,
  };
}

function assessQualityStandards(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.6;

  // Testing mentioned
  const hasTesting =
    /\b(test|tests|testing|coverage|unit test|e2e|integration)\b/i.test(
      prompt
    );
  if (hasTesting) score += 3;

  // Code quality
  const hasQuality =
    /\b(eslint|typescript|type|types|linting|formatting|prettier)\b/i.test(
      prompt
    );
  if (hasQuality) score += 2;

  // Performance
  const hasPerformance = /\b(performance|speed|fast|optimize|efficient)\b/i.test(
    prompt
  );
  if (hasPerformance) score += 2;

  // Documentation
  const hasDocs = /\b(document|documentation|comment|comments|readme)\b/i.test(
    prompt
  );
  if (hasDocs) score += 1;

  // Best practices
  const hasBestPractices = /\b(best practice|pattern|convention|standard)\b/i.test(
    prompt
  );
  if (hasBestPractices) score += 2;

  return {
    dimension: "quality_standards",
    score: Math.min(10, score),
    weight: 1.2,
    weighted: Math.min(10, score) * 1.2,
    confidence,
  };
}

function assessConstraints(prompt: string): DimensionScore {
  let score = 5; // Default medium
  let confidence = 0.5;

  // Explicit constraints
  const constraintCount = (
    prompt.match(
      /\b(must|cannot|should not|don't|avoid|within|under|less than|more than)\b/gi
    ) || []
  ).length;
  score += Math.min(3, constraintCount);

  // Time constraints
  const hasTime = /\b(urgent|asap|today|tomorrow|deadline|by)\b/i.test(prompt);
  if (hasTime) score += 1;

  // Compatibility constraints
  const hasCompatibility =
    /\b(compatible|support|maintain|preserve|keep|retain)\b/i.test(prompt);
  if (hasCompatibility) score += 1;

  return {
    dimension: "constraints",
    score: Math.min(10, score),
    weight: 1.0,
    weighted: Math.min(10, score) * 1.0,
    confidence,
  };
}

function assessInputOutput(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.6;

  // Input mentioned
  const hasInput =
    /\b(input|accept|receive|takes?|parameter|argument|data)\b/i.test(prompt);
  if (hasInput) score += 3;

  // Output mentioned
  const hasOutput =
    /\b(output|return|produce|generate|result|response)\b/i.test(prompt);
  if (hasOutput) score += 3;

  // Data types
  const hasTypes =
    /\b(string|number|boolean|object|array|interface|type)\b/i.test(prompt);
  if (hasTypes) score += 2;

  // Error handling
  const hasErrors = /\b(error|exception|throw|catch|handle)\b/i.test(prompt);
  if (hasErrors) score += 2;

  return {
    dimension: "input_output",
    score: Math.min(10, score),
    weight: 1.1,
    weighted: Math.min(10, score) * 1.1,
    confidence,
  };
}

function assessPriority(prompt: string): DimensionScore {
  let score = 5; // Default medium
  let confidence = 0.7;

  // Urgency keywords
  const hasUrgency =
    /\b(critical|urgent|asap|emergency|immediately|now|blocker|blocking)\b/i.test(
      prompt
    );
  if (hasUrgency) score += 3;

  // Explicit priority
  const hasPriority =
    /\b(high priority|low priority|medium priority|important|priority)\b/i.test(
      prompt
    );
  if (hasPriority) score += 2;

  return {
    dimension: "priority",
    score: Math.min(10, score),
    weight: 0.9,
    weighted: Math.min(10, score) * 0.9,
    confidence,
  };
}

function assessExecutionStrategy(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.5;

  // Methodology mentioned
  const hasMethodology = /\b(tdd|test.driven|agile|incremental|iterative)\b/i.test(
    prompt
  );
  if (hasMethodology) score += 3;

  // Steps outlined
  const hasSteps = /\b(first|then|next|finally|step \d+|\d+\.)/.test(prompt);
  if (hasSteps) score += 3;

  // Pattern reference
  const hasPattern = /\b(pattern|follow|like|similar to|same as)\b/i.test(
    prompt
  );
  if (hasPattern) score += 2;

  // Approach specified
  const hasApproach = /\b(approach|method|way|manner|style)\b/i.test(prompt);
  if (hasApproach) score += 2;

  return {
    dimension: "execution_strategy",
    score: Math.min(10, score),
    weight: 1.0,
    weighted: Math.min(10, score) * 1.0,
    confidence,
  };
}

function assessVerification(prompt: string): DimensionScore {
  let score = 0;
  let confidence = 0.7;

  // Testing verification
  const hasTestVerification =
    /\b(test|verify|validate|check|ensure|confirm)\b/i.test(prompt);
  if (hasTestVerification) score += 3;

  // Specific scenarios
  const hasScenarios = /\b(scenario|case|situation|when|if)\b/i.test(prompt);
  if (hasScenarios) score += 2;

  // Acceptance criteria
  const hasAcceptance = /\b(accept|criteria|requirement|should|must)\b/i.test(
    prompt
  );
  if (hasAcceptance) score += 2;

  // Manual testing
  const hasManual = /\b(manually|manual|try|attempt|run)\b/i.test(prompt);
  if (hasManual) score += 1;

  // Edge cases
  const hasEdgeCases = /\b(edge case|corner case|boundary|limit)\b/i.test(
    prompt
  );
  if (hasEdgeCases) score += 2;

  return {
    dimension: "verification",
    score: Math.min(10, score),
    weight: 1.1,
    weighted: Math.min(10, score) * 1.1,
    confidence,
  };
}

function classifyComplexity(
  overallScore: number,
  prompt: string
): "simple" | "moderate" | "complex" | "underspecified" {
  const wordCount = prompt.split(/\s+/).length;
  const technicalDepth = CONFIG.technicalTerms.filter((term) =>
    prompt.toLowerCase().includes(term)
  ).length;

  if (overallScore >= 8 && wordCount > 100) return "simple";
  if (overallScore >= 6 && wordCount > 50) return "moderate";
  if (overallScore >= 4) return "complex";
  if (technicalDepth >= 3) return "complex";
  return "underspecified";
}

// ============================================================================
// Question Generation
// ============================================================================

function generateQuestions(dimensions: DimensionScore[]): string[] {
  // Sort by weighted score (lowest = highest priority)
  const sorted = [...dimensions].sort((a, b) => a.weighted - b.weighted);

  const questions: string[] = [];

  // Always ask about lowest 3 dimensions
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    const dimension = sorted[i];
    if (dimension.score < 7) {
      const question = getQuestionForDimension(dimension.dimension, dimension.score);
      if (question) questions.push(question);
    }
  }

  // Add critical dimensions if score < 5 (regardless of ranking)
  const critical = ["objective", "technical_specificity", "quality_standards"];
  for (const dimName of critical) {
    const dim = dimensions.find((d) => d.dimension === dimName);
    if (dim && dim.score < 5) {
      const question = getQuestionForDimension(dimName, dim.score);
      if (question && !questions.includes(question)) {
        questions.push(question);
      }
    }
  }

  // Limit to 5 questions max
  return questions.slice(0, 5);
}

function getQuestionForDimension(dimension: string, score: number): string | null {
  const templates: Record<string, Record<string, string>> = {
    objective: {
      fundamental: "What specific outcome should this accomplish?",
      clarifying: "What does success look like for this task?",
      refinement: "Are there any specific success metrics or criteria?",
    },
    scope: {
      fundamental: "Which files/components should be modified?",
      clarifying: "What should NOT be changed?",
      refinement: "Are there any off-limits areas?",
    },
    context: {
      fundamental: "What is the current state/implementation?",
      clarifying: "Why is this change needed?",
      refinement: "What constraints or requirements exist?",
    },
    technical_specificity: {
      fundamental: "Which specific libraries/frameworks should be used?",
      clarifying: "What specific APIs or patterns should be followed?",
      refinement: "Are there version requirements or preferred implementations?",
    },
    quality_standards: {
      fundamental: "What testing is required?",
      clarifying: "What code quality standards apply?",
      refinement: "What performance requirements exist?",
    },
    constraints: {
      fundamental: "What are the time/budget constraints?",
      clarifying: "What compatibility requirements exist?",
      refinement: "What must NOT change?",
    },
    input_output: {
      fundamental: "What data should be accepted as input?",
      clarifying: "What should be returned/produced?",
      refinement: "How should errors be handled?",
    },
    priority: {
      fundamental: "How urgent is this task?",
      clarifying: "What's blocking on this?",
      refinement: "What's the deadline?",
    },
    execution_strategy: {
      fundamental: "Should this follow any specific methodology?",
      clarifying: "Are there existing patterns to follow?",
      refinement: "Should this be done incrementally or all at once?",
    },
    verification: {
      fundamental: "How should this be tested?",
      clarifying: "What scenarios need verification?",
      refinement: "What edge cases should be tested?",
    },
  };

  const dimTemplates = templates[dimension];
  if (!dimTemplates) return null;

  if (score <= 3) return dimTemplates.fundamental;
  if (score <= 6) return dimTemplates.clarifying;
  return dimTemplates.refinement;
}

// ============================================================================
// Output Generation
// ============================================================================

function outputClarificationMessage(
  originalPrompt: string,
  assessment: ClarityAssessment,
  questions: string[]
): void {
  // Output system reminder to inject into conversation
  console.log("\n<system-reminder>");
  console.log("[Meta-Prompting Clarification]");
  console.log("");
  console.log(
    `The user's prompt has a clarity score of ${assessment.overall_score.toFixed(1)}/10 (complexity: ${assessment.complexity}).`
  );
  console.log("To improve the prompt's clarity, please ask the user:");
  console.log("");

  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q}`);
  });

  console.log("");
  console.log(
    "Feel free to proceed if the user provides a brief answer or says 'skip'."
  );
  console.log("After clarification, the prompt can be enhanced using PAI tools.");
  console.log("</system-reminder>");
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch((error) => {
  console.error(`[auto-meta-prompt-clarification] Error: ${error.message}`);
  process.exit(1);
});
