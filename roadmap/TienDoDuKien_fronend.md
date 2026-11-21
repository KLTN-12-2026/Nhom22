# ROADMAP FRONTEND — VocabLearning (VocabFlow)

> **Lưu ý tham chiếu (20/10/2026):** các đường dẫn `report/`, `verification/`, `postman/`, `data/csv/`, `huong-dan/`, `GD0_BAO_CAO_FE.md`, `DOI_CHIEU_BE_GD0_B1_8_2026_10_05.md` trong tài liệu này là bằng chứng lịch sử và **không còn trong checkout**. Bàn giao hiện hành nằm ở `ban-giao-cho fe/`. Không dùng các đường dẫn đó làm bằng chứng kiểm chứng.

> Trạng thái10/10/2026: đã tích hợp FE từ GĐ0 đến hợp đồng BE B1.11, sửa lỗi DTO/phiên/upload/form, đối chiếu mockup desktop/mobile. F1.11 CSV B1.12 đã mở/kiểm chứng13/10/2026; xem bàn giao và verification/B1.12. Ghi nhận10/10 được giữ làm lịch sử. OAuth provider cần credentials để kiểm thử trao đổi Google thật; không tuyên bố luồng provider đã chạy. Bằng chứng và giới hạn nằm trong báo cáo bàn giao hiện có, không thay số liệu lịch sử BE.

> Nguồn: TK (`docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` §4, §6, §9, §10, §16), lịch sprint `roadmap/SPRINT_PLAN.md`, API từ `ban-giao-cho fe/SPRINT_<n>_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` (thư mục `report/` cũ không còn trong checkout; các đường dẫn `report/`, `verification/`, `postman/` còn lại trong tài liệu là lịch sử).
> Mỗi bước `Fx.y` ghép với bước BE cùng số giai đoạn. Màn hình `UIxx` và route: `SPRINT_PLAN.md` §5.
> Quy trình một màn hình: `/ui-brief` → `/ui-mockup <UI>` → `/fe-from-mockup mockups/<phase>/<file>.html` → nối API thật.

## 0. Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Framework | Next.js (App Router), JavaScript, React |
| Gọi API | `src/lib/api-client.js` (GĐ0 report §6), TanStack Query |
| Form & validate | Zod (`content-contract.mjs`, form thẻ) + kiểm tra HTML; `react-hook-form` đã cài nhưng chưa dùng; giới hạn = BE |
| Mock | MSW chỉ endpoint ping nền; auth/nội dung dùng BE thật. Mockup HTML dùng demo riêng |
| Giao diện | Design tokens `mockups/shared/tokens.css`, font hỗ trợ tiếng Việt + IPA, tối thiểu 16px |
| Kiểm thử | Node test runner (logic/hợp đồng), Playwright trên Edge (UI thật và demo tách riêng) |
| Kết nối BE | `rewrites` `/api/:path*` → `http://localhost:8080/api/:path*` (cùng site, cookie SameSite=Lax) |

## 0.1. Lịch theo đề cương (khớp `TienDoDuKien_backend.md` §0.2)

| Giai đoạn | Sprint | Thời gian | Kết quả FE | Bước |
|---|---|---|---|---|
| **GĐ0** — Nền tảng | S1–S2 | 28/09–11/10 | Dự án Next.js, design system, `api-client`, layout, trang công khai, mockup Đợt 1 | F0.1–F0.6 |
| **Đợt 1** — Tài khoản & nội dung | S3–S4 | 12/10–25/10 | Đăng ký/đăng nhập, onboarding, hồ sơ, thư viện, bộ/thẻ, CSV | F1.1–F1.12 |
| **Đợt 2** — Học & luyện | S5–S6 | 26/10–08/11 | Hôm nay học gì, flashcard SRS, luyện tập, sổ tay, thống kê, quản trị nền | F2.1–F2.8 |
| **Đợt 3** — AI & mở rộng | S7–S9 | 09/11–29/11 | Xưởng thẻ AI (+ ảnh AI), viết câu, phát âm, thành tích, thông báo, kiểm duyệt, vận hành, gói bắt buộc & thanh toán, doanh thu | F3.1–F3.13 |
| **GĐ4** — Kiểm thử | S10 | 30/11–06/12 | E2E, responsive, tiếp cận, lỗi mạng | F4.1–F4.4 |
| **GĐ5** — Bàn giao | S11 | 07/12–14/12 | Build production, dữ liệu demo, hướng dẫn, diễn tập | F5.1–F5.4 |

Mỗi giai đoạn bắt đầu bằng việc đọc báo cáo bàn giao BE trong `ban-giao-cho fe/` (API đã kiểm chứng + hợp đồng "Sắp có" để mock trước).

## 0.2. Cấu trúc mã nguồn

```text
frontend/
├── package.json  next.config.mjs  .env.example  jsconfig.json
├── public/                      # ảnh tĩnh, font
└── src/
    ├── app/
    │   ├── (public)/            # /, /thu-vien, /thu-vien/[id], /huong-dan, /chinh-sach, /dieu-khoan
    │   ├── (auth)/              # /dang-ky, /dang-nhap, /xac-thuc-email, /quen-mat-khau, /dat-lai-mat-khau
    │   ├── (app)/               # cần đăng nhập: /bat-dau, /hom-nay, /bo-the, /hoc, /luyen-tap, /so-tay,
    │   │                        #   /ai, /phat-am, /thong-ke, /thanh-tich, /thong-bao, /ca-nhan
    │   ├── quan-tri/            # ADMIN
    │   ├── layout.js  providers.js  not-found.js  error.js
    ├── components/
    │   ├── ui/                  # Button, Input, Modal, Toast, Skeleton, EmptyState, ErrorState…
    │   ├── layout/              # PublicLayout, AppShell, AdminLayout, RouteGuard
    │   └── <module>/            # auth, deck, card, study, practice, ai, speaking, stats, admin…
    ├── lib/
    │   ├── api-client.js        # fetch + CSRF + ApiError (GĐ0 report §6)
    │   ├── query-client.js      # TanStack Query, xử lý 401 toàn cục
    │   ├── content-contract.mjs # Zod cho form thẻ, giới hạn = BE
    │   └── format.js            # ngày giờ theo múi giờ người học, số liệu
    ├── hooks/                   # useMe, useDecks, useStudySession…
    ├── mocks/                   # MSW handlers theo module (dữ liệu thật từ báo cáo FE)
    └── styles/                  # tokens.css (copy từ mockups/shared), globals.css
```

**Quy tắc:** logic SRS, chấm điểm, điểm thưởng **chỉ ở BE** (TK §11.2); FE chỉ hiển thị kết quả server trả. Không để khóa dịch vụ trong biến `NEXT_PUBLIC_*`.

## GĐ0 — Nền tảng (S1–S2 · 28/09–11/10)

### [x] F0.1 Khởi tạo dự án
- `frontend/` Next.js App Router, ESLint, alias `@/`, `.env.example` (`API_URL`, `NEXT_PUBLIC_API_MOCKING`); giữ cấu hình formatter hiện có, không ghi nhận Prettier chưa cài là đã kiểm chứng.
- Thư mục (thực tế: không có `AdminLayout`, `schemas/`, `format.js`; token ở `mockup-tokens.css`; `quan-tri` nằm trong `app/(app)/`): `app/(public)`, `app/(auth)`, `app/(app)`, `app/quan-tri`, `components/ui`, `components/<module>`, `lib`, `mocks`.
- **Xong khi:** `npm run dev` chạy, trang `/` hiển thị.

### [x] F0.2 Design system & UI kit — TK §9.8
- Token màu (chàm chủ đạo, xanh lá thành công, hổ phách cảnh báo, đỏ lỗi), font, khoảng cách, bo góc, bóng.
- Thành phần: Button, Input, Select, Checkbox, Textarea, Card, Modal, Drawer, Toast, Tabs, Badge, Skeleton, EmptyState, ErrorState (có nút thử lại), Pagination, ConfirmDialog.
- **Xong khi:** trang `/_ui` liệt kê đủ thành phần; tương phản đạt; điều hướng được bằng bàn phím.

### [x] F0.3 api-client, Query, MSW
- `api-client.js`, `ApiError`, `applyServerErrors`, `QueryClient` xử lý 401 toàn cục (GĐ0 report §6). MSW handlers nền.
- **Xong khi:** `GET /public/ping` chạy với cả MSW và BE thật.

### [x] F0.4 Layout & bảo vệ route
- `PublicLayout` (header, footer), `AppShell` (sidebar desktop, bottom nav mobile); chưa có `AdminLayout` riêng (trang quản trị dùng `AppShell`).
- Guard: chưa đăng nhập → `/dang-nhap?next=`; không phải ADMIN → trang 403; chưa onboarding → `/bat-dau`.
- **Xong khi:** responsive 360px không tràn ngang.

### [x] F0.5 Trang công khai tĩnh — UI01, UI04, UI05
- Giới thiệu, cách học, hướng dẫn, FAQ, chính sách quyền riêng tư, điều khoản.

### [x] F0.6 Mockup Đợt 1 — UI02–UI17, UI40–UI43, UI48
- `/ui-mockup` cho từng màn, nối API thật khi đã có.

## Đợt 1 — Tài khoản & nội dung (S3–S4 · 12/10–25/10) · FR-01…05

### [x] F1.1 Đăng ký & xác thực email — UI06, UI07 ← B1.1
- Form email, mật khẩu, tên hiển thị, chấp nhận điều khoản; 409 hiện lỗi dưới ô email; 429 khóa nút.
- `/xac-thuc-email?token=` tự gọi xác thực; `TOKEN_INVALID` → nút "Gửi lại email".

### [x] F1.2 Đăng nhập, đăng xuất, phiên — UI08 ← B1.2
- Sau đăng nhập gọi lại `/auth/csrf`, `useMe()` làm nguồn thông tin người dùng; lỗi chưa xác thực email / bị khóa có thông báo riêng.

### [x] F1.3 Mật khẩu — UI09, UI10, UI42 ← B1.3
- Quên mật khẩu luôn hiện cùng một thông báo; đặt lại xong hiện thành công và nút tới `/dang-nhap`.

### [x] F1.4 Đăng nhập Google ← B1.4
- Nút Google trên UI06/UI08 đi qua `/auth/google/start?next=`; đích quay lại an toàn. Email trùng chưa liên kết → hướng dẫn đăng nhập mật khẩu rồi liên kết. Đã kiểm tra giao diện/hợp đồng; chưa kiểm chứng trao đổi token với provider Google thật.

### [x] F1.5 Khởi đầu, hồ sơ, thiết lập — UI11, UI40, UI41, UI43 ← B1.5
- Onboarding nhiều bước: mục tiêu (Giao tiếp/TOEIC), trình độ **tự đánh giá**, chủ đề, phút/ngày, từ mới/ngày, giờ nhắc, múi giờ (mặc định theo trình duyệt).

### [x] F1.6 Tải tệp & ảnh đại diện ← B1.6
- Component `FileUpload`: xin URL ký → PUT trực tiếp lên S3 (đúng `Content-Type`) → `complete`; kiểm tra loại/dung lượng trước khi gửi (ảnh ≤ 2 MB, âm thanh ≤ 5 MB).

### [x] F1.7 Thư viện & chi tiết bộ công khai — UI02, UI03 ← B1.7, B1.10
- Tìm, lọc (chủ đề, trình độ, mục tiêu, nguồn), sắp xếp, phân trang lưu trên URL; nhãn "Bộ mẫu"/"Người học chia sẻ"; nút "Sao chép liên kết"; bộ khởi động gợi ý ở cuối UI11.
- Kiểm chứng08/10: FE thật có danh sách/chi tiết/media, loading/empty/error requestId/retry; URL filter/paging, 360/390 không tràn ngang, onboarding TOEIC/CO_BAN có bộ mẫu đúng. FE tests9/9, build thành công, lint0 error/3 warning. [Evidence UI](../report/evidence/B1.10-ui-20261008.json); đây là số liệu lịch sử B1.10. Sao chép B1.11 đã tích hợp/kiểm chứng trong lượt10/10 riêng.

### [x] F1.8 Bộ của tôi — UI13, UI14 ← B1.8
- Danh sách, yêu thích, tạo/sửa (công khai/riêng tư), xóa có xác nhận; 409 `VERSION_CONFLICT` → tải lại.

### [x] F1.9 Thẻ & biên tập thẻ — UI15, UI16 ← B1.9, B1.6
- Trường: từ, từ loại, nghĩa, IPA, ví dụ, bản dịch, độ khó, nguồn, nhãn, ảnh, âm thanh; cảnh báo trùng (không chặn); xem trước thẻ.

### [x] F1.10 Sao chép bộ ← B1.11
- Gửi POST không body với `Idempotency-Key` giữ theo người dùng/bộ nguồn khi retry/reload; dùng `DeckResponse.id`, hiển thị thành công và mở bộ mới. Không tự tạo key khác khi mất phản hồi.

### [x] F1.11 CSV — UI17 ← B1.12
- Chọn tệp (≤ 1 MB, ≤ 1000 dòng) → xem trước → bảng lỗi từng dòng, đánh dấu trùng → chọn dòng → commit → kết quả; nút xuất CSV.
- Hoàn tất13/10: route `/bo-the/{id}/nhap-csv`, multipart/mapping9 cột,50 dòng/trang, retry cùng key sau mất response/reload, export blob, button icons/colors sáng/tối, mockup cùng contract;35 Node test/lint/build/ui:sync/ui:check pass, browser thật7 nhóm. Thẻ thư viện media cột phải và tùy chọn ảnh ở mép phải. [Bằng chứng](../verification/B1.12/browser.json).

### [x] F1.12 Quản trị chủ đề & nhãn — UI48 ← B1.7
- Chủ đề/nhãn: CRUD dùng DTO native và version; ADMIN được phép, learner thấy trang403; nhãn còn liên kết trả409. Bàn giao bổ sung trong `ban-giao-cho fe/SPRINT_1_BAO_CAO_BE_BAN_GIAO_CHO_FE.md`, không tạo báo cáo BE song song.

### Hoàn thiện giao diện10/10/2026

- Thu gọn/mở rộng thanh bên desktop; SVG có nhãn truy cập, mobile giữ icon/tên và vùng chạm44px.
- FE/mockup cùng màu hành động theo yêu cầu mới: xanh dương lưu/tạo/sao chép, xanh dương đậm (`--edit`, #1762ad) sửa, xanh ngọc nghe, đỏ xóa, trung tính hủy/điều hướng. Đây là điều chỉnh có chủ đích so với quy tắc màu cũ của skill, không thêm green completion làm nút.
- Đọc từ/câu bằng trình duyệt khi không có tệp; upload vẫn tùy chọn, giữ quyền media và DTO BE. Hiển thị ảnh mặc định bật, có lựa chọn ghi nhớ trên trình duyệt; khi tắt có nút Xem ảnh. Hàng nút tự xuống dòng trong thẻ.
- [Bằng chứng FE](../report/evidence/FE-B0-B1.11-verification-20261010.json). CSV/SRS/quản trị ngoài B1.7 không được đánh dấu hoàn tất.

## Đợt 2 — Học & luyện (S5–S6 · 26/10–08/11) · FR-06, 07, 08, 11, 13

### [x] F2.1 Hôm nay học gì? — UI12 ← B2.2
- Đến hạn, quá hạn, mới còn lại, mục tiêu, chuỗi ngày; nút 5/10/20 phút; một hành động chính.
- **Đã làm (07/11/2026, FE-12):** `hom-nay/page.js` khớp `mockups/dot2/hom-nay.html` (cùng thứ tự khối: Phiên đang dở, Tuần này, Chuỗi ngày học, Mục tiêu mỗi ngày, Theo bộ thẻ); chạy với BE Docker; 360px không tràn ngang; VER-03 bước 1 pass.

### [ ] F2.2 Phiên học flashcard — UI18, UI19 ← B2.3, B2.4
- Chọn bộ, chiều (Anh–Việt / Việt–Anh), thời gian; lật thẻ (Space), đánh giá Quên/Khó/Nhớ/Dễ (phím 1–4, không kích hoạt khi đang gõ) kèm giải thích.
- Mỗi lượt sinh `clientEventId` một lần, lưu tạm hàng đợi chưa đồng bộ, gửi lại cùng khóa khi mất mạng; 409 → tải trạng thái mới.
- Hết giờ: cho hoàn tất thẻ đang học rồi kết thúc.
- Hợp đồng B2.3: `POST /learning/sessions` chỉ gửi `{boTheId?, chieuHoc, quyThoiGian, cheDo?}` (`cheDo: CUU_LICH` từ B2.6, xem F2.4); hàng đợi rỗng → 422 `BUSINESS_RULE`. Response: `hetGioAt` tính ra, `hangDoi[].trangThai` là `CHUA_TRA_LOI`/`DA_TRA_LOI`, `hangDoi[].the` có `anhId`/`amTuId`/`amCauId` (tải qua `/files/{id}`, không có URL), `hangDoi[].tienDo.version` dùng cho `expectedVersion`. Chưa có `duKien` đến khi BE thêm; số thẻ tối đa = `phút×60/giayMoiLuot` (20 giây), không ghi cứng 15 giây.
- **Đã làm (07/11/2026, FE-12):** UI18/UI19 chạy với BE thật: tạo phiên, Space lật thẻ, phím 1–4 chấm, hai chiều, kết thúc giữa phiên (VER-03 bước 2); UI18 khớp mockup; 360px không tràn. **Chưa kiểm:** hàng đợi chưa đồng bộ khi mất mạng và nhánh 409 tải lại phiên, nên chưa tick.

### [x] F2.3 Tổng kết, tiến độ, lịch sử — UI20, UI21 ← B2.5
- UI21 đọc `GET /decks/{id}/progress` (B2.5): `tongHop` và danh sách thẻ phân trang; mockup `bo-the-tien-do.html` đã dùng endpoint này.
- Tổng kết khớp lịch sử; bảng thẻ theo trạng thái (mới, đang học, đến hạn, quá hạn, tạm ngưng); tạm ngưng/khôi phục/đặt lại có xác nhận.
- **Đã làm (07/11/2026, FE-12):** sửa UI21 lỗi trắng trang "useParams is not defined" (thiếu import) và bật `no-undef` trong ESLint; UI20 luôn hiện khối "Gợi ý tiếp theo" như mockup (có câu khi không có từ khó). UI20/UI21 khớp mockup, 360px không tràn, id sai → "Không tìm thấy" (404).

### [x] F2.4 Cứu lịch ôn — UI22 ← B2.6
- "Có N thẻ cần ôn; hôm nay bạn có X phút" + lộ trình chia ngày; ghi rõ là ước tính.
- **Đã làm (07/11/2026, FE-12):** khối cứu lịch ôn trong `/hom-nay` kiểm với `cuuLichOn` thật từ BE (FE-09…FE-11, bàn giao Đợt 2 §10): đổi phút, giữ từ mới, bắt đầu phiên `CUU_LICH`.

### [x] F2.5 Luyện tập — UI23–UI26 ← B2.7, B2.8
- 8 dạng: chọn nghĩa, chọn từ, ghép, điền chỗ trống, nhập từ theo nghĩa, nghe viết, phân biệt cặp nhầm, tổng hợp.
- Đề không có đáp án; nộp một lần với `submitKey`; kết quả + giải thích; luyện lại câu sai; lịch sử.
- **Đã làm (07/11/2026, FE-12):** cả 8 dạng render với BE thật (bài 12 nghe viết, 13 tổng hợp gồm chọn nghĩa/chọn từ/nhập từ/phân biệt cặp, 15 ghép từ, 16 điền chỗ trống); sửa ghép từ tràn ngang 3336px ở 360px (`select` theo nghĩa dài); UI23 và UI26 hiện lỗi thay vì nuốt lỗi (loaiBai sai → "Chưa tải được lịch sử bài làm" + Thử lại); UI25 nhãn "Theo kỹ năng trong bài này" như mockup.

### [x] F2.6 Sổ tay từ khó & cặp nhầm — UI27 ← B2.9

> Số liệu kiểm thử FE tại 20/10/2026: `npm test` 39/39 pass, ESLint 0 lỗi 14 cảnh báo (các con số 9/9, 35, "3 warning" ở trên là lịch sử). `react-hook-form` đã cài nhưng chưa dùng; không có Playwright và không có script `test:contract`.
- **Đã làm (07/11/2026, FE-12):** khớp mockup (Sổ tay từ khó, Cặp dễ nhầm, Khi nào từ vào sổ); thanh lọc cuộn trong `.tabs` (overflow-x auto), trang không tràn ở 360px; VER-03 bước 4 pass.

### [x] F2.7 Thống kê nền — UI35 ← B2.10
- Biểu đồ theo ngày (múi giờ người học), tỷ lệ đúng, mức làm chủ theo kỹ năng; thiếu dữ liệu → "Chưa đủ dữ liệu".
- **Đã làm (07/11/2026, FE-12):** khớp mockup (Tổng quan, Thời gian học theo ngày, Mức làm chủ, Cách tính, Luyện kỹ năng yếu); bảng cuộn trong `.table-wrap`; "Chưa đủ dữ liệu" khi dưới 5 lượt; VER-03 bước 5 pass.

### [x] F2.8 Quản trị nền — UI47, UI49, UI53 ← B2.11
- Tìm, khóa/mở tài khoản (bắt buộc lý do), cấp/thu vai trò; bộ/thẻ mẫu xuất bản/ẩn; nhật ký.
- **Cuối Đợt 2:** demo học đầu-cuối; nhận `ban-giao-cho fe/SPRINT_2_BAO_CAO_BE_BAN_GIAO_CHO_FE.md` (demo 7/7 bước pass 07/11/2026, §10).
- **Đã làm (07/11/2026, FE-12):** UI47/UI53 có trạng thái lỗi (`ErrorState` + Thử lại); UI49 có trạng thái lỗi cho danh sách bộ, chi tiết bộ, danh sách thẻ, thêm khối "Quy tắc" ở danh sách như mockup, sửa "Xóa bộ" thiếu `version` (FE-18); 360px không tràn; VER-03 bước 6–7 pass. Còn FE-16 (`alert`/`prompt`/`confirm`).

## Đợt 3 — AI, phát âm, động lực, thanh toán (S7–S9 · 09/11–29/11) · FR-08…15

**Cắt phạm vi (áp 07/11/2026):** theo [KE_HOACH_CAT_DOT3.md](../docs/KE_HOACH_CAT_DOT3.md). **Cắt** UI52, UI54, UI46 và tab "Tác vụ nền" của UI53. F2.2 (phần mất mạng + 409) làm đầu S7.

### [ ] F3.1 Xưởng thẻ AI — UI29 ← B3.1, B3.2
- Trái đoạn văn, phải thẻ nháp: chọn, sửa, nghe, cảnh báo trùng, liên kết đoạn nguồn; 202 → hỏi trạng thái định kỳ; "Lưu N thẻ đã chọn" với `Idempotency-Key`.
- **Bổ sung 07/11/2026** (theo demo nhóm FE, [KE_HOACH_CAT_DOT3.md §7](../docs/KE_HOACH_CAT_DOT3.md)): **X-01** nút "Tải tệp (Word/TXT/CSV)" — `.txt`/`.csv` đọc tại trình duyệt, `.docx` tải qua `/files/upload-requests` rồi gửi `tepId`; **X-02** chọn bộ có sẵn *hoặc* nhập tên bộ mới (khóa ô còn lại); **X-03** "Hoàn thiện với AI (IPA + Ví dụ)" từng thẻ (API của F3.2); **X-04** "Sinh ảnh AI" (Imagen 3, **Giữ**) có "Tạo lại"/"Bỏ ảnh", nhãn "Ảnh AI"; hết hạn mức ảnh của gói → nút "Nâng cấp gói" sang UI55 (S8, sau B3.3); **X-05** loa nghe từng thẻ nháp; **X-06** sửa/xóa từng thẻ, "Xóa tất cả" có xác nhận, đếm số thẻ.
- Mã demo của nhóm FE chưa có trên `main`; khi đưa vào phải bỏ gọi backend Node (`newduan/backend`) và gọi API Spring.
- **Giữ** (S7; X-03, X-04 xong ở S8).

### [ ] F3.2 Giải thích ngữ cảnh, viết câu & tự điền thẻ — UI30, UI31, UI16 ← B3.3
- Không render HTML từ AI; hiển thị câu gốc, bản sửa, lỗi, giải thích tiếng Việt; nút báo cáo đầu ra sai.
- Hiện trạng 07/11/2026: nhóm FE đã có giao diện mô phỏng UI31 `/ai-viet-cau` (bản sửa, "Vì sao sửa?", "Báo cáo phản hồi") và ngăn UI30 "Giải thích theo ngữ cảnh" trên mặt thẻ ("Đọc câu ví dụ", "Giải thích câu này", "Báo cáo đầu ra"); chờ B3.3 để thay dữ liệu mô phỏng.
- **R-02:** trong `CardEditor`, gõ từ → nút "Gợi ý" gọi `context-explanations` → điền IPA, nghĩa, ví dụ, bản dịch vào form (không tự lưu); AI lỗi/429 hiện thông báo, form vẫn lưu tay được.
- **Gọn** (S8).

### [ ] F3.3 Lịch sử AI & hạn mức — UI32 ← B3.3
- Hết hạn mức (429) hiển thị thời điểm được dùng lại; AI lỗi không chặn học. Lịch sử dạng danh sách.
- **Gọn** (S8).

### [ ] F3.4 Gợi ý có lý do — UI28 ← B3.5
- Hiển thị mã lý do + minh chứng ("sai 3/5 lượt gần đây") + liên kết tới các lượt liên quan.
- **R-04:** thẻ gợi ý `TIEN_BO` trên UI12 ("đúng 5/5 tuần này"); ẩn khi API không trả.
- **Giữ** (S8).

### [ ] F3.5 Góc phát âm — UI33, UI34 ← B3.4a, B3.4b
- Nghe mẫu (B3.4a, dùng cả trên UI19 và bài nghe viết từ S7); xin quyền micro khi bấm ghi; ghi ≤ 15 giây, phát lại, ghi lại; gửi; chỉ hiện chỉ số có thật; so sánh 2 lần gần nhất cùng từ; xóa bản ghi. Kết quả Fake hiện nhãn "Mô phỏng".
- **Gọn** (S9).

### [ ] F3.6 Động lực — UI38 ← B3.6
- Điểm, chuỗi ngày, huy hiệu, thử thách tuần, lịch sử thưởng.
- **R-03:** UI12 hiện "Đã dùng ngày nghỉ tuần này" khi chuỗi được giữ nhờ ngày đóng băng.
- **Gọn** (S8). **Cắt:** UI54 quản trị huy hiệu/thử thách.

### [ ] F3.7 Thông báo — UI39 ← B3.7
- Chuông có số chưa đọc, trang thông báo, đánh dấu đã đọc.
- **Gọn** (S8). **Cắt:** UI52 quản trị gửi thông báo hệ thống. **Hoãn:** web push + PWA.

### [ ] F3.8 Báo cáo & kiểm duyệt — UI45, UI50 ← B3.8
- Hộp báo cáo (lý do + mô tả) trên bộ/thẻ/đầu ra AI; hàng đợi xử lý: giữ/ẩn kèm lý do.
- **Gọn** (S9).
- **Đã làm UI50 (21/11/2026, F3.15 E):** `/quan-tri/bao-cao`: tab Chờ xử lý/Đã giữ/Đã ẩn/Tất cả (lọc qua URL), lọc loại nội dung, bảng + phân trang, ngăn chi tiết (bản chụp `noiDung`, mô tả, link nội dung hiện tại), form giữ/ẩn + lý do 10–500, 409 → tải lại; số chờ xử lý trên menu. Kiểm với BE 8080 thật: 4 báo cáo, mở ngăn, kiểm lỗi nhập (không gửi quyết định). **Còn:** UI45 hộp báo cáo phía người học, nên chưa tick.

### [ ] F3.9 Tổng kết tuần & bản đồ làm chủ — UI36, UI37 ← B3.9, B2.10
- Màu không phải dấu hiệu duy nhất; không tô xanh khi mới đúng một lần.
- UI36 = bảng bộ thẻ × kỹ năng, có "Chưa đủ dữ liệu"; UI37 có mục "Từ đã vượt qua" (R-04).
- **Gọn** (S9). **Cắt:** lưới màu từng từ.

### [ ] F3.10 Dữ liệu & xóa tài khoản — UI44 ← B3.10
- Xác nhận hai bước, hiển thị trạng thái xử lý.
- **Gọn** (S9).

### [x] F3.11 Quản trị vận hành — UI51 ← B3.11
- Hạn mức và lượt dùng/lỗi theo dịch vụ.
- **Gọn mạnh** (S9). **Cắt:** chi phí, tab "Tác vụ nền" UI53, yêu cầu xóa dữ liệu. (UI46 khôi phục 21/11/2026 ở F3.15.)
- **Đã làm 21/11/2026 (F3.15 E):** `/quan-tri/dich-vu`: bảng lượt dùng (hôm nay/7/30/90 ngày; đang giữ, người dùng, lỗi, chưa rõ, tỷ lệ lỗi; TTS/phát âm "Không ghi nhận"), bảng hạn mức gói × dịch vụ sửa tại chỗ (0–10.000, đánh dấu ô đổi, Hoàn tác), lý do bắt buộc, gửi chỉ ô đổi kèm `version`, 409 → tải lại; link lịch sử `nhat-ky?loai=HAN_MUC_DICH_VU`. `src/lib/admin-ops.mjs` + `tests/admin-ops.test.mjs` (9 test). Kiểm với BE 8080 thật: số liệu khớp, kiểm lỗi ô/lý do, 375px không tràn; không bấm lưu để giữ dữ liệu dev.

### [ ] F3.12 Gói dịch vụ & thanh toán — UI55, UI56, UI57 ← B3.12a, B3.12b (bổ sung 07/11/2026)
- Hiện trạng: UI55 `/thanh-toan-goi`, UI56 `/thanh-toan-lich-su` đã có giao diện (commit `ff3c54e`), dữ liệu cứng. **15/11/2026:** đã bỏ khỏi mockup và FE mọi mục ở dòng "Bỏ khỏi giao diện" dưới đây, cùng "Hủy gói", "Đổi gói" và tạo hóa đơn ở trình duyệt; giá/quyền lợi theo TK §6.9; nút "Thanh toán qua VNPay" còn mô phỏng; UI56 có "Gia hạn gói" và trạng thái `THANH_CONG`/`THAT_BAI`/`HET_HAN`. Kiểm chứng: lint hai trang sạch, `npm run build` pass, `npm test` 53/53, xem trên trình duyệt 1280/390 px cả theme sáng và tối. Chưa nối API (chờ B3.12a/B3.12b).
- Nối API (S8): UI55 đọc `GET /billing/plans`, `GET /me/subscription` (bỏ mảng `PLANS` cứng); "Xác nhận thanh toán" gọi `POST /billing/checkouts` rồi `window.location.assign(paymentUrl)`. Thêm **UI57** `/thanh-toan-ket-qua?maDon=` đọc `GET /billing/transactions/{maDon}` (thành công/thất bại/đang chờ, nút thử lại).
- **Bỏ khỏi giao diện:** form số thẻ/tên chủ thẻ/hạn/CVV (thẻ nhập trên trang VNPay), "Chuyển khoản ngân hàng" mã cứng, MoMo/ZaloPay (chưa có cổng), danh sách "thẻ đã lưu", dòng "Hỗ trợ ưu tiên"; toàn bộ thẻ gói Miễn phí (không còn gói miễn phí, sửa 10/11/2026: chỉ `PRO`, `PREMIUM`); xuất CSV không phụ thuộc gói. Phương thức còn lại: "Thẻ ATM / VISA / Mastercard / VNPAY-QR qua VNPay".
- Nối API (S9): UI56 đọc `GET /billing/transactions`, "Tải biên nhận" mở `.../receipt` (bỏ tạo tệp văn bản ở trình duyệt). Màn giao dịch của Admin chuyển sang UI59 (F3.13), không làm tab trong UI51.
- **Bắt buộc có gói (10/11/2026):** interceptor API bắt 402 `SUBSCRIPTION_REQUIRED` → chuyển `/thanh-toan-goi?lyDo=CHUA_CO_GOI|HET_HAN`; layout `(app)` đọc `GET /me/subscription`, chưa có gói thì khóa menu học (chỉ còn Gói & thanh toán, Thông báo, Cá nhân); sau khởi đầu (UI10) chuyển sang UI55; UI57 thành công có nút về UI12.
- Banner trong `AppShell` theo `soNgayConLai`: vàng khi ≤ 7 ngày, đỏ khi ≤ 1 ngày, nút "Gia hạn"; thông báo `GOI_SAP_HET_HAN`/`GOI_DA_HET_HAN` ở UI44 có liên kết UI55.
- Mọi chỗ bị chặn vì quyền lợi gói (422 `goiCanNangCap`, 429 hạn mức) hiện thông báo + liên kết UI55; `AppShell` hiện tên gói đang dùng.
- **Giữ** (UI55, UI57: S8; UI56, tab UI51: S9).

### [ ] F3.13 Quản lý thanh toán & doanh thu (Admin) — UI58, UI59 ← B3.12c (góp ý GVHD 10/11/2026)
- UI59 `/quan-tri/thanh-toan`, 3 tab: **Giao dịch** (`GET /admin/payments`, lọc trạng thái/gói/ngày/email, xem chi tiết), **Gói người dùng** (`GET /admin/subscriptions`, lọc "Sắp hết hạn 7 ngày"; nút "Sửa ngày hết hạn" và "Chạy kiểm tra ngay" chỉ hiện khi API công cụ demo bật, bắt nhập lý do), **Cấu hình gói** (`GET/PUT /admin/plans`, 409 tải lại).
- UI58 `/quan-tri/doanh-thu`: chuyển kỳ Tháng / Quý / Năm, chọn năm; thẻ tổng (doanh thu, số giao dịch, so với kỳ trước, gói hiệu lực, sắp hết hạn, tỷ lệ thành công); biểu đồ cột chồng theo gói; bảng số liệu bên dưới. Đọc `GET /admin/revenue`.
- Thêm 2 mục vào menu quản trị.
- **Giữ** (S9).
- **Cuối Đợt 3:** demo TK §20.2 (10 bước + 9b mua gói bắt buộc + 9c hết hạn và doanh thu); nhận `ban-giao-cho fe/SPRINT_3_BAO_CAO_BE_BAN_GIAO_CHO_FE.md`.
### [x] F3.14 Bản sao & duyệt công khai — UI14, UI03, UI60, UI61 ← B3.14 (yêu cầu 21/11/2026)
- **Đã làm 21/11/2026:** `src/lib/publish-requests.mjs` (+ `tests/publish-requests.test.mjs`), `CopyBadge`, `PublishRequestPanel`, `PublishRequestReview`; trang `/yeu-cau-cong-khai`, `/quan-tri/duyet-cong-khai`; sửa `/thu-vien/[id]` (409/422, ẩn sao chép với bản sao, "Xem bộ gốc"), `/bo-the`, `/bo-the/[id]`, `/bo-the/tao` (khóa "Công khai" với bản sao riêng tư), `LibraryDeckList`, menu `AppShell`. Kiểm chứng: `npm test` 69/69, `npm run build` pass, eslint 0 lỗi; trình duyệt thật với BE 8080 (xem luồng B3.14). Chưa có mockup UI60/UI61.
- Nút "Sao chép": 409 → thông báo "Bạn đã có bản sao" + mở `details.boTheId`; bộ là bản sao → nút "Xem bộ gốc" thay cho sao chép.
- Huy hiệu "Bản sao" nổi bật + dòng "Gốc: <tên>" có link (hoặc "Bộ gốc không còn công khai") trên `/bo-cua-toi`, chi tiết bộ, thẻ thư viện và kết quả tìm kiếm; đọc `banSao`.
- Bản sao: ô quyền truy cập không cho chọn công khai trực tiếp; nút "Xin công khai" (lời nhắn tùy chọn), trạng thái `yeuCauCongKhai` (chờ, đã duyệt, bị từ chối kèm lý do và thời điểm gửi lại, hết hạn), nút rút yêu cầu.
- UI60 `/yeu-cau-cong-khai` cho tác giả, UI61 `/quan-tri/duyet-cong-khai` cho Admin: danh sách lọc trạng thái, xem bản sao, duyệt/từ chối/thu hồi kèm lý do, 409 tải lại. Thông báo `YEU_CAU_CONG_KHAI`/`KET_QUA_CONG_KHAI` mở đúng trang.

### [ ] F3.15 Admin Console — khung riêng, bảng điều khiển, bảng dữ liệu chung (yêu cầu 21/11/2026; demo duyệt `mockups/_previews/quan-tri-2026-11-21.html`)
- Thứ tự: A khung → B bảng điều khiển `/quan-tri` (cần BE `GET /admin/dashboard`, khôi phục UI46) → E trang UI50 `/quan-tri/bao-cao`, UI51 `/quan-tri/dich-vu` → C bảng dữ liệu dùng chung → D ngăn chi tiết người dùng (cần BE `GET /admin/users/{id}`).
- **Đã làm giao diện "Sổ quản trị" (21/11/2026, theo yêu cầu "nhìn AI quá, đại trà"; demo duyệt: `mockups/_previews/quan-tri-so-2026-11-21.html`):** `admin.css` viết lại theo token chung của phiếu trả lời (bỏ bảng màu slate/indigo riêng, bỏ Inter và JetBrains Mono, bỏ chữ in hoa, bỏ thẻ chỉ số); thanh bên thành mục lục giấy với ô tròn tô chì, nhóm Hằng ngày / Hồ sơ / Sổ sách; khung dùng dấu căn lề trái, bảng kẻ dòng, trạng thái dạng con dấu. Tổng quan đổi thành "Sổ trực ban": con dấu ngày, danh sách việc chờ đánh số với số khoanh bút đỏ, "Sổ số liệu" (kỳ này / kỳ trước / thanh so sánh / chênh), biểu đồ trên giấy kẻ, gói đang dùng thành thanh ngang, tình trạng hệ thống thành danh sách. Quy tắc ghi ở `DESIGN.md` (The Exam Office Rule). Kiểm chứng: `npm test` 101/101, eslint 0 lỗi; trình duyệt với BE thật: tổng quan, Tài khoản + ngăn hồ sơ ở 1440px, 390px (không tràn ngang), sáng và tối.
- **Đã làm D (21/11/2026):** ngăn hồ sơ người dùng `src/components/admin/UserDetailDrawer.js` mở khi bấm một dòng ở Tài khoản (URL `?nguoi={id}`, chia sẻ được): đầu ngăn có avatar, trạng thái, nút khóa/mở khóa/cấp/thu quyền (cùng hộp xác nhận có lý do); 4 tab Tổng quan (mục cần chú ý: bị khóa, chưa xác thực, báo cáo chờ xử lý, gói sắp hết hạn, giao dịch thất bại, lâu không học; 4 chỉ số; thông tin tài khoản và kiểm duyệt), Học tập (lưới nhiệt 30 ngày, thẻ đến hạn, 5 bộ thẻ gần nhất, dịch vụ AI), Thanh toán (giao dịch, lịch sử gói), Nhật ký (dòng thời gian theo `doiTuongId`, phân trang). `src/lib/admin-user-detail.mjs` + `tests/admin-user-detail.test.mjs` (5 test). API: B3.16. Kiểm chứng: `npm test` 97/97, eslint 0 lỗi; trình duyệt với API thật: 3 tài khoản (có học, có gói/thanh toán, đang xóa có nhật ký), 4 tab, nút Khóa mở hộp lý do rồi Hủy (không đổi dữ liệu), ngăn 548px không tràn ngang.
- **Đã làm C (21/11/2026):** `src/components/admin/AdminTable.js` (cột khai báo, sắp xếp trong trang, chọn nhiều + thao tác hàng loạt, mở dòng xem chi tiết, bấm dòng, trạng thái tải/lỗi/trống, phân trang, xuất CSV toàn bộ kết quả lọc), `AdminConfirm.js` (hộp xác nhận có lý do 10–500, thay mọi `window.prompt/confirm/alert` trong khu quản trị — đóng FE-16 cho Admin), `AdminPageHead.js`; `src/lib/admin-table.mjs` + `tests/admin-table.test.mjs` (7 test). Viết lại theo bảng chung: Tài khoản (lọc qua URL, khóa/mở khóa hàng loạt, xuất CSV mọi trang), Nhật ký (đủ 27 hành động/8 loại đối tượng, mở dòng xem trước/sau, xuất CSV), Thông báo, Chủ đề & nhãn, Bộ mẫu (danh sách + thẻ, xuất CSV thẻ), Thanh toán (2 bảng), Báo cáo. Xóa `quan-tri/chu-de/page.module.css` không còn dùng. Duyệt công khai giữ `PublishRequestReview` dùng chung với trang người học (chỉ đổi theo token). Kiểm chứng: `npm test` 92/92, eslint 0 lỗi; trình duyệt với BE 8080: 8 trang tải đúng dữ liệu, chọn nhiều + hộp lý do (bấm Hủy, không đổi dữ liệu), sắp xếp, mở chi tiết nhật ký; 1440px và 375px không tràn ngang.
- **Đã làm E (21/11/2026):** UI50 `/quan-tri/bao-cao` (xem F3.8) và UI51 `/quan-tri/dich-vu` (xem F3.11); menu thêm "Báo cáo vi phạm" (số chờ, màu đỏ) và "Dịch vụ & hạn mức"; hàng đợi bảng điều khiển trỏ tới trang báo cáo; lớp class dùng chung `adm-*` trong `admin.css` (thẻ, nút, bảng, nhãn, ô nhập, ngăn chi tiết). `npm test` 85/85, eslint 0 lỗi.
- **Đã làm B (21/11/2026):** `/quan-tri` thành bảng điều khiển (thay chuyển hướng): 6 chỉ số có so sánh kỳ trước + sparkline, biểu đồ hoạt động học (người học + lượt ôn hai trục), hàng đợi cần xử lý có link, doanh thu 12 tháng, vòng cơ cấu gói, dịch vụ hôm nay, bộ mẫu học nhiều, nhật ký gần đây, người dùng mới, tình trạng hệ thống; chọn 7/30/90 ngày, tự làm mới 60 giây. `src/lib/admin-dashboard.mjs` + `tests/admin-dashboard.test.mjs` (7 test); menu thêm nhóm "Tổng quan". Kiểm chứng: `npm test` 76/76, eslint 0 lỗi; trình duyệt với dữ liệu thật lấy từ BE mới (8081) nạp vào trang vì BE 8080 đang chạy bản cũ; 1440px và 375px không tràn ngang, sáng/tối.
- **Đã làm A (21/11/2026):** `AdminShell` tách khỏi `AppShell` (sidebar tối 5 nhóm, breadcrumb, nhãn môi trường, số yêu cầu chờ duyệt, ngăn menu di động); `src/styles/admin.css` đổi token trong phạm vi `.adm` (Inter + JetBrains Mono, slate/chàm, sáng/tối) nên 8 trang quản trị cũ đổi phong cách mà không sửa trang; `(app)/layout.js` chọn shell theo `/quan-tri`; `/quan-tri` chuyển sang `/quan-tri/tai-khoan`; thêm "Doanh thu" vào menu; ẩn linh vật trong khu quản trị. Kiểm chứng: eslint 0 lỗi, trình duyệt thật với BE 8080 (tài khoản, bộ mẫu, doanh thu, nhật ký; sáng/tối; 375px không tràn ngang).

### [x] F3.17 Lịch hoạt động năm trên Hồ sơ — UI40 ← B3.17 (yêu cầu 21/11/2026)
- **Đã làm 21/11/2026:** `src/lib/activity-heatmap.mjs` (+ `tests/activity-heatmap.test.mjs`), `components/stats/ActivityHeatmap.js` (21/11 chuyển từ `/thong-ke` sang tab Tổng quan `/ca-nhan`). Lưới 7 hàng (T2…CN) × 53 cột, nhãn tháng, 5 mức màu theo tứ phân vị giá trị khác 0 của chính người dùng, màu theo chỉ số (lượt ôn vàng, luyện tập xanh dương, phút học xanh lá, công khai tím — cùng màu icon sidebar), tooltip ngày, tổng năm, số ngày có hoạt động, chuỗi dài nhất/hiện tại (hôm nay chưa học không làm đứt chuỗi). Chỉ số chọn lưu `localStorage`. Màn hẹp cuộn ngang, nhãn thứ dính trái, tự cuộn tới tuần mới nhất.
- **Kiểm chứng 21/11/2026:** `node --test tests/activity-heatmap.test.mjs` 4/4; trình duyệt thật `/thong-ke` (BE 8080) sáng/tối, tooltip, đổi chỉ số.

### [x] F3.18 Hồ sơ kiểu GitHub — UI40 `/ca-nhan`, `/tac-gia/[id]` ← B3.17, B3.18 (yêu cầu 21/11/2026)
- **Đã làm 21/11/2026:** `/ca-nhan` thành hai cột: `components/profile/ProfileCard.js` (ảnh lớn, tên, email, nút "Chỉnh sửa hồ sơ" sửa tại chỗ tên/múi giờ/ảnh, múi giờ, xác thực, vai trò, huy hiệu) và bên phải tab có icon (Tổng quan, Thiết lập học, Bảo mật, Thông báo). Tab Tổng quan: 4 số liệu, "Bộ thẻ nổi bật" (6 bộ, yêu thích trước), lịch hoạt động năm (chuyển từ `/thong-ke`). `/tac-gia/[id]` cùng bố cục với thông tin công khai (ảnh, tên, số bộ/thẻ, ngày tham gia, huy hiệu) + danh sách bộ công khai; xem chính mình có nút "Chỉnh sửa hồ sơ".
- **Kiểm chứng 21/11/2026:** eslint 0 lỗi, `npm test` 101/101.

### [x] F3.19 Cập nhật thời gian thực — chuông, gói, thanh toán, AI, menu quản trị ← B3.19 (yêu cầu 22/11/2026)
- **Đã làm 22/11/2026:** `src/lib/realtime.mjs` (sự kiện → query key), `src/hooks/useEventStream.js` (EventSource, toast thông báo mới, khóa tài khoản → xóa cache và về `/dang-nhap`), gắn ở `AppShell` và `AdminShell`; menu quản trị lấy số đếm từ `GET /admin/dashboard/queue`, thêm số giao dịch treo; giãn polling dự phòng (chuông, sổ trực ban 5 phút; AI 5 giây; thanh toán 10 giây; lịch sử AI 2 phút).
- **Kiểm chứng 22/11/2026:** eslint 0 lỗi, `tests/realtime.test.mjs` 3/3, `next build` thành công. `npm test` còn 2 lỗi có sẵn từ trước ở `api-client.test.mjs` (mascot), không liên quan.
- **Trình duyệt thật 22/11/2026:** `next start` 3002 + BE 8081, đăng nhập `an@vocab.local`: `/events/stream` 200, banner thông báo hệ thống hiện/biến mất ngay khi Admin tạo/xóa. Proxy Next không giữ đệm luồng.

## GĐ4 — Kiểm thử & ổn định (S10 · 30/11–06/12)

### [ ] F4.1 E2E Playwright cho kịch bản demo TK §20.2
- **Gọn:** 1 kịch bản theo bước 1–4 và 8.
### [ ] F4.2 Responsive 360px, bàn phím, focus, tương phản, giảm chuyển động — TC-18
### [ ] F4.3 Mạng chậm / API lỗi: không mất kết quả đã lưu, thử lại rõ ràng — TC-18
### [ ] F4.4 Lighthouse, kích thước bundle, không lộ khóa dịch vụ trong bundle

## GĐ5 — Triển khai & bàn giao (S11 · 07/12–14/12)

### [ ] F5.1 Build production sau Nginx cùng domain với API (cùng B5.1)
### [ ] F5.2 Kiểm tra mọi màn hình với dữ liệu demo (B5.2a, B5.2b)
### [ ] F5.3 Hướng dẫn sử dụng có ảnh chụp trong `huong-dan/`
### [ ] F5.4 Diễn tập demo 8–10 phút

## Definition of Done (mọi bước F)

- [ ] Giống mockup; có trạng thái tải (skeleton), rỗng (kèm bước tiếp theo), lỗi (kèm thử lại), xác nhận sau khi lưu.
- [ ] Chạy với API thật; giới hạn Zod = giới hạn BE; lỗi `fieldErrors` hiện đúng ô.
- [ ] Responsive 360px; dùng được bằng bàn phím; nhãn form đầy đủ.
- [ ] Không render HTML chưa làm sạch; không để khóa dịch vụ trong code FE.
- [ ] Tick checkbox bước trong file này.
