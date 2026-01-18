#!/bin/bash
# Safe cleanup script for worktree .claude directories
# This script removes duplicate .claude directories from git worktrees

echo "🧹 Cleaning up worktree .claude directories..."
echo ""

# Find all .claude directories in worktrees (excluding node_modules)
CLAUDE_DIRS=$(find .worktrees -type d -name ".claude" -not -path "*/node_modules/*")
COUNT=$(echo "$CLAUDE_DIRS" | wc -l)

echo "Found $COUNT .claude directories in worktrees"
echo ""

# Confirm before deletion
echo "This will delete the following directories:"
echo "$CLAUDE_DIRS"
echo ""
read -p "Proceed with deletion? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Delete each directory
    DELETED=0
    while IFS= read -r dir; do
        if [ -d "$dir" ]; then
            echo "Deleting: $dir"
            rm -r "$dir"
            ((DELETED++))
        fi
    done <<< "$CLAUDE_DIRS"

    echo ""
    echo "✅ Deleted $DELETED directories"
else
    echo "❌ Cancelled - no directories deleted"
fi
