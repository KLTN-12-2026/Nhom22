# VocabLearning — Frontend

Ứng dụng web tiếng Việt của VocabLearning, xây dựng bằng Next.js và React. Giao diện cung cấp không gian quản lý bộ thẻ từ vựng, tài khoản cá nhân và thiết lập học tập.

## Yêu cầu

- Node.js 22 LTS và npm.
- Backend VocabLearning đang chạy, mặc định tại `http://localhost:8080`.

## Chạy frontend

Mở terminal trong thư mục `frontend` và thực hiện:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Chỉ cần sao chép file môi trường trong lần thiết lập đầu tiên.

Mở **[VocabLearning](http://localhost:3000)** trên trình duyệt. Khi đăng ký tài khoản trên máy cá nhân, mở [Mailpit](http://localhost:8025) để đọc email xác thực.

## Kết nối backend

File `.env.local` sử dụng các giá trị:

```dotenv
API_URL=http://localhost:8080
NEXT_PUBLIC_API_MOCKING=disabled
```

| Biến | Ý nghĩa |
|---|---|
| `API_URL` | Địa chỉ gốc của backend, không bao gồm `/api/v1` |
| `NEXT_PUBLIC_API_MOCKING` | Đặt `disabled` để sử dụng backend thật |

Frontend gọi `/api/*` trên cùng địa chỉ website. Next.js chuyển tiếp yêu cầu tới backend, giữ cookie phiên đăng nhập và cơ chế CSRF.

Nếu backend chạy ở địa chỉ khác, cập nhật `API_URL` rồi khởi động lại frontend. Khi đổi cổng hoặc địa chỉ website, cập nhật `APP_FRONTEND_URL` ở backend tương ứng.

## Build và chạy

Thiết lập `API_URL` trước khi build, sau đó chạy:

```powershell
npm run build
npm run start
```

Truy cập [localhost:3000](http://localhost:3000). Backend cần tiếp tục chạy để sử dụng các chức năng có dữ liệu và đăng nhập.

## Lệnh thường dùng

| Lệnh | Chức năng |
|---|---|
| `npm ci` | Cài đặt thư viện theo file khóa phiên bản |
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` | Tạo bản build |
| `npm run start` | Chạy bản build |
| `npm run lint` | Kiểm tra quy tắc mã nguồn |
| `npm test` | Chạy kiểm thử |

## Xử lý lỗi kết nối

- **Không tải được dữ liệu:** kiểm tra backend đã chạy và `API_URL` trỏ đúng địa chỉ; mở [Health check](http://localhost:8080/actuator/health/readiness) nếu dùng cổng mặc định.
- **Cổng 3000 đang được sử dụng:** dừng ứng dụng đang chiếm cổng hoặc chạy `npm run dev -- --port 3001`, đồng thời đổi `APP_FRONTEND_URL` của backend thành `http://localhost:3001`.
- **Thay đổi cấu hình chưa có hiệu lực:** dừng frontend bằng `Ctrl+C` rồi chạy lại; nếu dùng bản build, build lại trước khi chạy.

Để dừng frontend, nhấn `Ctrl+C` trong terminal đang chạy.
