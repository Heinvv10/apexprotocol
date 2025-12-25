# Planning Phase Complete - Spec 017: AI Content Generation

## Session Summary

**Date**: 2025-12-24
**Agent**: Planner (Session 1)
**Status**: ✅ Complete
**Workflow Type**: Feature

---

## Investigation Findings

### Existing Infrastructure Discovered

✅ **AI Integration Already Exists**:
- `/src/lib/ai/claude.ts` - Anthropic Claude client (singleton pattern)
- `/src/lib/ai/openai.ts` - OpenAI client (singleton pattern)
- `/src/lib/ai/router.ts` - Provider abstraction with automatic fallback
- `/src/lib/ai/prompts/brand-analysis.ts` - Example prompt engineering pattern

✅ **Content System Already Exists**:
- `/src/app/api/create/content/route.ts` - Content storage API
- `/src/lib/db/schema/content.ts` - Database schema (supports blog_post, faq, press_release)
- `/src/lib/validations/content.ts` - Zod validation patterns
- `aiMetadata` field already in content table for storing generation info

✅ **Dependencies Verified**:
- `@anthropic-ai/sdk` (v0.71.2) ✓ Already installed
- `openai` (v6.10.0) ✓ Already installed
- `zod` (v4.1.13) ✓ Already installed
- `next` (v16.0.8) ✓ Already installed

⚠️ **Environment Variables Required**:
- `OPENAI_API_KEY` ✓ Already configured
- `ANTHROPIC_API_KEY` ⚠️ Needs to be added to .env.local

---

## Critical Patterns Identified

### API Route Pattern
- Next.js App Router with POST export
- Zod validation using `safeParse()` (never `parse()`)
- `getOrganizationId()` for authentication
- Error handling with proper HTTP status codes
- Response format: `{ success, data, error }`

### Anthropic Claude Pattern
- **CRITICAL**: `max_tokens` parameter is MANDATORY
- System prompt in separate `system` field
- Messages must alternate user/assistant roles

### OpenAI Pattern
- System message must be FIRST in messages array
- `temperature` controls creativity (0-2 range)
- `max_tokens` optional but recommended for cost control

### Validation Pattern
- Use `safeParse()` instead of `parse()` for error handling
- Return flattened errors: `result.error.flatten()`
- Strict enums for controlled values

---

## Implementation Plan Created

### Phase Structure (6 Phases, 8 Subtasks)

1. **Phase 1: Foundation** - Types & Validation schemas
2. **Phase 2: GEO Prompts** - Format-specific templates (blog, FAQ, press release)
3. **Phase 3: AI Generator** - Multi-provider content generation service
4. **Phase 4: API Route** - `/api/generate` endpoint with validation
5. **Phase 5: Frontend** - `GenerateContentForm.tsx` component
6. **Phase 6: Integration** - End-to-end verification

### Files to Create

| File | Purpose |
|------|---------|
| `src/types/content-generation.ts` | TypeScript type definitions |
| `src/lib/validations/content.ts` (modify) | Add generation validation schemas |
| `src/lib/ai/prompts/geo-templates.ts` | GEO-optimized prompt templates |
| `src/lib/ai/content-generator.ts` | Core generation logic |
| `src/app/api/generate/route.ts` | API endpoint |
| `src/components/features/content/GenerateContentForm.tsx` | UI component |

### Dependencies Flow

```
Phase 1 (Types/Validation)
    ↓
Phase 2 (GEO Prompts)
    ↓
Phase 3 (AI Generator)
    ↓
Phase 4 (API Route)
    ↓
Phase 5 (Frontend)
    ↓
Phase 6 (Integration)
```

**Parallelism**: Sequential execution required (no parallel opportunities)
**Recommended Workers**: 1

---

## Verification Strategy

**Risk Level**: Medium

### Test Requirements:
- ✅ Unit tests (validation schemas, prompt templates)
- ✅ Integration tests (API endpoint with both providers)
- ✅ TypeScript compilation (blocking)
- ✅ Browser verification (form functionality)
- ⚠️ Manual GEO quality check (semantic structure, keywords, authority)

### Acceptance Criteria:
1. Content generated with GEO optimization (headers, lists, keywords)
2. Brand voice alignment (system prompts working)
3. Multi-format support (blog, FAQ, press release)
4. Both AI providers functional (Claude & OpenAI)
5. Input validation prevents invalid requests
6. Error handling for all edge cases
7. No regressions in existing tests

---

## GEO Optimization Principles

Content must include:
- ✅ Semantic structure (H1, H2, H3 headers)
- ✅ Scannable lists (bullet points, numbered lists)
- ✅ Direct answers (answer-focused for AI assistants)
- ✅ Authority signals (statistics, expert quotes)
- ✅ Citation-worthiness (professional tone, source references)
- ✅ Natural keyword integration (no stuffing)

---

## Edge Cases to Handle

1. **Missing API Keys** - Clear error if env vars not configured
2. **API Rate Limiting** - Exponential backoff retry logic
3. **Token Limit Overflow** - Truncate/reject oversized keyword lists
4. **Empty Brand Voice** - Default to professional tone
5. **API Timeout** - Set 30-60s timeout limits
6. **Malformed JSON** - Return 400 Bad Request

---

## Files Deliverables Created

✅ `implementation_plan.json` - Complete subtask-based plan
✅ `context.json` - Updated with patterns and integration points
✅ `init.sh` - Development environment startup script
✅ `build-progress.txt` - Progress tracking document
✅ `PLANNING_SUMMARY.md` - This summary

---

## Next Steps (For Coder Agent)

1. **Read** `implementation_plan.json` for subtask list
2. **Start** with Phase 1, Subtask 1-1 (Create TypeScript types)
3. **Follow** existing patterns in reference files
4. **Verify** each subtask completes successfully
5. **Update** build-progress.txt after each phase
6. **Run** verification steps from verification_strategy

---

## Startup Command

```bash
source auto-claude/.venv/bin/activate && python auto-claude/run.py --spec 017 --parallel 1
```

Or manually:
```bash
npm run dev
```

Access at: http://localhost:3000

---

## Critical DON'Ts

❌ Forget `max_tokens` for Anthropic (causes API error)
❌ Mix system prompt patterns between providers
❌ Use `parse()` instead of `safeParse()` for validation
❌ Hardcode prompts directly in API route
❌ Return raw AI provider errors to client
❌ Skip input validation
❌ Start implementation before reading implementation_plan.json

---

**Status**: Ready for implementation by Coder Agent
**Estimated Time**: 4-6 hours
**Risk Level**: Medium (manageable with proper testing)
