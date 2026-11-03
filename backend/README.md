# Hướng dẫn chạy Backend (K28)

Dự án Backend K28 được xây dựng bằng Java Spring Boot (yêu cầu Java 21) và sử dụng Docker để quản lý các dịch vụ phụ trợ như MySQL, Redis, S3 (RustFS) và Mailpit.

Bạn có thể chạy dự án theo 2 cách tùy thuộc vào nhu cầu.

## Cách 1: Chạy tất cả bằng Docker (Nhanh nhất, không cần cài Java)

Cách này sẽ dùng Docker để tự động build mã nguồn Java và chạy toàn bộ Database, Redis, API... Máy bạn KHÔNG cần cài đặt Java (JDK) hay Maven.

**Yêu cầu:** Máy tính đã cài đặt và đang bật **Docker Desktop**.

1. Mở Terminal (PowerShell) và trỏ vào thư mục chứa mã nguồn backend:
   ```bash
   cd backend/k28
   ```

2. Lần đầu, tạo file `.env` từ file mẫu (Compose báo lỗi `copy .env.example to .env` nếu thiếu):
   ```powershell
   Copy-Item .env.example .env
   ```

3. Khởi động:
   ```bash
   docker compose --profile app up -d --build
   ```

4. Docker sẽ tự động tải các ảnh cần thiết, biên dịch code và bật Backend lên ở cổng **8080**.
   - API sẽ chạy ở: `http://localhost:8080/api/v1/...`
   - Giao diện tài liệu Swagger (nếu có): `http://localhost:8080/swagger-ui.html`

*Để tắt toàn bộ hệ thống, chạy lệnh:*
```bash
docker compose --profile app down
```

---

## Cách 2: Chạy API thủ công (Dành cho Dev, dễ debug)

Cách này giúp bạn lập trình và debug dễ dàng hơn. Dịch vụ phụ trợ sẽ chạy bằng Docker, còn lõi Spring Boot API sẽ chạy trực tiếp trên máy của bạn.

**Yêu cầu:** 
- Máy tính đã cài **Docker Desktop**.
- Máy tính đã cài **Java 21 (JDK 21)** và thiết lập biến môi trường `JAVA_HOME`.

1. Tạo `.env` như Cách 1 (nếu chưa có), rồi khởi động các dịch vụ phụ trợ (MySQL, Redis, S3, Mail...) bằng Docker:
   ```bash
   cd backend/k28
   docker compose up -d
   ```

2. Bật Spring Boot API bằng Maven Wrapper (đã tích hợp sẵn):
   - **Trên Windows (PowerShell / CMD):**
     ```cmd
     .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
     ```
   - **Trên macOS / Linux (hoặc Git Bash):**
     ```bash
     ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
     ```

     Profile `dev` nạp dữ liệu mẫu (gồm tài khoản ADMIN) và phải bật tường minh; không có profile mặc định.

3. Chờ khoảng 1-2 phút, khi thấy dòng báo `Started ...Application in ... seconds` là Backend đã hoạt động ở cổng **8080**.

---

## Cấu hình và profile

| Nơi | Nội dung |
|---|---|
| `application.yaml` | Cấu hình chung, **không** có giá trị mặc định cho bí mật. Thiếu hoặc rỗng `DB_USER`, `DB_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` thì app dừng ngay khi khởi động (`RequiredSettingsConfig`). Mặc định an toàn: `COOKIE_SECURE=true`, `SWAGGER_ENABLED=false`. |
| `application-dev.yaml` (profile `dev`) | Giá trị dev cho các biến trên, cookie không `Secure`, bật Swagger, nạp `db/seed` (tài khoản ADMIN mẫu). |
| `src/test/resources/application-test.yaml` | Giá trị giả cho test; MySQL, Redis, S3 lấy từ Testcontainers. |
| `.env` | Compose đọc toàn bộ file này cho container `api` (`env_file`). `SPRING_PROFILES_ACTIVE=dev` trong file mẫu. Khi triển khai thật: bỏ profile `dev`, đặt bí mật riêng. |

Compose chỉ mở cổng MySQL, Redis, S3, Mailpit trên `127.0.0.1` (Redis không có mật khẩu); image được ghim phiên bản (`rustfs/rustfs:1.0.3`, `amazon/aws-cli:2.38.5`, `axllent/mailpit:v1.32.0`). CORS của bucket do `docker/s3-init.sh` sinh từ `S3_CORS_ORIGINS` (danh sách origin cách nhau dấu phẩy); đổi biến rồi chạy lại `docker compose up -d s3-init`.

---

## Chạy test

Bật Docker Desktop (Testcontainers tự tạo MySQL, Redis, RustFS), rồi chạy trong `backend/k28`:

```bash
./mvnw test
```

Không cần đặt `JAVA_TOOL_OPTIONS`. Trên Windows, profile Maven `windows-tests` tự thêm `-Djdk.net.unixdomain.tmpdir=%PUBLIC%`; thiếu tùy chọn này, Netty báo lỗi `Unable to establish loopback connection`. Surefire nạp Mockito bằng `-javaagent`, nên không còn cảnh báo nạp agent động. Chạy một lớp test: `./mvnw test -Dtest=FR03FilesTest`.

---

## Khắc phục lỗi thường gặp

1. **Lỗi đụng cổng (Port 8080 was already in use):**
   - Xảy ra khi bạn vừa chạy Cách 1 xong lại chạy tiếp Cách 2. 
   - Khắc phục: Bạn phải tắt cái API đang chạy ngầm trong Docker bằng lệnh:
     ```bash
     docker compose --profile app stop api
     ```
     Sau đó mới chạy lại bằng lệnh `./mvnw`.

2. **Lỗi `ECONNREFUSED 127.0.0.1:8080` ở Frontend:**
   - Xảy ra do bạn bật Frontend mà quên bật Backend.
   - Khắc phục: Làm theo Cách 1 hoặc Cách 2 để bật Backend lên trước khi test trên web.

3. **Lỗi Docker `The system cannot find the file specified` / `npipe:////./pipe/dockerDesktopLinuxEngine`:**
   - Xảy ra do chưa bật phần mềm Docker Desktop trên Windows.
   - Khắc phục: Nhấn Start, gõ tìm `Docker Desktop` rồi mở nó lên, đợi hiện biểu tượng màu xanh (Engine running) rồi chạy lại lệnh.
