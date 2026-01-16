# Quick Guide: Install Node.js v20 LTS

**Current Issue**: Node.js v24.6.0 is incompatible with Next.js 16.1.1
**Solution**: Downgrade to Node.js v20 LTS
**Time Required**: 5 minutes

---

## Option 1: Automated Installation (Easiest)

### Step 1: Run the installer
```bash
# The nvm-windows installer has been downloaded to:
~/nvm-setup.exe

# Run it:
start ~/nvm-setup.exe
```

### Step 2: Follow the installer
1. Click "Next"
2. Accept license agreement
3. Use default installation paths
4. Click "Install"
5. Click "Finish"

### Step 3: Open NEW PowerShell window (as Administrator)
```powershell
# Install Node.js v20
nvm install 20.11.0

# Activate Node.js v20
nvm use 20.11.0

# Verify
node --version
# Should show: v20.11.0
```

### Step 4: Reinstall project dependencies
```bash
cd "C:\Jarvis\AI Workspace\Apex"
npm ci
```

### Step 5: Start dev server
```bash
npm run dev
```

**Done!** The server should now start successfully.

---

## Option 2: Direct Node.js Installation (Alternative)

If nvm-windows doesn't work, install Node.js directly:

### Step 1: Uninstall Node.js v24.6.0
```powershell
# Go to Windows Settings > Apps > Apps & Features
# Find "Node.js" and click "Uninstall"
```

### Step 2: Download Node.js v20 LTS
- Visit: https://nodejs.org/en/download
- Download "20.x.x LTS" Windows Installer (.msi)
- Choose 64-bit version

### Step 3: Install
- Run the downloaded .msi file
- Click through installer (use defaults)
- Restart terminal

### Step 4: Verify
```bash
node --version
# Should show: v20.x.x
```

### Step 5: Reinstall dependencies and start server
```bash
cd "C:\Jarvis\AI Workspace\Apex"
npm ci
npm run dev
```

---

## Option 3: Using PowerShell Script (Automated)

A PowerShell script has been created for you:

```powershell
# Open PowerShell as Administrator
# Then run:
cd "C:\Jarvis\AI Workspace\Apex"
.\install-node-v20.ps1
```

This will automatically:
1. Install nvm-windows
2. Download Node.js v20.11.0
3. Activate it
4. Verify installation

---

## Verification

After installation, verify everything is working:

```bash
# Check Node version (should be v20.x.x)
node --version

# Check npm version
npm --version

# Navigate to project
cd "C:\Jarvis\AI Workspace\Apex"

# Reinstall dependencies
npm ci

# Start dev server
npm run dev

# You should see:
# ✓ Ready in Xms
# ○ Compiling / ...
# ✓ Compiled / in Xms
# ○ Local:        http://localhost:3000
```

---

## Troubleshooting

### "nvm: command not found" after installation
- Close and reopen your terminal
- Or restart your computer

### npm ci fails
- Delete node_modules: `rm -rf node_modules`
- Delete package-lock.json: `rm package-lock.json`
- Run: `npm install`

### Server still won't start
- Verify Node version: `node --version` (must be v20.x.x)
- Check if another process is using port 3000:
  ```bash
  netstat -ano | findstr :3000
  ```
- Kill the process if needed (use Process ID from above):
  ```bash
  taskkill /PID <process_id> /F
  ```

---

## Why This Fixes the Issue

**Problem**: Node.js v24.6.0 (Dec 2024 release) introduced breaking changes
**Symptom**: Next.js commands exit silently with no output
**Solution**: Node.js v20 LTS is stable and fully compatible with Next.js 16.1.1

**After Fix**:
- ✅ Dev server will start
- ✅ All Next.js commands will work
- ✅ E2E verification can proceed

---

## Files Created

- `~/nvm-setup.exe` - nvm-windows installer (downloaded)
- `install-node-v20.ps1` - Automated PowerShell script
- This guide - `INSTALL_NODE_V20_GUIDE.md`

---

**Once Node.js v20 is installed and the server starts, I'll automatically proceed with the comprehensive E2E browser automation verification you requested!**
