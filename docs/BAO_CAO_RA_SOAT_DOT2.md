# Báo cáo rà soát Đợt 2 (BE + FE)

| Mục | Giá trị |
|---|---|
| Ngày rà soát | 06/11/2026 |
| Phạm vi | Đợt 2 = S5 + S6 trong `roadmap/SPRINT_PLAN.md`: B2.1–B2.12, F2.1–F2.8. Sprint **S2** trong SPRINT_PLAN là GĐ0 (B0.6–B0.8, F0.4–F0.6), không thuộc báo cáo này |
| Cách làm | Chỉ đọc mã và tài liệu; không chạy lại test, không gọi HTTP thật. Số test lấy từ `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` (403/403 ngày 03/11/2026). Postman đọc trực tiếp collection "VocabLearning API" |
| Nguồn | `roadmap/SPRINT_PLAN.md`, `roadmap/TienDoDuKien_backend.md`, `roadmap/TienDoDuKien_fronend.md`, báo cáo bàn giao Đợt 2 (bản working tree), `docs/luong-backend/B2.*.md`, TK §19, `backend/k28/src`, `frontend/src`, `mockups/dot2/` |

Ký hiệu: ✅ hoàn thành · 🟡 chưa hoàn thiện · ❌ chưa làm · ⚠️ lệch tài liệu ↔ code.

## 1. Tổng quan

| | ✅ / tổng | % |
|---|---|---|
| BE | 11/12 | 92% |
| FE | 0/8 | 0% (8 trang có code, chưa bước nào đủ tiêu chí ✅; roadmap FE chưa tick bước nào) |

**3 rủi ro lớn nhất**
1. **Chưa từng chạy HTTP thật.** BE chỉ kiểm bằng MockMvc. Ngày 04/11 stack Docker lỗi (`vocab-api-1` khởi động lại liên tục vì `UnknownHostException: mysql`). Hạn demo Đợt 2 là 08/11.
2. **FE lệch hợp đồng, làm hỏng chức năng:** danh sách và thêm thẻ mẫu, âm thanh nghe viết, mục tiêu phút ở thống kê, số lần nhầm ở sổ tay, `thoiGian` của bài luyện.
3. **Mock tự thay BE mà không báo:** ở chế độ dev, `proxyOrMock` (`frontend/src/app/api/v1/_mock/backend.js:52`) trả dữ liệu giả khi BE trả 404/405/502/503. Lỗi tích hợp vì vậy bị che, demo có thể đang chạy trên dữ liệu giả.

## 2. Bảng BE

Chứng cứ chung: controller trong `backend/k28/src/main/java/com/do_an_tot_nghiep/k28/{learning,practice,stats,admin}/controller/`, đủ 33 route khớp mục 5 của báo cáo bàn giao; luồng từng bước ở `docs/luong-backend/B2.*.md`.

| Bước | Endpoint | FR/TC | TT | Thiếu gì | File chứng cứ |
|---|---|---|---|---|---|
| B2.1 | SRS calculator (không API) | FR-06 · TC-06, 07 | ✅ | Không | `FR06SrsCalculatorTest` (tc06_*, tc07_*), `V8__learning.sql` |
| B2.2 | `GET /learning/today` | FR-06 · TC-09 | ✅ | Chưa HTTP thật | `LearningController`, `FR06TodayPlanTest` (tc09_*) |
| B2.3 | `POST /learning/sessions`, `GET /learning/sessions/{id}` | FR-06 | ✅ | Chưa HTTP thật | `FR06StudySessionTest` (8 test), `V9__phien_hoc_bo_the.sql` |
| B2.4 | `POST /learning/sessions/{id}/reviews` | TC-05, 08, 09 | ✅ | Chưa HTTP thật | `FR06ReviewTest` (tc05, tc08 hai tab/đồng thời) |
| B2.5 | finish, history, `/decks/{id}/progress`, suspend, reset | FR-06 | ✅ | Chưa HTTP thật | `ProgressController`, `FR06FinishHistoryTest`, `FR06ProgressTest` |
| B2.6 | `cuuLichOn`, `phut`, `giuTuMoi`, `cheDo` | TC-10 | ✅ | Chưa HTTP thật | `FR06RescuePlanTest`, `RescuePlanTest`, `V10__phien_hoc_che_do.sql` |
| B2.7 | `POST/GET /practice/sessions` | FR-07 · TC-11 | ✅ | Chưa HTTP thật | `PracticeController`, `FR07PracticeSessionTest`, `V11__practice.sql` |
| B2.8 | submissions, history, `mistakes/retry` | TC-11 | ✅ | Chưa HTTP thật | `FR07SubmissionTest` (tc11 chấm theo bản chụp đề), `PracticeGraderTest` |
| B2.9 | `/notebook` (GET/PUT/DELETE), `/learning/confusing-pairs` | FR-08 | ✅ | TK không có TC riêng cho FR-08 | `NotebookController`, `FR08NotebookTest`, `V13__so_tay_an_tu.sql` |
| B2.10 | `/statistics/overview`, `/statistics/skills` | FR-11 · TC-09 | 🟡 | Chưa lọc theo chủ đề (TK §10 UI35); Postman chỉ có 2 request, không có ca lỗi | `StatisticsController`, `FR11StatisticsTest` |
| B2.11 | 13 API `/admin/*` | FR-13 · TC-17 | ✅ | Chưa HTTP thật | `@PreAuthorize("hasRole('ADMIN')")` + `SecurityConfig:57`, `FR13AdminTest` (tc17 ×3), `V14__admin.sql` |
| B2.12 | `phienDangDo`, `duBaoOn`, `daHocHomNay.thoiGian` | TC-09 | ✅ | Chưa HTTP thật | `FR06DashboardTest` (tc09_forecast*) |

Postman (đếm trực tiếp trong collection): "03 Học tập" 28 request, "04 Luyện tập" 14, "06 Tương tác & thống kê" 2, "07 Quản trị" 22 request cho B2.11. Tất cả **chưa chạy**.

## 3. Bảng FE

Mockup: cả 14 file trong `mockups/dot2/` đều có. Trang FE nằm ở `frontend/src/app/(app)/...`.

| Bước | Màn hình | TT | Thiếu gì | File chứng cứ |
|---|---|---|---|---|
| F2.1 | UI12 `/hom-nay` | 🟡 | Không đọc `phienDangDo`, `duBaoOn`, khối 7 ngày (`/statistics/overview`); `AppShell.js:12` có `HOME='/bo-the'` | `hom-nay/page.js` |
| F2.2 | UI18 `/hoc`, UI19 `/hoc-phien` | 🟡 | Chưa xác minh khớp mockup, hàng đợi offline và `clientEventId`; chưa chạy với BE thật | `hoc/page.js`, `hoc-phien/page.js` |
| F2.3 | UI20 `/hoc-tong-ket`, UI21 `/bo-the/[id]/tien-do` | 🟡 | `useQuery` gọi `POST .../finish`: ghi dữ liệu bên trong một query, gọi lại mỗi lần refetch | `hoc-tong-ket/page.js:37-39` |
| F2.4 | UI22 cứu lịch ôn | ❌ | Không dùng `cuuLichOn`, `phut`, `giuTuMoi`, `cheDo` ở trang nào | `hom-nay/page.js`, `hoc/page.js` |
| F2.5 | UI23–UI26 luyện tập | 🟡 | RS-060: đọc `deBai.amThanhUrl`; dùng `thoiGianMs` thay cho `thoiGian`; còn mock dự phòng | `luyen-tap-lam-bai/page.js:155,211`, `luyen-tap-ket-qua/page.js:173`, `luyen-tap-lich-su/page.js:100` |
| F2.6 | UI27 `/so-tay` | 🟡 | RS-067: đọc `pr.loaiNham`, `pr.soLan`; còn mock dự phòng | `so-tay/page.js:307-308` |
| F2.7 | UI35 `/thong-ke` | 🟡 | Đọc `mucTieuPhutNgay` trong khi BE trả `phutMoiNgay`, nên đường mục tiêu luôn bằng 0 | `thong-ke/page.js:98-165` |
| F2.8 | UI47, UI49, UI53 quản trị | 🟡 | UI49: `GET /admin/cards?boTheId` và `POST /admin/cards` đều không có ở BE, nên không xem và không thêm được thẻ mẫu | `quan-tri/bo-mau/page.js:119,204` |

Test FE: chỉ có `frontend/tests/dot2-mock.test.mjs`, không có test nào cho các trang Đợt 2.

## 4. Lệch hợp đồng và lệch tài liệu

### 4.1 BE ↔ FE

| # | FE | BE | Hậu quả |
|---|---|---|---|
| 1 | `GET /admin/cards?boTheId`, `POST /admin/cards` | `GET/POST /admin/decks/{id}/cards` | Lỗi 405, UI49 hỏng |
| 2 | `deBai.amThanhUrl` | `deBai.amTuId` | Câu nghe viết không có âm thanh |
| 3 | `mucTieuPhutNgay` | `phutMoiNgay` | Mục tiêu hiện 0 |
| 4 | `loaiNham`, `soLan` | `soLanNham`, `lanCuoiAt` | Hiện "undefined lần" |
| 5 | `thoiGianMs` (gửi lên và đọc ra) | `thoiGian` | Thời gian luôn 0 hoặc NaN |
| 6 | Không dùng | `cuuLichOn`, `phienDangDo`, `duBaoOn`, `cheDo` | B2.6 và B2.12 không có giao diện |

### 4.2 Lệch tài liệu (⚠️)

- Route trong `SPRINT_PLAN.md` không thống nhất: §3 ghi UI19 `/hoc/[sessionId]`, UI24 `/luyen-tap/[id]`; §5 và FE dùng `/hoc-phien?id=`, `/luyen-tap-lam-bai`. Báo cáo bàn giao §1 ghi UI20 `/hoc/[sessionId]/tong-ket`, FE dùng `/hoc-tong-ket`.
- `SPRINT_PLAN.md:106` ghi "B2.1 chưa được đánh dấu hoàn tất", nhưng roadmap BE đã tick `[x]`. Dòng `:108` ghi "chưa tìm thấy báo cáo bàn giao Đợt 2", nhưng file SPRINT_2 đã có.
- Roadmap FE F2.8 ghi sẽ nhận `report/DOT2_BAO_CAO_FE.md`, thực tế là `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md`. Roadmap FE F2.2 ghi "không `cheDo` đến B2.6", nay đã cũ.
- Báo cáo bàn giao §10, dòng "FE `/hom-nay` hiện tại (đọc 28/10)", ghi lỗi điều kiện `tongSoThe`; lỗi này FE đã sửa. RS-066 đã được sửa một phần (có `proxyOrMock`), nhưng mock dự phòng vẫn còn.
- Báo cáo bàn giao ghi Postman "chưa đối chiếu vì MCP chưa xác thực"; nay đã đối chiếu được (số liệu ở mục 2). Mô tả collection vẫn trỏ tới `report/GD0_BAO_CAO_FE.md`.

## 5. Việc cần làm tiếp

| Ưu tiên | Việc | Bên làm | File | Cỡ |
|---|---|---|---|---|
| P0 | Sửa stack Docker, chạy Postman Đợt 2 trên HTTP thật | BE | `backend/k28/docker-compose*`, collection | Vừa |
| P0 | UI49 đổi sang `/admin/decks/{id}/cards` | FE | `quan-tri/bo-mau/page.js` | Nhỏ |
| P0 | Sửa tên field (lệch #2–#5) | FE | `luyen-tap-*`, `so-tay`, `thong-ke` | Nhỏ |
| P0 | Tắt mock khi demo (`NEXT_PUBLIC_DOT2_MOCK=disabled`) | FE | `.env`, `lib/dot2-mock.mjs` | Nhỏ |
| P1 | Làm UI22 cứu lịch ôn và các khối B2.12 trên UI12; logo về `/hom-nay` | FE | `hom-nay/page.js`, `hoc/page.js`, `AppShell.js` | Vừa |
| P1 | Chuyển `finish` từ `useQuery` sang `useMutation` | FE | `hoc-tong-ket/page.js` | Nhỏ |
| P1 | Đối chiếu từng trang với mockup, kiểm 360px và các trạng thái tải/rỗng/lỗi, rồi tick F2.x | FE | `mockups/dot2/*`, `roadmap/TienDoDuKien_fronend.md` | Lớn |
| P1 | Thêm ca lỗi Postman cho thống kê; sửa mô tả collection | BE | Postman "06 Tương tác & thống kê" | Nhỏ |
| P2 | Sửa các chỗ lệch tài liệu ở mục 4.2 | BE | `roadmap/SPRINT_PLAN.md`, bàn giao §1 và §10 | Nhỏ |
| P2 | Lọc theo chủ đề cho UI35 | BE | `stats/` | Vừa |
| P2 | Viết test cho các trang FE Đợt 2 | FE | `frontend/tests/` | Vừa |

## 6. Câu hỏi còn mở

- Có giữ cách gọi "Đợt 2 = S5+S6" không, hay đổi tên S2 trong `SPRINT_PLAN` để tránh nhầm?
- Có chấp nhận ✅ cho bước BE khi mới kiểm bằng MockMvc không, hay bắt buộc chạy HTTP thật?
- UI35 cần lọc theo chủ đề ngay trong Đợt 2 hay để sang Đợt 3?
