import { NextRequest, NextResponse } from 'next/server';
import { generateContentSchema } from '@/lib/validations/content';
import { generateGeoPrompt } from '@/lib/ai/prompts/geo-templates';
import { createStreamingResponse, StreamEvent, StreamUsage } from '@/lib/ai/streaming';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = generateContentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: validationResult.error.issues[0].message
      }, { status: 400 });
    }

    const { contentType, keywords, brandVoice, aiProvider, streaming = false } = body;

    // Generate GEO-optimized prompt
    const prompt = generateGeoPrompt({
      contentType,
      keywords,
      brandVoice
    });

    // Determine whether to use streaming or non-streaming response
    if (streaming) {
      // Create streaming SSE response
      return createStreamingResponse(
        prompt.systemPrompt,
        prompt.userPrompt,
        {
          provider: aiProvider,
          maxTokens: 4096
        }
      );
    } else {
      // Use existing content generation for non-streaming
      const { generateContent } = await import('@/lib/ai/content-generator');
      const generatedContent = await generateContent({
        contentType,
        keywords,
        brandVoice,
        aiProvider
      });

      return NextResponse.json({
        success: true,
        content: generatedContent
      });
    }

  } catch (error) {
    console.error('Content generation error:', error);

    // Handle different types of errors
    if (error instanceof Error) {
      // Rate limit errors or specific provider errors
      if (error.message.includes('rate limit') || error.message.includes('API key')) {
        return NextResponse.json({
          success: false,
          error: 'AI service is currently unavailable. Please try again later.'
        }, { status: 429 });
      }
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during content generation.'
    }, { status: 500 });
  }
}

// Encourage using streaming for long content
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method with streaming=true for streaming content generation.',
    supportedFeatures: {
      streaming: true,
      providers: ['claude', 'chatgpt'],
      contentTypes: ['blog_post', 'press_release', 'social_media', 'email', 'faq']
    }
  });
}