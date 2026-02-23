# Debug Commands - Chạy trên Armbian

## Bước 1: Kiểm tra trạng thái hiện tại

```bash
# Vào thư mục
cd /root/openclaw-setup/openclaw-web

# Kiểm tra git status
git status

# Kiểm tra service
systemctl status openclaw-dashboard

# Kiểm tra logs
journalctl -u openclaw-dashboard -n 50 --no-pager
```

## Bước 2: Kiểm tra frontend

```bash
# Kiểm tra thư mục dist có tồn tại không
ls -la /opt/openclaw-web/frontend/dist/

# Nếu không có, kiểm tra frontend source
ls -la /opt/openclaw-web/frontend/
```

## Bước 3: Kiểm tra port

```bash
# Kiểm tra port 3000
lsof -i :3000

# Kiểm tra process
ps aux | grep node
```

## Bước 4: Test truy cập

```bash
# Test từ localhost
curl -I http://localhost:3000

# Test API health
curl http://localhost:3000/api/system/health
```

Hãy chạy từng bước và gửi kết quả cho tôi, tôi sẽ phân tích và đưa ra giải pháp cụ thể.
