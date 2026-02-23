# Fix Vite Network Access on Armbian VPS

**Issue:** Cannot access http://192.168.1.18:5173 from external machine
**Cause:** Vite dev server only binds to localhost by default

---

## Solution

### Option 1: Use Production Build (Recommended for VPS)

Trên VPS, không nên dùng dev server. Hãy dùng production build:

```bash
# Stop dev servers
pkill -f "node.*server.js"
pkill -f vite

# Build frontend for production
cd /root/openclaw-setup/openclaw-web/frontend
npm run build

# Start backend only (serves built frontend)
cd /root/openclaw-setup/openclaw-web
npm run dev
```

**Truy cập:** http://192.168.1.18:3000 (backend serves frontend)

---

### Option 2: Expose Vite Dev Server (Development Only)

Nếu muốn dùng dev mode, expose Vite:

**Update vite.config.js:**

```javascript
// frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // <-- Add this line
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

**Restart:**
```bash
pkill -f vite
cd /root/openclaw-setup/openclaw-web
npm run dev:frontend
```

**Truy cập:** http://192.168.1.18:5173

---

### Option 3: Use Systemd Service (Production)

Đây là cách đúng cho VPS:

```bash
# Build frontend
cd /root/openclaw-setup/openclaw-web/frontend
npm run build

# Use systemd service
sudo systemctl restart openclaw-dashboard

# Check status
sudo systemctl status openclaw-dashboard
```

**Truy cập:** http://192.168.1.18:3000

---

## Recommended Setup for VPS

**Development (local machine):**
- Backend: http://localhost:3000
- Frontend dev: http://localhost:5173

**Production (VPS/Armbian):**
- Backend serves built frontend: http://192.168.1.18:3000
- No separate frontend dev server needed

---

## Current Situation

Bạn đang chạy:
- ✅ Backend on port 3000 (accessible)
- ❌ Frontend dev on port 5173 (localhost only)

**Giải pháp nhanh:**

```bash
# Stop all
pkill -f "node.*server.js"
pkill -f vite

# Build frontend
cd /root/openclaw-setup/openclaw-web/frontend
npm run build

# Start backend (serves built frontend)
cd /root/openclaw-setup/openclaw-web
npm run dev
```

**Truy cập:** http://192.168.1.18:3000 ✅

---

## Why Port 3000 Works But 5173 Doesn't

**Port 3000 (Backend):**
```javascript
app.listen(3000, '0.0.0.0') // Binds to all interfaces
```

**Port 5173 (Vite):**
```javascript
server: { port: 5173 } // Default: localhost only
```

**Fix:** Add `host: '0.0.0.0'` to Vite config OR use production build.

---

**Khuyến nghị:** Dùng production build trên VPS, không nên dùng dev server!
