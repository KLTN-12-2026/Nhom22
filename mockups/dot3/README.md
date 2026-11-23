# Mockup đợt 3 — F3.1–F3.13

Các màn hình/khối UI28–UI59, theo `roadmap/TienDoDuKien_fronend.md`,
`roadmap/SPRINT_PLAN.md` S7–S9 và phạm vi đã cắt `docs/KE_HOACH_CAT_DOT3.md` (07/11/2026).
Mở từ `mockups/index.html#dot3`. UI46, UI52, UI54 và UI53 (tab tác vụ nền) là **Cắt** khỏi Đợt 3:
tệp mockup giữ để tham khảo, không làm FE/BE. UI29 còn lệch tài liệu, xem mục "Lệch cần sửa".
Các link người học dùng `?as=an`; quản trị dùng `?as=admin`, chỉ đăng nhập demo.

## Trạng thái triển khai

Đối chiếu ngày 14/11/2026: backend đã có API cho UI28 (B3.5), UI29 (B3.2), UI33/UI34 (B3.4a, B3.4b),
UI38 (B3.6), UI39 (B3.7); hợp đồng thật ở `ban-giao-cho fe/SPRINT_3_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` mục 5.
Sáu màn này đọc route demo cùng DTO trong `shared/demo.js` (`VLDemo`). Endpoint của các màn còn lại là
**hợp đồng dự kiến trong tài liệu**. Mockup không bao giờ gọi backend thật.
Các màn chưa có API: `ui.js` dùng fixture, mô phỏng xử lý; `shared/flow.js` nối điều hướng và dữ liệu đợt 3 trong sessionStorage
`vocab:dot3:demo:v1`; nút “Đặt lại mẫu đợt 3” không xóa dữ liệu đợt 1/2.

| UI | Tệp | API dự kiến (prefix `/api/v1`) |
|---|---|---|
| UI28 | goi-y.html | GET /learning/recommendations |
| UI29 | ai-xuong-the.html | POST /ai/card-drafts → 202; GET /ai/requests/{id}; POST /ai/card-drafts/{id}/commit, Idempotency-Key |
| UI30 | ai-giai-thich.html | POST /ai/context-explanations; GET /ai/requests/{id} (B3.3, đã đối chiếu DTO 16/11/2026) |
| UI31 | ai-viet-cau.html | POST /ai/sentence-feedback; GET /ai/requests/{id} (B3.3, đã đối chiếu DTO 16/11/2026) |
| UI32 | ai-lich-su.html | GET /ai/history; GET /me/service-quota; GET /ai/requests/{id} (B3.3, đã đối chiếu DTO 16/11/2026) |
| UI33 | phat-am.html | GET /cards/{id}/audio; POST /pronunciation/assessments; GET /pronunciation/assessments/{id} |
| UI34 | phat-am-lich-su.html | GET /pronunciation/history; DELETE /pronunciation/recordings/{id} |
| UI36 | ban-do-lam-chu.html | GET /statistics/skills (B2.10); evidence/mức làm chủ cần chốt schema |
| UI37 | tong-ket-tuan.html | GET /statistics/weekly-summary |
| UI38 | thanh-tich.html | GET /rewards/history; GET /badges; GET /challenges |
| UI39 | thong-bao.html | GET /notifications; PATCH /notifications/{id} |
| UI44 | ca-nhan-du-lieu.html | POST /me/deletion-requests (đã đối chiếu DTO 16/11/2026) |
| UI45 | bao-cao-noi-dung.html | POST /reports |
| UI46 | quan-tri-tong-quan.html | **Cắt** (GET /admin/statistics, GET /admin/deletion-requests không làm) |
| UI50 | quan-tri-bao-cao.html | GET /admin/reports; POST /admin/reports/{id}/resolve |
| UI51 | quan-tri-dich-vu.html | GET/PUT /admin/service-quotas; GET /admin/service-usage |
| UI58 | quan-ly-thong-ke.html | GET /admin/revenue?ky=THANG\|QUY\|NAM (B3.12c, đã đối chiếu DTO 16/11/2026) |
| UI59 | quan-ly-thanh-toan.html | GET /admin/payments; GET /admin/payments/{maDon}; GET /admin/subscriptions; GET/PUT /admin/plans; PATCH /admin/subscriptions/{id}/expiry; POST /admin/subscriptions/expiry-check (B3.12c, đã đối chiếu DTO 16/11/2026) |
| UI52 | quan-tri-thong-bao.html | **Cắt** (POST /admin/announcements không làm) |
| UI53 | quan-tri-tac-vu.html | **Cắt** tab tác vụ nền (GET /admin/jobs không làm); nhật ký đã có ở dot2/quan-tri-nhat-ky.html |
| UI54 | quan-tri-dong-luc.html | **Cắt** (huy hiệu/thử thách cố định bằng migration) |
| UI55 | thanh-toan-goi.html | GET /billing/plans; GET /me/subscription; POST /billing/checkouts (B3.12a, đã đối chiếu DTO 16/11/2026) |
| UI56 | thanh-toan-lich-su.html | GET /me/subscription; GET /billing/transactions; GET /billing/transactions/{maDon}/receipt (B3.12b, đã đối chiếu DTO 16/11/2026) |
| UI57 | thanh-toan-ket-qua.html | GET /billing/transactions/{maDon}; GET /me/subscription (kết quả VNPay chuyển về, B3.12a, 16/11/2026) |

Hôm nay, bộ thẻ, sổ tay, thống kê, hồ sơ và kết quả học có lối vào các công cụ liên quan. UI28 là ví dụ khối tích hợp Hôm nay/Sổ tay; UI30 là ngăn cạnh thẻ;
UI45 là hộp báo cáo. Các tệp riêng giúp kiểm tra độc lập, không đề xuất bắt buộc
tạo thêm route FE cho ba khối này. UI53 liên kết về tab nhật ký đợt 2.

## Lệch cần sửa so với tài liệu đã thống nhất

- UI29: đã có lưu vào bộ mới (X-02) và "Sửa trước khi lưu" (X-06) theo B3.2; còn thiếu X-03 (hoàn thiện IPA + ví dụ) và X-04 (sinh ảnh AI), chờ B3.3. Xem `KE_HOACH_CAT_DOT3.md` §7.
- UI55/UI56 (đã sửa 15/11/2026, mockup và FE): bỏ form thẻ/CVV, chuyển khoản, ví điện tử, thẻ đã lưu, "Hỗ trợ ưu tiên", gói Miễn phí, "Hủy gói", "Đổi gói" và tạo hóa đơn ở trình duyệt; giá và quyền lợi theo TK §6.9 (Pro 299.000/2.990.000 đ, Premium 999.000/9.990.000 đ; thẻ, AI văn bản, ảnh AI, phát âm, bộ mẫu cao cấp); chỉ còn VNPay; UI56 có "Gia hạn gói", trạng thái `THANH_CONG`/`THAT_BAI`/`HET_HAN` và nút "Biên nhận"; token màu thật cho theme tối, bỏ gradient và chữ in hoa. Từ 16/11/2026 UI55–UI57 đọc route demo cùng DTO với B3.12a/b. Còn thiếu: banner sắp hết hạn trong khung ứng dụng (F3.12, dùng `GET /me/subscription.soNgayConLai`).
- Chuỗi ngày trên mockup Hôm nay cần dòng "Đã dùng ngày nghỉ tuần này" (R-03).

## Tương tác và ranh giới dữ liệu mẫu

- Thống kê doanh thu (UI58): mở `quan-ly-thong-ke.html?as=admin`. Chuyển tháng/quý/năm, chọn năm hoặc khoảng năm (mặc định 5 năm gần nhất); mỗi lần đổi gọi route demo `GET /admin/revenue` cùng quy tắc BE (chỉ giao dịch thành công theo `hoanTatAt`, ranh giới kỳ giờ Việt Nam, so với giai đoạn liền trước, tỷ lệ thành công theo `taoAt`, gói hiệu lực tại lúc tải). Cột "So kỳ trước" tính ở trình duyệt từ `cacKy` liền trên. Khoảng năm ngược hiện lỗi 400 `yearRangeValid` từ route. Biểu đồ cột chồng Pro/Premium chọn bằng chuột/bàn phím, tỷ trọng, bảng và xuất CSV theo kỳ đang xem. Dữ liệu là bộ giao dịch mẫu chung với UI55–UI59 trong `db.billing` (sinh cố định từ 2022 đến nay).
- Gói và thanh toán (UI55–UI57): `?as=an` gói Pro còn hạn (chỉ gia hạn Pro, Premium bị khóa, 422 nếu gọi), `?as=binh` Premium 1 năm, `?as=linh.vo` gói đã hết hạn, `?as=dung.tran` chưa có gói; thêm `&lyDo=HET_HAN` để thấy thông báo khóa học. Footer UI55 chọn kết quả VNPay mô phỏng: thành công (sau ~1,5 giây), IPN đến chậm (~8 giây, UI57 hỏi lại mỗi 2 giây), người dùng hủy (mã `24`). Đơn chờ quá 15 phút thành `HET_HAN`. Biên nhận UI56 mở HTML trong thẻ mới qua Blob. "Đặt lại mẫu thanh toán" chỉ xóa `db.billing` của VLDemo.
- Quản lý thanh toán (UI59): mở `quan-ly-thanh-toan.html?as=admin`. Tab giao dịch lọc email/trạng thái/gói/ngày tạo (phân trang 10, khoảng ngày ngược → 400), chi tiết kèm `duLieuCong` đã bỏ chữ ký, xuất CSV gọi lại API theo bộ lọc (100/trang). Tab gói người dùng lọc email/gói/hiệu lực (`sapHetHan=7`); công cụ demo sửa hạn (`version`, lý do 10–500 ký tự) và chạy kiểm tra hết hạn (thông báo vào hộp thư mẫu, ghi nhật ký quản trị). Footer chọn "Công cụ demo trên máy chủ: Tắt" để thấy 404 → ẩn khối như FE. Tab cấu hình gói sửa tên, giá, giới hạn thẻ, cờ, mở bán, lý do tùy chọn; 400 tô trường, 409 nút tải lại, 422 khi tắt gói đang bán cuối cùng. Hạn mức AI/ảnh sửa ở UI51. "Đặt lại mẫu thanh toán" xóa `db.billing` của VLDemo.
- Xưởng thẻ: yêu cầu bộ đích, mô phỏng chờ/đang xử lý/xong/lỗi/chưa xác định;
  chọn từng thẻ, sửa từ/nghĩa, nghe qua Web Speech, xem đoạn nguồn. Trùng không
  được chọn mặc định. Lưu đúng các thẻ đã chọn, đã sửa vào bộ đích trong VLDemo (localStorage); khóa nút khi đang lưu. Link xem bộ và học bộ giữ đúng ID. Bản nháp giữ lại khi chuyển sang lịch sử hoặc tải lại trang. Đặt lại đợt 3 không xóa thẻ đã thêm vào bộ demo.
  Từ B3.2 (14/11/2026) bản nháp và việc lưu đi qua ba route demo cùng DTO với backend (202, hỏi trạng thái, `Idempotency-Key`); không gọi endpoint AI thật. Chống gửi trùng trong giao diện không thay thế idempotency phía server.
- Viết câu/ngữ cảnh/lịch sử AI (UI30–UI32, 16/11/2026): gọi route demo `POST /ai/context-explanations`, `POST /ai/sentence-feedback`, hỏi `GET /ai/requests/{id}` mỗi 0,9 giây, render `ketQua` đã escape. Phản hồi là luật mô phỏng (quá khứ đơn với mốc thời gian, vài lỗi chính tả, viết hoa/dấu chấm là gợi ý `PHONG_CACH`; mẹo nhớ/cách dùng có sẵn cho receipt, refund, appointment), không gửi câu tới nhà cung cấp AI. Bộ chọn trạng thái: “Lỗi” → `LOI` hoàn lượt, “AI chưa rõ kết quả” → `KHONG_XAC_DINH` tính lượt, “Hết hạn mức AI” → 429. Hạn mức theo gói đang hiệu lực (Pro 20 AI/ngày); tài khoản không có gói (kể cả admin) có hạn mức 0 như BE.
- Phát âm: chỉ xin micro sau khi bấm ghi; MediaRecorder ghi ≤15 giây, nghe lại,
  ghi lại, dừng track khi rời trang. Blob chỉ ở bộ nhớ tab. Từ B3.4b (14/11/2026) bản ghi
  được đổi sang WAV 16 kHz rồi gửi route demo; điểm là mô phỏng, không chấm giọng người dùng.
  `null` hiển thị “Chưa có”, không biến thành 0. Cần localhost/HTTPS để ghi âm.
- Thông báo/động lực/kiểm duyệt/hạn mức: thay đổi fixture trong tab, không gửi
  email, cấp điểm, đổi quyền hoặc sửa tài khoản thật. Chi phí thiếu đơn giá luôn
  hiển thị “Chưa xác định”.
- Dữ liệu cá nhân (UI44): xác nhận phạm vi rồi nhập email tài khoản và mật khẩu; route demo
  `POST /me/deletion-requests` chuyển tài khoản mẫu sang `DANG_XOA` và đăng xuất, không xóa dữ liệu
  thật. "Khôi phục dữ liệu mẫu" đưa toàn bộ VLDemo về ban đầu.
- Hạn mức mẫu 20/60/10 và giới hạn đoạn văn/câu là giả định trình bày (backend: `PRO` AI 20, ảnh 10, TTS 100, phát âm 30). Thay bằng
  cấu hình/validation chính thức khi B3.1–B3.12b có OpenAPI. Không coi là giá hoặc
  giới hạn hiện hành của dịch vụ ngoài.

## Kiểm tra

### Phiếu hỗ trợ (mockup bổ sung)

Mở `phieu-ho-tro.html?as=an` từ danh mục hoặc mục **Tài khoản → Phiếu hỗ trợ**.
Route dự kiến của ứng dụng là `/support-tickets`; bản mockup dùng tệp HTML trong đợt 3.
Tab đồng bộ `?status=open|resolved`, hỗ trợ Back/Forward; tìm tiêu đề/mô tả sau 300 ms,
không phân biệt hoa thường hoặc dấu tiếng Việt. Lọc loại vấn đề và độ ưu tiên, gỡ từng
chip hoặc đặt lại tất cả; phân trang 6 phiếu/trang, ngày hiển thị theo giờ Việt Nam.
Badge đếm các điều kiện đang áp dụng, gồm tìm kiếm, trạng thái, loại và độ ưu tiên.

Hộp thoại tạo phiếu kiểm tra tiêu đề bắt buộc/tối đa 150 ký tự và mô tả bắt buộc;
không chấp nhận chuỗi chỉ có khoảng trắng. Mặc định Kỹ thuật/Trung bình. Gửi mô phỏng
trong 650 ms, khóa thao tác khi gửi; thành công đóng hộp thoại, hiện toast, đặt lại bộ lọc
và đưa phiếu mới lên đầu. Nếu không lưu được, giữ form và cho thử lại.
Dữ liệu lưu trong `localStorage` với khóa `vocab:support-tickets:v1:<userId>`, tách theo
tài khoản demo. Không gọi API hoặc tạo yêu cầu hỗ trợ thật, không đổi frontend/backend.

### Tiếp nhận hỗ trợ (mockup bổ sung)

Mở `tiep-nhan-ho-tro.html?as=admin` từ danh mục hoặc **Quản trị → Tiếp nhận hỗ trợ**.
Trang yêu cầu vai trò ADMIN, dùng shell và theme chung. Có tổng quan số phiếu,
tìm mã/nội dung/tên/email không phân biệt dấu, lọc loại/ưu tiên, sắp xếp mới/cũ/ưu tiên,
tab tất cả/đang mở/đã giải quyết đồng bộ URL và Back/Forward, phân trang 6 phiếu.

Chi tiết hiện người gửi, nội dung, lịch sử xử lý. Phản hồi tối đa 2000 ký tự;
phải có kết quả xử lý khi chuyển sang đã giải quyết. Cho phép mở lại phiếu,
đổi ưu tiên, phản hồi nhiều lần; khóa thao tác khi lưu, giữ bản nháp khi lưu lỗi.
Phiếu bị thay đổi ở tab khác yêu cầu mở lại chi tiết trước khi ghi.

Hai màn dùng `support-demo.js` và cùng khóa localStorage
`vocab:support-tickets:v1:<userId>`. Mặc định hiện 12 phiếu mẫu của Nguyễn An;
những tài khoản demo khác xuất hiện khi đã có danh sách phiếu được lưu.
Phiếu mới ở màn học viên hiện khi làm mới hoặc qua sự kiện storage giữa các tab;
trạng thái quản trị cập nhật hiển thị ở màn học viên sau khi tải lại.
Lịch sử phản hồi xem ở chi tiết quản trị. Không gọi API, không gửi email hay tạo
thông báo thật; không thay đổi frontend/backend.

Đã kiểm tra bằng Chrome: tìm/lọc/phân trang, URL Back/Forward, phản hồi và mở lại,
lưu bền vững, giữ form khi lỗi lưu, chặn ghi đè phiên bản thay đổi ở tab khác,
quyền ADMIN, luồng học viên → quản trị, Escape và hiển thị ở 360/390/768/1024/1440px,
theme sáng/tối. Luồng tạo phiếu học viên được kiểm tra lại sau khi tách dữ liệu chung.
`ui:sync` và `ui:check` hiện không chạy hết vì thiếu tệp nguồn có sẵn
`frontend/public/mascot.js`; không sửa script đồng bộ hay frontend trong thay đổi này.

### Các màn đợt 3

Mỗi trang có bộ chọn “Trạng thái mô phỏng”: có dữ liệu, tải, trống, lỗi,
hết hạn mức AI, AI chưa rõ kết quả. Không khóa học SRS khi AI lỗi/hết hạn mức.
Kiểm tra sáng/tối, 360–390px và desktop; form/dialog bằng bàn phím, nhãn dài,
lịch sử rỗng sau lọc/xóa, chọn hai lượt cùng từ, và không cho gửi trùng lúc pending.
Chạy `npm run ui:sync` và `npm run ui:check` trong frontend sau chỉnh shared assets.

CSS `ui.css` chỉ chứa bố cục đợt 3, không sao chép palette. Toàn bộ màu, theme,
nút và hình giấy dùng shared tokens/base/components/learning-refinements của FE.
Không thay đổi frontend hoặc đánh dấu F3/B3 hoàn thành triển khai.

Đã kiểm tra ngày 12/10/2026 (ngày ghi trong bản gốc, trước Đợt 3; chưa kiểm lại sau các thay đổi 11–14/11/2026): 19 trang ở desktop sáng và 360px tối không tràn
ngang, không lỗi runtime; luồng chọn/sửa/lưu 1 thẻ, phản hồi câu, so sánh 2 lượt,
đánh dấu đã đọc, kiểm duyệt có lý do và xác nhận xóa mẫu hai bước chạy đúng.
Đã thử các trạng thái tải/trống/lỗi/hết hạn mức/chưa xác định; kiểm tra bổ sung
form ở 390px. `ui:check`, cú pháp JavaScript và đường dẫn nội bộ đạt.
Chưa cấp quyền micro/thu âm thật trong kiểm tra tự động; người dùng có thể tự
kiểm tra phần ghi âm trên localhost/HTTPS. Không kiểm thử API đợt 3 vì chưa có backend.

## Luồng đồng bộ mockup

- Shell chung cho đợt 1/2/3: Học tập → Công cụ học → Tiến bộ → Tài khoản.
  Trang quản trị dùng nhóm quản trị và lối trở về học tập. Điện thoại có menu
  trong header dùng cùng các mục; không có menu riêng chỉ đi qua trang đợt 3.
- Link nội bộ không ép `as=an/admin`. Chỉ lối vào ở danh mục chọn persona demo.
- Xưởng thẻ → lịch sử → tiếp tục bản nháp → lưu bộ đích → chi tiết bộ → học.
  Số thẻ mong muốn 1–3 khớp fixture. Bộ đích lấy từ các bộ thực sự thuộc persona.
- Yêu cầu AI cập nhật lịch sử và tác vụ nền; trạng thái chờ, xong, lỗi, chưa rõ
  kết quả không biến thành thành công. Hạn mức trong lịch sử dùng cấu hình quản trị.
- Báo cáo từ thẻ mang theo đối tượng → hàng đợi quản trị → quyết định và lý do →
  thông báo người gửi → lịch sử báo cáo cá nhân. Thông báo quản trị xuất hiện trong
  hộp thông báo mẫu; mở nội dung đánh dấu đã đọc.
- Yêu cầu xóa cá nhân phản ánh trong tổng quan quản trị; không xóa tài khoản thật.
- Các thao tác phụ trong mỗi thẻ gom vào “Thêm thao tác”. Ngữ cảnh mở tại chỗ,
  hiển thị nghĩa/ví dụ đã lưu, không bịa kết quả AI cho từ tùy ý.

Đã kiểm tra thêm: lưu 1 thẻ đã đổi từ vào bộ 22 và thấy đúng ở chi tiết bộ;
đã xóa riêng thẻ kiểm thử. Luồng báo cáo → kiểm duyệt → thông báo chạy xuyên màn.
19 màn đợt 3 ở desktop sáng và 360px tối có nội dung, không tràn ngang, không lỗi
JavaScript; menu di động và điều hướng quản trị đã kiểm tra. Cú pháp script,
đường dẫn nội bộ và kiểm tra đồng bộ CSS đạt. Chỉ chỉnh mockups, không viết UI FE
hoặc API backend trong lần cập nhật này.
