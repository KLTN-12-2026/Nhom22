# Bảng truy vết FR ↔ API ↔ TC (B4.1)

Cập nhật 16/11/2026. Nguồn: TK §5 (FR), TK §19 (TC), controller trong `backend/k28/src/main/java`, test trong `backend/k28/src/test/java`. Mọi API có tiền tố `/api/v1`. Tên test theo mẫu `tcNN_…`, nên tìm test của một TC bằng `grep -rn "void tcNN_" backend/k28/src/test`.

## 1. FR ↔ API ↔ TC

| FR | Chức năng | API chính | TC |
|---|---|---|---|
| FR-01 | Tài khoản | `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/google/start`, `GET /auth/csrf`, `GET /me`, `PUT /me/password` | TC-01 |
| FR-02 | Hồ sơ, kế hoạch | `GET/PUT /me/learning-settings`, `GET/PUT /me/notification-settings`, `PUT/GET/DELETE /me/avatar`, `GET /learning/today` | TC-09 |
| FR-03 | Bộ, thẻ | `GET/POST /decks`, `GET/PATCH/DELETE /decks/{id}`, `PUT/DELETE /decks/{id}/favorite`, `GET/POST /decks/{id}/cards`, `PATCH/DELETE /cards/{id}`, `POST /files/upload-requests`, `POST /files/{id}/complete`, `GET/DELETE /files/{id}`, `GET /topics`, `GET /tags` | TC-02 |
| FR-04 | Thư viện, chia sẻ | `GET /library/decks`, `GET /library/decks/{id}`, `GET /library/decks/{id}/cards/{cardId}/files/{role}`, `POST /decks/{id}/copy` | TC-03 |
| FR-05 | CSV | `POST /decks/{id}/imports/preview`, `POST /imports/{id}/commit`, `GET /decks/{id}/export` | TC-04 |
| FR-06 | SRS, phiên học | `POST /learning/sessions`, `POST /learning/sessions/{id}/reviews`, `GET /learning/sessions/{id}`, `POST /learning/sessions/{id}/finish`, `GET /learning/history`, `GET /decks/{id}/progress`, `PUT /cards/{id}/progress/suspend`, `POST /cards/{id}/progress/reset`, kế hoạch cứu lịch | TC-05, TC-06, TC-07, TC-08, TC-09, TC-10 |
| FR-07 | Bài cố định | `POST /practice/sessions`, `GET /practice/sessions/{id}`, `GET /practice/sessions/{id}/questions/{questionId}/audio`, `POST /practice/sessions/{id}/submissions`, `GET /practice/history`, `POST /practice/mistakes/retry` | TC-11 |
| FR-08 | Từ khó, gợi ý | `GET /notebook`, `PUT/DELETE /notebook/{cardId}`, `GET /learning/confusing-pairs`, `GET /learning/recommendations` | TC-10 |
| FR-09 | AI | `POST /ai/card-drafts`, `POST /ai/card-drafts/{id}/commit`, `POST /ai/context-explanations`, `POST /ai/sentence-feedback`, `POST /ai/card-images`, `GET /ai/requests/{id}`, `GET /ai/history`, `GET /me/service-quota` | TC-12, TC-13 |
| FR-10 | Phát âm | `GET /cards/{id}/audio`, `POST /pronunciation/assessments`, `GET /pronunciation/assessments/{id}`, `GET /pronunciation/history`, `DELETE /pronunciation/recordings/{id}` | TC-14 |
| FR-11 | Thống kê | `GET /statistics/overview`, `GET /statistics/skills`, `GET /statistics/weekly-summary`, bảng điều khiển | TC-09 |
| FR-12 | Thưởng, nhắc | `GET /rewards/history`, `GET /badges`, `GET /challenges`, `GET /notifications`, `PATCH /notifications/{id}` | TC-15 |
| FR-13 | Quản trị | `GET /admin/users`, `PATCH /admin/users/{id}/status`, `PUT /admin/users/{id}/roles`, `/admin/decks*`, `/admin/cards/{id}`, `/admin/topics*`, `/admin/tags*`, `GET /admin/audit-logs`, `POST /reports`, `GET /admin/reports`, `POST /admin/reports/{id}/resolve`, `GET/PUT /admin/service-quotas`, `GET /admin/service-usage` | TC-17 |
| FR-14 | Dữ liệu cá nhân | `POST /me/deletion-requests`, `DELETE /pronunciation/recordings/{id}`, `DELETE /files/{id}` | TC-16 |
| FR-15 | Gói, thanh toán | `GET /billing/plans`, `GET /me/subscription`, `POST /billing/checkouts`, `GET /billing/vnpay/ipn`, `GET /billing/vnpay/return`, `GET /billing/transactions`, `GET /billing/transactions/{maDon}`, `GET /billing/transactions/{maDon}/receipt`, `GET /admin/payments`, `GET /admin/payments/{maDon}`, `GET /admin/subscriptions`, `PATCH /admin/subscriptions/{id}/expiry`, `POST /admin/subscriptions/expiry-check`, `GET /admin/plans`, `PUT /admin/plans/{ma}`, `GET /admin/revenue` | TC-21, TC-22, TC-23, TC-24 |

## 2. TC ↔ test tự động

Số trong ngoặc là số test `tcNN_…` trong lớp đó.

| TC | Nội dung (TK §19) | Lớp test | Kiểu |
|---|---|---|---|
| TC-01 | Token xác thực/đặt lại cũ, sai, dùng hai lần | `FR01RegisterTest` (9), `FR01LoginTest` (10), `FR01PasswordTest` (8), `FR01GoogleLoginTest` (9), `SecurityBaselineTest`, `RateLimiterTest`, `CurrentUserTest`, `GlobalExceptionHandlerTest` | Tự động |
| TC-02 | User A xem/sửa bộ riêng của B, kể cả ID con | `FR03DeckTest` (3), `FR03CardTest` (2), `CurrentUserTest`, `SecurityBaselineTest` | Tự động |
| TC-03 | Sao chép bộ công khai không mang tiến độ | `FR04DeckCopyTest` (15), `FR04LibraryTest` (8), `FR04LibraryMediaTest` (6), `FR04LibraryOnboardingTest` (2), `FR04LibrarySeedTest` (2) | Tự động |
| TC-04 | CSV sai cột, thiếu nghĩa, trùng, nguy hiểm | `FR05CsvTest` (13), `FR05CsvFormulaTest` (2), `FR05CsvSnapshotTest` (2) | Tự động |
| TC-05 | Một thẻ hai chiều độc lập | `FR06ReviewTest` (1) | Tự động |
| TC-06 | Chuỗi Nhớ 10 phút → 1 → 6 → 15 ngày | `FR06SrsCalculatorTest` (4) | Tự động |
| TC-07 | Quên, Khó lặp, tốt nghiệp học lại | `FR06SrsCalculatorTest` (2) | Tự động |
| TC-08 | Gửi lặp, hai tab phiên bản cũ | `FR06ReviewTest` (4) | Tự động |
| TC-09 | Đổi múi giờ, qua nửa đêm, hạn mức từ mới | `FR06TodayPlanTest` (3), `FR06StudySessionTest` (3), `FR06ReviewTest` (2), `FR06DashboardTest` (2), `FR11StatisticsTest` (2) | Tự động |
| TC-10 | Nghỉ dài, nhiều thẻ quá hạn | `FR06RescuePlanTest` (4), `RescuePlanTest` (3), `FR08RecommendationTest` (1) | Tự động |
| TC-11 | Sửa thẻ sau khi tạo bài luyện | `FR07PracticeSessionTest` (1), `FR07SubmissionTest` (1), `PracticeGeneratorTest` (3) | Tự động |
| TC-12 | AI sai schema, chèn chỉ dẫn, hết hạn mức, timeout | `CardDraftParserTest` (8), `FakeAiClientTest` (6), `FR09CardDraftTest` (9), `FR09AiTaskTest` (5), `FR09QuotaTest` (5), `FR09JobWorkerTest` (1) | Tự động |
| TC-13 | Chọn 3/8 thẻ AI, commit hai lần | `FR09CardDraftTest` (5), `CardDraftParserTest` (1) | Tự động |
| TC-14 | Micro/tệp sai, dịch vụ thiếu chỉ số hoặc lỗi | `FR10PronunciationTest` (5), `FR10TtsTest` (7), `AzureSpeechClientTest` (3) | Tự động |
| TC-15 | Thưởng/nhắc chạy lại tác vụ | `FR12RewardTest` (5), `FR12NotificationTest` (4), `StreakCalculatorTest` (8) | Tự động |
| TC-16 | Xóa bản ghi, yêu cầu xóa tài khoản | `FR14AccountDeletionTest` (2) | Tự động |
| TC-17 | Admin cuối tự bỏ quyền, nhật ký | `FR13AdminTest` (3) | Tự động |
| TC-18 | Điện thoại, bàn phím, mạng chậm, API lỗi | — | Thủ công trên FE (B5.4) |
| TC-19 | Khôi phục từ bản sao lưu | `backend/k28/scripts/backup.sh`, `restore.sh` | Biên bản [TC19_BIEN_BAN_SAO_LUU_KHOI_PHUC.md](kiem-thu/TC19_BIEN_BAN_SAO_LUU_KHOI_PHUC.md) |
| TC-20 | Tải 50 người dùng | `backend/k28/scripts/k6/tc20.js` | Biên bản [TC20_BIEN_BAN_HIEU_NANG.md](kiem-thu/TC20_BIEN_BAN_HIEU_NANG.md) |
| TC-21 | IPN/return sai chữ ký, số tiền, lặp, người khác, hết hạn | `FR15BillingTest` (4) | Tự động |
| TC-22 | Chưa mua gói, hết hạn, vượt giới hạn | `FR15BillingTest` (4), `FR15EntitlementTest` (2) | Tự động |
| TC-23 | Còn 8/7/3/0 ngày, chạy nhiều lần, Admin sửa hạn | `FR15SubscriptionExpiryTest` (3), `FR15AdminBillingTest` (1); HTTP thật `scripts/smoke_billing_expiry.py` | Tự động |
| TC-24 | Doanh thu tháng/quý/năm, ranh giới 31/03 23:30 | `FR15AdminBillingTest` (1) | Tự động |

## 3. Cách chạy

```bash
cd backend/k28
./mvnw -B test
./mvnw -B test -Dtest='FR15*Test'
```

Test tích hợp dùng Testcontainers (MySQL, Redis), cần Docker đang chạy.
