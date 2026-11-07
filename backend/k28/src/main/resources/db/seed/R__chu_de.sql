INSERT INTO chu_de (ten, mo_ta)
VALUES ('Văn phòng & công sở', 'Công việc văn phòng, email, cuộc họp, thiết bị và quy trình nội bộ.'),
       ('Tài chính & kế toán', 'Ngân hàng, ngân sách, hóa đơn, thuế, báo cáo tài chính và đầu tư.'),
       ('Du lịch & sân bay', 'Đặt vé, làm thủ tục, hành lý, khách sạn, tham quan và đi lại khi du lịch.'),
       ('Nhà hàng & khách sạn', 'Đặt bàn, gọi món, phục vụ, đặt phòng và dịch vụ lưu trú.'),
       ('Mua sắm & dịch vụ', 'Cửa hàng, giá cả, thanh toán, đổi trả, bảo hành và chăm sóc khách hàng.'),
       ('Tuyển dụng & phỏng vấn', 'Tin tuyển dụng, hồ sơ xin việc, phỏng vấn, lương thưởng và nhân sự.'),
       ('Giao tiếp hằng ngày', 'Chào hỏi, làm quen, hỏi đường, mời mọc và các tình huống đời thường.'),
       ('Hợp đồng & pháp lý', 'Điều khoản hợp đồng, đàm phán, quy định, tuân thủ và trách nhiệm pháp lý.'),
       ('Marketing & bán hàng', 'Quảng cáo, khuyến mãi, nghiên cứu thị trường, khách hàng và doanh số.'),
       ('Sản xuất & kho vận', 'Nhà máy, dây chuyền, kiểm soát chất lượng, kho hàng, vận chuyển và giao nhận.'),
       ('Công nghệ & máy tính', 'Phần mềm, phần cứng, mạng, sự cố kỹ thuật và hỗ trợ CNTT.'),
       ('Sức khỏe & y tế', 'Khám bệnh, triệu chứng, thuốc men, bảo hiểm y tế và lối sống lành mạnh.'),
       ('Giáo dục & học tập', 'Trường lớp, khóa học, thi cử, đào tạo và phát triển kỹ năng.'),
       ('Nhà ở & bất động sản', 'Thuê nhà, mua bán nhà, sửa chữa, tiện ích và quản lý tòa nhà.'),
       ('Giải trí & sự kiện', 'Phim ảnh, âm nhạc, thể thao, triển lãm, hội nghị và tổ chức sự kiện.'),
       ('Giao thông & đi lại', 'Phương tiện công cộng, lái xe, lịch trình, tắc đường và chỉ đường.'),
       ('Gia đình & đời sống', 'Thành viên gia đình, nhà cửa, việc nhà, thói quen và sinh hoạt hằng ngày.'),
       ('Môi trường & thời tiết', 'Thời tiết, khí hậu, thiên nhiên, ô nhiễm và bảo vệ môi trường.')
AS v
ON DUPLICATE KEY UPDATE mo_ta = v.mo_ta;
