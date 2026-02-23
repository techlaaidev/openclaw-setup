# Hướng Dẫn Restart Backend - QUAN TRỌNG

**Thời gian:** 2026-02-23 08:08 UTC
**Vấn đề:** Backend đang chạy code cũ, chưa có fix mới

---

## Tại Sao Cần Restart?

Backend server đang chạy code cũ với `pgrep`, chưa có code mới với `lsof`.

**Code cũ (đang chạy):**
```javascript
pgrep -f "openclaw.gateway|openclaw gateway"
```

**Code mới (đã commit):**
```javascript
lsof -i :18789 | grep LISTEN
```

---

## Cách Restart Backend

### Cách 1: Restart Trong VSCode Terminal (Khuyến nghị)

1. Tìm terminal đang chạy backend (có dòng "OpenClaw Web running on...")
2. Click vào terminal đó
3. Press **Ctrl+C** để stop
4. Chạy lại: `npm run dev`
5. Đợi thấy "OpenClaw Web running on http://0.0.0.0:3000"

### Cách 2: Kill Process và Start Lại

```bash
# Tìm process đang chạy trên port 3000
lsof -ti:3000

# Kill nó (thay PID bằng số thực tế)
kill <PID>

# Start lại
cd /Users/hnam/Desktop/openclaw-setup/openclaw-web
npm run dev
```

### Cách 3: Dùng pkill (Nếu không tìm thấy terminal)

```bash
# Kill tất cả node server.js
pkill -f "node.*server.js"

# Đợi 2 giây
sleep 2

# Start lại
cd /Users/hnam/Desktop/openclaw-setup/openclaw-web
npm run dev
```

---

## Sau Khi Restart

1. **Đợi backend start:** Thấy "OpenClaw Web running on http://0.0.0.0:3000"
2. **Truy cập:** http://localhost:5173
3. **Login:** admin / admin123
4. **Check Status:** Bây giờ sẽ thấy "Running" với PID 62328
5. **Test buttons:** Start/Stop buttons sẽ hoạt động đúng

---

## Verify Fix Hoạt Động

Sau khi restart, test API:

```bash
# Login
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check status
curl -s -b /tmp/cookies.txt http://localhost:3000/api/process/status
```

**Expected output:**
```json
{
  "running": true,
  "pid": 62328,
  "cpu": 0.1,
  "memory": 27.4,
  ...
}
```

---

## Nếu Vẫn Không Được

Hãy gửi cho tôi output của:

```bash
# 1. Check backend process
lsof -ti:3000

# 2. Check gateway process
lsof -i :18789 | grep LISTEN

# 3. Test API
curl -s -b /tmp/cookies.txt http://localhost:3000/api/process/status
```

---

**Lưu ý:** Tôi không tự động restart để tránh crash VSCode như bạn yêu cầu. Bạn cần restart thủ công.

**Sau khi restart, tất cả sẽ hoạt động!** ✅
