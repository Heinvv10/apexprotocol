# Apex VPS Deployment Guide

**Target Server**: 72.61.197.178
**Deployment Method**: Docker Compose
**Application**: Apex GEO/AEO Platform

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## Prerequisites

### On Your Local Machine

- ✅ SSH access to VPS (72.61.197.178)
- ✅ SSH key added to VPS (`~/.ssh/authorized_keys`)
- ✅ Git installed
- ✅ Node.js 20+ installed (for local build verification)
- ✅ OpenSSH client
- ✅ rsync (optional, for faster file transfer)

### On the VPS (72.61.197.178)

The deployment script will automatically install:
- Docker Engine
- Docker Compose
- Required system packages

**Minimum VPS Requirements**:
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Storage: 20GB+ available
- OS: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Network: Port 80 and 443 open

---

## Pre-Deployment Checklist

### 1. Verify Git Status

```bash
cd "C:\Jarvis\AI Workspace\Apex"
git status
git log --oneline -5
```

**Expected**: Clean working directory, all commits pushed to origin/master

### 2. Test SSH Connection

```bash
ssh root@72.61.197.178 "echo 'SSH connection successful'"
```

**Expected**: "SSH connection successful" message

### 3. Check Environment Variables

```bash
ls -la .env* env.production.template
```

**Expected**: `.env.example` and `env.production.template` present

---

## Environment Configuration

### Step 1: Create Production Environment File

```bash
# Copy template
cp env.production.template .env.production

# Edit with your values
# Use nano, vim, or VS Code
nano .env.production
```

### Step 2: Fill in Required Values

**CRITICAL - These are REQUIRED**:

1. **Clerk Authentication**:
   - Get production keys from https://dashboard.clerk.com
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
   - `CLERK_SECRET_KEY=sk_live_...`

2. **Database**:
   - Neon PostgreSQL connection string
   - `DATABASE_URL=postgresql://user:pass@host.neon.tech:5432/apex?sslmode=require`

3. **Encryption Key**:
   - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ENCRYPTION_KEY=<64-character-hex-string>`

**RECOMMENDED - For full functionality**:

4. **At least ONE AI Service**:
   - OpenAI: `OPENAI_API_KEY=sk-...`
   - OR Anthropic: `ANTHROPIC_API_KEY=sk-ant-...`

5. **Redis (Upstash)**:
   - `UPSTASH_REDIS_REST_URL=https://....upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN=...`

### Step 3: Verify Environment File

```bash
# Check file exists and is not empty
cat .env.production | grep -v "^#" | grep -v "^$" | head -10
```

**Expected**: See your actual values (not XXXXX placeholders)

---

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

The deployment script handles everything automatically:

```bash
# Make script executable
chmod +x deploy-to-vps.sh

# Run deployment
./deploy-to-vps.sh

# Or with custom SSH user
VPS_USER=myuser ./deploy-to-vps.sh
```

**What the script does**:
1. ✅ Checks prerequisites (SSH, rsync)
2. ✅ Builds application locally
3. ✅ Creates backup on VPS
4. ✅ Transfers files via rsync/scp
5. ✅ Installs Docker if needed
6. ✅ Deploys with Docker Compose
7. ✅ Verifies health endpoint
8. ✅ Shows deployment status

**Deployment time**: ~5-10 minutes (first deployment)

### Method 2: Manual Deployment

If you prefer manual control:

#### Step 1: Build Locally

```bash
npm install
npm run build
```

#### Step 2: Transfer Files

```bash
# Create tarball
tar -czf apex-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.claude' \
  .

# Upload to VPS
scp apex-deploy.tar.gz root@72.61.197.178:/opt/

# Transfer environment
scp .env.production root@72.61.197.178:/opt/.env
```

#### Step 3: Extract and Deploy on VPS

```bash
# SSH into VPS
ssh root@72.61.197.178

# Extract files
cd /opt
mkdir -p apex
cd apex
tar -xzf ../apex-deploy.tar.gz
mv ../.env ./.env

# Install Docker (if needed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Deploy
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f app
```

---

## Post-Deployment Verification

### 1. Check Container Status

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose ps"
```

**Expected**: All containers showing "Up" status

### 2. Verify Health Endpoint

```bash
ssh root@72.61.197.178 "curl -f http://localhost:3000/api/health"
```

**Expected**: `{"status":"ok","timestamp":"..."}` or similar

### 3. Check Application Logs

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose logs --tail=50 app"
```

**Expected**: No errors, "Ready on port 3000" message

### 4. Test Application in Browser

Open: http://72.61.197.178

**Expected**:
- ✅ Apex homepage loads
- ✅ Sign-in button works
- ✅ Clerk authentication redirects correctly
- ✅ No console errors

### 5. Test Admin Routes (After Sign-In)

Navigate to: http://72.61.197.178/admin/dashboard

**Expected**:
- ✅ Dashboard loads with data
- ✅ No API errors in network tab
- ✅ All admin pages accessible

---

## Troubleshooting

### Issue: Build Fails Locally

**Symptoms**: `npm run build` fails with TypeScript errors

**Solution**:
```bash
# Check for errors
npm run build 2>&1 | tee build-errors.txt

# Fix TypeScript errors first
npx tsc --noEmit

# Retry build
npm run build
```

### Issue: SSH Connection Fails

**Symptoms**: Cannot connect to 72.61.197.178

**Solution**:
```bash
# Check if VPS is reachable
ping 72.61.197.178

# Test SSH with verbose output
ssh -v root@72.61.197.178

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh

# If password authentication needed
ssh -o PreferredAuthentications=password root@72.61.197.178
```

### Issue: Docker Build Fails on VPS

**Symptoms**: `docker-compose up` fails with build errors

**Solution**:
```bash
# SSH into VPS
ssh root@72.61.197.178
cd /opt/apex

# Check Docker logs
docker-compose logs app

# Rebuild with no cache
docker-compose build --no-cache

# Check disk space
df -h

# If out of space, clean old images
docker system prune -a
```

### Issue: Application Shows "502 Bad Gateway"

**Symptoms**: Nginx returns 502 error

**Solution**:
```bash
# Check if app container is running
docker-compose ps app

# Check app logs
docker-compose logs app

# Restart containers
docker-compose restart

# If still failing, check .env file
docker-compose exec app cat /app/.env | head -20
```

### Issue: Database Connection Fails

**Symptoms**: "Connection refused" or "Failed to connect to database"

**Solution**:
```bash
# Verify DATABASE_URL in .env
ssh root@72.61.197.178 "cd /opt/apex && grep DATABASE_URL .env"

# Test database connection manually
docker-compose exec app node -e "
  const { neonConfig } = require('@neondatabase/serverless');
  neonConfig.fetchConnectionCache = true;
  console.log('Database URL configured');
"

# Check if Neon database is accessible
ping your-neon-host.neon.tech
```

### Issue: Clerk Authentication Fails

**Symptoms**: "Invalid publishable key" or authentication redirects fail

**Solution**:
```bash
# Verify Clerk keys
ssh root@72.61.197.178 "cd /opt/apex && grep CLERK .env"

# Check Clerk Dashboard:
# 1. Verify keys match production keys
# 2. Check allowed domains include VPS IP
# 3. Verify webhook URL is correct

# Restart app to reload environment
docker-compose restart app
```

### Issue: Port 80/443 Already in Use

**Symptoms**: "port is already allocated"

**Solution**:
```bash
# Find what's using the port
ssh root@72.61.197.178 "netstat -tlnp | grep ':80\|:443'"

# Stop conflicting service (if safe)
ssh root@72.61.197.178 "systemctl stop apache2"  # or nginx

# Or modify docker-compose.yml to use different ports
# ports:
#   - "8080:3000"
```

---

## Maintenance

### View Live Logs

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose logs -f app"
```

Press `Ctrl+C` to exit

### Restart Application

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose restart app"
```

### Stop Application

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose down"
```

### Start Application

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose up -d"
```

### Update Application (Re-deploy)

```bash
# Pull latest code
git pull origin master

# Re-run deployment script
./deploy-to-vps.sh
```

### View Container Status

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose ps"
```

### Access Container Shell

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose exec app sh"
```

### View Database Migrations Status

```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose exec app npm run db:migrate"
```

### Clean Up Old Docker Images

```bash
ssh root@72.61.197.178 "docker system prune -a --volumes"
```

**Warning**: This removes all unused containers, networks, and volumes

### Backup Application Data

```bash
# Create manual backup
ssh root@72.61.197.178 "
  cd /opt/apex-backups
  tar -czf apex-backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /opt/apex .
"

# Download backup
scp root@72.61.197.178:/opt/apex-backups/apex-backup-*.tar.gz ./backups/
```

### Restore from Backup

```bash
# Upload backup
scp ./backups/apex-backup-TIMESTAMP.tar.gz root@72.61.197.178:/opt/

# Restore on VPS
ssh root@72.61.197.178 "
  cd /opt/apex
  docker-compose down
  rm -rf ./*
  tar -xzf ../apex-backup-TIMESTAMP.tar.gz
  docker-compose up -d
"
```

### Monitor Resource Usage

```bash
# CPU and Memory usage
ssh root@72.61.197.178 "docker stats --no-stream"

# Disk usage
ssh root@72.61.197.178 "df -h"

# Docker disk usage
ssh root@72.61.197.178 "docker system df"
```

### Set Up SSL/TLS (HTTPS)

```bash
# Install Certbot on VPS
ssh root@72.61.197.178 "
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
"

# Get SSL certificate (requires domain name)
ssh root@72.61.197.178 "certbot --nginx -d yourdomain.com"

# Auto-renewal
ssh root@72.61.197.178 "certbot renew --dry-run"
```

---

## Security Checklist

- ✅ Use strong passwords for all services
- ✅ Enable UFW firewall on VPS
- ✅ Keep Docker and system packages updated
- ✅ Use environment-specific secrets (no dev keys in prod)
- ✅ Enable 2FA on Clerk, database, and other accounts
- ✅ Regularly rotate encryption keys
- ✅ Monitor logs for suspicious activity
- ✅ Keep backups in secure location
- ✅ Use HTTPS in production (set up SSL)
- ✅ Restrict SSH to key-based authentication only

---

## Performance Optimization

### Enable Caching

Ensure Redis is configured in `.env.production`:
```
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Enable CDN (Optional)

Use Cloudflare for static asset caching:
1. Add domain to Cloudflare
2. Point DNS to VPS IP
3. Enable caching rules
4. Enable HTTP/3

### Database Optimization

- Use connection pooling (already enabled in Neon)
- Enable prepared statements
- Monitor slow queries
- Add indexes as needed

---

## Support

For deployment issues:
1. Check logs first: `docker-compose logs app`
2. Review this guide's troubleshooting section
3. Check GitHub Issues
4. Contact support with:
   - Error messages from logs
   - Steps to reproduce
   - Environment (VPS specs, OS version)
   - Deployment method used

---

**Last Updated**: 2026-01-20
**Version**: 1.0.0
**Maintainer**: Apex Development Team
