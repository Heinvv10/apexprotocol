# Apex AutoResearch Report
**Date:** 2026-03-27
**Commit:** a9ab53a
**Issues Found:** 5 critical, 9 warnings, 8 suggestions

---

## Executive Summary
The Apex Protocol codebase is a functional Next.js 14 e-commerce platform with working product catalog, checkout, order management, and admin tools. However, it has **critical security vulnerabilities** that must be addressed before this app can be considered production-safe: hardcoded SMTP and database credentials committed to the repository, a trivially forgeable session token system, and a command injection vector in the contact form. The overall code quality is functional but lacks type safety, test coverage, and developer tooling.

---

## Health Scores
| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 5/10 | App Router used correctly; two competing DB abstractions; no ORM despite spec |
| Code Quality | 4/10 | 40+ `any` usages; 3 files >400 lines; no tests; `require()` in TS files |
| Performance | 5/10 | All pages are `use client` (no SSR); raw `<img>` tags; images.unoptimized=true |
| Security | 2/10 | Forgeable session token; hardcoded credentials in 6 files; command injection |
| DX | 3/10 | No ESLint config; no Prettier; no test framework; no CI/CD |
| Dependencies | 4/10 | Missing advertised deps (Drizzle, Clerk, Redis, Shadcn); no lock version pinning |
| Design System | 5/10 | Consistent custom design; but spec colors don't match implementation; no card-primary/secondary/tertiary classes |
| Feature Coverage | 6/10 | Core commerce features work; no payment gateway, no password change, no wishlist |
| **Overall** | **4.3/10** | Functional but not production-secure in current form |

---

## Critical Issues (Fix Now)

### 1. Forgeable Session Token (Authentication Bypass)
**`lib/auth.ts:12-16`** — The session token is `base64(userId:email:isAdmin)`. Any user can craft an admin token by encoding `1:admin@apexprotocol.co.za:1` in base64. There is **no signature or HMAC**. This allows complete privilege escalation.

**Fix:** Sign tokens with `crypto.createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('hex')` and verify on every request.

---

### 2. Hardcoded SMTP Credentials in Source Code
**`lib/email.ts:9`**, **`app/api/auth/register/route.ts:10`**, **`app/api/admin/approve/route.ts:11`**, **`app/api/admin/members/route.ts:10`** — The password `Mitzi@19780203` is hardcoded in four files and committed to git history.

**Fix:** Move to `process.env.SMTP_PASS` and `process.env.SMTP_USER`. Rotate the password immediately since it is now in git history.

---

### 3. Hardcoded Database Credentials in Config Files
**`vercel.json:3`**, **`wrangler.toml:12`** — The full Neon PostgreSQL connection string (including username and password) is committed in plaintext:
`postgresql://neondb_owner:npg_qS7mURFtxv5e@ep-cold-firefly-ajeq5xuy...`

**Fix:** Remove from both files. Use Vercel/Cloudflare environment variable dashboards. Rotate the Neon DB password immediately.

---

### 4. Command Injection in Contact Form
**`app/api/contact/route.ts:50-54`** — User-supplied `firstName` and `lastName` are interpolated directly into a shell command:
```ts
`himalaya ... --subject "New Access Request - ${firstName} ${lastName}" ...`
```
A user can set `firstName` to `"; rm -rf /tmp; echo "` to execute arbitrary shell commands.

**Fix:** Remove the `himalaya` shell invocation entirely and use the existing `nodemailer` transporter (already used in `lib/email.ts`) for the contact notification email.

---

### 5. Hardcoded Admin Default Password
**`lib/db.ts:53`** — The admin user is seeded with password `admin123`:
```ts
const hash = bcrypt.hashSync('admin123', 10);
```
This runs every time no admin exists, meaning if the admin row is deleted the password resets to a known value.

**Fix:** Move to `process.env.ADMIN_SEED_PASSWORD` and log a startup warning if the env var is unset.

---

## Warnings (Fix Soon)

### 1. Two Competing Database Abstractions
**`lib/db.ts`** (Neon HTTP with SQLite-style `?` placeholders converted to `$1`) vs **`lib/db-pg.ts`** (Neon HTTP with native PostgreSQL `$1` placeholders). The products route uses `db-pg.ts`; all other routes use `db.ts`. The placeholder conversion in `lib/db.ts:8-11` is fragile and can silently produce wrong queries.

**Fix:** Consolidate to a single DB layer (`lib/db-pg.ts` is cleaner). Migrate all routes to use it.

---

### 2. Pervasive `any` Type Usage
**40+ instances** across: `app/admin/page.tsx`, `app/admin/orders/page.tsx`, `app/catalog/page.tsx`, `app/orders/page.tsx`, `app/api/admin/orders/route.ts`, `app/api/checkout/route.ts`, and more. With `strict: true` in tsconfig, these are surpressed type errors.

**Fix:** Define proper interfaces for `Order`, `Product`, `Member`, `CartItem`, etc. in a `types/` directory and replace all `any` usages.

---

### 3. No Input Validation on API Routes
No Zod (or any validation library) is installed or used. API routes accept raw JSON and trust client-supplied values like `subtotal`, `total`, and `items` without server-side validation or recalculation. A user could submit an order with `total: 1`.

**Fix:** Install `zod`, define schemas for each API request body, and **recalculate prices server-side** from product IDs rather than trusting client-submitted prices.

---

### 4. Admin Pages Are All `'use client'` — Missing Auth Check on Page Load
**`app/admin/layout.tsx:1`** — The layout is a client component. While the API routes check `is_admin`, the admin UI pages themselves fetch data client-side and show loading states. If JavaScript is disabled or a user manipulates the client, they see the page shell before the auth check fires.

**Fix:** Use a server component for the admin layout that calls `getSession()` and redirects before rendering.

---

### 5. `require()` Used in TypeScript Files
**`lib/db.ts:53`**, **`app/api/admin/approve/route.ts:42,47`**, **`app/api/contact/route.ts:50,56`** — Dynamic `require()` calls break static analysis, bypass module bundling, and can fail in Edge runtime.

**Fix:** Use standard ESM imports (`import bcrypt from 'bcryptjs'`) at the top of the file.

---

### 6. `admin/orders/page.tsx` and `admin/page.tsx` Are Too Large
- `app/admin/orders/page.tsx`: **681 lines** — mixes order list, create-order form, and edit-order modal in one file
- `app/admin/page.tsx`: **484 lines** — contains 8+ admin tabs in a single component
- `app/checkout/page.tsx`: **460 lines** — full checkout flow in one file

**Fix:** Extract sub-components (e.g., `OrderEditModal`, `CreateOrderForm`, `AdminTabOrders`).

---

### 7. No Rate Limiting on Auth Endpoints
**`app/api/auth/login/route.ts`** and **`app/api/auth/register/route.ts`** have no rate limiting. An attacker can brute-force passwords without limit.

**Fix:** Add rate limiting via `@upstash/ratelimit` or middleware-level IP throttling.

---

### 8. `next.config.js` Uses Deprecated `serverComponentsExternalPackages`
**`next.config.js:3`** — This option was renamed to `serverExternalPackages` in Next.js 14.2. Using the old name generates build warnings and may break in Next.js 15.

**Fix:** Rename to `serverExternalPackages`.

---

### 9. `images: { unoptimized: true }` Disables Image Optimization
**`next.config.js:6`** — All images are served unoptimized. Combined with 4 raw `<img>` tags (instead of `<Image>` from `next/image`), this means no lazy loading, no format conversion, and no size optimization.

**Fix:** Enable image optimization and replace `<img>` with `<Image width={...} height={...}>` from `next/image`.

---

## Suggestions

1. **Add types directory** — Create `types/index.ts` with `Order`, `Product`, `User`, `CartItem` interfaces to eliminate `any` usage — `app/admin/orders/page.tsx:134`

2. **Add ESLint** — No `.eslintrc` or `eslint.config.js` exists. Add `eslint-config-next` and `@typescript-eslint/eslint-plugin` to catch type errors and bad patterns at dev time.

3. **Add Prettier** — No `.prettierrc` found. Code style is inconsistent (mixed quote styles, inconsistent spacing).

4. **Server-side price recalculation** — `app/api/checkout/route.ts:10-13` trusts `subtotal` and `total` from the client body. Recalculate from DB product prices and the pricing lib.

5. **Design system tokens mismatch** — The task spec lists `#0a0f1a, #141930, #00E5CC, #8B5CF6` but the Tailwind config and CSS use `#0a0a0a, #1a1a2e, #00d4ff`. These should be aligned, and `card-primary`, `card-secondary`, `card-tertiary` CSS classes should be defined.

6. **Add `.env.example`** — No example environment file exists. New developers have no way to know which env vars are required (`DATABASE_URL`, `SMTP_USER`, `SMTP_PASS`, `AUTH_SECRET`).

7. **Password change endpoint missing** — There is no `/api/auth/change-password` route and no UI for it. Users sent temp passwords (via `approve/route.ts`) have no way to change them.

8. **Contact form email is broken in production** — `app/api/contact/route.ts` calls `himalaya` CLI which will not be available on Vercel/Cloudflare. The `catch` block silently ignores this. Use `nodemailer` like the rest of the app.

---

## Quick Wins (< 30 min each)
- [ ] Move `SMTP_USER` / `SMTP_PASS` to env vars in all 4 files using hardcoded credentials
- [ ] Remove DB credentials from `vercel.json` and `wrangler.toml`; move to dashboard env vars
- [ ] Replace `himalaya` shell call in `app/api/contact/route.ts` with `nodemailer`
- [ ] Replace `require('bcryptjs')` with top-level ESM `import bcrypt from 'bcryptjs'` in 3 files
- [ ] Rename `serverComponentsExternalPackages` → `serverExternalPackages` in `next.config.js`
- [ ] Add `.env.example` listing all required environment variables
- [ ] Add `ADMIN_SEED_PASSWORD` env var support to `lib/db.ts:initAdmin()`

---

## Feature Progress
- **No feature_list.json found** — features inferred from codebase

| Feature | Status |
|---------|--------|
| User registration + approval flow | ✅ |
| Login / logout | ✅ |
| Product catalog with category filters + search | ✅ |
| Product detail page with tabs | ✅ |
| Cart (client-side state) | ✅ |
| Checkout (manual/EFT) | ✅ |
| Order confirmation email | ✅ |
| Customer order history | ✅ |
| Admin dashboard with stats | ✅ |
| Admin orders management (CRUD) | ✅ |
| Admin products / stock management | ✅ |
| Admin pricing / markup management | ✅ |
| Admin member approvals | ✅ |
| Supplier sync (Muscles SA) | ✅ |
| Age gate component | ✅ (component exists, not applied globally) |
| Notification / back-in-stock alerts | ✅ |
| Payment gateway integration | ❌ |
| Password change for users | ❌ |
| Wishlist / saved items | ❌ |
| Analytics / reporting | ❌ |
| Address book | ❌ |

- **Implemented:** ~16 features | **Missing:** ~5 features

---

## Recommended Roadmap

### This Week — Critical Security Fixes
1. Rotate ALL exposed credentials immediately (SMTP password, Neon DB password)
2. Sign session tokens with HMAC (`AUTH_SECRET` env var)
3. Move all credentials to environment variables
4. Replace `himalaya` shell exec with nodemailer to close command injection

### Next 2 Weeks — Code Quality
5. Consolidate dual DB layers (`db.ts` + `db-pg.ts`) → single `lib/db.ts` using native `$1` params
6. Add Zod validation to all API routes; recalculate prices server-side
7. Add `types/index.ts` and eliminate `any` usage
8. Add rate limiting to auth endpoints
9. Refactor `admin/orders/page.tsx` (681 lines) and `admin/page.tsx` (484 lines) into sub-components
10. Add password change endpoint

### Ongoing — Developer Experience
11. Add ESLint + Prettier config
12. Add Jest or Vitest with tests for pricing logic, auth utilities, and API routes
13. Add `.env.example` and `CLAUDE.md` documenting the project
14. Enable Next.js Image Optimization and replace raw `<img>` tags
15. Align design system color tokens with spec (`#00E5CC`, `#8B5CF6`)
