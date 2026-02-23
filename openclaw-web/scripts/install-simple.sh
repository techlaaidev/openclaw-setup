#!/bin/bash
set -e

# OpenClaw Web Dashboard - Simple Installer
# For Armbian/Debian systems

echo "=========================================="
echo "OpenClaw Web Dashboard Installer"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Configuration
INSTALL_DIR="/opt/openclaw-web"
SERVICE_USER="openclaw"
SERVICE_GROUP="openclaw"

echo "Step 1: Creating service user..."
if ! id "$SERVICE_USER" &>/dev/null; then
  useradd -r -s /bin/bash -d /home/$SERVICE_USER -m $SERVICE_USER
  echo "✓ User $SERVICE_USER created"
else
  echo "✓ User $SERVICE_USER already exists"
fi

echo ""
echo "Step 2: Installing application..."
if [ -d "$INSTALL_DIR" ]; then
  echo "Backing up existing installation..."
  mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Build frontend first (before copying)
echo "Building frontend locally..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm ci 2>/dev/null || npm install
fi
echo "Building React application..."
npm run build
cd ..

# Copy application files
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
cd "$INSTALL_DIR"

# Install backend dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm ci --production 2>/dev/null || npm install --production
else
  echo "✓ Backend dependencies already installed"
fi

# Create necessary directories
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/sessions"
mkdir -p "$INSTALL_DIR/logs"

# Set ownership
chown -R $SERVICE_USER:$SERVICE_GROUP "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
chmod 700 "$INSTALL_DIR/data"
chmod 700 "$INSTALL_DIR/sessions"

echo ""
echo "Step 3: Installing systemd service..."
cp "$INSTALL_DIR/systemd/openclaw-dashboard.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable openclaw-dashboard.service

echo ""
echo "Step 4: Configuring Avahi (mDNS) - Optional..."
if command -v avahi-daemon &> /dev/null; then
  if [ -f "$INSTALL_DIR/config/avahi-openclaw.service" ]; then
    cp "$INSTALL_DIR/config/avahi-openclaw.service" /etc/avahi/services/ 2>/dev/null || true
    systemctl restart avahi-daemon 2>/dev/null || true
    echo "✓ Avahi configured (http://openclaw.local:3000)"
  fi
else
  echo "⚠ Avahi not installed (skipping mDNS setup)"
  echo "  Install with: apt-get install avahi-daemon"
fi

echo ""
echo "Step 5: Configuring firewall..."
if command -v ufw &> /dev/null; then
  ufw --force enable 2>/dev/null || true
  ufw allow from 192.168.0.0/16 to any port 3000 comment 'OpenClaw Web' 2>/dev/null || true
  ufw allow from 10.0.0.0/8 to any port 3000 comment 'OpenClaw Web' 2>/dev/null || true
  ufw allow 22 comment 'SSH' 2>/dev/null || true
  echo "✓ Firewall configured"
else
  echo "⚠ UFW not installed (skipping firewall setup)"
fi

echo ""
echo "Step 6: Starting service..."
systemctl start openclaw-dashboard.service
sleep 3

# Check service status
if systemctl is-active --quiet openclaw-dashboard.service; then
  echo "✓ Service started successfully"
else
  echo "✗ Service failed to start"
  echo ""
  echo "Check logs with: journalctl -u openclaw-dashboard -n 50"
  exit 1
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Dashboard is running at:"
echo "  - http://$(hostname -I | awk '{print $1}'):3000"
if command -v avahi-daemon &> /dev/null; then
  echo "  - http://openclaw.local:3000 (if mDNS works)"
fi
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Useful commands:"
echo "  - Check status: sudo systemctl status openclaw-dashboard"
echo "  - View logs: sudo journalctl -u openclaw-dashboard -f"
echo "  - Restart: sudo systemctl restart openclaw-dashboard"
echo "  - Stop: sudo systemctl stop openclaw-dashboard"
echo ""
echo "IMPORTANT: Change the default password after first login!"
echo ""
