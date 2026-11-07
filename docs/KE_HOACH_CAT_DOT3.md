# Kế hoạch cắt phạm vi Đợt 3 → GĐ5 (ưu tiên giữ chân người dùng)

| Mục | Giá trị |
|---|---|
| Ngày lập | 07/11/2026 |
| Dựa trên | `roadmap/TienDoDuKien_backend.md` (B3.1–B5.4), `roadmap/TienDoDuKien_fronend.md` (F2.2, F3.1–F5.4), `roadmap/SPRINT_PLAN.md` (S7–S11), TK §9, §15, §19, §20 |
| Phạm vi | S7–S11 · 09/11–14/12/2026 |
| Trạng thái | **Đã áp 07/11/2026** vào roadmap BE/FE, `SPRINT_PLAN.md`, TK §8.3, §15.1, §20.2 (DOC3-01…06). Còn chờ GVHD đồng ý các mục Cắt/Hoãn (mục 5) |
| Hạn cứng | Demo hội đồng 14/12/2026 |

## 0. Nguyên tắc cắt

1. **Không bỏ hẳn FR nào trong đề cương.** Mỗi FR-08…FR-14 giữ một "lõi" demo được và có TC chứng minh; chỉ cắt chiều sâu.
2. **Cắt trước phần chỉ Admin nhìn thấy** (CRUD cấu hình, thống kê vận hành, chi phí), vì người học không cảm nhận được.
3. **Giữ đủ phần người học cảm nhận được:** nội dung, nghe, tự điền thẻ, chuỗi ngày, nhắc học, tiến bộ nhìn thấy được.
4. **Thêm 4 việc giữ chân rẻ (R-01…R-04)**, mỗi việc gắn vào một bước có sẵn, không mở bước mới.
5. Mọi phần hoãn/cắt ghi vào mục "Hạn chế đã biết" (B5.3) và "Hướng phát triển" của báo cáo, không giấu.

Ký hiệu: **Giữ** = làm như roadmap · **Gọn** = làm lõi, bỏ phần ghi rõ · **Hoãn** = chỉ làm nếu dư thời gian (mục 4) · **Cắt** = chuyển sang hướng phát triển.

## 1. Quyết định theo bước

### 1.1. Việc tồn từ Đợt 2

| Bước | Quyết định | Phạm vi giữ | Lý do |
|---|---|---|---|
| F2.2 Phiên học flashcard | **Giữ**, làm đầu S7 | Hàng đợi chưa đồng bộ khi mất mạng + nhánh 409 tải lại phiên | Màn dùng nhiều nhất; TC-08, TC-18 phụ thuộc |

### 1.2. Đợt 3

| Bước | Quyết định | Giữ | Bỏ / hoãn | TC |
|---|---|---|---|---|
| B3.1 Tác vụ nền & hạn mức | **Giữ** | `JobWorker` SKIP LOCKED, retry hữu hạn, `QuotaService` giữ chỗ nguyên tử, hạn mức theo user/ngày | Hạn mức theo nhà cung cấp/loại tác vụ phức tạp: một bảng cấu hình phẳng là đủ | TC-12 |
| B3.2 + F3.1 Xưởng thẻ AI | **Giữ** | Đủ như roadmap | — | TC-12, TC-13 |
| B3.3 + F3.2/F3.3 AI khác | **Gọn** | `sentence-feedback`, `context-explanations` (dùng lại cho **R-02**), `GET /me/service-quota`, `GET /ai/history` dạng danh sách | `POST /ai/exercise-drafts` → **Hoãn** | TC-12 |
| B3.4a TTS | **Giữ**, kéo lên S7 | `GET /cards/{id}/audio` (cache theo nội dung + giọng + phiên bản) | — | TC-14 (phần nghe mẫu) |
| B3.4b + F3.5 Đánh giá phát âm | **Gọn** | Ghi ≤ 15 giây, gửi, xem chỉ số có thật, lịch sử, xóa bản ghi; so sánh = 2 lần gần nhất cùng từ | Biểu đồ tiến bộ phát âm | TC-14 |
| B3.5 + F3.4 Gợi ý có lý do | **Giữ** | `QUEN_NHIEU`, `SAI_CHINH_TA`, `CAP_DE_NHAM`, `QUA_HAN_NHIEU`, thêm `TIEN_BO` (**R-04**) | `PHAT_AM_THAP` chỉ bật khi B3.4b dùng dịch vụ thật | — |
| B3.6 + F3.6 Động lực | **Gọn** | Sổ điểm (unique sự kiện, trần/ngày), chuỗi ngày + ngày đóng băng (**R-03**), 5–6 huy hiệu cố định seed bằng migration, 1 thử thách tuần cố định | CRUD `/admin/badges`, `/admin/challenges`, UI54 → **Cắt** | TC-15 |
| B3.7 + F3.7 Thông báo & nhắc | **Gọn** | Scheduler 15 phút, nhắc email + trong ứng dụng, khóa chống trùng, chuông + `/thong-bao` | `POST /admin/announcements`, UI52 → **Cắt**; web push → **Hoãn** | TC-15 |
| B3.8 + F3.8 Báo cáo & kiểm duyệt | **Gọn** | `POST /reports` chống trùng, hàng đợi Admin, xử lý **giữ / ẩn** + lý do + nhật ký | Trạng thái "yêu cầu sửa", "từ chối" kèm thông báo người liên quan | — |
| B3.9 + F3.9 Tổng kết tuần & bản đồ | **Gọn** | `weekly-summary` đủ; UI36 = bảng **bộ thẻ × kỹ năng** từ `/statistics/skills`, có "Chưa đủ dữ liệu" | Bản đồ từng từ dạng lưới màu, bấm từ xem lịch sử | — |
| B3.10 + F3.10 Xóa tài khoản | **Gọn** | `POST /me/deletion-requests`, job xóa dữ liệu riêng + tệp S3 + phiên Redis, ẩn danh tác giả bộ đã chia sẻ; bản sao trước RS-059: **gỡ media khỏi bản sao** | `GET /admin/deletion-requests` → **Cắt** (xem qua nhật ký) | TC-16 |
| B3.11 + F3.11 Quản trị vận hành | **Gọn mạnh** | `GET/PUT /admin/service-quotas`, `GET /admin/service-usage` (lượt, lỗi), UI51 | `GET /admin/statistics`, `GET /admin/jobs`, chi phí, UI46 tổng quan, tab UI53 "Tác vụ nền" → **Cắt** | Demo bước 9 |

### 1.3. GĐ4–GĐ5

| Bước | Quyết định | Giữ | Bỏ |
|---|---|---|---|
| B4.1 Phủ TC | **Giữ** | Mỗi TC-01…TC-17 có test tự động; bảng truy vết FR ↔ API ↔ TC | — |
| B4.2 Bảo mật | **Giữ** | Tắt Swagger ở prod, ghim tag image, `/security-review`, rate limit AI/báo cáo | — |
| B4.3 Hiệu năng TC-20 | **Gọn** | 1 kịch bản k6, 50 VU, 3 endpoint phổ biến, ghi p95/tỷ lệ lỗi | Đo riêng upload/AI |
| B4.4 Sao lưu TC-19 | **Gọn** | 1 script `mysqldump` + `aws s3 sync`, 1 lần khôi phục có biên bản | Lịch tự động hằng ngày |
| B4.5 Log & giám sát | **Gọn** | Log JSON có `requestId`, Actuator health | Cảnh báo job lỗi |
| F4.1 E2E | **Gọn** | 1 kịch bản Playwright theo TK §20.2 bước 1–4, 8 | Phủ toàn bộ 10 bước |
| F4.2–F4.4 | **Giữ** | Như roadmap | — |
| B5.2 Dữ liệu demo | **Tách**: phần nội dung kéo lên S7 (**R-01**), phần tài khoản/lịch sử giữ ở S11 | — | — |
| B5.1, B5.3, B5.4, F5.1–F5.4 | **Giữ** | Như roadmap | — |

## 2. Việc giữ chân người dùng thêm vào (R-xx)

| Mã | Việc | Gắn vào | Kích thước | Xong khi |
|---|---|---|---|---|
| R-01 | Thư viện 200–300 thẻ tự biên soạn (6–10 bộ Giao tiếp/TOEIC), đủ IPA, ví dụ, bản dịch; âm thanh sinh bằng TTS B3.4a | `R__library_starter.sql`, B5.2 | M (chủ yếu biên soạn nội dung) | Mọi bộ mẫu tạo được bài `NGHE_VIET`; không thẻ mẫu nào thiếu IPA |
| R-02 | Tự điền thẻ: gõ từ trong `CardEditor` → bấm "Gợi ý" → điền IPA, nghĩa, ví dụ, bản dịch; người học sửa rồi mới lưu | B3.3 `context-explanations`, F3.2 | S | AI lỗi/hết hạn mức thì form vẫn lưu tay được |
| R-03 | Chuỗi ngày **theo ngày** (giữ cách B2.2 đang chạy) + 1 ngày đóng băng/tuần tự động dùng khi nghỉ 1 ngày | B3.6, `StreakCalculator`, `/learning/today` | S | UI12 hiện "Đã dùng ngày nghỉ tuần này"; TK §15.1 sửa theo |
| R-04 | Tiến bộ nhìn thấy được: lý do `TIEN_BO` ("*reimbursement*: sai 3/5 lượt tháng trước, đúng 5/5 tuần này") trên UI12; mục "Từ đã vượt qua" trong tổng kết tuần | B3.5, B3.9 | S | Chỉ hiện khi đủ ngưỡng lượt quan sát; không có dữ liệu thì ẩn |

## 3. Lịch mới

| Tuần | BE | FE | Nội dung |
|---|---|---|---|
| **S7** 09–15/11 | B3.1, B3.2, B3.4a | F2.2 (tồn), F3.1 | Chốt nhà cung cấp AI + Speech **trước 12/11**; R-01 biên soạn song song |
| **S8** 16–22/11 | B3.3 gọn, B3.5, B3.6 gọn, B3.7 gọn | F3.2, F3.3, F3.4, F3.6, F3.7 | R-02, R-03, R-04 (phần gợi ý) |
| **S9** 23–29/11 | B3.4b, B3.8 gọn, B3.9 gọn, B3.10 gọn, B3.11 gọn | F3.5, F3.8, F3.9, F3.10, F3.11 | R-04 (phần tổng kết tuần); 28–29/11 demo Đợt 3 + `/fe-report DOT3` |
| **S10** 30/11–06/12 | B4.1–B4.5 (theo mục 1.3) | F4.1–F4.4 | Không thêm tính năng mới |
| **S11** 07–14/12 | B5.1–B5.4 | F5.1–F5.4 | Đóng băng mã từ 11/12; chỉ sửa lỗi chặn demo |

## 4. Mốc quyết định

| Ngày | Câu hỏi | Nếu "không" |
|---|---|---|
| 12/11 | Có khóa API AI dùng được (ngân sách, hạn mức)? | Demo bằng `FakeAiClient` có nhãn; vẫn giữ adapter thật + 1 lượt gọi thật cho nghiệm thu |
| 16/11 | Có Azure Speech (gói miễn phí) chạy được pronunciation assessment? | B3.4b dùng Fake gắn nhãn "Mô phỏng" (TK §20.1); TTS vẫn dùng thật |
| 22/11 | S8 xong đủ 4 bước BE? | Cắt B3.11 còn mỗi `GET /admin/service-usage`; UI36 chỉ còn bảng kỹ năng có sẵn ở UI35 |
| 29/11 | S9 xong và còn dư ≥ 1 ngày? | Không làm mục Hoãn nào |

**Hoãn, chỉ làm khi dư thời gian sau 29/11 (theo thứ tự):** web push + PWA cho nhắc học → `POST /ai/exercise-drafts` → kế hoạch theo ngày thi TOEIC.

## 5. Rủi ro của chính việc cắt

| Rủi ro | Xử lý |
|---|---|
| Hội đồng đối chiếu đề cương thấy thiếu "tạo bài luyện bằng AI", CRUD huy hiệu, thông báo hệ thống | Xin ý kiến GVHD trước 12/11; ghi rõ ở "Hạn chế đã biết" kèm lý do ưu tiên |
| R-01 tốn thời gian biên soạn hơn dự kiến | Tối thiểu 200 thẻ; dùng AI nháp (B3.2) rồi duyệt tay, ghi nguồn "tự biên soạn, có hỗ trợ AI" |
| Ngày đóng băng (R-03) làm lệch TC-09/TC-15 | Viết test cho ca: nghỉ 1 ngày, nghỉ 2 ngày, qua nửa đêm theo múi giờ |

## 6. Tài liệu phải sửa khi duyệt kế hoạch

| Mã | File | Sửa |
|---|---|---|
| DOC3-01 | `roadmap/TienDoDuKien_backend.md` | Tách B3.4a/B3.4b; ghi phạm vi Gọn/Cắt vào B3.3, B3.6–B3.11, B4.3–B4.5; tách B5.2 |
| DOC3-02 | `roadmap/TienDoDuKien_fronend.md` | Bỏ UI52, UI54, UI46, tab UI53; F3.2 thêm R-02; F4.1 thu hẹp |
| DOC3-03 | `roadmap/SPRINT_PLAN.md` | Thay lịch S7–S9 theo mục 3; danh mục UI đánh dấu Cắt |
| DOC3-04 | TK §15.1 | Chốt chuỗi ngày theo ngày + ngày đóng băng |
| DOC3-05 | TK §8.3 | Thêm mã lý do `TIEN_BO` |
| DOC3-06 | TK §20.2 | Bước 9: Admin xử lý báo cáo + xem hạn mức (bỏ "nhật ký vận hành") |
