#!/bin/bash
# Quick diagnostic script - Run on Armbian

echo "=========================================="
echo "HTTP/HTTPS Diagnostic"
echo "=========================================="
echo ""

echo "1. Testing HTTP response headers:"
curl -I http://localhost:3000 2>&1 | head -20

echo ""
echo "2. Testing if HTTPS is configured:"
curl -I https://localhost:3000 2>&1 | head -5

echo ""
echo "3. Checking server logs for HTTPS references:"
journalctl -u openclaw-dashboard -n 50 --no-pager | grep -i "https\|ssl\|tls" || echo "No HTTPS/SSL/TLS references found"

echo ""
echo "4. Checking environment variables:"
systemctl show openclaw-dashboard | grep Environment

echo ""
echo "5. Checking if port 443 is in use:"
lsof -i :443 || echo "Port 443 not in use"

echo ""
echo "6. Checking frontend dist files:"
ls -lh /opt/openclaw-web/frontend/dist/ | head -10

echo ""
echo "7. Checking index.html for HTTPS references:"
grep -i "https" /opt/openclaw-web/frontend/dist/index.html || echo "No HTTPS references in index.html"

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
