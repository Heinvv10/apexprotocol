import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { generateGeoPrompt } from './prompts/geo-templates';
import { renderVoiceBlock } from './brand-voice-extractor';
import type { BrandVoiceDescriptor } from '@/lib/db/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export interface ContentGenerationParams {
  contentType: string;
  keywords: string[];
  brandVoice: string;
  aiProvider: 'chatgpt' | 'claude';
  /**
   * FR-CRE-002 v0.5 — structured voice descriptors extracted from brand
   * samples. When provided, they're rendered into the system prompt as a
   * dedicated voice-guidance block alongside the free-form `brandVoice`
   * string. Both are additive — descriptor is more constrained, brandVoice
   * is more open-ended marketing copy.
   */
  voiceDescriptor?: BrandVoiceDescriptor | null;
}

/**
 * Compose the final system prompt used for generation. Exported so callers
 * can preview the exact prompt that'd run (useful for the side-by-side
 * with-voice vs without-voice UI).
 */
export function composeSystemPrompt(
  basePrompt: string,
  voiceDescriptor?: BrandVoiceDescriptor | null,
): string {
  if (!voiceDescriptor) return basePrompt;
  return `${basePrompt}\n\n${renderVoiceBlock(voiceDescriptor)}`;
}

export async function generateContent(params: ContentGenerationParams): Promise<string> {
  const { contentType, keywords, brandVoice, aiProvider, voiceDescriptor } = params;

  // Generate GEO-optimized prompt
  const prompt = generateGeoPrompt({
    contentType,
    keywords,
    brandVoice
  });

  const systemPrompt = composeSystemPrompt(prompt.systemPrompt, voiceDescriptor);

  if (aiProvider === 'claude') {
    // Generate content using Anthropic Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${prompt.userPrompt}`
        }
      ]
    });

    const contentBlock = response.content[0];
    return contentBlock.type === 'text' ? contentBlock.text : '';
  } else {
    // Generate content using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ],
      max_tokens: 4096
    });

    return response.choices[0].message.content || '';
  }
}

/**
 * Stream content generation for real-time preview
 *
 * Uses streaming APIs from OpenAI or Anthropic to yield content chunks.
 * Enables real-time content preview in the UI.
 */
export async function* streamContent(
  params: ContentGenerationParams
): AsyncGenerator<string, void, unknown> {
  const { contentType, keywords, brandVoice, aiProvider, voiceDescriptor } = params;

  // Generate GEO-optimized prompt
  const prompt = generateGeoPrompt({
    contentType,
    keywords,
    brandVoice,
  });

  const systemPrompt = composeSystemPrompt(prompt.systemPrompt, voiceDescriptor);

  if (aiProvider === "claude") {
    // Stream using Anthropic Claude
    const stream = anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${prompt.userPrompt}`,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  } else {
    // Stream using OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt.userPrompt },
      ],
      max_tokens: 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

export function getAvailableModels() {
  return {
    chatgpt: ['gpt-4o', 'gpt-4o-mini']
  };
}

export const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096
};