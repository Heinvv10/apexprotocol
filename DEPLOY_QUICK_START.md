# Apex Deployment - Quick Start

Deploy Apex to VPS at **72.61.197.178** in 4 steps:

---

## ⚡ Quick Deploy (5 minutes)

### Step 1: Configure Environment (2 minutes)

```bash
# Copy template
cp env.production.template .env.production

# Edit with your values - REQUIRED fields:
# - CLERK keys (get from dashboard.clerk.com)
# - DATABASE_URL (Neon PostgreSQL)
# - ENCRYPTION_KEY (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - At least ONE AI API key (OpenAI or Anthropic)

nano .env.production  # or use VS Code
```

### Step 2: Make Script Executable

```bash
chmod +x deploy-to-vps.sh
```

### Step 3: Deploy

```bash
./deploy-to-vps.sh
```

### Step 4: Verify

Open http://72.61.197.178 in your browser

✅ Done!

---

## 📋 Pre-Deployment Checklist

- [ ] SSH access to VPS configured
- [ ] `.env.production` created with real values
- [ ] Clerk production keys obtained
- [ ] Database connection string ready
- [ ] At least one AI API key ready

---

## 🔧 What the Script Does

1. ✅ Tests SSH connection
2. ✅ Builds application locally
3. ✅ Creates backup on VPS
4. ✅ Transfers files
5. ✅ Installs Docker (if needed)
6. ✅ Deploys with Docker Compose
7. ✅ Verifies health endpoint

---

## 🐛 Quick Troubleshooting

**SSH fails?**
```bash
ssh-copy-id root@72.61.197.178
```

**Build fails?**
```bash
npm run build  # Fix errors shown
```

**Docker issues?**
```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose logs app"
```

**Need to restart?**
```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose restart"
```

---

## 📚 Full Documentation

See `docs/DEPLOYMENT_GUIDE.md` for:
- Detailed troubleshooting
- Manual deployment steps
- Maintenance commands
- SSL/TLS setup
- Performance optimization

---

## 🆘 Common Issues

### Issue: "Cannot connect to VPS"
**Fix**: Test SSH key: `ssh root@72.61.197.178 "echo OK"`

### Issue: "Build fails with TypeScript errors"
**Fix**: Run `npm run build` locally and fix errors first

### Issue: "502 Bad Gateway"
**Fix**: Check logs: `ssh root@72.61.197.178 "cd /opt/apex && docker-compose logs app"`

### Issue: "Database connection refused"
**Fix**: Verify `DATABASE_URL` in `.env.production` is correct

### Issue: "Clerk authentication fails"
**Fix**: Verify production keys in `.env.production`

---

## 🔄 Re-deploy (Updates)

```bash
# Pull latest code
git pull origin master

# Re-run deployment
./deploy-to-vps.sh
```

---

## 📊 Monitor Deployment

### View Logs
```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose logs -f app"
```

### Check Status
```bash
ssh root@72.61.197.178 "cd /opt/apex && docker-compose ps"
```

### Test Health
```bash
curl http://72.61.197.178/api/health
```

---

## 🎯 Success Indicators

After deployment completes:

✅ Script shows "Deployment Complete!"
✅ Health check returns `{"status":"ok"}`
✅ http://72.61.197.178 loads homepage
✅ Sign-in redirects to Clerk
✅ No errors in `docker-compose logs`

---

**Need help?** See full guide: `docs/DEPLOYMENT_GUIDE.md`
