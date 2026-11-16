# Triển khai production

File: `backend/k28/docker-compose.prod.yml`. Một tên miền cho FE và `/api`, thêm `s3.<tên miền>` cho URL ký sẵn của kho tệp.

## Kiến trúc

| Service | Cổng ra ngoài | Ghi chú |
|---|---|---|
| `nginx` (1.28-alpine) | 80, 443 | 80 chuyển hướng HTTPS; `/api/` → `api:8080`; `/` → `web:3000`; `s3.<domain>` → `s3:9000`; chặn `/actuator/`, `/v3/` |
| `api` | không | Profile `prod`: cookie `Secure`, tắt Swagger và công cụ demo, log JSON ECS, nạp `db/migration` + `db/seed` |
| `web` | không | Next.js build production (`frontend/Dockerfile`) |
| `mysql`, `redis`, `s3` | không | Chỉ trong mạng Docker, dữ liệu ở volume `mysql-data`, `redis-data`, `s3-data` |

## Các bước

1. DNS: trỏ `<domain>` và `s3.<domain>` về máy chủ.
2. Bí mật: `cp .env.prod.example .env.prod`, điền mật khẩu DB, khóa S3, SMTP, Google, khóa AI/VNPay nếu có. `.env.prod` không commit.
3. Chứng chỉ: đặt `fullchain.pem`, `privkey.pem` (phủ cả `<domain>` và `s3.<domain>`) vào `backend/k28/docker/nginx/certs/`. Thử nội bộ có thể tự ký:

   ```bash
   openssl req -x509 -nodes -newkey rsa:2048 -days 30 -keyout docker/nginx/certs/privkey.pem -out docker/nginx/certs/fullchain.pem -subj "/CN=vocab.example.com" -addext "subjectAltName=DNS:vocab.example.com,DNS:s3.vocab.example.com"
   ```

4. Chạy:

   ```bash
   cd backend/k28
   docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
   docker compose --env-file .env.prod -f docker-compose.prod.yml ps
   ```

5. Tạo Admin đầu tiên: đăng ký tài khoản qua giao diện, xác thực email, rồi gán vai trò:

   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml exec mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "INSERT IGNORE INTO nguoi_dung_vai_tro (nguoi_dung_id, vai_tro_id) SELECT u.id, r.id FROM nguoi_dung u JOIN vai_tro r ON r.ma = '"'"'ADMIN'"'"' WHERE u.email = '"'"'admin@ten-mien'"'"'"'
   ```

## Lưu ý

- `FORWARD_HEADERS_STRATEGY=native`: Nginx ghi đè `X-Forwarded-For` bằng IP thật, rate limit đăng nhập/quên mật khẩu theo IP người dùng chứ không theo IP proxy.
- Ảnh image đều ghim phiên bản; image `vocab-api`, `vocab-web` gắn `APP_VERSION`.
- VNPay: khai URL IPN `https://<domain>/api/v1/billing/vnpay/ipn` trên cổng merchant; `PAYMENT_PROVIDER=vnpay` khi có khóa thật. Để `fake` thì giao diện ghi "Mô phỏng".
- Gửi email: Spring đọc `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` và các thuộc tính SMTP trong `.env.prod`.
- Cập nhật: `git pull`, chạy lại lệnh `up -d --build`; Flyway tự áp migration mới khi `api` khởi động. Sao lưu trước khi cập nhật ([03_VAN_HANH.md](03_VAN_HANH.md)).
