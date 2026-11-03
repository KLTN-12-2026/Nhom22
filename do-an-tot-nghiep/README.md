# VocabLearning

**Không gian học từ vựng tiếng Anh dành cho người Việt.**

VocabLearning giúp người học tổ chức từ vựng thành các bộ thẻ, xây dựng mục tiêu học tập và quản lý nội dung cá nhân trong một giao diện tiếng Việt. Ứng dụng web kết nối với API để lưu dữ liệu và duy trì trải nghiệm theo tài khoản của mỗi người dùng.

## Tính năng

- **Tài khoản cá nhân:** đăng ký, đăng nhập, xác thực email, khôi phục mật khẩu và đăng nhập bằng Google khi đã cấu hình OAuth.
- **Bộ thẻ từ vựng:** tạo, chỉnh sửa, xóa và đánh dấu yêu thích các bộ thẻ; tổ chức nội dung theo chủ đề.
- **Hồ sơ người học:** cập nhật thông tin cá nhân và ảnh đại diện.
- **Thiết lập học tập:** lựa chọn mục tiêu, trình độ và tùy chỉnh thông báo.
- **Quản lý danh mục:** quản trị chủ đề và nhãn cho nội dung từ vựng.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React, JavaScript, TanStack Query, React Hook Form, Zod |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA, Flyway |
| Cơ sở dữ liệu | MySQL 8.4 |
| Phiên đăng nhập | Redis 7.4, Spring Session |
| Lưu trữ tệp | RustFS, giao thức S3 |
| Môi trường chạy | Docker Compose, Mailpit để kiểm tra email trên máy cá nhân |

## Yêu cầu môi trường

- Node.js 22 LTS và npm để chạy frontend.
- Docker Desktop đang chạy để khởi động backend và các dịch vụ đi kèm.
- JDK 21 nếu chạy backend trực tiếp bằng Maven Wrapper.

Các lệnh bên dưới dùng PowerShell. Bắt đầu tại thư mục gốc của dự án.

## Chạy ứng dụng

### 1. Khởi động backend

Tạo cấu hình môi trường trong lần chạy đầu tiên, sau đó khởi động API và các dịch vụ phụ trợ:

```powershell
Copy-Item backend/k28/.env.example backend/k28/.env
cd backend/k28
docker compose --profile app up -d --build
```

Kiểm tra trạng thái API tại [Health check](http://localhost:8080/actuator/health/readiness). Lần chạy đầu có thể mất vài phút để tải image và build backend.

### 2. Khởi động frontend

Mở một terminal mới tại thư mục gốc của dự án:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Chỉ cần sao chép file môi trường trong lần thiết lập đầu tiên. Mở **[VocabLearning](http://localhost:3000)** trên trình duyệt.

File `frontend/.env.local` sử dụng cấu hình:

```dotenv
API_URL=http://localhost:8080
NEXT_PUBLIC_API_MOCKING=disabled
```

`API_URL` là địa chỉ gốc của backend, không thêm `/api/v1`. Next.js chuyển tiếp các yêu cầu `/api/*` tới backend để duy trì cookie đăng nhập. Nếu đổi địa chỉ backend, sửa `API_URL` rồi khởi động lại frontend.

### 3. Bắt đầu sử dụng

1. Truy cập website và chọn **Đăng ký**.
2. Mở [hộp thư Mailpit](http://localhost:8025) để lấy email xác thực khi chạy trên máy cá nhân.
3. Xác thực email, đăng nhập và thiết lập mục tiêu học tập.
4. Tạo bộ thẻ đầu tiên, cập nhật hồ sơ và tùy chỉnh thông báo theo nhu cầu.

## Các địa chỉ trên máy cá nhân

| Dịch vụ | Địa chỉ |
|---|---|
| Website | [localhost:3000](http://localhost:3000) |
| API | [localhost:8080/api/v1](http://localhost:8080/api/v1) |
| Kiểm tra trạng thái API | [Health check](http://localhost:8080/actuator/health/readiness) |
| Khám phá API | [Swagger UI](http://localhost:8080/swagger-ui/index.html) |
| Hộp thư kiểm tra | [Mailpit](http://localhost:8025) |
| Quản lý lưu trữ tệp | [RustFS Console](http://localhost:9001) |
| MySQL | `localhost:3307` |
| Redis | `localhost:6379` |

## Chạy frontend từ bản build

Trong thư mục `frontend`, giữ backend đang chạy và thực hiện:

```powershell
npm run build
npm run start
```

Ứng dụng mở tại [localhost:3000](http://localhost:3000). Cấu hình `API_URL` cần được thiết lập trước khi build.

## Chạy backend trực tiếp

Để chạy backend bằng JDK 21 thay cho container API, tạo `backend/k28/.env` từ file mẫu rồi thực hiện trong thư mục `backend/k28`:

```powershell
docker compose up -d
.\mvnw.cmd spring-boot:run
```

Nếu container API đang chạy, dừng nó trước bằng `docker compose --profile app stop api` để giải phóng cổng `8080`. Frontend vẫn chạy theo hướng dẫn ở trên.

## Cấu hình dịch vụ

- **Backend:** cấu hình trong `backend/k28/.env`, gồm kết nối MySQL, lưu trữ S3 và địa chỉ frontend (`APP_FRONTEND_URL`).
- **Frontend:** cấu hình trong `frontend/.env.local`, dùng `API_URL` để chọn backend và `NEXT_PUBLIC_API_MOCKING=disabled` để kết nối API thật.
- **Google OAuth:** điền `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và đăng ký callback `http://localhost:8080/api/v1/auth/google/callback` trong ứng dụng Google OAuth. Các giá trị mẫu chỉ phục vụ khởi động môi trường local.

Giữ các file môi trường chứa thông tin xác thực ngoài Git. Cấu hình mẫu dành cho chạy trên máy cá nhân.

## Dừng ứng dụng

- Frontend: nhấn `Ctrl+C` trong terminal đang chạy.
- Backend và dịch vụ phụ trợ: chạy lệnh sau trong thư mục `backend/k28`:

```powershell
docker compose --profile app down
```

Dữ liệu MySQL, Redis và RustFS được giữ trong Docker volumes để sử dụng ở lần chạy tiếp theo.
