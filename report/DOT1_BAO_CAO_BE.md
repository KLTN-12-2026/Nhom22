# Báo cáo backend Đợt 1 — Tài khoản và nội dung

| Mục | Giá trị |
|---|---|
| Cập nhật | 04/10/2026 |
| Phạm vi | B1.1–B1.12; kết quả đã có đến B1.8 |
| Lịch theo đề cương | 12/10–25/10/2026; các bước đã triển khai trước lịch |
| Nhánh làm việc | huynh_gia_pho_be |
| Trạng thái | B1.1–B1.7 hoàn thành theo roadmap; B1.8 đã triển khai, còn thiếu kiểm chứng; B1.9–B1.12 chưa triển khai |
| Công nghệ | Spring Boot 4, Java 21, MySQL 8.4, Redis, RustFS/S3, Mailpit, Lombok, MapStruct |

Báo cáo này ghi triển khai và bằng chứng kiểm chứng BE, theo quy ước mới thay cho việc ghi tiếp vào báo cáo tiến độ cũ. Hợp đồng bàn giao FE giữ riêng tại [DOT1_BAO_CAO_FE.md](DOT1_BAO_CAO_FE.md). Không chạy lại build/test hoặc các bước HTTP đã được yêu cầu bỏ qua để lập báo cáo này.

## 1. Trạng thái từng bước

| Bước | FR/TC theo roadmap | Triển khai | Bằng chứng hiện có | Phần còn lại |
|---|---|---|---|---|
| B1.1 Đăng ký, xác thực email | FR-01, TC-01 | Hoàn thành | FR01RegisterTest: 8 test xanh theo ghi nhận trước | Không chạy lại trong lần lập báo cáo |
| B1.2 Đăng nhập, phiên, đăng xuất | FR-01 | Hoàn thành | FR01LoginTest: 9 test xanh theo ghi nhận trước | Không chạy lại trong lần lập báo cáo |
| B1.3 Mật khẩu | FR-01, TC-01 | Hoàn thành | FR01PasswordTest: 8 test xanh theo ghi nhận trước | Không chạy lại trong lần lập báo cáo |
| B1.4 Google | FR-01 | Hoàn thành theo roadmap | FR01GoogleLoginTest: 9 test xanh; thử thật đến màn chọn tài khoản và nhánh OAUTH_LINK_REQUIRED | Liên kết bằng mật khẩu được ghi nhận bằng test, chưa xác nhận toàn luồng Google thật |
| B1.5 Hồ sơ, thiết lập | FR-02 | Hoàn thành | FR02SettingsTest: 7 test xanh; gọi HTTP các nhánh theo ghi nhận trước | Chủ đề yêu thích đã bổ sung tại B1.7 |
| B1.6 Tệp, ảnh đại diện | FR-03 | Hoàn thành 02/10/2026 | 22 test FR-03 và 13 hồi quy, tổng 35 pass ở lần kiểm chứng đó | Không xem kết quả cũ là lần chạy toàn suite hiện tại |
| B1.7 Danh mục, chủ đề yêu thích | FR-03, FR-13 | Hoàn thành 03/10/2026 | FR03CatalogTest 10/10; 62 lượt HTTP đạt kỳ vọng | Chưa kiểm chứng race đồng thời và một số tham chiếu nội dung; audit log chưa thuộc bước này |
| B1.8 Bộ thẻ cá nhân | FR-03, TC-02 | 7 API đã triển khai | 6a: 8/8; 6b: 26/26 HTTP, tổng 34/34 ngày 04/10/2026 | Test tự động chưa xác nhận; HTTP xóa mềm thành công/bảo toàn tham chiếu chưa chạy |
| B1.9 Thẻ | FR-03, TC-02 | Chưa triển khai | Chưa có kết quả | CRUD thẻ, quyền trên bộ cha, nhãn/tệp, cảnh báo trùng |
| B1.10 Thư viện | FR-04 | Chưa triển khai | Chưa có kết quả | Danh sách/chi tiết công khai, lọc và sắp xếp |
| B1.11 Sao chép bộ | FR-04, TC-03 | Chưa triển khai | Chưa có kết quả | Idempotency-Key, tạo bộ/thẻ mới, giữ bộ nguồn |
| B1.12 CSV | FR-05, TC-04 | Chưa triển khai | Chưa có kết quả | Preview/commit/export, lỗi từng dòng và chống công thức |

Các số test trên được kế thừa từ roadmap và tài liệu bàn giao; không phải kết quả chạy mới ngày lập báo cáo. Không cộng test tự động, HTTP hoặc kết quả các lần kiểm chứng khác nhau thành một con số toàn suite.

## 2. Triển khai theo bước

### B1.1 — Đăng ký và xác thực email

- API: POST `/api/v1/auth/register`, `/auth/verify-email`, `/auth/resend-verification`.
- Tạo tài khoản CHUA_XAC_THUC; mật khẩu BCrypt. Token xác thực ngẫu nhiên, chỉ lưu SHA-256, hết hạn 24 giờ và dùng một lần.
- Giới hạn tần suất đăng ký/gửi lại; lỗi token sai, hết hạn hoặc đã dùng được xử lý theo hợp đồng chung.
- Luồng: [đăng ký và xác thực email](../docs/luong-backend/B1.1-dang-ky-xac-thuc-email.md).

### B1.2 — Đăng nhập, phiên và đăng xuất

- API: POST `/api/v1/auth/login`, `/auth/logout`; GET `/api/v1/me`, `/auth/csrf`.
- SESSION lưu Redis; đăng nhập đổi session ID; đăng xuất hủy phiên. Request ghi cần CSRF.
- Sai thông tin: INVALID_CREDENTIALS; chưa xác minh: EMAIL_NOT_VERIFIED; bị khóa: ACCOUNT_LOCKED. Rate limit trả429.
- Luồng: [đăng nhập và phiên](../docs/luong-backend/B1.2-dang-nhap-dang-xuat-phien.md).

### B1.3 — Quên, đặt lại và đổi mật khẩu

- API: POST `/api/v1/auth/forgot-password`, `/auth/reset-password`; PUT `/api/v1/me/password`.
- Quên mật khẩu trả phản hồi chung để không lộ email; token đặt lại dùng một lần, hết hạn30 phút.
- Đặt lại hủy mọi phiên; đổi mật khẩu giữ phiên hiện tại, hủy phiên khác qua repository Redis indexed. Lỗi nghiệp vụ có fieldErrors theo trường.
- Luồng: [mật khẩu](../docs/luong-backend/B1.3-mat-khau.md).

### B1.4 — Đăng nhập Google

- Luồng: `/api/v1/auth/google/start` → `/auth/oauth2/google` → `/auth/google/callback` → frontend.
- Danh tính OAuth được định danh theo nhà cung cấp và subject; không tự liên kết email trùng. Người dùng cần chứng minh quyền sở hữu bằng đăng nhập mật khẩu.
- Google mới tạo tài khoản đã xác thực; lỗi chuyển về trang đăng nhập với mã lỗi.
- Luồng: [đăng nhập Google](../docs/luong-backend/B1.4-dang-nhap-google.md). Bằng chứng và giới hạn thử thật ghi tại mục1.

### B1.5 — Hồ sơ và thiết lập

- API: PATCH `/api/v1/me`; GET/PUT `/api/v1/me/learning-settings`, `/me/notification-settings`.
- Hồ sơ dùng múi giờ IANA. Thiết lập học lưu trình độ, mục tiêu, phút/ngày và từ mới/ngày; lần lưu đầu hoàn tất bước khởi đầu.
- Thiết lập ghi kèm version; version cũ trả409. Nhắc học có giờ hợp lệ; lỗi validation trả fieldErrors.
- Luồng: [hồ sơ và thiết lập](../docs/luong-backend/B1.5-ho-so-va-thiet-lap.md). Chủ đề yêu thích được triển khai tiếp ở B1.7.

### B1.6 — Tệp và ảnh đại diện

- API tệp: POST `/api/v1/files/upload-requests`, `/files/{id}/complete`; GET/DELETE `/files/{id}`. Avatar: PUT/GET/DELETE `/api/v1/me/avatar`.
- Luồng upload: xin URL ký → PUT bytes tới RustFS → complete. Kiểm kích thước, MIME thực và SHA-256; không nhận URL/path tùy ý từ client.
- Ảnh≤2MB, âm thanh≤5MB; kiểm định nội dung ảnh/âm thanh. Có dọn tệp pending/orphan, retry và bảo toàn object còn tham chiếu.
- CORS bucket dev đã được cấu hình cho browser. Gỡ avatar không đồng nghĩa xóa object tệp.
- Luồng và bằng chứng: [tệp và avatar](../docs/luong-backend/B1.6-tep-tin-anh-dai-dien.md).

### B1.7 — Chủ đề, nhãn và chủ đề yêu thích

- 11 API danh mục: public topics và CRUD admin topics/tags. Trình độ dùng enum hiện có, không có CRUD trình độ.
- Bổ sung chuDeIds vào GET/PUT thiết lập học: bắt buộc khi ghi, tối đa5, ID tồn tại và không trùng.
- Cập nhật danh mục dùng version; xóa danh mục còn tham chiếu trả409, không cascade.
- V4 tạo các bảng nội dung và liên kết; không sửa migration đã áp dụng. FR-13 ở bước này gồm phân quyền quản trị, không tuyên bố đã có audit log.
- Luồng: [danh mục và chủ đề yêu thích](../docs/luong-backend/B1.7-chu-de-nhan-chu-de-yeu-thich.md).

### B1.8 — Bộ thẻ cá nhân

| API | Quy tắc | Kết quả kiểm chứng |
|---|---|---|
| GET `/api/v1/decks` | Bộ của CurrentUser chưa xóa, page/size | 200 đã gọi thật |
| POST `/api/v1/decks` | Tạo cho CurrentUser, mặc định RIENG_TU | 201 + Location đã gọi thật |
| GET `/api/v1/decks/{id}` | Chỉ chủ sở hữu | 200 và404 đã gọi thật |
| PATCH `/api/v1/decks/{id}` | Chỉ chủ sở hữu, version trong body | 200/400/404/409 đã gọi thật |
| DELETE `/api/v1/decks/{id}` | Chỉ chủ sở hữu, query version | 404/409 đã gọi thật; thành công204 chưa kiểm chứng |
| PUT `/api/v1/decks/{id}/favorite` | Chủ sở hữu hoặc CONG_KHAI + BINH_THUONG | 204/404 đã gọi thật |
| DELETE `/api/v1/decks/{id}/favorite` | Gỡ liên kết của CurrentUser, idempotent | 204 đã gọi thật |

Thành phần chính: DeckController → DeckService → BoTheRepository/DeckFavoriteRepository → MySQL; BoThe dùng BaseEntity, Clock và @Version; DeckMapper tạo DeckResponse với ID dạng chuỗi.

- Quản lý bộ người khác luôn404, kể cả CONG_KHAI; đọc công khai thuộc B1.10, chưa có.
- PATCH giữ trường thiếu/null; moTa chuỗi rỗng xóa mô tả; boChuDe=true bỏ chủ đề, không được gửi đồng thời chuDeId. boChuDe dùng Boolean và chuẩn hóa giá trị thiếu để deserialize PATCH một phần.
- Chủ đề tùy chọn nhưng ID gửi lên phải dương, trong miền Long và tồn tại. Trình độ bắt buộc khi tạo; tên sau strip dài1–150, mô tả tối đa1000.
- GET danh sách chỉ hỗ trợ page/size, sắp xếp createdAt DESC rồi id DESC. Chưa có q/tab hoặc danh sách yêu thích gồm bộ của người khác.
- Thêm/gỡ yêu thích không tăng version bộ. Composite PK và INSERT ON DUPLICATE KEY bảo đảm không trùng liên kết theo schema/SQL; HTTP đã kiểm thao tác lặp, chưa đếm dòng trực tiếp.
- Theo code, DELETE chỉ đặt xoa_at và flush; giữ dòng bộ, thẻ, yêu thích và tham chiếu boNguonId. Chưa có kết quả HTTP thành công hoặc đối chiếu CSDL để chứng minh phần này.
- Dùng V4 hiện có; B1.8 không thêm/sửa migration. Lịch sử học thuộc bước sau, chưa có bằng chứng bảo toàn lịch sử.
- Luồng chi tiết: [B1.8 bộ thẻ cá nhân](../docs/luong-backend/B1.8-bo-the-ca-nhan.md).

## 3. Bằng chứng kiểm chứng

| Phạm vi | Bằng chứng | Giới hạn |
|---|---|---|
| B1.1–B1.5 | Số test và thử HTTP theo roadmap/báo cáo FE trước | Không chạy lại để lập báo cáo này |
| B1.6, 02/10/2026 | FR03FilesTest12, FR03MediaTest7, FR03CleanupTest3; hồi quy13;35 pass ở lần đó | Không xem là toàn suite ở trạng thái mã nguồn hiện tại |
| B1.7, 03/10/2026 | FR03CatalogTest10/10;62 lượt HTTP đạt kỳ vọng | Chưa thử hai transaction đồng thời và đầy đủ các loại tham chiếu |
| B1.8 6a, 04/10/2026 | 8/8 HTTP: tạo/đọc/list, PATCH đổi tên, version cũ PATCH/DELETE, thiếu version, đọc lại | DELETE thành công không nằm trong8 lượt |
| B1.8 6b, 04/10/2026 | 26/26 HTTP: hai tài khoản, quyền riêng tư/công khai, yêu thích lặp, chuyển về riêng tư | Không bao gồm DA_AN hoặc đối chiếu số dòng DB |
| FR03DeckTest | Source có11 lượt dự kiến, gồm tham số hóa quyền truy cập | Chưa có kết quả chạy được xác nhận; không ghi11/11 pass |
| B1.8 6c | Bị429 lúc đăng ký, chưa tạo fixture; sau đó người dùng yêu cầu bỏ qua phần6 còn lại | Chưa xóa mềm bộ qua HTTP hoặc đối chiếu thẻ/bộ nguồn |

HTTP B1.8 chạy trên localhost:8080 bằng tài khoản kiểm thử riêng, cookie và CSRF thật. Chuẩn bị đăng nhập/xác minh và các lần404 do bản Docker cũ thiếu DeckController không được tính vào34 lượt đạt kỳ vọng. Bộ thử1 và2 được giữ lại, chưa xóa trong luồng đã kiểm chứng.

Test FR03DeckTest đã có trường hợp DA_AN, validation mở rộng và hai transaction cùng đọc một version; đây là phạm vi test source, không phải bằng chứng các trường hợp đã pass.

## 4. Tài liệu và bàn giao

| Tài liệu | Vai trò / trạng thái |
|---|---|
| [Roadmap BE](../roadmap/ROADMAP_BE.md) | B1.1–B1.7 đánh dấu xong; B1.8 còn kiểm chứng; B1.9–B1.12 chưa làm |
| [Báo cáo FE Đợt1](DOT1_BAO_CAO_FE.md) | Hợp đồng DTO/API, mục5.32–5.38 cho B1.8 và giới hạn tại mục10 |
| [Mục lục luồng backend](../docs/luong-backend/README.md) | Luồng B0/B1, liên kết đến B1.8 |
| Postman VocabLearning API | B1.8 đã đồng bộ12 request:7 API và5 ca lỗi; đã xác nhận trong thư mục02 Nội dung |
| Biến Postman B1.8 | deckVersion, deckOldVersion, foreignDeckId đã thêm và kiểm tra trong cả environment local và qua Next.js |

Tại thời điểm lập báo cáo, file registry `postman/postman.json` không có trong workspace; việc đồng bộ cloud kể trên là kết quả đã thực hiện và kiểm tra trước đó. Không tạo lại registry hoặc đồng bộ lại chỉ để viết báo cáo. Request Postman có script kiểm tra không đồng nghĩa script đã chạy pass.

Mockup bộ cá nhân còn lệch hợp đồng: tên trường tiếng Anh, q/tab, goal/cardCount, maxlength tên160 và DELETE thiếu query version. Các điểm cần sửa đã ghi trong báo cáo FE mục10; chưa sửa mockup trong lần lập báo cáo này.

## 5. Việc còn lại

1. Trước khi đóng B1.8: xác nhận kết quả FR03DeckTest và kiểm chứng xóa mềm thành công/bảo toàn thẻ, yêu thích, bộ nguồn khi người dùng cho thực hiện lại phần đã bỏ qua.
2. Xác nhận các nhánh DA_AN, validation mở rộng và optimistic locking đồng thời từ lần chạy test thực tế; không tự đánh dấu đạt.
3. B1.9: CRUD thẻ, kiểm quyền bộ cha, nhãn và tệp; cảnh báo trùng theo từ/từ loại chuẩn hóa.
4. B1.10–B1.12: thư viện, sao chép idempotent và CSV theo roadmap, chưa đưa các API dự kiến thành API khả dụng.

Không thực hiện build/test/HTTP mới, không sửa code/migration, không stage/commit/push trong lần viết báo cáo này. Giữ B1.8 chưa đánh dấu hoàn tất.
