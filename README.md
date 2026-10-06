# VocabLearning

> Backend .env.example có Google placeholder không rỗng để boot; Google thật cần client ID/secret/callback hợp lệ. Theo yêu cầu mới nhất, các thay đổi trong frontend đã hoàn tác; còn các việc tích hợp API ghi trong báo cáo đối chiếu. Hướng dẫn proxy là hợp đồng bàn giao cần áp dụng, chưa xác nhận client FE hiện tại. Mockup là demo, không thay thế kiểm thử HTTP.

Website học từ vựng tiếng Anh cho người Việt: bộ thẻ, ôn tập lặp lại ngắt quãng (SRS), luyện tập, phát âm và thống kê tiến độ. Khóa luận tốt nghiệp K28.

| Thành phần | Công nghệ |
|---|---|
| Backend (`backend/k28`) | Java 21, Spring Boot 4, Spring Security + Spring Session (Redis), JPA/Hibernate, Flyway, Lombok, MapStruct |
| Hạ tầng dev | MySQL 8.4, Redis 7.4, RustFS (S3), Mailpit, Docker Compose |
| Frontend (`frontend`) | Next.js (JavaScript, App Router), React Query, React Hook Form, Zod |
| Mockup (`mockups`) | HTML/CSS/JS demo; yêu cầu tích hợp Next.js theo báo cáo bàn giao |

## Yêu cầu

- Docker Desktop
- JDK 21 (chỉ cần khi chạy backend ngoài Docker)
- Node.js 20+ (cho frontend)

## Chạy nhanh bằng Docker

```powershell
Copy-Item backend/k28/.env.example backend/k28/.env
cd backend/k28
docker compose --profile app up -d --build
```

| Dịch vụ | Địa chỉ |
|---|---|
| API | http://localhost:8080/api/v1 |
| Health | http://localhost:8080/actuator/health/readiness |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| Mailpit (email dev) | http://localhost:8025 |
| RustFS console | http://localhost:9001 |
| MySQL | `localhost:3307` |
| Redis | `localhost:6379` |

Dừng: `docker compose --profile app down` (thêm `-v` để xóa dữ liệu).

## Chạy backend khi phát triển

Chỉ bật các dịch vụ phụ trợ bằng Docker, backend chạy bằng Maven Wrapper (profile mặc định `dev`, tự nạp `backend/k28/.env`):

```powershell
cd backend/k28
docker compose up -d
.\mvnw.cmd spring-boot:run
```

Chạy test (Testcontainers tự dựng MySQL, Redis, RustFS, Mailpit; cần Docker đang chạy):

```powershell
.\mvnw.cmd test
```

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:3000. Địa chỉ API đặt trong `frontend/.env.local` (`NEXT_PUBLIC_API_URL`).

## Tài khoản demo

Chỉ có ở profile `dev` (seed `db/seed/R__seed_dev.sql`). Mật khẩu chung: `Vocab@12345`.

| Email | Vai trò |
|---|---|
| admin@vocab.local | ADMIN, USER |
| an@vocab.local, binh@vocab.local, chi@vocab.local | USER |

## Cấu hình

- Mẫu biến môi trường: `backend/k28/.env.example`. Giá trị mặc định chỉ dùng cho môi trường dev.
- `backend/k28/.env` chứa khóa thật (Google OAuth, AI, giọng nói) và đã được gitignore, không commit.

## Cấu trúc thư mục

```text
backend/k28/   Spring Boot API (module account, common, …; migration Flyway ở src/main/resources/db)
frontend/      Ứng dụng Next.js
mockups/       Mockup HTML theo giai đoạn (gd0, dot1, dot2), mở mockups/index.html
docs/          Đề cương và tài liệu phân tích thiết kế (TK)
roadmap/       Kế hoạch sprint, roadmap backend và frontend
report/        Báo cáo bàn giao API từ backend cho frontend
```

## Tiến độ

Tiến độ backend được theo dõi bằng các bước đã tick trong [roadmap/ROADMAP_BE.md](roadmap/ROADMAP_BE.md). Đợt sửa 05/10/2026 bao phủ GĐ0–B1.8: tài khoản, thiết lập, tệp, danh mục và bộ cá nhân. B1.9 đang triển khai; kiểm chứng và giới hạn theo báo cáo Đợt 1.

## Tài liệu

- [Phân tích thiết kế hệ thống](docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md)
- [Kế hoạch sprint](roadmap/SPRINT_PLAN.md) · [Roadmap backend](roadmap/ROADMAP_BE.md) · [Roadmap frontend](roadmap/ROADMAP_FE.md)
- [Báo cáo bàn giao BE → FE](report/README.md)
- [Mockup giao diện](mockups/index.html)

## Quy ước Git

- Nhánh backend: `huynh_gia_pho_be`; gộp vào `main` qua pull request.
- Commit message viết tiếng Anh.
