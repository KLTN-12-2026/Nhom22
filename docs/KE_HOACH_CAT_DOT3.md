# Kế hoạch cắt phạm vi Đợt 3 → GĐ5 (ưu tiên giữ chân người dùng)

| Mục | Giá trị |
|---|---|
| Ngày lập | 07/11/2026 |
| Dựa trên | `roadmap/TienDoDuKien_backend.md` (B3.1–B5.4), `roadmap/TienDoDuKien_fronend.md` (F2.2, F3.1–F5.4), `roadmap/SPRINT_PLAN.md` (S7–S11), TK §9, §15, §19, §20 |
| Phạm vi | S7–S11 · 09/11–14/12/2026 |
| Trạng thái | **Đã áp 07/11/2026** vào roadmap BE/FE, `SPRINT_PLAN.md`, TK §8.3, §15.1, §20.2 (DOC3-01…06). Bổ sung Xưởng thẻ AI mở rộng X-01…X-06 (mục 7, DOC3-07…10) và gói dịch vụ + thanh toán FR-15 (mục 8, DOC3-11…14). Còn chờ GVHD đồng ý các mục Cắt/Hoãn (mục 5). Tài liệu đã thống nhất 09/11/2026 theo DOC3-01…18 (mục 6) |
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
| B3.2 + F3.1 Xưởng thẻ AI | **Giữ + bổ sung** | Đủ như roadmap; thêm nhập tệp TXT/CSV/DOCX (X-01), lưu vào bộ mới (X-02), hoàn thiện IPA + ví dụ từng thẻ (X-03), nghe từng thẻ nháp (X-05), sửa/xóa/xóa tất cả (X-06) | — | TC-12, TC-13 |
| B3.3 + F3.2/F3.3 AI khác | **Gọn + bổ sung** | `sentence-feedback`, `context-explanations` (dùng lại cho **R-02** và **X-03**), `POST /ai/card-images` (**X-04**, Giữ), `GET /me/service-quota`, `GET /ai/history` dạng danh sách | `POST /ai/exercise-drafts` → **Hoãn** | TC-12 |
| B3.4a TTS | **Giữ**, kéo lên S7 | `GET /cards/{id}/audio` (cache theo nội dung + giọng + phiên bản) | — | TC-14 (phần nghe mẫu) |
| B3.4b + F3.5 Đánh giá phát âm | **Gọn** | Ghi ≤ 15 giây, gửi, xem chỉ số có thật, lịch sử, xóa bản ghi; so sánh = 2 lần gần nhất cùng từ | Biểu đồ tiến bộ phát âm | TC-14 |
| B3.5 + F3.4 Gợi ý có lý do | **Giữ** | `QUEN_NHIEU`, `SAI_CHINH_TA`, `CAP_DE_NHAM`, `QUA_HAN_NHIEU`, thêm `TIEN_BO` (**R-04**) | `PHAT_AM_THAP` chỉ bật khi B3.4b dùng dịch vụ thật | — |
| B3.6 + F3.6 Động lực | **Gọn** | Sổ điểm (unique sự kiện, trần/ngày), chuỗi ngày + ngày đóng băng (**R-03**), 5–6 huy hiệu cố định seed bằng migration, 1 thử thách tuần cố định | CRUD `/admin/badges`, `/admin/challenges`, UI54 → **Cắt** | TC-15 |
| B3.7 + F3.7 Thông báo & nhắc | **Gọn** | Scheduler 15 phút, nhắc email + trong ứng dụng, khóa chống trùng, chuông + `/thong-bao` | `POST /admin/announcements`, UI52 → **Cắt**; web push → **Hoãn** | TC-15 |
| B3.8 + F3.8 Báo cáo & kiểm duyệt | **Gọn** | `POST /reports` chống trùng, hàng đợi Admin, xử lý **giữ / ẩn** + lý do + nhật ký | Trạng thái "yêu cầu sửa", "từ chối" kèm thông báo người liên quan | — |
| B3.9 + F3.9 Tổng kết tuần & bản đồ | **Gọn** | `weekly-summary` đủ; UI36 = bảng **bộ thẻ × kỹ năng** từ `/statistics/skills`, có "Chưa đủ dữ liệu" | Bản đồ từng từ dạng lưới màu, bấm từ xem lịch sử | — |
| B3.10 + F3.10 Xóa tài khoản | **Gọn** | `POST /me/deletion-requests`, job xóa dữ liệu riêng + tệp S3 + phiên Redis, ẩn danh tác giả bộ đã chia sẻ; bản sao trước RS-059: **gỡ media khỏi bản sao** | `GET /admin/deletion-requests` → **Cắt** (xem qua nhật ký) | TC-16 |
| B3.12a/b/c + F3.12/13 Gói dịch vụ & thanh toán (bổ sung 07/11, sửa 10/11) | **Giữ lõi** | 2 gói trả phí bắt buộc (không miễn phí, không dùng thử), VNPay sandbox, IPN/return một lần, lịch sử, biên nhận HTML, nhắc hết hạn 7 ngày mỗi ngày một lần, hết hạn thì khóa (giữ dữ liệu), áp hạn mức theo gói, Admin quản lý thanh toán + doanh thu tháng/quý/năm | Lưu thẻ, tự gia hạn, MoMo/ZaloPay, chuyển khoản thủ công, đổi gói giữa kỳ, hoàn tiền, hóa đơn VAT → **Cắt** | TC-21…TC-24 |
| B3.11 + F3.11 Quản trị vận hành | **Gọn mạnh** | `GET/PUT /admin/service-quotas`, `GET /admin/service-usage` (lượt, lỗi), UI51 | `GET /admin/statistics` (tổng hợp chung), `GET /admin/jobs`, chi phí, UI46 tổng quan, tab UI53 "Tác vụ nền" → **Cắt**; doanh thu không cắt (UI58, B3.12c) | Demo bước 9 |

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
| **S7** 09–15/11 | B3.1, B3.2 (+ X-01, X-02), B3.4a | F2.2 (tồn), F3.1 (+ X-01, X-02, X-05, X-06) | Chốt nhà cung cấp AI + Speech + sinh ảnh **trước 12/11**; R-01 biên soạn song song |
| **S8** 16–22/11 | B3.3 gọn (+ X-04), B3.5, B3.6 gọn, B3.7 gọn, B3.12a | F3.2 (+ X-03, X-04), F3.3, F3.4, F3.6, F3.7, F3.12 (UI55, UI57) | R-02, R-03, R-04 (phần gợi ý) |
| **S9** 23–29/11 | B3.4b, B3.8 gọn, B3.9 gọn, B3.10 gọn, B3.11 gọn, B3.12b, B3.12c | F3.5, F3.8, F3.9, F3.10, F3.11, F3.12 (UI56), F3.13 (UI58, UI59) | R-04 (phần tổng kết tuần); 28–29/11 demo Đợt 3 + `/fe-report DOT3` |
| **S10** 30/11–06/12 | B4.1–B4.5 (theo mục 1.3) | F4.1–F4.4 | Không thêm tính năng mới |
| **S11** 07–14/12 | B5.1–B5.4 | F5.1–F5.4 | Đóng băng mã từ 11/12; chỉ sửa lỗi chặn demo |

## 4. Mốc quyết định

| Ngày | Câu hỏi | Nếu "không" |
|---|---|---|
| 12/11 | Có khóa API AI dùng được (ngân sách, hạn mức)? Có khóa Imagen 3 cho ảnh AI? Có tài khoản sandbox VNPay? | Demo bằng `FakeAiClient` có nhãn; vẫn giữ adapter thật + 1 lượt gọi thật cho nghiệm thu. Chưa có khóa ảnh → X-04 dùng `FakeImageClient` (nhãn "Mô phỏng"). Chưa có sandbox VNPay → `FakePaymentGateway` (nhãn "Mô phỏng") |
| 16/11 | Có Azure Speech (gói miễn phí) chạy được pronunciation assessment? | B3.4b dùng Fake gắn nhãn "Mô phỏng" (TK §20.1); TTS vẫn dùng thật |
| 22/11 | S8 xong đủ 5 bước BE (gồm B3.12a)? | Cắt B3.11 còn mỗi `GET /admin/service-usage`; UI36 chỉ còn bảng kỹ năng có sẵn ở UI35; B3.12b bỏ biên nhận; B3.12c bỏ `PUT /admin/plans`. X-04, thanh toán, nhắc/khóa hết hạn và doanh thu **không** cắt |
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
| DOC3-07 | TK §9.4, §12 (API AI) | Xưởng thẻ AI: nhập tệp, lưu vào bộ mới, hoàn thiện từng thẻ, ảnh AI; thêm `POST /ai/card-images` (áp 07/11/2026) |
| DOC3-08 | `roadmap/TienDoDuKien_backend.md` B3.1–B3.3 | X-01, X-02, X-04; hạn mức ảnh (áp 07/11/2026) |
| DOC3-09 | `roadmap/TienDoDuKien_fronend.md` F3.1, F3.2 | X-01…X-06 (áp 07/11/2026) |
| DOC3-10 | `roadmap/SPRINT_PLAN.md` S7, S8, danh mục UI29 | X-01…X-06 (áp 07/11/2026) |
| DOC3-11 | TK §1, §2.3, §4, §5 (FR-15), §6.9, §10, §11.2, §12.2, §13.2, §14.2, §19 (TC-21, 22), §20.2 (9b) | Gói dịch vụ & thanh toán (áp 07/11/2026) |
| DOC3-12 | `roadmap/TienDoDuKien_backend.md` | B3.12a, B3.12b; B3.1 hạn mức theo gói; B4.1 TC-22 (áp 07/11/2026) |
| DOC3-13 | `roadmap/TienDoDuKien_fronend.md` | F3.12 UI55–UI57 (áp 07/11/2026) |
| DOC3-14 | `roadmap/SPRINT_PLAN.md` | S8, S9, ma trận FR-15, UI55–UI57, S10 15 FR / 22 TC (áp 07/11/2026) |
| DOC3-15 | TK §4.2, §6.8, §10, §13.2, §18.1 | Ghi phần Cắt/Hoãn của Admin (thống kê, tác vụ nền, thông báo hệ thống, huy hiệu/thử thách, yêu cầu xóa), kiểm duyệt chỉ giữ/ẩn, `exercise-drafts` Hoãn, mốc Đợt 3 (áp 09/11/2026) |
| DOC3-16 | `roadmap/TienDoDuKien_backend.md` §0.2 | Hàng Đợt 3: FR-11, 13, 15 và B3.1–B3.12b (áp 09/11/2026) |
| DOC3-17 | `ban-giao-cho fe/SPRINT_2_...md` mục 9 | Viết lại bảng hợp đồng Đợt 3 theo lịch S7–S9 đã cắt, thêm B3.4a/B3.12a/B3.12b (áp 09/11/2026) |
| DOC3-18 | `mockups/dot3/README.md`, `mockups/index.html`, `AGENTS.md`, `docs/luong-backend/B2.2`, `B2.4` | Đánh dấu UI46/52/53(tab)/54 là Cắt, thêm UI55–57 và X-01…X-06, FR-15/TC-22, chuỗi ngày đã chốt (áp 09/11/2026) |

## 7. Bổ sung 07/11/2026 — Xưởng thẻ AI mở rộng (theo bản demo nhóm FE)

Nguồn: 2 video demo UI29 và ảnh chụp UI30, UI31 do nhóm FE gửi ngày 07/11/2026. Mã của bản demo **chưa có trong repo** (`frontend/src/app/(app)/ai-xuong-the/page.js` trên `main` vẫn là bản mô phỏng cũ); bản demo đọc `.docx` qua một backend Node riêng (`newduan/backend`). Kế hoạch dưới đây chuyển toàn bộ phần máy chủ về Spring Boot, không dùng backend Node.

### 7.1. Chức năng thấy trong demo và cách đưa vào thiết kế

| Mã | Chức năng (demo) | BE | FE | Ràng buộc |
|---|---|---|---|---|
| X-01 | Nút "Upload File (Word/TXT/CSV)": đọc danh sách từ (`từ`, `nghĩa`) từ tệp thành thẻ nháp | `.txt`/`.csv`: FE đọc tại trình duyệt rồi gửi `POST /ai/card-drafts` như đoạn văn. `.docx`: tải qua `POST /files/upload-requests` (loại `TAI_LIEU`) → `POST /ai/card-drafts {tepId}`; job đọc bằng Apache POI | F3.1 | Tối đa 1 MB, 5.000 ký tự, 50 từ/lần; sai định dạng → 400 kèm lý do, không tạo thẻ |
| X-02 | Ô "Tên bộ thẻ" + "Lưu tất cả thẻ vào bộ thẻ": tạo bộ mới chứa các thẻ nháp | `POST /ai/card-drafts/{id}/commit` nhận `boTheId` **hoặc** `tenBoMoi` (tạo bộ `RIENG_TU` trong cùng giao dịch) | F3.1 | Chỉ lưu thẻ đã chọn; `Idempotency-Key`; trùng từ trong bộ đích → cảnh báo, không ghi đè |
| X-03 | "Hoàn thiện với AI (IPA + Ví dụ)" trên từng thẻ nháp | Dùng lại `POST /ai/context-explanations` (B3.3, giống R-02) | F3.1 dùng API của F3.2 | Chỉ điền vào thẻ nháp, không tự lưu; AI lỗi/429 → thẻ giữ nguyên, vẫn lưu tay được |
| X-04 | "Sinh ảnh AI" trên từng thẻ (nhãn "Ảnh AI (Imagen 3)") | `POST /ai/card-images {tu, nghia}` → 202 + `requestId`; job gọi `ImageClient` (thật/Fake), lưu PNG qua `FileService` loại `ANH`, trả `tepId`; thẻ nháp gắn `anhId` | F3.1 | Prompt gồm từ + nghĩa tiếng Việt; người học xem, **tạo lại** hoặc **bỏ ảnh** trước khi lưu; hạn mức ảnh riêng; lỗi không chặn lưu thẻ |
| X-05 | Nút loa nghe từng thẻ nháp | Không cần API mới: trước khi lưu dùng Web Speech; sau khi lưu dùng `GET /cards/{id}/audio` (B3.4a) | F3.1 | Trình duyệt không hỗ trợ → ẩn nút |
| X-06 | Sửa, Xóa từng thẻ, "Xóa tất cả", đếm "Danh sách các thẻ đã tạo (N)" | Không cần API (thẻ nháp ở FE cho tới khi commit) | F3.1 | "Xóa tất cả" phải hỏi xác nhận |

UI30 (ngăn "Giải thích theo ngữ cảnh" trên mặt thẻ, nút "Đọc câu ví dụ", "Giải thích câu này", "Báo cáo đầu ra") và UI31 ("Viết câu dùng thử", bản sửa + "Vì sao sửa?" + "Báo cáo phản hồi") khớp TK §9.5 và F3.2; nhóm FE đã có giao diện mô phỏng, chờ B3.3 để nối API thật.

### 7.2. Lỗi thấy trong demo, phải xử lý khi làm thật

| # | Hiện tượng | Yêu cầu |
|---|---|---|
| 1 | "butterfly" (con bướm) ra ảnh con cáo | X-04 gửi kèm nghĩa vào prompt; FE luôn cho "Tạo lại"/"Bỏ ảnh"; ảnh chỉ lưu khi người học giữ |
| 2 | Chọn `.docx` báo "cần chạy backend (npm run dev trong thư mục newduan/backend)" | Bỏ backend Node; `.docx` đi qua Spring (X-01). Thông báo lỗi không nhắc đường dẫn máy dev |
| 3 | Lưu bộ không hỏi "Bộ thẻ nhận bản nháp" khi ô "Tên bộ thẻ" cũng có giá trị | Một trong hai: chọn bộ có sẵn **hoặc** nhập tên bộ mới; FE khóa ô còn lại |
| 4 | Thẻ nháp ghi "Bản thô", chưa có IPA/ví dụ khi lưu | Cho phép lưu (FR-09 không bắt buộc đủ trường) nhưng hiện cảnh báo "N thẻ chưa có ví dụ" |

### 7.3. Tác động lên kế hoạch

- Thêm: 1 API (`POST /ai/card-images`), 2 tham số (`tepId` ở `card-drafts`, `tenBoMoi` ở `commit`), 1 loại hạn mức (ảnh), 1 adapter (`ImageClient` + `FakeImageClient`), phụ thuộc Apache POI.
- TC-12 (hạn mức, AI lỗi không chặn học) và TC-13 (chỉ lưu thẻ đã chọn) phủ thêm X-01, X-02, X-04.
- **X-04 chốt Giữ (07/11/2026)**, dùng Imagen 3. Thứ tự cắt khi trễ: X-01 phần `.docx` (giữ `.txt`/`.csv`) → X-06 "Xóa tất cả" → các mục khác.
- Ảnh AI tính hạn mức theo gói (mục 8).

## 8. Bổ sung 07/11/2026 — Gói dịch vụ & thanh toán toàn hệ thống (FR-15)

Quyết định của nhóm: dùng thanh toán cho toàn hệ thống như giao diện UI55/UI56 (commit `ff3c54e`). Thiết kế chi tiết ở TK §6.9; bước làm B3.12a/B3.12b, F3.12.

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Gói | `PRO` 299.000 đ / `PREMIUM` 999.000 đ mỗi tháng (năm = 10 tháng), lưu ở bảng `goi_dich_vu`; **không có gói miễn phí** (sửa 10/11/2026) | Giữ giá của UI55; đổi giá không sửa mã |
| Cổng | VNPay sandbox (thẻ nội địa, VISA/Mastercard, VNPAY-QR) | Một cổng phủ đủ "thẻ" và "chuyển khoản/QR" của UI55; sandbox miễn phí |
| Dữ liệu thẻ | Nhập trên trang VNPay, hệ thống không nhận/không lưu | Bỏ form thẻ và "thẻ đã lưu" ở UI55/UI56 |
| Khác UI | Bỏ thẻ gói Miễn phí; xuất CSV không phụ thuộc gói (UI ghi chỉ gói trả phí); bỏ "Hỗ trợ ưu tiên" | Góp ý GVHD 10/11/2026; B1.12 đã giao và là quyền dữ liệu (FR-14); không có chức năng thật |
| Cắt | MoMo/ZaloPay, chuyển khoản thủ công, tự gia hạn, đổi gói giữa kỳ, hoàn tiền, hóa đơn VAT | Mỗi mục cần đối soát/hợp đồng riêng, không kịp S8–S9 |

**Sửa theo góp ý GVHD (10/11/2026):**

| Góp ý | Quyết định | Áp vào |
|---|---|---|
| Bắt buộc mua gói mới được dùng | Bỏ `MIEN_PHI`, không dùng thử; không có gói hiệu lực → 402 `SUBSCRIPTION_REQUIRED`, giữ dữ liệu; xuất CSV và xóa dữ liệu vẫn được | TK §1, §4.1, §5, §6.1, §6.9, §13; B3.12a; F3.12 |
| Hết hạn / sắp hết hạn phải báo; nhắc trước 1 tuần, mỗi ngày 1 lần | `SubscriptionExpiryJob` 15 phút, một `GOI_SAP_HET_HAN`/ngày khi còn ≤ 7 ngày, `GOI_DA_HET_HAN` khi hết; banner theo `soNgayConLai` | TK §6.9, §12.2, TC-23; B3.7, B3.12b |
| Demo chỉnh ngày hết hạn để xem thông báo | Công cụ Admin sửa `het_han_at` + chạy ngay tác vụ, bật bằng cờ, có lý do và nhật ký | TK §6.9, §20.2 9c; B3.12c; F3.13 |
| Quản lý thanh toán | UI59: giao dịch, gói người dùng, cấu hình gói | TK §4.2, §6.9; B3.12c; F3.13 |
| Thống kê doanh thu tháng/quý/năm | UI58 `GET /admin/revenue`, chỉ giao dịch thành công, giờ VN | TK §4.2, §6.9, TC-24; B3.12c; F3.13 |

**Rủi ro:** S8 thêm một bước BE (B3.12a) → đã đổi mốc 22/11 (mục 4). IPN không tới máy cục bộ → `return` xác nhận cùng hàm; khi demo trên máy chủ mở IPN công khai. Hội đồng hỏi vì sao đề cương ghi "ngoài phạm vi: thanh toán" → TK §2.3 đã ghi lý do và ngày bổ sung; cần GVHD đồng ý trước 12/11.
