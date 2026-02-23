# OpenClaw Web Dashboard - Deployment Guide

## Overview

This guide covers deploying OpenClaw Web Dashboard on Armbian/Debian-based systems with systemd integration, auto-start on boot, and mDNS support.

## Prerequisites

- Armbian or Debian-based Linux system
- Root/sudo access
- Network connectivity
- At least 512MB RAM
- 1GB free disk space

## Quick Installation

### One-Line Install

```bash
cd openclaw-web && sudo ./scripts/install.sh
```

This will:
- Install Node.js 20
- Create `openclaw` system user
- Install application to `/opt/openclaw-web`
- Configure systemd service
- Set up Avahi mDNS
- Configure firewall (UFW)
- Start the dashboard

## Manual Installation

### 1. Install Dependencies

```bash
sudo apt-get update
sudo apt-get install -y curl git avahi-daemon ufw nodejs npm
```

### 2. Create Service User

```bash
sudo useradd -r -s /bin/bash -d /home/openclaw -m openclaw
```

### 3. Install Application

```bash
sudo mkdir -p /opt/openclaw-web
sudo cp -r . /opt/openclaw-web/
cd /opt/openclaw-web
sudo npm ci --production
```

### 4. Create Directories

```bash
sudo mkdir -p /opt/openclaw-web/{data,sessions,logs}
sudo chown -R openclaw:openclaw /opt/openclaw-web
sudo chmod 700 /opt/openclaw-web/{data,sessions}
```

### 5. Install Systemd Service

```bash
sudo cp systemd/openclaw-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable openclaw-dashboard
sudo systemctl start openclaw-dashboard
```

### 6. Configure Avahi (mDNS)

```bash
sudo cp config/avahi-openclaw.service /etc/avahi/services/
sudo systemctl restart avahi-daemon
```

### 7. Configure Firewall

```bash
sudo ufw enable
sudo ufw allow from 192.168.0.0/16 to any port 3000
sudo ufw allow 22
```

## Configuration

### Environment Variables

Edit `/etc/systemd/system/openclaw-dashboard.service`:

```ini
Environment="PORT=3000"
Environment="OPENCLAW_PATH=/home/openclaw/.openclaw"
Environment="NODE_ENV=production"
```

After changes:
```bash
sudo systemctl daemon-reload
sudo systemctl restart openclaw-dashboard
```

### Network Access

**Local Access:**
- http://localhost:3000
- http://[IP_ADDRESS]:3000

**mDNS Access:**
- http://openclaw.local:3000

**Static IP (Optional):**
```bash
# Using nmcli
sudo nmcli connection modify "Wired connection 1" \
  ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns "8.8.8.8" \
  ipv4.method manual
sudo nmcli connection up "Wired connection 1"
```

## Service Management

### Check Status
```bash
sudo systemctl status openclaw-dashboard
```

### View Logs
```bash
# Real-time logs
sudo journalctl -u openclaw-dashboard -f

# Last 100 lines
sudo journalctl -u openclaw-dashboard -n 100

# Today's logs
sudo journalctl -u openclaw-dashboard --since today
```

### Start/Stop/Restart
```bash
sudo systemctl start openclaw-dashboard
sudo systemctl stop openclaw-dashboard
sudo systemctl restart openclaw-dashboard
```

### Enable/Disable Auto-Start
```bash
sudo systemctl enable openclaw-dashboard
sudo systemctl disable openclaw-dashboard
```

## Security

### Change Default Password

**IMPORTANT:** Change the default admin password immediately after first login.

1. Login with `admin` / `admin123`
2. Go to Settings → Change Password
3. Use a strong password (min 8 characters)

### Firewall Rules

The installer configures UFW to allow:
- Port 3000 from local networks (192.168.0.0/16, 10.0.0.0/8)
- Port 22 (SSH) from anywhere

**Restrict SSH to local network:**
```bash
sudo ufw delete allow 22
sudo ufw allow from 192.168.0.0/16 to any port 22
```

### File Permissions

```bash
# Config files (owner read/write only)
sudo chmod 600 /opt/openclaw-web/data/*.db
sudo chmod 600 /home/openclaw/.openclaw/.env

# Application directory
sudo chown -R openclaw:openclaw /opt/openclaw-web
sudo chmod 755 /opt/openclaw-web
```

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u openclaw-dashboard -n 50
```

**Common issues:**
- Port 3000 already in use: `sudo lsof -i :3000`
- Missing dependencies: `cd /opt/openclaw-web && npm install`
- Permission errors: `sudo chown -R openclaw:openclaw /opt/openclaw-web`

### Can't Access Dashboard

**Check if service is running:**
```bash
sudo systemctl status openclaw-dashboard
curl http://localhost:3000/api/system/health
```

**Check firewall:**
```bash
sudo ufw status
sudo ufw allow from 192.168.0.0/16 to any port 3000
```

**Check network:**
```bash
ip addr show
ping openclaw.local
```

### mDNS Not Working

**Check Avahi:**
```bash
sudo systemctl status avahi-daemon
sudo systemctl restart avahi-daemon
```

**Test mDNS:**
```bash
avahi-browse -a
```

**Install Avahi if missing:**
```bash
sudo apt-get install avahi-daemon avahi-utils
```

### Database Errors

**Reset database:**
```bash
sudo systemctl stop openclaw-dashboard
sudo rm /opt/openclaw-web/data/openclaw-web.db
sudo systemctl start openclaw-dashboard
```

**Note:** This will reset all users and settings.

### High Memory Usage

**Check process:**
```bash
ps aux | grep node
top -p $(pgrep -f openclaw-dashboard)
```

**Restart service:**
```bash
sudo systemctl restart openclaw-dashboard
```

## Backup & Restore

### Backup

```bash
#!/bin/bash
BACKUP_DIR="/home/openclaw/backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
sudo tar -czf "$BACKUP_DIR/openclaw-web-$DATE.tar.gz" \
  /opt/openclaw-web/data \
  /opt/openclaw-web/sessions \
  /home/openclaw/.openclaw
```

### Restore

```bash
sudo systemctl stop openclaw-dashboard
sudo tar -xzf /path/to/backup.tar.gz -C /
sudo chown -R openclaw:openclaw /opt/openclaw-web
sudo systemctl start openclaw-dashboard
```

## Updating

### Update Application

```bash
cd /path/to/new/version
sudo systemctl stop openclaw-dashboard
sudo cp -r . /opt/openclaw-web/
cd /opt/openclaw-web
sudo npm ci --production
sudo chown -R openclaw:openclaw /opt/openclaw-web
sudo systemctl start openclaw-dashboard
```

### Update Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
sudo systemctl restart openclaw-dashboard
```

## Uninstallation

```bash
# Stop and disable service
sudo systemctl stop openclaw-dashboard
sudo systemctl disable openclaw-dashboard

# Remove service file
sudo rm /etc/systemd/system/openclaw-dashboard.service
sudo systemctl daemon-reload

# Remove Avahi service
sudo rm /etc/avahi/services/avahi-openclaw.service
sudo systemctl restart avahi-daemon

# Remove application
sudo rm -rf /opt/openclaw-web

# Remove user (optional)
sudo userdel -r openclaw

# Remove firewall rules
sudo ufw delete allow from 192.168.0.0/16 to any port 3000
```

## Performance Tuning

### Node.js Memory Limit

Edit service file:
```ini
Environment="NODE_OPTIONS=--max-old-space-size=512"
```

### Log Rotation

Create `/etc/logrotate.d/openclaw-web`:
```
/opt/openclaw-web/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 openclaw openclaw
    postrotate
        systemctl reload openclaw-dashboard > /dev/null 2>&1 || true
    endscript
}
```

## Support

- GitHub Issues: https://github.com/yourusername/openclaw-web/issues
- Documentation: https://github.com/yourusername/openclaw-web/wiki
- OpenClaw: https://github.com/ValueCell-ai/ClawX
