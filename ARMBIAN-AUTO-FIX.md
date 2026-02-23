# Hướng dẫn chạy Auto-Fix trên Armbian

## Lệnh đơn giản (Copy & Paste)

```bash
cd /root/openclaw-setup/openclaw-web && git pull && sudo ./scripts/auto-fix.sh
```

## Hoặc chạy từng bước:

```bash
# Bước 1: Vào thư mục
cd /root/openclaw-setup/openclaw-web

# Bước 2: Pull code mới nhất
git pull

# Bước 3: Chạy auto-fix
sudo ./scripts/auto-fix.sh
```

## Script sẽ tự động:

✅ Kiểm tra thư mục source và installation
✅ Dừng service cũ
✅ Kill process đang dùng port 3000
✅ Pull code mới nhất
✅ Build frontend trong source directory
✅ Copy toàn bộ sang /opt/openclaw-web
✅ Cài đặt backend dependencies
✅ Tạo thư mục cần thiết
✅ Set permissions đúng
✅ Cài đặt systemd service
✅ Start service
✅ Verify frontend dist files
✅ Test HTTP access

## Thời gian: 3-5 phút

## Sau khi chạy xong:

Truy cập: **http://192.168.1.18:3000**

Login:
- Username: `admin`
- Password: `admin123`

---

**Lưu ý:** Script có màu sắc để dễ theo dõi:
- 🟢 Xanh = Thành công
- 🟡 Vàng = Cảnh báo
- 🔴 Đỏ = Lỗi
