#!/bin/bash
# Auto Debug & Fix Script for OpenClaw Web
# Run this on Armbian device

set -e

echo "=========================================="
echo "OpenClaw Web - Auto Debug & Fix"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/openclaw-web"
SOURCE_DIR="/root/openclaw-setup/openclaw-web"

echo "Step 1: Checking current status..."
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}✗ Source directory not found: $SOURCE_DIR${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Source directory found${NC}"

# Check if installation directory exists
if [ ! -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}⚠ Installation directory not found: $INSTALL_DIR${NC}"
  echo "Will create during installation..."
else
  echo -e "${GREEN}✓ Installation directory found${NC}"
fi

# Check service status
echo ""
echo "Step 2: Checking service status..."
if systemctl is-active --quiet openclaw-dashboard 2>/dev/null; then
  echo -e "${GREEN}✓ Service is running${NC}"
  echo "Stopping service..."
  systemctl stop openclaw-dashboard
else
  echo -e "${YELLOW}⚠ Service is not running${NC}"
fi

# Check port 3000
echo ""
echo "Step 3: Checking port 3000..."
if lsof -i :3000 >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠ Port 3000 is in use${NC}"
  echo "Killing processes on port 3000..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 2
  echo -e "${GREEN}✓ Port 3000 cleared${NC}"
else
  echo -e "${GREEN}✓ Port 3000 is available${NC}"
fi

# Pull latest changes
echo ""
echo "Step 4: Pulling latest changes..."
cd "$SOURCE_DIR"
git pull
echo -e "${GREEN}✓ Latest changes pulled${NC}"

# Build frontend in source directory
echo ""
echo "Step 5: Building frontend..."
cd "$SOURCE_DIR/frontend"

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
else
  echo "Frontend dependencies already installed"
fi

# Build frontend
echo "Building React application..."
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}✗ Frontend build failed - dist directory not created${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Copy to installation directory
echo ""
echo "Step 6: Installing to $INSTALL_DIR..."

# Backup existing installation
if [ -d "$INSTALL_DIR" ]; then
  echo "Backing up existing installation..."
  mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy all files
echo "Copying files..."
cp -r "$SOURCE_DIR"/* "$INSTALL_DIR"/

# Install backend dependencies
echo ""
echo "Step 7: Installing backend dependencies..."
cd "$INSTALL_DIR"
npm ci --production 2>/dev/null || npm install --production

# Create necessary directories
echo ""
echo "Step 8: Creating directories..."
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/sessions"
mkdir -p "$INSTALL_DIR/logs"

# Set ownership
echo "Setting permissions..."
chown -R openclaw:openclaw "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
chmod 700 "$INSTALL_DIR/data"
chmod 700 "$INSTALL_DIR/sessions"

echo -e "${GREEN}✓ Installation complete${NC}"

# Install systemd service
echo ""
echo "Step 9: Installing systemd service..."
cp "$INSTALL_DIR/systemd/openclaw-dashboard.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable openclaw-dashboard.service

# Start service
echo ""
echo "Step 10: Starting service..."
systemctl start openclaw-dashboard.service
sleep 3

# Check service status
if systemctl is-active --quiet openclaw-dashboard.service; then
  echo -e "${GREEN}✓ Service started successfully${NC}"
else
  echo -e "${RED}✗ Service failed to start${NC}"
  echo ""
  echo "Checking logs..."
  journalctl -u openclaw-dashboard -n 30 --no-pager
  exit 1
fi

# Verify frontend
echo ""
echo "Step 11: Verifying installation..."

# Check dist directory
if [ -d "$INSTALL_DIR/frontend/dist" ]; then
  echo -e "${GREEN}✓ Frontend dist directory exists${NC}"
  ls -lh "$INSTALL_DIR/frontend/dist/" | head -5
else
  echo -e "${RED}✗ Frontend dist directory missing${NC}"
  exit 1
fi

# Test HTTP access
echo ""
echo "Testing HTTP access..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP access working (Status: $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "302" ]; then
  echo -e "${GREEN}✓ HTTP access working (Redirect: $HTTP_CODE)${NC}"
else
  echo -e "${YELLOW}⚠ HTTP returned status: $HTTP_CODE${NC}"
  echo "Checking service logs..."
  journalctl -u openclaw-dashboard -n 20 --no-pager
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Dashboard is running at:"
echo "  - http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Useful commands:"
echo "  - Check status: systemctl status openclaw-dashboard"
echo "  - View logs: journalctl -u openclaw-dashboard -f"
echo "  - Restart: systemctl restart openclaw-dashboard"
echo ""
