#!/bin/bash

# List of files that need fixing (from the grep results)
files=(
"src/app/api/admin/api-config/route.ts"
"src/app/api/admin/api-config/[id]/route.ts"
"src/app/api/admin/api-config/[id]/test/route.ts"
"src/app/api/admin/api-keys/route.ts"
"src/app/api/admin/api-keys/[id]/rotate/route.ts"
"src/app/api/admin/api-keys/[id]/route.ts"
"src/app/api/admin/audit-logs/export/route.ts"
"src/app/api/admin/audit-logs/route.ts"
"src/app/api/admin/audit-logs/[id]/route.ts"
"src/app/api/admin/dashboard/activity/route.ts"
"src/app/api/admin/dashboard/health/route.ts"
"src/app/api/admin/dashboard/resources/route.ts"
"src/app/api/admin/dashboard/stats/route.ts"
"src/app/api/admin/organizations/route.ts"
"src/app/api/admin/users/route.ts"
"src/app/api/ai-insights/[platform]/route.ts"
"src/app/api/analytics/geo-score/route.ts"
"src/app/api/analytics/unified-score/route.ts"
"src/app/api/audit/analyze/route.ts"
"src/app/api/audit/route.ts"
"src/app/api/audit/[id]/route.ts"
"src/app/api/billing/local-payments/route.ts"
"src/app/api/billing/route.ts"
"src/app/api/brands/scrape/[jobId]/route.ts"
"src/app/api/competitive/comparison/route.ts"
"src/app/api/competitive/discover/confirm/route.ts"
"src/app/api/competitive/snapshots/route.ts"
"src/app/api/competitors/by-domain/[domain]/route.ts"
"src/app/api/competitors/route.ts"
"src/app/api/competitors/[id]/route.ts"
"src/app/api/compliance/route.ts"
"src/app/api/content/inventory/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Check if file needs getUserId/getOrganizationId imports
    if ! grep -q "getUserId\|getOrganizationId" "$file"; then
      echo "  -> Adding auth imports"
      sed -i '1s/^/import { getUserId, getOrganizationId } from "@\/lib\/auth";\n/' "$file"
    fi
  fi
done

echo "Done!"
