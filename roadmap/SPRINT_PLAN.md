# KẾ HOẠCH SPRINT — VocabLearning (VocabFlow) · BE + FE thống nhất

> Nguồn: `docs/PHAN_TICH_THIET_KE_HE_THONG_HOC_TU_VUNG_K28.md` (**TK**: §3 quyền, §4 chức năng, §5 FR, §6 luồng, §7 SRS, §8 luyện tập, §9 trải nghiệm, §10 màn hình, §13 API, §18 mốc, §19 TC, §20 demo), `docs/– Chức năng đối với User.txt`, `roadmap/ROADMAP_BE.md` (bước **B**), `roadmap/ROADMAP_FE.md` (bước **F**).
> Thời gian: **28/09/2026 – 14/12/2026**, 11 sprint × 1 tuần (thứ Hai → Chủ nhật). Mốc giai đoạn giữ đúng TK §18.1.

---

## 1. Tổng quan

| Sprint | Thời gian | Giai đoạn | Mục tiêu sprint | BE | FE | FR / TC | Mốc |
|---|---|---|---|---|---|---|---|
| **S1** | 28/09–04/10 | GĐ0 | Chốt yêu cầu, SRS, màn hình; dựng nền BE/FE | B0.1–B0.5 ✅ | F0.1–F0.3 | — | Chốt phạm vi, bảng SRS §7.2 |
| **S2** | 05/10–11/10 | GĐ0 | Hợp đồng API chung, Swagger, test nền; FE layout + mockup Đợt 1 | B0.6–B0.8 ✅ | F0.4–F0.6 | — | 📦 `report/GD0_BAO_CAO_FE.md` ✅ |
| **S3** | 12/10–18/10 | Đợt 1 | Tài khoản & hồ sơ chạy thật | B1.1–B1.6 | F1.1–F1.6 | FR-01, 02 · TC-01 | |
| **S4** | 19/10–25/10 | Đợt 1 | Bộ/thẻ, thư viện, sao chép, CSV | B1.7–B1.12 | F1.7–F1.12 | FR-03, 04, 05 · TC-02, 03, 04 | 🎯 **Demo Đợt 1** (25/10): vòng quản lý nội dung · 📦 `DOT1` |
| **S5** | 26/10–01/11 | Đợt 2 | Học SRS đầu-cuối | B2.1–B2.6 | F2.1–F2.4 | FR-06 · TC-05…10 | |
| **S6** | 02/11–08/11 | Đợt 2 | Luyện tập, sổ tay, thống kê nền, quản trị nền | B2.7–B2.11 | F2.5–F2.8 | FR-07, 08, 11, 13 · TC-11, 17 | 🎯 **Demo Đợt 2** (08/11): học đầu-cuối · 📦 `DOT2` |
| **S7** | 09/11–15/11 | Đợt 3 | AI: tác vụ nền, hạn mức, xưởng thẻ, viết câu, gợi ý | B3.1–B3.3, B3.5 | F3.1–F3.4 | FR-08, 09 · TC-12, 13 | |
| **S8** | 16/11–22/11 | Đợt 3 | Phát âm, điểm thưởng, thông báo/nhắc | B3.4, B3.6, B3.7 | F3.5–F3.7 | FR-10, 12 · TC-14, 15 | |
| **S9** | 23/11–29/11 | Đợt 3 | Kiểm duyệt, tổng kết tuần, xóa dữ liệu, quản trị vận hành | B3.8–B3.11 | F3.8–F3.11 | FR-11, 13, 14 · TC-16, 17 | 🎯 **Demo Đợt 3** (29/11): đủ chức năng · 📦 `DOT3` |
| **S10** | 30/11–06/12 | GĐ4 | Kiểm thử nghiệm thu, bảo mật, hiệu năng, sao lưu | B4.1–B4.5 | F4.1–F4.4 | TC-01…20 | 📦 `GD4` · Biên bản test/đo |
| **S11** | 07/12–14/12 | GĐ5 | Triển khai, dữ liệu demo, tài liệu, diễn tập | B5.1–B5.4 | F5.1–F5.4 | — | 🏁 **Bàn giao** (14/12) · 📦 `GD5` |

**Tình trạng hiện tại (29/09):** BE đã xong GĐ0 (B0.1–B0.8), B1.1 và B1.2, 42 test xanh → **BE vượt ~2 tuần**. FE chưa khởi tạo Next.js (chi tiết: `bao-cao-tien-do-BE/BAO_CAO_TIEN_DO_BE.md`). Dùng phần dư của S1–S2 để làm sớm B1.1–B1.6, giúp FE có API thật từ đầu S3. Không dời mốc demo.

---

## 2. Nhịp sprint (áp dụng cho mọi sprint)

| Ngày | BE | FE | Chung |
|---|---|---|---|
| Thứ Hai | Nhận bước B, đọc TK | Nhận bước F, mockup (`/ui-mockup`) nếu chưa có | Planning 30′: chốt phạm vi sprint |
| Thứ Tư | API xong + test xanh + Swagger + `/postman-sync` | Dựng màn hình bằng MSW theo hợp đồng | BE gửi hợp đồng API (mục "Sắp có" của báo cáo trước) |
| Thứ Sáu | Sửa lỗi tích hợp | Tắt MSW, nối API thật | Tích hợp + demo nội bộ 15′ |
| Chủ nhật | Tick roadmap, cập nhật `bao-cao-tien-do-BE/` | Tick roadmap FE | Retro ngắn; cuối giai đoạn chạy `/fe-report <PHASE>` |

**Quy ước thống nhất BE ↔ FE** (chi tiết: `report/GD0_BAO_CAO_FE.md` §3)
- `/api/v1`, JSON camelCase với **tên trường = tên field entity** (tiếng Việt không dấu: `tenHienThi`, `trangThai`, `muiGio`; không có trong entity thì chọn tên gần nhất: `password`, `token`), ID dạng string, thời gian ISO-8601 UTC, phân trang `{items, page, size, totalElements, totalPages}`.
- Lỗi `{code, message, fieldErrors, requestId}`; 401 → `/dang-nhap?next=`, 403 CSRF → lấy token rồi thử lại 1 lần, 404 cả với dữ liệu riêng của người khác.
- Cookie `SESSION` + CSRF `X-XSRF-TOKEN`; ghi kết quả học dùng `clientEventId`, nộp bài dùng `submitKey`, sao chép/commit dùng `Idempotency-Key`.
- Giới hạn validate FE (Zod) = giới hạn BE (Bean Validation) — lấy từ báo cáo FE của giai đoạn.
- Route FE tiếng Việt (mục 5); tên API tiếng Anh (TK §13.2).

**Definition of Done chung của một sprint**
- [ ] Mọi bước B của sprint: compile, test xanh, Swagger + Postman cập nhật.
- [ ] Mọi bước F của sprint: màn hình giống mockup, chạy với API thật, có trạng thái tải/rỗng/lỗi (TK §9.8), responsive 360px.
- [ ] Luồng chính của sprint chạy đầu-cuối trên `docker compose --profile app` + Next.js.
- [ ] Không còn lỗi chặn (blocker) mở; lỗi còn lại ghi vào backlog sprint sau.

---

## 3. Chi tiết từng sprint

### S1 · 28/09–04/10 · Chốt yêu cầu & nền tảng
| Loại | Việc | Kết quả kiểm được |
|---|---|---|
| Phân tích | Chốt phạm vi P0/P1, ma trận quyền (TK §3.2), bảng SRS (§7.2), danh mục màn hình (mục 5), câu hỏi mở §2.4 | Biên bản chốt với GVHD |
| BE | ✅ B0.1 project, B0.2 Docker Compose, B0.3 Flyway V1 + seed, B0.4 lỗi chung, B0.5 bảo mật nền | 14 test xanh |
| FE | F0.1 khởi tạo Next.js · F0.2 design system + UI kit · F0.3 `api-client` + TanStack Query + MSW | `GET /public/ping` gọi được qua `api-client` |

### S2 · 05/10–11/10 · Hợp đồng chung & mockup Đợt 1
| Loại | Việc | Kết quả kiểm được |
|---|---|---|
| Phân tích | Chốt mô hình dữ liệu (TK §12), API (§13), wireframe, dữ liệu mẫu, kế hoạch kiểm thử | ERD + danh sách API trong Swagger |
| BE | ✅ B0.6 OpenAPI, B0.7 Testcontainers, B0.8 S3 + Mail · ➕ làm sớm B1.1–B1.3 | 25 test xanh; báo cáo GD0 |
| FE | F0.4 layout + route guard · F0.5 trang công khai tĩnh · F0.6 mockup UI06–UI17 | Mockup Đợt 1 mở được, gọi API ping |

### S3 · 12/10–18/10 · Tài khoản & hồ sơ — FR-01, FR-02
| BE | API | FE | Màn hình |
|---|---|---|---|
| B1.1 Đăng ký & xác thực email | `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification` | F1.1 | UI06 `/dang-ky`, UI07 `/xac-thuc-email` |
| B1.2 Đăng nhập/đăng xuất/phiên | `POST /auth/login`, `/auth/logout`, `GET /me` | F1.2 | UI08 `/dang-nhap`, menu người dùng |
| B1.3 Quên/đặt lại/đổi mật khẩu | `POST /auth/forgot-password`, `/auth/reset-password`, `PUT /me/password` | F1.3 | UI09 `/quen-mat-khau`, UI10 `/dat-lai-mat-khau`, UI42 `/ca-nhan/bao-mat` |
| B1.4 Google | `GET /auth/google/start`, `/auth/google/callback` | F1.4 | Nút Google trên UI06/UI08 |
| B1.5 Hồ sơ & thiết lập | `PATCH /me`, `GET/PUT /me/learning-settings`, `GET/PUT /me/notification-settings` | F1.5 | UI11 `/bat-dau`, UI40 `/ca-nhan`, UI41 `/ca-nhan/hoc-tap`, UI43 `/ca-nhan/thong-bao` |
| B1.6 Tệp & ảnh đại diện | `POST /files/upload-requests`, `/files/{id}/complete`, `DELETE /files/{id}` | F1.6 | Component tải tệp, ảnh đại diện trên UI40 |

**Xong khi:** TC-01 qua; đăng ký → mail Mailpit → xác thực → đăng nhập → onboarding → đổi ảnh đại diện chạy trên giao diện thật.

### S4 · 19/10–25/10 · Nội dung — FR-03, FR-04, FR-05
| BE | API | FE | Màn hình |
|---|---|---|---|
| B1.7 Chủ đề/nhãn/trình độ | `GET /public/topics`, CRUD `/admin/topics`, `/admin/tags` | F1.12 | UI48 `/quan-tri/chu-de` |
| B1.8 Bộ thẻ cá nhân | `GET/POST /decks`, `GET/PATCH/DELETE /decks/{id}`, `PUT/DELETE /decks/{id}/favorite` | F1.8 | UI13 `/bo-the`, UI14 `/bo-the/tao`, `/bo-the/[id]/sua` |
| B1.9 Thẻ từ vựng | `GET/POST /decks/{id}/cards`, `PATCH/DELETE /cards/{id}` | F1.9 | UI15 `/bo-the/[id]`, UI16 `/bo-the/[id]/the/tao`, `/the/[id]/sua` |
| B1.10 Thư viện công khai | `GET /library/decks`, `GET /library/decks/{id}` | F1.7 | UI02 `/thu-vien`, UI03 `/thu-vien/[id]` (link chia sẻ), gợi ý bộ khởi động ở UI11 |
| B1.11 Sao chép bộ | `POST /decks/{id}/copy` + `Idempotency-Key` | F1.10 | Nút "Sao chép" trên UI03 |
| B1.12 CSV | `POST /decks/{id}/imports/preview`, `POST /imports/{id}/commit`, `GET /decks/{id}/export` | F1.11 | UI17 `/bo-the/[id]/nhap-csv` |

**Xong khi:** TC-02, 03, 04 qua. **Demo Đợt 1:** Visitor xem thư viện → User sao chép bộ TOEIC → sửa thẻ, thêm ảnh → nhập CSV có dòng lỗi → xuất CSV.

### S5 · 26/10–01/11 · Học SRS — FR-06
| BE | API | FE | Màn hình |
|---|---|---|---|
| B2.1 Bộ tính SRS thuần | (unit test, không API) | — | — |
| B2.2 Kế hoạch hôm nay | `GET /learning/today` | F2.1 | UI12 `/hom-nay` (chọn 5/10/20 phút) |
| B2.3 Tạo phiên học | `POST /learning/sessions`, `GET /learning/sessions/{id}` | F2.2 | UI18 chọn chiều/thời gian |
| B2.4 Ghi kết quả ôn | `POST /learning/sessions/{id}/reviews` | F2.2 | UI19 `/hoc/[sessionId]` (lật thẻ, phím tắt 1–4/Space, trạng thái "đã lưu / chưa đồng bộ") |
| B2.5 Kết thúc, lịch sử, tạm ngưng/đặt lại | `POST /learning/sessions/{id}/finish`, `GET /learning/history`, `PUT /cards/{id}/progress/suspend`, `POST /cards/{id}/progress/reset` | F2.3 | UI20 tổng kết, UI21 `/bo-the/[id]/tien-do` |
| B2.6 Cứu lịch ôn | trong `GET /learning/today` | F2.4 | UI22 khối "Cứu lịch ôn" trên UI12 |

**Xong khi:** TC-05…TC-10 qua; học một thẻ hai chiều cho hai lịch khác nhau; gửi trùng và hai tab không làm hỏng tiến độ. Âm thanh thẻ tạm dùng tệp đã tải lên (B1.6) hoặc Web Speech API của trình duyệt đến khi có B3.4.

### S6 · 02/11–08/11 · Luyện tập, sổ tay, thống kê, quản trị — FR-07, 08, 11, 13
| BE | API | FE | Màn hình |
|---|---|---|---|
| B2.7 Tạo bài luyện | `POST /practice/sessions`, `GET /practice/sessions/{id}` | F2.5 | UI23 `/luyen-tap`, UI24 `/luyen-tap/[id]` (8 dạng bài) |
| B2.8 Nộp & chấm | `POST /practice/sessions/{id}/submissions`, `GET /practice/history`, `POST /practice/mistakes/retry` | F2.5 | UI25 kết quả + giải thích, UI26 `/luyen-tap/lich-su` |
| B2.9 Sổ tay & cặp nhầm | `GET /notebook`, `PUT/DELETE /notebook/{cardId}`, `GET /learning/confusing-pairs` | F2.6 | UI27 `/so-tay` |
| B2.10 Thống kê nền | `GET /statistics/overview`, `GET /statistics/skills` | F2.7 | UI35 `/thong-ke` |
| B2.11 Quản trị nền | `GET /admin/users`, `PATCH /admin/users/{id}/status`, `PUT /admin/users/{id}/roles`, CRUD `/admin/decks`, `/admin/cards`, `GET /admin/audit-logs` | F2.8 | UI47 `/quan-tri/tai-khoan`, UI49 `/quan-tri/bo-mau`, UI53 `/quan-tri/nhat-ky` |

**Xong khi:** TC-11, TC-17 qua. **Demo Đợt 2:** kế hoạch hôm nay → ôn hai chiều → tổng kết → luyện nghe viết sai một từ → sổ tay → thống kê → Admin khóa tài khoản có nhật ký.

### S7 · 09/11–15/11 · AI & gợi ý — FR-08, FR-09
| BE | API | FE | Màn hình |
|---|---|---|---|
| B3.1 Tác vụ nền & hạn mức | (hạ tầng `tac_vu_nen`, `QuotaService`) | — | — |
| B3.2 Tạo thẻ bằng AI | `POST /ai/card-drafts` (202), `GET /ai/requests/{id}`, `POST /ai/card-drafts/{id}/commit` | F3.1 | UI29 `/ai/xuong-the` (trái đoạn văn, phải thẻ nháp, "Lưu N thẻ đã chọn") |
| B3.3 Tác vụ AI khác | `POST /ai/context-explanations`, `/ai/sentence-feedback`, `/ai/exercise-drafts`, `GET /ai/history`, `GET /me/service-quota` | F3.2, F3.3 | UI30 giải thích ngữ cảnh (trên UI19/UI15), UI31 `/ai/viet-cau`, UI32 `/ai/lich-su` |
| B3.5 Gợi ý có lý do | `GET /learning/recommendations` | F3.4 | UI28 thẻ gợi ý trên UI12 và UI27 |

**Xong khi:** TC-12, TC-13 qua với `FakeAiClient`; tắt AI → học và bài cố định vẫn chạy.

### S8 · 16/11–22/11 · Phát âm, động lực, thông báo — FR-10, FR-12
| BE | API | FE | Màn hình |
|---|---|---|---|
| B3.4 Phát âm | `GET /cards/{id}/audio`, `POST /pronunciation/assessments`, `GET /pronunciation/assessments/{id}`, `GET /pronunciation/history`, `DELETE /pronunciation/recordings/{id}` | F3.5 | UI33 `/phat-am`, UI34 `/phat-am/lich-su`; nút nghe trên UI19 dùng audio thật |
| B3.6 Điểm, chuỗi, huy hiệu, thử thách | `GET /rewards/history`, `GET /badges`, `GET /challenges`, CRUD `/admin/badges`, `/admin/challenges` | F3.6 | UI38 `/thanh-tich`, chuỗi ngày trên UI12, UI54 `/quan-tri/dong-luc` |
| B3.7 Thông báo & nhắc học | `GET /notifications`, `PATCH /notifications/{id}`, `POST /admin/announcements` | F3.7 | UI39 chuông + `/thong-bao`, UI52 `/quan-tri/thong-bao` |

**Xong khi:** TC-14, TC-15 qua; micro bị từ chối có thông báo đúng; chạy lại job không cộng điểm/gửi mail trùng.

### S9 · 23/11–29/11 · Kiểm duyệt, tổng kết, dữ liệu cá nhân, vận hành — FR-11, 13, 14
| BE | API | FE | Màn hình |
|---|---|---|---|
| B3.8 Báo cáo & kiểm duyệt | `POST /reports`, `GET /admin/reports`, `POST /admin/reports/{id}/resolve` | F3.8 | UI45 hộp "Báo cáo" (bộ/thẻ/đầu ra AI), UI50 `/quan-tri/bao-cao` |
| B3.9 Tổng kết tuần | `GET /statistics/weekly-summary` | F3.9 | UI37 `/thong-ke/tuan`, UI36 `/thong-ke/ban-do` (bản đồ làm chủ) |
| B3.10 Xóa tài khoản | `POST /me/deletion-requests`, `GET /admin/deletion-requests` | F3.10 | UI44 `/ca-nhan/du-lieu` |
| B3.11 Quản trị vận hành | `GET/PUT /admin/service-quotas`, `GET /admin/service-usage`, `GET /admin/statistics`, `GET /admin/jobs` | F3.11 | UI46 `/quan-tri`, UI51 `/quan-tri/dich-vu`, UI53 tab "Tác vụ nền" |

**Xong khi:** TC-16, TC-17 qua. **Demo Đợt 3:** chạy đủ 10 bước TK §20.2 trên dữ liệu minh họa.

### S10 · 30/11–06/12 · Kiểm thử & ổn định — TC-01…20
| BE | FE | Kết quả |
|---|---|---|
| B4.1 Test tự động cho mỗi TC + bảng truy vết FR ↔ API ↔ TC | F4.1 E2E Playwright cho luồng demo (TK §20.2) | Bảng truy vết đủ 14 FR / 20 TC |
| B4.2 Rà soát bảo mật (`/security-review`) | F4.2 Responsive 360px, bàn phím, focus, tương phản, `prefers-reduced-motion` (TC-18) | Không lỗi mức cao |
| B4.3 Hiệu năng 50 User (TC-20) | F4.3 Mạng chậm/API lỗi: không mất kết quả đã lưu, nút thử lại (TC-18) | Báo cáo p95, tỷ lệ lỗi |
| B4.4 Sao lưu & khôi phục (TC-19) | F4.4 Lighthouse, kích thước bundle, không lộ khóa trong bundle | Biên bản khôi phục |
| B4.5 Log & giám sát | — | Log JSON có `requestId` |

### S11 · 07/12–14/12 · Triển khai & bàn giao
| BE | FE | Kết quả |
|---|---|---|
| B5.1 Compose production + Nginx cùng domain + HTTPS | F5.1 Build production Next.js sau Nginx `/` và `/api` | Một lệnh chạy toàn hệ thống |
| B5.2 Dữ liệu demo (1 Admin, 3 User, 6–10 bộ, 200–300 thẻ) | F5.2 Kiểm tra mọi màn hình với dữ liệu demo | Tài khoản demo trong `README.md` |
| B5.3 `openapi.json`, hướng dẫn cài đặt/vận hành | F5.3 Hướng dẫn sử dụng có ảnh chụp màn hình | `huong-dan/` đầy đủ |
| B5.4 Diễn tập demo | F5.4 Diễn tập demo, slide | Video/biên bản demo 8–10 phút |

---

## 4. Ma trận truy vết FR → Sprint

| FR | Nội dung | Mức | BE | FE | Sprint | TC |
|---|---|---|---|---|---|---|
| FR-01 | Tài khoản | P0 | B1.1–B1.4 | F1.1–F1.4 | S3 | TC-01 |
| FR-02 | Hồ sơ/kế hoạch | P0 | B1.5, B2.2 | F1.5, F2.1 | S3, S5 | TC-09 |
| FR-03 | Bộ/thẻ | P0 | B1.6–B1.9 | F1.6, F1.8, F1.9, F1.12 | S3, S4 | TC-02 |
| FR-04 | Thư viện/chia sẻ | P0 | B1.10, B1.11 | F1.7, F1.10 | S4 | TC-03 |
| FR-05 | CSV | P0 | B1.12 | F1.11 | S4 | TC-04 |
| FR-06 | SRS/phiên học | P0 | B2.1–B2.6 | F2.1–F2.4 | S5 | TC-05…10 |
| FR-07 | Bài cố định | P0 | B2.7, B2.8 | F2.5 | S6 | TC-11 |
| FR-08 | Từ khó/gợi ý | P1 | B2.9, B3.5 | F2.6, F3.4 | S6, S7 | — |
| FR-09 | AI | P1 | B3.1–B3.3 | F3.1–F3.3 | S7 | TC-12, 13 |
| FR-10 | Phát âm | P1 | B3.4 | F3.5 | S8 | TC-14 |
| FR-11 | Thống kê | P0/P1 | B2.10, B3.9 | F2.7, F3.9 | S6, S9 | TC-09 |
| FR-12 | Thưởng/nhắc | P1 | B3.6, B3.7 | F3.6, F3.7 | S8 | TC-15 |
| FR-13 | Quản trị | P0/P1 | B1.7, B2.11, B3.8, B3.11 | F1.12, F2.8, F3.8, F3.11 | S4, S6, S9 | TC-17 |
| FR-14 | Dữ liệu cá nhân | P1 | B3.10 | F3.10 | S9 | TC-16 |
| — | Phi chức năng | — | B4.1–B4.5 | F4.1–F4.4 | S10 | TC-18…20 |

---

## 5. Danh mục màn hình (UI ID ↔ route ↔ sprint)

| UI | Màn hình | Route | Quyền | Sprint |
|---|---|---|---|---|
| UI01 | Trang chủ giới thiệu | `/` | G | S2 |
| UI02 | Thư viện | `/thu-vien` | G | S4 |
| UI03 | Chi tiết bộ công khai (link chia sẻ) | `/thu-vien/[id]` | G | S4 |
| UI04 | Hướng dẫn & FAQ | `/huong-dan` | G | S2 |
| UI05 | Chính sách & điều khoản | `/chinh-sach`, `/dieu-khoan` | G | S2 |
| UI06 | Đăng ký | `/dang-ky` | G | S3 |
| UI07 | Xác thực email | `/xac-thuc-email` | G | S3 |
| UI08 | Đăng nhập (+ Google) | `/dang-nhap` | G | S3 |
| UI09 | Quên mật khẩu | `/quen-mat-khau` | G | S3 |
| UI10 | Đặt lại mật khẩu | `/dat-lai-mat-khau` | G | S3 |
| UI11 | Khởi đầu (mục tiêu, trình độ, chủ đề, thời gian, bộ khởi động) | `/bat-dau` | L | S3–S4 |
| UI12 | Hôm nay học gì? (dashboard) | `/hom-nay` | L | S5 |
| UI13 | Bộ của tôi & yêu thích | `/bo-the` | L | S4 |
| UI14 | Tạo/sửa bộ | `/bo-the/tao`, `/bo-the/[id]/sua` | O | S4 |
| UI15 | Chi tiết bộ + danh sách thẻ | `/bo-the/[id]` | O | S4 |
| UI16 | Biên tập thẻ (tệp, nhãn, cảnh báo trùng) | `/bo-the/[id]/the/tao`, `/the/[id]/sua` | O | S4 |
| UI17 | Nhập/xuất CSV | `/bo-the/[id]/nhap-csv` | O | S4 |
| UI18 | Chọn phiên học | `/hoc` | L | S5 |
| UI19 | Màn học flashcard | `/hoc/[sessionId]` | O | S5 |
| UI20 | Tổng kết phiên | `/hoc/[sessionId]/tong-ket` | O | S5 |
| UI21 | Tiến độ & lịch sử ôn | `/bo-the/[id]/tien-do` | O | S5 |
| UI22 | Cứu lịch ôn | khối trên `/hom-nay` | L | S5 |
| UI23 | Chọn dạng bài luyện | `/luyen-tap` | L | S6 |
| UI24 | Làm bài | `/luyen-tap/[id]` | O | S6 |
| UI25 | Kết quả, đáp án, giải thích | `/luyen-tap/[id]/ket-qua` | O | S6 |
| UI26 | Lịch sử bài luyện | `/luyen-tap/lich-su` | L | S6 |
| UI27 | Sổ tay từ khó & cặp nhầm | `/so-tay` | L | S6 |
| UI28 | Gợi ý có lý do | khối trên `/hom-nay`, `/so-tay` | L | S7 |
| UI29 | Xưởng thẻ AI | `/ai/xuong-the` | L | S7 |
| UI30 | Giải thích theo ngữ cảnh | ngăn bên trên UI15/UI19 | L | S7 |
| UI31 | Viết câu "dùng thử" | `/ai/viet-cau` | L | S7 |
| UI32 | Lịch sử AI & hạn mức | `/ai/lich-su` | L | S7 |
| UI33 | Góc phát âm | `/phat-am` | L | S8 |
| UI34 | Lịch sử phát âm | `/phat-am/lich-su` | L | S8 |
| UI35 | Thống kê tổng quan & kỹ năng | `/thong-ke` | L | S6 |
| UI36 | Bản đồ làm chủ | `/thong-ke/ban-do` | L | S9 |
| UI37 | Tổng kết tuần | `/thong-ke/tuan` | L | S9 |
| UI38 | Thành tích (điểm, huy hiệu, thử thách) | `/thanh-tich` | L | S8 |
| UI39 | Thông báo | chuông + `/thong-bao` | L | S8 |
| UI40 | Hồ sơ & ảnh đại diện | `/ca-nhan` | L | S3 |
| UI41 | Thiết lập học | `/ca-nhan/hoc-tap` | L | S3 |
| UI42 | Bảo mật (đổi mật khẩu) | `/ca-nhan/bao-mat` | L | S3 |
| UI43 | Thông báo & giờ nhắc | `/ca-nhan/thong-bao` | L | S3 |
| UI44 | Dữ liệu & xóa tài khoản | `/ca-nhan/du-lieu` | L | S9 |
| UI45 | Báo cáo nội dung (hộp thoại) | trên UI03/UI15/UI29 | L | S9 |
| UI46 | Quản trị — tổng quan | `/quan-tri` | A | S9 |
| UI47 | Quản trị — tài khoản & vai trò | `/quan-tri/tai-khoan` | A | S6 |
| UI48 | Quản trị — chủ đề & nhãn | `/quan-tri/chu-de` | A | S4 |
| UI49 | Quản trị — bộ/thẻ mẫu | `/quan-tri/bo-mau` | A | S6 |
| UI50 | Quản trị — hàng đợi báo cáo | `/quan-tri/bao-cao` | A | S9 |
| UI51 | Quản trị — hạn mức & sử dụng dịch vụ | `/quan-tri/dich-vu` | A | S9 |
| UI52 | Quản trị — thông báo hệ thống | `/quan-tri/thong-bao` | A | S8 |
| UI53 | Quản trị — nhật ký & tác vụ nền | `/quan-tri/nhat-ky` | A | S6, S9 |
| UI54 | Quản trị — huy hiệu & thử thách | `/quan-tri/dong-luc` | A | S8 |

Quyền: G khách · L đã đăng nhập · O chủ sở hữu · A Admin.

---

## 5b. Phân công đề xuất (TK §18.2 — điều chỉnh theo nhóm thật)

| Vai trò | Sprint trọng tâm | Phụ trách |
|---|---|---|
| Nhóm trưởng / BE chính | S1–S4, S10–S11 | Kiến trúc, tài khoản/phân quyền, tích hợp, triển khai (B0, B1.1–B1.6, B5) |
| TV2 — FE nội dung | S2–S4 | Design system, thư viện, bộ/thẻ, CSV, tệp, responsive (F0, F1) |
| TV3 — SRS | S5 | B2.1–B2.6 + F2.1–F2.4, kiểm thử công thức |
| TV4 — Luyện tập & thống kê | S6, S8–S9 | B2.7–B2.10, B3.6, B3.9 + F2.5–F2.7, F3.6, F3.9 |
| TV5 — AI & dịch vụ | S7–S9 | B3.1–B3.5, B3.7, B3.10 + F3.1–F3.5, F3.7 |

Mỗi PR có một người review khác module. Kiểm thử và tài liệu là việc chung.

---

## 6. Điểm đã thống nhất thêm (bổ sung cho đủ TK)

| Thiếu trong kế hoạch cũ | Bổ sung | Bước |
|---|---|---|
| Admin quản lý huy hiệu & thử thách (TK §4.2) | CRUD `/admin/badges`, `/admin/challenges` + UI54 | B3.6, F3.6 |
| Admin theo dõi yêu cầu xóa dữ liệu (TK §4.2) | `GET /admin/deletion-requests` | B3.10, F3.10 |
| Bộ khởi động sau onboarding (TK §6.1 bước 5) | `GET /library/decks` lọc theo mục tiêu/trình độ của User | B1.10, F1.7 |
| Chia sẻ liên kết bộ (TK §4.1) | Link công khai `/thu-vien/[id]`, nút "Sao chép liên kết" | B1.10, F1.7 |
| Trang giới thiệu/hướng dẫn/chính sách (TK §4.3) | Trang tĩnh FE | F0.5 |
| Nghe từ/câu trước khi có TTS | Âm thanh tải lên (B1.6) hoặc Web Speech API; thay bằng `GET /cards/{id}/audio` ở S8 | F2.2 → F3.5 |

## 7. Việc cần chốt với GVHD (TK §2.4) — hạn cuối S2

- [ ] "Sửa câu tiếng Việt": giữ thiết kế viết câu tiếng Anh, AI giải thích tiếng Việt?
- [ ] Bảng SRS §7.2 và trần 365 ngày.
- [ ] Nhà cung cấp AI và phát âm (OpenAI / Azure Speech), ngân sách, hạn mức mặc định.
- [ ] Chính sách xóa dữ liệu: thời hạn xử lý, dữ liệu đã chia sẻ.
- [ ] Trần điểm/ngày (đề xuất 100) và điều kiện chuỗi ngày (≥ 5 lượt hợp lệ).

## 8. Rủi ro theo sprint

| Sprint | Rủi ro | Phòng ngừa |
|---|---|---|
| S5 | SRS sai hoặc ghi trùng — lõi của đề tài | B2.1 làm và test đầu tiên với `Clock` cố định; B2.4 test đồng thời trước khi FE nối |
| S7 | Chưa có khóa AI / chi phí | `FakeAiClient` từ đầu S7; FE dựng bằng Fake, nối thật cuối sprint |
| S8 | API phát âm thiếu chỉ số | Chỉ số nullable; FE hiện "Chưa có dữ liệu"; dữ liệu giả gắn nhãn "Mô phỏng" |
| S9 | Dồn nhiều màn quản trị | Dùng chung bảng dữ liệu + bộ lọc admin từ S6 |
| S10 | Không kịp sửa lỗi | Đóng băng tính năng từ 30/11; chỉ sửa lỗi |
