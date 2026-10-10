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

## Phạm vi đã tích hợp đến B1.11

- Đăng ký, xác thực/gửi lại email, đăng nhập/đăng xuất, quên/đặt lại/đổi mật khẩu và nút Google theo endpoint backend.
- Khởi đầu, hồ sơ, thiết lập học/nhắc học; dùng tên trường và `version` backend. Khi xung đột, tải lại trước khi sửa tiếp.
- Bộ cá nhân: tạo/sửa/xóa, yêu thích; mục tiêu bộ độc lập hồ sơ và có thể bỏ chọn.
- Thẻ: từ, từ loại, IPA, nghĩa, ví dụ/bản dịch, độ khó 1–5, nguồn, nhãn, ảnh và hai vai trò âm thanh. Cảnh báo trùng không chặn lưu.
- Thư viện công khai, phân trang, bộ mẫu; sao chép với key giữ theo người dùng/bộ nguồn khi thử lại hoặc tải lại trang. Bản sao sửa độc lập.
- Quản trị chủ đề/nhãn B1.7 dành cho ADMIN. CSV B1.12 và các chức năng học SRS/luyện tập ở giai đoạn sau vẫn chưa mở.

Âm thanh tải lên không bắt buộc. Nút **Đọc từ/câu bằng trình duyệt** dùng [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis), ưu tiên giọng tiếng Anh cài trên máy; danh sách giọng và khả năng phát phụ thuộc thiết bị. Có tệp âm thanh thì thẻ giữ nút nghe tệp riêng. Không tạo `amTuId`/`amCauId` giả, không đưa giọng trình duyệt lên storage, không cần khóa Google Cloud. Kiểm tra tự động không xác nhận chất lượng âm thanh nghe được.

FE và mockup dùng SVG cùng nét, không dùng emoji. Thanh bên desktop có nút thu gọn/mở rộng; trên điện thoại giữ thanh dưới với icon và tên. Màu hành động: xanh dương lưu/tạo/sao chép, cam sửa, xanh ngọc nghe, đỏ xóa, trung tính điều hướng/hủy. Chữ/icon và trạng thái focus vẫn thể hiện chức năng, không dựa riêng vào màu.

### Mock và kiểm tra

`NEXT_PUBLIC_API_MOCKING=enabled` chỉ mock endpoint nền `GET /api/v1/public/ping` với `{ status, serverTime }`. Auth/nội dung đi tới backend thật; các handler demo cũ không được nạp. Mockup HTML dùng demo riêng và không chứng minh backend đã được kiểm thử. `npm test` dùng Node test runner, không dùng Vitest. `/_ui` chỉ mở ở dev; production trả404.

### Bản xem trước cổng3100

```powershell
$env:NEXT_DIST_DIR='.next-check/fe011-build'
npm run build
npm run start -- -p 3100
```

Dùng cùng `NEXT_DIST_DIR` khi build/start. Với OAuth/email, backend đặt `APP_FRONTEND_URL=http://localhost:3100`. Upload đi trực tiếp bằng URL ký; cấu hình CORS của bucket phải chứa origin website. Cấu hình local `backend/k28/docker/s3-cors.json` hỗ trợ3000 và3100 (localhost/127.0.0.1); cổng khác cần bổ sung và chạy lại bước cấu hình bucket trong hướng dẫn backend. Đây là CORS storage, không thay quyền ownership của API.

**Hiển thị ảnh:** mặc định bật ở đầu danh sách thẻ của bộ cá nhân và thư viện. Tắt thì chỉ tải ảnh khi bấm **Xem ảnh**; bật thì ảnh gần vùng đang xem tự tải qua endpoint media đúng quyền. Lựa chọn được nhớ trên trình duyệt, không thêm trường vào thiết lập tài khoản của BE. Hàng nút tự xuống dòng để không bị cắt trên màn hình nhỏ.
