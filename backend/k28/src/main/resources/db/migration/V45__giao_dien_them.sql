INSERT INTO giao_dien (ma, ten, mo_ta, nhom, goi_toi_thieu, co_am_thanh, thu_tu, created_at, updated_at)
VALUES ('MUA_THU', 'Mùa thu lá vàng', 'Lá vàng lá đỏ rơi, bấm vào đống lá để nghe xào xạc.', 'PHONG_CANH', 'PRO', TRUE, 65, NOW(3), NOW(3)),
       ('HOA_ANH_DAO', 'Hoa anh đào', 'Cánh hoa hồng bay, chú chim nhỏ hót khi bạn bấm vào.', 'PHONG_CANH', 'PRO', TRUE, 66, NOW(3), NOW(3)),
       ('CHO_CORGI', 'Cún Corgi', 'Corgi chạy đuổi bóng dưới chân trang, bấm vào là sủa gâu gâu.', 'DONG_VAT', 'PRO', TRUE, 85, NOW(3), NOW(3)),
       ('GAU_TRUC', 'Gấu trúc ham ăn', 'Gấu trúc gặm tre, rê chuột là đỏ mặt, bấm vào là lăn một vòng.', 'DONG_VAT', 'PREMIUM', TRUE, 105, NOW(3), NOW(3)),
       ('KHUNG_LONG', 'Khủng long tay ngắn', 'Khủng long đi dạo, bấm vào gầm một tiếng (nhỏ thôi).', 'DONG_VAT', 'PREMIUM', TRUE, 106, NOW(3), NOW(3)),
       ('ROBOT', 'Robot tí hon', 'Robot bíp bốp nhảy múa, Mực đội ăng-ten phát sáng.', 'NHAN_VAT', 'PREMIUM', TRUE, 165, NOW(3), NOW(3)),
       ('THIEU_NHI', 'Quốc tế Thiếu nhi 1/6', 'Bóng bay bay lên, bấm để nổ bóng, Mực đội mũ sinh nhật.', 'LE_HOI', 'PREMIUM', TRUE, 205, NOW(3), NOW(3)),
       ('PHU_NU', 'Ngày Phụ nữ 8/3 và 20/10', 'Hoa hồng và cánh hoa bay, lời chúc dành cho phái đẹp.', 'LE_HOI', 'PREMIUM', TRUE, 206, NOW(3), NOW(3));

INSERT INTO lich_le_giao_dien (giao_dien_ma, ngay_le, so_ngay_truoc, so_ngay_sau, created_at, updated_at)
VALUES ('THIEU_NHI', '2027-06-01', 10, 3, NOW(3), NOW(3)),
       ('THIEU_NHI', '2028-06-01', 10, 3, NOW(3), NOW(3)),
       ('PHU_NU', '2027-03-08', 10, 3, NOW(3), NOW(3)),
       ('PHU_NU', '2027-10-20', 10, 3, NOW(3), NOW(3)),
       ('PHU_NU', '2028-03-08', 10, 3, NOW(3), NOW(3)),
       ('PHU_NU', '2028-10-20', 10, 3, NOW(3), NOW(3));
