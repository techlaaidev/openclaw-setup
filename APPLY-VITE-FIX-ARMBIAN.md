# Apply Vite Network Fix on Armbian VPS

**Date:** 2026-02-23 08:31 UTC
**Status:** Ready to Apply

---

## Quick Commands for Armbian

Copy và paste vào terminal Armbian:

```bash
# Stop all running processes
pkill -f "node.*server.js"
pkill -f vite
sleep 2

# Pull latest changes (includes Vite network fix)
cd /root/openclaw-setup/openclaw-web
git pull

# Restart both servers
npm run dev &
npm run dev:frontend &

# Wait for servers to start
sleep 5

# Check if running
echo "=== Backend Status ==="
lsof -ti:3000 && echo "✓ Backend running on 3000" || echo "✗ Backend not running"

echo "=== Frontend Status ==="
lsof -ti:5173 && echo "✓ Frontend running on 5173" || echo "✗ Frontend not running"
```

---

## After Running Commands

**Truy cập từ máy tính của bạn:**
- Frontend dev: http://192.168.1.18:5173 ✅
- Backend: http://192.168.1.18:3000 ✅

**Login:**
- Username: `admin`
- Password: `admin123`

---

## Alternative: Production Mode (Recommended)

Nếu muốn dùng production mode (ổn định hơn):

```bash
# Stop all
pkill -f "node.*server.js"
pkill -f vite

# Build frontend
cd /root/openclaw-setup/openclaw-web/frontend
npm run build

# Start backend only (serves built frontend)
cd /root/openclaw-setup/openclaw-web
npm run dev
```

**Truy cập:** http://192.168.1.18:3000 (backend serves frontend)

---

## Or Use Systemd Service (Best for Production)

```bash
# Build frontend
cd /root/openclaw-setup/openclaw-web/frontend
npm run build

# Use systemd
sudo systemctl restart openclaw-dashboard

# Check status
sudo systemctl status openclaw-dashboard
```

**Truy cập:** http://192.168.1.18:3000

---

## What Changed

**Before:**
```javascript
server: {
  port: 5173,
  // No host specified = localhost only
}
```

**After:**
```javascript
server: {
  port: 5173,
  host: '0.0.0.0', // Expose to network
}
```

---

## Verify Fix

Sau khi restart, check:

```bash
# Check Vite is listening on all interfaces
netstat -tlnp | grep 5173
# Should show: 0.0.0.0:5173 (not 127.0.0.1:5173)

# Test from Armbian
curl http://localhost:5173

# Test from your computer
# Open browser: http://192.168.1.18:5173
```

---

**Khuyến nghị:**
- **Development:** Dùng dev servers (port 5173)
- **Production:** Dùng systemd service (port 3000)

**Chọn cách nào phù hợp với bạn!** ✅
