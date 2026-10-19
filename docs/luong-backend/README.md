# Sơ đồ luồng backend B0.1–B1.12

Mỗi giai đoạn có sơ đồ hoạt động, sơ đồ tuần tự, giải thích từng bước và nhánh lỗi. Ảnh SVG hiển thị trực tiếp; có thể mở phần mã Mermaid dưới mỗi ảnh để sửa sơ đồ.

## Nền tảng B0

- [B0.1 — Khởi tạo backend](B0.1-khoi-tao-du-an.md)
- [B0.2 — Môi trường Docker Compose](B0.2-docker-compose.md)
- [B0.3 — Cấu hình ứng dụng và Flyway](B0.3-cau-hinh-flyway.md)
- [B0.4 — Xử lý lỗi và tiện ích web](B0.4-loi-va-web-chung.md)
- [B0.5 — Bảo mật nền](B0.5-bao-mat-nen.md)
- [B0.8 — Kho tệp và email](B0.8-luu-tru-va-email.md)

## Tài khoản B1

- [B1.1 — Đăng ký và xác thực email](B1.1-dang-ky-xac-thuc-email.md)
- [B1.2 — Đăng nhập, đăng xuất và thông tin phiên](B1.2-dang-nhap-dang-xuat-phien.md)
- [B1.3 — Quên, đặt lại và đổi mật khẩu](B1.3-mat-khau.md)
- [B1.4 — Đăng nhập Google](B1.4-dang-nhap-google.md)
- [B1.5 — Hồ sơ và thiết lập](B1.5-ho-so-va-thiet-lap.md)

## Tệp và nội dung B1

- [B1.6 — Tệp tin và ảnh đại diện](B1.6-tep-tin-anh-dai-dien.md)
- [B1.7 — Chủ đề, nhãn và chủ đề yêu thích](B1.7-chu-de-nhan-chu-de-yeu-thich.md)
- [B1.8 — Bộ thẻ cá nhân](B1.8-bo-the-ca-nhan.md)
- [B1.9 — Thẻ từ vựng](B1.9-the-tu-vung.md)
- [B1.10 — Thư viện công khai](B1.10-thu-vien-cong-khai.md)
- [B1.11 — Sao chép bộ](B1.11-sao-chep-bo.md)
- [B1.12 — Nhập và xuất CSV](B1.12-csv.md)

## Học SRS B2

- [B2.1 — Bộ tính SRS thuần](B2.1-srs-calculator.md)
- [B2.2 — Kế hoạch hôm nay](B2.2-ke-hoach-hom-nay.md)

## Redis

- [Luồng Redis trong dự án](REDIS-trong-du-an.md)

## Cách xem

Mở file Markdown bằng trình xem có hỗ trợ ảnh SVG. Nếu trình xem không hỗ trợ Mermaid, ảnh SVG phía trên mã nguồn vẫn hiển thị.

## Quy ước vẽ thống nhất

- Sơ đồ hoạt động dùng `flowchart TD`: đi từ trên xuống, hình thoi biểu diễn điều kiện, nhánh ghi rõ lựa chọn hoặc lỗi.
- Sơ đồ tuần tự dùng `sequenceDiagram` và `autonumber`: đọc từ trên xuống theo số bước; mũi tên liền là yêu cầu, nét đứt là phản hồi; `alt/else` tách trường hợp.
- Mỗi sơ đồ có ảnh SVG hiển thị trực tiếp và phần mã Mermaid thu gọn ngay bên dưới. Phần giải thích giữ gần sơ đồ và các quy tắc liên quan.
- Tất cả sơ đồ dùng cùng font, màu và khoảng cách từ [mermaid-config.json](mermaid-config.json). Cấu hình cũng được đưa vào mã Mermaid để xem trực tiếp nhất quán.
- Đường dẫn ảnh dùng `assets/<tên-file>-<số-thứ-tự>.svg`; thứ tự ảnh theo thứ tự sơ đồ trong tài liệu.

Sau khi sửa Mermaid, chạy `python docs/luong-backend/render-diagrams.py` từ thư mục gốc dự án. Cần Node.js và Mermaid CLI (`mmdc`); công cụ chỉ cập nhật Markdown và SVG trong thư mục tài liệu này, kiểm tra mọi sơ đồ render thành công trước khi ghi Markdown.

Danh sách hiện có 17 tài liệu giai đoạn và một tài liệu Redis. B0.6 và B0.7 chưa có file luồng riêng trong thư mục này.
