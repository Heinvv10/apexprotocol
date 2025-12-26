import { NextRequest, NextResponse } from 'next/server';
import { generateContentSchema } from '@/lib/validations/content';
import { generateContent } from '@/lib/ai/content-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = generateContentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: validationResult.error.errors[0].message
      }, { status: 400 });
    }

    const { contentType, keywords, brandVoice, aiProvider } = body;

    // Generate content using the selected AI provider
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