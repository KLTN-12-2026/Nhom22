# Hạn chế đã biết

Cập nhật 16/11/2026. Nguồn: [KE_HOACH_CAT_DOT3.md](../docs/KE_HOACH_CAT_DOT3.md) và roadmap backend.

## 1. Chờ khóa dịch vụ thật

Code đã xong và chạy bằng bản mô phỏng (`fake`). Mỗi mục cần đúng một lượt gọi thật để tick.

| Bước | Dịch vụ | Biến cần | Hiện tại |
|---|---|---|---|
| B3.2, B3.3 | OpenAI (tạo thẻ, sửa câu, giải thích ngữ cảnh) | `OPENAI_API_KEY`, `AI_PROVIDER=openai` | `FakeAiClient`, kết quả gắn `moPhong=true` |
| B3.3 (ảnh) | Google Imagen | khóa Google, `IMAGE_PROVIDER` | Chỉ có `FakeImageClient` (vẽ ảnh hình học); **chưa viết client Imagen thật**, có khóa vẫn phải code thêm |
| B3.4a | OpenAI TTS | `OPENAI_API_KEY`, `TTS_PROVIDER=openai` | Âm thanh mô phỏng |
| B3.4b | Azure Speech | `AZURE_SPEECH_KEY`, `SPEECH_PROVIDER=azure` | Điểm phát âm mô phỏng |
| B3.12a | VNPay sandbox | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, URL IPN công khai, `PAYMENT_PROVIDER=vnpay` | Cổng mô phỏng, giao diện ghi "Mô phỏng" |

## 2. Đã cắt (hướng phát triển)

| Nhóm | Mục |
|---|---|
| Quản trị | `GET /admin/statistics` (thống kê tổng hợp chung), `GET /admin/jobs`, theo dõi chi phí dịch vụ, UI46 tổng quan, tab UI53 "Tác vụ nền", `GET /admin/deletion-requests` (xem qua nhật ký) |
| Động lực | CRUD `/admin/badges`, `/admin/challenges`, UI54 (huy hiệu và thử thách cố định bằng migration) |
| Thông báo | `POST /admin/announcements`, UI52 |
| Kiểm duyệt | Trạng thái "yêu cầu sửa", "từ chối" kèm thông báo người liên quan (chỉ giữ/ẩn) |
| Thống kê | Bản đồ từng từ dạng lưới màu (UI36 chỉ còn bảng bộ thẻ × kỹ năng) |
| Phát âm | Biểu đồ tiến bộ phát âm (chỉ so 2 lần gần nhất cùng từ) |
| Thanh toán | Lưu thẻ, tự gia hạn, MoMo/ZaloPay, chuyển khoản thủ công, đổi gói giữa kỳ (trả 422), hoàn tiền, hóa đơn VAT (chỉ có biên nhận HTML) |
| Hạn mức | Hạn mức theo nhà cung cấp/loại tác vụ (một bảng phẳng theo gói) |
| Kiểm thử | Đo hiệu năng riêng upload/AI; E2E chỉ phủ bước 1–4, 8 của TK §20.2 |
| Vận hành | Lịch sao lưu tự động hằng ngày, cảnh báo job lỗi |

## 3. Hoãn (chỉ làm khi dư thời gian)

1. Web push + PWA cho nhắc học.
2. `POST /ai/exercise-drafts` (AI soạn bài luyện).
3. Kế hoạch theo ngày thi TOEIC.
4. Gợi ý `PHAT_AM_THAP` (chỉ bật khi B3.4b dùng dịch vụ thật), nhóm lỗi `PHAT_AM` trong `loi_hoc_tap`, tự xóa bản ghi âm theo thời hạn.

## 4. Giới hạn kỹ thuật

- Redis không sao lưu; mất Redis thì người dùng phải đăng nhập lại và bộ đếm rate limit bị đặt lại.
- Rate limit theo IP cần proxy ghi đè `X-Forwarded-For` (Nginx prod đã cấu hình); chạy thẳng không proxy thì giới hạn theo IP kết nối.
- Hạn mức AI là theo ngày và theo gói, không có rate limit theo phút cho AI.
- Giờ nghiệp vụ thanh toán và doanh thu cố định `Asia/Ho_Chi_Minh`.
- DB dev còn 30 bộ mẫu theo chủ đề nhập từ `data/csv` (IPA giọng Anh, lệch giọng TTS `alloy`). Chốt 16/11/2026: **không** đưa vào seed hay demo; môi trường sạch chỉ có 8 bộ × 30 thẻ của `R__library_starter.sql`.
- Biên nhận thanh toán là HTML in được, không phải hóa đơn điện tử.
