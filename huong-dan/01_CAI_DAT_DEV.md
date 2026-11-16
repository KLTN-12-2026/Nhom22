# Cài đặt môi trường dev

## Yêu cầu

- Docker Desktop (Compose v2), JDK 21+, Node.js 22, Python 3 (script kiểm tra).
- Cổng trống: 3000 (FE), 8080 (API), 3307 (MySQL), 6379 (Redis), 9000/9001 (S3), 1025/8025 (Mailpit).

## Các bước

```bash
cd backend/k28
cp .env.example .env
docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

`.env.example` đã có `SPRING_PROFILES_ACTIVE=dev`, nhưng `spring-boot:run` không đọc biến này từ `.env`; luôn truyền `-Dspring-boot.run.profiles=dev`. Thiếu profile `dev` thì app chạy cấu hình gần production: cookie `Secure`, tắt Swagger, tắt công cụ demo gói, không nạp tài khoản mẫu.

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

## Địa chỉ

| Dịch vụ | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8080/api/v1 |
| Swagger (chỉ `dev`) | http://localhost:8080/swagger-ui.html |
| Mailpit (email dev) | http://localhost:8025 |
| Console S3 (RustFS) | http://localhost:9001 |

## Dữ liệu mẫu theo profile

| Profile | Flyway nạp | Nội dung |
|---|---|---|
| (mặc định), `prod` | `db/migration`, `prod` thêm `db/seed` | Lược đồ; `prod` có chủ đề và 8 bộ mẫu × 30 thẻ |
| `dev` | `db/migration`, `db/seed`, `db/dev` | Thêm `admin@`, `an@`, `binh@`, `chi@vocab.local`, mật khẩu `Vocab@12345` |
| `dev,demo` | thêm `db/demo` | 160 giao dịch `DEMO-…`, tài khoản và lịch sử demo B5.2b |

## Kiểm tra nhanh

```bash
cd backend/k28
./mvnw -B test
python scripts/smoke_billing_expiry.py http://localhost:8080
```

Test tích hợp dùng Testcontainers nên cần Docker. Script smoke đăng ký User mới, mua gói qua cổng mô phỏng, rồi Admin rút ngắn hạn và chạy kiểm tra hết hạn; cần server profile `dev`.
