# Dynamic Onboarding Progress Tracking System

## Overview
The onboarding system automatically tracks user progress through 4 setup steps and updates the dashboard in real-time.

## Onboarding Steps
1. Add Your Brand - Auto-detected when brand is created
2. Configure Monitoring - Auto-detected when brand has monitoring enabled  
3. Run Your First Audit - Auto-detected when viewing completed audit
4. Review Recommendations - Auto-detected when viewing recommendations

## Files Created
- src/app/api/onboarding/status/route.ts - API endpoint (GET & PATCH)
- src/hooks/useOnboarding.ts - React hooks for status management
- src/lib/onboarding/auto-detection.ts - Automatic progress tracking
- drizzle/0000_remarkable_maggott.sql - Database migration

## Files Modified
- src/lib/db/schema/organizations.ts - Added onboardingStatus field
- src/lib/db/schema/index.ts - Exported OnboardingStatus type  
- src/lib/query/client.ts - Added onboarding query keys
- src/app/dashboard/page.tsx - Dynamic status integration
- src/app/api/brands/route.ts - Auto-detect brand & monitoring
- src/app/api/audit/[id]/route.ts - Auto-detect audit completion
- src/app/api/recommendations/route.ts - Auto-detect recommendations viewed

## Next Steps

### 1. Apply Database Migration
Run this command and select YES when prompted:
npm run db:push

### 2. Test the Workflow
1. Log in to dashboard - Should show 0% progress
2. Add a brand - Progress jumps to 50% (brand + monitoring)
3. View completed audit - Progress jumps to 75%
4. View recommendations - Progress jumps to 100%

## Auto-Detection Logic

When Creating a Brand:
- brandAdded = true
- monitoringConfigured = true (if monitoring enabled)

When Viewing Completed Audit:
- auditRun = true

When Viewing Recommendations:
- recommendationsReviewed = true

When All Complete:
- completedAt = ISO timestamp (automatic)

All detection runs in background without blocking API responses.
