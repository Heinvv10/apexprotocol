# Specification: AI Content Generation

## Overview

Implement AI-powered content generation that creates GEO (Generative Engine Optimization)-optimized content based on brand voice guidelines, target keywords, and visibility gaps. This feature completes the GEO workflow cycle (monitoring → optimization → generation) by enabling proactive content creation that improves AI search visibility while reducing manual effort for content teams.

## Workflow Type

**Type**: Feature

**Rationale**: This is a new feature implementation that introduces AI content generation capabilities to the platform. It is not a refactor, bugfix, or migration—it adds entirely new functionality to automate content creation with GEO optimization principles.

## Task Scope

### Services Involved
- **main** (primary) - Next.js application where content generation will be implemented

### This Task Will:
- [ ] Create AI content generation API endpoint supporting multiple providers (Anthropic Claude, OpenAI)
- [ ] Implement brand voice alignment system through prompt engineering
- [ ] Build multi-format content generation (blog posts, FAQ pages, press releases)
- [ ] Integrate keyword targeting and visibility gap optimization
- [ ] Design GEO optimization through system prompts and content structure
- [ ] Implement input validation with Zod schemas
- [ ] Create frontend interface for content generation requests

### Out of Scope:
- Content approval/review workflow automation
- Publishing/CMS integration
- Real-time collaboration on generated drafts
- A/B testing framework for generated content
- Analytics dashboard for content performance
- Automated content scheduling/posting

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- State Management: Zustand
- ORM: Drizzle
- Validation: Zod
- AI Providers: Anthropic Claude (@anthropic-ai/sdk), OpenAI (openai)

**Entry Point:** src/ directory

**How to Run:**
```bash
npm run dev
```

**Port:** 3000

**Key Dependencies:**
- @anthropic-ai/sdk (v0.71.2) - Primary AI provider
- openai (v6.10.0) - Secondary AI provider
- zod (v4.1.13) - Input validation
- next (v16.0.8) - Framework
- @upstash/ratelimit (v2.0.7) - Rate limiting (already installed)

**Environment Variables Required:**
- ANTHROPIC_API_KEY - Claude API access
- OPENAI_API_KEY - GPT API access

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/app/api/generate/route.ts` | main | Create new API route for content generation endpoint |
| `src/lib/ai/content-generator.ts` | main | Implement core content generation logic with provider abstraction |
| `src/lib/ai/prompts/geo-templates.ts` | main | Define GEO-optimized prompt templates for each content format |
| `src/lib/validations/content.ts` | main | Add Zod schemas for content generation input validation |
| `src/components/features/content/GenerateContentForm.tsx` | main | Create user interface for content generation requests |
| `src/types/content.ts` | main | Define TypeScript types for content generation |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| Existing API routes in `src/app/api/*` | Next.js App Router API route structure with error handling |
| Existing Zod schemas in `src/lib/validations/*` | Input validation patterns using `safeParse()` |
| Existing components in `src/components/*` | Component structure, Tailwind styling patterns |
| Package.json dependencies | Confirms @anthropic-ai/sdk and openai already installed |

## Patterns to Follow

### Next.js API Route Pattern

```typescript
// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validation and logic here
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- Export HTTP method functions (POST, GET, etc.)
- Use NextRequest/NextResponse types
- Handle errors with appropriate status codes
- Return JSON responses

### Anthropic Claude Integration Pattern

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096, // REQUIRED - will fail without it
  system: 'Brand voice prompt...', // Optional but recommended for consistency
  messages: [
    { role: 'user', content: 'Generate content...' }
  ]
});
```

**Key Points:**
- `max_tokens` parameter is mandatory
- System prompts optional but critical for brand voice alignment
- Messages must alternate user/assistant roles

### OpenAI Integration Pattern

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'Brand voice prompt...' },
    { role: 'user', content: 'Generate content...' }
  ],
  temperature: 0.7, // Optional, 0-2 range (higher = more creative)
  max_tokens: 4096 // Optional but recommended to control costs
});
```

**Key Points:**
- System message must be first in messages array
- Temperature controls creativity (higher = more creative)
- Different models have different context windows
- `max_tokens` optional but recommended for cost control

### Zod Validation Pattern

```typescript
import { z } from 'zod';

const contentGenerationSchema = z.object({
  contentType: z.enum(['blog', 'faq', 'press_release']),
  keywords: z.array(z.string()).min(1),
  brandVoice: z.string().min(10).optional(), // Optional - defaults to professional tone if not provided
  targetAudience: z.string().optional(),
  visibilityGaps: z.array(z.string()).optional(),
});

// Use safeParse() for proper error handling
const result = contentGenerationSchema.safeParse(input);
if (!result.success) {
  return { error: result.error.flatten() };
}
```

**Key Points:**
- Use `safeParse()` instead of `parse()` for error handling
- Define strict enums for controlled values
- Make optional fields explicit with `.optional()`
- Return flattened errors for better UX

## Requirements

### Functional Requirements

1. **Multi-Provider AI Generation**
   - Description: Support both Anthropic Claude and OpenAI GPT models with provider abstraction
   - Acceptance: Content can be generated using either provider seamlessly

2. **Brand Voice Alignment**
   - Description: Generated content matches user-provided brand voice and tone guidelines
   - Acceptance: System prompts incorporate brand voice, output reflects consistent tone

3. **GEO Optimization**
   - Description: Content optimized for AI search engines (citation-worthiness, authority signals, semantic structure)
   - Acceptance: Generated content includes headers, lists, direct answers, and authority markers

4. **Keyword Targeting**
   - Description: Integrate target keywords naturally into generated content
   - Acceptance: All provided keywords appear in content without keyword stuffing

5. **Multi-Format Support**
   - Description: Generate blog posts, FAQ pages, and press releases with format-specific templates
   - Acceptance: Each content type follows distinct structural patterns appropriate to format

6. **Input Validation**
   - Description: Validate all user inputs with Zod schemas before processing
   - Acceptance: Invalid inputs return clear error messages, valid inputs proceed to generation

7. **Error Handling**
   - Description: Gracefully handle API failures, rate limits, and malformed requests
   - Acceptance: User receives informative error messages, system logs errors for debugging

### Edge Cases

1. **API Rate Limiting** - Implement rate limiting using @upstash/ratelimit to prevent abuse; handle 429 responses with retry logic and exponential backoff
2. **Missing API Keys** - Return clear error message if environment variables not configured
3. **Extremely Long Keyword Lists** - Truncate or reject requests exceeding token limits
4. **Empty Brand Voice** - Use default professional tone if brand voice not provided
5. **Invalid Content Type** - Reject requests with validation error for unsupported formats
6. **API Timeout** - Set reasonable timeout limits (30-60s) and return timeout error message; consider streaming for long-running requests
7. **Malformed JSON Input** - Catch parsing errors and return 400 Bad Request
8. **User Request Rate Limits** - Use @upstash/ratelimit with sliding window (e.g., 10 requests per 10 minutes per user)

## Implementation Notes

### DO
- Use provider abstraction pattern to support both Anthropic and OpenAI
- Embed GEO principles in system prompts (no separate library exists)
- Implement different prompt strategies for blog/FAQ/press release formats
- Use `safeParse()` for Zod validation to get detailed error messages
- Set `max_tokens` parameter for Anthropic calls (required) and OpenAI calls (recommended for cost control)
- Put system message first in OpenAI messages array
- Implement rate limiting using existing @upstash/ratelimit package to prevent API abuse
- Consider streaming responses for long-form content generation to improve user experience
- Handle errors gracefully with appropriate HTTP status codes
- Log generation requests for debugging and monitoring
- Store API keys in environment variables, never in code

### DON'T
- Mix system prompt patterns between providers (Anthropic uses `system` field, OpenAI uses first message)
- Forget `max_tokens` for Anthropic (will cause API error)
- Use `parse()` instead of `safeParse()` for validation (throws unhandled errors)
- Hardcode prompt templates directly in API route (use separate template files)
- Return raw AI provider errors to client (sanitize error messages)
- Attempt to call Server Actions from client components (use API routes instead)
- Skip input validation to save time (security and stability risk)

## Development Environment

### Start Services

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Service URLs
- Main Application: http://localhost:3000

### Required Environment Variables

Add to `.env.local`:

```env
# AI Providers (REQUIRED)
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Already configured
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=...
```

Verify with:
```bash
# Check environment variables are loaded
node -e "console.log(process.env.ANTHROPIC_API_KEY ? 'Anthropic ✓' : 'Anthropic ✗')"
node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI ✓' : 'OpenAI ✗')"
```

## Success Criteria

The task is complete when:

1. [ ] AI generates content optimized for AI search visibility (GEO principles applied)
2. [ ] Content matches brand voice and tone guidelines (system prompts working)
3. [ ] Targets identified visibility gaps and keywords (keyword integration functional)
4. [ ] Multiple format support works (blog, FAQ, press release all generate correctly)
5. [ ] Input validation prevents invalid requests (Zod schemas enforced)
6. [ ] Both AI providers work (Anthropic and OpenAI functional)
7. [ ] API returns proper error messages for all failure scenarios
8. [ ] Frontend form submits requests and displays generated content
9. [ ] No console errors in browser or server logs
10. [ ] Existing tests still pass (no regressions)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| Content validation schema | `tests/unit/validations/content.test.ts` | Zod schemas correctly validate/reject inputs |
| Prompt template generation | `tests/unit/ai/prompts.test.ts` | Templates include brand voice, keywords, GEO structure |
| Provider abstraction | `tests/unit/ai/content-generator.test.ts` | Both Anthropic and OpenAI providers work correctly |
| Error handling | `tests/unit/api/generate.test.ts` | API handles missing keys, rate limits, malformed input |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| End-to-end generation | API → AI Provider | Full content generation flow with real API calls (using test keys) |
| Multi-format generation | API → Templates → AI | Each content type (blog/FAQ/press) generates correct structure |
| Keyword integration | API → Prompts → AI | Target keywords appear naturally in generated content |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Blog post generation | 1. Open content form 2. Select "blog" 3. Enter keywords/brand voice 4. Submit | Generated blog post displays with proper structure, keywords, brand tone |
| FAQ generation | 1. Open content form 2. Select "faq" 3. Enter keywords 4. Submit | FAQ format with questions/answers, GEO-optimized structure |
| Press release generation | 1. Open content form 2. Select "press_release" 3. Enter details 4. Submit | Press release format with dateline, quotes, boilerplate |
| Error handling | 1. Submit empty form 2. Submit invalid content type | Clear validation errors displayed, API returns 400 |

### Browser Verification

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Content Generation Form | `http://localhost:3000/dashboard/content/generate` | Form fields render, dropdowns work, submit button enabled |
| Generated Content Display | After form submission | Content displays in readable format, copy/export options work |
| Error States | Invalid submissions | Error messages display inline, form stays populated |

### API Verification

| Endpoint | Method | Test Case | Expected Response |
|----------|--------|-----------|-------------------|
| `/api/generate` | POST | Valid blog request | 200, generated content in response body |
| `/api/generate` | POST | Valid FAQ request | 200, Q&A format content |
| `/api/generate` | POST | Invalid content type | 400, validation error |
| `/api/generate` | POST | Missing API key (test) | 500, configuration error |
| `/api/generate` | POST | Malformed JSON | 400, parse error |

### Provider-Specific Verification

**Anthropic Claude:**
- [ ] `max_tokens` parameter is always set (required)
- [ ] System prompt includes brand voice guidelines
- [ ] API errors are caught and sanitized

**OpenAI GPT:**
- [ ] System message is first in messages array
- [ ] Temperature parameter controls output creativity
- [ ] API errors are caught and sanitized

### GEO Optimization Verification

Manually review generated content for:
- [ ] **Semantic structure**: Proper headers (H1, H2, H3), lists, clear sections
- [ ] **Citation-worthiness**: Statistics, expert quotes, authoritative language
- [ ] **Answer-focused**: Direct answers to likely queries
- [ ] **Authority signals**: Professional tone, confident language, source references
- [ ] **Keyword integration**: Natural placement without stuffing

### Security Verification

- [ ] API keys never exposed in client-side code
- [ ] User inputs sanitized before passing to AI providers
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting considered (if applicable)

### QA Sign-off Requirements

- [ ] All unit tests pass (`npm run test`)
- [ ] All integration tests pass
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Browser verification complete (form works, content displays)
- [ ] API verification complete (all endpoints respond correctly)
- [ ] Both AI providers functional (Anthropic and OpenAI)
- [ ] GEO optimization principles applied to generated content
- [ ] No regressions in existing functionality
- [ ] Code follows established Next.js/TypeScript patterns
- [ ] No security vulnerabilities introduced (API keys secured)
- [ ] Error handling covers all identified edge cases
- [ ] Documentation updated (if adding new environment variables)

---

**Implementation Priority Order:**
1. Core API route structure with validation
2. Provider abstraction layer (Anthropic + OpenAI)
3. Prompt template system with GEO principles
4. Single format implementation (blog post)
5. Multi-format support (FAQ, press release)
6. Frontend form component
7. Error handling and edge cases
8. Testing suite
9. Documentation
