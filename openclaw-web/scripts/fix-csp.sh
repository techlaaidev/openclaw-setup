#!/bin/bash
# Quick fix for upgrade-insecure-requests issue

echo "=========================================="
echo "Fixing upgrade-insecure-requests CSP"
echo "=========================================="
echo ""

cd /root/openclaw-setup/openclaw-web

echo "Step 1: Pulling latest fix..."
git pull

echo ""
echo "Step 2: Copying fixed security.js..."
cp src/middleware/security.js /opt/openclaw-web/src/middleware/security.js

echo ""
echo "Step 3: Restarting service..."
systemctl restart openclaw-dashboard
sleep 2

echo ""
echo "Step 4: Verifying..."
if systemctl is-active --quiet openclaw-dashboard; then
  echo "✓ Service restarted successfully"
else
  echo "✗ Service failed to restart"
  journalctl -u openclaw-dashboard -n 20 --no-pager
  exit 1
fi

echo ""
echo "Step 5: Testing HTTP headers..."
sleep 1
curl -I http://localhost:3000 2>&1 | grep -i "upgrade-insecure" && echo "⚠ Still has upgrade-insecure-requests" || echo "✓ upgrade-insecure-requests removed"

echo ""
echo "=========================================="
echo "Fix Applied!"
echo "=========================================="
echo ""
echo "Now clear your browser cache and try again:"
echo "1. Press Ctrl+Shift+Delete"
echo "2. Clear cached images and files"
echo "3. Access: http://192.168.1.18:3000"
echo ""
