# Fix 500 Error - Action Required

**Date:** 2026-02-23 07:28 UTC
**Issue:** Opening dashboard on wrong port

---

## Problem

Bạn đang truy cập: `http://localhost:5174`
Port 5174 **KHÔNG có Vite proxy config** → API calls fail với 500 error

---

## Solution

### Bước 1: Đóng tất cả tabs dashboard

Đóng tất cả browser tabs đang mở OpenClaw dashboard.

### Bước 2: Truy cập đúng URL

Mở browser và truy cập:

```
http://localhost:5173
```

**QUAN TRỌNG:** Phải là port **5173**, không phải 5174!

### Bước 3: Login

- Username: `admin`
- Password: `admin123`

### Bước 4: Test

Click nút "Start" hoặc "Stop" - should work perfectly!

---

## Why This Happened

Khi bạn start nhiều instance của `npm run dev`, Vite tự động chọn port khác:
- Instance 1: port 5173 ✅ (có proxy config)
- Instance 2: port 5174 ❌ (không có proxy)
- Instance 3: port 5175 ❌ (không có proxy)

Chỉ có port **5173** mới có proxy config trong `vite.config.js`:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

---

## Current Status

✅ Backend running on port 3000
✅ Frontend running on port 5173 (with proxy)
✅ All systems operational

---

## Quick Check

```bash
# Backend
curl http://localhost:3000/api/process/status
→ Should return JSON (may need auth)

# Frontend proxy
curl http://localhost:5173/api/process/status
→ Should return JSON (proxied to backend)

# Wrong port (no proxy)
curl http://localhost:5174/api/process/status
→ 404 Not Found ❌
```

---

## Action Required

**Truy cập:** http://localhost:5173 (không phải 5174!)

Tất cả sẽ hoạt động bình thường! ✅
