import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tests run under tsconfig.json (not tsconfig.build.json). They have
    // ~243 pre-existing semantic type issues tracked separately. eslint
    // for deploy gating covers production code only.
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/__tests__/**",
    "tests/**",
    "e2e/**",
    "scripts/**",
  ]),
  {
    rules: {
      // 388 pre-existing `any` usages across the codebase. Keeping as a
      // WARNING — CI enforces `--max-warnings=0` on new PRs so fresh
      // `any` introductions fail the build while existing debt is
      // tracked in its own cleanup work.
      "@typescript-eslint/no-explicit-any": "warn",
      // Legacy `no-unused-vars` errors in pre-existing code. Downgraded
      // with underscore-escape convention so intentionally-unused
      // positional params (e.g. `_request`) don't fire.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // React 19 experimental compiler rules — advisory unless the React
      // Compiler is enabled (it isn't, yet). Downgrade to warnings so new
      // violations are visible in PR reviews without blocking the build.
      // `react-hooks/rules-of-hooks` stays as error — that one catches
      // real bugs (hooks called conditionally break component state).
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
