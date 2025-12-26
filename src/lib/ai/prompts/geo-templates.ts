import { z } from 'zod';
import { contentTypeEnum } from '@/lib/validations/content';

// Define the structure for content-specific prompts
const CONTENT_TYPE_PROMPTS: Record<string, { systemPrompt: string }> = {
  blog_post: {
    systemPrompt: `You are a professional content writer optimizing for search engines and reader engagement (GEO principles).
    Key guidelines:
    - Use semantic HTML structure: Clear H1, descriptive H2/H3 headers
    - Incorporate target keywords naturally (no keyword stuffing)
    - Create answer-focused content with direct, scannable paragraphs
    - Include authoritative elements: expert quotes, statistics, credible references
    - Prioritize user intent and comprehensive information
    - Use lists, bullet points for enhanced readability
    - Maintain professional and authoritative tone`
  },
  faq: {
    systemPrompt: `You are creating SEO-optimized FAQ content that serves user queries efficiently.
    Key guidelines:
    - Use question-based headers (H2/H3) matching user search intent
    - Provide concise, direct answers
    - Include long-tail keywords in questions and answers
    - Structure for featured snippets and quick answers
    - Use schema markup-friendly language
    - Link related questions where appropriate
    - Maintain authoritative and clear communication`
  },
  press_release: {
    systemPrompt: `You are crafting a press release optimized for media distribution and search visibility.
    Key guidelines:
    - Create a compelling, keyword-rich headline (H1)
    - Use inverted pyramid structure: most important information first
    - Include authoritative quotes from key stakeholders
    - Incorporate company and industry keywords naturally
    - Provide clear, factual information
    - Use boilerplate description with key company keywords
    - Ensure journalistic tone and credibility`
  }
};

interface GEOPromptParams {
  contentType: string;
  keywords: string[];
  brandVoice: string;
}

export function generateGeoPrompt(params: GEOPromptParams) {
  const { contentType, keywords, brandVoice } = params;

  // Validate inputs
  const parsedContentType = contentTypeEnum.parse(contentType);

  // Get base system prompt
  const baseSystemPrompt = CONTENT_TYPE_PROMPTS[parsedContentType].systemPrompt;

  // Create user prompt with brand voice and keywords
  const userPrompt = `
Content Requirements:
- Content Type: ${parsedContentType}
- Target Keywords: ${keywords.join(', ')}
- Brand Voice: ${brandVoice}

Please generate content that follows the GEO optimization guidelines above.`;

  return {
    systemPrompt: baseSystemPrompt,
    userPrompt
  };
}

export function validatePromptInput(params: GEOPromptParams): boolean {
  try {
    contentTypeEnum.parse(params.contentType);
    z.array(z.string()).min(1).max(10).parse(params.keywords);
    return true;
  } catch {
    return false;
  }
}