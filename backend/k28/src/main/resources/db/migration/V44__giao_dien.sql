CREATE TABLE giao_dien
(
    ma            VARCHAR(40)  NOT NULL,
    ten           VARCHAR(80)  NOT NULL,
    mo_ta         VARCHAR(255) NOT NULL,
    nhom          VARCHAR(20)  NOT NULL,
    goi_toi_thieu VARCHAR(20)  NOT NULL,
    co_am_thanh   BOOLEAN      NOT NULL DEFAULT FALSE,
    thu_tu        INT          NOT NULL,
    created_at    DATETIME(3)  NOT NULL,
    updated_at    DATETIME(3)  NOT NULL,
    CONSTRAINT pk_giao_dien PRIMARY KEY (ma),
    CONSTRAINT ck_gd_nhom CHECK (nhom IN ('CO_BAN', 'PHONG_CANH', 'DONG_VAT', 'DIEN_ANH', 'NHAN_VAT', 'LE_HOI')),
    CONSTRAINT ck_gd_goi CHECK (goi_toi_thieu IN ('FREE', 'PRO', 'PREMIUM'))
);

CREATE TABLE lich_le_giao_dien
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    giao_dien_ma  VARCHAR(40) NOT NULL,
    ngay_le       DATE        NOT NULL,
    so_ngay_truoc INT         NOT NULL DEFAULT 10,
    so_ngay_sau   INT         NOT NULL DEFAULT 3,
    created_at    DATETIME(3) NOT NULL,
    updated_at    DATETIME(3) NOT NULL,
    CONSTRAINT pk_lich_le_giao_dien PRIMARY KEY (id),
    CONSTRAINT uk_llgd_ngay UNIQUE (giao_dien_ma, ngay_le),
    CONSTRAINT ck_llgd_truoc CHECK (so_ngay_truoc BETWEEN 0 AND 60),
    CONSTRAINT ck_llgd_sau CHECK (so_ngay_sau BETWEEN 0 AND 30),
    CONSTRAINT fk_llgd_giao_dien FOREIGN KEY (giao_dien_ma) REFERENCES giao_dien (ma)
);

CREATE INDEX idx_llgd_ngay ON lich_le_giao_dien (ngay_le);

ALTER TABLE ho_so_hoc_tap
    ADD COLUMN giao_dien_ma VARCHAR(40) NULL,
    ADD CONSTRAINT fk_hsht_giao_dien FOREIGN KEY (giao_dien_ma) REFERENCES giao_dien (ma);

INSERT INTO giao_dien (ma, ten, mo_ta, nhom, goi_toi_thieu, co_am_thanh, thu_tu, created_at, updated_at)
VALUES ('MAC_DINH', 'Giấy thi', 'Nền giấy kẻ quen thuộc, gọn và dễ đọc.', 'CO_BAN', 'FREE', FALSE, 10, NOW(3), NOW(3)),
       ('BANG_XANH', 'Bảng xanh lớp học', 'Bảng phấn xanh, chữ phấn trắng và vệt phấn mờ.', 'CO_BAN', 'FREE', FALSE, 20, NOW(3), NOW(3)),
       ('RUNG_THONG', 'Rừng thông sương sớm', 'Đồi thông xanh, sương trôi chậm ngang trang.', 'PHONG_CANH', 'PRO', FALSE, 30, NOW(3), NOW(3)),
       ('BIEN_CHIEU', 'Biển chiều', 'Hoàng hôn cam tím, sóng vỗ nhẹ dưới chân trang.', 'PHONG_CANH', 'PRO', FALSE, 40, NOW(3), NOW(3)),
       ('RUONG_BAC_THANG', 'Ruộng bậc thang', 'Ruộng lúa vàng Tây Bắc, mây bay qua đỉnh núi.', 'PHONG_CANH', 'PRO', FALSE, 50, NOW(3), NOW(3)),
       ('PHO_HOI', 'Phố cổ Hội An', 'Tường vàng, đèn lồng đung đưa trên đầu trang.', 'PHONG_CANH', 'PRO', FALSE, 60, NOW(3), NOW(3)),
       ('MEO_LUOI', 'Mèo lười', 'Chú mèo ngủ trên thanh tiêu đề, vẫy đuôi khi bạn trả lời đúng.', 'DONG_VAT', 'PRO', TRUE, 70, NOW(3), NOW(3)),
       ('CANH_CUT', 'Cánh cụt trượt băng', 'Băng tuyết xanh, cánh cụt trượt ngang khi bạn hoàn thành bài.', 'DONG_VAT', 'PRO', TRUE, 80, NOW(3), NOW(3)),
       ('NHEN_DU_TO', 'Nhện đu tơ', 'Mạng nhện ở góc trang, nhện thả tơ đung đưa và nhảy lên khi bạn trả lời đúng.', 'DONG_VAT', 'PREMIUM', TRUE, 90, NOW(3), NOW(3)),
       ('RONG', 'Rồng phương Đông', 'Rồng vàng uốn lượn trên nền son, mây ngũ sắc trôi chậm.', 'DONG_VAT', 'PREMIUM', TRUE, 100, NOW(3), NOW(3)),
       ('DAI_DUONG', 'Đại dương sâu', 'Biển sâu xanh thẳm, bong bóng nổi và cá voi bơi ngang.', 'PHONG_CANH', 'PREMIUM', TRUE, 110, NOW(3), NOW(3)),
       ('RAP_CHIEU', 'Rạp chiếu cũ', 'Hạt phim, vệt sáng máy chiếu và tiếng clapper khi bắt đầu.', 'DIEN_ANH', 'PREMIUM', TRUE, 120, NOW(3), NOW(3)),
       ('THAM_TU', 'Thám tử đen trắng', 'Phim noir đen trắng, mưa ngoài cửa sổ và ánh đèn đường.', 'DIEN_ANH', 'PREMIUM', TRUE, 130, NOW(3), NOW(3)),
       ('PIXEL', 'Pixel 8-bit', 'Thế giới game cổ điển, mây pixel và tiếng bíp 8-bit.', 'DIEN_ANH', 'PREMIUM', TRUE, 140, NOW(3), NOW(3)),
       ('MUC_NINJA', 'Mực ninja', 'Mực khoác áo ninja giữa rừng tre, phi tiêu bay khi bạn trả lời đúng.', 'NHAN_VAT', 'PREMIUM', TRUE, 150, NOW(3), NOW(3)),
       ('MUC_PHI_HANH_GIA', 'Mực phi hành gia', 'Mực đội mũ phi hành gia giữa trời sao, tên lửa phóng khi lên chuỗi.', 'NHAN_VAT', 'PREMIUM', TRUE, 160, NOW(3), NOW(3)),
       ('TET', 'Tết Nguyên Đán', 'Hoa mai, hoa đào rơi, câu đối đỏ và bao lì xì.', 'LE_HOI', 'PREMIUM', TRUE, 170, NOW(3), NOW(3)),
       ('VALENTINE', 'Valentine', 'Trái tim bay lên, nền hồng phấn ngọt ngào.', 'LE_HOI', 'PREMIUM', TRUE, 180, NOW(3), NOW(3)),
       ('TRUNG_THU', 'Trung Thu', 'Trăng tròn, đèn ông sao và thỏ ngọc.', 'LE_HOI', 'PREMIUM', TRUE, 190, NOW(3), NOW(3)),
       ('NHA_GIAO', 'Ngày Nhà giáo 20/11', 'Hoa tươi, phấn bảng và lời tri ân thầy cô.', 'LE_HOI', 'PREMIUM', TRUE, 200, NOW(3), NOW(3)),
       ('HALLOWEEN', 'Halloween', 'Bí ngô phát sáng, dơi bay và nhện đêm.', 'LE_HOI', 'PREMIUM', TRUE, 210, NOW(3), NOW(3)),
       ('NOEL', 'Giáng sinh', 'Tuyết rơi, dây đèn nhấp nháy và Mực đội mũ Noel.', 'LE_HOI', 'PREMIUM', TRUE, 220, NOW(3), NOW(3));

INSERT INTO lich_le_giao_dien (giao_dien_ma, ngay_le, so_ngay_truoc, so_ngay_sau, created_at, updated_at)
VALUES ('TET', '2026-02-17', 10, 3, NOW(3), NOW(3)),
       ('TET', '2027-02-06', 10, 3, NOW(3), NOW(3)),
       ('TET', '2028-01-26', 10, 3, NOW(3), NOW(3)),
       ('VALENTINE', '2026-02-14', 10, 3, NOW(3), NOW(3)),
       ('VALENTINE', '2027-02-14', 10, 3, NOW(3), NOW(3)),
       ('VALENTINE', '2028-02-14', 10, 3, NOW(3), NOW(3)),
       ('TRUNG_THU', '2026-09-25', 10, 3, NOW(3), NOW(3)),
       ('TRUNG_THU', '2027-09-15', 10, 3, NOW(3), NOW(3)),
       ('TRUNG_THU', '2028-10-03', 10, 3, NOW(3), NOW(3)),
       ('NHA_GIAO', '2026-11-20', 10, 3, NOW(3), NOW(3)),
       ('NHA_GIAO', '2027-11-20', 10, 3, NOW(3), NOW(3)),
       ('NHA_GIAO', '2028-11-20', 10, 3, NOW(3), NOW(3)),
       ('HALLOWEEN', '2026-10-31', 10, 3, NOW(3), NOW(3)),
       ('HALLOWEEN', '2027-10-31', 10, 3, NOW(3), NOW(3)),
       ('HALLOWEEN', '2028-10-31', 10, 3, NOW(3), NOW(3)),
       ('NOEL', '2026-12-25', 10, 3, NOW(3), NOW(3)),
       ('NOEL', '2027-12-25', 10, 3, NOW(3), NOW(3)),
       ('NOEL', '2028-12-25', 10, 3, NOW(3), NOW(3));
