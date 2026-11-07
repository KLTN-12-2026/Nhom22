# Báo cáo rà soát Đợt 2 (BE + FE) — lần 2

| Mục | Giá trị |
|---|---|
| Ngày rà soát | 07/11/2026 (lần 2; lần 1 ngày 06/11/2026) |
| Phạm vi | Đợt 2 = S5 + S6 trong `roadmap/SPRINT_PLAN.md`: B2.1–B2.12, F2.1–F2.8. Sprint **S2** trong SPRINT_PLAN là GĐ0, không thuộc báo cáo này |
| Cách làm | Đọc mã tại `a4e6708` (nhánh `huynh_gia_pho_be` = `origin/main`), đối chiếu `docs/KE_HOACH_SUA_DOT2.md`; **chạy lại** `./mvnw -B test`, `npm test`, `npx eslint src`, `next build`. Kết quả HTTP thật lấy từ bằng chứng đã lưu ngày 07/11 (không chạy lại Postman/demo trong lần rà này) |
| Nguồn | Roadmap BE/FE, `SPRINT_PLAN.md`, bàn giao `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` (§10 VER-03, FE-12), `report/evidence/BE-B2-postman-20261107.json`, `backend/k28/src`, `frontend/src`, `mockups/dot2/` |

Ký hiệu: ✅ hoàn thành · 🟡 chưa hoàn thiện · ❌ chưa làm · ⚠️ lệch tài liệu ↔ code.

## 1. Tổng quan

| | ✅ / tổng | Thay đổi so với lần 1 |
|---|---|---|
| BE | 11/12 | Giữ nguyên; B2.10 còn 🟡 vì chưa lọc theo chủ đề (BE-04, dời Đợt 3) |
| FE | 7/8 | Từ 0/8 lên 7/8; còn F2.2 (mất mạng + 409, dời đầu S7) |

**Kiểm chứng chạy lại ngày 07/11/2026**

| Lệnh | Kết quả |
|---|---|
| `./mvnw -B test` | 404/404 pass, BUILD SUCCESS |
| `npm test` (frontend) | 46/46 pass |
| `npx next build` | Qua, đủ route |
| `npx eslint src` | 1 lỗi, 13 cảnh báo. Lỗi nằm ở trang Đợt 3 `thanh-toan-lich-su/page.js:77` (`setTransactions` không dùng), không thuộc Đợt 2 |

**Bằng chứng HTTP thật (07/11/2026, đã lưu, không chạy lại)**
- VER-02 Postman (newman, Docker): `an@` 82 request / 126 assertion, `admin@` 62 / 79, **0 lỗi**. File `report/evidence/BE-B2-postman-20261107.json`.
- VER-03 demo đầu-cuối với `NEXT_PUBLIC_DOT2_MOCK=disabled`: 7/7 bước pass (bàn giao §10). Phát hiện và sửa FE-18.

**3 rủi ro còn lại**
1. F2.2 chưa có hàng đợi khi mất mạng và nhánh 409 (TC-08, TC-18 phụ thuộc). Đã dời đầu S7.
2. Mock vẫn còn trong mã (route Next.js `api/v1/{practice,notebook,learning,statistics}`, `src/mocks/handlers.js` dùng field cũ `thoiGianMs`, `loaiNham`, `mucTieuPhutNgay`). Đã tắt mặc định (`dot2MockEnabled` chỉ bật khi `NEXT_PUBLIC_DOT2_MOCK=enabled`; MSW chỉ bật khi `NEXT_PUBLIC_API_MOCKING=enabled`), nhưng nếu bật để demo thì dữ liệu sai hợp đồng.
3. UI49 còn dùng `alert`/`prompt`/`confirm` của trình duyệt (FE-16): chạy được nhưng không khớp mockup, không có `fieldErrors`.

## 2. Bảng BE

| Bước | Endpoint | FR/TC | TT | Còn thiếu | Chứng cứ |
|---|---|---|---|---|---|
| B2.1 | SRS calculator | FR-06 · TC-06, 07 | ✅ | — | `FR06SrsCalculatorTest` |
| B2.2 | `GET /learning/today` | FR-06 · TC-09 | ✅ | — | `FR06TodayPlanTest`, Postman VER-02 |
| B2.3 | `POST/GET /learning/sessions` | FR-06 | ✅ | — | `FR06StudySessionTest`, VER-03 bước 2 |
| B2.4 | `POST /learning/sessions/{id}/reviews` | TC-05, 08, 09 | ✅ | — | `FR06ReviewTest`, VER-03 bước 2 |
| B2.5 | finish, history, progress, suspend, reset | FR-06 | ✅ | — | `FR06FinishHistoryTest`, `FR06ProgressTest` |
| B2.6 | Cứu lịch ôn | TC-10 | ✅ | — | `FR06RescuePlanTest` |
| B2.7 | `POST/GET /practice/sessions`, `.../questions/{cauHoiId}/audio` | FR-07 · TC-11 | ✅ | — | `FR07PracticeSessionTest` (5), VER-03 bước 3 (`audio` 200) |
| B2.8 | submissions, history, `mistakes/retry` | TC-11 | ✅ | — | `FR07SubmissionTest`, `PracticeGraderTest` |
| B2.9 | `/notebook`, `/learning/confusing-pairs` | FR-08 | ✅ | TK không có TC riêng cho FR-08 | `FR08NotebookTest`, VER-03 bước 4 |
| B2.10 | `/statistics/overview`, `/statistics/skills` | FR-11 · TC-09 | 🟡 | Lọc theo chủ đề UI35 (BE-04, dời Đợt 3) | `FR11StatisticsTest` (5), Postman thêm 5 ca lỗi (BE-02) |
| B2.11 | 13 API `/admin/*` | FR-13 · TC-17 | ✅ | — | `FR13AdminTest`, VER-03 bước 6–7 |
| B2.12 | `phienDangDo`, `duBaoOn`, `thoiGian` | TC-09 | ✅ | — | `FR06DashboardTest`, VER-03 bước 1, 5 |

Postman: biến environment xong; **mô tả collection** vẫn trỏ tài liệu cũ, phải sửa tay trong Postman (BE-03 🟡, MCP không sửa riêng `info`).

## 3. Bảng FE

| Bước | Màn hình | TT | Còn thiếu | Chứng cứ |
|---|---|---|---|---|
| F2.1 | UI12 `/hom-nay` | ✅ | — | Khối phiên dở, 7 ngày, dự báo (FE-10); logo về `/hom-nay` (FE-11); VER-03 bước 1 |
| F2.2 | UI18 `/hoc`, UI19 `/hoc-phien` | 🟡 | Hàng đợi chưa đồng bộ khi mất mạng, nhánh 409 tải lại phiên | Roadmap FE `[ ]`; dời đầu S7 (`KE_HOACH_CAT_DOT3.md` §1.1) |
| F2.3 | UI20, UI21 | ✅ | Nợ nhỏ FE-14: `hoc-tong-ket/page.js:38-39` vẫn gọi `POST .../finish` trong `useQuery` (BE trả lại cùng tổng kết nên không sai dữ liệu) | VER-03 bước 2 |
| F2.4 | UI22 cứu lịch ôn | ✅ | — | `hom-nay/page.js` dùng `cuuLichOn`, `cheDo: CUU_LICH` (FE-09) |
| F2.5 | UI23–UI26 | ✅ | — | Âm thanh qua `.../questions/{id}/audio` (`luyen-tap-lam-bai/page.js:46`), `thoiGian` (FE-06); VER-03 bước 3 |
| F2.6 | UI27 `/so-tay` | ✅ | — | `soLanNham`, `lanCuoiAt` (FE-08); VER-03 bước 4 |
| F2.7 | UI35 `/thong-ke` | ✅ | Lọc chủ đề chờ BE-04 | `phutMoiNgay` (FE-07); VER-03 bước 5 |
| F2.8 | UI47, UI49, UI53 | ✅ | FE-16 (`alert`/`prompt`/`confirm` ở `quan-tri/bo-mau/page.js:42-289`) | `/admin/decks/{id}/cards` (FE-03), `version` khi xóa (FE-04, FE-18); VER-03 bước 6–7 |

`FeatureGate`: `FUTURE = []`, không còn chặn trang Đợt 2 (FE-01 ✅). Đối chiếu 14 trang với mockup, 360px, trạng thái tải/rỗng/lỗi: xong (FE-12, bàn giao §10).

## 4. Lệch hợp đồng và lệch tài liệu

### 4.1 BE ↔ FE

Cả 6 lệch của lần 1 đã sửa trong trang thật (FE-03…FE-10). Còn lại:

| # | Chỗ | Hiện trạng | Hậu quả |
|---|---|---|---|
| 1 | `frontend/src/mocks/handlers.js:236-447` (MSW) | Vẫn dùng `thoiGianMs`, `loaiNham`, `mucTieuPhutNgay` | Chỉ sai khi bật `NEXT_PUBLIC_API_MOCKING=enabled` |
| 2 | `frontend/src/app/api/v1/*` + 2 rewrite riêng trong `next.config.mjs:6-13` | Route mock Đợt 2 còn, đi qua `proxyOrMock` | Tắt mặc định; xóa ở FE-13 |

### 4.2 Lệch tài liệu (⚠️)

| Chỗ | Trạng thái 07/11 |
|---|---|
| `SPRINT_PLAN.md` route UI19/UI24, dòng B2.1, bàn giao Đợt 2 (DOC-01…09) | ✅ đã sửa |
| `roadmap/TienDoDuKien_fronend.md` dòng "không `cheDo` đến B2.6", "nhận `report/DOT2_BAO_CAO_FE.md`" (DOC-10) | ✅ sửa trong lần rà này |
| `frontend/README.md:105-107` "Trang chờ backend" ghi các trang Đợt 2 gọi endpoint chưa tồn tại, hướng dẫn `FUTURE` | ⚠️ còn sai (FE-17) |
| Mô tả collection Postman | ⚠️ còn trỏ `report/GD0_BAO_CAO_FE.md` (BE-03) |

## 5. Việc còn lại

| Ưu tiên | Việc | Bên | File | Cỡ |
|---|---|---|---|---|
| P1 | F2.2 mất mạng + 409 | FE | `hoc-phien/page.js` | Vừa (đầu S7) |
| P1 | FE-13 xóa route mock Đợt 2 + 2 rewrite riêng; sửa/xóa field cũ trong `src/mocks/handlers.js` | FE | `src/app/api/v1/*`, `next.config.mjs`, `src/mocks/` | Vừa |
| P2 | FE-14 `finish` ra khỏi `useQuery` | FE | `hoc-tong-ket/page.js` | Nhỏ |
| P2 | FE-15 test hợp đồng cho trang Đợt 2 | FE | `frontend/tests/` | Vừa |
| P2 | FE-16 UI49 dùng hộp thoại UI kit | FE | `quan-tri/bo-mau/page.js` | Vừa |
| P2 | FE-17 sửa `frontend/README.md` | FE | `frontend/README.md` | Nhỏ |
| P2 | BE-03 sửa tay mô tả collection | BE | Postman | Nhỏ |
| P2 | BE-04 lọc thống kê theo chủ đề | BE | `stats/` | Vừa (Đợt 3) |

## 6. Phát hiện ngoài Đợt 2 (ghi lại, không tính điểm)

| # | Phát hiện | Đề nghị |
|---|---|---|
| 1 | Commit `ff3c54e` (07/11) thêm UI55 `/thanh-toan-goi`, UI56 `/thanh-toan-lich-su` | **Đã chốt 07/11/2026: giữ, áp cho toàn hệ thống** → FR-15, TC-21/22, B3.12a/b, F3.12 (TK §6.9, `KE_HOACH_CAT_DOT3.md` §8). Còn lỗi lint `thanh-toan-lich-su/page.js:77` |
| 2 | Nhóm FE demo Xưởng thẻ AI mở rộng (tải tệp, ảnh AI, hoàn thiện IPA/ví dụ, lưu bộ mới) và UI30/UI31 mô phỏng; mã **chưa đẩy lên repo**, `.docx` gọi backend Node riêng (`newduan/backend`) | Đã đưa vào kế hoạch Đợt 3 (X-01…X-06, `KE_HOACH_CAT_DOT3.md` §7); phần máy chủ làm ở Spring B3.2/B3.3 |

## 7. Câu hỏi còn mở

- FE-13: xóa hẳn mock Đợt 2, hay giữ cho demo ngoại tuyến?
- ~~UI55/UI56 thanh toán: giữ hay bỏ?~~ Giữ, áp toàn hệ thống (07/11/2026).
- ~~X-04 sinh ảnh AI?~~ Giữ, dùng Imagen 3 (07/11/2026). Còn chốt ngân sách khóa API cùng mốc 12/11.
