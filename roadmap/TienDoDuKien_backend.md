# ROADMAP BACKEND — VocabLearning (VocabFlow)

> **Lưu ý tham chiếu (20/10/2026):** các đường dẫn `report/`, `verification/`, `postman/`, `data/csv/`, `huong-dan/`, `GD0_BAO_CAO_FE.md`, `DOI_CHIEU_BE_GD0_B1_8_2026_10_05.md` trong tài liệu này là bằng chứng lịch sử và **không còn trong checkout**. Bàn giao hiện hành nằm ở `ban-giao-cho fe/`. Không dùng các đường dẫn đó làm bằng chứng kiểm chứng.

> Cập nhật 05/10/2026: đợt sửa bao phủ GĐ0–B1.8 (B1.9–B1.12 và B2.1–B2.2 đã xong về sau, xem các bước bên dưới). Host trong cấu hình có default/Compose override, không phải tất cả cần khai báo trong .env.example. Google placeholder dev dùng để boot; OAuth thật cần credentials hợp lệ. Kết quả kiểm chứng cuối đợt theo DOT1_BAO_CAO_FE và báo cáo đối chiếu.

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
| **Đợt 2** — Học & luyện | 26/10–08/11 | FR-06, 07, 11, 13: SRS, phiên học, bài luyện, sổ tay, thống kê, quản trị, bảng điều khiển | B2.1–B2.12 |
| **Đợt 3** — AI & mở rộng | 09/11–29/11 | FR-08, 09, 10, 12, 14: AI, phát âm, gợi ý, thưởng, nhắc, kiểm duyệt, xóa dữ liệu | B3.1–B3.11 |
| **GĐ4** — Kiểm thử & ổn định | 30/11–06/12 | TC-01…20, hiệu năng, sao lưu/khôi phục | B4.1–B4.5 |
| **GĐ5** — Triển khai & bàn giao | 07/12–14/12 | Compose production, dữ liệu demo, OpenAPI, tài liệu | B5.1–B5.4 |

Sau bước cuối mỗi giai đoạn: chạy `/fe-report <GĐ>` để bàn giao cho FE.
Lịch theo tuần (S1–S11) ghép BE ↔ FE: `roadmap/SPRINT_PLAN.md`; bước FE: `roadmap/TienDoDuKien_fronend.md`.

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
    │   ├── application.yaml  application-dev.yaml
    │   └── db/migration/V1__account.sql …   db/seed/R__seed_dev.sql  R__library_starter.sql
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
- **Xong khi:** `./mvnw -q -DskipTests compile` chạy qua; một mapper thử (thực tế là `ToolingMapperTest`) MapStruct + Lombok sinh được code trong `target/generated-sources`.

### [x] B0.2 Docker Compose môi trường dev
- `docker-compose.yml`: `mysql:8.4` (cổng host 3307, `utf8mb4`, TZ UTC, healthcheck), `redis` (6379), `s3` = RustFS (9000/9001) + `s3-init` tạo bucket bằng aws-cli, `mailpit` (1025/8025), `api` (chỉ khi `--profile app`).
- `.env.example` chỉ có tên biến và giá trị dev giả: `DB_NAME, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AI_API_KEY, SPEECH_KEY, APP_FRONTEND_URL`. Bản thực tế của `.env.example` (nguồn duy nhất, không nhắc lại ở nơi khác) gồm thêm `API_PORT, DB_PORT, S3_PUBLIC_ENDPOINT, FORWARD_HEADERS_STRATEGY, COOKIE_SECURE, SWAGGER_ENABLED, GOOGLE_REDIRECT_URI` (MAIL_HOST do Compose đặt, MAIL_PORT mặc định 1025); `REDIS_HOST` và `S3_ENDPOINT` do Compose đặt cho container `api`.
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
- Profile mặc định dev kết nối localhost:3307; Compose truyền DB_HOST/REDIS_HOST/S3_ENDPOINT/MAIL_HOST, không có profile docker riêng (cấu hình host qua biến môi trường). Test dùng profile test và Testcontainers.
- **Xong khi:** `docker compose up -d` → các service có healthcheck healthy, Mailpit chạy và s3-init hoàn tất thành công; `docker compose --profile app up -d --build` → `GET /actuator/health` trả `UP`.
- **Sửa 03/11/2026 (RS-041, RS-042, RS-043, RS-044):** ghim image `rustfs/rustfs:1.0.3`, `amazon/aws-cli:2.38.5`, `axllent/mailpit:v1.32.0`; cổng MySQL/Redis/S3/Mailpit chỉ mở trên `127.0.0.1`; mật khẩu DB và khóa S3 bắt buộc lấy từ `.env` (`:?`); container `api` đọc `.env` bằng `env_file`, vẫn mặc định profile `dev`; CORS bucket sinh từ `S3_CORS_ORIGINS` (`docker/s3-init.sh`, bỏ `s3-cors.json`); README dùng `docker compose` và có bước copy `.env`. Đã chạy `docker compose config` và `docker compose up -d`: 5 dịch vụ healthy, s3-init exit 0, `get-bucket-cors` trả đúng 4 origin.

### [x] B0.3 Cấu hình ứng dụng & Flyway
- `application.yaml`: datasource, `spring.jpa.hibernate.ddl-auto=validate`, `open-in-view=false`, `hibernate.jdbc.time_zone=UTC`, naming snake_case mặc định, Flyway bật, `spring.session.data.redis`, multipart giới hạn, Jackson ISO-8601.
- `V1__account.sql`: `nguoi_dung`, `vai_tro`, `nguoi_dung_vai_tro`, `danh_tinh_oauth`, `token_tai_khoan`, `ho_so_hoc_tap`, `cai_dat_thong_bao` (TK §12.2). Seed 2 vai trò `USER`, `ADMIN`.
- Dev seed tách riêng `db/seed/` (chỉ bật khi kích hoạt tường minh profile `dev`, không còn profile mặc định; Compose `api` đặt `SPRING_PROFILES_ACTIVE=dev` mặc định, ghi đè khi triển khai): 1 Admin, 3 User mẫu.
- **Xong khi:** app khởi động, Flyway áp V1, `validate` không báo lỗi.
- **Sửa 03/11/2026 (RS-013, RS-057):** `application.yaml` bỏ giá trị mặc định cho `DB_USER`, `DB_PASSWORD`, `GOOGLE_CLIENT_ID/SECRET`, `S3_ACCESS_KEY/SECRET`; `COOKIE_SECURE` mặc định `true`, `SWAGGER_ENABLED` mặc định `false`. Giá trị dev chuyển sang `application-dev.yaml`, giá trị test sang `src/test/resources/application-test.yaml`. `RequiredSettingsConfig` dừng app khi thiếu hoặc rỗng (test `RequiredSettingsConfigTest`). Kiểm chứng 03/11/2026: `./mvnw -B test` 363/363; container `api` (profile dev) readiness 200, Flyway lên V12, `nhac_hoc DEFAULT '0'`; chạy không profile với `S3_SECRET_KEY` rỗng thì app dừng với `Missing required setting app.s3.secret-key`. `V12__nhac_hoc_default_false.sql` đổi default `cai_dat_thong_bao.nhac_hoc` thành `FALSE` cho khớp `CaiDatThongBao.defaultFor`; migration quản trị B2.11 dùng số kế tiếp.

### [x] B0.4 Xử lý lỗi & tiện ích web chung
- `ErrorCode` (enum 18 mã từ 30/10/2026 khi thêm `CSRF_INVALID` 403; trước đó 17 mã, thêm `UNSUPPORTED_MEDIA_TYPE` 415 và `METHOD_NOT_ALLOWED` 405 ở cuối danh sách; nhóm 15 mã gốc: `VALIDATION_FAILED, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, VERSION_CONFLICT, BUSINESS_RULE, RATE_LIMITED, DEPENDENCY_DOWN, INTERNAL_ERROR` (500), `TOKEN_INVALID, INVALID_CREDENTIALS, EMAIL_NOT_VERIFIED, ACCOUNT_LOCKED`, `OAUTH_LINK_REQUIRED` (chỉ dùng làm tham số redirect `?loi=`)) → HTTP 400/401/403/404/409/409/422/429/503/500/400/401/403/403/409 theo đúng thứ tự liệt kê. Lỗi `RATE_LIMITED` (429) kèm header `Retry-After` (giây còn lại của cửa sổ, đọc từ TTL Redis). Thiếu header bắt buộc trả `VALIDATION_FAILED` kèm `fieldErrors[].field` là tên header; tệp quá giới hạn trả thông điệp riêng. `POST /decks/{id}/cards` trả `Location: /api/v1/cards/{id}` dù chưa có `GET /cards/{id}` (giữ có chủ đích, FE không nên gọi).
- `ApiException(ErrorCode, message)`; `GlobalExceptionHandler` trả `{code, message, fieldErrors, requestId}` (TK §13.1), **không** trả stack trace.
- `RequestIdFilter`: sinh `X-Request-Id`, đưa vào MDC log.
- `PageResponse<T>(items, page, size, totalElements, totalPages)`; `BaseEntity` với `createdAt`, `updatedAt` (JPA Auditing).
- Bean `Clock` UTC.
- **Xong khi:** test MockMvc: body sai → 400 có `fieldErrors`; id không tồn tại → 404 có `requestId`.

### [x] B0.5 Bảo mật nền
- `SecurityConfig`: phiên lưu Redis (Spring Session), cookie `HttpOnly`, `SameSite=Lax`, `Secure` chỉ khi `COOKIE_SECURE=true` (mặc định false, không tự nhận HTTPS; **bắt buộc bật khi triển khai production**); CSRF bằng `CookieCsrfTokenRepository` (header `X-XSRF-TOKEN`); CORS chỉ cho `APP_FRONTEND_URL`.
- Phân quyền URL: `/api/v1/auth/**`, `/api/v1/library/**`, `/api/v1/public/**`, Swagger, health → `permitAll`; `/api/v1/admin/**` → `ADMIN`; còn lại → đăng nhập.
- 401/403 trả JSON theo B0.4. `PasswordEncoder` = BCrypt. `CurrentUser` lấy id người đang đăng nhập.
- `RateLimiter` đơn giản: đếm `INCR` + `EXPIRE` trên Redis theo khóa (IP/user + hành động).
- **Xong khi:** gọi API cần đăng nhập → 401 JSON; POST thiếu CSRF → 403.
- **Sửa bảo mật lô 2 (03/11/2026; RS-001, RS-012, RS-014, RS-015, RS-032, RS-034, RS-051, RS-053; các ngưỡng là đề xuất):**
  - `RateLimiter` dùng Lua script nguyên tử (INCR + PEXPIRE khi khóa chưa có TTL), thêm `requireBelow`/`hit`.
  - `FORWARD_HEADERS_STRATEGY` mặc định `native` (application.yaml, compose, .env.example), để IP client lấy từ `X-Forwarded-For` do proxy nội bộ gửi.
  - Đăng nhập khóa theo email+IP 5/15′, IP 30 lần sai/15′, email 20 lần sai/1 giờ; `resetPassword` nhận IP.
  - `@MaxUtf8Bytes(72)` cho mật khẩu ở đăng ký, đăng nhập, đặt lại và đổi mật khẩu.
  - Cookie `XSRF-TOKEN` đặt `SameSite=Lax` và `Secure` theo `COOKIE_SECURE`; CORS expose `Retry-After`.
  - URL PUT ký `contentLength` bằng `kichThuoc`.
  - PKCE đã có sẵn (Spring Security 7), nay có test khẳng định.
  - Test mới: `FR01LoginTest` (5), `FR01ForwardedIpTest` (1), `RateLimiterTest.tc04`, `StorageServiceTest.signedPutRejectsBodyLargerThanDeclared`, assert PKCE trong `FR01GoogleLoginTest`.
  - **Kiểm chứng:** `./mvnw -B test` 340 test, 0 lỗi, BUILD SUCCESS. **Chưa kiểm chứng:** gọi HTTP qua Next.js thật, Postman.

### [x] B0.6 OpenAPI & quy ước API
- springdoc: nhóm theo module, mô tả cookie session + CSRF. Tiền tố `/api/v1`, JSON camelCase, **tên trường DTO = tên field entity** (`tenHienThi`, `trangThai`…), ID trả dạng string.
- **Xong khi:** Swagger UI mở được, có endpoint `GET /api/v1/public/ping`.
- **Đã làm (GĐ0, ghi bổ sung 03/11/2026, RS-020):** `OpenApiConfig` (nhóm `all` và 7 nhóm module, scheme cookie `SESSION` và header `X-XSRF-TOKEN` gắn theo route), `PingController` (`GET /api/v1/public/ping`). Test `ApiDocsTest` 4/4 trong bộ đầy đủ 363/363 ngày 03/11/2026. Swagger mặc định tắt từ 03/11/2026, bật ở profile `dev`/`test`. Flow: [B0.6](../docs/luong-backend/B0.6-openapi-quy-uoc-api.md).

### [x] B0.7 Nền kiểm thử
- `AbstractIntegrationTest`: `@SpringBootTest` + MockMvc + Testcontainers (MySQL 8.4, Redis) dùng `@ServiceConnection`.
- Tên test theo mã: `FR01RegisterTest`, phương thức đặt theo mã yêu cầu thực tế (`fr02_...`, `fr03_...`; tiền tố `tcNN_` chỉ ở các test cũ). Swagger UI mở ở `/swagger-ui/index.html` (cũng chuyển hướng từ `/swagger-ui.html`); health dùng `/actuator/health/readiness`. Dockerfile trong roadmap chỉ là mẫu, bản thật nằm ở `backend/k28/Dockerfile`. CORS của S3 cho phép origin cổng 3000 và 3100 (từ 03/11/2026 sinh từ `S3_CORS_ORIGINS` bằng `docker/s3-init.sh`).
- **Xong khi:** `./mvnw -q verify` chạy qua với Docker đang bật.
- **Sửa nền test (03/11/2026, RS-003/RS-004/RS-040):** `pom.xml` thêm profile `windows-tests` (`-Djdk.net.unixdomain.tmpdir=${env.PUBLIC}`) và cho surefire nạp `-javaagent` Mockito qua `maven-dependency-plugin:properties`. Sửa 2 test đã cũ theo hành vi đúng: `FR05CsvTest.tc04_…` kỳ vọng 415 `UNSUPPORTED_MEDIA_TYPE` (TK §13.2: `mapping` là JSON), `IntegrationSetupTest.xsrfHelperPassesCsrfFilter` kỳ vọng 405 `METHOD_NOT_ALLOWED`. **Kiểm chứng:** `./mvnw -B test` không đặt `JAVA_TOOL_OPTIONS`: 332 test, 0 lỗi, BUILD SUCCESS.
- **Đã làm (GĐ0, ghi bổ sung 03/11/2026, RS-020):** `AbstractIntegrationTest` khởi động MySQL, Redis, RustFS, Mailpit một lần cho cả lượt chạy, tạo bucket, nối qua `@ServiceConnection`/`@DynamicPropertySource`; tiện ích `xsrf()`, `randomIp()`, `toJson()`. Ngày 03/11/2026 ghim image test `rustfs/rustfs:1.0.3`, `axllent/mailpit:v1.32.0` và thêm profile `test` (`application-test.yaml`). Flow: [B0.7](../docs/luong-backend/B0.7-nen-kiem-thu.md).

### [x] B0.8 Kho lưu tệp & email
- `StorageService`: tạo presigned PUT/GET (hết hạn ngắn), xóa object; bucket riêng tư.
- `MailService`: gửi mail HTML đơn giản qua SMTP (Mailpit khi dev), gửi **sau commit** bằng `@TransactionalEventListener(AFTER_COMMIT, fallbackExecution = true)` + `@Async`; nếu phát sự kiện ngoài transaction thì mail được gửi ngay.
- **Xong khi:** test tích hợp upload/download qua URL ký; gửi mail thử thấy trong Mailpit.

---

## Đợt 1 — Tài khoản, hồ sơ & nội dung (12/10–25/10) · FR-01…05

### [x] B1.1 Đăng ký & xác thực email — FR-01, TC-01
- API: `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-verification`.
- Tạo `nguoi_dung` trạng thái `CHUA_XAC_THUC`; token ngẫu nhiên, **chỉ lưu `token_hash`** (SHA-256), có `het_han_at`, `da_dung_at` (dùng một lần). Email trùng → 409. Rate limit đăng ký/gửi lại.
- **Xong khi:** token sai/hết hạn/dùng lần 2 bị từ chối; mật khẩu lưu BCrypt.
- **Đã làm:** `FR01RegisterTest` 8 test xanh (nay 9, bộ đầy đủ 03/11/2026).

### [x] B1.2 Đăng nhập, đăng xuất, thông tin phiên — FR-01
- API: `POST /auth/login`, `POST /auth/logout`, `GET /me`, `GET /auth/csrf`.
- Chưa xác thực email hoặc bị khóa → từ chối có mã lỗi riêng; sai mật khẩu nhiều lần → 429. Đăng nhập thành công đổi session id (chống fixation). Logout xóa session Redis.
- **Xong khi:** sau logout, cookie cũ gọi `/me` → 401.
- **Đã làm:** `FR01LoginTest` 9 test xanh (nay 15 sau lô 2 rà soát, bộ đầy đủ 03/11/2026); mã lỗi `INVALID_CREDENTIALS` 401, `EMAIL_NOT_VERIFIED` 403, `ACCOUNT_LOCKED` 403; khóa 5 lần sai/15 phút theo email.

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
- **Sửa lỗi RS-052 (03/11/2026):** `TepTin.objectKey` bị thêm `updatable = false` ở commit `ca5f78d` (20/10), nên `complete` không lưu key `files/…`. Đã bỏ ràng buộc này và thêm 2 test vào `FR03FilesTest`. Trên entity cũ có 3 test fail; sau khi sửa `FR03FilesTest` 15/15 pass. Chạy `FR03*,FR04*,FR05*,FR07*`: 175 test, 1 fail đã biết (`FR05CsvTest.tc04_…`, RS-004). Không đổi API, không migration. Chi tiết: [rà soát](../docs/ra-soat/RA_SOAT_2026-10-31.md).

### [x] B1.7 Chủ đề, nhãn, trình độ — FR-03, FR-13
- `V4__content.sql`: `chu_de`, `chu_de_yeu_thich`, `nhan`, `bo_the`, `the_tu_vung`, `the_nhan`, `the_tep`, `bo_yeu_thich` (8 bảng). V2/V3 đã dùng cho tệp và cleanup.
- Nợ từ B1.5: chủ đề yêu thích của người học (bảng nối `nguoi_dung` ↔ `chu_de`, tối đa 5) + thêm vào `GET/PUT /me/learning-settings`.
- Public: `GET /public/topics`. Admin: CRUD `/admin/topics`, `/admin/tags`.
- **Đã làm 03/10/2026:** 11 API danh mục (B1.9 thêm `GET /public/tags` thành 12); cập nhật `GET/PUT /me/learning-settings` với `chuDeIds` bắt buộc, tối đa 5 ID tồn tại và không trùng. PUT danh mục kèm `version`; xóa danh mục đang được tham chiếu trả 409, không cascade. Trình độ dùng enum hiện có, không có API CRUD trình độ.
- **Kiểm chứng 05/10/2026:** FR03CatalogTest 14/14 pass trong toàn suite 117/117. Có kiểm thử tạo trùng đồng thời, sửa cùng version, xóa đồng thời cho cả topics/tags; fixture FK bo_the/the_nhan và chủ đề người học. 62 lượt HTTP ngày03/10 là bằng chứng lịch sử. FR-13 audit log thuộc giai đoạn sau.
- **Bàn giao:** `report/DOT1_BAO_CAO_FE.md` mục 5.12, 5.21–5.31; `docs/luong-backend/B1.7-chu-de-nhan-chu-de-yeu-thich.md`; Postman thêm 15, cập nhật 3 request. Mockup B1.7 và Next.js đã đồng bộ DTO/method/version/409; mockup vẫn là demo.

### [x] B1.8 Bộ thẻ cá nhân — FR-03, TC-02
- API: `GET/POST /decks`, `GET/PATCH/DELETE /decks/{id}`, `PUT/DELETE /decks/{id}/favorite`.
- Quyền `RIENG_TU/CONG_KHAI`; chỉ chủ sở hữu sửa; bộ người khác → 404. Xóa bộ đã có lịch sử học → xóa mềm. `@Version` chống ghi đè.
- **Đã triển khai 04/10/2026:** 7 API; quản lý chỉ bộ của mình; yêu thích bộ của mình hoặc bộ công khai `BINH_THUONG`. PATCH nhận `version` trong body; DELETE bộ nhận query `version`. Dùng schema V4 hiện có, không thêm/sửa migration; xóa mềm mọi bộ bằng `xoa_at`.
- **Kiểm chứng lịch sử 04/10:** 6a đạt 8/8 và 6b đạt 26/26 lượt HTTP trên localhost:8080 (tổng 34/34, không tính bước đăng nhập). Đã kiểm tra phiên bản cũ, thiếu version, phân quyền cả bộ riêng tư/công khai và thao tác yêu thích lặp lại. `FR03DeckTest` có 11 lượt dự kiến nhưng chưa xác nhận kết quả chạy; không tuyên bố suite pass.
- **Đã bổ sung 05/10/2026:** FR03DeckTest 11/11 pass: xóa mềm bảo toàn thẻ/favorite/bộ nguồn, version cũ, sai chủ sở hữu, bộ ẩn và hai transaction cập nhật. Newman trên BE8081 xác nhận DELETE204, GET sau xóa404 và version cũ409. B1.8 đã đủ bằng chứng để đánh dấu hoàn tất; lịch sử bị429 không còn là trạng thái hiện tại.
- **Báo cáo và bàn giao:** báo cáo Đợt1 (không còn trong repo) mục 5.32–5.38 và mục10; `docs/luong-backend/B1.8-bo-the-ca-nhan.md`; Postman thêm 12 request, biến `deckVersion`, `deckOldVersion`, `foreignDeckId` trong cả hai môi trường.


- **Đã chốt và làm 03/11/2026 (RS-056):** `DeckResponse.soThe` (số thẻ chưa xóa, ở list/get/create/copy) và `GET /decks?yeuThich=true` (bộ đã yêu thích: của mình hoặc công khai `BINH_THUONG` chưa xóa của người khác, sắp theo lúc yêu thích mới nhất; `yeuThich` không phải boolean → 400). Test `FR03DeckTest.fr03_favoriteListShowsVisibleFavoritesWithCardCounts`. Mockup UI13 đã gọi query mới.
- **Phạm vi bước sau:** mục tiêu bộ, số thẻ, tìm kiếm toàn bộ thư viện và favorite listing phải chốt trước B1.9/B1.10. Mục tiêu hồ sơ không tự trở thành mục tiêu bộ.

### [x] B1.9 Thẻ từ vựng — FR-03, TC-02
- API: `GET/POST /decks/{id}/cards`, `PATCH/DELETE /cards/{id}`.
- Trường: từ, từ loại, nghĩa, IPA, ví dụ EN, bản dịch, độ khó, nguồn, ảnh/âm (`the_tep`). Kiểm tra quyền **cả bộ cha**. Cảnh báo trùng theo từ + từ loại đã chuẩn hóa (không chặn).
- **Triển khai 06/10/2026:** đã có controller/service bốn API thẻ; nhãn qua `the_nhan`, tệp qua `the_tep`; khóa bộ cha khi ghi, xóa mềm giữ liên kết, PATCH tăng version cả khi chỉ sửa liên kết. Bổ sung `GET /public/tags` phân trang để đọc nhãn và chuẩn hóa khoảng trắng Unicode. Dùng schema V4 hiện có, không sửa migration.
- **Kiểm chứng 06/10/2026:** người dùng xác nhận build/test đã pass, chưa cung cấp log hoặc số lượng. Lượt HTTP riêng B1.9 tại localhost:8080 đạt 77/77 lượt HTTP và 19/19 assertion dữ liệu/kết quả; không cộng thành số test JUnit. Bằng chứng: HTTP B1.9 (không còn trong repo). Đã kiểm tra CRUD, quyền USER, Unicode/trùng, nhãn/tệp, rollback, version/no-op, xóa mềm giữ liên kết và hai PATCH đồng thời cùng version. Bộ cha xóa mềm được chuẩn bị bằng SQL trên bộ thử mới; không gọi lại HTTP xóa bộ B1.8.
- **Suite bổ sung 06/10/2026:** Sau sửa baseline, người dùng xác nhận FR03CardTest đã pass toàn bộ; agent không chạy JUnit và chưa có log để xác nhận số lượt thực chạy. Source có16 phương thức/22 lượt dự kiến, không ghi thành22/22 quan sát được. Bao phủ CRUD/validation/Unicode/trùng, USER/ADMIN/guest/CSRF, bộ cha xóa mềm, nhãn/tệp/version, rollback JPA+JDBC, bảo toàn liên kết/avatar/S3 và hai PATCH đồng thời.
- **HTTP ADMIN 06/10/2026:** đạt9/9 kiểm tra riêng (own CRUD4, foreign public404 cả4 API, xác nhận role1). Evidence (không còn trong repo). Quyền ADMIN thử đã thu hồi và logout. Chờ hạn mức hết tự nhiên, không sửa/xóa rate limit; không chạy lại B1.8 đã bỏ qua. Postman đã bàn giao theo ghi nhận bên dưới; B1.9 hoàn tất trong phạm vi BE, kiểm chứng và đồng bộ.
- **Bàn giao:** báo cáo Đợt 1 mục5.39 và mục10 đối chiếu06/10; [luồng B1.9](../docs/luong-backend/B1.9-the-tu-vung.md). Postman thêm28 request cho5 API, collection108 request; cả hai environment thêm12 biến, giữ biến cũ. Đã khôi phục registry/export và README (không còn trong repo). Evidence đồng bộ (không còn trong repo), HTTP mẫu5/5 (không còn trong repo); chưa chạy script Postman/Newman mới. Không sửa FE/mockup.
- **Đối chiếu bổ sung06/10:** DTO/entity khớp V4; giữ4 API quản lý thẻ (không có GET riêng /cards/{id}), ownership cả bộ cha, cảnh báo trùng không chặn, PATCH thẻ tăng version kể cả no-op. Suite CRUD đã pass theo người dùng; HTTP ADMIN9/9 đã kiểm chứng; Postman đã đồng bộ, đủ đóng bước B1.9; quét trùng toàn bộ bộ là điểm tối ưu sau khi đo.

### [x] B1.10 Thư viện công khai — FR-04
- API: `GET /library/decks` (q, chủ đề, trình độ, mục tiêu, nguồn, sắp xếp, phân trang), `GET /library/decks/{id}`.
- Quyết định A: chỉ `CONG_KHAI` + `BINH_THUONG` + `xoa_at IS NULL`; schema không có pending/approved, không triển khai duyệt trước. Nhãn "Bộ mẫu"/"Người học chia sẻ" ánh xạ `bo_mau` theo V5. Dùng JPA `Specification`.
- Bộ khởi động sau onboarding (TK §6.1 bước 5): lọc theo mục tiêu/trình độ trong `ho_so_hoc_tap`. `GET /library/decks/{id}` là link chia sẻ công khai.
- Media guest: `GET /library/decks/{id}/cards/{cardId}/files/{role}` cho ANH/AM_TU/AM_CAU; kiểm tra bộ/thẻ/tệp/liên kết, không mở quyền endpoint files chung.
- Hoàn tất08/10/2026: compile BE, FR04 Library/Media/Onboarding/Seed41/41 (19+11+2+9 trong lượt cuối), FE9/9, build thành công, lint0 error/3 warning. Newman BE8081 đạt28 request/79 assertion; Next3000 đạt28/79 ở lượt riêng. HTTP media6 kiểm tra và3 download/hash đạt. Không cộng các lượt riêng, không chạy lại HTTP6 B1.8.
- FE thật: danh sách/chi tiết/link/media, URL filter/paging; onboarding lấy bộ mẫu từ mục tiêu/trình độ đã lưu. Seed dev8 bộ/24 thẻ tự biên soạn, đủ2×4; production không tự seed. Không kéo sao chép/admin sang B1.10.
- Postman cloud thêm28 request, tổng136; giữ108 cũ và collection events. Hai environment52 biến, giữ45 cũ, thêm7 B1.10. Runner/registry (không còn trong repo), evidence (không còn trong repo).
- [Luồng B1.10](../docs/luong-backend/B1.10-thu-vien-cong-khai.md), [báo cáo bàn giao hiện có](<../ban-giao-cho fe/SPRINT_1_BAO_CAO_BE_BAN_GIAO_CHO_FE.md>), kiểm chứng tổng hợp (không còn trong repo), UI (không còn trong repo).


### [x] B1.11 Sao chép bộ — FR-04, TC-03
- API: `POST /decks/{id}/copy` với header `Idempotency-Key`.
- Tạo bộ + thẻ mới, giữ `bo_nguon_id`; **không** sao chép tiến độ/lịch sử/điểm. Gửi lại cùng key → trả kết quả cũ.
- **Sửa 03/11/2026 (RS-059):** copy bộ sao chép từng tệp thành `tep_tin` mới của người gọi (S3 CopyObject); `countCardReferences` chỉ đếm thẻ và bộ chưa xóa; snapshot cũ không có `soThe` được bù khi replay. Test `FR04DeckCopyTest.tc03_copyOwnsItsMediaSoAuthorCanDeleteSourceFile`, `tc03_copyResponseCountsCardsAndOldSnapshotsStillReplay`.
- **Triển khai10/10:** V6 ghi key theo người dùng và snapshot DeckResponse; copy chỉ nguồn công khai bình thường chưa xóa, bộ mới riêng tư/không mẫu. Nhãn dùng liên kết mới, tệp dùng chung có kiểm tra quyền qua bộ đích. Gửi cùng key khác nguồn409; rollback toàn bộ khi tệp nguồn lỗi. FE nối API thật, giữ key khi retry/reload, mở và sửa/xóa thẻ bản sao; bố cục theo mockup.
- **Kiểm chứng10/10:** compile BE đạt; lượt đầu73/73, lượt cuối riêng22/22 (B1.11 20 + onboarding2), hồi quy DTO bộ riêng11/11; không cộng các lượt. FE12/12/build đạt; lint phạm vi sửa0 lỗi, toàn frontend0 lỗi/14 cảnh báo ngoài phần sửa. Browser thật13 kiểm tra đạt: desktop1280/mobile390/360, copy/reload/retry sau mất phản hồi, sửa độc lập/media/nguồn riêng tư, empty/404/guest/reduced motion. Evidence (không còn trong repo).
- **Bàn giao:** [luồng B1.11](../docs/luong-backend/B1.11-sao-chep-bo.md); báo cáo Đợt 1 hiện có. Không chạy HTTP6 B1.8 hoặc thay trạng thái các bước trước; CSV/quản trị thuộc bước riêng.

### [x] B1.12 Nhập/xuất CSV — FR-05, TC-04
- API: `POST /decks/{id}/imports/preview` (lưu tạm kết quả trong Redis 30 phút), `POST /imports/{id}/commit`, `GET /decks/{id}/export`.
- Giới hạn 1 MB / 1000 dòng; báo lỗi **từng dòng**; đánh dấu trùng; commit chỉ ghi dòng hợp lệ đã chọn. Export chống công thức (ô bắt đầu `= + - @` → thêm `'`).
- Hoàn tất13/10/2026: owner-only; multipart/mapping, Redis30m, atomic selection, V7 idempotency/replay, RFC4180 UTF-8 BOM và guard công thức; FE/mockup thật đã nối. CSV35 test+handler3 pass; hồi quy ngoài CSV/handler193 test riêng; Newman25 HTTP (13 chính+12 CSRF)/31 assertion pass; browser7 nhóm pass. Giữ B1.8/HTTP6. [Luồng CSV](../docs/luong-backend/B1.12-csv.md), bằng chứng (không còn trong repo), [bàn giao chung](../ban-giao-cho%20fe/SPRINT_1_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).
- **Cuối Đợt 1 →** `/fe-report DOT1`.

---

## Đợt 2 — Học, luyện tập, thống kê & quản trị (26/10–08/11) · FR-06, 07, 11, 13

### [x] B2.1 Bộ tính SRS thuần — FR-06, TC-06, TC-07
- `V8__learning.sql` (V1–V7 đã dùng; không sửa migration đã áp dụng): `tien_do_the`, `phien_hoc`, `phien_hoc_the`, `lich_su_on`, `su_dung_hoc_ngay` + unique/index TK §12.4.
- `SrsCalculator` (class thuần, không Spring): nhận trạng thái cũ + mức (QUEN/KHO/NHO/DE) + `Instant now` → trạng thái mới, theo **đúng bảng TK §7.2** (EF 2.5, min 1.3, trần 365 ngày).
- **Xong khi:** unit test chuỗi Nhớ: mới → 10 phút → 1 ngày → 6 ngày → 15 ngày; Quên ở ON_TAP → HOC_LAI, tăng số lần quên.
- **Đã làm (16/10/2026):** `V8__learning.sql`, `SrsState`, `SrsCalculator` (phiên bản `SM2-VN-1`), `FR06SrsCalculatorTest` 28 test. Kiểm chứng: `./mvnw -q verify` thoát 0 (271 test tại thời điểm chạy, chưa chạy lại; số `@Test` trong mã nguồn khác tổng này vì có test tham số hóa; 0 lỗi) khi chạy với `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\Users\Public`; không có tùy chọn này, 181 test tích hợp lỗi do Netty loopback trên Windows. Không có API/HTTP/Postman ở bước này. Làm tròn HALF_UP và `now + N×24h` là **đề xuất**. Flow: [B2.1](../docs/luong-backend/B2.1-srs-calculator.md).

- **Sửa lô 3 rà soát (03/11/2026):** các mã RS-005, RS-007, RS-008, RS-010, RS-031, RS-050, RS-058 cùng các test RS-009, RS-028–RS-030, RS-054, RS-055.
  - `SrsCalculator` lên `SM2-VN-2`: Dễ ở chuỗi thành công 1 = round(6×1,3) = 8 ngày. Quy tắc này do người dùng chốt; đã sửa TK §7.2/§7.3 và srs-domain.
  - `Clock.tickMillis` thay `Clock.systemUTC`.
  - `SuDungHocNgayRepository.lockDay` (`PESSIMISTIC_WRITE`) dùng trong `ReviewService`. Trên code cũ, test hai tab ghi đồng thời cho `[201, 500]`.
  - `PhienHocTheRepository.countAnswerable` cho `phienDangDo.soChuaTraLoi`.
  - `PracticeGenerator.blankOf`: khớp nguyên từ kèm đuôi biến tố, che mọi lần xuất hiện. `PracticeService` có thông điệp riêng khi các thẻ chọn đều tạm ngưng.
  - `NguoiDungRepository.recordLogin` (UPDATE trực tiếp, không tăng `version`).
  - Test mới:
    - `FR06SrsCalculatorTest`: 5 ca chuỗi 1, làm tròn HALF_UP, phiên bản.
    - `FR06ReviewTest`: độ chính xác mili giây, 2 ca đồng thời.
    - `FR06DashboardTest`: `soChuaTraLoi` bỏ thẻ xóa/tạm ngưng, dự báo bỏ bộ đã xóa.
    - `PracticeGeneratorTest` (3).
    - `FR07PracticeSessionTest`: không lộ đáp án ở mọi dạng.
    - `FR04DeckCopyTest`: không sao chép tiến độ/lịch sử.
    - `FR02SettingsTest`: `chuDeIds`.
  - **Kiểm chứng:** `./mvnw -B test` 357 test, 0 lỗi, BUILD SUCCESS. **Chưa kiểm chứng:** Postman, HTTP thật.

### [x] B2.2 Kế hoạch hôm nay — FR-02, FR-06, TC-09
- API: `GET /learning/today` (cần đăng nhập): `ngay`, `soQuaHan`, `soDenHan`, `soTheMoiDaHoc`, `tuMoiMoiNgay`, `soMoiConLai`, `giayMoiLuot`, `uocTinhPhut`, `phutMoiNgay`, `chuoiNgay`, `homNayDaTinhChuoi`, `luotToiThieuChuoi`, `daHocHomNay{soLuot,soPhut}`, `tongSoThe`, `boThe[{boTheId,ten,soCanOn,soMoi}]`.
- "Đến hạn/quá hạn" tính từ `han_on_at` (không lưu trạng thái riêng). Ngày theo múi giờ User, khoảng nửa mở `[đầu ngày, đầu ngày kế tiếp)`: quá hạn là `han_on_at` < đầu ngày; đến hạn hôm nay là trong ngày, kể cả thẻ chưa tới giờ. Đây là nhãn thống kê, không phải điều kiện hàng đợi của B2.3 (`han_on_at <= now`).
- Chỉ tính `DANG_HOC`, `ON_TAP`, `HOC_LAI`; loại thẻ/bộ đã xóa, `TAM_NGUNG`, bộ không thuộc người dùng. Thẻ mới = không có hàng tiến độ nào khác `MOI`; `soMoiConLai = min(max(0, tuMoiMoiNgay − so_the_moi hôm nay), thẻ mới khả dụng)`; hết suất không giảm số ôn.
- Ước tính 20 giây/lượt (hằng, ghi là ước tính). Chuỗi ngày: ngày có `so_luot_hop_le >= 5`, hôm nay chưa đủ thì tính từ hôm qua; Đợt 3 (engagement) thay thế. Chưa có `cuuLichOn` và query `phut`, `giuTuMoi` ở B2.2; đã thêm ở B2.6.
- **Xong khi:** `FR06TodayPlanTest` (TC-09 nửa đêm/múi giờ, hạn mức từ mới không nhân đôi hai chiều, thẻ/bộ xóa, tạm ngưng, người khác) và `StreakCalculatorTest` pass.
- **Đã làm (19/10/2026):** code `TienDoThe`, `SuDungHocNgay`, `TienDoTheRepository`, `SuDungHocNgayRepository`, `StreakCalculator`, `LearningPlanService`, `LearningController`, `AccountService.zoneOf`; commit B2.2 có kèm `V9__phien_hoc_bo_the.sql` (nền cho B2.3), B2.2 tự không cần migration. 20 giây/lượt và chuỗi theo ngày ≥5 lượt là **đề xuất**. Hai lớp test `FR06TodayPlanTest`, `StreakCalculatorTest` đã có trong repository. **Kiểm chứng:** người dùng chạy `StreakCalculatorTest` và `FR06TodayPlanTest` ngày 19/10/2026 và báo không có lỗi (không ghi số lượng test, không đính kèm log). Mockup `hom-nay.html` rà 19/10: cùng tên field với BE, bỏ `muiGio` và `laUocTinh` thừa khỏi `demo.js`, trang hiển thị đúng và console không lỗi; còn lệch demo 15 giây/lượt (BE 20) và `cuuLichOn` (B2.6). Postman: thêm request "Kế hoạch hôm nay (B2.2 · FR-06)" vào thư mục "03 Học tập" của "VocabLearning API", đã ghi `synced`. **Chưa kiểm chứng:** gọi HTTP thật và chạy request Postman. Flow: [B2.2](../docs/luong-backend/B2.2-ke-hoach-hom-nay.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).
- **Mở rộng (đề xuất 28/10/2026, đã code ở B2.12 ngày 31/10/2026):** B2.12 thêm `phienDangDo`, `duBaoOn`, `daHocHomNay.thoiGian` và đổi `daHocHomNay.soPhut` từ ước tính sang thời gian thật; các field hiện có giữ nguyên tên.

### [x] B2.3 Tạo phiên học — FR-06
- `V9__phien_hoc_bo_the.sql` **đã có** (commit cùng B2.2): thêm `phien_hoc.bo_the_id` (null = tất cả bộ), có FK; B2.3 không tạo lại và không sửa V9. Thứ tự migration: V9 (đã có, thuộc B2.3), V10 `phien_hoc.che_do` (B2.6, đã có), V11 practice (B2.7), V12 admin (B2.11), V13 jobs_ai (B3.1), V14 speaking (B3.4), V15 engagement (B3.6), V16 notification_report (B3.7), V17 privacy (B3.10). Số thực tế luôn lấy số kế tiếp chưa dùng khi tới bước đó.
- API: `POST /learning/sessions` body `{boTheId?, chieuHoc, quyThoiGian}` (`EN_VI`/`VI_EN`, 5/10/20 phút), `GET /learning/sessions/{id}` (chỉ chủ phiên; người khác → 404). Không có `cheDo` ở B2.3; đã thêm ở B2.6.
- Hàng đợi tối đa `quyThoiGian×60/20` thẻ (20 giây/lượt là ước tính): bước học lại đến hạn → ôn đến hạn (`han_on_at <= now`) → thẻ mới thật trong hạn mức → thẻ đã học chiều kia (không tốn hạn mức). Bỏ thẻ tạm ngưng/đã xóa/bộ không thuộc người dùng. Lưu vào `phien_hoc_the`; `mui_gio` = múi giờ người dùng lúc tạo.
- Hàng đợi rỗng → 422 `BUSINESS_RULE`, không lưu phiên. B2.3 không trừ hạn mức (B2.4 làm). Response: `hetGioAt` (tính ra, không lưu), `hangDoi[].trangThai` (`CHUA_TRA_LOI`/`DA_TRA_LOI`), `hangDoi[].the` (media là ID tệp `anhId`/`amTuId`/`amCauId`), `hangDoi[].tienDo` (kèm `version`). Chưa có `duKien`.
- **Xong khi:** test hàng đợi đúng thứ tự và giới hạn, hạn mức không nhân đôi hai chiều, thẻ/bộ xóa và tạm ngưng, người khác → 404, rỗng → 422, `GET` đúng chủ.
- **Đã làm (26/10/2026):** `PhienHoc`, `PhienHocThe`, `TienDoThe` (map đủ cột + `@Version`), `PhienHocRepository`, `PhienHocTheRepository`, 4 query mới ở `TienDoTheRepository`, `TheTuVungRepository.findOwnedActive`, `CardService.studyCards`, `StudyCardResponse`, `CreateSessionRequest`, `StudySessionResponse`, `StudyQueueItemResponse`, `TienDoResponse`, `StudySessionService`, `LearningController`; migration `V9` đã có từ commit B2.2. Chiều còn lại không tốn hạn mức, nhiều phiên cùng lúc và 20 giây/lượt là **đề xuất**. **Kiểm chứng:** ngày 26/10/2026 chạy `FR06StudySessionTest` 8/8 pass cùng `FR06TodayPlanTest`, `StreakCalculatorTest`, `FR06SrsCalculatorTest` (48 test = 8 + 6 + 6 + 28, BUILD SUCCESS; trước ghi nhầm 40, sửa 03/11/2026). **Chưa kiểm chứng:** bộ test đầy đủ, gọi HTTP thật bằng `curl`, chạy request Postman. Flow: [B2.3](../docs/luong-backend/B2.3-tao-phien-hoc.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.4 Ghi kết quả ôn — FR-06, TC-05, TC-08, TC-09
- API: `POST /learning/sessions/{id}/reviews` body `{clientEventId, theId, chieuHoc, danhGia, expectedVersion, thoiGianTraLoiMs}` (TK §13.3; `danhGia` là `QUEN`/`KHO`/`NHO`/`DE`, `chieuHoc` là `EN_VI`/`VI_EN`).
- Một transaction theo TK §7.4 (khóa dòng `phien_hoc` bằng `PESSIMISTIC_WRITE`): kiểm chủ phiên (người khác → 404) → `clientEventId` đã có thì trả kết quả cũ (200, không tính lại) → phiên `DANG_HOC` (không thì 409 `CONFLICT`) → dòng `phien_hoc_the` (phien, the, chieuHoc) tồn tại và `CHUA_TRA_LOI` (không thì 422), `chieuHoc` khác phiên → 400 → thẻ/bộ còn khả dụng và tiến độ không `TAM_NGUNG` (không thì 422) → hạn mức nếu là thẻ vật lý mới (hết → 422) → so `expectedVersion` (lệch → 409 `VERSION_CONFLICT`) → `SrsCalculator.calculate` → ghi `lich_su_on` (trước/sau JSON, phiên bản thuật toán) → cập nhật `tien_do_the` + `su_dung_hoc_ngay` (+1 `so_luot_hop_le`, +1 `so_the_moi` nếu thẻ vật lý mới, ngày theo `phien_hoc.mui_gio`) + `phien_hoc_the`. Ghi mới trả 201, replay trả 200.
- Quyết định B2.4 (**đề xuất**): mọi lượt mới ghi thành công đều tính hợp lệ (replay không tính); `thoiGianTraLoiMs >= 0`, lớn hơn 120000 thì cắt về 120000; vẫn nhận lượt sau `hetGioAt`; 409 `VERSION_CONFLICT` không kèm `tienDo`/`duKien` (FE gọi lại `GET /sessions/{id}`); `duKien` **không** thuộc phần lõi B2.4, thêm sau như bước phụ. Không migration (V8/V9 đủ). Tiến độ mới tạo rồi áp kết quả trong cùng transaction nên `version` sau lượt đầu là 1.
- Hạn mức từ mới đếm theo **thẻ vật lý**, không nhân đôi hai chiều. B2.3 không trừ hạn mức nên hai phiên tạo liền nhau có thể chứa cùng thẻ mới: kiểm lại hạn mức khi ghi.
- Thẻ học lại trong phiên: **đã chốt (20/10/2026) tái dùng dòng cũ, không migration**. Sau khi ghi kết quả, nếu thẻ còn bước học lại/học trong phiên (`han_on_at <= hetGioAt`) thì đặt dòng `phien_hoc_the` về `CHUA_TRA_LOI` và `thu_tu = max(thu_tu) + 1` (cuối hàng đợi); ngược lại đặt `DA_TRA_LOI`. Giữ nguyên unique `(phien_id, the_id, chieu_hoc)` và `(phien_id, thu_tu)` của V8. Lịch sử từng lượt nằm ở `lich_su_on`, nên dòng hàng đợi chỉ là trạng thái hiện tại. Thêm `duKien` (xem trước lịch 4 mức, tính bằng `SrsCalculator`) vào response phiên khi F2.2 cần.
- Thẻ chưa có hàng `tien_do_the` có `version` 0 ở response B2.3; tạo hàng khi `expectedVersion=0` và chưa có hàng (unique `(nguoi_dung_id, the_id, chieu_hoc)` chặn hai tab).
- **Xong khi:** `FR06ReviewTest` (TC-05 hai chiều độc lập, TC-08 replay và hai tab version cũ, TC-09 hạn mức khi ghi và ngày theo múi giờ phiên, thẻ học lại xuống cuối hàng đợi, người khác/sai chiều/ngoài hàng đợi/đã trả lời/thẻ xóa/tạm ngưng/phiên kết thúc, 400 và 401) pass.
- **Đã làm (26/10/2026):** `ReviewService`, `ReviewRequest`, `ReviewResponse`, `LichSuOn` (entity chỉ đọc, JSON ghi bằng native SQL), `LichSuOnRepository`, `ReviewEventRow`; sửa `TienDoThe` (`create`, `toState`, `apply`), `PhienHocThe` (`markAnswered`, `requeue`), `SuDungHocNgay` (`record`), `PhienHocRepository.lockOwned` (khóa dòng phiên), `PhienHocTheRepository`, `TienDoTheRepository`, `SuDungHocNgayRepository.ensureRow`, `CardService.isStudyable`, `LearningController`; không migration. Quyết định **đề xuất**: mọi lượt mới ghi thành công tính hợp lệ, cắt `thoiGianTraLoiMs` ở 120000, phiên kết thúc → 409, vẫn nhận lượt sau `hetGioAt`, ngày theo `phien_hoc.mui_gio`, chưa có `duKien`. **Kiểm chứng:** người dùng báo đã chạy xong `FR06ReviewTest` ngày 26/10/2026 (không đính kèm log hay số lượng test). Có log sau đó: pass trong lượt `FR06*Test` 79 test ngày 31/10/2026 và 12/12 trong bộ đầy đủ 363/363 ngày 03/11/2026 (RS-025). **Chưa kiểm chứng:** bộ test đầy đủ, gọi HTTP thật bằng `curl`, chạy request Postman, mở mockup trên trình duyệt. Flow: [B2.4](../docs/luong-backend/B2.4-ghi-ket-qua-on.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.5 Kết thúc phiên, lịch sử, tạm ngưng/đặt lại — FR-06
- API: `POST /learning/sessions/{id}/finish` (tổng kết khớp lịch sử), `GET /learning/history`, `GET /decks/{id}/progress` (UI21: `tongHop` theo `MOI/DANG_HOC/DEN_HAN/QUA_HAN/TAM_NGUNG`, danh sách thẻ kèm tiến độ từng chiều, phân trang; nhóm quá hạn/đến hạn theo cùng quy tắc ngày địa phương của B2.2), `PUT /cards/{id}/progress/suspend`, `POST /cards/{id}/progress/reset` (cần xác nhận).
- Đối chiếu trước khi code (27/10/2026); các quyết định dưới đây là **đề xuất**, đã triển khai ngày 28/10/2026. Không migration (V8/V9 đủ).
  - `finish`: khóa dòng phiên (`lockOwned`); `DANG_HOC` → `KET_THUC`, `ket_thuc_at` = now (không nhỏ hơn `bat_dau_at`); phiên đã `KET_THUC` trả lại tổng kết cũ, không đổi `ket_thuc_at` (200 cả hai). Cho kết thúc trước hoặc sau `hetGioAt`; không tự đóng phiên quá hạn (không job). Dòng `phien_hoc_the` `CHUA_TRA_LOI` (kể cả thẻ đã xóa/tạm ngưng) giữ nguyên làm minh chứng; phiên đóng nên không treo; tổng kết trả `soChuaTraLoi`. Tổng kết chỉ tính từ `lich_su_on` của phiên (gọi lại cho cùng kết quả): `soLuot`, `soThe`, `soTheMoi` (thẻ có lượt đầu với `truoc.trangThai = MOI` ở chiều của phiên), `soChuaTraLoi`, `thoiGian` (tổng ms đã cắt 120000/lượt), `theoDanhGia`, `tuCanLuyen` (có `QUEN`/`KHO`), `lichTiepTheo` (`sau` của lượt cuối mỗi thẻ). Không kèm chuỗi ngày (lấy từ `/learning/today`), không `khoangHienThi`.
  - `history`: lọc `phienId`, `theId`, `boTheId`, `chieuHoc`, `tuNgay`, `denNgay` (ngày địa phương theo múi giờ hiện tại của người dùng, nửa mở); sắp `createdAt desc, id desc`; `page` mặc định 0, `size` 20, tối đa 100 (`PageResponse`); trả `truoc`/`sau` đầy đủ (cùng cấu trúc `tienDo`), `thoiGian` (ms); gồm lượt của thẻ/bộ đã xóa (giữ minh chứng, TK §12.4); ID lọc của người khác → trang rỗng.
  - `decks/{id}/progress`: bộ đã xóa/của người khác → 404; đếm theo thẻ-chiều (tổng `tongHop` = 2 × `tongSoThe`); không có hàng hoặc `MOI` → `MOI`; `TAM_NGUNG`; còn lại theo `han_on_at`: trước đầu ngày → `QUA_HAN`, trong ngày → `DEN_HAN`, sau hôm nay → nhóm `DANG_HOC` (có lịch, chưa đến hạn); bỏ thẻ đã xóa; lọc `nhom` (ít nhất một chiều thuộc nhóm), `q` (`tu`/`nghiaVi`); kèm `muiGio`, `tamNgung`.
  - `suspend`: áp **cả thẻ** (hai chiều; tạo hàng `TAM_NGUNG` cho chiều chưa có hàng) vì query B2.2/B2.3/B2.4 coi mọi hàng khác `MOI` là "đã học". Body `{tamNgung}`; `false` là bỏ tạm ngưng, suy trạng thái từ field còn giữ (`hanOnAt` null → `MOI`; `khoangOnNgay` > 0 → `ON_TAP`; `soLanQuen` > 0 → `HOC_LAI`; còn lại `DANG_HOC`), giữ `hanOnAt` gốc. Gửi lại cùng giá trị: không đổi, không tăng `version`.
  - `reset`: cả thẻ; body `{"xacNhan": true}` (thiếu/false → 400 `xacNhan`); đặt về `MOI` tại chỗ (không xóa hàng vì FK `lich_su_on.tien_do_id`), giữ `lich_su_on`, không ghi lượt; `version` tăng nên phiên đang mở nhận 409 `VERSION_CONFLICT`; không hoàn suất `su_dung_hoc_ngay` (học lại trong ngày tính là thẻ mới lần nữa); thẻ tạm ngưng → `MOI`.
  - Thẻ/bộ đã xóa hoặc của người khác ở `suspend`/`reset` → 404. Trạng thái phiên giữ `KET_THUC` (CHECK V8), demo đã sửa theo. Map `uk_tien_do_the_nguoi_the_chieu` → 409 `VERSION_CONFLICT` (hai request cùng tạo hàng tiến độ đang ra 500; phát hiện khi đọc code, chưa kiểm chứng).
- **Xong khi:** `FR06FinishHistoryTest` (finish đóng phiên và lặp lại cho cùng tổng kết/`ketThucAt`, tổng kết khớp `history?phienId`, dòng chưa trả lời, review sau finish → 409, lọc/phân trang history, người khác → 404/rỗng) và `FR06ProgressTest` (nhóm theo ngày địa phương, thẻ-chiều, thẻ xóa, suspend hai chiều không lọt hàng đợi/không tính thẻ mới, resume đúng trạng thái, reset về `MOI` giữ lịch sử, thiếu `xacNhan` → 400, version cũ → 409) pass.
- **Lỗi `ketThucAt` (phát hiện và sửa 28/10/2026):** lần `finish` đầu trả `ketThucAt` độ chính xác nano giây (lấy từ `clock.instant()`), lần gọi lại đọc từ cột `DATETIME(3)` nên chỉ còn mili giây, hai tổng kết khác nhau. `PhienHoc.finish` nay cắt `now` về mili giây.
- **Đã làm (28/10/2026):** `ProgressController`, `HistoryService`, `CardProgressService` (mới); `StudySessionService.finish`/`summary`; `PhienHoc.hetGioAt`/`finish` (cắt `ketThucAt` về mili giây); `TienDoThe.suspend`/`resume`/`reset`; `LichSuOn` ánh xạ `truocJson`/`sauJson`; `LichSuOnRepository.history`/`sessionEvents`; `TienDoTheRepository.deckProgress`/`deckProgressCount`/`activeCardCount`/`findByNguoiDungIdAndTheId`/`findByNguoiDungIdAndTheIdIn`; `PhienHocTheRepository.countByPhienIdAndTrangThai`; 13 DTO mới, `TienDoResponse.of`; `GlobalExceptionHandler` map `uk_tien_do_the_nguoi_the_chieu` → 409 `VERSION_CONFLICT`; sửa `FR06StudySessionTest` theo constructor mới; không migration. **Kiểm chứng:** ngày 28/10/2026 người dùng chạy `./mvnw test`: 315 test, 3 fail — `FR06FinishHistoryTest.fr06_finishClosesSessionAndRepeatReturnsSameSummary` (`ketThucAt` nano giây ở lần đầu; đã sửa), `IntegrationSetupTest.xsrfHelperPassesCsrfFilter` và `FR05CsvTest.tc04_missingFileMalformedUtf8AndInvalidHeaders` (ngoài B2.5, chưa xử lý). Chạy lại sau khi sửa (28/10/2026): `mvnw test -Dtest='FR06*Test,StreakCalculatorTest,FR05CsvTest,IntegrationSetupTest'` 88 test, 2 fail, đều ngoài B2.5 (`FR05CsvTest.tc04_…` nhận 415 thay vì 400 khi phần `mapping` là `text/plain`; `IntegrationSetupTest.xsrfHelperPassesCsrfFilter` nhận 405 thay vì 404 khi POST `/public/ping`, endpoint chỉ có GET). Toàn bộ 71 test learning pass, gồm `FR06FinishHistoryTest` (4) và `FR06ProgressTest` (6). Chưa chạy lại bộ test đầy đủ. **Chưa kiểm chứng:** gọi HTTP thật bằng `curl`, chạy request Postman, mở mockup trên trình duyệt. Flow: [B2.5](../docs/luong-backend/B2.5-ket-thuc-phien-lich-su-tien-do.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.6 Cứu lịch ôn — FR-06, TC-10
- Trong `/learning/today`: khi quá hạn vượt ngưỡng → trả phương án chia N ngày theo phút/ngày, giảm từ mới, ưu tiên thẻ quên nhiều. **Không** đổi `han_on_at` gốc.
- Mở rộng `POST /learning/sessions` nhận `cheDo` (`THUONG`/`CUU_LICH`); `CUU_LICH` bỏ thẻ mới và ưu tiên thẻ quên nhiều. Lưu chế độ của phiên bằng migration `V10__phien_hoc_che_do.sql`; `GET /sessions/{id}` trả `cheDo`.
- **Quyết định (chốt 30/10/2026, là đề xuất nghiệp vụ):**
  - Ngưỡng: `soQuaHan > phutMoiNgay(cài đặt)×60/20`; chỉ đếm quá hạn (hạn trước đầu ngày địa phương); query `phut` không đổi việc bật/tắt; không đưa ngưỡng vào `application.yaml`.
  - Query `phut` 1–240 (như `LearningSettingsRequest`), thiếu → `phutMoiNgay`; `giuTuMoi` `true`/`false`, mặc định `false`; sai → 400 đúng field. Dùng `String` + `@Pattern` trong `TodayQuery`.
  - `cuuLichOn` = `null` hoặc `{soTheCanOn, soQuaHan, phutMoiNgay, luotMoiNgay, soNgay, keHoach[{ngay, soThe, phut}], tamDungTuMoi}`; đếm thẻ-chiều; `keHoach` từ hôm nay, tối đa 14 dòng; bỏ `laUocTinh`, `giayMoiLuot`, `uuTien` của demo.
  - `giuTuMoi=false` khi có `cuuLichOn` → `/today` trả `soMoiConLai = 0` (chỉ hiển thị). Phiên `THUONG` giữ nguyên B2.3; chỉ `CUU_LICH` bỏ thẻ mới.
  - Hàng đợi `CUU_LICH`: `DANG_HOC`/`HOC_LAI` đến hạn → `ON_TAP` đến hạn theo `so_lan_quen` giảm dần, `han_on_at`, `id` (`TienDoTheRepository.rescueQueue`); không thẻ mới, không chiều còn lại. Cho tạo khi không có `cuuLichOn`; rỗng → 422.
  - `cheDo` trong body là `String` + `@Pattern` (sai → 400 `fieldErrors[cheDo]`), mặc định `THUONG`. Migration chiếm V10 nên các migration sau dời một số.
  - B2.12 nối `phienDangDo`, `duBaoOn` sau `cuuLichOn` trong `TodayPlanResponse`.
- **Xong khi:** `FR06RescuePlanTest` (chia ngày đúng, ngưỡng, `han_on_at` không đổi, không thẻ mới, thứ tự ưu tiên, `cheDo` trả về, `phut`/`giuTuMoi`/`cheDo` sai → 400, người khác → 404) và `RescuePlanTest` pass; test B2.2/B2.3 sửa theo chữ ký mới vẫn pass.
- **Đã làm (31/10/2026):** `V10__phien_hoc_che_do.sql`, `CheDoPhien`, `PhienHoc.cheDo`/`start(..., cheDo)`, `TienDoTheRepository.rescueQueue`, `TodayQuery`, `CuuLichOnResponse`, `KeHoachNgayResponse`, `TodayPlanResponse.cuuLichOn`, `CreateSessionRequest.cheDo`/`mode()`, `StudySessionResponse.cheDo`, `LearningPlanService.today(userId, query)`/`rescuePlan`, `StudySessionService.create`/`pickCardIds`/`toResponse`, `LearningController.today`; test mới `FR06RescuePlanTest` (5), `RescuePlanTest` (3); sửa `FR06TodayPlanTest`, `FR06StudySessionTest` theo chữ ký mới. **Kiểm chứng:** ngày 31/10/2026 chạy `mvnw -q test -Dtest='FR06*Test,RescuePlanTest,StreakCalculatorTest'`: 79 test, 0 lỗi, exit 0. **Chưa kiểm chứng:** bộ test đầy đủ (còn 2 fail đã biết ngoài phạm vi: `IntegrationSetupTest.xsrfHelperPassesCsrfFilter`, `FR05CsvTest.tc04_…`), gọi HTTP thật bằng `curl`, chạy request Postman. Mockup: `hom-nay.html` gửi `cheDo` theo `tamDungTuMoi`, đọc `giayMoiLuot` ở gốc; `demo.js` bỏ `uuTien`/`laUocTinh`/`giayMoiLuot` trong `cuuLichOn`, nhận `phut` 1–240 và báo 400 `phut`/`giuTuMoi`, phiên `THUONG` giữ thẻ mới; mở `hom-nay.html?as=an` trên trình duyệt 31/10: khối cứu lịch hiện đúng, nút bắt đầu tạo phiên `CUU_LICH`, console không lỗi. Postman: sửa request "Kế hoạch hôm nay (B2.2 · FR-06)" (query `phut`/`giuTuMoi` tắt sẵn, test chấp nhận `cuuLichOn`), thêm 5 request B2.6 vào "03 Học tập"; chưa chạy. Endpoint đã có trong `synced` nên registry không đổi. Flow: [B2.6](../docs/luong-backend/B2.6-cuu-lich-on.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.7 Tạo bài luyện — FR-07, TC-11
- `V11__practice.sql` (V8 dùng cho learning, V9 cho `phien_hoc.bo_the_id`, V10 cho `phien_hoc.che_do` (B2.6), đã có; nếu số này bị chiếm thì lấy số kế tiếp chưa dùng): `bai_luyen`, `cau_hoi_bai_luyen`, `lan_lam_bai`, `tra_loi_bai_luyen`, `loi_hoc_tap`, `so_tay_tu_kho`, `cap_tu_de_nham`.
- API: `POST /practice/sessions` (dạng: chọn nghĩa, chọn từ, ghép, điền chỗ trống, nhập từ theo nghĩa, nghe viết, phân biệt cặp, tổng hợp), `GET /practice/sessions/{id}`.
- Lưu **bản chụp** câu hỏi + đáp án; response **không chứa đáp án**.
- **Quyết định (chốt 31/10/2026, đề xuất):** (a) V11 tạo đủ 7 bảng, B2.7 chỉ ghi `bai_luyen`, `cau_hoi_bai_luyen`; (b) body `{loaiBai, soCau 5/10/20, boTheId?, nguon? BO_THE/SO_TAY, theIds? ≤20}`, chuỗi + `@Pattern`, tổ hợp nguồn sai → 400; (c) thẻ của mình, chưa xóa, không tạm ngưng, nhiễu từ mọi thẻ của mình; (d) thiếu dữ liệu → 422 không lưu; (e) `NGHE_VIET` trả `deBai.amTuId`, chỉ thẻ có âm từ; (f) điền chỗ trống khớp đầu từ trong `viDuEn`; (g) ghép từ nhóm 3–5 thẻ, `soCau` = số thẻ; (h) `PHAN_BIET_CAP` đọc `cap_tu_de_nham` nên 422 đến B2.8; `TONG_HOP` xoay vòng 5 loại + 1 câu cặp; (i) bản chụp đề/đáp án/giải thích (TC-11); (j) response chưa có `daNop`, `lanLamId`, `ketQua`, `laLuyenLai` (B2.8 thêm). Dùng `createdAt` (tên entity) thay `taoAt` của demo.
- **Xong khi:** `FR07PracticeSessionTest` pass (TC-11 sửa/xóa thẻ không đổi đề, không lộ đáp án, các loại câu, nguồn, 400/404/422/401).
- **Đã làm (31/10/2026):** `V11__practice.sql` (7 bảng); module `practice`: `BaiLuyen`, `CauHoiBaiLuyen`, enum `LoaiBai`, `LoaiCau`, `NguonBaiLuyen`, `BaiLuyenRepository`, `CauHoiBaiLuyenRepository`, `CreatePracticeRequest`, `PracticeSessionResponse`, `PracticeQuestionResponse`, `PracticeGenerator`, `PracticeService`, `PracticeController`; sửa nền `TimeConfig` cắt thời điểm auditing về mili giây (cùng lỗi `ketThucAt` B2.5). **Kiểm chứng:** `mvnw test -Dtest='FR07*Test,FR06*Test,RescuePlanTest,StreakCalculatorTest,FR03*Test,FR04*Test'` 220 test, 0 lỗi, BUILD SUCCESS (31/10), gồm `FR07PracticeSessionTest` 4/4. **Chưa kiểm chứng:** bộ test đầy đủ, HTTP thật, chạy Postman. Mockup: `demo.js` trả `createdAt`, `NGHE_VIET` trả `deBai.amTuId` (demo không có tệp thì dùng `demo-audio://` + giọng đọc); `luyen-tap-lam-bai.html` phát tệp theo `amTuId`; mở trang trên trình duyệt 31/10 với bài nghe viết, bấm "Nghe chậm" không lỗi console. Demo vẫn còn `daNop`, `ketQua`, `laLuyenLai` (B2.8). Postman: thêm 4 request vào "04 Luyện tập" (tạo, xem, 400 `soCau`, 404), chưa chạy. Flow: [B2.7](../docs/luong-backend/B2.7-tao-bai-luyen.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).
- **Đã làm (06/11/2026, BE-01 trong [kế hoạch sửa Đợt 2](../docs/KE_HOACH_SUA_DOT2.md)):** thêm `GET /practice/sessions/{id}/questions/{cauHoiId}/audio` để câu `NGHE_VIET` phát được âm từ mà không lộ `theId` (`CauHoiBaiLuyenRepository.findByIdAndBaiId`, `PracticeService.audio`, `PracticeController`). Phương án thêm `theId`/`boTheId` vào `deBai` bị bỏ vì test kiểm response không có `theId`. **Kiểm chứng:** `FR07PracticeSessionTest` 5/5 (thêm test âm thanh), `./mvnw -B test` 404/404 pass. Mockup: `demo.js` thêm route, `luyen-tap-lam-bai.html` gọi API khi bấm Nghe, đã mở trên trình duyệt, console không lỗi. **Chưa kiểm chứng:** HTTP thật.

### [x] B2.8 Nộp bài & chấm — FR-07, TC-11
- API: `POST /practice/sessions/{id}/submissions` (`submitKey` chống trùng), `GET /practice/history`, `POST /practice/mistakes/retry`.
- `AnswerNormalizer` (Unicode NFC, khoảng trắng, hoa/thường theo dạng bài); chấm tại server theo bản chụp; lưu `loi_hoc_tap` với nhóm lỗi (NGHIA, CHINH_TA, NGHE, CAP_NHAM…).
- Thời gian bài luyện đã nộp cộng vào `StudyTimeService` (TK §7.3, RS-011), không tính riêng ở `/learning/today` hay `/statistics`.
- **Quyết định (chốt 03/11/2026, đề xuất):** (a) `submitKey` bắt buộc ≤ 128 `[A-Za-z0-9._:-]`, cùng khóa + cùng bài → 200 kết quả cũ, khác → 409 không kèm `lanLamId`; (b) bỏ trống = sai, `cauHoiId` lạ/trùng → 400, `noiDung` ≤ 200; (c) chuẩn hóa NFC, nháy, gạch nối, khoảng trắng Unicode, chữ thường, giữ dấu câu; (d) gần đúng theo độ dài (1/2/3), OSA; (e) ghép điểm phần, điểm bài từ phân số gốc; (f) upsert `cap_tu_de_nham` nguyên tử, sắp thứ tự; (g) `loi_hoc_tap` `BAI_LUYEN`, ghép một dòng mỗi cặp sai, câu bỏ trống có ghi; (h) field `thoiGian`, cắt theo giờ server, cộng vào `StudyTimeService`; (i) `LoaiCau.kyNang()`; (j) lịch sử lọc `loaiBai`/`tuNgay`/`denNgay`, mặc định 20; (k) luyện lại kế thừa nguồn/bộ/số câu yêu cầu; (l) không ghi `so_tay_tu_kho` (B2.9); (m) không migration; (n) lưu kết quả chấm, không chấm lại; (o) thứ tự 400 → 404 → gửi lại → 409 → 400; (p) không thưởng; (q) trả `baiGocId`.
- **Đã làm (03/11/2026):** entity `LanLamBai`, `TraLoiBaiLuyen`, `LoiHocTap`; enum `NhomLoi`, `KyNang`, `NguonSuKien`, `LoaiCau.kyNang()`; `BaiLuyen.createRetry`; `LanLamBaiRepository` (lịch sử, `studyTimes`), `TraLoiBaiLuyenRepository`, `LoiHocTapRepository`, `BaiLuyenRepository.lockOwned`/`addConfusion`; DTO `SubmitPracticeRequest`, `PracticeAnswerRequest`, `PracticePairRequest`, `PracticeResultResponse`, `PracticeResultItemResponse`, `SkillScoreResponse`, `PracticeHistoryQuery`, `PracticeHistoryResponse`, `RetryPracticeRequest`, `PracticeSessionResponse` thêm 5 field; `AnswerNormalizer`, `PracticeGrader`, `PracticeResults`, `PracticeSubmissionService`, `PracticeHistoryService`, `PracticeService.retry`, `PracticeGenerator.retry`; `StudyTimeService` cộng thời gian bài luyện; `GlobalExceptionHandler` map `uk_lan_lam_bai_*` → 409; test mới `FR07SubmissionTest` (4), `PracticeGraderTest` (11), `AnswerNormalizerTest` (4); 3 test FR06 dùng bean `StudyTimeService`. Không migration. **Kiểm chứng:** `./mvnw -B test` 382/382, BUILD SUCCESS (03/11). **Chưa kiểm chứng:** HTTP thật, chạy Postman. Mockup: `demo.js` + `luyen-tap-lam-bai/ket-qua/lich-su.html` khớp DTO, mở trên trình duyệt, console không lỗi. Postman: thêm 10 request vào "04 Luyện tập", chưa chạy. Tài liệu: TK §7.3, §12.2, §13.2; `SPRINT_PLAN` route UI26. Flow: [B2.8](../docs/luong-backend/B2.8-nop-bai-cham.md); bàn giao: [Đợt 2 §5.9](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.9 Sổ tay từ khó & cặp dễ nhầm — FR-08
- API: `GET /notebook`, `PUT/DELETE /notebook/{cardId}`, `GET /learning/confusing-pairs`.
- `V13__so_tay_an_tu.sql`: thêm `so_tay_tu_kho.an_tu_at` (mốc bỏ khỏi sổ). Các migration sau dời +1 (admin V14, jobs_ai V15, engagement V16, notification V17, privacy V18).
- **Quyết định (chốt 03/11/2026, đề xuất):** (a) sổ tay suy ra: có `loi_hoc_tap` sau mốc ∪ ≥ 3 lần Quên từ `ON_TAP` trong 30 ngày ∪ đánh dấu; một hàm dùng chung UI27 và `nguon = SO_TAY`; (b) DELETE đặt `an_tu_at`, bỏ đánh dấu, giữ ghi chú, 204 idempotent; lỗi mới làm thẻ hiện lại; PUT không xóa mốc; (c) PUT `{ghiChu?, danhDauThuCong?}` không `version`, trim, rỗng → `null`, ≤ 500, luôn 200; (d) `lyDo` theo TK §8.3: QUEN_NHIEU, SAI_CHINH_TA (2/5 lượt nhập, bỏ trống không tính), CAP_DE_NHAM (`so_lan_nham ≥ 2`), DANH_DAU_THU_CONG; ngưỡng `app.notebook.*`; (e) ẩn thẻ/bộ xóa, bộ người khác, thẻ tạm ngưng; (f) `tongHop` theo thẻ, bằng chứng ≤ 3, sắp `lanGanNhatAt desc, theId desc`, mặc định 20, tối đa 100, lọc `nhomLoi`; (g) tổng hợp SQL, ghép Java; (h) `notebookCardIds` → `NotebookService.cardIds`; (i) cặp nhầm: controller module `practice`, field `soLanNham`/`lanCuoiAt`, bỏ `loaiNham`, `so_lan_nham ≥ 1`, tối đa 20, bỏ cặp có thẻ xóa/tạm ngưng; (j) V13; (k) sửa demo theo DTO; (l) `FR08NotebookTest`.
- **Xong khi:** `FR08NotebookTest` pass (sổ tay suy ra, ẩn theo mốc rồi hiện lại, `lyDo`, `tongHop`, phân trang, 400/401/404, ẩn thẻ xóa/tạm ngưng, cặp nhầm); `nguon = SO_TAY` tạo được bài khi sổ có thẻ; bộ test đầy đủ pass.
- **Đã làm (03/11/2026):** `V13__so_tay_an_tu.sql`; entity `SoTayTuKho`, `SoTayTuKhoRepository` (tổng hợp JPQL + native `ROW_NUMBER()`), row `MistakeStatRow`/`LapseStatRow`/`NotebookCardRow`, enum `MaLyDo`; `NotebookService`, `NotebookController`; DTO `NotebookQuery`, `UpdateNotebookRequest`, `NotebookResponse`, `NotebookItemResponse`, `NhomLoiCountResponse`, `BangChungResponse`, `ConfusingPairResponse`, `PairCardResponse`; `app.notebook.*` trong `application.yaml`; `PracticeService` lấy `NotebookService.cardIds`, bỏ `BaiLuyenRepository.notebookCardIds`; test `FR08NotebookTest` (4), sửa dữ liệu `FR07PracticeSessionTest`. **Kiểm chứng:** `mvnw -q test -Dtest="FR08NotebookTest,FR07PracticeSessionTest"` exit 0; bộ đầy đủ `./mvnw -B test` 386 test, 0 lỗi (03/11). **Chưa kiểm chứng:** HTTP thật bằng `curl`, chạy request Postman. Flow: [B2.9](../docs/luong-backend/B2.9-so-tay-cap-nham.md); bàn giao: [Đợt 2 mục 5.10](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.10 Thống kê nền — FR-11
- API: `GET /statistics/overview` (từ đã học, lượt ôn, tỷ lệ đúng, thời gian, chuỗi ngày), `GET /statistics/skills` (mức làm chủ theo kỹ năng, tối đa 20 lượt gần nhất, thiếu dữ liệu → "Chưa đủ dữ liệu").
- Tính từ `lich_su_on`, `tra_loi_bai_luyen` bằng truy vấn tổng hợp; lọc ngày theo múi giờ User.
- Phút mỗi ngày dùng cùng nguồn và cách làm tròn với `/learning/today` (`StudyTimeService.days`, `floor(ms/60000)`, xem B2.12; tách 03/11/2026, RS-011). **Xong khi** có thêm: `theoNgay` hôm nay khớp `daHocHomNay.soPhut` của `/learning/today` (chuyển từ B2.12). Bảng điều khiển UI12 (TK §9.1) gọi `overview` với `tuNgay = ngay − 6`, `denNgay = ngay` cho khối hoạt động 7 ngày: `theoNgay` phải đủ mọi ngày trong khoảng (ngày không học = 0), mỗi phần tử có `ngay`, `soLuotOn`, `soPhut`. Thời gian học theo ngày dùng chung một hàm với `/learning/today` (TK §7.3, **đề xuất**), để hai màn hình không lệch số.
- **Đã làm (03/11/2026):** module `stats/` mới: `StatisticsController`, `StatisticsService`, `MasteryCalculator`, `StatisticsRepository` (JPQL + native `ROW_NUMBER()`), row `ReviewStatRow`/`AttemptStatRow`/`SkillCountRow`/`SkillAnswerRow`; DTO `OverviewQuery`, `SkillsQuery`, `StatisticsOverviewResponse`, `BaiLuyenStatsResponse`, `TheoNgayResponse`, `SkillStatResponse`; `StudyTimeService.days(..., boTheId)` (lọc bộ ở `LichSuOnRepository.studyTimes`, `LanLamBaiRepository.studyTimes`, `PracticeHistoryService.studyTimes`); `LearningPlanService.streak`; `app.statistics.*` trong `application.yaml`. Không migration (V14 vẫn để B2.11). Quyết định a–n (chốt 03/11/2026, đề xuất) ở flow. `overview` dùng `@Transactional` thường thay vì chỉ đọc vì `SettingsService.learning` tạo hồ sơ học tập mặc định. **Kiểm chứng:** `FR11StatisticsTest` (5) và `MasteryCalculatorTest` (3) pass; bộ đầy đủ `./mvnw -B test` 394 test, 0 lỗi (03/11). `theoNgay` hôm nay khớp `daHocHomNay` (test). Mockup `thong-ke.html`, `hom-nay.html` mở lại không lỗi console. Postman: thêm 2 request vào "06 Tương tác & thống kê", chưa chạy. **Chưa kiểm chứng:** HTTP thật bằng `curl`, chạy request Postman. **Chưa làm:** lọc theo chủ đề (TK §10 UI35). Flow: [B2.10](../docs/luong-backend/B2.10-thong-ke-nen.md); bàn giao: [Đợt 2 mục 5.11](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.11 Quản trị nền — FR-13, TC-17
- `V14__admin.sql` (V12 đã dùng cho RS-057, V13 cho sổ tay B2.9): `nhat_ky_quan_tri` + tài khoản hệ thống `library-editor@vocab.local` (chủ bộ mẫu).
- API: `GET /admin/users`, `PATCH /admin/users/{id}/status` (khóa/mở → hủy phiên), `PUT /admin/users/{id}/roles` (**không bỏ quyền Admin cuối cùng**), CRUD `/admin/decks` (bộ mẫu: xuất bản/ẩn), thẻ mẫu `GET/POST /admin/decks/{id}/cards` + `PATCH/DELETE /admin/cards/{id}`, `GET /admin/audit-logs`.
- Mọi thao tác quan trọng ghi nhật ký: người làm, hành động, đối tượng, lý do, trước/sau (đã lọc dữ liệu nhạy cảm).
- **Đã làm (03/11/2026):** module `admin/` mới: `AdminUserController`, `AdminDeckController`, `AdminCardController`, `AdminAuditLogController`, `AdminUserService`, `AdminDeckService`, `AuditService`, entity `NhatKyQuanTri` (+ `HanhDongQuanTri`, `LoaiDoiTuong`), `NhatKyQuanTriRepository`, `AdminMapper`, DTO `AdminUserResponse`, `UserStatusRequest`, `UserRolesRequest`, `CreateSampleDeckRequest`, `UpdateSampleDeckRequest`, `DeleteSampleDeckRequest`, `AuditLogQuery`, `AuditLogResponse`. Account: `AccountAdminService`, `UserAdminView`, `NguoiDung.changeStatus/hasRole/replaceRoles`, `NguoiDungRepository.adminPage/countByRoleAndStatus`, `VaiTroRepository.lockByMa`. Content: `SampleDeckService`, `SampleDeckResponse`, `SampleDeckMapper`, `TrangThaiBoMau`, `BoThe.createSample/moderate/isPublished`, `BoTheRepository.findSampleForUpdate/countCopies/countByOwners`, `DeckService.countByOwners`, `CardService` tách chủ bộ/chủ tệp + `get`/`deckIdOf`. `SessionRevoker.revokeAll` trả số phiên. Quyết định a–n (chốt 03/11/2026, đề xuất) ở flow. **Kiểm chứng:** `FR13AdminTest` 9/9 pass; sửa `FR04LibrarySeedTest` chỉ đếm bộ "Khởi động —" (tài khoản hệ thống nay sở hữu cả bộ mẫu do Admin tạo); bộ đầy đủ `./mvnw -B test` 403 test, 0 lỗi (03/11). Mockup `quan-tri-*.html` mở lại không lỗi console. Postman: thêm 22 request vào "07 Quản trị", chưa chạy. **Chưa kiểm chứng:** HTTP thật bằng `curl`, chạy request Postman. **Nợ:** B1.3 `PasswordService` vẫn hủy phiên trong transaction. Flow: [B2.11](../docs/luong-backend/B2.11-quan-tri-nen.md); bàn giao: [Đợt 2 mục 5.12](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).

### [x] B2.12 Bảng điều khiển người học (mở rộng UI12) — FR-02, FR-06, FR-11, TC-09
- Bối cảnh: TK §9.1, §10. UI12 `/hom-nay` là bảng điều khiển; không thêm route, không thêm endpoint `/dashboard`. Hướng đã chọn ngày 28/10/2026; mọi quy tắc dưới đây là **đề xuất**, đã code 31/10/2026.
- Phụ thuộc: B2.5 (phiên kết thúc). B2.8 (thời gian bài luyện) và B2.10 (khối hoạt động 7 ngày) **không chặn**: quyết định 31/10/2026 (đề xuất) làm B2.12 trước, `thoiGian` chỉ từ `lich_su_on`; B2.8 cộng thời gian bài luyện, B2.10 dùng lại cùng cách tính. Không migration: V8/V9 đủ cột; dùng sẵn `idx_phien_hoc_nguoi_bat_dau`, `idx_tien_do_the_hang_doi`, `idx_lich_su_on_nguoi_ngay`.
- API: `GET /learning/today` thêm field, giữ nguyên field cũ:
  - `phienDangDo`: phiên `DANG_HOC` mới nhất của người dùng có `bat_dau_at` từ đầu ngày địa phương hôm nay; không có thì `null`. Dạng `{id, boTheId, boTheTen, chieuHoc, quyThoiGian, batDauAt, hetGioAt, soDaTraLoi, soChuaTraLoi}` (đếm dòng `phien_hoc_the`; tên field theo `StudySessionResponse`). Phiên cũ hơn hôm nay không hiện vì B2.5 không tự đóng phiên quá hạn. FE: `soChuaTraLoi > 0` → “Tiếp tục”; bằng 0 → “Xem tổng kết” (gọi `finish`).
  - `duBaoOn`: đúng 7 phần tử `{ngay, soCanOn}` từ ngày mai đến hết ngày thứ 7. Đếm hàng tiến độ `DANG_HOC`/`ON_TAP`/`HOC_LAI` có `han_on_at` trong `[đầu ngày, đầu ngày kế tiếp)` theo múi giờ người dùng, cùng loại trừ như B2.2 (thẻ/bộ đã xóa, `TAM_NGUNG`, bộ của người khác). Ngày không có thẻ vẫn có phần tử với `soCanOn = 0`. Số của hôm nay là `soQuaHan + soDenHan`, không lặp lại trong `duBaoOn`.
  - `daHocHomNay`: thêm `thoiGian` (ms) theo TK §7.3; `soPhut` = `floor(thoiGian / 60000)` thay cho ước tính số lượt × 20 giây; `soLuot` giữ nguyên.
- Một hàm tính thời gian học theo ngày dùng chung với `/statistics/overview` (B2.10). Ngày của `lich_su_on` lọc theo múi giờ hiện tại của người dùng (như `GET /learning/history`); `su_dung_hoc_ngay` vẫn theo `phien_hoc.mui_gio`, nên khi vừa đổi múi giờ hai nguồn có thể lệch trong một ngày (ghi vào giới hạn).
- FE tương ứng: F2.1 mở rộng (xem `roadmap/SPRINT_PLAN.md`); trang chủ sau đăng nhập và logo về `/hom-nay` (TK §6.1 bước 6).
- Mockup: `mockups/dot2/hom-nay.html` và `mockups/shared/demo.js` đã có các khối và field trên (28/10/2026, trước khi code BE).
- **Xong khi:** `FR06DashboardTest` (hoặc thêm vào `FR06TodayPlanTest`) pass: `phienDangDo` là `null` khi không có phiên, phiên đã `KET_THUC` hoặc phiên bắt đầu hôm qua; chọn phiên mới nhất; đếm đúng đã trả lời/còn lại; không lộ phiên của người khác. `duBaoOn` có đủ 7 ngày, đúng ranh giới nửa đêm theo múi giờ (TC-09), loại thẻ xóa/tạm ngưng, ngày rỗng bằng 0. `thoiGian` bằng tổng `lich_su_on.thoi_gian` hôm nay, `soPhut` làm tròn xuống (phần khớp `theoNgay` của `/statistics/overview` chuyển sang B2.10).
- **Đã làm (31/10/2026):** `PhienDangDoResponse`, `DuBaoNgayResponse` (mới); `DaHocHomNayResponse.thoiGian`; `TodayPlanResponse.phienDangDo`/`duBaoOn` sau `cuuLichOn`; `LearningPlanService.openSession`/`forecast` và `soPhut = floor(thoiGian/60000)`; `PhienHocRepository.findFirstByNguoiDungIdAndTrangThaiAndBatDauAtGreaterThanEqualOrderByBatDauAtDescIdDesc`; `TienDoTheRepository.dueTimes`; `LichSuOnRepository.studyTime`; `StudySessionService.TAT_CA_BO` package-private; test mới `FR06DashboardTest` (3); sửa `FR06TodayPlanTest` (constructor, `soPhut` 2 → 0) và `FR06RescuePlanTest` (constructor). Không migration. Gom `duBaoOn` theo ngày bằng Java (không `CONVERT_TZ`). **Kiểm chứng:** `mvnw -q test -Dtest='FR06*Test,RescuePlanTest,StreakCalculatorTest'` exit 0 (31/10), không đọc được báo cáo surefire nên không có tổng số test. **Chưa kiểm chứng:** bộ test đầy đủ, gọi HTTP thật bằng `curl`, chạy request Postman. Mockup `hom-nay.html?as=an` mở lại 31/10: response demo có đủ field cùng tên với DTO, khối "Phiên đang dở" hiện, console không lỗi; demo `studyMsOf` có cộng thời gian bài luyện (BE chưa, chờ B2.8). Postman: request "Kế hoạch hôm nay (B2.2 · B2.12 · FR-06)" cập nhật description và test (`phienDangDo`, `duBaoOn` 7 ngày, `soPhut = floor(thoiGian/60000)`), chưa chạy. Flow: [B2.12](../docs/luong-backend/B2.12-bang-dieu-khien.md); bàn giao: [Đợt 2](../ban-giao-cho%20fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md).
- **Sửa 03/11/2026 (RS-011):** tách `StudyTimeService.day/days` (gom `lich_su_on` theo ngày địa phương bằng Java, ngày trống = 0); `today()` dùng `day`; thay `LichSuOnRepository.studyTime` bằng `studyTimes`. Test: `FR06DashboardTest.fr06_studyTimeDaysFillsEveryDayAndMatchesToday`, `fr06_studyTimeDayFollowsDaylightSavingBoundaries`.
- **Cuối Đợt 2 →** `/fe-report DOT2`.

---

## Đợt 3 — AI, phát âm, động lực & vận hành (09/11–29/11) · FR-08, 09, 10, 12, 14

### [ ] B3.1 Tác vụ nền & hạn mức dịch vụ — FR-09
- `V15__jobs_ai.sql` (V12 đã dùng cho RS-057, V13 cho sổ tay B2.9, V14 cho admin B2.11; số thực tế lấy số kế tiếp chưa dùng): `tac_vu_nen`, `han_muc_dich_vu`, `su_dung_dich_vu`, `yeu_cau_ai`, `ban_nhap_the_ai`.
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
- `V<n>__speaking.sql` (số kế tiếp chưa dùng khi tới bước này): `ket_qua_phat_am`.
- API: `GET /cards/{id}/audio` (TTS, cache theo nội dung+giọng+phiên bản), `POST /pronunciation/assessments` (multipart, ≤ 15 giây), `GET /pronunciation/assessments/{id}`, `GET /pronunciation/history`, `DELETE /pronunciation/recordings/{id}`.
- Interface `SpeechClient` + Azure Speech adapter + Fake (gắn nhãn "Mô phỏng"). Chỉ số thiếu → `null`, không sinh điểm giả.

### [ ] B3.5 Gợi ý có lý do — FR-08
- API: `GET /learning/recommendations` trả `{reasonCode, message, cardIds, evidence}` với QUEN_NHIEU, SAI_CHINH_TA, CAP_DE_NHAM, PHAT_AM_THAP, QUA_HAN_NHIEU (TK §8.3). Ngưỡng trong `application.yaml`.

### [ ] B3.6 Điểm thưởng, chuỗi ngày, huy hiệu, thử thách — FR-12, TC-15
- `V16__engagement.sql` (số thực tế lấy số kế tiếp chưa dùng): `so_diem_thuong`, `huy_hieu`, `nguoi_dung_huy_hieu`, `thu_thach`, `tien_do_thu_thach`.
- `RewardService` gọi từ B2.4/B2.8: unique `(nguoi_dung_id, loai_su_kien, su_kien_id)`; trần điểm/ngày; chuỗi ngày khi phiên có ≥ 5 lượt hợp lệ (TK §15.1). B2.2 đang tính chuỗi theo **ngày** có ≥ 5 lượt (`su_dung_hoc_ngay`); khi làm bước này phải chốt theo phiên hay theo ngày rồi sửa `LearningPlanService`/`StreakCalculator` và `/learning/today` cho cùng một định nghĩa.
- API: `GET /rewards/history`, `GET /badges`, `GET /challenges`; Admin: CRUD `/admin/badges`, `/admin/challenges` (TK §4.2).

### [ ] B3.7 Thông báo & nhắc học — FR-12, TC-15
- `V17__notification_report.sql` (số thực tế lấy số kế tiếp chưa dùng): `thong_bao`, `bao_cao_noi_dung`.
- API: `GET /notifications`, `PATCH /notifications/{id}`; `POST /admin/announcements`.
- Scheduler mỗi 15 phút: gửi nhắc theo giờ + múi giờ User, khóa chống trùng (user, loại, ngày địa phương); tôn trọng cài đặt tắt kênh.

### [ ] B3.8 Báo cáo nội dung & kiểm duyệt — FR-13
- API: `POST /reports` (bộ/thẻ/đầu ra AI, chống gửi trùng), `GET /admin/reports`, `POST /admin/reports/{id}/resolve` (giữ/ẩn/yêu cầu sửa/từ chối + lý do, ghi nhật ký, thông báo người liên quan).

### [ ] B3.9 Tổng kết tuần — FR-11
- API: `GET /statistics/weekly-summary`: từ đã học, kỹ năng tiến bộ, 3 từ khó, mục tiêu tuần sau. Văn bản từ mẫu; số liệu không lấy từ AI.

### [ ] B3.10 Xóa tài khoản & dữ liệu — FR-14, TC-16
- `V18__privacy.sql` (số thực tế lấy số kế tiếp chưa dùng): `yeu_cau_xoa_du_lieu`.
- API: `POST /me/deletion-requests`; job nền xóa dữ liệu riêng, tệp S3, phiên Redis; ẩn danh nội dung đã chia sẻ theo chính sách.
- Tệp: từ 03/11/2026 (RS-059) bản sao bộ có tệp riêng nên xóa tệp của tác giả không ảnh hưởng bản sao. Còn phải xử lý bản sao tạo trước ngày này (dùng chung `tep_id` với nguồn): sao chép tệp cho bản sao trước khi xóa, hoặc gỡ media khỏi bản sao.
- Admin: `GET /admin/deletion-requests` theo dõi tiến độ xóa (TK §4.2).

### [ ] B3.11 Quản trị vận hành — FR-13
- API: `GET/PUT /admin/service-quotas`, `GET /admin/service-usage` (lượt, lỗi, thời gian, chi phí; chưa có đơn giá → "Chưa xác định"), `GET /admin/statistics`, `GET /admin/jobs`.
- **Cuối Đợt 3 →** `/fe-report DOT3`.

---

## GĐ4 — Kiểm thử & ổn định (30/11–06/12)

### [ ] B4.1 Phủ kiểm thử nghiệm thu TC-01…TC-20
- Mỗi TC ở TK §19 có ít nhất một test tự động (trừ TC-18 thủ công, TC-19/20 có biên bản). Bảng truy vết `FR ↔ API ↔ TC` trong `docs/`.

### [ ] B4.2 Rà soát bảo mật
- Swagger UI và `/v3/api-docs` bật mặc định và `permitAll`: đặt `SWAGGER_ENABLED=false` ở production. Image `rustfs/rustfs`, `axllent/mailpit`, `amazon/aws-cli` đang dùng tag `latest`: ghim phiên bản trước khi triển khai.
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
- `docker-compose.prod.yml`: Nginx reverse proxy (FE + `/api` cùng domain), HTTPS, không mở cổng MySQL/Redis/S3 ra ngoài, biến bí mật qua `.env` không commit. Đặt `FORWARD_HEADERS_STRATEGY=native` cho service `api` (Nginx gửi `X-Forwarded-For`/`-Proto`) để rate limit theo IP thật; nếu không, mọi người dùng chung một IP proxy. Bật `COOKIE_SECURE=true`, `SPRING_PROFILES_ACTIVE` khác `dev`.

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
