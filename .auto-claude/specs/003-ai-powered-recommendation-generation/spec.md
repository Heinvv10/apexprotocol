# Specification: AI-Powered Recommendation Generation

## Overview

Implement an AI-powered recommendation engine that analyzes brand visibility data from Generative Engine Optimization (GEO) monitoring and generates prioritized, actionable recommendations with impact scores. This feature transforms raw visibility metrics into concrete optimization guidance, differentiating from competitors who only provide monitoring without actionable insights. The system will leverage Claude AI for recommendation generation and existing database infrastructure for storage and retrieval.

## Workflow Type

**Type**: feature

**Rationale**: This is a greenfield implementation of a new capability that adds AI-driven analysis and recommendation generation to the existing GEO monitoring platform. It introduces new API endpoints, database operations, and AI integration patterns while building on established infrastructure (Drizzle ORM, existing AI clients, recommendation schema).

## Task Scope

### Services Involved
- **main** (primary) - Next.js application housing the recommendation engine API, AI integration, and database operations

### This Task Will:
- [ ] Create API endpoint for triggering recommendation generation from brand visibility data
- [ ] Implement AI analysis logic using Claude SDK to identify optimization opportunities
- [ ] Build prioritization algorithm to rank recommendations by potential impact score
- [ ] Generate actionable step-by-step guidance for each recommendation
- [ ] Store recommendations in PostgreSQL database via Drizzle ORM
- [ ] Create API endpoint for retrieving prioritized recommendations
- [ ] Implement recommendation categorization (technical_seo, content_optimization, citation_building, etc.)
- [ ] Add platform-specific context (ChatGPT, Claude, Perplexity) to recommendations

### Out of Scope:
- User interface/frontend components for displaying recommendations
- Integration with external GEO monitoring tools (assume visibility data already exists)
- Automated execution of recommendations (manual implementation only)
- Machine learning model training (use Claude's pre-trained capabilities)
- Real-time streaming recommendation updates
- Multi-tenant recommendation isolation (single workspace context)

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Next.js (v16.0.8)
- ORM: Drizzle
- State Management: Zustand
- Styling: Tailwind CSS
- AI SDKs: @anthropic-ai/sdk (^0.71.2), openai (^6.10.0)
- Vector DB: @pinecone-database/pinecone (^6.1.3)
- Testing: Vitest (unit), Playwright (E2E)

**Key Directories:**
- `src/` - Source code
- `src/lib/ai/` - AI client integrations (Claude, OpenAI, Pinecone)
- `src/lib/db/schema/` - Drizzle ORM schemas
- `app/api/` - Next.js API routes
- `tests/` - Test files

**Entry Point:** `app/api/` (API routes for recommendation endpoints)

**How to Run:**
```bash
npm run dev
```

**Port:** 3000

**Service URL:** http://localhost:3000

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `app/api/recommendations/generate/route.ts` | main | **CREATE NEW**: API endpoint to trigger recommendation generation from visibility data |
| `app/api/recommendations/route.ts` | main | **CREATE NEW**: API endpoint to fetch prioritized recommendations (GET) |
| `src/lib/ai/recommendations.ts` | main | **CREATE NEW**: Core recommendation generation logic using Claude AI |
| `src/lib/db/queries/recommendations.ts` | main | **CREATE NEW**: Drizzle queries for CRUD operations on recommendations table |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/lib/ai/claude.ts` | Claude SDK integration pattern with anthropic client initialization, message creation, and response parsing |
| `src/lib/ai/openai.ts` | OpenAI structured outputs pattern using `zodResponseFormat` for type-safe JSON parsing |
| `src/lib/db/schema/recommendations.ts` | Recommendation schema definition with enums for category, priority, impact, effort, status |
| `src/lib/ai/pinecone.ts` | Vector database query patterns for similarity search (optional enhancement) |
| `app/api/` | Next.js App Router API route structure with named exports (GET, POST, etc.) |

## Patterns to Follow

### Claude AI Integration Pattern

From `src/lib/ai/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: 'Your prompt here'
    }
  ],
  system: 'System instructions for JSON formatting'
});

// Extract text from response blocks
const textContent = message.content.find(block => block.type === 'text');
const result = JSON.parse(textContent.text);
```

**Key Points:**
- Use `claude-3-5-sonnet-20241022` as default model
- Response content is in blocks array - filter for type 'text'
- JSON parsing requires explicit system prompts (no native structured output)
- Handle API errors with try-catch and appropriate error messages

### Drizzle ORM Query Pattern

From `src/lib/db/schema/recommendations.ts`:

```typescript
import { db } from '@/lib/db';
import { recommendations } from '@/lib/db/schema/recommendations';
import { eq, desc } from 'drizzle-orm';

// Insert with immediate return
const [newRec] = await db.insert(recommendations)
  .values({
    category: 'content_optimization',
    priority: 'high',
    impact: 'high',
    effort: 'medium',
    status: 'pending',
    title: 'Recommendation title',
    description: 'Detailed description',
    steps: [{ action: 'Step 1', details: 'Details' }] // JSONB field
  })
  .returning();

// Query with filtering and sorting
const recs = await db.query.recommendations.findMany({
  where: eq(recommendations.status, 'pending'),
  orderBy: [desc(recommendations.priority)]
});
```

**Key Points:**
- Use `.returning()` to get inserted/updated records immediately
- JSONB fields (like `steps`) need type annotations: `jsonb('steps').$type<Step[]>()`
- Use query builder methods: `eq()`, `desc()`, `asc()` from drizzle-orm
- Recommendation enums are strictly defined in schema (must conform)

### Next.js App Router API Route Pattern

From `app/api/` directory structure:

```typescript
// app/api/recommendations/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.visibilityData) {
      return NextResponse.json(
        { error: 'Visibility data required' },
        { status: 400 }
      );
    }

    // Process request
    const recommendations = await generateRecommendations(body.visibilityData);

    return NextResponse.json({ recommendations }, { status: 200 });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- Use named exports (GET, POST, PUT, DELETE)
- Import NextRequest and NextResponse from 'next/server'
- Always include error handling with appropriate HTTP status codes
- Parse request body with `await request.json()`
- Return JSON responses with `NextResponse.json()`

## Requirements

### Functional Requirements

1. **Visibility Data Analysis**
   - Description: AI system processes brand visibility metrics to identify gaps and opportunities
   - Input: Brand visibility data (mentions across AI platforms, content coverage, citation frequency)
   - Output: List of identified optimization opportunities
   - Acceptance: Claude AI successfully extracts actionable insights from visibility data without hallucinations

2. **Impact-Based Prioritization**
   - Description: Rank recommendations by potential impact score combining multiple factors
   - Factors: Visibility gap severity, platform reach, implementation effort, expected ROI
   - Output: Recommendations sorted by priority (critical → high → medium → low)
   - Acceptance: Critical recommendations address gaps affecting >50% of target platforms

3. **Actionable Step Generation**
   - Description: Each recommendation includes specific, executable implementation steps
   - Format: Ordered list of concrete actions with context and success criteria
   - Requirements: Steps must be platform-specific (e.g., "Add schema markup to X page for ChatGPT visibility")
   - Acceptance: Non-technical users can follow steps without additional research

4. **Platform and Content Gap Specificity**
   - Description: Recommendations reference exact AI platforms and missing content types
   - Platforms: ChatGPT, Claude, Perplexity AI, Gemini, etc.
   - Content Gaps: Missing schema types, citation opportunities, content freshness issues
   - Acceptance: Each recommendation specifies at least one platform and one content gap type

5. **Recommendation Persistence**
   - Description: Store generated recommendations in PostgreSQL with full metadata
   - Schema Fields: category, priority, impact, effort, status, title, description, steps, platform_context
   - Operations: Create, Read, Update (status tracking), Delete (dismissed recommendations)
   - Acceptance: Recommendations persist across sessions and support status updates

### Non-Functional Requirements

1. **Performance**: Recommendation generation completes within 30 seconds for typical dataset
2. **Reliability**: AI API failures handled gracefully with fallback messaging
3. **Cost Efficiency**: Use Claude Sonnet (balanced cost/quality) rather than Opus
4. **Type Safety**: All data structures validated with TypeScript types/Zod schemas
5. **Observability**: Log AI prompts, responses, and processing times for debugging

### Edge Cases

1. **Insufficient Visibility Data** - Return empty recommendations array with informative message rather than error
2. **AI API Rate Limiting** - Implement exponential backoff retry logic (max 3 attempts)
3. **Malformed AI Responses** - Validate JSON structure before parsing; log errors and return user-friendly message
4. **Duplicate Recommendations** - Check for existing similar recommendations (fuzzy title match) before insertion
5. **Zero Impact Recommendations** - Filter out recommendations with calculated impact score < threshold (e.g., 0.3)
6. **Missing Environment Variables** - Fail fast with clear error message during server startup
7. **Database Connection Failures** - Return 503 Service Unavailable with retry-after header

## Implementation Notes

### DO
- **Follow existing AI integration patterns** in `src/lib/ai/claude.ts` for client initialization and error handling
- **Reuse Drizzle schema** from `src/lib/db/schema/recommendations.ts` - do not create new tables
- **Use TypeScript strict mode** - validate all inputs with Zod schemas
- **Implement comprehensive error handling** - wrap all AI and DB calls in try-catch
- **Log AI interactions** for debugging and cost monitoring (prompt length, response time, token usage)
- **Use existing recommendation enums** - category, priority, impact, effort values are pre-defined
- **Structure recommendations.ts as pure function** - accept visibility data, return recommendations array
- **Include platform metadata** - specify which AI platforms each recommendation targets
- **Make steps array detailed** - each step should be 1-2 sentences with clear action verb

### DON'T
- **Don't create new database tables** - recommendation schema already exists
- **Don't use OpenAI for generation** - Claude is more cost-effective for this use case (reserve OpenAI for structured parsing if needed)
- **Don't hardcode API keys** - always use process.env with validation
- **Don't return raw AI responses** - always parse and validate before returning to client
- **Don't skip error handling** - AI and DB operations can fail unpredictably
- **Don't generate vague recommendations** - each must be specific and actionable
- **Don't exceed token limits** - chunk large visibility datasets if needed
- **Don't implement frontend components** - API-only scope for this phase

## Development Environment

### Start Services

```bash
# Start development server
npm run dev
```

### Service URLs
- Next.js Application: http://localhost:3000
- API Base: http://localhost:3000/api

### Required Environment Variables

**Critical (must be set):**
- `ANTHROPIC_API_KEY`: Claude AI API key for recommendation generation
- `DATABASE_URL`: PostgreSQL connection string for Neon database
- `OPENAI_API_KEY`: OpenAI API key (optional, for future structured output parsing)

**Optional (for enhanced features):**
- `PINECONE_API_KEY`: Vector DB for similarity-based recommendation deduplication
- `PINECONE_INDEX`: Index name for recommendation embeddings

**Verification:**
```bash
# Check environment variables are loaded
node -e "console.log(process.env.ANTHROPIC_API_KEY ? '✓ Claude API key loaded' : '✗ Missing Claude API key')"
node -e "console.log(process.env.DATABASE_URL ? '✓ Database URL loaded' : '✗ Missing Database URL')"
```

## Success Criteria

The task is complete when:

1. [ ] **API Endpoint**: POST `/api/recommendations/generate` accepts visibility data and returns AI-generated recommendations
2. [ ] **API Endpoint**: GET `/api/recommendations` retrieves stored recommendations filtered by status/priority
3. [ ] **AI Analysis**: Claude successfully identifies 3-10 optimization opportunities from sample visibility data
4. [ ] **Prioritization**: Recommendations sorted by impact score (critical → high → medium → low)
5. [ ] **Actionability**: Each recommendation contains 2-5 specific implementation steps
6. [ ] **Platform Specificity**: Recommendations reference concrete AI platforms (ChatGPT, Claude, etc.)
7. [ ] **Content Gap Context**: Recommendations identify specific missing content types or schema
8. [ ] **Database Persistence**: Generated recommendations stored in PostgreSQL with all required fields
9. [ ] **Error Handling**: Graceful degradation when AI API fails or returns invalid JSON
10. [ ] **Type Safety**: All functions and API responses fully typed with TypeScript
11. [ ] **No Console Errors**: Development server runs without errors or warnings
12. [ ] **Existing Tests Pass**: No regressions in current test suite

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| **Recommendation Generation Logic** | `tests/unit/recommendations.test.ts` | AI analysis produces valid recommendation objects with all required fields |
| **Impact Calculation** | `tests/unit/recommendations.test.ts` | Prioritization algorithm correctly ranks recommendations by impact score |
| **Step Validation** | `tests/unit/recommendations.test.ts` | Generated steps array contains actionable strings with platform context |
| **Edge Case Handling** | `tests/unit/recommendations.test.ts` | Empty visibility data returns empty array without errors |
| **Error Recovery** | `tests/unit/recommendations.test.ts` | AI API failures return user-friendly error messages |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| **Generate Recommendations API** | main → Claude API → PostgreSQL | POST /api/recommendations/generate stores recommendations in database |
| **Retrieve Recommendations API** | main → PostgreSQL | GET /api/recommendations returns filtered, sorted recommendations |
| **Database Schema Compliance** | main → PostgreSQL | Inserted recommendations match Drizzle schema constraints |
| **AI Response Parsing** | main → Claude API | Malformed JSON from Claude handled gracefully without crashes |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| **Full Recommendation Lifecycle** | 1. POST visibility data to /generate<br>2. GET recommendations<br>3. Verify recommendations returned | Recommendations appear in GET response with correct prioritization |
| **Error Handling Flow** | 1. POST invalid visibility data<br>2. Check response status and error message | 400 Bad Request with descriptive error message |
| **Empty Data Flow** | 1. POST empty visibility data object<br>2. Check response | Returns empty recommendations array with 200 status |

### API Verification (Postman/curl)

| Endpoint | Test | Expected Result |
|----------|------|-----------------|
| `POST /api/recommendations/generate` | Send sample visibility data JSON | 200 OK with recommendations array containing 3-10 items |
| `POST /api/recommendations/generate` | Send malformed JSON | 400 Bad Request with error message |
| `GET /api/recommendations` | Fetch all recommendations | 200 OK with array of stored recommendations sorted by priority |
| `GET /api/recommendations?status=pending` | Fetch pending recommendations | 200 OK with filtered array containing only pending items |

### Database Verification

| Check | Query/Command | Expected |
|-------|---------------|----------|
| **Recommendations Table Exists** | `SELECT * FROM recommendations LIMIT 1;` | No error, table accessible |
| **Generated Recommendations Stored** | `SELECT COUNT(*) FROM recommendations WHERE status = 'pending';` | Count > 0 after generation API call |
| **JSONB Steps Field Valid** | `SELECT steps FROM recommendations WHERE id = '<test-id>';` | Valid JSON array with step objects |
| **Enum Constraints Enforced** | `INSERT INTO recommendations (category) VALUES ('invalid_category');` | Database constraint error |

### Manual Browser Verification (if applicable)

| Page/Component | URL | Checks |
|----------------|-----|--------|
| N/A | N/A | This phase is API-only (no UI components) |

### TypeScript Compilation

| Check | Command | Expected |
|-------|---------|----------|
| **Type Errors** | `npx tsc --noEmit` | No TypeScript errors |
| **Lint Errors** | `npm run lint` | No linting errors |

### QA Sign-off Requirements

- [ ] All unit tests pass (`npm run test`)
- [ ] All integration tests pass (API contracts verified)
- [ ] All E2E tests pass (full lifecycle tested)
- [ ] API endpoints tested via Postman/curl with valid responses
- [ ] Database state verified (recommendations stored correctly)
- [ ] TypeScript compilation successful with no errors
- [ ] No regressions in existing functionality (existing tests pass)
- [ ] Code follows established patterns from reference files
- [ ] Error handling tested for AI API failures, database errors, invalid inputs
- [ ] No security vulnerabilities (API keys not exposed, input sanitization)
- [ ] Documentation updated (API endpoint docs, JSDoc comments on functions)
- [ ] Performance acceptable (recommendation generation < 30 seconds)

---

## Implementation Plan Preview

**Phase 1: Database & Types**
1. Verify `src/lib/db/schema/recommendations.ts` schema
2. Create TypeScript interfaces for visibility data input
3. Create Zod validation schemas for API inputs

**Phase 2: AI Integration**
4. Implement `src/lib/ai/recommendations.ts` core logic
5. Design Claude AI prompts for recommendation generation
6. Implement response parsing and validation

**Phase 3: API Endpoints**
7. Create `app/api/recommendations/generate/route.ts`
8. Create `app/api/recommendations/route.ts`
9. Implement error handling and validation middleware

**Phase 4: Database Operations**
10. Create `src/lib/db/queries/recommendations.ts`
11. Implement CRUD operations with Drizzle ORM
12. Add duplicate detection logic

**Phase 5: Testing & QA**
13. Write unit tests for recommendation generation logic
14. Write integration tests for API endpoints
15. Write E2E tests for full workflow
16. Manual testing with sample visibility data
17. QA validation and sign-off
