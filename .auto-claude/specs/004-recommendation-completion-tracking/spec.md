# Specification: Recommendation Completion Tracking

## Overview

Build a recommendation completion tracking system that measures the impact of implemented recommendations on GEO (Generative Engine Optimization) scores. The system will track completion status, measure before/after GEO score changes, calculate effectiveness metrics, and provide feedback mechanisms to improve recommendation quality over time. This closes the feedback loop between recommendations and measurable outcomes, demonstrating ROI and enabling data-driven algorithm improvements.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature development that adds completion tracking, impact measurement, and feedback capabilities to an existing recommendation system. It involves new database schema, API endpoints, UI components, and analytics logic.

## Task Scope

### Services Involved
- **main** (primary) - Next.js frontend with API routes, handles all UI, API endpoints, database operations, and state management

### This Task Will:
- [ ] Add completion status tracking to the recommendation data model (pending/in-progress/completed)
- [ ] Capture baseline GEO scores before recommendation implementation
- [ ] Measure GEO scores after implementation and calculate improvement deltas
- [ ] Calculate recommendation effectiveness/ROI metrics
- [ ] Implement user feedback mechanism for rating recommendation quality
- [ ] Create UI components for tracking completion status and viewing impact metrics
- [ ] Build reporting views for executives to track team progress

### Out of Scope:
- Modifying the core recommendation generation algorithm
- Automated GEO score measurement (assumes manual input or existing measurement system)
- Historical data migration (tracks only new recommendations going forward)
- Multi-tenant isolation (assumes single organization context)

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Next.js (App Router)
- State Management: Zustand
- ORM: Drizzle
- Database: PostgreSQL (Neon)
- Styling: Tailwind CSS
- Auth: Clerk
- UI Components: Radix UI

**Entry Point:** `src/app/page.tsx`

**How to Run:**
```bash
npm run dev
```

**Port:** 3000

**Key Directories:**
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React UI components
- `src/lib/db/` - Database schema and migrations
- `src/stores/` - Zustand state management stores
- `tests/` - Vitest unit tests and Playwright E2E tests

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/lib/db/schema.ts` | main | Add completion tracking fields to recommendations table (status, completed_at, baseline_score, post_implementation_score, effectiveness_score, user_rating, user_feedback) |
| `src/app/api/recommendations/[id]/complete/route.ts` | main | Create new API endpoint to mark recommendation as completed and capture scores |
| `src/app/api/recommendations/[id]/feedback/route.ts` | main | Create new API endpoint to submit user feedback/rating for recommendations |
| `src/app/api/recommendations/[id]/route.ts` | main | Update existing GET/PATCH endpoints to include new completion tracking fields |
| `src/app/api/recommendations/effectiveness/route.ts` | main | Create new API endpoint to calculate and retrieve effectiveness metrics |
| `src/components/recommendations/RecommendationCard.tsx` | main | Add completion status UI, score tracking inputs, and feedback widgets |
| `src/components/recommendations/CompletionTracker.tsx` | main | Create new component for tracking completion workflow (mark in-progress, capture baseline, mark completed, capture post-score) |
| `src/components/recommendations/EffectivenessReport.tsx` | main | Create new component displaying effectiveness metrics and ROI analysis |
| `src/components/recommendations/FeedbackDialog.tsx` | main | Create dialog component for collecting user ratings and feedback |
| `src/stores/recommendationStore.ts` | main | Add state for completion tracking, effectiveness metrics, and feedback |
| `src/lib/analytics/effectiveness.ts` | main | Create utility functions for calculating effectiveness scores and improvement deltas |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/lib/db/schema.ts` | Database schema definition patterns using Drizzle ORM |
| `src/app/api/**/route.ts` | Next.js API route structure, error handling, and response patterns |
| `src/stores/*.ts` | Zustand store patterns for state management |
| `src/components/ui/*.tsx` | Radix UI component usage and Tailwind styling patterns |
| `tests/**/*.test.ts` | Vitest test patterns and structure |
| `tests/e2e/**/*.spec.ts` | Playwright E2E test patterns |

## Patterns to Follow

### Database Schema (Drizzle ORM)

From existing schema files:

```typescript
import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const recommendations = pgTable('recommendations', {
  id: text('id').primaryKey(),
  // ... existing fields ...

  // NEW: Completion tracking fields
  status: text('status').notNull().default('pending'), // 'pending' | 'in-progress' | 'completed'
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // NEW: Score tracking fields
  baselineScore: integer('baseline_score'),
  postImplementationScore: integer('post_implementation_score'),
  scoreImprovement: integer('score_improvement'), // Calculated delta
  effectivenessScore: integer('effectiveness_score'), // 0-100 calculated metric

  // NEW: Feedback fields
  userRating: integer('user_rating'), // 1-5 stars
  userFeedback: text('user_feedback'),
  feedbackAt: timestamp('feedback_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Key Points:**
- Use `text()` for status enums
- Use `timestamp()` for all datetime fields
- Use `integer()` for numeric scores and ratings
- Include created/updated timestamps for audit trail

### API Routes (Next.js App Router)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recommendations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update database
    const updated = await db
      .update(recommendations)
      .set({
        status: body.status,
        completedAt: body.status === 'completed' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(recommendations.id, params.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update recommendation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- Use try-catch for error handling
- Validate input before database operations
- Return appropriate HTTP status codes
- Use Drizzle's type-safe query builder

### Zustand Store

```typescript
import { create } from 'zustand';

interface RecommendationState {
  completionMetrics: {
    totalRecommendations: number;
    completed: number;
    inProgress: number;
    pending: number;
    averageEffectiveness: number;
  };
  setCompletionMetrics: (metrics: CompletionMetrics) => void;
  markInProgress: (id: string, baselineScore: number) => Promise<void>;
  markCompleted: (id: string, postScore: number) => Promise<void>;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  completionMetrics: {
    totalRecommendations: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    averageEffectiveness: 0,
  },
  setCompletionMetrics: (metrics) => set({ completionMetrics: metrics }),
  markInProgress: async (id, baselineScore) => {
    // API call to mark in-progress
    await fetch(`/api/recommendations/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in-progress', baselineScore }),
    });
  },
  markCompleted: async (id, postScore) => {
    // API call to mark completed
    await fetch(`/api/recommendations/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed', postScore }),
    });
  },
}));
```

**Key Points:**
- Define clear interface for state shape
- Include both state and actions
- Use async functions for API calls
- Keep store focused on specific domain (recommendations)

## Requirements

### Functional Requirements

1. **Completion Status Tracking**
   - Description: Track the lifecycle of each recommendation through pending → in-progress → completed states
   - Acceptance: User can update recommendation status via UI, status persists in database with timestamps

2. **Baseline Score Capture**
   - Description: Capture the current GEO score when user starts implementing a recommendation
   - Acceptance: When marking recommendation as "in-progress", user must enter current GEO score (baseline)

3. **Post-Implementation Score Measurement**
   - Description: Capture the GEO score after recommendation is fully implemented
   - Acceptance: When marking recommendation as "completed", user must enter new GEO score, system calculates improvement delta

4. **Effectiveness Metrics Calculation**
   - Description: Calculate effectiveness score (0-100) based on score improvement, implementation time, and recommendation complexity
   - Acceptance: System automatically calculates effectiveness score when completion is recorded, visible in UI

5. **User Feedback Mechanism**
   - Description: Allow users to rate recommendations (1-5 stars) and provide text feedback
   - Acceptance: User can submit rating and feedback via dialog, data persists to database

6. **Completion Progress Reporting**
   - Description: Display aggregate metrics showing team progress on implementing recommendations
   - Acceptance: Dashboard shows total recommendations, breakdown by status, average effectiveness, top performers

### Edge Cases

1. **Incomplete Score Data** - Handle cases where user only provides baseline but never completes recommendation (status stuck in "in-progress")
2. **Negative Score Changes** - Handle cases where GEO score decreases after implementation (negative effectiveness)
3. **Missing Feedback** - Allow completion without feedback (optional), but encourage it via UI prompts
4. **Concurrent Updates** - Handle race conditions if multiple users update same recommendation status
5. **Score Validation** - Validate that GEO scores are within reasonable ranges (0-100 or similar)

## Implementation Notes

### DO
- Follow Drizzle ORM patterns for all database schema changes
- Use Next.js API routes for all backend endpoints
- Implement Zustand store for managing recommendation state
- Use Radix UI components for all dialogs and UI elements
- Write Vitest unit tests for effectiveness calculation logic
- Write Playwright E2E tests for completion workflow
- Add optimistic UI updates for better UX
- Include loading states and error handling in all components
- Use TypeScript strictly (no `any` types)

### DON'T
- Create new database connections (reuse existing Drizzle instance)
- Use client-side state for data that should persist (use database)
- Skip input validation on API routes
- Mix data fetching logic into UI components (use stores)
- Ignore error cases or use generic error messages
- Create new styling patterns (follow existing Tailwind conventions)

## Development Environment

### Start Services

```bash
# From project root
npm run dev
```

### Service URLs
- Main Application: http://localhost:3000
- Database: Neon PostgreSQL (remote, connection string in env)

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication
- `CLERK_SECRET_KEY`: Clerk secret
- `NODE_ENV`: development

### Database Setup

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migration
npm run db:migrate

# (Optional) Open Drizzle Studio to inspect data
npm run db:studio
```

## Success Criteria

The task is complete when:

1. [ ] Database schema includes all completion tracking fields (status, timestamps, scores, feedback)
2. [ ] API endpoints exist for marking in-progress, completed, and submitting feedback
3. [ ] UI components allow users to track completion and enter scores
4. [ ] Effectiveness metrics are calculated and displayed in reports
5. [ ] User feedback mechanism is functional (rating + text feedback)
6. [ ] Executive dashboard shows completion progress metrics
7. [ ] No console errors in browser or API logs
8. [ ] Existing tests still pass
9. [ ] New functionality verified via browser testing
10. [ ] Database migration runs successfully without data loss

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Effectiveness Score Calculation | `tests/lib/analytics/effectiveness.test.ts` | Correctly calculates effectiveness score based on score improvement, time, and complexity |
| Score Delta Calculation | `tests/lib/analytics/effectiveness.test.ts` | Correctly calculates improvement delta (post - baseline) |
| Negative Improvement Handling | `tests/lib/analytics/effectiveness.test.ts` | Handles negative score changes gracefully (effectiveness = 0) |
| Status Transition Validation | `tests/lib/db/recommendations.test.ts` | Validates proper status transitions (pending → in-progress → completed) |
| Input Validation | `tests/api/recommendations.test.ts` | API routes reject invalid inputs (missing scores, invalid status) |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Complete Recommendation Flow | main (API + DB) | Full workflow: mark in-progress (with baseline) → mark completed (with post-score) → verify effectiveness calculated |
| Feedback Submission | main (API + DB) | Submit feedback → verify persisted to database → verify retrieved correctly |
| Metrics Aggregation | main (API + DB) | Multiple recommendations with different statuses → verify aggregate metrics correct |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Complete Recommendation Workflow | 1. Navigate to recommendations page 2. Click "Start Implementation" on a recommendation 3. Enter baseline GEO score (e.g., 65) 4. Mark as "In Progress" 5. Wait/simulate work 6. Click "Mark Completed" 7. Enter post-implementation score (e.g., 78) 8. Submit | Recommendation status updates to "completed", score improvement (13) displayed, effectiveness score calculated and shown |
| Submit Feedback | 1. Navigate to completed recommendation 2. Click "Provide Feedback" 3. Select star rating (e.g., 4 stars) 4. Enter text feedback 5. Submit | Feedback saved, rating displayed on recommendation card, feedback visible in details |
| View Progress Report | 1. Navigate to dashboard/reports 2. View completion metrics | Displays: total recommendations, count by status, average effectiveness, top performing recommendations |

### Browser Verification
| Page/Component | URL | Checks |
|----------------|-----|--------|
| Recommendations List | `http://localhost:3000/recommendations` | Recommendations display with status badges (pending/in-progress/completed) |
| Completion Tracker | `http://localhost:3000/recommendations/[id]` | "Start Implementation" button visible for pending, score input fields functional |
| Effectiveness Report | `http://localhost:3000/reports/effectiveness` | Metrics display correctly (no NaN, proper formatting), charts render if applicable |
| Feedback Dialog | `http://localhost:3000/recommendations/[id]` | Dialog opens, star rating interactive, text input works, submit button functional |

### Database Verification
| Check | Query/Command | Expected |
|-------|---------------|----------|
| Schema Migration Applied | `npm run db:studio` or query `SELECT * FROM recommendations LIMIT 1;` | New columns exist: status, started_at, completed_at, baseline_score, post_implementation_score, score_improvement, effectiveness_score, user_rating, user_feedback, feedback_at |
| Status Values Valid | Query: `SELECT DISTINCT status FROM recommendations;` | Only returns: 'pending', 'in-progress', 'completed' |
| Timestamps Populated | Query: `SELECT id, status, started_at, completed_at FROM recommendations WHERE status = 'completed';` | completed_at is not null for completed recommendations |
| Effectiveness Calculated | Query: `SELECT id, baseline_score, post_implementation_score, score_improvement, effectiveness_score FROM recommendations WHERE status = 'completed';` | score_improvement = post_implementation_score - baseline_score, effectiveness_score populated (0-100) |

### QA Sign-off Requirements
- [ ] All unit tests pass (`npm run test`)
- [ ] All integration tests pass (if separated in test suite)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Browser verification complete - all UI components functional
- [ ] Database state verified - schema correct, data integrity maintained
- [ ] No regressions in existing functionality (existing recommendation display still works)
- [ ] Code follows established patterns (Drizzle, Zustand, Next.js conventions)
- [ ] No security vulnerabilities introduced (input validation, SQL injection prevention)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Accessibility checks pass (keyboard navigation, ARIA labels)
- [ ] Error states tested (network failures, invalid inputs)
- [ ] Performance acceptable (no lag when loading recommendations list with 100+ items)

## Additional Implementation Guidance

### Effectiveness Score Formula

Suggested formula for calculating effectiveness score (0-100):

```typescript
export function calculateEffectivenessScore(
  baselineScore: number,
  postScore: number,
  implementationDays: number,
  recommendationPriority: 'high' | 'medium' | 'low'
): number {
  // Score improvement (weighted 70%)
  const maxPossibleImprovement = 100 - baselineScore;
  const actualImprovement = postScore - baselineScore;
  const improvementScore = maxPossibleImprovement > 0
    ? (actualImprovement / maxPossibleImprovement) * 70
    : 0;

  // Time efficiency (weighted 20%)
  // Faster implementation = higher score
  const expectedDays = { high: 7, medium: 14, low: 30 }[recommendationPriority];
  const timeScore = Math.max(0, (expectedDays - implementationDays) / expectedDays * 20);

  // Priority bonus (weighted 10%)
  const priorityBonus = { high: 10, medium: 6, low: 3 }[recommendationPriority];

  const totalScore = improvementScore + timeScore + priorityBonus;

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}
```

### UI/UX Recommendations

1. **Status Badge Colors**:
   - Pending: Gray (`bg-gray-200 text-gray-700`)
   - In Progress: Blue (`bg-blue-200 text-blue-700`)
   - Completed: Green (`bg-green-200 text-green-700`)

2. **Score Input Validation**:
   - Use number input with min/max constraints
   - Show helpful hints (e.g., "Enter your current GEO score (0-100)")
   - Disable submit until valid score entered

3. **Feedback Dialog**:
   - Use Radix UI Dialog component
   - Star rating: Use 5 clickable star icons (Radix UI or custom)
   - Textarea for feedback (optional, but encouraged)
   - "Skip" and "Submit Feedback" buttons

4. **Effectiveness Report**:
   - Use card-based layout for metrics
   - Consider using a simple chart library (recharts) for visualizations
   - Show top 5 most effective recommendations
   - Show recommendations needing improvement (negative scores)

### Security Considerations

1. **Authentication**: All API routes must verify user is authenticated (use Clerk middleware)
2. **Authorization**: Verify user owns/can access the recommendation they're updating
3. **Input Validation**: Validate all scores are numbers within valid ranges (0-100)
4. **SQL Injection**: Use Drizzle's parameterized queries (already safe by default)
5. **Rate Limiting**: Consider adding rate limiting to feedback endpoint to prevent spam

### Performance Considerations

1. **Pagination**: If recommendations list grows large, implement pagination
2. **Caching**: Consider caching effectiveness metrics (they don't change frequently)
3. **Optimistic Updates**: Update UI immediately, then sync with server
4. **Lazy Loading**: Load effectiveness report data only when user navigates to reports page
