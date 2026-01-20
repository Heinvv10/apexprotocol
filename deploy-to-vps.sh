#!/bin/bash

# ================================
# Apex VPS Deployment Script
# Target: 72.61.197.178
# ================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="72.61.197.178"
VPS_USER="${VPS_USER:-root}"  # Default to root, override with env var
APP_DIR="/opt/apex"
BACKUP_DIR="/opt/apex-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Apex VPS Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v ssh &> /dev/null; then
    print_error "SSH not found. Please install OpenSSH."
    exit 1
fi

if ! command -v rsync &> /dev/null; then
    print_warning "rsync not found. Will use scp for file transfer (slower)."
    USE_RSYNC=false
else
    USE_RSYNC=true
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production not found!"
    print_status "Creating .env.production from .env.example..."
    cp .env.example .env.production
    print_warning "Please edit .env.production with production values before continuing."
    exit 1
fi

print_success "Prerequisites check passed"

# Test SSH connection
print_status "Testing SSH connection to ${VPS_USER}@${VPS_IP}..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${VPS_USER}@${VPS_IP} exit 2>/dev/null; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to ${VPS_USER}@${VPS_IP}"
    print_status "Please ensure:"
    echo "  1. SSH key is added to VPS (~/.ssh/authorized_keys)"
    echo "  2. VPS is accessible from your network"
    echo "  3. SSH service is running on VPS"
    exit 1
fi

# Build locally first (optional, can be commented out to build on VPS)
print_status "Building application locally for verification..."
if npm run build; then
    print_success "Local build successful"
else
    print_error "Local build failed. Fix errors before deploying."
    exit 1
fi

# Create backup on VPS
print_status "Creating backup on VPS..."
ssh ${VPS_USER}@${VPS_IP} "mkdir -p ${BACKUP_DIR} && \
    if [ -d ${APP_DIR} ]; then \
        tar -czf ${BACKUP_DIR}/apex-backup-${TIMESTAMP}.tar.gz -C ${APP_DIR} . 2>/dev/null || true; \
        echo 'Backup created: ${BACKUP_DIR}/apex-backup-${TIMESTAMP}.tar.gz'; \
    else \
        echo 'No existing deployment to backup'; \
    fi"

# Prepare VPS directories
print_status "Preparing VPS directories..."
ssh ${VPS_USER}@${VPS_IP} "mkdir -p ${APP_DIR} && \
    mkdir -p ${APP_DIR}/nginx/ssl && \
    mkdir -p ${APP_DIR}/nginx/logs"

print_success "VPS directories ready"

# Transfer files to VPS
print_status "Transferring files to VPS..."

if [ "$USE_RSYNC" = true ]; then
    # Using rsync (faster, only transfers changed files)
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude '.claude' \
        --exclude '.worktrees' \
        --exclude 'e2e' \
        --exclude 'tests' \
        --exclude '.env.local' \
        --exclude 'build_output.txt' \
        ./ ${VPS_USER}@${VPS_IP}:${APP_DIR}/
else
    # Using tar + scp (fallback)
    print_status "Creating deployment tarball..."
    tar -czf apex-deploy-${TIMESTAMP}.tar.gz \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='.claude' \
        --exclude='.worktrees' \
        --exclude='e2e' \
        --exclude='tests' \
        --exclude='.env.local' \
        .

    print_status "Uploading tarball..."
    scp apex-deploy-${TIMESTAMP}.tar.gz ${VPS_USER}@${VPS_IP}:${APP_DIR}/

    print_status "Extracting on VPS..."
    ssh ${VPS_USER}@${VPS_IP} "cd ${APP_DIR} && tar -xzf apex-deploy-${TIMESTAMP}.tar.gz && rm apex-deploy-${TIMESTAMP}.tar.gz"

    rm apex-deploy-${TIMESTAMP}.tar.gz
fi

print_success "Files transferred"

# Transfer production environment file
print_status "Transferring production environment..."
scp .env.production ${VPS_USER}@${VPS_IP}:${APP_DIR}/.env
print_success "Environment file transferred"

# Install Docker and Docker Compose on VPS (if needed)
print_status "Checking Docker installation on VPS..."
ssh ${VPS_USER}@${VPS_IP} "command -v docker >/dev/null 2>&1 || { \
    echo 'Installing Docker...'; \
    curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh; \
}"

ssh ${VPS_USER}@${VPS_IP} "command -v docker-compose >/dev/null 2>&1 || { \
    echo 'Installing Docker Compose...'; \
    curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose; \
}"

print_success "Docker ready"

# Deploy on VPS
print_status "Deploying application on VPS..."
ssh ${VPS_USER}@${VPS_IP} "cd ${APP_DIR} && \
    # Stop existing containers
    docker-compose down 2>/dev/null || true && \

    # Remove old images (optional - uncomment to force rebuild)
    # docker-compose rm -f 2>/dev/null || true && \
    # docker rmi \$(docker images -q apex-app 2>/dev/null) 2>/dev/null || true && \

    # Build and start containers
    docker-compose up -d --build && \

    # Show logs
    echo '' && \
    echo 'Deployment complete! Container status:' && \
    docker-compose ps"

print_success "Application deployed"

# Wait for health check
print_status "Waiting for application to be healthy..."
sleep 10

# Check health endpoint
print_status "Checking application health..."
if ssh ${VPS_USER}@${VPS_IP} "curl -f http://localhost:3000/api/health >/dev/null 2>&1"; then
    print_success "Application is healthy!"
else
    print_warning "Health check endpoint not responding (this might be normal if still starting)"
fi

# Show logs
print_status "Recent application logs:"
ssh ${VPS_USER}@${VPS_IP} "cd ${APP_DIR} && docker-compose logs --tail=20 app"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Application URL: ${BLUE}http://${VPS_IP}${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        ssh ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && docker-compose logs -f app'"
echo "  Restart app:      ssh ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && docker-compose restart app'"
echo "  Stop app:         ssh ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && docker-compose down'"
echo "  View status:      ssh ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && docker-compose ps'"
echo "  Shell access:     ssh ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && docker-compose exec app sh'"
echo ""
echo "Backup location on VPS: ${BACKUP_DIR}/apex-backup-${TIMESTAMP}.tar.gz"
echo ""
