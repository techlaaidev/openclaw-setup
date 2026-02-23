# Quick Fix: Frontend Build Issue

## Problem

After installation, accessing the dashboard shows:
```json
{
  "error": "Not found",
  "message": "ENOENT: no such file or directory, stat '/opt/openclaw-web/frontend/dist/index.html'"
}
```

## Cause

The frontend React application wasn't built during installation. The installer script has been updated to fix this for future installations.

## Solution for Existing Installations

### Option 1: Use the Update Script (Recommended)

```bash
# On your Armbian device
cd /opt/openclaw-web
sudo ./scripts/update-frontend.sh
```

This will:
- Install frontend dependencies
- Build the React application
- Restart the service
- Verify it's working

### Option 2: Manual Build

```bash
# On your Armbian device
cd /opt/openclaw-web/frontend

# Install dependencies
sudo npm install

# Build the frontend
sudo npm run build

# Set correct ownership
sudo chown -R openclaw:openclaw /opt/openclaw-web/frontend

# Restart the service
sudo systemctl restart openclaw-dashboard

# Check status
sudo systemctl status openclaw-dashboard
```

### Option 3: Reinstall with Updated Script

```bash
# Stop the service
sudo systemctl stop openclaw-dashboard

# Remove old installation
sudo rm -rf /opt/openclaw-web

# Get updated installer
cd /path/to/openclaw-web
git pull

# Run updated installer
sudo ./scripts/install-simple.sh
```

## Verification

After applying the fix, verify the dashboard is accessible:

```bash
# Check service status
sudo systemctl status openclaw-dashboard

# Check if dist folder exists
ls -la /opt/openclaw-web/frontend/dist/

# Access the dashboard
curl http://localhost:3000
```

You should see HTML content instead of an error.

## For New Installations

The updated `install-simple.sh` script now includes frontend build step automatically. No manual intervention needed.

## Troubleshooting

### Build fails with memory error

If npm build fails due to low memory on Armbian:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=512"
cd /opt/openclaw-web/frontend
sudo -E npm run build
```

### Permission errors

```bash
# Fix ownership
sudo chown -R openclaw:openclaw /opt/openclaw-web
```

### Service won't start

```bash
# Check logs
sudo journalctl -u openclaw-dashboard -n 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Kill conflicting process
sudo lsof -ti:3000 | xargs sudo kill -9

# Restart service
sudo systemctl restart openclaw-dashboard
```

## Prevention

Always use the latest installer script which includes the frontend build step:

```bash
sudo ./scripts/install-simple.sh
```

The script now:
1. Builds frontend locally before copying
2. Installs backend dependencies
3. Sets correct permissions
4. Starts the service

---

**Last Updated:** 2026-02-23
