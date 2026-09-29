# ROADMAP FRONTEND — VocabLearning (VocabFlow)

> Nguồn: TK (`docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` §4, §6, §9, §10, §16), lịch sprint `roadmap/SPRINT_PLAN.md`, API từ `report/<PHASE>_BAO_CAO_FE.md`.
> Mỗi bước `Fx.y` ghép với bước BE cùng số giai đoạn. Màn hình `UIxx` và route: `SPRINT_PLAN.md` §5.
> Quy trình một màn hình: `/ui-brief` → `/ui-mockup <UI>` → `/fe-from-mockup mockups/<phase>/<file>.html` → nối API thật.

## 0. Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Framework | Next.js (App Router), JavaScript, React |
| Gọi API | `src/lib/api-client.js` (GĐ0 report §6), TanStack Query |
| Form & validate | react-hook-form + Zod (giới hạn = BE) |
| Mock | MSW, bật bằng `NEXT_PUBLIC_API_MOCKING=enabled` |
| Giao diện | Design tokens `mockups/shared/tokens.css`, font hỗ trợ tiếng Việt + IPA, tối thiểu 16px |
| Kiểm thử | Vitest (logic), Playwright (E2E luồng demo) |
| Kết nối BE | `rewrites` `/api/:path*` → `http://localhost:8080/api/:path*` (cùng site, cookie SameSite=Lax) |

## 0.1. Lịch theo đề cương (khớp `ROADMAP_BE.md` §0.2)

| Giai đoạn | Sprint | Thời gian | Kết quả FE | Bước |
|---|---|---|---|---|
| **GĐ0** — Nền tảng | S1–S2 | 28/09–11/10 | Dự án Next.js, design system, `api-client`, layout, trang công khai, mockup Đợt 1 | F0.1–F0.6 |
| **Đợt 1** — Tài khoản & nội dung | S3–S4 | 12/10–25/10 | Đăng ký/đăng nhập, onboarding, hồ sơ, thư viện, bộ/thẻ, CSV | F1.1–F1.12 |
| **Đợt 2** — Học & luyện | S5–S6 | 26/10–08/11 | Hôm nay học gì, flashcard SRS, luyện tập, sổ tay, thống kê, quản trị nền | F2.1–F2.8 |
| **Đợt 3** — AI & mở rộng | S7–S9 | 09/11–29/11 | Xưởng thẻ AI, viết câu, phát âm, thành tích, thông báo, kiểm duyệt, vận hành | F3.1–F3.11 |
| **GĐ4** — Kiểm thử | S10 | 30/11–06/12 | E2E, responsive, tiếp cận, lỗi mạng | F4.1–F4.4 |
| **GĐ5** — Bàn giao | S11 | 07/12–14/12 | Build production, dữ liệu demo, hướng dẫn, diễn tập | F5.1–F5.4 |

Mỗi giai đoạn bắt đầu bằng việc đọc `report/<PHASE>_BAO_CAO_FE.md` của BE (API đã kiểm chứng + hợp đồng "Sắp có" để mock trước).

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
    │   ├── schemas/             # Zod theo module, giới hạn = BE
    │   └── format.js            # ngày giờ theo múi giờ người học, số liệu
    ├── hooks/                   # useMe, useDecks, useStudySession…
    ├── mocks/                   # MSW handlers theo module (dữ liệu thật từ báo cáo FE)
    └── styles/                  # tokens.css (copy từ mockups/shared), globals.css
```

**Quy tắc:** logic SRS, chấm điểm, điểm thưởng **chỉ ở BE** (TK §11.2); FE chỉ hiển thị kết quả server trả. Không để khóa dịch vụ trong biến `NEXT_PUBLIC_*`.

## GĐ0 — Nền tảng (S1–S2 · 28/09–11/10)

### [ ] F0.1 Khởi tạo dự án
- `frontend/` Next.js App Router, ESLint + Prettier, alias `@/`, `.env.example` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MOCKING`).
- Thư mục: `app/(public)`, `app/(auth)`, `app/(app)`, `app/quan-tri`, `components/ui`, `components/<module>`, `lib`, `mocks`.
- **Xong khi:** `npm run dev` chạy, trang `/` hiển thị.

### [ ] F0.2 Design system & UI kit — TK §9.8
- Token màu (chàm chủ đạo, xanh lá thành công, hổ phách cảnh báo, đỏ lỗi), font, khoảng cách, bo góc, bóng.
- Thành phần: Button, Input, Select, Checkbox, Textarea, Card, Modal, Drawer, Toast, Tabs, Badge, Skeleton, EmptyState, ErrorState (có nút thử lại), Pagination, ConfirmDialog.
- **Xong khi:** trang `/_ui` liệt kê đủ thành phần; tương phản đạt; điều hướng được bằng bàn phím.

### [ ] F0.3 api-client, Query, MSW
- `api-client.js`, `ApiError`, `applyServerErrors`, `QueryClient` xử lý 401 toàn cục (GĐ0 report §6). MSW handlers nền.
- **Xong khi:** `GET /public/ping` chạy với cả MSW và BE thật.

### [x] F0.4 Layout & bảo vệ route
- `PublicLayout` (header, footer), `AppShell` (sidebar desktop, bottom nav mobile), `AdminLayout`.
- Guard: chưa đăng nhập → `/dang-nhap?next=`; không phải ADMIN → trang 403; chưa onboarding → `/bat-dau`.
- **Xong khi:** responsive 360px không tràn ngang.

### [x] F0.5 Trang công khai tĩnh — UI01, UI04, UI05
- Giới thiệu, cách học, hướng dẫn, FAQ, chính sách quyền riêng tư, điều khoản.

### [x] F0.6 Mockup Đợt 1 — UI02–UI17, UI40–UI43, UI48 (ko cần thiết)
- `/ui-mockup` cho từng màn, nối API thật khi đã có.

## Đợt 1 — Tài khoản & nội dung (S3–S4 · 12/10–25/10) · FR-01…05

### [ ] F1.1 Đăng ký & xác thực email — UI06, UI07 ← B1.1
- Form email, mật khẩu, tên hiển thị, chấp nhận điều khoản; 409 hiện lỗi dưới ô email; 429 khóa nút.
- `/xac-thuc-email?token=` tự gọi xác thực; `TOKEN_INVALID` → nút "Gửi lại email".

### [ ] F1.2 Đăng nhập, đăng xuất, phiên — UI08 ← B1.2
- Sau đăng nhập gọi lại `/auth/csrf`, `useMe()` làm nguồn thông tin người dùng; lỗi chưa xác thực email / bị khóa có thông báo riêng.

### [ ] F1.3 Mật khẩu — UI09, UI10, UI42 ← B1.3
- Quên mật khẩu luôn hiện cùng một thông báo; đặt lại xong chuyển `/dang-nhap`.

### [ ] F1.4 Đăng nhập Google ← B1.4
- Nút Google trên UI06/UI08; trường hợp email trùng chưa liên kết → hướng dẫn đăng nhập mật khẩu rồi liên kết.

### [ ] F1.5 Khởi đầu, hồ sơ, thiết lập — UI11, UI40, UI41, UI43 ← B1.5
- Onboarding nhiều bước: mục tiêu (Giao tiếp/TOEIC), trình độ **tự đánh giá**, chủ đề, phút/ngày, từ mới/ngày, giờ nhắc, múi giờ (mặc định theo trình duyệt).

### [ ] F1.6 Tải tệp & ảnh đại diện ← B1.6
- Component `FileUpload`: xin URL ký → PUT trực tiếp lên S3 (đúng `Content-Type`) → `complete`; kiểm tra loại/dung lượng trước khi gửi (ảnh ≤ 2 MB, âm thanh ≤ 5 MB).

### [ ] F1.7 Thư viện & chi tiết bộ công khai — UI02, UI03 ← B1.7, B1.10
- Tìm, lọc (chủ đề, trình độ, mục tiêu, nguồn), sắp xếp, phân trang lưu trên URL; nhãn "Bộ mẫu"/"Người học chia sẻ"; nút "Sao chép liên kết"; bộ khởi động gợi ý ở cuối UI11.

### [ ] F1.8 Bộ của tôi — UI13, UI14 ← B1.8
- Danh sách, yêu thích, tạo/sửa (công khai/riêng tư), xóa có xác nhận; 409 `VERSION_CONFLICT` → tải lại.

### [ ] F1.9 Thẻ & biên tập thẻ — UI15, UI16 ← B1.9, B1.6
- Trường: từ, từ loại, nghĩa, IPA, ví dụ, bản dịch, độ khó, nguồn, nhãn, ảnh, âm thanh; cảnh báo trùng (không chặn); xem trước thẻ.

### [ ] F1.10 Sao chép bộ ← B1.11
- Gửi `Idempotency-Key` sinh một lần cho mỗi lần bấm; chuyển tới bộ mới.

### [ ] F1.11 CSV — UI17 ← B1.12
- Chọn tệp (≤ 1 MB, ≤ 1000 dòng) → xem trước → bảng lỗi từng dòng, đánh dấu trùng → chọn dòng → commit → kết quả; nút xuất CSV.

### [ ] F1.12 Quản trị chủ đề & nhãn — UI48 ← B1.7
- **Cuối Đợt 1:** demo vòng quản lý nội dung; nhận `report/DOT1_BAO_CAO_FE.md`.

## Đợt 2 — Học & luyện (S5–S6 · 26/10–08/11) · FR-06, 07, 08, 11, 13

### [ ] F2.1 Hôm nay học gì? — UI12 ← B2.2
- Đến hạn, quá hạn, mới còn lại, mục tiêu, chuỗi ngày; nút 5/10/20 phút; một hành động chính.

### [ ] F2.2 Phiên học flashcard — UI18, UI19 ← B2.3, B2.4
- Chọn bộ, chiều (Anh–Việt / Việt–Anh), thời gian; lật thẻ (Space), đánh giá Quên/Khó/Nhớ/Dễ (phím 1–4, không kích hoạt khi đang gõ) kèm giải thích.
- Mỗi lượt sinh `clientEventId` một lần, lưu tạm hàng đợi chưa đồng bộ, gửi lại cùng khóa khi mất mạng; 409 → tải trạng thái mới.
- Hết giờ: cho hoàn tất thẻ đang học rồi kết thúc.

### [ ] F2.3 Tổng kết, tiến độ, lịch sử — UI20, UI21 ← B2.5
- Tổng kết khớp lịch sử; bảng thẻ theo trạng thái (mới, đang học, đến hạn, quá hạn, tạm ngưng); tạm ngưng/khôi phục/đặt lại có xác nhận.

### [ ] F2.4 Cứu lịch ôn — UI22 ← B2.6
- "Có N thẻ cần ôn; hôm nay bạn có X phút" + lộ trình chia ngày; ghi rõ là ước tính.

### [ ] F2.5 Luyện tập — UI23–UI26 ← B2.7, B2.8
- 8 dạng: chọn nghĩa, chọn từ, ghép, điền chỗ trống, nhập từ theo nghĩa, nghe viết, phân biệt cặp nhầm, tổng hợp.
- Đề không có đáp án; nộp một lần với `submitKey`; kết quả + giải thích; luyện lại câu sai; lịch sử.

### [ ] F2.6 Sổ tay từ khó & cặp nhầm — UI27 ← B2.9

### [ ] F2.7 Thống kê nền — UI35 ← B2.10
- Biểu đồ theo ngày (múi giờ người học), tỷ lệ đúng, mức làm chủ theo kỹ năng; thiếu dữ liệu → "Chưa đủ dữ liệu".

### [ ] F2.8 Quản trị nền — UI47, UI49, UI53 ← B2.11
- Tìm, khóa/mở tài khoản (bắt buộc lý do), cấp/thu vai trò; bộ/thẻ mẫu xuất bản/ẩn; nhật ký.
- **Cuối Đợt 2:** demo học đầu-cuối; nhận `report/DOT2_BAO_CAO_FE.md`.

## Đợt 3 — AI, phát âm, động lực (S7–S9 · 09/11–29/11) · FR-08…14

### [ ] F3.1 Xưởng thẻ AI — UI29 ← B3.1, B3.2
- Trái đoạn văn, phải thẻ nháp: chọn, sửa, nghe, cảnh báo trùng, liên kết đoạn nguồn; 202 → hỏi trạng thái định kỳ; "Lưu N thẻ đã chọn" với `Idempotency-Key`.

### [ ] F3.2 Giải thích ngữ cảnh & viết câu — UI30, UI31 ← B3.3
- Không render HTML từ AI; hiển thị câu gốc, bản sửa, lỗi, giải thích tiếng Việt; nút báo cáo đầu ra sai.

### [ ] F3.3 Lịch sử AI & hạn mức — UI32 ← B3.3
- Hết hạn mức (429) hiển thị thời điểm được dùng lại; AI lỗi không chặn học.

### [ ] F3.4 Gợi ý có lý do — UI28 ← B3.5
- Hiển thị mã lý do + minh chứng ("sai 3/5 lượt gần đây") + liên kết tới các lượt liên quan.

### [ ] F3.5 Góc phát âm — UI33, UI34 ← B3.4
- Nghe mẫu; xin quyền micro khi bấm ghi; ghi ≤ 15 giây, phát lại, ghi lại; gửi; chỉ hiện chỉ số có thật; so sánh trước–sau; xóa bản ghi.

### [ ] F3.6 Động lực — UI38, UI54 ← B3.6
- Điểm, chuỗi ngày, huy hiệu, thử thách, lịch sử thưởng; quản trị huy hiệu/thử thách.

### [ ] F3.7 Thông báo — UI39, UI52 ← B3.7
- Chuông có số chưa đọc, trang thông báo, đánh dấu đã đọc; quản trị gửi thông báo hệ thống.

### [ ] F3.8 Báo cáo & kiểm duyệt — UI45, UI50 ← B3.8
- Hộp báo cáo (lý do + mô tả) trên bộ/thẻ/đầu ra AI; hàng đợi xử lý: giữ/ẩn/yêu cầu sửa/từ chối kèm lý do.

### [ ] F3.9 Tổng kết tuần & bản đồ làm chủ — UI36, UI37 ← B3.9, B2.10
- Màu không phải dấu hiệu duy nhất; không tô xanh khi mới đúng một lần.

### [ ] F3.10 Dữ liệu & xóa tài khoản — UI44 ← B3.10
- Xác nhận hai bước, hiển thị trạng thái xử lý.

### [ ] F3.11 Quản trị vận hành — UI46, UI51, UI53 ← B3.11
- Tổng quan, hạn mức/sử dụng/chi phí ("Chưa xác định" khi chưa có đơn giá), tác vụ nền, yêu cầu xóa dữ liệu.
- **Cuối Đợt 3:** demo 10 bước TK §20.2; nhận `report/DOT3_BAO_CAO_FE.md`.

## GĐ4 — Kiểm thử & ổn định (S10 · 30/11–06/12)

### [ ] F4.1 E2E Playwright cho kịch bản demo TK §20.2
### [ ] F4.2 Responsive 360px, bàn phím, focus, tương phản, giảm chuyển động — TC-18
### [ ] F4.3 Mạng chậm / API lỗi: không mất kết quả đã lưu, thử lại rõ ràng — TC-18
### [ ] F4.4 Lighthouse, kích thước bundle, không lộ khóa dịch vụ trong bundle

## GĐ5 — Triển khai & bàn giao (S11 · 07/12–14/12)

### [ ] F5.1 Build production sau Nginx cùng domain với API (cùng B5.1)
### [ ] F5.2 Kiểm tra mọi màn hình với dữ liệu demo (B5.2)
### [ ] F5.3 Hướng dẫn sử dụng có ảnh chụp trong `huong-dan/`
### [ ] F5.4 Diễn tập demo 8–10 phút

## Definition of Done (mọi bước F)

- [ ] Giống mockup; có trạng thái tải (skeleton), rỗng (kèm bước tiếp theo), lỗi (kèm thử lại), xác nhận sau khi lưu.
- [ ] Chạy với API thật; giới hạn Zod = giới hạn BE; lỗi `fieldErrors` hiện đúng ô.
- [ ] Responsive 360px; dùng được bằng bàn phím; nhãn form đầy đủ.
- [ ] Không render HTML chưa làm sạch; không để khóa dịch vụ trong code FE.
- [ ] Tick checkbox bước trong file này.
