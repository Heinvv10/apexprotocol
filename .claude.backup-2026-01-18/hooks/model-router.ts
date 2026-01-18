#!/usr/bin/env bun
/**
 * model-router.ts
 *
 * Main UserPromptSubmit hook for intelligent model routing
 * Analyzes prompts and selects optimal model tier before execution
 *
 * Hook Flow:
 * 1. Read user prompt from stdin
 * 2. Estimate complexity (multi-factor scoring)
 * 3. Select appropriate model (conservative approach)
 * 4. Update settings.json with selected model
 * 5. Log decision for analytics
 * 6. Output system reminder with routing decision
 *
 * Conservative Quality-First Approach:
 * - Default to Sonnet when uncertain (confidence < 70%)
 * - Wide Sonnet range (26-75) as safety net
 * - Respect manual overrides ("use opus", "think hard")
 * - Graceful degradation on errors → Sonnet
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { estimateComplexity } from '../routing/utils/complexity-classifier.ts';
import { selectModel } from '../routing/utils/model-selector.ts';
import { logDecision } from '../routing/utils/routing-logger.ts';

interface HookInput {
  prompt: string;
  context?: Record<string, any>;
}

interface Settings {
  model?: string;
  [key: string]: any;
}

/**
 * Get settings.json path
 */
function getSettingsPath(): string {
  // PAI_DIR already includes .claude, HOME/USERPROFILE does not
  if (process.env.PAI_DIR) {
    return join(process.env.PAI_DIR, 'settings.json');
  }
  return join(
    process.env.USERPROFILE || process.env.HOME || '~',
    '.claude',
    'settings.json'
  );
}

/**
 * Read current settings
 */
function readSettings(): Settings {
  try {
    const settingsPath = getSettingsPath();
    const content = readFileSync(settingsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('⚠️ Failed to read settings.json:', error);
    return {};
  }
}

/**
 * Write updated settings atomically
 */
function writeSettings(settings: Settings): void {
  try {
    const settingsPath = getSettingsPath();
    const tempPath = `${settingsPath}.tmp`;

    // Write to temp file first
    writeFileSync(tempPath, JSON.stringify(settings, null, 2), 'utf-8');

    // Atomic rename
    const fs = require('fs');
    fs.renameSync(tempPath, settingsPath);
  } catch (error) {
    console.error('⚠️ Failed to write settings.json:', error);
    throw error;
  }
}

/**
 * Update model in settings.json
 */
function updateModelInSettings(modelId: string): boolean {
  try {
    const settings = readSettings();
    settings.model = modelId;
    writeSettings(settings);
    return true;
  } catch (error) {
    console.error('⚠️ Failed to update model in settings:', error);
    return false;
  }
}

/**
 * Main hook execution
 */
async function main() {
  try {
    // Read input from stdin using stream reader (more reliable for pipes)
    const chunks: Uint8Array[] = [];
    const reader = Bun.stdin.stream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const input = Buffer.concat(chunks).toString('utf-8');
    const hookInput: HookInput = JSON.parse(input);

    const { prompt } = hookInput;

    // Step 1: Estimate complexity
    const complexity = estimateComplexity(prompt, hookInput.context || {});

    // Step 2: Select optimal model (conservative approach)
    const selection = await selectModel(complexity, prompt);

    // Step 3: Update settings.json with selected model
    const updateSuccess = updateModelInSettings(selection.model_id);

    if (!updateSuccess) {
      // Graceful degradation: Failed to update settings → use Sonnet
      console.error('⚠️ Failed to update settings, defaulting to Sonnet');
      updateModelInSettings('claude-sonnet-4-5-20250929');
    }

    // Step 4: Log decision for analytics (estimated token counts)
    const estimatedInputTokens = Math.min(Math.max(prompt.length / 2, 500), 5000);
    const estimatedOutputTokens = 3000; // Default estimate

    const decisionId = logDecision(
      prompt,
      complexity,
      selection,
      estimatedInputTokens,
      estimatedOutputTokens,
      false // Not LLM-assisted (will implement in next phase)
    );

    // Step 5: Output system reminder with routing decision
    const systemReminder = buildSystemReminder(selection, complexity, decisionId);
    console.log(systemReminder);

  } catch (error) {
    // Graceful degradation: Error occurred → default to Sonnet
    console.error('⚠️ Model routing hook error:', error);
    console.error('   Defaulting to Sonnet for safety');

    try {
      updateModelInSettings('claude-sonnet-4-5-20250929');

      // Still output a system reminder about the failure
      const fallbackReminder = `<system-reminder>
🔄 MODEL ROUTING - FALLBACK

An error occurred during model routing. Defaulting to Sonnet for safety.

Selected Model: Claude Sonnet 4.5
Reason: Error fallback (conservative default)
</system-reminder>`;
      console.log(fallbackReminder);
    } catch (fallbackError) {
      console.error('⚠️ Even fallback failed:', fallbackError);
      // Silent fail - don't block execution
    }
  }
}

/**
 * Build system reminder for Claude
 */
function buildSystemReminder(
  selection: any,
  complexity: any,
  decisionId: string
): string {
  const emoji = {
    haiku: '⚡',
    sonnet: '🎯',
    opus: '🧠',
  }[selection.model] || '🤖';

  const tierLabel = {
    FAST: 'FAST',
    STANDARD: 'STANDARD',
    ADVANCED: 'ADVANCED',
  }[selection.tier] || selection.tier;

  let reminder = `<system-reminder>
🔄 MODEL ROUTING - ${tierLabel}

${emoji} Selected Model: ${selection.model_id}
📊 Complexity: ${complexity.score}/100 (Confidence: ${(selection.confidence * 100).toFixed(0)}%)
💡 Reasoning: ${selection.reasoning}
`;

  // Add manual override notice
  if (selection.manual_override) {
    reminder += `✋ Manual Override: "${selection.manual_override}"\n`;
  }

  // Add conservative fallback notice
  if (selection.fallback_reason) {
    reminder += `🛡️ Conservative Fallback: ${selection.fallback_reason}\n`;
  }

  // Add cost estimate
  if (selection.cost_estimate) {
    const estimatedCost = (2000 / 1_000_000) * selection.cost_estimate.input_cost_per_mtok +
                         (3000 / 1_000_000) * selection.cost_estimate.output_cost_per_mtok;
    reminder += `💰 Estimated Cost: $${estimatedCost.toFixed(4)}\n`;
  }

  reminder += `
🔍 Decision ID: ${decisionId}

This prompt has been analyzed and routed to the optimal model tier.
</system-reminder>`;

  return reminder;
}

// Run the hook
main();
