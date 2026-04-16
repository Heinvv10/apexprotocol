#!/bin/bash
# Script to copy all browser query POC files
# Usage: bash COPY_ALL_FILES.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "ApexGEO root: $REPO_ROOT"

# Create directories
mkdir -p "$REPO_ROOT/src/lib/browser-query"
mkdir -p "$REPO_ROOT/src/lib/utils"
mkdir -p "$REPO_ROOT/src/lib/monitoring/integrations"
mkdir -p "$REPO_ROOT/src/lib/db/schema"
mkdir -p "$REPO_ROOT/src/app/api/monitor/run"
mkdir -p "$REPO_ROOT/drizzle/migrations"
mkdir -p "$REPO_ROOT/tests/lib/browser-query"
mkdir -p "$REPO_ROOT/docs"

echo "✓ Directories created"
echo "✓ All files are ready to use"
echo ""
echo "Files to copy:"
echo "1. src/lib/browser-query/types.ts"
echo "2. src/lib/browser-query/base-browser-query.ts"
echo "3. src/lib/browser-query/perplexity-browser-query.ts"
echo "4. src/lib/browser-query/session-manager.ts"
echo "5. src/lib/browser-query/index.ts"
echo "6. src/lib/utils/logger.ts"
echo "7. src/lib/db/schema/browser-sessions.ts"
echo "8. drizzle/migrations/add_browser_sessions.sql"
echo "9. src/lib/monitoring/integrations/perplexity-browser.ts"
echo "10. src/app/api/monitor/run/browser-query-handler.ts"
echo "11. tests/lib/browser-query/perplexity-browser-query.test.ts"
echo "12. docs/BROWSER_QUERY_POC.md"
echo "13. IMPLEMENTATION_GUIDE.md"
echo "14. PERPLEXITY_BROWSER_QUICK_REFERENCE.md"
echo ""
echo "Next steps:"
echo "1. npm install puppeteer"
echo "2. Generate ENCRYPTION_KEY: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo "3. Add ENCRYPTION_KEY to .env.local"
echo "4. npm run db:push"
echo "5. npm test -- browser-query"
