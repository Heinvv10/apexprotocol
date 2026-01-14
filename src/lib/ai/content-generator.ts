import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { generateGeoPrompt } from './prompts/geo-templates';

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
}

export async function generateContent(params: ContentGenerationParams): Promise<string> {
  const { contentType, keywords, brandVoice, aiProvider } = params;

  // Generate GEO-optimized prompt
  const prompt = generateGeoPrompt({
    contentType,
    keywords,
    brandVoice
  });

  if (aiProvider === 'claude') {
    // Generate content using Anthropic Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
        }
      ]
    });

    const contentBlock = response.content[0];
    return contentBlock.type === 'text' ? contentBlock.text : '';
  } else {
    // Generate content using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt.systemPrompt },
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
  const { contentType, keywords, brandVoice, aiProvider } = params;

  // Generate GEO-optimized prompt
  const prompt = generateGeoPrompt({
    contentType,
    keywords,
    brandVoice,
  });

  if (aiProvider === "claude") {
    // Stream using Anthropic Claude
    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`,
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
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: prompt.systemPrompt },
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
    chatgpt: ['gpt-3.5-turbo', 'gpt-4-turbo']
  };
}

export const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096
};