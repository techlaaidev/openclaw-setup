# Installation Scripts

This directory contains scripts for installing and managing OpenClaw Web Dashboard on Armbian/Debian systems.

## Scripts Overview

### `install-simple.sh` (Recommended)

**Purpose:** Production installation with graceful dependency handling

**Features:**
- Creates system user (`openclaw`)
- Builds frontend React application
- Installs backend dependencies
- Configures systemd service
- Optional Avahi mDNS setup
- Optional UFW firewall configuration
- Gracefully handles missing optional dependencies

**Usage:**
```bash
cd openclaw-web
sudo ./scripts/install-simple.sh
```

**Requirements:**
- Root/sudo access
- Node.js 20+ and npm
- At least 512MB RAM for frontend build

---

### `update-frontend.sh`

**Purpose:** Rebuild frontend on existing installation

**Use when:**
- Frontend dist files are missing
- After updating frontend code
- Fixing "ENOENT: frontend/dist/index.html" error

**Usage:**
```bash
sudo /opt/openclaw-web/scripts/update-frontend.sh
```

**What it does:**
1. Installs frontend dependencies (if needed)
2. Builds React application
3. Sets correct ownership
4. Restarts the service

---

### `install.sh` (Legacy)

**Purpose:** Full installation with all dependencies

**Note:** This script installs Node.js and all system dependencies. Use `install-simple.sh` if you already have Node.js installed.

---

## Quick Start

### New Installation

```bash
# Clone the repository
git clone <repo-url>
cd openclaw-web

# Run installer
sudo ./scripts/install-simple.sh
```

### Fix Frontend Issues

If you see frontend errors after installation:

```bash
sudo /opt/openclaw-web/scripts/update-frontend.sh
```

### Verify Installation

```bash
# Check service status
sudo systemctl status openclaw-dashboard

# Check if frontend is built
ls -la /opt/openclaw-web/frontend/dist/

# Access dashboard
curl http://localhost:3000
```

## Troubleshooting

### Script Permission Denied

```bash
chmod +x scripts/*.sh
```

### Build Fails (Low Memory)

```bash
export NODE_OPTIONS="--max-old-space-size=512"
sudo -E ./scripts/install-simple.sh
```

### Port 3000 Already in Use

```bash
sudo lsof -ti:3000 | xargs sudo kill -9
sudo systemctl restart openclaw-dashboard
```

## Documentation

- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Full deployment guide
- [QUICK-FIX-FRONTEND.md](../docs/QUICK-FIX-FRONTEND.md) - Frontend build fixes
- [README.md](../README.md) - Project overview

---

**Last Updated:** 2026-02-23
