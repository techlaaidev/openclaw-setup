# Fix HTTPS/HTTP Protocol Error

## Vấn đề
Trình duyệt đang cố tải assets qua HTTPS nhưng server chỉ chạy HTTP:
```
GET https://192.168.1.18:3000/assets/... net::ERR_SSL_PROTOCOL_ERROR
```

## Giải pháp

### Cách 1: Xóa cache và force HTTP (Nhanh nhất)

**Chrome/Edge:**
1. Mở DevTools (F12)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"
4. Hoặc: Ctrl+Shift+Delete → Clear browsing data → Cached images and files

**Sau đó truy cập lại:** `http://192.168.1.18:3000` (đảm bảo dùng **http://** không phải https://)

### Cách 2: Dùng Incognito/Private Mode

```
Ctrl+Shift+N (Chrome)
Ctrl+Shift+P (Firefox)
```

Truy cập: `http://192.168.1.18:3000`

### Cách 3: Disable HSTS trong Chrome

1. Vào: `chrome://net-internals/#hsts`
2. Ở phần "Delete domain security policies"
3. Nhập: `192.168.1.18`
4. Click "Delete"
5. Refresh lại trang

### Cách 4: Dùng trình duyệt khác

Thử Firefox hoặc Safari với URL: `http://192.168.1.18:3000`

### Cách 5: Fix trong code (nếu các cách trên không work)

Chạy trên Armbian:

```bash
cd /root/openclaw-setup/openclaw-web
```

Tạo file `.env` trong thư mục gốc:

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
VITE_API_URL=http://192.168.1.18:3000
EOF
```

Rebuild và restart:

```bash
cd frontend
npm run build
cd ..
sudo systemctl restart openclaw-dashboard
```

## Kiểm tra

Sau khi thử các cách trên, mở DevTools (F12) → Network tab và reload trang.

Bạn sẽ thấy:
- ✅ `http://192.168.1.18:3000/` (không phải https)
- ✅ `http://192.168.1.18:3000/assets/...` (không phải https)

## Nguyên nhân

Trình duyệt đã cache HTTPS redirect hoặc HSTS header từ lần truy cập trước. Cần xóa cache để force dùng HTTP.

---

**Khuyến nghị:** Thử Cách 1 trước (xóa cache), nếu không được thì thử Cách 3 (delete HSTS).
