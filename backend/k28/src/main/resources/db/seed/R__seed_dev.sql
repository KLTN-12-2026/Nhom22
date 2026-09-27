SET @pw = '$2b$10$U55bodQ/vyIqV8rqVNz.WuPkr2DcNqsgUAhHB4pfZgvHm9hMKBhmy';
SET @now = UTC_TIMESTAMP(3);

INSERT INTO nguoi_dung (email, password_hash, ten_hien_thi, trang_thai, email_xac_thuc_at)
VALUES ('admin@vocab.local', @pw, 'Quản trị viên', 'HOAT_DONG', @now),
       ('an@vocab.local',    @pw, 'Nguyễn Văn An', 'HOAT_DONG', @now),
       ('binh@vocab.local',  @pw, 'Trần Thị Bình', 'HOAT_DONG', @now),
       ('chi@vocab.local',   @pw, 'Lê Minh Chi',   'HOAT_DONG', @now)
ON DUPLICATE KEY UPDATE email = email;

INSERT IGNORE INTO nguoi_dung_vai_tro (nguoi_dung_id, vai_tro_id)
SELECT u.id, r.id FROM nguoi_dung u JOIN vai_tro r ON r.ma = 'USER'
WHERE u.email LIKE '%@vocab.local';

INSERT IGNORE INTO nguoi_dung_vai_tro (nguoi_dung_id, vai_tro_id)
SELECT u.id, r.id FROM nguoi_dung u JOIN vai_tro r ON r.ma = 'ADMIN'
WHERE u.email = 'admin@vocab.local';

INSERT IGNORE INTO ho_so_hoc_tap (nguoi_dung_id, trinh_do, muc_tieu, phut_moi_ngay, tu_moi_moi_ngay, da_hoan_tat_khoi_dau)
SELECT id,
       CASE email WHEN 'an@vocab.local' THEN 'CO_BAN' WHEN 'binh@vocab.local' THEN 'TRUNG_CAP' ELSE 'NANG_CAO' END,
       CASE email WHEN 'binh@vocab.local' THEN 'TOEIC' ELSE 'GIAO_TIEP' END,
       CASE email WHEN 'chi@vocab.local' THEN 20 ELSE 10 END,
       10, TRUE
FROM nguoi_dung WHERE email LIKE '%@vocab.local';

INSERT IGNORE INTO cai_dat_thong_bao (nguoi_dung_id, gio_nhac)
SELECT id, '20:00:00' FROM nguoi_dung WHERE email LIKE '%@vocab.local';
