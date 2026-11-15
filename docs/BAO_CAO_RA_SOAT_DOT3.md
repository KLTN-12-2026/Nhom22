# Báo cáo rà soát Đợt 3 — tài liệu, backend, frontend, mockup, rác

| Mục | Giá trị |
|---|---|
| Ngày rà soát | 14/11/2026 |
| Nhánh / commit | `huynh_gia_pho_be` @ `f9e6fba` (Merge origin/main), cây làm việc sạch |
| Phạm vi | Đợt 3 (B3.1–B3.12c, F3.1–F3.13, S7–S9): roadmap, TK, báo cáo bàn giao, luồng backend, mã `backend/k28`, `frontend/`, `mockups/dot3`, cấu hình, tệp thừa |
| Cách làm | Đọc mã và tài liệu, đối chiếu chéo, chạy test tự động. Không sửa mã hay tài liệu nào ngoài tệp này |

## 1. Kết luận nhanh

- Backend Đợt 3 đã có 7/15 bước có mã (B3.1, B3.2, B3.4a, B3.4b, B3.5, B3.6, B3.7); toàn bộ `mvnw -B test` **507/507 pass** ở lần chạy hôm nay.
- Frontend Đợt 3 mới là **giao diện tĩnh với dữ liệu cứng**: 13 trang, không trang nào gọi API Đợt 3; còn thiếu 8 màn hình. Đây là khoảng lệch lớn nhất giữa BE và FE.
- Có 4 lỗi mã backend nên sửa (3 chỗ trả 500 thay vì 400, 1 chỗ WAV quá ngắn), 1 lỗi cấu hình (`.env.example` sai tên biến).
- Báo cáo bàn giao Sprint 3 và `mockups/dot3/README.md` có nhiều đoạn đã cũ so với mã.
- Giao diện thanh toán (FE và mockup) còn form nhập thẻ, ví điện tử, gói Miễn phí, trái TK §6.9.
- Tiến độ: ba bước còn chờ một lượt gọi dịch vụ thật; B3.3, B3.12a (S8) và B5.2a (S7) chưa bắt đầu.

Số phát hiện: **Cao 9 · Trung bình 17 · Thấp 15 · Rác 9**.

## 2. Kết quả kiểm chứng đã chạy (14/11/2026)

| Lệnh | Kết quả |
|---|---|
| `backend/k28`: `./mvnw -B test` (Testcontainers) | 507 test, 0 lỗi, BUILD SUCCESS |
| `frontend`: `npm test` | 53/53 pass |
| `frontend`: `npm run lint` | **14 lỗi**, 14 cảnh báo (mục 5.3) |
| `frontend`: `npm run ui:check` | **59 tệp lệch** ("UI drift"), gồm cả 23 tệp `mockups/dot3` |

Chưa kiểm chứng trong lần rà soát này:

- `npm run build` của frontend.
- Gọi HTTP thật trên môi trường dev cho mọi API B3.x.
- Gọi OpenAI, OpenAI TTS, Azure Speech thật.
- Bộ sưu tập Postman (connector Postman chưa xác thực nên không đọc được).
- Đối chiếu chi tiết từng route trong `mockups/shared/demo.js` với DTO (chỉ đối chiếu DTO với báo cáo bàn giao).

## 3. Trạng thái so với kế hoạch

| Bước | Sprint dự kiến | Trạng thái thực tế | Ghi chú |
|---|---|---|---|
| B3.1 | S7 | Xong `[x]` | |
| B3.2 | S7 | Mã xong, `[ ]` | Chờ 1 lượt OpenAI thật, HTTP thật, Postman |
| B3.4a | S7 | Mã xong, `[ ]` | Chờ 1 lượt OpenAI TTS thật |
| B3.4b | S9 | Mã xong sớm, `[ ]` | Chờ 1 lượt Azure Speech thật |
| B3.5, B3.6, B3.7 | S8 | Xong sớm `[x]` | Chưa gọi HTTP thật |
| B5.2a Thư viện mẫu (R-01) | S7 (hết 15/11) | Chưa làm | Điều kiện "Xong khi" của S7: mọi bộ mẫu tạo được bài nghe viết |
| F2.2 (tồn Đợt 2) | đầu S7 | `[ ]` | Hàng đợi mất mạng, nhánh 409 |
| B3.3, B3.12a | S8 (16–22/11) | Chưa bắt đầu | Mốc 12/11 đăng ký VNPay sandbox: tài liệu chưa ghi kết quả |
| B3.8–B3.11, B3.12b, B3.12c | S9 | Chưa bắt đầu | Số migration kế tiếp là **V21** |
| F3.1–F3.13 | S7–S9 | Tất cả `[ ]` | Mới có giao diện tĩnh (mục 5.1) |

## 4. Backend

### 4.1 Lỗi nên sửa

| ID | Mức | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|---|
| BE-01 ✅ đã sửa 14/11 | Cao | `ai/dto/CardDraftCommitRequest` (`banNhapIds`), `ai/dto/CardDraftEdit` (`banNhapId`), `speaking/dto/PronunciationHistoryQuery` (`theId`) | Mẫu `[1-9][0-9]{0,18}` nhận chuỗi 19 chữ số lớn hơn `Long.MAX_VALUE` (ví dụ `9999999999999999999`); `Long.valueOf` ném `NumberFormatException`, `GlobalExceptionHandler` không có nhánh riêng nên trả **500** thay vì 400. `tepId` và `boTheId` đã có `@DecimalMax` nên không bị | Thêm `@DecimalMax("9223372036854775807")` cho ba trường này, thêm ca test 400 |
| BE-02 ✅ đã sửa 14/11 | Trung bình | `speaking/service/WavAudio.durationMs`, `PronunciationService.assess` | WAV hợp lệ nhưng phần `data` dưới 32 byte cho `thoiLuongMs = 0`. Mã vẫn giữ lượt, gọi nhà cung cấp, rồi vỡ ở ràng buộc `ck_ket_qua_phat_am_thoi_luong` (`> 0`). TK §13 ghi "> 0 và ≤ 15 giây" | Từ chối 422 `field: file` khi `thoiLuongMs` nhỏ hơn một ngưỡng tối thiểu, trước khi giữ lượt |
| BE-03 ✅ đã sửa 14/11 | Trung bình | `common/exception/GlobalExceptionHandler.handleMultipart` | Tệp ghi âm lớn hơn 1 MB bị Spring chặn (`max-file-size: 1048576B`) và trả 400 với câu "Kiểm tra tệp CSV và các phần của yêu cầu". Báo cáo bàn giao mục 5.7 chỉ ghi 422 cho tệp lớn hơn 512 KB | Đổi thông báo thành câu trung tính, ghi thêm ca 400 này vào mục 5.7 |
| BE-04 ✅ đã sửa 14/11 | Trung bình | `src/test/resources/application-test.yaml` | Chỉ ghim `app.ai.provider: fake`. `app.tts.provider` và `app.speech.provider` đọc từ biến môi trường, và `application.yaml` nhập `.env`. Máy nào đặt `TTS_PROVIDER=openai` hoặc `SPEECH_PROVIDER=azure` trong `.env` thì test sẽ gọi dịch vụ thật | Ghim thêm `app.tts.provider: fake` và `app.speech.provider: fake` |
| BE-05 ✅ đã sửa 14/11 | Cao | `backend/k28/.env.example` dòng 25–26 | Ghi `AI_API_KEY`, `SPEECH_KEY`, nhưng mã đọc `OPENAI_API_KEY`, `AZURE_SPEECH_KEY`. Thiếu hẳn `AI_PROVIDER`, `TTS_PROVIDER`, `SPEECH_PROVIDER`, `AZURE_SPEECH_REGION`, `OPENAI_MODEL`. Người làm theo tệp mẫu sẽ không bật được dịch vụ thật | Đổi tên hai biến, thêm các biến còn thiếu với giá trị rỗng hoặc `fake` |
| BE-06 ✅ đã sửa 14/11 | Trung bình | `notification/service/NotificationService.remind` | Chỉ so `giờ địa phương ≥ gio_nhac` trong cùng ngày. Bộ lập lịch chạy 15 phút một lần, nên `gio_nhac` nằm trong khoảng 15 phút cuối ngày (ví dụ 23:50) có thể bị bỏ qua cả ngày đó | Chặn giờ nhắc muộn nhất ở phía cài đặt, hoặc ghi rõ giới hạn này vào tài liệu |

### 4.2 Điểm yếu thiết kế, mức thấp

| ID | Vị trí | Vấn đề |
|---|---|---|
| BE-07 | `common/quota/QuotaService.gioiHan` | Gói không có dòng `han_muc_dich_vu` thì giới hạn là 0 và người dùng nhận "Bạn đã dùng hết lượt…", sai nguyên nhân; chỉ có một dòng log cảnh báo |
| BE-08 ✅ đã sửa 14/11 | `common/job/JobWorker` (hàm dựng) | Hai `JobHandler` trùng `loai()` thì cái sau ghi đè lặng lẽ |
| BE-09 ✅ đã sửa 14/11 | `JobWorker.poll` | Dùng khóa `app.jobs.initial-delay-ms` (mặc định 10000) nhưng `application.yaml` và báo cáo bàn giao không khai báo khóa này |
| BE-10 ❌ rút lại (thử `readOnly` làm `FR08RecommendationTest` trả 500: luồng gợi ý có thao tác ghi) | `practice/service/recommendation/RecommendationService.list` | `@Transactional` không `readOnly` cho một API `GET` chỉ đọc |
| BE-11 ✅ đã sửa 14/11 | `speaking/config/TtsConfig` | `@EnableConfigurationProperties` khai báo lại `AiProperties` (đã có ở `AiConfig`) |
| BE-12 | `V15__jobs_ai.sql`, enum `TrangThaiDuyet.BO_QUA`, cột `ban_nhap_the_ai.anh_id`, `yeu_cau_ai.loai` (`NGU_CANH`, `SUA_CAU`, `ANH_THE`) | Giá trị và cột để dành cho B3.3, hiện chưa có mã nào dùng. `BO_QUA` không nằm trong hợp đồng mục 5.5 |
| BE-13 | `ai/client/OpenAiClient` | Đầu ra bị cắt do `max_completion_tokens` sẽ thành `SAI_SCHEMA`, không phân biệt được với lỗi schema thật |
| BE-14 | `application.yaml` (`AI_PROVIDER`, `TTS_PROVIDER`, `SPEECH_PROVIDER` mặc định `fake`) | Mọi profile mặc định chạy Fake và nhận marker `#mo-phong:` trong dữ liệu người dùng. Cần ghi vào danh sách kiểm tra triển khai B5.1 |
| BE-15 ✅ đã sửa 14/11 | `common/document/DocxTextReader.read` | `XWPFDocument` không được đóng nếu hàm dựng `XWPFWordExtractor` ném lỗi |
| BE-16 | `speaking/service/TtsService` | Tệp TTS không bao giờ bị dọn; đối tượng mồ côi dưới tiền tố `tts/` và `recordings/` nằm ngoài phạm vi quét của `FileCleanupWorker` (chỉ quét `pending/`, `files/`). Báo cáo bàn giao đã ghi một phần |

### 4.3 Đã kiểm, không thấy lỗi

- Migration V15–V20 khớp entity (`ddl-auto: validate` chạy qua trong test).
- DTO của B3.2, B3.4a, B3.4b, B3.5, B3.6, B3.7 khớp tên trường trong báo cáo bàn giao mục 5.2–5.7.
- Không gọi mạng trong transaction: `TtsService`, `PronunciationService` dùng `Propagation.NEVER`; `CardDraftJobHandler` gọi AI ngoài transaction; email gửi qua sự kiện.
- Hạn mức: giữ chỗ bằng `UPDATE` có điều kiện, xác nhận và hoàn trả đúng nhánh.
- Xóa bản ghi âm: tệp được đánh dấu xóa trước, `FileCleanupWorker` thử lại khi kho tệp lỗi.
- Mã nguồn không có chú thích, `TODO`, `System.out`.

## 5. Frontend

### 5.1 Chưa nối API Đợt 3 (Cao)

| ID | Trang / thành phần | Hiện trạng | Hợp đồng BE đã có |
|---|---|---|---|
| FE-01 | `/thanh-tich` (UI38) | Mảng cứng `METRICS`, `BADGES`, `REWARDS`; ghi "2 / 8 huy hiệu", ngày mẫu "11/10" | `GET /rewards/history`, `/badges` (6 huy hiệu), `/challenges` |
| FE-02 | `/goi-y` (UI28) | Mảng cứng 2 gợi ý; chưa có khối trên `/hom-nay`, `/so-tay` | `GET /learning/recommendations` |
| FE-03 | `/ai-xuong-the` (UI29) | 3 thẻ mẫu sau 650 ms; không tải tệp, không `Idempotency-Key`, không 429 | 3 API B3.2 |
| FE-04 | `/phat-am` (UI33) | Ghi bằng `MediaRecorder` (WebM), hiện điểm cứng 86 và nhận xét chữ. BE chỉ nhận WAV PCM 16 kHz; điểm cứng trái nguyên tắc "không sinh điểm giả" | `POST /pronunciation/assessments` |
| FE-05 | `/phat-am-lich-su` (UI34) | Dữ liệu cứng | `GET /pronunciation/history`, `DELETE /pronunciation/recordings/{id}` |
| FE-06 | Chuông và `/thong-bao` (UI39) | **Chưa có** trang và chuông trong `AppShell` | `GET /notifications`, `PATCH /notifications/{id}` |
| FE-07 | `/hom-nay` (UI12) | Không đọc `daDungNgayNghiTuanNay`, `ngayNghiDaDung` (R-03) | `GET /learning/today` |
| FE-08 | Nút loa UI19 `/hoc-phien`, thư viện | Vẫn chỉ dùng Web Speech | `GET /cards/{id}/audio` |

Phần duy nhất của Đợt 3 đã nối: `luyen-tap-lam-bai` nhận `deBai.amThanhTts` (B3.4a).

Màn hình chưa có route nào trong `frontend/src/app`: UI30 (ngăn giải thích), UI39 `/thong-bao`, UI44 `/ca-nhan/du-lieu`, UI45 (hộp báo cáo), UI50 `/quan-tri/bao-cao`, UI51 `/quan-tri/dich-vu`, UI57 `/thanh-toan-ket-qua`, UI58 `/quan-tri/doanh-thu`.

### 5.2 Trái thiết kế thanh toán (Cao)

| ID | Vị trí | Vấn đề |
|---|---|---|
| FE-09 | `frontend/src/app/(app)/thanh-toan-goi/page.js` | Còn form số thẻ/CVV, "Chuyển khoản", MoMo/ZaloPay, "Hỗ trợ ưu tiên". TK §6.9 và roadmap F3.12 yêu cầu bỏ (hệ thống không nhận dữ liệu thẻ, chỉ còn VNPay) |
| FE-10 | `frontend/src/app/(app)/thanh-toan-lich-su/page.js` dòng 182, 394 | Còn gói "Miễn Phí" (đã bỏ từ 10/11/2026) |
| FE-11 | `mockups/dot3/thanh-toan-goi.html` | Còn khối `Free plan`, CVV, MoMo. Mockup là nguồn FE sao chép nên lệch này lan sang FE |

### 5.3 Chất lượng mã (Trung bình)

| ID | Vị trí | Vấn đề |
|---|---|---|
| FE-12 ◐ sửa 5/8, còn 3 lỗi react-hooks | `luyen-tap-lam-bai/page.js` | 8 lỗi lint: `setState` đồng bộ trong effect (dòng 200, 302), dùng biến trước khi khai báo (317), biến thừa `progressPercent` (291), dấu `"` chưa escape (763, 774) |
| FE-13 ✅ đã sửa 14/11 | `quan-tri/thanh-toan/page.js` dòng 176–196 | 5 lỗi thiếu `key` |
| FE-14 ✅ đã sửa 14/11 | `thanh-toan-lich-su/page.js` dòng 87 | `setTransactions` không dùng. Roadmap F3.12 ghi lỗi ở dòng 77, số dòng đã cũ |
| FE-15 | `src/app/api/v1/practice/[...slug]/route.js` | Route mock chưa sinh `amThanhTts`, nên chế độ mock không có câu nghe viết bằng TTS (báo cáo bàn giao đã ghi) |
| FE-16 | `npm run ui:check` | 59 tệp lệch giữa `mockups/` và tài sản dùng chung của FE; kiểm tra này đang không qua |

### 5.4 Lệch nhỏ (Thấp)

- Các trang Đợt 3 hiện mã nội bộ trên giao diện ("UI38 · Đợt 3", "UI28 · Đợt 3") và thanh "Bản trải nghiệm · Dữ liệu mô phỏng"; cần bỏ khi nối API thật.
- `/quan-ly-thanh-toan` chỉ chuyển hướng sang `/quan-tri/thanh-toan`; route thừa nếu không có liên kết cũ nào trỏ tới.
- `frontend/.env.example` không có biến nào cho Đợt 3 (không cần thêm cho tới khi nối API).

## 6. Tài liệu

### 6.1 Báo cáo bàn giao `ban-giao-cho fe/SPRINT_3_BAO_CAO_BE_BAN_GIAO_CHO_FE.md`

| ID | Mức | Dòng | Nội dung đã cũ hoặc sai | Sửa thành |
|---|---|---|---|---|
| DOC-01 ✅ đã sửa 14/11 | Trung bình | 7 | "Các bước B3.x khác chưa bắt đầu"; ô trạng thái không nhắc B3.5, B3.7 đã xong | Thêm B3.5, B3.7; liệt kê đúng các bước chưa làm |
| DOC-02 ✅ đã sửa 14/11 | Trung bình | 18, 363 | Hạn mức chỉ ghi `AI`, `ANH` | Thêm `TTS` 100/300 và `PHAT_AM` 30/100 |
| DOC-03 ✅ đã sửa 14/11 | Trung bình | 19 | "Bắt đầu với B3.2 khi BE giao; xem hợp đồng dự kiến ở mục 9" | B3.2 đã giao, trỏ về mục 5.5 |
| DOC-04 ✅ đã sửa 14/11 | Trung bình | 43–51 | Mục 2 chỉ có cấu hình B3.1, B3.6 | Thêm V17–V20 và biến `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `TTS_PROVIDER`, `SPEECH_PROVIDER`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `REMINDERS_*` |
| DOC-05 ✅ đã sửa 14/11 | Trung bình | 57–65 | Mục 3 không có mã lỗi mới; trạng thái yêu cầu AI ghi "(dự kiến, B3.2)" | Thêm `TTS_UNAVAILABLE`, `SPEECH_UNAVAILABLE` (503); bỏ chữ "dự kiến" |
| DOC-06 ✅ đã sửa 14/11 | Trung bình | 69–103 | Mục 4 và sơ đồ ghi "dự kiến cho B3.2" | Bỏ chữ "dự kiến" |
| DOC-07 ✅ đã sửa 14/11 | Trung bình | 109, 139 | "BE chưa có API nào gọi `QuotaService` qua HTTP", ví dụ 429 "chưa kiểm chứng" | Đã có B3.2, B3.4a, B3.4b; `FR09CardDraftTest` đã phủ 429 |
| DOC-08 ✅ đã sửa 14/11 | Thấp | 188 | "cài đặt UI06" | UI43 `/ca-nhan/thong-bao` (UI06 là Đăng ký) |
| DOC-09 ✅ đã sửa 14/11 | Trung bình | 368 | "Trạng thái BE đến 11/11/2026: chỉ B3.1" | Cập nhật theo 14/11 |
| DOC-10 ✅ đã sửa 14/11 | Trung bình | 386–402 | Mục 9 "chưa có code" nhưng bảng chứa cả bước đã giao | Chỉ giữ các bước chưa làm |
| DOC-11 ✅ đã sửa 14/11 | Thấp | 404 | "đã đối chiếu DTO cho UI38 và UI28, các màn khác chưa" | Thêm UI29, UI33, UI34, UI39 (theo dòng 423–434) |
| DOC-12 ✅ đã sửa 14/11 | Thấp | 413, 415 | "Chưa chốt hạn mức phát âm"; "`JobWorker` chưa có handler, `yeu_cau_ai` chưa có entity" | Đã chốt ở B3.4b; đã có ở B3.2 |
| DOC-13 ✅ đã sửa 14/11 | Thấp | 248 | Danh sách `maLoi` thiếu `NCC_TU_CHOI_ND`, `NCC_XAC_THUC`, `NCC_GIOI_HAN`, `NCC_LOI_5XX`, `KET_NOI`, `LUU_TRU`, `TEP_RONG`, `NOI_BO` | Liệt kê đủ hoặc ghi rõ FE xử lý theo `trangThai` |
| DOC-14 ✅ đã sửa 14/11 | Thấp | 5.7 | Thiếu 422 `field: theId` khi từ của thẻ dài hơn 100 ký tự và 400 khi tệp lớn hơn 1 MB | Thêm hai dòng |

### 6.2 Roadmap và kế hoạch

| ID | Mức | Vị trí | Vấn đề |
|---|---|---|---|
| DOC-15 ✅ đã sửa 14/11 | Trung bình | `roadmap/TienDoDuKien_backend.md` dòng 509, 520 | B3.10 ghi `V18__privacy.sql`, B3.12a ghi "hiện là V18". V18 đã dùng cho `ai_card_drafts`; số kế tiếp là V21 |
| DOC-16 | Thấp | cùng tệp, dòng 453 | B3.2 ghi "Postman (connector chưa xác thực)" trong khi B3.4b ghi đã thêm 5 request vào "05 AI & phát âm"; chưa rõ 3 request B3.2 đã có chưa |
| DOC-17 ✅ đã sửa 14/11 | Trung bình | `roadmap/SPRINT_PLAN.md` §5 | Route trong bảng khác route FE thật: UI29 `/ai/xuong-the` ↔ `/ai-xuong-the`; UI31 `/ai/viet-cau` ↔ `/ai-viet-cau`; UI32 `/ai/lich-su` ↔ `/ai-lich-su`; UI34 `/phat-am/lich-su` ↔ `/phat-am-lich-su`; UI36 `/thong-ke/ban-do` ↔ `/ban-do-lam-chu`; UI37 `/thong-ke/tuan` ↔ `/tong-ket-tuan`; UI28 "khối trên `/hom-nay`" ↔ trang riêng `/goi-y`. Báo cáo bàn giao dòng 28 cũng ghi `/ai/xuong-the` |
| DOC-18 | Thấp | `roadmap/SPRINT_PLAN.md` dòng 306 | Ô "Nhà cung cấp AI và phát âm" còn `[ ]` dù OpenAI và Azure Speech đã chốt; chỉ còn ngân sách |
| DOC-19 ✅ đã sửa 14/11 | Thấp | `roadmap/TienDoDuKien_fronend.md` dòng 23, 252 | Trỏ tới `ROADMAP_BE.md` và `report/DOT3_BAO_CAO_FE.md`, cả hai không tồn tại. Tên tệp `TienDoDuKien_fronend.md` sai chính tả ("fronend") |
| DOC-20 ✅ đã sửa 14/11 | Thấp | `roadmap/TienDoDuKien_backend.md` §1 | Sơ đồ thư mục ghi gợi ý thuộc `stats/`, hạn mức thuộc `ai/`. Mã thật: `practice/service/recommendation`, `common/quota`, `common/document` |

### 6.3 TK, luồng backend, mockup, skill

| ID | Mức | Vị trí | Vấn đề |
|---|---|---|---|
| DOC-21 ✅ đã sửa 14/11 | Thấp | TK §14.2, gạch đầu dòng 1 | Còn ghi "hai nhóm hạn mức `AI` và `ANH`; phát âm thêm ở bước cần", mâu thuẫn với hai gạch đầu dòng TTS và phát âm ngay bên dưới |
| DOC-22 ✅ đã sửa 14/11 | Thấp | `docs/luong-backend/B3.1-tac-vu-nen-va-han-muc.md` dòng 17 | "hai nhóm `AI` và `ANH`", nay là bốn |
| DOC-23 | Thấp | `docs/luong-backend/README.md` dòng 51–57 | 7 luồng B3.x đều "chưa sinh SVG" |
| DOC-24 ✅ đã sửa 14/11 | Trung bình | `mockups/dot3/README.md` | Nhiều đoạn cũ: "Đối chiếu controller ngày 09/11/2026: backend chưa có API đợt 3"; "`ui.js` dùng fixture"; mục "Lệch cần sửa" của UI29 (X-01, X-02) và R-03; "số thẻ 1–3 khớp fixture"; phát âm "không upload/chấm thật"; "hạn mức mẫu 20/60/10". Báo cáo bàn giao ghi UI28, UI29, UI33, UI34, UI38, UI39 đã đọc route demo đúng DTO. Ngày "Đã kiểm tra 12/10/2026" trước cả Đợt 3 |
| DOC-25 | Thấp | `docs/giai-thich/` | Chỉ có B3.2 và B3.5 (311 KB HTML); các bước khác không có, chưa rõ thư mục này có phải đầu ra bắt buộc |
| DOC-26 ❌ rút lại (các dòng này vốn ghi rõ tệp cũ không còn tồn tại) | Thấp | `.claude/skills/be-code/references/sources.md` dòng 17–18, `reporting.md` dòng 10, `fe-report/SKILL.md` dòng 78 | Trỏ tới `ROADMAP_BE.md`, `ROADMAP_FE.md`, `report/…`, `BAO_CAO_TIEN_DO_BE.md` không còn tồn tại |

## 7. Rác và tệp thừa

| ID | Vị trí | Dung lượng | Ghi chú |
|---|---|---|---|
| R-01 ✅ đã xóa 14/11 | `frontend/.next-build`, `.next-csv`, `.next-csv-build`, `.next-speech-build` | khoảng 405 MB | Thư mục build thử, xóa được |
| R-02 ✅ đã xóa 14/11 | `frontend/.next-check`, `.next-contract`, `.next-fe011-dev` | chưa đo | Đã có trong `frontend/.gitignore`, vẫn nằm trên đĩa |
| R-03 ✅ đã xóa 14/11 | `backend/k28/test.log` | 165 KB | Log test ngày 28/10 |
| R-04 ✅ đã `git rm` 14/11 | `frontend/fix.js` | 923 byte, **đang được git theo dõi** | Script sửa một lần (thay `` \` `` và `\${` trong `src`), chạy lại có thể làm hỏng mã |
| R-05 | `frontend/verification/bo-the-desktop.jpg`, `bo-the-mobile.jpg` | đang được git theo dõi | Ảnh kiểm tra Đợt 1 |
| R-06 ◐ thêm `.idea/`, `.env.local`, `frontend/.next-*/`, `test.log` vào `.gitignore`; `.claude/`, `.agents/`, `graphify-out/` chờ quyết định | `.git/info/exclude` | — | `.idea/`, `graphify-out/`, `.claude/`, `.agents/`, `frontend/.next-*/`, `frontend/.env.local`, `test.log` chỉ được loại trừ **cục bộ trên máy này**. `.gitignore` gốc chỉ có `node_modules/`, `.next/`, `.DS_Store`; máy khác sẽ thấy các thư mục này là tệp chưa theo dõi |
| R-07 | `.claude/skills` | — | Không nằm trong git (do R-06), trong khi `CLAUDE.md` mô tả skill là một phần của dự án; thành viên khác không nhận được |
| R-08 | `mockups/dot3/quan-tri-tong-quan.html`, `quan-tri-thong-bao.html`, `quan-tri-tac-vu.html`, `quan-tri-dong-luc.html` | 4 tệp | Màn UI46, UI52, UI53 (tab tác vụ), UI54 đã **Cắt**, giữ "để tham khảo" |
| R-09 | `backend/k28/HELP.md` | 1,4 KB | Tệp mặc định của Spring Initializr, đã bị `.gitignore` |

## 8. Thứ tự xử lý đề xuất

1. Sửa BE-01, BE-05, BE-04 (nhỏ, chặn lỗi 500 và lỗi cấu hình).
2. Bỏ form thẻ, ví, gói Miễn phí ở mockup rồi FE (FE-09, FE-10, FE-11) trước khi làm B3.12a.
3. Cập nhật báo cáo bàn giao Sprint 3 (DOC-01 đến DOC-14) và `mockups/dot3/README.md` (DOC-24) để nhóm FE nối API theo tài liệu đúng.
4. Nhóm FE nối API theo thứ tự đã có BE: F3.6, F3.7, F3.4, F3.1, F3.5 (FE-01 đến FE-08); chốt lại tên route (DOC-17).
5. Sửa số migration trong roadmap (DOC-15); lấy khóa OpenAI và Azure để chạy ba lượt gọi thật rồi tick B3.2, B3.4a, B3.4b.
6. Sửa BE-02, BE-03, BE-06 và 14 lỗi lint (FE-12 đến FE-14).
7. Dọn rác R-01 đến R-05; chuyển các dòng loại trừ sang `.gitignore` (R-06) và quyết định có đưa `.claude/skills` vào git không (R-07).
