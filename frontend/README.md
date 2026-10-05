# VocabLearning frontend

## Chạy với backend thật

- Cần Node.js và backend ở `http://localhost:8080`.
- Trong thư mục `frontend`: chạy `npm ci`, sau đó `npm run dev`.
- Mở `http://localhost:3000`. Frontend gọi `/api/v1/*` qua proxy cùng miền; cookie phiên và CSRF được giữ tự động.
- Nếu backend dùng địa chỉ khác, tạo `.env.local` từ `.env.example` và sửa `API_URL`, rồi khởi động lại frontend.
- Dùng email thật để đăng ký và mở thư xác thực. Tài khoản demo của mockups không tự tồn tại trong MySQL.

## Chức năng khớp backend hiện tại

Tài khoản, đăng nhập/đăng xuất, xác thực email, Google, hồ sơ/ảnh đại diện, thiết lập học/thông báo, danh mục quản trị, tạo/sửa/xóa/yêu thích bộ thẻ. Danh sách dùng PageResponse và phiên bản từ máy chủ khi lưu.

Thẻ, CSV, thư viện, học, luyện tập, sổ tay, thống kê và các phần quản trị Đợt 2 chưa có controller backend; frontend hiển thị trạng thái chưa hỗ trợ thay vì gọi endpoint chưa tồn tại. Các trang dự kiến được giữ để tiếp tục triển khai.

## Kiểm tra

- `npm run lint`
- `npm test`
- `npm run build`

Các bài kiểm tra bao phủ CSRF, cookie, xoay token khi đăng nhập, phản hồi rỗng, lỗi phiên bản/validation và lỗi mạng.

Có thể kiểm tra giao diện riêng với fixture: chạy `node tests/contract-server.mjs`, sau đó đặt `API_URL=http://127.0.0.1:43127`, `NEXT_DIST_DIR=.next-contract` và chạy `npm run dev -- --port 3001`. Fixture chỉ dùng cho kiểm thử, không thay thế backend thật.
