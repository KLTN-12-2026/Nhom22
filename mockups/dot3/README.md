# Mockup đợt 3 — F3.1–F3.11

19 màn hình/khối UI28–UI54, theo `roadmap/TienDoDuKien_fronend.md` và
`roadmap/SPRINT_PLAN.md` S7–S9. Mở từ `mockups/index.html#dot3`.
Các link người học dùng `?as=an`; quản trị dùng `?as=admin`, chỉ đăng nhập demo.

## Trạng thái triển khai

Đối chiếu controller ngày 12/10/2026: backend hiện chưa có API đợt 3.
Các endpoint bên dưới là **hợp đồng dự kiến trong tài liệu**, không phải API
đã triển khai hoặc schema OpenAPI đã chốt. Không gọi backend thật từ các trang này.
`ui.js` dùng fixture, mô phỏng xử lý; `shared/flow.js` nối điều hướng và dữ liệu đợt 3 trong sessionStorage
`vocab:dot3:demo:v1`; nút “Đặt lại mẫu đợt 3” không xóa dữ liệu đợt 1/2.

| UI | Tệp | API dự kiến (prefix `/api/v1`) |
|---|---|---|
| UI28 | goi-y.html | GET /learning/recommendations |
| UI29 | ai-xuong-the.html | POST /ai/card-drafts → 202; GET /ai/requests/{id}; POST /ai/card-drafts/{id}/commit, Idempotency-Key |
| UI30 | ai-giai-thich.html | POST /ai/context-explanations; GET /ai/requests/{id} |
| UI31 | ai-viet-cau.html | POST /ai/sentence-feedback; GET /ai/requests/{id} |
| UI32 | ai-lich-su.html | GET /ai/history; GET /me/service-quota; GET /ai/requests/{id} |
| UI33 | phat-am.html | GET /cards/{id}/audio; POST /pronunciation/assessments; GET /pronunciation/assessments/{id} |
| UI34 | phat-am-lich-su.html | GET /pronunciation/history; DELETE /pronunciation/recordings/{id} |
| UI36 | ban-do-lam-chu.html | GET /statistics/skills (B2.10); evidence/mức làm chủ cần chốt schema |
| UI37 | tong-ket-tuan.html | GET /statistics/weekly-summary |
| UI38 | thanh-tich.html | GET /rewards/history; GET /badges; GET /challenges |
| UI39 | thong-bao.html | GET /notifications; PATCH /notifications/{id} |
| UI44 | ca-nhan-du-lieu.html | POST /me/deletion-requests; schema trạng thái cá nhân chưa chốt |
| UI45 | bao-cao-noi-dung.html | POST /reports |
| UI46 | quan-tri-tong-quan.html | GET /admin/statistics; GET /admin/deletion-requests |
| UI50 | quan-tri-bao-cao.html | GET /admin/reports; POST /admin/reports/{id}/resolve |
| UI51 | quan-tri-dich-vu.html | GET/PUT /admin/service-quotas; GET /admin/service-usage |
| UI52 | quan-tri-thong-bao.html | POST /admin/announcements |
| UI53 | quan-tri-tac-vu.html | GET /admin/jobs; nhật ký sẵn trong dot2/quan-tri-nhat-ky.html |
| UI54 | quan-tri-dong-luc.html | CRUD /admin/badges và /admin/challenges |

Hôm nay, bộ thẻ, sổ tay, thống kê, hồ sơ và kết quả học có lối vào các công cụ liên quan. UI28 là ví dụ khối tích hợp Hôm nay/Sổ tay; UI30 là ngăn cạnh thẻ;
UI45 là hộp báo cáo. Các tệp riêng giúp kiểm tra độc lập, không đề xuất bắt buộc
tạo thêm route FE cho ba khối này. UI53 liên kết về tab nhật ký đợt 2.

## Tương tác và ranh giới dữ liệu mẫu

- Xưởng thẻ: yêu cầu bộ đích, mô phỏng chờ/đang xử lý/xong/lỗi/chưa xác định;
  chọn từng thẻ, sửa từ/nghĩa, nghe qua Web Speech, xem đoạn nguồn. Trùng không
  được chọn mặc định. Lưu đúng các thẻ đã chọn, đã sửa vào bộ đích trong VLDemo (localStorage); khóa nút khi đang lưu. Link xem bộ và học bộ giữ đúng ID. Bản nháp giữ lại khi chuyển sang lịch sử hoặc tải lại trang. Đặt lại đợt 3 không xóa thẻ đã thêm vào bộ demo.
  Bản nháp là fixture cố định, không phân tích văn bản thật. Việc lưu dùng thao tác tạo thẻ trong demo đã có từ đợt 1, không gọi endpoint commit AI thật. Chống gửi trùng trong giao diện không thay thế idempotency phía server.
- Viết câu/ngữ cảnh: chỉ render text đã escape; phản hồi cố định được ghi rõ
  là ví dụ cho câu mẫu. Không gửi đoạn văn/câu tới nhà cung cấp AI.
- Phát âm: chỉ xin micro sau khi bấm ghi; MediaRecorder ghi ≤15 giây, nghe lại,
  ghi lại, dừng track khi rời trang. Blob chỉ ở bộ nhớ tab. Chuẩn bị gửi không
  upload/chấm thật. “Xem kết quả mẫu” dùng fixture và không chấm giọng người dùng.
  `null` hiển thị “Chưa có”, không biến thành 0. Cần localhost/HTTPS để ghi âm.
- Thông báo/động lực/kiểm duyệt/hạn mức: thay đổi fixture trong tab, không gửi
  email, cấp điểm, đổi quyền hoặc sửa tài khoản thật. Chi phí thiếu đơn giá luôn
  hiển thị “Chưa xác định”.
- Dữ liệu cá nhân: xác nhận phạm vi rồi nhập XÓA; chỉ chuyển trạng thái mẫu,
  không thực thi xóa. Khi tích hợp cần CSRF, xác thực lại theo chính sách và
  trạng thái tác vụ thực tế; không tự thêm endpoint chưa được đặc tả.
- Hạn mức mẫu 20/60/10 và giới hạn đoạn văn/câu là giả định trình bày. Thay bằng
  cấu hình/validation chính thức khi B3.1–B3.11 có OpenAPI. Không coi là giá hoặc
  giới hạn hiện hành của dịch vụ ngoài.

## Kiểm tra

Mỗi trang có bộ chọn “Trạng thái mô phỏng”: có dữ liệu, tải, trống, lỗi,
hết hạn mức AI, AI chưa rõ kết quả. Không khóa học SRS khi AI lỗi/hết hạn mức.
Kiểm tra sáng/tối, 360–390px và desktop; form/dialog bằng bàn phím, nhãn dài,
lịch sử rỗng sau lọc/xóa, chọn hai lượt cùng từ, và không cho gửi trùng lúc pending.
Chạy `npm run ui:sync` và `npm run ui:check` trong frontend sau chỉnh shared assets.

CSS `ui.css` chỉ chứa bố cục đợt 3, không sao chép palette. Toàn bộ màu, theme,
nút và hình giấy dùng shared tokens/base/components/learning-refinements của FE.
Không thay đổi frontend hoặc đánh dấu F3/B3 hoàn thành triển khai.

Đã kiểm tra ngày 12/10/2026: 19 trang ở desktop sáng và 360px tối không tràn
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
