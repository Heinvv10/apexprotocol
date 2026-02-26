# Deployment Guide - Apex Protocol

## Hosting
- **Server:** velo (`hein@velo`)
- **Path:** `/home/hein/apex-protocol/`
- **Service:** `apex-protocol.service` (user systemd, port 3100)
- **Database:** Neon PostgreSQL

## Deploy Steps

```bash
# 1. Push from local
cd /Users/jarvisspecter/clawd/projects/muscles-store/app
git pull && git add . && git commit -m "..." && git push origin main

# 2. Pull + build on velo
ssh hein@velo "cd /home/hein/apex-protocol && git pull origin main && npm run build"

# 3. Restart service
ssh hein@velo "systemctl --user restart apex-protocol"
```

## Environment Variables
Set in `.env.local` on velo:
```
DATABASE_URL=postgresql://neondb_owner:npg_ohf0WcXYymk2@ep-cold-firefly-ajeq5xuy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_SITE_URL=https://apexprotocol.co.za
NODE_ENV=production
```

## Admin
- URL: https://apexprotocol.co.za/admin
- Login: admin@apexprotocol.co.za
