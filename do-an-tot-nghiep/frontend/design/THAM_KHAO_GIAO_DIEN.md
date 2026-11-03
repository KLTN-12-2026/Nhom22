# Tham khảo và áp dụng giao diện học tiếng Anh

Ngày đối chiếu: 12/10/2026. Hướng đã được người dùng chốt: giữ phiếu học, màu indigo, ảnh nhỏ đúng tiêu đề/chủ đề; tiết chế màu sắc và chuyển động. Đây là chọn lọc của dự án, không phải bảng xếp hạng chất lượng các sản phẩm.

## Nguồn và quyết định

Đã mở trang công khai và xem giao diện trên trình duyệt của cả 8 nguồn dưới đây. Không đăng ký tài khoản, không khảo sát toàn bộ luồng sau đăng nhập. Trang ELSA có hộp thoại cookie che phần nội dung; nguồn này chỉ dùng để đối chiếu tài liệu sản phẩm công khai, không suy đoán animation trong ứng dụng.

| Nguồn chính thức | Chi tiết tham khảo | Áp dụng trong VocabLearning |
| --- | --- | --- |
| [Duolingo](https://www.duolingo.com/) | Phân biệt rõ hành động chính và phụ | Nút học nổi bật; nút phụ nhẹ; phản hồi nhấn ngắn |
| [Duolingo: core tabs](https://blog.duolingo.com/core-tabs-redesign/) | Hệ thống chữ, vị trí tiêu đề và khoảng cách nhất quán; ảnh phải có mục đích | Nhãn dễ đọc hơn, thư viện dùng khoảng trắng và đường kẻ sẵn có; giữ ảnh nhỏ |
| [Duolingo: animation](https://blog.duolingo.com/streak-milestone-design-animation/) | Chuyển động gắn với sự kiện và thời điểm phản hồi | Hiện nghĩa và xác nhận đáp án trong 200ms; không thêm mascot hay màn ăn mừng |
| [Busuu](https://www.busuu.com/) | Bài học ngắn, mục tiêu rõ; màn học có ít việc cạnh tranh | Từ và câu hỏi đứng trước; nghĩa ẩn đến khi lật; bốn mức đánh giá bằng nhau |
| [Memrise English](https://www.memrise.com/learn-english) | Hình ảnh gắn với ngữ cảnh thực tế | Ảnh thư viện theo tiêu đề/chủ đề; Giao tiếp và TOEIC 96×72 desktop, 80×60 mobile; ảnh khác 64×48 và 56×42 |
| [Babbel](https://www.babbel.com/) | Thứ bậc chữ bình tĩnh, khoảng cách nhóm nội dung rõ | Giảm độ nặng và độ nén của tiêu đề trang chủ; giữ Archivo và Gentium |
| [Quizlet](https://quizlet.com/) | Tìm học liệu dễ thấy; phân biệt nội dung học và công cụ | Giữ tìm kiếm thư viện; thống nhất icon bộ thẻ, thư viện, bàn phím và âm thanh |
| [Readlang](https://readlang.com/) | Nội dung đọc và từ vựng là trung tâm | Từ tiếng Anh dùng Gentium; icon hỗ trợ ở kích thước nhỏ, không trở thành đồ trang trí |
| [British Council LearnEnglish](https://learnenglish.britishcouncil.org/) | Tài nguyên được tổ chức theo nhu cầu học | Giữ bộ lọc chủ đề, mục tiêu, trình độ; không thay bằng lưới thẻ marketing |
| [ELSA](https://elsaspeak.com/en/new-homepage/) | Phản hồi cụ thể gắn với việc luyện tập | Đáp án đúng/sai có nền và lời giải rõ; không thêm số điểm hay chức năng phát âm chưa có |

## Thay đổi đã áp dụng

- Trang chủ: bỏ padding section gắn nhầm lên h1; tiêu đề giảm từ tối đa 4.5rem xuống 3.75rem, cân lại độ rộng và khoảng cách. Giữ nội dung, phiếu lựa chọn và câu hỏi mẫu.
- Quiz: chỉ đánh dấu đáp án đúng và đáp án người học chọn sai; các đáp án còn lại giữ trung tính. Lời giải được thông báo qua `role="status"`; đổi câu có phản hồi nhẹ.
- UI chung: một bộ SVG 24×24, nét 1.75; icon thư viện, lịch học, bộ lọc được chỉnh; bổ sung icon có trong mockup nhưng thiếu ở frontend. Nút đóng modal dùng SVG. Nút đang tải chỉ có một spinner.
- Thư viện/bộ thẻ: tăng nhịp hàng, làm chữ và ảnh cân nhau; nền hover phẳng; giữ hàng đánh số, đường kẻ và ảnh nhỏ.
- Theo yêu cầu cuối của người dùng: sidebar desktop mặc định mở ở 248px, hiện đầy đủ icon và tên mục; bỏ nút “Điều hướng” và cơ chế thu gọn/bung khi hover. Giữ bảng màu VocabLearning và bottom nav trên mobile.
- Học thẻ: frontend dùng cùng cấu trúc `session`, `sheet flash`, `face`, `back`, `rates` với mockup. Hiện nghĩa trong 200ms; thanh tiến độ dùng scaleX sau phản hồi máy chủ. Phím Space và 1–4 hoạt động ngoài trường nhập liệu.
- Chuyển động: chỉ phản hồi thao tác; skeleton dùng opacity; modal 200ms; không thêm hiệu ứng rê chuột nổi thẻ, scroll reveal hay animation ảnh. Reduced motion bỏ dịch chuyển và loop.

## Đồng bộ

- `frontend/src/styles/learning-refinements.css` là nguồn CSS dùng chung; bản HTML nằm ở `mockups/shared/learning-refinements.css`.
- `frontend/src/components/ui/Icon.js` là nguồn hình học SVG; `scripts/sync-ui.mjs` đồng bộ bảng ICONS của mockups.
- Chạy `npm run ui:sync` khi chỉnh CSS/icon, `npm run ui:check` để phát hiện lệch. Tất cả mockup đang dùng `shared/components.css` đã được nối stylesheet mới.
- Token kích thước chữ, icon, ảnh Giao tiếp/TOEIC và thời gian chờ có trong cả hai bộ tokens. Ảnh được giữ nguyên, chỉ tăng kích thước hiển thị cho hai nhóm người dùng yêu cầu.

## Giới hạn kiểm chứng

Build production thành công; 26/26 test qua; eslint trên các file sửa không có lỗi (còn cảnh báo logo SVG dùng img sẵn có). `ui:check` kiểm tra CSS, bảng icon, token và stylesheet của 36 mockup. Thư viện đã kiểm tra ở desktop, 390px và 360px; không tràn ngang. Quiz đã kiểm tra chọn sai, hiển thị đáp án đúng và chuyển câu.

`FeatureGate` đang khóa luồng học theo giai đoạn phát triển; giữ nguyên khóa này. Phiên học thật chưa được kiểm tra với API; không tạo hoặc thay đổi dữ liệu học của người dùng để kiểm tra thiết kế. Đã kiểm chứng mockup bằng tài khoản dùng thử: Space hiện nghĩa, từ tiếng Anh dài 20 ký tự, nghĩa tiếng Việt nhiều dòng, bốn nút đánh giá cùng kích thước, hiệu ứng hiện nghĩa 200ms và không tràn ngang ở 390px.
