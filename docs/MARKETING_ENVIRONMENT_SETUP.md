# Marketing System Environment Setup

This guide explains how to configure the marketing system with Mautic, ListMonk, Postiz, and Matomo.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ with npm or bun
- PostgreSQL client tools (optional, for manual debugging)

## Step 1: Copy Environment Variables

Create a `.env.local` file in the project root and add the following variables:

### Mautic Configuration (CRM & Campaigns)

```
MAUTIC_URL=http://localhost:8000
MAUTIC_USERNAME=admin
MAUTIC_PASSWORD=mautic_default_password_change_me
MAUTIC_CLIENT_ID=client_id_from_mautic_settings
MAUTIC_CLIENT_SECRET=client_secret_from_mautic_settings
```

**Notes:**
- Initial password is `mautic` in Docker, change after first login
- Generate OAuth2 credentials from Mautic admin panel (Settings > API Credentials)
- Use "Password Grant" type for server-to-server authentication

### ListMonk Configuration (Email Management)

```
LISTMONK_URL=http://localhost:9000
LISTMONK_USERNAME=admin
LISTMONK_PASSWORD=listmonk_default_password_change_me
```

**Notes:**
- Default credentials: admin/password
- Change password after first login in ListMonk admin

### Postiz Configuration (Social Media Scheduling)

```
POSTIZ_URL=http://localhost:3001
POSTIZ_API_KEY=your_postiz_api_key_here
```

**Notes:**
- Generate API key from Postiz dashboard (Settings > API)
- Keep this secret - treat like a password

### Matomo Configuration (Analytics)

```
MATOMO_URL=http://localhost:8080
MATOMO_TOKEN=your_matomo_api_token_here
MATOMO_SITE_ID=1
```

**Notes:**
- Generate API token from Matomo admin (Admin > Personal > Security > Create New Token)
- Site ID defaults to 1 for first tracked website

### Marketing Database Configuration

```
MARKETING_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/marketing_db
```

**Notes:**
- Separate database from main Apex database
- Uses port 5433 (main app uses 5432)
- Default password is `postgres` for development

### Webhook Configuration

```
MAUTIC_WEBHOOK_SECRET=your_webhook_secret_for_mautic
LISTMONK_WEBHOOK_SECRET=your_webhook_secret_for_listmonk
POSTIZ_WEBHOOK_SECRET=your_webhook_secret_for_postiz
```

**Notes:**
- These are used to verify webhook signatures from external tools
- Generate random strings and keep them secure
- Configure these same secrets in each tool's webhook settings

### Feature Flags

```
ENABLE_MARKETING_SYSTEM=true
MARKETING_LOG_LEVEL=info
```

## Step 2: Start Marketing Infrastructure

```bash
# Navigate to project root
cd /path/to/apex

# Start all marketing services
docker-compose -f docker-compose.marketing.yml up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose -f docker-compose.marketing.yml logs -f
```

Verify each service is running:
```bash
# Check service health
docker-compose -f docker-compose.marketing.yml ps

# Expected output:
# CONTAINER              STATUS
# mautic                 Up (healthy)
# listmonk               Up (healthy)
# postiz                 Up (healthy)
# matomo                 Up (healthy)
# marketing_postgres     Up (healthy)
```

## Step 3: Configure Each Tool

### Mautic Setup (http://localhost:8000)

1. **Initial Setup**
   - Email: `admin@apex.local`
   - Password: Create a strong password
   - Database: Use MariaDB (preconfigured)

2. **Configure OAuth2**
   - Go to Settings > API Credentials
   - Create new credential:
     - Name: `Apex Backend`
     - Grant Type: `Password Grant`
     - Client ID/Secret will be generated
   - Copy to `.env.local` as `MAUTIC_CLIENT_ID` and `MAUTIC_CLIENT_SECRET`

3. **Configure Webhooks**
   - Settings > Webhooks
   - Add webhook:
     - Name: `Apex Events`
     - URL: `https://your-apex-domain/api/webhooks/mautic`
     - Secret: Use value from `MAUTIC_WEBHOOK_SECRET`
     - Events: Lead created/updated, Email sent/opened/clicked

### ListMonk Setup (http://localhost:9000)

1. **Initial Setup**
   - Username: `admin`
   - Password: Create a strong password

2. **Configure API Access**
   - Settings > Users
   - Create API user for Apex (if needed)

3. **Configure Webhooks**
   - Campaigns > Settings > Webhooks
   - Add webhook:
     - URL: `https://your-apex-domain/api/webhooks/listmonk`
     - Events: Subscriber confirmed, Link clicked, Unsubscribed, Message bounced

### Postiz Setup (http://localhost:3001)

1. **Initial Setup**
   - Create account or login
   - Generate API key from Settings > API

2. **Connect Social Platforms**
   - Dashboard > Connected Accounts
   - Link: LinkedIn, TikTok, Instagram, Facebook, Twitter, YouTube

3. **Configure Webhooks**
   - Settings > Webhooks
   - Add webhook:
     - URL: `https://your-apex-domain/api/webhooks/postiz`
     - Events: Post published, Post failed, Engagement updates, Comments, Shares

### Matomo Setup (http://localhost:8080)

1. **Initial Setup**
   - Website: `https://apex.local`
   - Generate API token from Admin > Personal > Security

2. **Install Tracking Code**
   - Copy Matomo tracking code to Apex frontend
   - Test with: `http://localhost:8080/index.php?module=API2&method=VisitsSummary.getVisits&idSite=1&period=day&date=last30&format=JSON&token_auth=YOUR_TOKEN`

## Step 4: Test API Connectivity

### Test Mautic Connection

```bash
curl -X GET 'http://localhost:3000/api/marketing/campaigns' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'

# Expected response:
# {
#   "data": [...],
#   "meta": { "success": true }
# }
```

### Test ListMonk Connection

```bash
curl -X GET 'http://localhost:3000/api/marketing/emails' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'
```

### Test Postiz Connection

```bash
curl -X GET 'http://localhost:3000/api/marketing/social' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'
```

### Test Matomo Analytics

```bash
curl -X GET 'http://localhost:3000/api/marketing/analytics' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'
```

## Step 5: Initialize Database Schema

```bash
# Generate Drizzle migration
npm run db:generate

# Apply migration to marketing database
MARKETING_DATABASE_URL=postgresql://... npm run db:migrate

# Or use Drizzle Studio to visualize
npm run db:studio
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker logs
docker-compose -f docker-compose.marketing.yml logs mautic
docker-compose -f docker-compose.marketing.yml logs listmonk

# Verify ports aren't in use
netstat -ano | findstr :8000
netstat -ano | findstr :9000
netstat -ano | findstr :3001
netstat -ano | findstr :8080
netstat -ano | findstr :5433
```

### Authentication Failures

1. **Mautic OAuth Error**
   - Verify client credentials in Mautic Settings
   - Check token hasn't expired
   - Reset password in Mautic admin if credentials don't work

2. **ListMonk Auth Error**
   - Verify username/password
   - Check ListMonk admin is accessible

3. **Postiz API Key Invalid**
   - Regenerate from Postiz dashboard
   - Verify no extra spaces in key

### Database Connection Issues

```bash
# Test marketing database connection
psql postgresql://postgres:postgres@localhost:5433/marketing_db

# List tables
\dt

# Verify schema exists
\d marketing_campaigns
```

### Webhook Testing

Use a webhook testing tool (RequestBin, Hookbin) to test webhook delivery:

1. Create test webhook on third-party site
2. Send test event from marketing tool
3. Verify payload structure
4. Update webhook handler if needed

## Next Steps

1. Create webhook test suite (see `docs/WEBHOOK_TESTING.md`)
2. Set up monitoring and alerts
3. Configure backup strategy for marketing database
4. Document custom field mappings for each tool
