# Install Node.js v20 LTS - Automated Setup Script
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Node.js v20 LTS Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Installing nvm-windows..." -ForegroundColor Green
Write-Host "The installer will open. Please follow these steps:" -ForegroundColor Yellow
Write-Host "  1. Click 'Next' through the installer" -ForegroundColor Yellow
Write-Host "  2. Accept the license agreement" -ForegroundColor Yellow
Write-Host "  3. Use default installation paths" -ForegroundColor Yellow
Write-Host "  4. Click 'Install' and wait for completion" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting installer..." -ForegroundColor Cyan

# Run the installer
$installerPath = "$env:USERPROFILE\nvm-setup.exe"
if (Test-Path $installerPath) {
    Start-Process -FilePath $installerPath -Wait
    Write-Host "nvm-windows installation complete!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Installer not found at $installerPath" -ForegroundColor Red
    Write-Host "Downloading installer..." -ForegroundColor Yellow

    $url = "https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe"
    Invoke-WebRequest -Uri $url -OutFile $installerPath
    Start-Process -FilePath $installerPath -Wait
}

Write-Host ""
Write-Host "Step 2: Refreshing environment variables..." -ForegroundColor Green
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "Step 3: Installing Node.js v20 LTS..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

# Install Node.js v20 LTS
nvm install 20.11.0

Write-Host ""
Write-Host "Step 4: Setting Node.js v20 as active version..." -ForegroundColor Green
nvm use 20.11.0

Write-Host ""
Write-Host "Step 5: Verifying installation..." -ForegroundColor Green
$nodeVersion = node --version
$npmVersion = npm --version

Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
Write-Host "npm version: $npmVersion" -ForegroundColor Cyan

if ($nodeVersion -like "v20.*") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Node.js v20 LTS is installed" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Navigate to your Apex project:" -ForegroundColor White
    Write-Host "   cd 'C:\Jarvis\AI Workspace\Apex'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Reinstall dependencies:" -ForegroundColor White
    Write-Host "   npm ci" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Start the dev server:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The server should now start successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "WARNING: Node.js version is not v20.x" -ForegroundColor Yellow
    Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try running these commands manually:" -ForegroundColor Yellow
    Write-Host "  nvm install 20.11.0" -ForegroundColor Cyan
    Write-Host "  nvm use 20.11.0" -ForegroundColor Cyan
}

Write-Host ""
Read-Host "Press Enter to exit"
