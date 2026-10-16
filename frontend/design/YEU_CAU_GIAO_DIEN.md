# Yêu cầu giao diện VocabLearning

Giao diện hiện hành là phiếu học từ vựng trên giấy: nền giấy ngà, bàn xám nhẹ,
màu indigo, nét graphite và dấu lề trái. Dùng linh vật Mực làm logo SVG, Archivo cho giao diện,
Gentium Book Plus cho từ tiếng Anh và IPA; góc nút 8px, đường kẻ rõ ràng.
Ảnh minh họa bộ thẻ đã có trước phiên chỉnh sửa được giữ nguyên.

Màu nút theo vai trò: indigo cho hành động chính, trung tính cho hành động phụ,
vàng cho bắt đầu học, xanh dương cho sửa, teal cho nghe và ảnh, đỏ hồng cho trái tim yêu thích, đỏ rượu cho thao tác nguy hiểm.
Có giao diện sáng và tối; giữ nền giấy và bố cục cũ, linh vật Mực tương tác theo trạng thái tác vụ. Giao diện tối dùng nền than trung tính, chữ sáng dịu, đường viền trầm; màu nút đủ đậm. Dùng token riêng cho nền nút và màu chữ để tránh chữ trắng trên nền nhạt.

Căn các nút cùng chiều cao và đủ khoảng cách; hành động bộ thẻ nằm sát phải.
Phân trang dùng ô 44px, biểu tượng và số chung một đường căn giữa.
Bố cục phụ chuyển xuống dưới khi thiếu chỗ; kiểm tra nhãn dài và màn hình 360px.
Linh vật SVG có nghỉ, chớp mắt, đập tay, chờ, thành công, khích lệ khi lỗi và nghe giọng đọc. Phản hồi nối với thao tác thực; không giả đồng bộ âm vị hoặc dùng logo Duolingo. Có thu gọn và không che hộp thoại. Chuyển động hỗ trợ trạng thái bấm, lật thẻ và phản hồi; tôn trọng reduced-motion.

Nguồn CSS chuẩn: frontend/src/styles/mockup-tokens.css, mockup-base.css,
mockup-components.css, deck-illustrations.css và learning-refinements.css.
Chạy npm run ui:sync và npm run ui:check để đồng bộ mockup.
Giữ API thật, pending, validation, bàn phím và hai chiều học Anh–Việt/Việt–Anh.

Thiết lập học có chọn vùng giọng Anh-Mỹ/Anh-Anh/Anh-Úc/Anh-Canada hoặc tất cả, giọng tiếng Anh của thiết bị, tốc độ và nghe thử; tự động ưu tiên giọng có tên Natural/Neural nếu có, không cam kết chất lượng theo tên. Lưu localStorage riêng với kế hoạch học trên máy chủ. Hai nút đọc mang nhãn “Đọc từ” / “Đọc câu ví dụ”. Tên linh vật đổi trong bảng tương tác, tối đa 24 ký tự, lưu trên trình duyệt. Nút giao diện cho chọn Sáng / Tối / Theo thiết bị; hỗ trợ bàn phím, Escape và reduced-motion.

Đợt chỉnh sâu 13/10/2026: nền sáng giấy ấm, nền tối xám than, đường kẻ trung tính thay vì khung xanh dày; nhãn không ép hẹp. Hôm nay đặt chọn phiên trước thống kê, lỗi có hành động phục hồi. Menu di động đủ các mục và đăng xuất; khu quản trị có điều hướng riêng. Giữ dấu lề trái, linh vật, giọng đọc và tất cả luồng có dữ liệu thật.
