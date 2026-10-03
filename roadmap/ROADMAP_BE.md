# ROADMAP BACKEND — VocabLearning (VocabFlow)

> Nguồn yêu cầu: `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` (viết tắt **TK**). Mã yêu cầu `FR-xx` (TK §5), mã kiểm thử `TC-xx` (TK §19).
> Mỗi bước `Bx.y` là một đơn vị giao việc: chạy `/be-code B1.1` (viết code) hoặc `/be-chat B1.1` (học và tự gõ).
> Nguyên tắc: **đơn giản, chạy được, đúng quy tắc nghiệp vụ**. Không microservices, không Kafka, không MongoDB (TK §11.1).

---

## 0. Tổng quan

### 0.1. Công nghệ

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| Ngôn ngữ / build | Java 21, Maven Wrapper | Máy có JDK 25 vẫn build được `release 21` |
| Framework | Spring Boot 4.x (bản ổn định mới nhất trên start.spring.io) | Spring Web MVC, Validation, Security, Data JPA |
| CSDL / migration | MySQL 8.4 + Flyway | Không dùng `ddl-auto=update`; chỉ `validate` |
| Phiên / cache / rate limit | Redis + Spring Session | Cookie `HttpOnly` (TK §11.3) |
| Tệp ảnh, âm thanh | RustFS (tương thích S3; MinIO đã ngừng phát hành image) + AWS SDK v2 | URL ký thời hạn |
| Email dev | Mailpit | Xem thư tại http://localhost:8025 |
| Giảm code lặp | **Lombok** | `@Getter`, `@RequiredArgsConstructor`, `@Slf4j`, `@Builder` |
| Ánh xạ DTO ↔ Entity | **MapStruct** | Interface `XxxMapper`, Spring bean |
| Tài liệu API | springdoc-openapi (Swagger UI) | `/swagger-ui/index.html` |
| Kiểm thử | JUnit 5, Mockito, MockMvc, Testcontainers | Công thức SRS test với `Clock` cố định |
| Đóng gói | **Docker** multi-stage + Docker Compose | Profile `app` chạy cả API |
| Bản đồ mã nguồn | **graphify** (`graphifyy`) | Tra cứu nhanh kiến trúc, tiết kiệm token (mục cuối) |

### 0.2. Lịch theo đề cương (TK §18.1)

| Giai đoạn | Thời gian | Kết quả | Bước |
|---|---|---|---|
| **GĐ0** — Khởi tạo & nền tảng | 28/09–11/10 | Project chạy trong Docker, lỗi/bảo mật/migration nền | B0.1–B0.8 |
| **Đợt 1** — Tài khoản & nội dung | 12/10–25/10 | FR-01…05: tài khoản, hồ sơ, tệp, bộ/thẻ, thư viện, CSV | B1.1–B1.12 |
| **Đợt 2** — Học & luyện | 26/10–08/11 | FR-06, 07, 11, 13: SRS, phiên học, bài luyện, sổ tay, thống kê, quản trị | B2.1–B2.11 |
| **Đợt 3** — AI & mở rộng | 09/11–29/11 | FR-08, 09, 10, 12, 14: AI, phát âm, gợi ý, thưởng, nhắc, kiểm duyệt, xóa dữ liệu | B3.1–B3.11 |
| **GĐ4** — Kiểm thử & ổn định | 30/11–06/12 | TC-01…20, hiệu năng, sao lưu/khôi phục | B4.1–B4.5 |
| **GĐ5** — Triển khai & bàn giao | 07/12–14/12 | Compose production, dữ liệu demo, OpenAPI, tài liệu | B5.1–B5.4 |

Sau bước cuối mỗi giai đoạn: chạy `/fe-report <GĐ>` để bàn giao cho FE.
Lịch theo tuần (S1–S11) ghép BE ↔ FE: `roadmap/SPRINT_PLAN.md`; bước FE: `roadmap/ROADMAP_FE.md`.

---

## 1. Kiến trúc & cấu trúc mã nguồn

Một ứng dụng Spring Boot **chia module theo nghiệp vụ** (TK §11.2). Mỗi module có các lớp quen thuộc, không chia tầng phức tạp.

```text
backend/k28/
├── pom.xml  mvnw  mvnw.cmd  .mvn/
├── Dockerfile  docker-compose.yml  .env.example  .gitattributes  .dockerignore
└── src/
    ├── main/java/com/do_an_tot_nghiep/k28/
    │   ├── K28Application.java
    │   ├── common/          # dùng chung
    │   │   ├── config/      # Clock, OpenAPI, S3, Async, Jackson
    │   │   ├── security/    # SecurityConfig, CurrentUser, RateLimiter
    │   │   ├── exception/   # ErrorCode, ApiException, GlobalExceptionHandler
    │   │   ├── web/         # PageResponse, RequestIdFilter
    │   │   ├── entity/      # BaseEntity (createdAt, updatedAt)
    │   │   ├── storage/     # StorageService (S3 — RustFS khi dev)
    │   │   ├── mail/        # MailService
    │   │   └── job/         # tac_vu_nen: JobService, JobWorker (Đợt 3)
    │   ├── account/         # tai_khoan: đăng ký, đăng nhập, OAuth, hồ sơ, xóa dữ liệu
    │   ├── content/         # noi_dung: chủ đề, nhãn, bộ, thẻ, thư viện, CSV, tệp
    │   ├── learning/        # hoc_tap: tiến độ SRS, phiên học, kế hoạch hôm nay
    │   ├── practice/        # luyen_tap: bài luyện, chấm, lỗi, sổ tay
    │   ├── ai/              # ho_tro_ai: adapter AI, bản nháp, hạn mức
    │   ├── speaking/        # phat_am: âm mẫu, ghi âm, đánh giá
    │   ├── stats/           # thong_ke: tổng quan, kỹ năng, tổng kết tuần, gợi ý
    │   ├── engagement/      # dong_luc: điểm, chuỗi ngày, huy hiệu, thử thách
    │   ├── notification/    # thong_bao: thông báo, nhắc học
    │   └── admin/           # quan_tri: người dùng, vai trò, kiểm duyệt, nhật ký
    │       (mỗi module) controller/ service/ repository/ entity/ dto/ mapper/
    ├── main/resources/
    │   ├── application.yml  application-dev.yml  application-docker.yml
    │   └── db/migration/V1__account.sql …   db/seed/R__seed_dev.sql
    └── test/java/com/do_an_tot_nghiep/k28/…
```

**Luồng một request:** `Controller` (validate DTO) → `Service` (@Transactional, kiểm quyền sở hữu, quy tắc nghiệp vụ) → `Repository` (JPA) → MySQL. `Mapper` (MapStruct) đổi Entity ↔ DTO.

**Quy tắc bắt buộc (giữ đơn giản nhưng đúng):**
1. Công thức SRS, chấm điểm, điểm thưởng **chỉ ở service** (TK §11.2), không ở controller/frontend.
2. Module gọi module khác qua **service**, không dùng repository của module khác.
3. Không gọi mạng (mail, AI, S3, Speech) bên trong transaction → gửi sau commit (`@TransactionalEventListener`) hoặc qua bảng `tac_vu_nen`.
4. Thời gian: inject `Clock`, lưu `Instant` UTC; ngày học tính theo múi giờ User (TK §7.3).
5. Dữ liệu riêng của người khác → trả **404** (TK §13.1, TC-02).

---

## GĐ0 — Khởi tạo & nền tảng (28/09–11/10)

### [x] B0.1 Tạo project Spring Boot
- start.spring.io: **Maven, Java 21, Jar**, group `com.do-an-tot-nghiep`, artifact `k28`, package `com.do_an_tot_nghiep.k28` (thư mục `backend/k28`).
- Dependencies: Spring Web, Validation, Spring Security, OAuth2 Client, Spring Data JPA, MySQL Driver, Flyway Migration, Spring Data Redis, Spring Session (Data Redis), Java Mail Sender, Actuator, Lombok, Testcontainers, Spring Boot DevTools.
- Thêm tay vào `pom.xml`: `mapstruct`, `springdoc-openapi-starter-webmvc-ui` (bản hỗ trợ Boot 4), `flyway-mysql`, `software.amazon.awssdk:s3`, `org.apache.commons:commons-csv`.
- Cấu hình annotation processor theo thứ tự **Lombok → lombok-mapstruct-binding → MapStruct** (thiếu binding thì MapStruct không thấy getter/builder của Lombok):

```xml
<properties>
  <java.version>21</java.version>
  <mapstruct.version>1.6.3</mapstruct.version>
</properties>
<!-- dependency: org.mapstruct:mapstruct:${mapstruct.version} -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <configuration>
    <annotationProcessorPaths>
      <path><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><version>${lombok.version}</version></path>
      <path><groupId>org.projectlombok</groupId><artifactId>lombok-mapstruct-binding</artifactId><version>0.2.0</version></path>
      <path><groupId>org.mapstruct</groupId><artifactId>mapstruct-processor</artifactId><version>${mapstruct.version}</version></path>
    </annotationProcessorPaths>
    <compilerArgs>
      <arg>-Amapstruct.defaultComponentModel=spring</arg>
      <arg>-Amapstruct.unmappedTargetPolicy=WARN</arg>
    </compilerArgs>
  </configuration>
</plugin>
```
- `.gitattributes`: `mvnw text eol=lf` (tránh lỗi `/bin/sh^M` khi build Docker trên Windows). `.gitignore`: `target/`, `.env`.
- **Xong khi:** `./mvnw -q -DskipTests compile` chạy qua; một `HealthMapper` thử MapStruct + Lombok sinh được code trong `target/generated-sources`.

### [x] B0.2 Docker Compose môi trường dev
- `docker-compose.yml`: `mysql:8.4` (cổng host 3307, `utf8mb4`, TZ UTC, healthcheck), `redis` (6379), `s3` = RustFS (9000/9001) + `s3-init` tạo bucket bằng aws-cli, `mailpit` (1025/8025), `api` (chỉ khi `--profile app`).
- `.env.example` chỉ có tên biến và giá trị dev giả: `DB_NAME, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD, REDIS_HOST, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, MAIL_HOST, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AI_API_KEY, SPEECH_KEY, APP_FRONTEND_URL`.
- `Dockerfile` multi-stage:

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r app
USER app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```
- Profile: `dev` (chạy app từ IDE, kết nối `localhost:3307`), `docker` (host là tên service `mysql`, `redis`…), `test`.
- **Xong khi:** `docker compose up -d` → 4 service healthy; `docker compose --profile app up -d --build` → `GET /actuator/health` trả `UP`.

### [x] B0.3 Cấu hình ứng dụng & Flyway
- `application.yml`: datasource, `spring.jpa.hibernate.ddl-auto=validate`, `open-in-view=false`, `hibernate.jdbc.time_zone=UTC`, naming snake_case mặc định, Flyway bật, `spring.session.data.redis`, multipart giới hạn, Jackson ISO-8601.
- `V1__account.sql`: `nguoi_dung`, `vai_tro`, `nguoi_dung_vai_tro`, `danh_tinh_oauth`, `token_tai_khoan`, `ho_so_hoc_tap`, `cai_dat_thong_bao` (TK §12.2). Seed 2 vai trò `USER`, `ADMIN`.
- Dev seed tách riêng `db/seed/` (chỉ bật ở profile dev): 1 Admin, 3 User mẫu.
- **Xong khi:** app khởi động, Flyway áp V1, `validate` không báo lỗi.

### [x] B0.4 Xử lý lỗi & tiện ích web chung
- `ErrorCode` (enum: `VALIDATION_FAILED, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, VERSION_CONFLICT, BUSINESS_RULE, RATE_LIMITED, DEPENDENCY_DOWN`) → HTTP 400/401/403/404/409/409/422/429/503.
- `ApiException(ErrorCode, message)`; `GlobalExceptionHandler` trả `{code, message, fieldErrors, requestId}` (TK §13.1), **không** trả stack trace.
- `RequestIdFilter`: sinh `X-Request-Id`, đưa vào MDC log.
- `PageResponse<T>(items, page, size, totalElements)`; `BaseEntity` với `createdAt`, `updatedAt` (JPA Auditing).
- Bean `Clock` UTC.
- **Xong khi:** test MockMvc: body sai → 400 có `fieldErrors`; id không tồn tại → 404 có `requestId`.

### [x] B0.5 Bảo mật nền
- `SecurityConfig`: phiên lưu Redis (Spring Session), cookie `HttpOnly`, `SameSite=Lax`, `Secure` khi HTTPS; CSRF bằng `CookieCsrfTokenRepository` (header `X-XSRF-TOKEN`); CORS chỉ cho `APP_FRONTEND_URL`.
- Phân quyền URL: `/api/v1/auth/**`, `/api/v1/library/**`, `/api/v1/public/**`, Swagger, health → `permitAll`; `/api/v1/admin/**` → `ADMIN`; còn lại → đăng nhập.
- 401/403 trả JSON theo B0.4. `PasswordEncoder` = BCrypt. `CurrentUser` lấy id người đang đăng nhập.
- `RateLimiter` đơn giản: đếm `INCR` + `EXPIRE` trên Redis theo khóa (IP/user + hành động).
- **Xong khi:** gọi API cần đăng nhập → 401 JSON; POST thiếu CSRF → 403.

### [x] B0.6 OpenAPI & quy ước API
- springdoc: nhóm theo module, mô tả cookie session + CSRF. Tiền tố `/api/v1`, JSON camelCase, **tên trường DTO = tên field entity** (`tenHienThi`, `trangThai`…), ID trả dạng string.
- **Xong khi:** Swagger UI mở được, có endpoint `GET /api/v1/public/ping`.

### [x] B0.7 Nền kiểm thử
- `AbstractIntegrationTest`: `@SpringBootTest` + MockMvc + Testcontainers (MySQL 8.4, Redis) dùng `@ServiceConnection`.
- Tên test theo mã: `FR01RegisterTest`, phương thức `tc01_...`.
- **Xong khi:** `./mvnw -q verify` chạy qua với Docker đang bật.

### [x] B0.8 Kho lưu tệp & email
- `StorageService`: tạo presigned PUT/GET (hết hạn ngắn), xóa object; bucket riêng tư.
- `MailService`: gửi mail HTML đơn giản qua SMTP (Mailpit khi dev), gửi **sau commit** bằng `@TransactionalEventListener(AFTER_COMMIT)` + `@Async`.
- **Xong khi:** test tích hợp upload/download qua URL ký; gửi mail thử thấy trong Mailpit.

---

## Đợt 1 — Tài khoản, hồ sơ & nội dung (12/10–25/10) · FR-01…05

### [x] B1.1 Đăng ký & xác thực email — FR-01, TC-01
- API: `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-verification`.
- Tạo `nguoi_dung` trạng thái `CHUA_XAC_THUC`; token ngẫu nhiên, **chỉ lưu `token_hash`** (SHA-256), có `het_han_at`, `da_dung_at` (dùng một lần). Email trùng → 409. Rate limit đăng ký/gửi lại.
- **Xong khi:** token sai/hết hạn/dùng lần 2 bị từ chối; mật khẩu lưu BCrypt.
- **Đã làm:** `FR01RegisterTest` 8 test xanh.

### [x] B1.2 Đăng nhập, đăng xuất, thông tin phiên — FR-01
- API: `POST /auth/login`, `POST /auth/logout`, `GET /me`, `GET /auth/csrf`.
- Chưa xác thực email hoặc bị khóa → từ chối có mã lỗi riêng; sai mật khẩu nhiều lần → 429. Đăng nhập thành công đổi session id (chống fixation). Logout xóa session Redis.
- **Xong khi:** sau logout, cookie cũ gọi `/me` → 401.
- **Đã làm:** `FR01LoginTest` 9 test xanh; mã lỗi `INVALID_CREDENTIALS` 401, `EMAIL_NOT_VERIFIED` 403, `ACCOUNT_LOCKED` 403; khóa 5 lần sai/15 phút theo email.

### [x] B1.3 Quên / đặt lại / đổi mật khẩu — FR-01, TC-01
- API: `POST /auth/forgot-password`, `POST /auth/reset-password`, `PUT /me/password`.
- Quên mật khẩu luôn trả 200 (không lộ email tồn tại). Đặt lại/đổi mật khẩu → **vô hiệu mọi phiên khác** (`FindByIndexNameSessionRepository`).
- **Xong khi:** link đặt lại dùng 1 lần, hết hạn 30 phút; đặt lại hủy mọi phiên; đổi mật khẩu giữ phiên hiện tại, hủy phiên khác.
- **Đã làm:** `FR01PasswordTest` 8 test xanh; cần `spring.session.data.redis.repository-type: indexed`; lỗi nghiệp vụ trả `fieldErrors` (`currentPassword`, `newPassword`).

### [x] B1.4 Đăng nhập Google — FR-01
- API: `GET /auth/google/start`, `GET /auth/google/callback` (Spring OAuth2 Client).
- Lưu `danh_tinh_oauth(nha_cung_cap, subject)` unique; **không tự nối** vào tài khoản có cùng email khi chưa có bằng chứng (TK §6.1) → báo cần đăng nhập mật khẩu rồi liên kết.
- **Xong khi:** Google mới → tài khoản `HOAT_DONG` không mật khẩu; cùng `subject` → cùng tài khoản; email trùng → `?loi=OAUTH_LINK_REQUIRED`, liên kết sau khi đăng nhập mật khẩu trong 10 phút; bị khóa/email chưa xác minh bị từ chối.
- **Đã làm:** `FR01GoogleLoginTest` 9 test xanh. Đường dẫn thật: `start` → `/auth/oauth2/google` (Spring) → `/auth/google/callback`; lỗi → `{frontend}/dang-nhap?loi=<MÃ>`. Key Google nằm trong `backend/k28/.env` (không commit), app tự nạp `.env` qua `spring.config.import`. Đã thử thật tới màn chọn tài khoản Google và nhánh `OAUTH_LINK_REQUIRED`; bước liên kết bằng mật khẩu mới kiểm bằng test.

### [x] B1.5 Hồ sơ, thiết lập học & thông báo — FR-02
- API: `PATCH /me`, `GET/PUT /me/learning-settings`, `GET/PUT /me/notification-settings`.
- `ho_so_hoc_tap`: trình độ tự đánh giá, mục tiêu (GIAO_TIEP/TOEIC), phút/ngày, từ mới/ngày. `cai_dat_thong_bao`: nhận trong ứng dụng, email, nhắc học, giờ nhắc. Múi giờ IANA hợp lệ (có trong `ZoneId.getAvailableZoneIds()`, không nhận `+07:00`).
- PUT gửi kèm `version` → sai thì 409 `VERSION_CONFLICT`. Lưu thiết lập học lần đầu = hoàn tất khởi đầu (`daHoanTatKhoiDau = true`).
- **Xong khi:** tài khoản mới đọc được giá trị mặc định; lưu xong `/me` có `daHoanTatKhoiDau = true`; `version` cũ → 409; múi giờ sai, giới hạn sai, bật nhắc học thiếu giờ → 400 có `fieldErrors`.
- **Đã làm:** `FR02SettingsTest` 7 test xanh; gọi thật đủ các nhánh. **Chuyển sang B1.7:** chủ đề yêu thích (cần bảng `chu_de`).

### [x] B1.6 Tệp tin & ảnh đại diện — FR-03
- Bảng `tep_tin`. API: `POST /files/upload-requests` (trả URL ký + fileId), `POST /files/{id}/complete` (kiểm tra kích thước, MIME thực, checksum), `DELETE /files/{id}`.
- Giới hạn ảnh ≤ 2 MB (jpg/png/webp), âm thanh ≤ 5 MB. Không cho client chỉ định đường dẫn/URL tùy ý.
- Đã hoàn tất 02/10/2026: MIME thực, SHA-256, kiểm tra ảnh/âm thanh, ảnh đại diện, xóa và retry/dọn tệp nền, CORS bucket cho browser. 22 test FR-03 + 13 test hồi quy pass. Luồng/API: `docs/luong-backend/B1.6-tep-tin-anh-dai-dien.md`.

### [x] B1.7 Chủ đề, nhãn, trình độ — FR-03, FR-13
- `V4__content.sql`: `chu_de`, `nhan`, `bo_the`, `the_tu_vung`, `the_nhan`, `the_tep`, `bo_yeu_thich`. V2/V3 đã dùng cho tệp và cleanup.
- Nợ từ B1.5: chủ đề yêu thích của người học (bảng nối `nguoi_dung` ↔ `chu_de`, tối đa 5) + thêm vào `GET/PUT /me/learning-settings`.
- Public: `GET /public/topics`. Admin: CRUD `/admin/topics`, `/admin/tags`.
- **Đã làm 03/10/2026:** 11 API danh mục; cập nhật `GET/PUT /me/learning-settings` với `chuDeIds` bắt buộc, tối đa 5 ID tồn tại và không trùng. PUT danh mục kèm `version`; xóa danh mục đang được tham chiếu trả 409, không cascade. Trình độ dùng enum hiện có, không có API CRUD trình độ.
- **Kiểm chứng:** `FR03CatalogTest` 10/10 pass; 62 lượt HTTP thật pass trên localhost:8080, gồm đổi riêng chủ đề tăng version và chặn xóa chủ đề yêu thích. Chưa thử đồng thời hai transaction hoặc nhãn gắn thẻ/bộ thẻ gắn chủ đề. Không tuyên bố toàn bộ suite pass; FR-13 audit log chưa có ở bước này.
- **Bàn giao:** `report/DOT1_BAO_CAO_FE.md` mục 5.12, 5.21–5.31; `docs/luong-backend/B1.7-chu-de-nhan-chu-de-yeu-thich.md`; Postman thêm 15, cập nhật 3 request. Mockup B1.7 đã đối chiếu, còn lệch hợp đồng theo mục 10 báo cáo.

### [ ] B1.8 Bộ thẻ cá nhân — FR-03, TC-02
- API: `GET/POST /decks`, `GET/PATCH/DELETE /decks/{id}`, `PUT/DELETE /decks/{id}/favorite`.
- Quyền `RIENG_TU/CONG_KHAI`; chỉ chủ sở hữu sửa; bộ người khác → 404. Xóa bộ đã có lịch sử học → xóa mềm. `@Version` chống ghi đè.

### [ ] B1.9 Thẻ từ vựng — FR-03, TC-02
- API: `GET/POST /decks/{id}/cards`, `PATCH/DELETE /cards/{id}`.
- Trường: từ, từ loại, nghĩa, IPA, ví dụ EN, bản dịch, độ khó, nguồn, ảnh/âm (`the_tep`). Kiểm tra quyền **cả bộ cha**. Cảnh báo trùng theo từ + từ loại đã chuẩn hóa (không chặn).

### [ ] B1.10 Thư viện công khai — FR-04
- API: `GET /library/decks` (q, chủ đề, trình độ, mục tiêu, nguồn, sắp xếp, phân trang), `GET /library/decks/{id}`.
- Chỉ bộ `CONG_KHAI` + đã duyệt; nhãn "Bộ mẫu" hoặc "Người học chia sẻ". Dùng JPA `Specification`.
- Bộ khởi động sau onboarding (TK §6.1 bước 5): lọc theo mục tiêu/trình độ trong `ho_so_hoc_tap`. `GET /library/decks/{id}` là link chia sẻ công khai.

### [ ] B1.11 Sao chép bộ — FR-04, TC-03
- API: `POST /decks/{id}/copy` với header `Idempotency-Key`.
- Tạo bộ + thẻ mới, giữ `bo_nguon_id`; **không** sao chép tiến độ/lịch sử/điểm. Gửi lại cùng key → trả kết quả cũ.

### [ ] B1.12 Nhập/xuất CSV — FR-05, TC-04
- API: `POST /decks/{id}/imports/preview` (lưu tạm kết quả trong Redis 30 phút), `POST /imports/{id}/commit`, `GET /decks/{id}/export`.
- Giới hạn 1 MB / 1000 dòng; báo lỗi **từng dòng**; đánh dấu trùng; commit chỉ ghi dòng hợp lệ đã chọn. Export chống công thức (ô bắt đầu `= + - @` → thêm `'`).
- **Cuối Đợt 1 →** `/fe-report DOT1`.

---

## Đợt 2 — Học, luyện tập, thống kê & quản trị (26/10–08/11) · FR-06, 07, 11, 13

### [ ] B2.1 Bộ tính SRS thuần — FR-06, TC-06, TC-07
- `V5__learning.sql`: `tien_do_the`, `phien_hoc`, `phien_hoc_the`, `lich_su_on`, `su_dung_hoc_ngay` + unique/index TK §12.4.
- `SrsCalculator` (class thuần, không Spring): nhận trạng thái cũ + mức (QUEN/KHO/NHO/DE) + `Instant now` → trạng thái mới, theo **đúng bảng TK §7.2** (EF 2.5, min 1.3, trần 365 ngày).
- **Xong khi:** unit test chuỗi Nhớ: mới → 10 phút → 1 ngày → 6 ngày → 15 ngày; Quên ở ON_TAP → HOC_LAI, tăng số lần quên.

### [ ] B2.2 Kế hoạch hôm nay — FR-02, FR-06
- API: `GET /learning/today`: số thẻ đến hạn, quá hạn, mới còn lại hôm nay, ước tính phút, chuỗi ngày.
- "Đến hạn/quá hạn" tính từ `han_on_at` (không lưu trạng thái riêng). Ngày theo múi giờ User.

### [ ] B2.3 Tạo phiên học — FR-06
- API: `POST /learning/sessions` (bộ, chiều `EN_VI`/`VI_EN`, quỹ thời gian 5/10/20 phút), `GET /learning/sessions/{id}`.
- Hàng đợi: bước học lại đến hạn → ôn quá hạn/đến hạn → thẻ mới trong hạn mức. Bỏ thẻ tạm ngưng/đã xóa. Lưu vào `phien_hoc_the`.

### [ ] B2.4 Ghi kết quả ôn — FR-06, TC-05, TC-08, TC-09
- API: `POST /learning/sessions/{id}/reviews` body `{clientEventId, cardId, direction, rating, expectedVersion, answerTimeMs}` (TK §13.3).
- Một transaction theo TK §7.4: kiểm thẻ thuộc hàng đợi → `clientEventId` đã có thì trả kết quả cũ → so `expectedVersion` (lệch → 409) → ghi `lich_su_on` (trước/sau JSON, phiên bản thuật toán) → cập nhật `tien_do_the` + `su_dung_hoc_ngay`.
- Hạn mức từ mới đếm theo **thẻ vật lý**, không nhân đôi hai chiều.

### [ ] B2.5 Kết thúc phiên, lịch sử, tạm ngưng/đặt lại — FR-06
- API: `POST /learning/sessions/{id}/finish` (tổng kết khớp lịch sử), `GET /learning/history`, `PUT /cards/{id}/progress/suspend`, `POST /cards/{id}/progress/reset` (cần xác nhận).

### [ ] B2.6 Cứu lịch ôn — FR-06, TC-10
- Trong `/learning/today`: khi quá hạn vượt ngưỡng → trả phương án chia N ngày theo phút/ngày, giảm từ mới, ưu tiên thẻ quên nhiều. **Không** đổi `han_on_at` gốc.

### [ ] B2.7 Tạo bài luyện — FR-07, TC-11
- `V6__practice.sql`: `bai_luyen`, `cau_hoi_bai_luyen`, `lan_lam_bai`, `tra_loi_bai_luyen`, `loi_hoc_tap`, `so_tay_tu_kho`, `cap_tu_de_nham`.
- API: `POST /practice/sessions` (dạng: chọn nghĩa, chọn từ, ghép, điền chỗ trống, nhập từ theo nghĩa, nghe viết, phân biệt cặp, tổng hợp), `GET /practice/sessions/{id}`.
- Lưu **bản chụp** câu hỏi + đáp án; response **không chứa đáp án**.

### [ ] B2.8 Nộp bài & chấm — FR-07, TC-11
- API: `POST /practice/sessions/{id}/submissions` (`submitKey` chống trùng), `GET /practice/history`, `POST /practice/mistakes/retry`.
- `AnswerNormalizer` (Unicode NFC, khoảng trắng, hoa/thường theo dạng bài); chấm tại server theo bản chụp; lưu `loi_hoc_tap` với nhóm lỗi (NGHIA, CHINH_TA, NGHE, CAP_NHAM…).

### [ ] B2.9 Sổ tay từ khó & cặp dễ nhầm — FR-08
- API: `GET /notebook`, `PUT/DELETE /notebook/{cardId}`, `GET /learning/confusing-pairs`.

### [ ] B2.10 Thống kê nền — FR-11
- API: `GET /statistics/overview` (từ đã học, lượt ôn, tỷ lệ đúng, thời gian, chuỗi ngày), `GET /statistics/skills` (mức làm chủ theo kỹ năng, tối đa 20 lượt gần nhất, thiếu dữ liệu → "Chưa đủ dữ liệu").
- Tính từ `lich_su_on`, `tra_loi_bai_luyen` bằng truy vấn tổng hợp; lọc ngày theo múi giờ User.

### [ ] B2.11 Quản trị nền — FR-13, TC-17
- `V7__admin.sql`: `nhat_ky_quan_tri`.
- API: `GET /admin/users`, `PATCH /admin/users/{id}/status` (khóa/mở → hủy phiên), `PUT /admin/users/{id}/roles` (**không bỏ quyền Admin cuối cùng**), CRUD `/admin/decks`, `/admin/cards` (bộ mẫu: xuất bản/ẩn), `GET /admin/audit-logs`.
- Mọi thao tác quan trọng ghi nhật ký: người làm, hành động, đối tượng, lý do, trước/sau (đã lọc dữ liệu nhạy cảm).
- **Cuối Đợt 2 →** `/fe-report DOT2`.

---

## Đợt 3 — AI, phát âm, động lực & vận hành (09/11–29/11) · FR-08, 09, 10, 12, 14

### [ ] B3.1 Tác vụ nền & hạn mức dịch vụ — FR-09
- `V8__jobs_ai.sql`: `tac_vu_nen`, `han_muc_dich_vu`, `su_dung_dich_vu`, `yeu_cau_ai`, `ban_nhap_the_ai`.
- `JobService.enqueue(type, payload)`; `JobWorker` `@Scheduled` lấy việc bằng `SELECT … FOR UPDATE SKIP LOCKED`, retry hữu hạn có backoff, trạng thái `CHO/DANG_CHAY/XONG/LOI/KHONG_XAC_DINH`.
- `QuotaService`: giữ chỗ hạn mức **nguyên tử** (UPDATE có điều kiện) trước khi gọi API, hoàn trả khi lỗi xác định; hết hạn mức → 429.

### [ ] B3.2 Adapter AI & tạo thẻ từ đoạn văn — FR-09, TC-12, TC-13
- Interface `AiClient` + `OpenAiClient` (gọi bằng `RestClient`, timeout) + `FakeAiClient` (profile dev/test, dùng cho demo "AI lỗi").
- API: `POST /ai/card-drafts` → 202 + requestId; `GET /ai/requests/{id}`; `POST /ai/card-drafts/{id}/commit` (chỉ lưu thẻ đã chọn, `Idempotency-Key`).
- Prompt có phiên bản, tách chỉ dẫn hệ thống với đoạn văn User; kiểm schema JSON đầu ra, bỏ mục không hợp lệ, đánh dấu trùng.

### [ ] B3.3 Các tác vụ AI khác — FR-09
- API: `POST /ai/context-explanations`, `POST /ai/sentence-feedback` (giải thích tiếng Việt), `POST /ai/exercise-drafts`, `GET /ai/history`, `GET /me/service-quota`.
- AI lỗi/timeout **không chặn** học SRS và bài cố định.

### [ ] B3.4 Phát âm — FR-10, TC-14
- `V7__speaking.sql`: `ket_qua_phat_am`.
- API: `GET /cards/{id}/audio` (TTS, cache theo nội dung+giọng+phiên bản), `POST /pronunciation/assessments` (multipart, ≤ 15 giây), `GET /pronunciation/assessments/{id}`, `GET /pronunciation/history`, `DELETE /pronunciation/recordings/{id}`.
- Interface `SpeechClient` + Azure Speech adapter + Fake (gắn nhãn "Mô phỏng"). Chỉ số thiếu → `null`, không sinh điểm giả.

### [ ] B3.5 Gợi ý có lý do — FR-08
- API: `GET /learning/recommendations` trả `{reasonCode, message, cardIds, evidence}` với QUEN_NHIEU, SAI_CHINH_TA, CAP_DE_NHAM, PHAT_AM_THAP, QUA_HAN_NHIEU (TK §8.3). Ngưỡng trong `application.yml`.

### [ ] B3.6 Điểm thưởng, chuỗi ngày, huy hiệu, thử thách — FR-12, TC-15
- `V8__engagement.sql`: `so_diem_thuong`, `huy_hieu`, `nguoi_dung_huy_hieu`, `thu_thach`, `tien_do_thu_thach`.
- `RewardService` gọi từ B2.4/B2.8: unique `(nguoi_dung_id, loai_su_kien, su_kien_id)`; trần điểm/ngày; chuỗi ngày khi phiên có ≥ 5 lượt hợp lệ (TK §15.1).
- API: `GET /rewards/history`, `GET /badges`, `GET /challenges`; Admin: CRUD `/admin/badges`, `/admin/challenges` (TK §4.2).

### [ ] B3.7 Thông báo & nhắc học — FR-12, TC-15
- `V9__notification_report.sql`: `thong_bao`, `bao_cao_noi_dung`.
- API: `GET /notifications`, `PATCH /notifications/{id}`; `POST /admin/announcements`.
- Scheduler mỗi 15 phút: gửi nhắc theo giờ + múi giờ User, khóa chống trùng (user, loại, ngày địa phương); tôn trọng cài đặt tắt kênh.

### [ ] B3.8 Báo cáo nội dung & kiểm duyệt — FR-13
- API: `POST /reports` (bộ/thẻ/đầu ra AI, chống gửi trùng), `GET /admin/reports`, `POST /admin/reports/{id}/resolve` (giữ/ẩn/yêu cầu sửa/từ chối + lý do, ghi nhật ký, thông báo người liên quan).

### [ ] B3.9 Tổng kết tuần — FR-11
- API: `GET /statistics/weekly-summary`: từ đã học, kỹ năng tiến bộ, 3 từ khó, mục tiêu tuần sau. Văn bản từ mẫu; số liệu không lấy từ AI.

### [ ] B3.10 Xóa tài khoản & dữ liệu — FR-14, TC-16
- `V10__privacy.sql`: `yeu_cau_xoa_du_lieu`.
- API: `POST /me/deletion-requests`; job nền xóa dữ liệu riêng, tệp S3, phiên Redis; ẩn danh nội dung đã chia sẻ theo chính sách.
- Admin: `GET /admin/deletion-requests` theo dõi tiến độ xóa (TK §4.2).

### [ ] B3.11 Quản trị vận hành — FR-13
- API: `GET/PUT /admin/service-quotas`, `GET /admin/service-usage` (lượt, lỗi, thời gian, chi phí; chưa có đơn giá → "Chưa xác định"), `GET /admin/statistics`, `GET /admin/jobs`.
- **Cuối Đợt 3 →** `/fe-report DOT3`.

---

## GĐ4 — Kiểm thử & ổn định (30/11–06/12)

### [ ] B4.1 Phủ kiểm thử nghiệm thu TC-01…TC-20
- Mỗi TC ở TK §19 có ít nhất một test tự động (trừ TC-18 thủ công, TC-19/20 có biên bản). Bảng truy vết `FR ↔ API ↔ TC` trong `docs/`.

### [ ] B4.2 Rà soát bảo mật
- Chạy `/security-review`; kiểm rate limit (đăng nhập, quên mật khẩu, upload, AI, báo cáo), kiểm quyền cha–con, không log token/mật khẩu/khóa, CORS/CSRF, header bảo mật.

### [ ] B4.3 Hiệu năng — TC-20
- Dữ liệu minh họa + k6/JMeter 50 User đồng thời; ghi p95, tỷ lệ lỗi. Thêm index thiếu theo `EXPLAIN`.

### [ ] B4.4 Sao lưu & khôi phục — TC-19
- Script `mysqldump` hằng ngày + `aws s3 sync` kho S3; thử khôi phục sang môi trường mới, ghi biên bản thời gian/kết quả.

### [ ] B4.5 Log & giám sát
- Log JSON có `requestId`; Actuator health/metrics; cảnh báo job lỗi nhiều.
- **Cuối GĐ4 →** `/fe-report GD4`.

---

## GĐ5 — Triển khai & bàn giao (07/12–14/12)

### [ ] B5.1 Compose production
- `docker-compose.prod.yml`: Nginx reverse proxy (FE + `/api` cùng domain), HTTPS, không mở cổng MySQL/Redis/S3 ra ngoài, biến bí mật qua `.env` không commit.

### [ ] B5.2 Dữ liệu demo — TK §20.1
- 1 Admin, 3 User có lịch sử khác nhau, 6–10 bộ giao tiếp/TOEIC (200–300 thẻ), thẻ quá hạn, cặp nhầm, AI nháp, một báo cáo, một ca dịch vụ lỗi.

### [ ] B5.3 Tài liệu
- Xuất `openapi.json`; hướng dẫn cài đặt/vận hành trong `huong-dan/`; danh sách hạn chế đã biết.

### [ ] B5.4 Diễn tập demo — TK §20.2
- Chạy kịch bản 10 bước trên môi trường sạch; sửa lỗi phát sinh.
- **Cuối GĐ5 →** `/fe-report GD5`.

---

## Definition of Done chung (mọi bước)

- [ ] Compile qua; test của bước chạy xanh (`./mvnw -q test -Dtest=...`).
- [ ] Migration mới là file `V<n>__*.sql`, không sửa file đã chạy.
- [ ] Quyền kiểm ở service; tài nguyên riêng người khác → 404.
- [ ] Lỗi trả đúng format B0.4; không lộ stack trace/thông tin nhạy cảm.
- [ ] Swagger hiển thị endpoint mới; Postman cập nhật (`/postman-sync`) nếu có.
- [ ] Tick checkbox bước trong file này.

## graphify — bản đồ mã nguồn

- Đã cài package Python `graphifyy` (CLI `graphify`) và tích hợp Claude Code (`graphify claude install`).
- Tạo/cập nhật đồ thị: `/graphify` (lần đầu, có tài liệu) hoặc `graphify update .` (chỉ code, không cần LLM) sau mỗi bước lớn.
- Tra cứu: `graphify query "luồng ghi kết quả ôn"`, `graphify path "ReviewService" "tien_do_the"`, `graphify explain "SrsCalculator"`.
- Kết quả ở `graphify-out/` (đã loại `cache/` khỏi git).
