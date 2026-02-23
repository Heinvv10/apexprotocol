# Deployment Guide - Apex Protocol

## Status
✅ Database: Migrated to Neon PostgreSQL
✅ Code: Ready for Cloudflare Pages
⏳ DNS: Waiting for propagation to Cloudflare nameservers

## Quick Deploy (Cloudflare Pages Dashboard)

### 1. Upload to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages"
3. Click "Create application" → "Pages" → "Upload assets"
4. Upload this entire `/app` directory
5. Or connect to a Git repository

### 2. Build Settings

```
Build command: npm run build
Build output directory: .next
Framework preset: Next.js
Node version: 18
```

### 3. Environment Variables

Add these in Cloudflare Pages settings:

```
DATABASE_URL=postgresql://neondb_owner:npg_ohf0WcXYymk2@ep-cold-firefly-ajeq5xuy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_SITE_URL=https://apexprotocol.co.za
NODE_ENV=production
```

### 4. Custom Domain

Once deployed:
1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Add `apexprotocol.co.za` and `www.apexprotocol.co.za`
4. Cloudflare will auto-configure DNS

## Database Info

- **Provider:** Neon PostgreSQL
- **Products:** 141 items loaded
- **Orders:** 2 test orders (AP-0001, AP-0002)
- **Connection:** Already configured in environment variables

## Post-Deployment

### Test the site:
1. Visit https://apexprotocol.co.za
2. Browse products
3. Test checkout (with email collection)
4. Check admin panel: /admin

### Admin Login:
- Email: admin@apexprotocol.co.za
- Password: admin123 (CHANGE THIS IMMEDIATELY)

## Automation Setup

Once deployed, configure Apex Agent automation:

1. Update database path in scripts to use Neon connection
2. Test quote email system
3. Test order placement on Muscles SA
4. Enable heartbeat automation

## Support

- Database: Neon dashboard
- Hosting: Cloudflare Pages dashboard
- Domain: Cloudflare DNS dashboard
