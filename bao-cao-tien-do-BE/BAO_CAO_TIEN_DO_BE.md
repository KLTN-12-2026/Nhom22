# Báo cáo tiến độ Backend

| Mục | Nội dung |
|---|---|
| Người thực hiện | Huỳnh Gia Phó |
| Nhánh git | `huynh_gia_pho_be` |
| Mã nguồn | `backend/k28` (Spring Boot 4.1.1, Java 21, package `com.do_an_tot_nghiep.k28`) |
| Kế hoạch | `roadmap/ROADMAP_BE.md` |

---

## 28/09/2026 — GĐ0: Khởi tạo & nền tảng (B0.1–B0.5)

### Đã hoàn thành

| Bước | Nội dung | Kết quả kiểm chứng |
|---|---|---|
| B0.1 | Tạo project, thêm thư viện (Web, Validation, Security, OAuth2, JPA, Flyway, MySQL, Redis, Spring Session, Mail, AWS S3, Commons CSV, springdoc, Lombok, MapStruct, Testcontainers); cấu hình annotation processor Lombok → binding → MapStruct | `ToolingMapperTest` pass |
| B0.2 | Docker Compose: MySQL 8.4, Redis, RustFS (S3), tự tạo bucket, Mailpit, API (`--profile app`); Dockerfile multi-stage; `.env.example` | 6 service chạy, `GET /actuator/health` = `UP` |
| B0.3 | Cấu hình ứng dụng qua biến môi trường; Flyway `V1__account.sql` (7 bảng tài khoản, 2 vai trò); seed dữ liệu demo chỉ ở profile `dev` | Flyway áp V1 + seed thành công, `ddl-auto=validate` không lỗi |
| B0.4 | Xử lý lỗi chung: `ErrorCode`, `ApiException`, `ErrorResponse {code, message, fieldErrors, requestId}`, `GlobalExceptionHandler`; `RequestIdFilter`; `PageResponse`; `BaseEntity` + JPA Auditing theo `Clock` UTC | `GlobalExceptionHandlerTest` 3/3 pass |
| B0.5 | Bảo mật nền: phiên Redis (cookie `SESSION` HttpOnly, SameSite=Lax), CSRF cookie + header `X-XSRF-TOKEN`, CORS cho FE, phân quyền URL, 401/403 trả JSON, BCrypt, `GET /api/v1/auth/csrf`, `CurrentUser`, `RateLimiter` (Redis) | `SecurityBaselineTest` 4/4, `CurrentUserTest` 2/2, `RateLimiterTest` 3/3 pass |

**Tổng kiểm thử:** `./mvnw test` → 14/14 test pass (có `K28ApplicationTests` khởi động toàn bộ ứng dụng với MySQL/Redis thật).

### Bảng dữ liệu đã tạo (V1)

`nguoi_dung`, `vai_tro`, `nguoi_dung_vai_tro`, `danh_tinh_oauth`, `token_tai_khoan`, `ho_so_hoc_tap`, `cai_dat_thong_bao`.



### Cách chạy (cho FE và thành viên khác)

```bash
cd backend/k28
docker compose --profile app up -d --build
```

| Dịch vụ | Địa chỉ |
|---|---|
| API | http://localhost:8080 |
| Health | http://localhost:8080/actuator/health |
| Lấy CSRF token | `GET http://localhost:8080/api/v1/auth/csrf` |
| Mailpit | http://localhost:8025 |
| RustFS console | http://localhost:9001 |

Tài khoản demo: xem `README.md`.

### Việc tiếp theo

| Bước | Nội dung |
|---|---|
| B0.6 | Swagger/OpenAPI, `GET /api/v1/public/ping` |
| B0.7 | `AbstractIntegrationTest` với Testcontainers |
| B0.8 | `StorageService` (S3 presigned URL), `MailService` gửi sau commit |
| Sau GĐ0 | `/fe-report GD0` bàn giao FE, bắt đầu Đợt 1 (B1.1 Đăng ký & xác thực email) |

### Rủi ro / cần lưu ý

- Chưa có đăng nhập thật (B1.2); hiện mọi API ngoài danh sách công khai đều trả 401.
- Migration đã chạy thì không sửa; thay đổi schema tạo file `V<n>__*.sql` mới.
