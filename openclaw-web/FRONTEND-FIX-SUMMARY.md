# Frontend Build Fix - Summary

## What Was Fixed

The installation script (`install-simple.sh`) was missing the frontend build step, causing the error:
```
ENOENT: no such file or directory, stat '/opt/openclaw-web/frontend/dist/index.html'
```

## Changes Made

### 1. Updated `scripts/install-simple.sh`
- Added frontend build step before copying files
- Installs frontend dependencies
- Runs `npm run build` to create production build
- Now builds frontend automatically during installation

### 2. Created `scripts/update-frontend.sh`
- Quick fix script for existing installations
- Rebuilds frontend without full reinstall
- Restarts service automatically

### 3. Updated Documentation
- `docs/QUICK-FIX-FRONTEND.md` - Detailed fix guide
- `docs/DEPLOYMENT.md` - Updated with frontend build info
- `scripts/README.md` - Scripts usage guide
- `README.md` - Added troubleshooting section

## How to Fix Your Armbian Device

You have **3 options**:

### Option 1: Use Update Script (Fastest) ⚡

```bash
# SSH into your Armbian device
ssh user@192.168.1.18

# Run the update script
sudo /opt/openclaw-web/scripts/update-frontend.sh
```

This will:
- Build the frontend
- Restart the service
- Verify it's working

**Time:** ~2-3 minutes

---

### Option 2: Manual Build

```bash
# SSH into your Armbian device
ssh user@192.168.1.18

# Build frontend
cd /opt/openclaw-web/frontend
sudo npm install
sudo npm run build

# Fix permissions
sudo chown -R openclaw:openclaw /opt/openclaw-web/frontend

# Restart service
sudo systemctl restart openclaw-dashboard

# Verify
curl http://localhost:3000
```

**Time:** ~3-5 minutes

---

### Option 3: Reinstall with Updated Script

```bash
# On your Mac, push the updated code
cd /Users/hnam/Desktop/openclaw-setup/openclaw-web
git add .
git commit -m "fix: add frontend build to installer"
git push

# SSH into Armbian
ssh user@192.168.1.18

# Pull updates
cd /path/to/openclaw-web
git pull

# Stop service
sudo systemctl stop openclaw-dashboard

# Remove old installation
sudo rm -rf /opt/openclaw-web

# Reinstall
sudo ./scripts/install-simple.sh
```

**Time:** ~5-10 minutes

---

## Recommended Approach

**Use Option 1** (update script) - it's the fastest and safest.

## Verification

After applying the fix:

```bash
# Check if dist folder exists
ls -la /opt/openclaw-web/frontend/dist/

# Should see files like:
# index.html
# assets/
# vite.svg

# Check service status
sudo systemctl status openclaw-dashboard

# Test access
curl http://192.168.1.18:3000
```

You should see HTML content instead of an error.

## Next Steps

1. Apply the fix using Option 1
2. Access dashboard at http://192.168.1.18:3000
3. Login with admin/admin123
4. Change the default password
5. Configure OpenClaw (providers, channels, skills)

## Files Changed

```
openclaw-web/
├── scripts/
│   ├── install-simple.sh          # Updated: added frontend build
│   ├── update-frontend.sh         # New: quick fix script
│   └── README.md                  # New: scripts guide
├── docs/
│   ├── QUICK-FIX-FRONTEND.md      # New: detailed fix guide
│   └── DEPLOYMENT.md              # Updated: added frontend info
└── README.md                      # Updated: added troubleshooting
```

## Prevention

For future installations, the updated `install-simple.sh` script now:
1. Builds frontend locally before copying
2. Installs backend dependencies
3. Sets correct permissions
4. Starts the service

No manual intervention needed.

---

**Created:** 2026-02-23 06:16 UTC
**Status:** Ready to apply
**Estimated Time:** 2-3 minutes (Option 1)
