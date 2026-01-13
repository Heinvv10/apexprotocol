#!/bin/bash

# Find all files with "await auth()" and fix them
find src/app/api -type f -name "route.ts" -o -name "route.tsx" | while read file; do
  if grep -q "await auth()" "$file"; then
    echo "Fixing: $file"
    
    # Handle different destructuring patterns:
    # 1. const { userId } = await auth();
    # 2. const { userId, orgId } = await auth();
    # 3. const session = await auth();
    
    # First, ensure imports exist
    if ! grep -q "from \"@/lib/auth\"" "$file"; then
      # Add import at the top
      sed -i '1s/^/import { getUserId, getOrganizationId } from "@\/lib\/auth";\n/' "$file"
    fi
    
    # Replace pattern: const { userId } = await auth();
    sed -i 's/const { userId } = await auth();$/const userId = await getUserId();/g' "$file"
    
    # Replace pattern: const { userId, orgId } = await auth();
    sed -i 's/const { userId, orgId } = await auth();$/const userId = await getUserId();\n    const orgId = await getOrganizationId();/g' "$file"
    
    # Replace pattern: const { orgId } = await auth();
    sed -i 's/const { orgId } = await auth();$/const orgId = await getOrganizationId();/g' "$file"
    
    # Replace pattern: const session = await auth();
    # Then we need to replace all session.userId with userId, etc.
    if grep -q "const session = await auth();" "$file"; then
      sed -i 's/const session = await auth();$/const userId = await getUserId();\n    const orgId = await getOrganizationId();/g' "$file"
      sed -i 's/session\.userId/userId/g' "$file"
      sed -i 's/session\.orgId/orgId/g' "$file"
    fi
  fi
done

echo "Done!"
