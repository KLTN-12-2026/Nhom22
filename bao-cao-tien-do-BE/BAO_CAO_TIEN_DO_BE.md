# Báo cáo tiến độ Backend

| Mục | Nội dung |
|---|---|
| Người thực hiện | Huỳnh Gia Phó |
| Nhánh git | `huynh_gia_pho_be` |
| Mã nguồn | `backend/k28` (Spring Boot 4.1.1, Java 21, package `com.do_an_tot_nghiep.k28`) |
| Kế hoạch | `roadmap/ROADMAP_BE.md` |

---

## 28/09/2026 — GĐ0: Khởi tạo & nền tảng (B0.1–B0.8) ✅ hoàn thành

### Đã hoàn thành

| Bước | Nội dung | Kết quả kiểm chứng |
|---|---|---|
| B0.1 | Tạo project, thêm thư viện (Web, Validation, Security, OAuth2, JPA, Flyway, MySQL, Redis, Spring Session, Mail, AWS S3, Commons CSV, springdoc, Lombok, MapStruct, Testcontainers); cấu hình annotation processor Lombok → binding → MapStruct | `ToolingMapperTest` pass |
| B0.2 | Docker Compose: MySQL 8.4, Redis, RustFS (S3), tự tạo bucket, Mailpit, API (`--profile app`); Dockerfile multi-stage; `.env.example` | 6 service chạy, `GET /actuator/health` = `UP` |
| B0.3 | Cấu hình ứng dụng qua biến môi trường; Flyway `V1__account.sql` (7 bảng tài khoản, 2 vai trò); seed dữ liệu demo chỉ ở profile `dev` | Flyway áp V1 + seed thành công, `ddl-auto=validate` không lỗi |
| B0.4 | Xử lý lỗi chung: `ErrorCode`, `ApiException`, `ErrorResponse {code, message, fieldErrors, requestId}`, `GlobalExceptionHandler`; `RequestIdFilter`; `PageResponse`; `BaseEntity` + JPA Auditing theo `Clock` UTC | `GlobalExceptionHandlerTest` 3/3 pass |
| B0.5 | Bảo mật nền: phiên Redis (cookie `SESSION` HttpOnly, SameSite=Lax), CSRF cookie + header `X-XSRF-TOKEN`, CORS cho FE, phân quyền URL, 401/403 trả JSON, BCrypt, `GET /api/v1/auth/csrf`, `CurrentUser`, `RateLimiter` (Redis) | `SecurityBaselineTest` 4/4, `CurrentUserTest` 2/2, `RateLimiterTest` 3/3 pass |
| B0.6 | OpenAPI/Swagger UI chia 9 nhóm theo module, mô tả cookie `SESSION` + header `X-XSRF-TOKEN`, Swagger tự gửi CSRF; `GET /api/v1/public/ping`; tắt được bằng `SWAGGER_ENABLED=false` | `ApiDocsTest` 3/3 pass |
| B0.7 | `AbstractIntegrationTest`: `@SpringBootTest` + MockMvc + Testcontainers (MySQL 8.4, Redis, RustFS, Mailpit) dùng chung cho mọi test; helper `xsrf()`, `randomIp()` | `IntegrationSetupTest` 4/4 pass, test không cần `docker compose` |
| B0.8 | `StorageService`: URL ký PUT/GET (10 phút), `head`, `delete`, bucket riêng tư, `S3_PUBLIC_ENDPOINT` cho trình duyệt; `MailService` gửi HTML qua SMTP **sau commit** (`@TransactionalEventListener` + `@Async`) | `StorageServiceTest` 2/2, `MailServiceTest` 2/2 pass |

**Tổng kiểm thử:** `./mvnw verify` → 25/25 test pass (chỉ cần Docker Desktop, Testcontainers tự bật dịch vụ).

**Bàn giao FE:** [`report/GD0_BAO_CAO_FE.md`](../report/GD0_BAO_CAO_FE.md) — hợp đồng chung (lỗi, CSRF, CORS, phân trang), `api-client.js` mẫu, hợp đồng dự kiến Đợt 1.

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
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Ping | `GET http://localhost:8080/api/v1/public/ping` |
| RustFS console | http://localhost:9001 |

Tài khoản demo: xem `README.md`.

### Việc tiếp theo — Đợt 1 (12/10–25/10)

| Bước | Nội dung |
|---|---|
| B1.1 | Đăng ký & xác thực email (FR-01, TC-01) |
| B1.2 | Đăng nhập, đăng xuất, `GET /me` |
| B1.3 | Quên / đặt lại / đổi mật khẩu |
| B1.4–B1.6 | Google OAuth, hồ sơ & thiết lập, tệp tin & ảnh đại diện |
| B1.7–B1.12 | Chủ đề, bộ thẻ, thẻ, thư viện, sao chép bộ, CSV |

### Rủi ro / cần lưu ý

- Chưa có đăng nhập thật (B1.2); hiện mọi API ngoài danh sách công khai đều trả 401.
- Upload trực tiếp từ trình duyệt lên RustFS cần CORS phía bucket — xử lý ở B1.6.
- Migration đã chạy thì không sửa; thay đổi schema tạo file `V<n>__*.sql` mới.
