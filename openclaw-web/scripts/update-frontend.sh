#!/bin/bash
set -e

# OpenClaw Web Dashboard - Frontend Update Script
# Use this to rebuild frontend on existing installation

echo "=========================================="
echo "OpenClaw Web - Frontend Update"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

INSTALL_DIR="/opt/openclaw-web"

# Check if installation exists
if [ ! -d "$INSTALL_DIR" ]; then
  echo "✗ OpenClaw Web not found at $INSTALL_DIR"
  echo "Please run the full installer first."
  exit 1
fi

echo "Step 1: Building frontend..."
cd "$INSTALL_DIR/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm ci 2>/dev/null || npm install
fi

# Build
echo "Building React application..."
npm run build

# Set ownership
chown -R openclaw:openclaw "$INSTALL_DIR/frontend"

echo ""
echo "Step 2: Restarting service..."
systemctl restart openclaw-dashboard.service
sleep 2

# Check service status
if systemctl is-active --quiet openclaw-dashboard.service; then
  echo "✓ Service restarted successfully"
else
  echo "✗ Service failed to restart"
  echo ""
  echo "Check logs with: journalctl -u openclaw-dashboard -n 50"
  exit 1
fi

echo ""
echo "=========================================="
echo "Frontend Update Complete!"
echo "=========================================="
echo ""
echo "Dashboard is running at:"
echo "  - http://$(hostname -I | awk '{print $1}'):3000"
echo ""
