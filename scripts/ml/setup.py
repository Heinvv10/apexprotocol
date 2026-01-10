#!/usr/bin/env python3
"""
ML Environment Setup - NOT USED

This project uses TYPESCRIPT with simple-statistics, not Python.
See docs/ML_APPROACH_DECISION.md for rationale.

To verify the ML environment, run:
    npm run test:ml

Or directly:
    npx tsx scripts/ml/setup.ts --test

The TypeScript approach was chosen for:
- Deployment simplicity (no Python dependencies)
- Development velocity (single language)
- Performance (<100ms forecasting)
- Windows compatibility (no pystan issues)
"""

import sys

def main():
    print("\n" + "=" * 60)
    print("ML Environment: TypeScript + simple-statistics")
    print("=" * 60)
    print("\nThis project uses TYPESCRIPT for ML forecasting, not Python.")
    print("\nTo test the ML environment, run:")
    print("  npm run test:ml")
    print("\nSee docs/ML_APPROACH_DECISION.md for details.\n")

    # Return success so the fallback works in verification command
    sys.exit(1)  # Exit with error to trigger fallback to npm script

if __name__ == "__main__":
    main()
