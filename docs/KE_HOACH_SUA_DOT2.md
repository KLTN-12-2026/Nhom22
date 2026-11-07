# Kế hoạch sửa Đợt 2 (BE + FE + tài liệu)

| Mục | Giá trị |
|---|---|
| Ngày lập | 06/11/2026 |
| Dựa trên | [BAO_CAO_RA_SOAT_DOT2.md](BAO_CAO_RA_SOAT_DOT2.md) + đọc lại mã ngày 06/11/2026 |
| Phạm vi | Đợt 2 = S5 + S6: B2.1–B2.12, F2.1–F2.8 |
| Trạng thái | 07/11/2026: xong BE-01, VER-01, BE-02, DOC-01…09, FE-01…FE-08 (kiểm trên BE thật qua Next.js); BE-03 một phần |
| Hạn | Demo Đợt 2: 08/11/2026 |

Quy ước mã việc: `FE-xx` (frontend), `BE-xx` (backend), `DOC-xx` (tài liệu), `VER-xx` (kiểm chứng). Ưu tiên P0 = chặn demo, P1 = cần cho Đợt 2 đủ DoD, P2 = dọn dẹp.

Đường dẫn FE viết tắt: `(app)` = `frontend/src/app/(app)`. Đường dẫn BE viết tắt: `k28/` = `backend/k28/src/main/java/com/do_an_tot_nghiep/k28/`.

---

## 0. Thứ tự làm đề xuất

| Lượt | Việc | Lý do |
|---|---|---|
| 1 | VER-01 (dựng lại stack) | Không có BE chạy thì không kiểm được mục nào |
| 2 | FE-01, FE-02 (gỡ cổng chặn, tắt mock) | Đang che toàn bộ trang Đợt 2 |
| 3 | FE-03 … FE-07 (sửa tên field, endpoint) | Lỗi chức năng thấy ngay khi chạy BE thật |
| 4 | FE-05 (âm thanh nghe viết) | BE-01 đã có API `.../questions/{cauHoiId}/audio` |
| 5 | FE-08, FE-09 (UI22, khối B2.12 trên UI12) | Thiếu màn hình |
| 6 | VER-02, VER-03 (Postman + demo đầu-cuối) | Chốt bằng chứng |
| 7 | DOC-01 … DOC-10 | Đồng bộ tài liệu với trạng thái thật |
| 8 | P2 còn lại | Sau demo |

---

## 1. Bảng tổng hợp

| Mã | Ưu tiên | Bên | Tóm tắt | Cỡ |
|---|---|---|---|---|
| VER-01 | ✅ | BE | Dựng lại Docker stack (xong 07/11: `compose down` + `up --build`; nguyên nhân: hạ tầng không có restart policy, chỉ `api` tự khởi động lại) | Vừa |
| FE-01 | ✅ 07/11 | FE | `FeatureGate` còn chặn 3 trang quản trị và chặn luyện tập/sổ tay/thống kê khi tắt mock | Nhỏ |
| FE-02 | ✅ 07/11 | FE | Mock tự thay BE ở dev; banner "máy chủ chưa có chức năng này" sai sự thật | Nhỏ |
| FE-03 | ✅ 07/11 | FE | UI49 gọi `/admin/cards?boTheId`, `POST /admin/cards` (BE không có) | Nhỏ |
| FE-04 | ✅ 07/11 | FE | Xóa thẻ mẫu không gửi `version` | Nhỏ |
| FE-05 | ✅ 07/11 | FE+BE | Nghe viết đọc `deBai.amThanhUrl`; BE trả `amTuId` | Vừa |
| FE-06 | ✅ 07/11 | FE | Bài luyện gửi/đọc `thoiGianMs`; BE dùng `thoiGian` | Nhỏ |
| FE-07 | ✅ 07/11 | FE | Thống kê đọc `mucTieuPhutNgay`; BE trả `phutMoiNgay` | Nhỏ |
| FE-08 | ✅ 07/11 | FE | Sổ tay cặp nhầm đọc `loaiNham`, `soLan`; BE trả `soLanNham`, `lanCuoiAt` | Nhỏ |
| BE-01 | ✅ | BE | API âm thanh câu nghe viết `GET /practice/sessions/{id}/questions/{cauHoiId}/audio` (xong 06/11) | Nhỏ |
| FE-09 | P1 | FE | UI22 "Cứu lịch ôn" chưa làm | Vừa |
| FE-10 | P1 | FE | UI12 thiếu khối "Phiên đang dở", "Hoạt động 7 ngày", "Dự báo ôn" | Vừa |
| FE-11 | P1 | FE | Logo/"Trở về" về `/bo-the` thay vì `/hom-nay` | Nhỏ |
| FE-12 | P1 | FE | Đối chiếu 14 trang với mockup, 360px, trạng thái tải/rỗng/lỗi | Lớn |
| FE-13 | P1 | FE | Xóa mock route Next.js Đợt 2 sau khi BE thật chạy | Vừa |
| BE-02 | ✅ | BE | Postman thống kê thêm 5 ca lỗi (xong 07/11, đã `curl` đúng) | Nhỏ |
| BE-03 | 🟡 | BE | Biến environment xong 07/11; mô tả collection phải sửa tay trong Postman (MCP không sửa riêng `info`) | Nhỏ |
| VER-02 | P1 | BE | Chạy Postman Đợt 2 trên HTTP thật, lưu kết quả | Vừa |
| VER-03 | P1 | BE+FE | Demo đầu-cuối Đợt 2 trên BE thật | Vừa |
| DOC-01…10 | 🟡 | BE | DOC-01…09 xong 07/11; DOC-10 thuộc roadmap FE (BE không sửa) | Nhỏ |
| FE-14 | P2 | FE | `/hoc-tong-ket` gọi `POST .../finish` trong `useQuery` | Nhỏ |
| FE-15 | P2 | FE | Test cho trang Đợt 2 | Vừa |
| FE-16 | P2 | FE | Dùng `alert`/`prompt`/`confirm` ở UI49 | Vừa |
| BE-04 | P2 | BE | Lọc thống kê theo chủ đề (TK §10 UI35) | Vừa |
| FE-17 | P2 | FE | Sửa `frontend/README.md` mục "Trang chờ backend" | Nhỏ |

---

## 2. Kiểm chứng nền (làm trước)

### VER-01 · P0 · Dựng lại stack BE

- **Hiện trạng:** báo cáo bàn giao §10 (04/11/2026) ghi `vocab-api-1` khởi động lại liên tục vì `UnknownHostException: mysql`; `vocab-mysql-1`, `vocab-redis-1`, `vocab-s3-1`, `vocab-mailpit-1` đã dừng (mã 255).
- **Cách sửa:**
  1. Trong `backend/k28`: `docker compose down` rồi `docker compose up -d` (chỉ hạ tầng).
  2. Đợi `vocab-mysql-1` ở trạng thái healthy rồi mới chạy API: `.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev`, hoặc `docker compose --profile app up -d --build`.
  3. Nếu vẫn `UnknownHostException`: kiểm `depends_on: condition: service_healthy` của service `api` và tên network trong compose.
- **Kiểm chứng:** `GET http://localhost:8080/api/v1/public/ping` trả 200; `GET /actuator/health` trả `UP`.

---

## 3. Frontend

### FE-01 · P0 · Gỡ cổng chặn trang Đợt 2

- **File:** `frontend/src/components/layout/FeatureGate.js:5-9`
- **Hiện trạng:**
  ```js
  const FUTURE = ['/quan-tri/tai-khoan', '/quan-tri/bo-mau', '/quan-tri/nhat-ky'];
  ...
  return FUTURE.some(...) || (!DOT2_MOCK && isDot2Route(path));
  ```
  - UI47, UI49, UI53 luôn hiện "Tính năng đang được hoàn thiện" dù BE B2.11 đã có.
  - Khi `NEXT_PUBLIC_DOT2_MOCK=disabled` (giá trị trong `frontend/.env.example:4`, và mặc định ở build production), `/luyen-tap*`, `/so-tay`, `/thong-ke` cũng bị chặn.
- **Cách sửa:**
  - `FUTURE = []` (hoặc xóa hẳn danh sách).
  - Bỏ vế `(!DOT2_MOCK && isDot2Route(path))`: B2.7–B2.10 đã có, không còn lý do chặn.
- **Kiểm chứng:** đăng nhập Admin, mở `/quan-tri/tai-khoan`, `/quan-tri/bo-mau`, `/quan-tri/nhat-ky`; đăng nhập User, mở `/luyen-tap`, `/so-tay`, `/thong-ke` với `NEXT_PUBLIC_DOT2_MOCK=disabled`: không còn trang chặn.

### FE-02 · P0 · Tắt mock tự thay BE, bỏ banner sai

- **File:** `frontend/src/lib/dot2-mock.mjs:5-9`, `frontend/src/app/api/v1/_mock/backend.js:52-64`, `frontend/src/components/layout/FeatureGate.js:13-14`
- **Hiện trạng:**
  - `dot2MockEnabled()` trả `true` khi `NODE_ENV === 'development'` nếu không đặt biến.
  - `proxyOrMock` gọi BE trước, nhưng BE trả 404 (không có `code`), 405, 501, 502, 503 hoặc mất kết nối thì trả dữ liệu mock mà không báo lỗi.
  - Ở dev, các trang Đợt 2 luôn hiện banner "Dữ liệu minh họa: máy chủ chưa có chức năng này…", kể cả khi dữ liệu là thật.
- **Cách sửa:**
  1. Đổi mặc định: `return false;` khi `flag` không phải `'enabled'` (mock chỉ bật khi đặt rõ `NEXT_PUBLIC_DOT2_MOCK=enabled`).
  2. Tạo `frontend/.env.local` từ `.env.example` (giữ `NEXT_PUBLIC_DOT2_MOCK=disabled`) trên máy demo.
  3. Banner chỉ hiện khi response thực sự đến từ mock: cho route mock gắn header `X-Mock: 1`, `api-client` đọc header này; hoặc bỏ banner nếu đi theo FE-13.
- **Kiểm chứng:** tắt BE, mở `/thong-ke`: phải hiện trạng thái lỗi kết nối (502 `SERVICE_UNAVAILABLE`), không hiện số liệu giả.

### FE-03 · P0 · UI49 dùng đúng endpoint thẻ mẫu

- **File:** `(app)/quan-tri/bo-mau/page.js:115-122`, `:202-206`, `:341-343`
- **Hợp đồng BE** (`k28/admin/controller/AdminDeckController.java:69-79`, bàn giao §5.12):
  - `GET /api/v1/admin/decks/{id}/cards?page=&size=` → `PageResponse<CardResponse>` `{items, page, size, totalElements, totalPages}`
  - `POST /api/v1/admin/decks/{id}/cards` body `CreateCardRequest` (không có `boTheId` trong body)
  - `PATCH /api/v1/admin/cards/{id}` body có `version`
  - **Không có** `GET /admin/cards` và `POST /admin/cards`.
- **Hiện trạng:**
  ```js
  queryFn: () => apiFetch(`/api/v1/admin/cards?boTheId=${id}`)
  ...
  else body.boTheId = deckId;
  apiFetch(`/api/v1/admin/cards${card ? `/${card.id}` : ''}`, { method: card ? 'PATCH' : 'POST', ... })
  ...
  cards?.length > 0 ? cards.map(...)
  ```
- **Cách sửa:**
  - Danh sách: `fetchAllPages(`/api/v1/admin/decks/${id}/cards`)` (đã có `@/lib/fetch-all-pages`), hoặc phân trang với `size=100` rồi đọc `.items`.
  - Tạo: `apiFetch(`/api/v1/admin/decks/${deckId}/cards`, { method: 'POST', body })`, bỏ `body.boTheId`.
  - Sửa: giữ `PATCH /api/v1/admin/cards/${card.id}` kèm `version`.
  - Render: dùng mảng `items` (hoặc kết quả `fetchAllPages`).
- **Kiểm chứng:** mở một bộ mẫu ở UI49, thấy danh sách thẻ; thêm thẻ trả 201; sửa thẻ trả 200; Network không còn request `/admin/cards?boTheId`.

### FE-04 · P0 · Xóa thẻ mẫu gửi `version`

- **File:** `(app)/quan-tri/bo-mau/page.js:271-274`
- **Hợp đồng BE:** `DELETE /api/v1/admin/cards/{id}?version={version}` (`AdminCardController.java:35-38`); bàn giao §10 B2.11: "xóa thẻ là xóa mềm, cần `version`". Mockup `mockups/dot2/quan-tri-bo-mau.html:286` đã gửi đúng.
- **Hiện trạng:** `url: `/api/v1/admin/cards/${c.id}`` (thiếu `version`).
- **Cách sửa:** `url: `/api/v1/admin/cards/${c.id}?version=${c.version}``. Xử lý 409 `VERSION_CONFLICT` bằng cách tải lại danh sách; 422 (xóa thẻ cuối của bộ công khai) hiện thông báo của BE.
- **Kiểm chứng:** xóa thẻ trả 204; xóa bằng version cũ trả 409.

### FE-05 · P0 · Âm thanh câu nghe viết (BE-01 đã xong 06/11/2026)

- **File:** `(app)/luyen-tap-lam-bai/page.js:38-55` (`ListenPrompt`), `:211`
- **Hợp đồng BE:** `deBai` của `NGHE_VIET` = `{amTuId, tuLoai}`, không có URL. Lấy URL bằng `GET /api/v1/practice/sessions/{id}/questions/{cauHoiId}/audio` → `{id, loai, mimeType, kichThuoc, checksum, hoanTatAt, downloadUrl, expiresAt}` (bàn giao §5.8). 404 `NOT_FOUND` với message "Không tìm thấy bài luyện" / "Không tìm thấy câu hỏi" / "Câu hỏi không có âm thanh".
- **Hiện trạng:** `<ListenPrompt url={q.deBai?.amThanhUrl} ... />` → luôn hiện "Câu này chưa có âm thanh".
- **Cách sửa:**
  1. `ListenPrompt` nhận `practiceId`, `questionId`, `hasAudio = !!q.deBai?.amTuId` thay vì `url`.
  2. Khi bấm "Nghe"/"Nghe chậm": gọi `apiFetch(`/api/v1/practice/sessions/${practiceId}/questions/${questionId}/audio`)`, phát `downloadUrl` với `playbackRate` 1 hoặc 0.6. Có thể giữ URL đến `expiresAt` để không gọi lại mỗi lần bấm.
  3. Lỗi API thì hiện `err.message` của BE; `hasAudio = false` thì giữ thông báo "Câu này chưa có âm thanh".
  4. Không dùng giọng đọc trình duyệt cho câu nghe viết (lộ đáp án, quyết định B2.7).
  5. Mẫu làm theo: `mockups/dot2/luyen-tap-lam-bai.html` (sự kiện click `[data-play]`).
- **Kiểm chứng:** tạo bài `NGHE_VIET` từ bộ có âm từ; nút "Nghe" phát được; Network có request `.../questions/{id}/audio` trả 200.

### FE-06 · P0 · Đổi `thoiGianMs` → `thoiGian` ở luyện tập

- **Hợp đồng BE:**
  - Nộp bài `SubmitPracticeRequest` (`k28/practice/dto/SubmitPracticeRequest.java`): `{submitKey, thoiGian (Long, ms, bắt buộc, ≥0), traLoi[] (≤20)}`.
  - Kết quả `PracticeResultResponse.thoiGian` và lịch sử `PracticeHistoryResponse.thoiGian` (int, ms).
- **Vị trí và cách sửa:**

| File:dòng | Hiện trạng | Sửa thành |
|---|---|---|
| `(app)/luyen-tap-lam-bai/page.js:155` | `thoiGianMs: now() - startRef.current` | `thoiGian: now() - startRef.current` |
| `(app)/luyen-tap-ket-qua/page.js:173` | `A.thoiGianMs` (2 chỗ) | `A.thoiGian` |
| `(app)/luyen-tap-lich-su/page.js:100` | `item.thoiGianMs` (2 chỗ) | `item.thoiGian` |
| `src/app/api/v1/practice/[...slug]/route.js:124,275,307` | mock trả `thoiGianMs` | `thoiGian` (hoặc xóa mock theo FE-13) |
| `src/app/api/v1/statistics/overview/route.js:55` | `a.thoiGianMs` | `a.thoiGian` (hoặc xóa mock) |

- **Lưu ý:** gửi `thoiGianMs` thì BE trả 400 `VALIDATION_FAILED` ("Thiếu thời gian làm bài"), nên hiện tại **không nộp được bài** trên BE thật.
- **Kiểm chứng:** nộp bài trả 201; UI25 và UI26 hiện "Xp Ys" đúng, không còn `NaN`.

### FE-07 · P0 · Thống kê dùng `phutMoiNgay`

- **File:** `(app)/thong-ke/page.js:98`, `:100`, `:113`, `:121`, `:165`
- **Hợp đồng BE:** `StatisticsOverviewResponse` (`k28/stats/dto/StatisticsOverviewResponse.java`): `muiGio, tuNgay, denNgay, boTheId, soTuDaHoc, soLuotOn, tyLeNho, baiLuyen, tongPhut, phutMoiNgay, soNgayCoHoc, soNgayDatMucTieu, chuoiNgay, theoNgay[]`; `theoNgay[]` = `{ngay, soLuotOn, soCauLuyen, thoiGian, soPhut}`.
- **Hiện trạng:** `overview.mucTieuPhutNgay` (5 chỗ) → luôn `undefined`, đường mục tiêu bằng 0, không ngày nào "đạt mục tiêu".
- **Cách sửa:** thay toàn bộ `overview.mucTieuPhutNgay` bằng `overview.phutMoiNgay`. Nên dùng `soNgayDatMucTieu` của BE thay vì tự so `soPhut >= mục tiêu` (BE so theo `thoiGian` ms, tránh lệch do làm tròn phút).
- **Kiểm chứng:** với người học có `phutMoiNgay = 10`, nhãn "Mục tiêu 10p" hiện đúng; số ngày đạt mục tiêu khớp `soNgayDatMucTieu`.

### FE-08 · P0 · Sổ tay: field cặp nhầm

- **File:** `(app)/so-tay/page.js:30` (`MIX`), `:307-308`
- **Hợp đồng BE:** `ConfusingPairResponse` (`k28/practice/dto/ConfusingPairResponse.java`): `{id, the1, the2, soLanNham, lanCuoiAt}`; `the1/the2` = `{id, tu, tuLoai, phienAm, nghiaVi, viDuEn}`. **Không có** `loaiNham`.
- **Hiện trạng:**
  ```jsx
  <strong>{MIX[pr.loaiNham] || 'Dễ nhầm'}</strong>
  <span>Nhầm {pr.soLan} lần</span>
  ```
  → hiện "Nhầm undefined lần".
- **Cách sửa:** giống mockup `mockups/dot2/so-tay.html:231`:
  - `<strong>Dễ nhầm</strong>`, xóa hằng `MIX`.
  - `Nhầm {pr.soLanNham} lần`.
  - Thêm ngày gần nhất nếu có: `pr.lanCuoiAt` định dạng theo múi giờ người học.
- **Không sửa:** `:193` `g.soLan` là đúng (`NhomLoiCountResponse{nhomLoi, soLan}`).
- **Kiểm chứng:** sau một bài `PHAN_BIET_CAP_NHAM` sai, UI27 hiện "Nhầm 1 lần" và ngày.

### FE-09 · P1 · UI22 "Cứu lịch ôn" trên UI12

- **File:** `(app)/hom-nay/page.js`, `(app)/hoc/page.js:30-34`
- **Hợp đồng BE** (bàn giao §5.6):
  - `GET /api/v1/learning/today?phut={1..240}&giuTuMoi={true|false}`: tham số tùy chọn, dạng chuỗi.
  - `cuuLichOn` (null khi không quá ngưỡng) = `{soTheCanOn, soQuaHan, phutMoiNgay, luotMoiNgay, soNgay, keHoach[{ngay, soThe, phut}], tamDungTuMoi}`; `keHoach` tối đa 14 ngày.
  - `POST /api/v1/learning/sessions` thêm `cheDo: "THUONG" | "CUU_LICH"`.
- **Hiện trạng:** không trang nào đọc `cuuLichOn`, gửi `phut`, `giuTuMoi` hoặc `cheDo`.
- **Cách sửa (theo `mockups/dot2/hom-nay.html:242-290, 411`):**
  1. Khi `plan.cuuLichOn != null`, hiện khối: "Có {soTheCanOn} thẻ cần ôn ({soQuaHan} quá hạn); hôm nay bạn có X phút", ô chọn phút (gửi lại `phut`), công tắc "Giữ từ mới" (`giuTuMoi`), danh sách `keHoach` theo ngày, ghi rõ "ước tính".
  2. Nút "Bắt đầu cứu lịch" gọi `POST /learning/sessions` với `{chieuHoc, quyThoiGian, cheDo: tamDungTuMoi ? 'CUU_LICH' : 'THUONG'}`.
  3. `queryKey` của `/learning/today` phải chứa `phut`, `giuTuMoi`.
  4. Lỗi 400 (`phut` ngoài 1–240) hiện `fieldErrors`.
- **Kiểm chứng:** người học có nhiều thẻ quá hạn thấy khối; đổi phút làm `keHoach` đổi; phiên tạo ra có `cheDo = CUU_LICH`.

### FE-10 · P1 · Khối bảng điều khiển B2.12 trên UI12

- **File:** `(app)/hom-nay/page.js`
- **Hợp đồng BE** (bàn giao §5.7, §5.11):
  - `phienDangDo` = `{id, boTheId, boTheTen, chieuHoc, quyThoiGian, batDauAt, hetGioAt, soDaTraLoi, soChuaTraLoi}` hoặc null.
  - `duBaoOn[]` = `{ngay, soCanOn}` (7 ngày địa phương).
  - `daHocHomNay` = `{soLuot, thoiGian (ms), soPhut}`.
  - Hoạt động 7 ngày: `GET /api/v1/statistics/overview` (mặc định 7 ngày đến hôm nay), đọc `theoNgay[]`.
- **Cách sửa:**
  1. Khối "Tiếp tục phiên đang dở": `soChuaTraLoi > 0` → nút "Tiếp tục" mở `/hoc-phien?id={id}`; `soChuaTraLoi = 0` → nút "Xem tổng kết" mở `/hoc-tong-ket?id={id}`.
  2. Khối "Hoạt động 7 ngày": cột theo `theoNgay[].soPhut`, đường mục tiêu `phutMoiNgay`.
  3. Khối "Dự báo ôn 7 ngày tới": từ `duBaoOn`.
  4. Số phút hôm nay lấy `daHocHomNay.soPhut`, phải khớp UI35 (TC-09).
- **Kiểm chứng:** bỏ dở phiên → về `/hom-nay` thấy khối tiếp tục; phút hôm nay trên UI12 bằng ngày hôm nay trên UI35.

### FE-11 · P1 · Logo về `/hom-nay`

- **File:** `frontend/src/components/layout/AppShell.js:12`
- **Hiện trạng:** `const HOME = '/bo-the';`
- **Cách sửa:** `const HOME = '/hom-nay';` (SPRINT_PLAN §3 B2.12: "trang chủ sau đăng nhập và logo chuyển về `/hom-nay`"; TK §6.1 bước 6). Kiểm cả chuyển hướng sau đăng nhập (`/dang-nhap` → `next` mặc định).
- **Kiểm chứng:** đăng nhập xong vào `/hom-nay`; bấm logo về `/hom-nay`.

### FE-12 · P1 · Đối chiếu mockup, responsive, trạng thái

Với từng cặp, so bố cục, nhãn, thứ tự khối; kiểm 360px; kiểm đủ tải/rỗng/lỗi (TK §9.8):

| UI | Trang FE | Mockup | Điểm cần kiểm thêm |
|---|---|---|---|
| UI12 | `(app)/hom-nay/page.js` | `mockups/dot2/hom-nay.html` | FE-09, FE-10 |
| UI18 | `(app)/hoc/page.js` | `mockups/dot2/hoc.html` | Lỗi 422 `BUSINESS_RULE` khi hàng đợi rỗng |
| UI19 | `(app)/hoc-phien/page.js` | `mockups/dot2/hoc-phien.html` | Phím 1–4/Space không chạy khi đang gõ; `clientEventId` sinh một lần/lượt; hàng đợi chưa đồng bộ khi mất mạng; 409 tải lại phiên |
| UI20 | `(app)/hoc-tong-ket/page.js` | `mockups/dot2/hoc-tong-ket.html` | FE-14 |
| UI21 | `(app)/bo-the/[id]/tien-do/page.js` | `mockups/dot2/bo-the-tien-do.html` | Xác nhận trước tạm ngưng/đặt lại |
| UI23 | `(app)/luyen-tap/page.js` | `mockups/dot2/luyen-tap.html` | `:40` `.catch(() => ({items: []}))` nuốt lỗi lịch sử, nên hiện lỗi |
| UI24 | `(app)/luyen-tap-lam-bai/page.js` | `mockups/dot2/luyen-tap-lam-bai.html` | FE-05, FE-06; đủ 8 dạng bài |
| UI25 | `(app)/luyen-tap-ket-qua/page.js` | `mockups/dot2/luyen-tap-ket-qua.html` | FE-06; luyện lại câu sai |
| UI26 | `(app)/luyen-tap-lich-su/page.js` | `mockups/dot2/luyen-tap-lich-su.html` | `:29` không lấy `error`, thiếu trạng thái lỗi |
| UI27 | `(app)/so-tay/page.js` | `mockups/dot2/so-tay.html` | FE-08 |
| UI35 | `(app)/thong-ke/page.js` | `mockups/dot2/thong-ke.html` | FE-07; "Chưa đủ dữ liệu" khi `tyLeNho = null` |
| UI47 | `(app)/quan-tri/tai-khoan/page.js` | `mockups/dot2/quan-tri-tai-khoan.html` | `:39` không lấy `error`; lý do khóa bắt buộc |
| UI49 | `(app)/quan-tri/bo-mau/page.js` | `mockups/dot2/quan-tri-bo-mau.html` | FE-03, FE-04, FE-16 |
| UI53 | `(app)/quan-tri/nhat-ky/page.js` | `mockups/dot2/quan-tri-nhat-ky.html` | `:42` không lấy `error`; khoảng ngày ngược → 400 |

Xong khi: mỗi trang chạy với BE thật, giống mockup, đủ 3 trạng thái, không tràn ngang ở 360px. Sau đó tick F2.x trong `roadmap/TienDoDuKien_fronend.md` kèm "Đã làm".

### FE-13 · P1 · Xóa mock route Next.js Đợt 2

- **File:** `frontend/src/app/api/v1/{practice/[...slug],notebook,notebook/[id],learning/confusing-pairs,statistics/overview,statistics/skills}/route.js`, `frontend/src/app/api/v1/_mock/*`, `frontend/next.config.mjs:5-14` (2 rewrite riêng cho `practice`, `notebook/:id`), `frontend/src/lib/dot2-mock.mjs`, `frontend/tests/dot2-mock.test.mjs`
- **Lý do:** BE đã có đủ 34 route Đợt 2; mock giữ field cũ (`thoiGianMs`…) và che lỗi tích hợp.
- **Cách sửa:** sau khi VER-03 qua, xóa các route trên và 2 rewrite riêng, để rewrite `/api/:path*` → BE xử lý tất cả. Xóa banner trong `FeatureGate`.
- **Kiểm chứng:** `npm run build` qua; mọi request `/api/v1/*` trong Network đi tới cổng 8080.

### FE-14 · P2 · `finish` không nằm trong `useQuery`

- **File:** `(app)/hoc-tong-ket/page.js:37-43`
- **Hiện trạng:** `useQuery({ queryFn: () => apiFetch(`.../finish`, { method: 'POST' }), enabled: ended, staleTime: Infinity, retry: false })`. BE trả cùng tổng kết khi gọi lại (B2.5), nên không sai dữ liệu, nhưng query mang tác dụng ghi.
- **Cách sửa:** dùng `finishMutation` đã có ở `:51-58`, gọi một lần trong `useEffect` khi `ended && !summary`; hoặc giữ nguyên và ghi rõ lý do trong README FE.

### FE-15 · P2 · Test FE cho Đợt 2

- **Hiện trạng:** `frontend/tests/` chỉ có `dot2-mock.test.mjs` liên quan Đợt 2.
- **Cách sửa:** thêm test hợp đồng cho `practice-labels.mjs` và hàm map field (`thoiGian`, `phutMoiNgay`, `soLanNham`); nếu có thời gian, thêm Playwright cho luồng demo (VER-03).

### FE-16 · P2 · UI49 bỏ `alert`/`prompt`/`confirm`

- **File:** `(app)/quan-tri/bo-mau/page.js:123`, `:216`, `:224-231`, `:272`
- **Cách sửa:** dùng hộp thoại và thông báo của UI kit (`@/components/ui`) như mockup `quan-tri-bo-mau.html` (`VL.toast`, form lý do 10–500 ký tự có `fieldErrors`).

### FE-17 · P2 · Sửa `frontend/README.md`

- **File:** `frontend/README.md:105-107` mục "Trang chờ backend"
- **Hiện trạng:** ghi phiên học, luyện tập, sổ tay, thống kê, quản trị "gọi endpoint backend chưa tồn tại", "chưa gửi `cheDo`".
- **Cách sửa:** ghi B2.1–B2.12 đã có (bàn giao Đợt 2 §1); bỏ hướng dẫn `FUTURE` sau FE-01; mô tả biến `NEXT_PUBLIC_DOT2_MOCK` sau FE-02 (hoặc xóa sau FE-13).

---

## 4. Backend

### BE-01 · P0 · Âm thanh câu nghe viết — ✅ xong 06/11/2026 (phương án B)

- **Vấn đề:** `deBai` của `NGHE_VIET` chỉ có `{amTuId, tuLoai}`; FE không có `theId`/`boTheId` để gọi `GET /decks/{boTheId}/cards/{theId}/files/AM_TU`.
- **Phương án A bị bỏ:** thêm `theId`/`boTheId` vào `deBai` làm fail `FR07PracticeSessionTest` (kiểm response bài luyện không chứa `theId`) và cho phép tra đáp án qua `GET /decks/.../cards/{theId}`. Đã hoàn tác.
- **Đã làm (B):** `GET /api/v1/practice/sessions/{id}/questions/{cauHoiId}/audio`.
  - `k28/practice/repository/CauHoiBaiLuyenRepository.java`: `findByIdAndBaiId`.
  - `k28/practice/service/PracticeService.java`: `audio(userId, id, questionId)` kiểm chủ bài → câu thuộc bài → `NGHE_VIET` có `amTuId` → `FileService.get` (chủ tệp, chưa `DA_XOA`, đã hoàn tất). Không mở transaction (`FileService` là `Propagation.NEVER`).
  - `k28/practice/controller/PracticeController.java`: route mới.
  - Test `FR07PracticeSessionTest.fr07_listeningAudioIsServedPerQuestionWithoutRevealingCard`: 200 có `downloadUrl`, người khác 404, câu không phải nghe viết 404, câu bài khác 404, tệp `DA_XOA` 404.
  - Mockup: `mockups/shared/demo.js` thêm route; `mockups/dot2/luyen-tap-lam-bai.html` gọi API khi bấm Nghe.
  - Tài liệu: bàn giao §5.8, §1, §10, §10a RS-060; flow B2.7; roadmap BE B2.7; SPRINT_PLAN dòng B2.7.
- **Kiểm chứng:** `FR07*`, `FR08*`, `PracticeGeneratorTest`, `PracticeGraderTest`, `AnswerNormalizerTest` 31/31 pass; `./mvnw -B test` 404/404 pass; mockup mở trên trình duyệt, nút Nghe/Nghe chậm gọi đúng API, console không lỗi. **Chưa:** HTTP thật.

### BE-02 · P1 · Postman thống kê thêm ca lỗi

- **Collection:** "VocabLearning API" › "06 Tương tác & thống kê" (hiện 2 request).
- **Thêm:**
  - `Thống kê ngày tương lai → 400 (B2.10)`: `denNgay` = ngày mai.
  - `Thống kê khoảng ngày ngược → 400 (B2.10)`: `tuNgay > denNgay`.
  - `Thống kê quá 90 ngày → 400 (B2.10)`.
  - `Thống kê bộ người khác → 404 (B2.10)`: `boTheId` của người khác.
  - `Thống kê chưa đăng nhập → 401 (B2.10)`.
- **Cách làm:** `/postman-sync B2.10`.

### BE-03 · P1 · Mô tả collection Postman

- **Hiện trạng:** mô tả collection ghi "Hợp đồng chi tiết: `report/GD0_BAO_CAO_FE.md`" (file không tồn tại trong checkout).
- **Cách sửa:** trỏ tới `ban-giao-cho fe/SPRINT_1_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` (hợp đồng chung) và `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` (Đợt 2). Khai báo sẵn trong environment Local các biến `targetUserId`, `sampleDeckId`, `sampleDeckVersion`, `sampleCardId`, `sampleCardVersion` (bàn giao §10 ghi "chưa khai báo sẵn").

### BE-04 · P2 · Lọc thống kê theo chủ đề

- **File:** `k28/stats/dto/OverviewQuery.java`, `SkillsQuery.java`, service thống kê
- **Hiện trạng:** bàn giao §10 B2.10: "lọc theo chủ đề (TK §10 UI35) chưa có".
- **Cách sửa:** thêm query `chuDeId` (chuỗi số, `@Pattern`), lọc thẻ theo chủ đề của bộ; test trong `FR11StatisticsTest`; cập nhật §5.11, Postman, mockup `thong-ke.html`. Có thể dời sang Đợt 3 nếu GVHD đồng ý (câu hỏi mở 3).

### Nợ đã biết, ngoài phạm vi Đợt 2

- `PasswordService` (B1.3) vẫn hủy phiên trong transaction (bàn giao §10 B2.11). Ghi vào backlog Đợt 3.
- Hai test lỗi nền đã ghi ngày 28/10 (`IntegrationSetupTest.xsrfHelperPassesCsrfFilter` 405≠404, `FR05CsvTest.tc04_*` 415≠400): kiểm lại trong bộ 403/403 ngày 03/11; nếu đã pass thì ghi rõ ở bàn giao §10.

---

## 5. Kiểm chứng sau khi sửa

### VER-02 · P1 · Chạy Postman Đợt 2 trên HTTP thật

- **Sau:** VER-01, BE-01, BE-02.
- **Cách làm:** chạy theo thứ tự các thư mục "03 Học tập" (28), "04 Luyện tập" (14), "06 Tương tác & thống kê", "07 Quản trị" (phần B2.11, cần tài khoản Admin) với environment "VocabLearning - Local (8080)".
- **Lưu bằng chứng:** file kết quả runner vào `report/evidence/` (cùng thư mục với `FE-B0-B1.11-verification-20261010.json`), tên dạng `BE-B2-postman-2026110x.json`.
- **Cập nhật:** bàn giao Đợt 2 dòng "Trạng thái BE" và §10: bỏ "chưa gọi HTTP thật", ghi số request pass/fail; chụp 1–2 response thật thay JSON mẫu ở §5.

### VER-03 · P1 · Demo đầu-cuối Đợt 2

Theo SPRINT_PLAN §3 S6 "Demo Đợt 2", chạy trên BE thật + Next.js, `NEXT_PUBLIC_DOT2_MOCK=disabled`:

1. Đăng nhập User → vào `/hom-nay` (FE-11), thấy kế hoạch và khối 7 ngày (FE-10).
2. Ôn hai chiều một thẻ (TC-05) → `/hoc-tong-ket`.
3. Luyện nghe viết, sai một từ (FE-05, FE-06) → UI25 có giải thích.
4. `/so-tay` thấy từ vừa sai (FE-08).
5. `/thong-ke`: phút hôm nay khớp UI12 (TC-09, FE-07).
6. Đăng nhập Admin → `/quan-tri/tai-khoan` khóa tài khoản có lý do (FE-01) → `/quan-tri/nhat-ky` thấy dòng nhật ký (TC-17).
7. `/quan-tri/bo-mau`: thêm, sửa, xóa thẻ mẫu, xuất bản bộ (FE-03, FE-04).

Ghi kết quả từng bước (pass/fail, ảnh chụp) vào phần "Đã làm" của các bước F2.x và bàn giao §10.

---

## 6. Tài liệu

| Mã | Ưu tiên | File:dòng | Hiện trạng | Sửa thành |
|---|---|---|---|---|
| DOC-01 | P1 | `roadmap/SPRINT_PLAN.md:102` | UI19 `/hoc/[sessionId]` | UI19 `/hoc-phien?id=` (khớp §5 dòng 218) |
| DOC-02 | P1 | `roadmap/SPRINT_PLAN.md:115` | UI24 `/luyen-tap/[id]` | UI24 `/luyen-tap-lam-bai?id=` (khớp §5 dòng 224) |
| DOC-03 | P1 | `roadmap/SPRINT_PLAN.md:106` | "B2.1 chưa được đánh dấu hoàn tất" | "B2.1 đã hoàn tất (roadmap BE `[x]`, `SM2-VN-2` từ 03/11/2026)" |
| DOC-04 | P1 | `roadmap/SPRINT_PLAN.md:108` | "Bàn giao Đợt 2: chưa tìm thấy báo cáo riêng" | Trỏ `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` |
| DOC-05 | P2 | `roadmap/SPRINT_PLAN.md:15` | Bảng tổng quan dùng "S2" cho GĐ0, dễ nhầm với "Đợt 2" | Thêm ghi chú dưới bảng: "Đợt 2 = S5–S6; S2 thuộc GĐ0" |
| DOC-06 | P1 | `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md:248`, `:256` | UI19 `/hoc/[sessionId]` | `/hoc-phien?id=` |
| DOC-07 | P1 | Bàn giao Đợt 2 §1 dòng B2.5 (`:33`) | UI20 `/hoc/[sessionId]/tong-ket` | `/hoc-tong-ket?id=` |
| DOC-08 | P1 | `docs/luong-backend/B2.4-ghi-ket-qua-on.md:3`, `docs/luong-backend/B2.5-ket-thuc-phien-lich-su-tien-do.md:3` | `/hoc/[sessionId]`, `/hoc/[sessionId]/tong-ket` | `/hoc-phien?id=`, `/hoc-tong-ket?id=` |
| DOC-09 | P1 | Bàn giao Đợt 2 §10: dòng Postman (`:846`), dòng "FE `/hom-nay` hiện tại" (`:886`), §10a RS-066 (`:896`) | Postman "chưa đối chiếu vì MCP chưa xác thực"; lỗi điều kiện `tongSoThe` (FE đã sửa); RS-066 mô tả trạng thái cũ | Postman: số đếm ngày 06/11 (03: 28, 04: 14, 06: 2, 07: 22 cho B2.11); `/hom-nay`: ghi "đã sửa, còn FE-09/FE-10/FE-11"; RS-066: "đã có `proxyOrMock`, còn mock dự phòng → FE-02/FE-13". Thêm vào §10a các mục FE-01, FE-03, FE-04, FE-06, FE-07 |
| DOC-10 | P1 | `roadmap/TienDoDuKien_fronend.md:150`, `:172` | "không `cheDo` đến B2.6"; "nhận `report/DOT2_BAO_CAO_FE.md`" | Bỏ câu `cheDo` (B2.6 đã có, xem FE-09); trỏ `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` |
| DOC-11 | P1 | Bàn giao Đợt 2 §5.8, §10a RS-060 | Hướng dẫn tải âm qua `/decks/{boTheId}/cards/{theId}/files/AM_TU` nhưng `deBai` không có `theId` | ✅ Đã cập nhật 06/11/2026 theo BE-01 (API `.../questions/{cauHoiId}/audio`) |
| DOC-12 | P2 | `docs/BAO_CAO_RA_SOAT_DOT2.md` | Chưa ghi FE-01 (cổng chặn) | Thêm FE-01 vào mục 3 và mục 4 sau khi sửa xong |

Ràng buộc khi sửa tài liệu: không tick roadmap khi chưa có bằng chứng; không tạo báo cáo tiến độ BE song song; trạng thái BE chỉ ghi bằng tick + "Đã làm" trong `roadmap/TienDoDuKien_backend.md`.

---

## 7. Điều kiện đóng Đợt 2

- [ ] VER-01: stack chạy, `ping` 200.
- [ ] FE-01 … FE-08, BE-01: sửa xong, kiểm trên BE thật.
- [ ] FE-09, FE-10, FE-11: UI12 đủ khối theo TK §9.1.
- [ ] VER-02: Postman Đợt 2 chạy, có file bằng chứng trong `report/evidence/`.
- [ ] VER-03: 7 bước demo pass.
- [ ] FE-12: 14 trang khớp mockup, đủ tải/rỗng/lỗi, 360px; tick F2.1–F2.8 kèm "Đã làm".
- [ ] DOC-01 … DOC-11: tài liệu khớp code.

## 8. Câu hỏi cần chốt

1. ~~BE-01 chọn phương án A hay B?~~ Đã chốt B (06/11/2026), xem BE-01.
2. BE-04 (lọc theo chủ đề UI35) làm trong Đợt 2 hay dời Đợt 3?
3. FE-13: xóa hẳn mock Đợt 2, hay giữ cho demo ngoại tuyến (bật bằng `NEXT_PUBLIC_DOT2_MOCK=enabled`)?
